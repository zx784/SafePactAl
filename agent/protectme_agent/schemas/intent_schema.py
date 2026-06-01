"""Intent classification output schema for the IntentRouter."""
from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field


class Intent(str, Enum):
    ASK_QUESTION = "ask_question"
    EXPLAIN_CLAUSE = "explain_clause"
    GENERATE_MESSAGE = "generate_message"
    SUMMARIZE_RISKS = "summarize_risks"
    ASK_RECOMMENDATION = "ask_recommendation"
    MODIFY_MESSAGE = "modify_message"
    GENERATE_QUESTIONS = "generate_questions"
    UNCLEAR = "unclear"


class IntentResult(BaseModel):
    intent: Intent
    confidence: float = Field(..., ge=0.0, le=1.0)
    target_clause_ids: List[str] = Field(default_factory=list)
    message_type: Optional[str] = None
    tone: Optional[str] = None
    format: Optional[str] = None
    clarification_question: Optional[str] = None

    @property
    def needs_clarification(self) -> bool:
        """True if the router is unsure and should ask the user to clarify."""
        return self.intent == Intent.UNCLEAR or self.confidence < 0.6
