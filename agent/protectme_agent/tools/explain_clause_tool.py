"""
Tool: explain_clause

Returns a plain-language explanation of a specific contract clause.
Dispatched when intent = explain_clause.
"""
import logging
from typing import Optional

logger = logging.getLogger(__name__)

_SYSTEM_PROMPT = (
    "You are a contract risk assistant. Explain contract clauses in plain, simple "
    "language that anyone can understand — no legal jargon. Never give legal advice. "
    "End every response with: 'This is not legal advice.'"
)


class ExplainClauseTool:
    """
    Input:  clause_text (raw) + optional risk context dict + gemini_client
    Output: plain-language explanation string
    """

    async def execute(
        self,
        clause_text: str,
        risk_context: Optional[dict] = None,
        gemini_client=None,
    ) -> str:
        if not clause_text:
            raise ValueError("clause_text is required.")
        if gemini_client is None:
            raise ValueError("gemini_client is required.")

        parts = [
            "Explain this contract clause in plain, simple language:\n",
            f'"{clause_text}"',
        ]

        if risk_context:
            explanation = risk_context.get("simple_explanation", "")
            why = risk_context.get("why_it_matters", "")
            if explanation:
                parts.append(f"\nContext — what this means: {explanation}")
            if why:
                parts.append(f"Why it matters: {why}")
            parts.append(
                "\nExpand on the above in 2–3 sentences a non-lawyer would understand."
            )

        prompt = "\n".join(parts)

        logger.debug("ExplainClauseTool: clause=%d chars", len(clause_text))

        result = await gemini_client.generate(
            prompt=prompt,
            system=_SYSTEM_PROMPT,
            model=gemini_client.conversation_model,
            temperature=0.2,
        )
        return result.strip()
