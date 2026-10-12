"""
BizOS AI — Base Agent Class (Function-Calling)
All specialized agents inherit from this base.
Uses Gemini's native function calling for tool use in a ReAct-style loop.
"""

import json
import asyncio
from abc import ABC, abstractmethod
from typing import Optional

from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage, ToolMessage

from app.config import get_settings
from app.agents.tool_registry import execute_tool, get_tool_definitions, TOOL_DEFINITIONS

settings = get_settings()

# Shared LLM instance
_llm = None


def get_llm() -> ChatGroq:
    global _llm
    if _llm is None:
        _llm = ChatGroq(
            model="llama-3.1-8b-instant",
            api_key=settings.GROQ_API_KEY,
            temperature=0.7,
            max_tokens=1024,
        )
    return _llm


class BaseAgent(ABC):
    """Base class for all BizOS AI agents with function-calling capabilities."""

    MAX_TOOL_ROUNDS = 6  # Safety limit: max tool-call rounds before forcing final answer

    def __init__(self, company_id: str):
        self.company_id = company_id

    @property
    @abstractmethod
    def agent_type(self) -> str:
        """Return agent type identifier."""
        pass

    @property
    @abstractmethod
    def system_prompt(self) -> str:
        """Return the system prompt for this agent."""
        pass

    @property
    @abstractmethod
    def tool_names(self) -> list[str]:
        """Return list of tool names this agent can use."""
        pass

    def _build_messages(
        self,
        message: str,
        conversation_history: list[dict] = None,
        additional_context: str = "",
    ) -> list:
        """Build the message list for the LLM."""
        system_content = self.system_prompt
        if additional_context:
            system_content += f"\n\nAdditional context:\n{additional_context}"

        # Add tool usage instructions
        system_content += (
            "\n\n## Tool Usage & Execution\n"
            "You have access to tools that let you take REAL actions — "
            "creating tickets, saving leads, querying the database, searching the knowledge base, etc. "
            "When the user asks you to do something, USE the appropriate tool to actually do it. "
            "Don't just describe what you would do — execute it.\n"
            "After using a tool, summarize what you did and the result for the user.\n"
            "You can call multiple tools in sequence if needed.\n\n"
            "## Enterprise Directives (CRITICAL)\n"
            "1. **Professional Tone**: Be helpful, confident, friendly, and concise. Never use robotic language or generic AI phrases. Be empathetic without sounding scripted.\n"
            "2. **Hallucination Prevention**: NEVER invent pricing, features, policies, or contact info. If documentation is missing, state so honestly and offer the next best action.\n"
            "3. **No Internal Monologue**: Do NOT output any internal reasoning, thoughts, or monologue (e.g., 'Okay, let me check...'). Your output is sent directly to the user, so ONLY output the final direct response."
        )

        messages = [SystemMessage(content=system_content)]

        # Add conversation history
        if conversation_history:
            for msg in conversation_history[-10:]:
                if msg["role"] == "user":
                    messages.append(HumanMessage(content=msg["content"]))
                elif msg["role"] == "assistant":
                    messages.append(AIMessage(content=msg["content"]))

        # Add current message
        messages.append(HumanMessage(content=message))

        return messages

    def _get_tools_for_llm(self) -> list[dict]:
        """Get tool definitions formatted for Gemini function calling."""
        return get_tool_definitions(self.tool_names)

    async def process_message(
        self,
        message: str,
        conversation_history: list[dict] = None,
        additional_context: str = "",
    ) -> dict:
        """
        Process a user message using the ReAct loop:
        1. Send message + tools to Gemini
        2. If Gemini calls a tool → execute it → feed result back → repeat
        3. When Gemini returns text → return as final answer

        Returns: {"answer": str, "sources": list, "actions": list}
        """
        messages = self._build_messages(message, conversation_history, additional_context)
        tools = self._get_tools_for_llm()
        llm = get_llm()

        actions = []  # Track tool calls made
        sources = []

        # Bind tools to the LLM
        if tools:
            llm_with_tools = llm.bind_tools(tools)
        else:
            llm_with_tools = llm

        for _round in range(self.MAX_TOOL_ROUNDS):
            response = await llm_with_tools.ainvoke(messages)

            # Check if the model wants to call tools
            if response.tool_calls:
                # Add the AI message with tool calls to the conversation
                messages.append(response)

                for tool_call in response.tool_calls:
                    tool_name = tool_call["name"]
                    tool_args = tool_call["args"]

                    # Execute the tool
                    result = await execute_tool(tool_name, tool_args, self.company_id)

                    # Track the action
                    action = {
                        "tool": tool_name,
                        "args": tool_args,
                        "result": result,
                    }
                    actions.append(action)

                    # Extract sources from KB search results
                    if tool_name == "search_knowledge_base" and "results" in result:
                        for r in result["results"]:
                            src = r.get("source", "Unknown")
                            if src not in [s["source"] for s in sources]:
                                sources.append({
                                    "source": src,
                                    "relevance": r.get("relevance", 0),
                                })

                    # Add tool result back to conversation
                    messages.append(
                        ToolMessage(
                            content=json.dumps(result, default=str),
                            tool_call_id=tool_call.get("id", tool_name),
                        )
                    )
            else:
                # Model returned a final text response
                return {
                    "answer": response.content,
                    "sources": sources,
                    "actions": actions,
                }

        # Safety: if we hit max rounds, return what we have
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
        Stream version of process_message.
        Yields events as dicts: {"type": "tool_call"|"tool_result"|"content"|"sources"|"done", "data": ...}
        """
        messages = self._build_messages(message, conversation_history, additional_context)
        tools = self._get_tools_for_llm()
        llm = get_llm()

        actions = []
        sources = []

        if tools:
            llm_with_tools = llm.bind_tools(tools)
        else:
            llm_with_tools = llm

        for _round in range(self.MAX_TOOL_ROUNDS):
            # First, do a non-streaming call to check for tool calls
            response = await llm_with_tools.ainvoke(messages)

            if response.tool_calls:
                messages.append(response)

                for tool_call in response.tool_calls:
                    tool_name = tool_call["name"]
                    tool_args = tool_call["args"]

                    # Yield tool call event
                    yield {
                        "type": "tool_call",
                        "data": {"tool": tool_name, "args": tool_args},
                    }

                    # Execute
                    result = await execute_tool(tool_name, tool_args, self.company_id)

                    action = {"tool": tool_name, "args": tool_args, "result": result}
                    actions.append(action)

                    if tool_name == "search_knowledge_base" and "results" in result:
                        for r in result["results"]:
                            src = r.get("source", "Unknown")
                            if src not in [s["source"] for s in sources]:
                                sources.append({"source": src, "relevance": r.get("relevance", 0)})

                    # Yield tool result event
                    yield {
                        "type": "tool_result",
                        "data": {"tool": tool_name, "result": result},
                    }

                    messages.append(
                        ToolMessage(
                            content=json.dumps(result, default=str),
                            tool_call_id=tool_call.get("id", tool_name),
                        )
                    )
            else:
                # We already have the final response from `ainvoke`.
                # Fake stream it to the user to avoid a second non-deterministic LLM call.
                if response.content:
                    content = response.content
                    # Split into chunks of 10 chars for smooth fake streaming
                    for i in range(0, len(content), 10):
                        yield {"type": "content", "data": content[i:i+10]}
                        await asyncio.sleep(0.01)

                # Yield sources and done
                yield {"type": "sources", "data": sources}
                yield {"type": "actions", "data": actions}
                yield {"type": "done", "data": None}
                return

        # Safety: hit max rounds, stream final answer
        response = await llm_with_tools.ainvoke(messages)
        if response.content:
            content = response.content
            for i in range(0, len(content), 10):
                yield {"type": "content", "data": content[i:i+10]}
                await asyncio.sleep(0.01)

        yield {"type": "sources", "data": sources}
        yield {"type": "actions", "data": actions}
        yield {"type": "done", "data": None}
