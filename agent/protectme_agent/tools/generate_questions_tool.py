"""
Tool: generate_questions

Generates a list of recommended questions the user should ask the other party
before signing — either for specific clause(s) or the full risk report.
"""
import logging
import re
from typing import List, Optional

logger = logging.getLogger(__name__)

_SYSTEM_PROMPT = (
    "You are a contract risk assistant helping users prepare questions to ask "
    "the other party before signing. Write clear, specific, actionable questions. "
    "Number each question. Return only the questions, one per line."
)


class GenerateQuestionsTool:
    """
    Input:  risk_report dict (or selected clause_texts) + gemini_client
    Output: list of question strings
    """

    async def execute(
        self,
        risk_report: Optional[dict] = None,
        clause_texts: Optional[List[str]] = None,
        gemini_client=None,
    ) -> List[str]:
        if gemini_client is None:
            raise ValueError("gemini_client is required.")
        if not risk_report and not clause_texts:
            raise ValueError("Provide either risk_report or clause_texts.")

        if risk_report:
            risks = risk_report.get("risks", [])[:10]
            risk_lines = "\n".join(
                f"- {r['title']}: {r.get('simple_explanation', '')}" for r in risks
            )
            prompt = (
                "Generate 5 to 8 specific questions to ask before signing "
                "based on these contract risks:\n\n" + risk_lines
            )
        else:
            clauses = "\n\n".join(f'"{c}"' for c in (clause_texts or []))
            prompt = (
                "Generate 3 to 5 specific questions to ask about "
                "these contract clauses:\n\n" + clauses
            )

        logger.debug(
            "GenerateQuestionsTool: using %s",
            "risk_report" if risk_report else "clause_texts",
        )

        raw = await gemini_client.generate(
            prompt=prompt,
            system=_SYSTEM_PROMPT,
            model=gemini_client.conversation_model,
            temperature=0.2,
        )

        lines = [line.strip() for line in raw.splitlines() if line.strip()]
        questions = []
        for line in lines:
            clean = re.sub(r"^[\d]+[.)]\s*", "", line).strip()
            clean = re.sub(r"^[-•*]\s*", "", clean).strip()
            if clean and len(clean) > 10:
                questions.append(clean)

        return questions if questions else [raw.strip()]
