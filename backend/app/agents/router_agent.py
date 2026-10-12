"""
BizOS AI — Router/Orchestrator Agent
Acts as the single entry point. Classifies the user's intent and routes
the message to the appropriate specialized sub-agent.
"""

from typing import Tuple, Dict, Any, AsyncGenerator
from langchain_core.messages import HumanMessage, SystemMessage
import json

from app.agents.base_agent import get_llm
from app.agents.support_agent import SupportAgent
from app.agents.sales_agent import SalesAgent
from app.agents.revenue_agent import RevenueAgent
from app.agents.finance_agent import FinanceAgent
from app.agents.operations_agent import OperationsAgent

AGENT_MAP = {
    "support": SupportAgent,
    "sales": SalesAgent,
    "revenue": RevenueAgent,
    "finance": FinanceAgent,
    "operations": OperationsAgent,
}

class RouterAgent:
    """Orchestrator that routes messages to specialized agents."""

    def __init__(self, company_id: str):
        self.company_id = company_id

    async def classify_intent(self, message: str, conversation_history: list[dict] = None) -> str:
        """Use the LLM to determine the best agent for the task."""
        llm = get_llm()
        
        system_prompt = """You are the master routing agent for BizOS AI.
Your job is to look at the user's message and the conversation history, and decide which specialized agent should handle the request.
You MUST respond with exactly one word from the following list, representing the chosen agent:
- support: For resolving issues, technical support, bug reports, feature requests, complaints, integration support, general questions, and querying knowledge base/documents.
- sales: For product information, pricing, sales inquiries, demo requests, partnership inquiries, processing leads, CRM tasks, and convincing users to buy.
- revenue: For analyzing revenue metrics, subscriptions, account management, and customer churn.
- finance: For managing expenses, payments, budgeting, billing, refunds, and forecasting.
- operations: For supply chain, inventory, scheduling, and logistics.

Use advanced intent detection based on the user's nuances. If the user asks about a refund policy, that might be 'support' or 'finance' depending on whether they want a refund now or just the policy. If unsure, default to 'support'. Do not provide any other text or explanation. Only output the one-word agent name."""

        messages = [SystemMessage(content=system_prompt)]
        
        # Add a bit of history for context
        if conversation_history:
            for msg in conversation_history[-3:]:
                if msg["role"] == "user":
                    messages.append(HumanMessage(content=msg["content"]))

        messages.append(HumanMessage(content=message))
        
        response = await llm.ainvoke(messages)
        intent = response.content.strip().lower()
        
        if intent not in AGENT_MAP:
            intent = "support" # Fallback
            
        return intent

    async def process_message(
        self,
        message: str,
        conversation_history: list[dict] = None,
        additional_context: str = "",
    ) -> dict:
        """Route the message to the correct agent and return its response."""
        agent_type = await self.classify_intent(message, conversation_history)
        agent_class = AGENT_MAP[agent_type]
        sub_agent = agent_class(self.company_id)
        
        result = await sub_agent.process_message(message, conversation_history, additional_context)
        # Attach the routed agent type for reference
        result["routed_agent"] = agent_type
        return result
        
    async def process_message_stream(
        self,
        message: str,
        conversation_history: list[dict] = None,
        additional_context: str = "",
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """Stream version of routed processing."""
        agent_type = await self.classify_intent(message, conversation_history)
        
        yield {
            "type": "router_info",
            "data": {"agent_type": agent_type}
        }
        
        agent_class = AGENT_MAP[agent_type]
        sub_agent = agent_class(self.company_id)
        
        async for chunk in sub_agent.process_message_stream(message, conversation_history, additional_context):
            yield chunk
