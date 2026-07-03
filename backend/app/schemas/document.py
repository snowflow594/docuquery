from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field, computed_field


class DocumentResponse(BaseModel):
    id: UUID
    filename: str
    total_chunks: int
    created_at: datetime

    @computed_field
    @property
    def status(self) -> str:
        return "ready" if self.total_chunks > 0 else "failed"

    model_config = {"from_attributes": True}


class ChunkResponse(BaseModel):
    id: UUID
    chunk_index: int
    content: str

    model_config = {"from_attributes": True}


class DocumentDetailResponse(DocumentResponse):
    chunks: list[ChunkResponse] = []


class SearchRequest(BaseModel):
    query: str = Field(..., min_length=3, max_length=500)
    top_k: int = Field(default=5, ge=1, le=20)
    document_id: UUID | None = None


class SearchResultItem(BaseModel):
    chunk_id: UUID
    document_id: UUID
    filename: str
    content: str
    similarity: float
    chunk_index: int


class SearchResponse(BaseModel):
    query: str
    results: list[SearchResultItem]
