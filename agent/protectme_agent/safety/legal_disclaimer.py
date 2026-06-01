"""
Legal disclaimer text and injection helpers for all ProtectMe AI agent responses.

ProtectMe AI must NEVER claim to provide legal advice or act as a lawyer.
These constants are the single source of truth for all disclaimer copy.
"""

DISCLAIMER_SHORT = (
    "ProtectMe AI helps you understand contracts. "
    "It does not replace a lawyer or provide legal advice."
)

DISCLAIMER_FULL = (
    "ProtectMe AI is a contract-risk assistant, not a legal advisor. "
    "It identifies potentially unclear or unfair clauses and helps you prepare questions. "
    "For contracts with significant financial or legal implications, consult a qualified lawyer. "
    "Nothing in this report constitutes legal advice or a legal opinion."
)

DISCLAIMER_VOICE_INTRO = (
    "I'm ProtectMe AI, your contract-risk assistant — not a lawyer. "
    "I can help you understand this contract and suggest questions to ask, "
    "but this is not legal advice. What would you like to know?"
)

DISCLAIMER_HIGH_RISK = (
    "Given the high-risk clauses in this contract, we strongly recommend "
    "reviewing it with a qualified lawyer before signing."
)


def should_add_high_risk_disclaimer(overall_risk: str) -> bool:
    return overall_risk.strip().lower() == "high"


def inject_into_prompt(prompt: str, position: str = "end") -> str:
    """Add the short disclaimer to an agent system prompt."""
    block = f"\n\nIMPORTANT CONSTRAINT: {DISCLAIMER_SHORT} Never claim legal authority."
    return block.lstrip() + "\n\n" + prompt if position == "start" else prompt + block
