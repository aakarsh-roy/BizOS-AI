"""
BizOS AI — Unified Chatbot Orchestration
Single conversational service: builds the system prompt from the chatbot's
configuration, runs one tool-calling loop, and streams or returns the answer.
"""

import json
import asyncio
from typing import Optional

from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage, ToolMessage

from app.config import get_settings
from app.services.tools import execute_tool, get_tool_definitions
from app.rag.retriever import (
    retrieve_relevant_chunks,
    format_context,
    extract_sources,
)

settings = get_settings()

# Retrieval parameters shared with the search_knowledge_base tool so
# pre-retrieval and tool-driven search behave identically.
RETRIEVAL_TOP_K = 8
RETRIEVAL_MIN_SCORE = 0.5

# Shared LLM instance
_llm = None


def get_llm() -> ChatGroq:
    global _llm
    if _llm is None:
        _llm = ChatGroq(
            model=settings.GROQ_MODEL,
            api_key=settings.GROQ_API_KEY,
            temperature=0.7,
            max_tokens=1024,
        )
    return _llm


TONE_INSTRUCTIONS = {
    "friendly": "Warm, approachable, and conversational. Be helpful and personable.",
    "professional": "Professional, confident, and precise. Polished business communication.",
    "concise": "Brief and to the point. Short answers, no filler.",
}

DEFAULT_NAME = "AI Assistant"


def build_system_prompt(config: Optional[dict], tool_names: list[str]) -> str:
    """Build the system prompt from chatbot configuration and available tools."""
    config = config or {}
    name = config.get("name") or DEFAULT_NAME
    tone = config.get("tone", "friendly")
    instructions = (config.get("system_instructions") or "").strip()
    actions = config.get("enabled_actions") or {}

    prompt = f"You are {name}, a helpful AI assistant answering questions for this business.\n"

    tone_text = TONE_INSTRUCTIONS.get(tone, TONE_INSTRUCTIONS["friendly"])
    prompt += f"\n## Tone\n{tone_text}\n"

    if instructions:
        prompt += f"\n## Business Instructions\n{instructions}\n"

    # Tool usage guidance based on the actual bound tools
    if tool_names:
        prompt += (
            "\n## Tools & Actions\n"
            "You have access to tools that let you take REAL actions — "
            "searching the knowledge base, creating support tickets, saving leads. "
            "When a tool is the right way to handle a request, USE it. "
            "Don't just describe what you would do — execute it, then summarize the result.\n"
            "You can call multiple tools in sequence if needed.\n"
        )
        if "search_knowledge_base" in tool_names:
            prompt += (
                "- Relevant knowledge may already be provided under Additional context — "
                "use it first and cite its sources. Search the knowledge base BEFORE "
                "claiming information is unavailable, and call it again if you need "
                "more than what was provided. Answer from retrieved knowledge and cite sources when provided.\n"
            )
        if "create_ticket" in tool_names:
            prompt += (
                "- Create a support ticket ONLY AFTER gathering the necessary details "
                "(issue summary, steps to reproduce, device/browser info where relevant). "
                "Ask one question at a time. Confirm the ticket reference to the visitor.\n"
            )
        if "create_lead" in tool_names and actions.get("lead_capture", True):
            prompt += (
                "- Answer product/pricing questions FIRST. Then, if buying intent is clear, "
                "casually ask for contact details one at a time — never like a form. "
                "Save the lead once you have a name and email.\n"
            )
        if "list_tickets" in tool_names or "update_ticket" in tool_names:
            prompt += (
                "- You can look up and update this business's existing tickets when asked.\n"
            )
        if "list_leads" in tool_names:
            prompt += "- You can look up existing leads to avoid duplicates.\n"
        if "list_documents" in tool_names:
            prompt += "- You can list uploaded knowledge-base documents when asked.\n"

    prompt += (
        "\n## Core Directives (CRITICAL)\n"
        "1. **Grounded answers**: Base answers on the knowledge base. If information is "
        "missing, say so honestly instead of guessing.\n"
        "2. **No hallucination**: NEVER invent pricing, policies, features, or contact info.\n"
        "3. **No internal monologue**: Do NOT output internal reasoning or thoughts "
        "(e.g. 'Okay, let me check...'). Your output goes straight to the user — "
        "output only the final response.\n"
        "4. **Security**: NEVER expose internal data, file names, processes, or credentials.\n"
        "5. **Professional & human**: Be helpful, confident, friendly, and concise. "
        "Avoid robotic or generic AI phrasing.\n"
    )

    prompt += (
        "\n## Response Format\n"
        "Present structured information (fees, schedules, lists, comparisons) as short "
        "bullet points or plain sentences — NOT as markdown tables.\n"
        "Use a markdown table ONLY if the visitor explicitly asks for one.\n"
        "Keep answers concise and scannable.\n"
    )

    return prompt


async def _retrieve_context(message: str, company_id: str) -> tuple[str, list]:
    """
    Deterministic pre-retrieval: always search the knowledge base for the
    visitor's message instead of relying on the LLM to volunteer a tool call.
    Returns (formatted_context, sources). Never raises — on any failure it
    returns ("", []) so the conversation continues without grounding.
    """
    try:
        chunks = await retrieve_relevant_chunks(
            query=message,
            company_id=company_id,
            top_k=RETRIEVAL_TOP_K,
            min_score=RETRIEVAL_MIN_SCORE,
        )
    except Exception as e:
        print(f"Pre-retrieval failed: {e}")
        return "", []
    if not chunks:
        return "", []
    return format_context(chunks), extract_sources(chunks)


