from enum import Enum
from typing import List, Optional
from pydantic import BaseModel


class MessageType(str, Enum):
    CLARIFICATION = "clarification"
    NEGOTIATION = "negotiation"
    REJECTION = "rejection"
    AMENDMENT_REQUEST = "amendment_request"


class MessageTone(str, Enum):
    POLITE = "polite"
    FIRM = "firm"
    PROFESSIONAL = "professional"


class MessageFormat(str, Enum):
    EMAIL = "email"
    WHATSAPP = "whatsapp"


class GenerateMessageRequest(BaseModel):
    session_id: str
    clause_ids: List[str]
    message_type: MessageType = MessageType.CLARIFICATION
    tone: MessageTone = MessageTone.PROFESSIONAL
    format: MessageFormat = MessageFormat.EMAIL
    extra_instruction: Optional[str] = None


class GenerateMessageResponse(BaseModel):
    draft: str
    session_id: str
    clause_ids: List[str]
    message_type: str
    tone: str
    format: str
