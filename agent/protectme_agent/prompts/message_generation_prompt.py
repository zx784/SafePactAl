"""
Prompt for the message generation tool.
Phase 3: full implementation.
"""
from typing import List, Optional

SYSTEM_PROMPT = """\
You are a professional communications assistant helping a user write a message about
specific clauses in a contract. You are NOT a lawyer.

Write clearly, professionally, and constructively. Do not claim legal authority.
Frame requests as polite questions or concerns, not demands or legal threats.
"""

MESSAGE_PROMPT_TEMPLATE = """\
Write a {message_type} message in a {tone} tone, formatted as {format}.

Contract concerns to address:
{risk_summary}

Original clause text(s):
{clause_texts}

Format guidelines for {format}:
- Email: include Subject line, salutation, body, and sign-off.
- WhatsApp: short, conversational, no formal headers needed.

Keep the tone {tone} throughout. Do NOT claim to be a lawyer or make legal assertions.
End with a clear, specific next step or question.

Clause references: Do NOT write placeholder brackets like "[X]", "[Clause X]", or "[Section X]".
Instead, refer to each clause by its actual wording, category, or purpose as shown in the clause texts above.
Only names, addresses, and contact details genuinely unknown from the contract may remain as placeholders (e.g. [Your Name], [Recipient Name]).{extra_section}"""


def build_message_prompt(
    risk_summaries: List[str],
    clause_texts: List[str],
    message_type: str,
    tone: str,
    format: str,
    extra_instruction: Optional[str] = None,
) -> str:
    extra_section = f"\n\nAdditional instruction: {extra_instruction}" if extra_instruction else ""
    return MESSAGE_PROMPT_TEMPLATE.format(
        message_type=message_type,
        tone=tone,
        format=format,
        risk_summary="\n".join(f"• {s}" for s in risk_summaries),
        clause_texts="\n\n".join(f'"{c}"' for c in clause_texts),
        extra_section=extra_section,
    )
