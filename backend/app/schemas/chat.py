from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, Field, field_validator
from app.schemas.document import SearchResultItem


class ChatRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=2000)
    conversation_id: UUID | None = None
    document_id: UUID | None = None
    top_k: int = Field(default=5, ge=1, le=20)

    @field_validator("conversation_id", "document_id", mode="before")
    @classmethod
    def empty_str_to_none(cls, v):
        return None if v == "" else v


class ChatMessage(BaseModel):
    role: str
    content: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ChatResponse(BaseModel):
    conversation_id: UUID
    answer: str
    sources: list[SearchResultItem]


class ConversationSummary(BaseModel):
    id: UUID
    title: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class ConversationDetail(ConversationSummary):
    messages: list[ChatMessage] = []