class Chatbot:
    """Single chatbot orchestration flow (tool-calling loop)."""

    MAX_TOOL_ROUNDS = 6  # Safety limit before forcing a final answer

    def __init__(self, company_id: str, tool_names: list[str], config: Optional[dict] = None):
        self.company_id = company_id
        self.tool_names = tool_names
        self.config = config or {}

    def _build_messages(
        self,
        message: str,
        conversation_history: list[dict] = None,
        additional_context: str = "",
    ) -> list:
        """Build the message list for the LLM."""
        system_content = build_system_prompt(self.config, self.tool_names)
        if additional_context:
            system_content += f"\n\nAdditional context:\n{additional_context}"

        messages = [SystemMessage(content=system_content)]

        if conversation_history:
            for msg in conversation_history[-10:]:
                if msg["role"] == "user":
                    messages.append(HumanMessage(content=msg["content"]))
                elif msg["role"] == "assistant":
                    messages.append(AIMessage(content=msg["content"]))

        messages.append(HumanMessage(content=message))
        return messages

    def _record_action(self, tool_name: str, tool_args: dict, result: dict,
                       actions: list, sources: list) -> None:
        actions.append({"tool": tool_name, "args": tool_args, "result": result})
        if tool_name == "search_knowledge_base" and "results" in result:
            for r in result["results"]:
                src = r.get("source", "Unknown")
                if src not in [s["source"] for s in sources]:
                    sources.append({"source": src, "relevance": r.get("relevance", 0)})

    async def process_message(
        self,
        message: str,
        conversation_history: list[dict] = None,
        additional_context: str = "",
    ) -> dict:
        """
        Run the tool-calling loop:
        1. Send message + tools to the LLM
        2. If the LLM calls a tool → execute it → feed result back → repeat
        3. When the LLM returns text → return as final answer

        Returns: {"answer": str, "sources": list, "actions": list}
        """
        # Deterministic grounding: retrieve first so the answer never depends
        # on the LLM volunteering a knowledge-base search.
        pre_context, pre_sources = await _retrieve_context(message, self.company_id)
        if pre_context:
            additional_context = f"{additional_context}\n\n{pre_context}".strip() if additional_context else pre_context

        messages = self._build_messages(message, conversation_history, additional_context)
        tools = get_tool_definitions(self.tool_names)
        llm = get_llm()
        llm_with_tools = llm.bind_tools(tools) if tools else llm

        actions = []
        sources = list(pre_sources)

        for _round in range(self.MAX_TOOL_ROUNDS):
            response = await llm_with_tools.ainvoke(messages)

            if response.tool_calls:
                messages.append(response)
                for tool_call in response.tool_calls:
                    tool_name = tool_call["name"]
                    tool_args = tool_call["args"]
                    result = await execute_tool(tool_name, tool_args, self.company_id)
                    self._record_action(tool_name, tool_args, result, actions, sources)
                    messages.append(
                        ToolMessage(
                            content=json.dumps(result, default=str),
                            tool_call_id=tool_call.get("id", tool_name),
                        )
                    )
            else:
                return {
                    "answer": response.content,
                    "sources": sources,
                    "actions": actions,
                }

        # Safety: hit max rounds, force a final answer
        final_response = await llm.ainvoke(messages)
        return {
            "answer": final_response.content,
            "sources": sources,
            "actions": actions,
        }

    async def process_message_stream(
        self,
        message: str,
        conversation_history: list[dict] = None,
        additional_context: str = "",
    ):
        """
        Streaming version of process_message.
        Yields events as dicts: {"type": "tool_call"|"tool_result"|"content"|"sources"|"actions"|"done", "data": ...}
        """
        # Deterministic grounding: retrieve first so the answer never depends
        # on the LLM volunteering a knowledge-base search.
        pre_context, pre_sources = await _retrieve_context(message, self.company_id)
        if pre_context:
            additional_context = f"{additional_context}\n\n{pre_context}".strip() if additional_context else pre_context

        messages = self._build_messages(message, conversation_history, additional_context)
        tools = get_tool_definitions(self.tool_names)
        llm = get_llm()
        llm_with_tools = llm.bind_tools(tools) if tools else llm

        actions = []
        sources = list(pre_sources)

        for _round in range(self.MAX_TOOL_ROUNDS):
            response = await llm_with_tools.ainvoke(messages)

            if response.tool_calls:
                messages.append(response)
                for tool_call in response.tool_calls:
                    tool_name = tool_call["name"]
                    tool_args = tool_call["args"]

                    yield {"type": "tool_call", "data": {"tool": tool_name, "args": tool_args}}

                    result = await execute_tool(tool_name, tool_args, self.company_id)
                    self._record_action(tool_name, tool_args, result, actions, sources)

                    yield {"type": "tool_result", "data": {"tool": tool_name, "result": result}}

                    messages.append(
                        ToolMessage(
                            content=json.dumps(result, default=str),
                            tool_call_id=tool_call.get("id", tool_name),
                        )
                    )
            else:
                # Final response already generated — stream it out in chunks
                if response.content:
                    content = response.content
                    for i in range(0, len(content), 10):
                        yield {"type": "content", "data": content[i:i + 10]}
                        await asyncio.sleep(0.01)

                yield {"type": "sources", "data": sources}
                yield {"type": "actions", "data": actions}
                yield {"type": "done", "data": None}
                return

        # Safety: hit max rounds, force a final answer
        response = await llm_with_tools.ainvoke(messages)
        if response.content:
            content = response.content
            for i in range(0, len(content), 10):
                yield {"type": "content", "data": content[i:i + 10]}
                await asyncio.sleep(0.01)

        yield {"type": "sources", "data": sources}
        yield {"type": "actions", "data": actions}
        yield {"type": "done", "data": None}
