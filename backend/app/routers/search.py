import asyncio
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.document import Document, DocumentChunk
from app.schemas.document import SearchRequest, SearchResponse, SearchResultItem
from app.services.embeddings import embed_query

router = APIRouter(prefix="/search", tags=["search"])


@router.post("/", response_model=SearchResponse)
async def semantic_search(body: SearchRequest, db: AsyncSession = Depends(get_db)):
    query_embedding = await asyncio.get_event_loop().run_in_executor(
        None, embed_query, body.query
    )

    stmt = (
        select(
            DocumentChunk,
            Document.filename,
            DocumentChunk.embedding.cosine_distance(query_embedding).label("distance"),
        )
        .join(Document, DocumentChunk.document_id == Document.id)
        .where(DocumentChunk.embedding.isnot(None))
    )

    if body.document_id:
        stmt = stmt.where(DocumentChunk.document_id == body.document_id)

    stmt = stmt.order_by("distance").limit(body.top_k)

    result = await db.execute(stmt)
    rows = result.all()

    if not rows:
        raise HTTPException(status_code=404, detail="No se encontraron resultados")

    return SearchResponse(
        query=body.query,
        results=[
            SearchResultItem(
                chunk_id=chunk.id,
                document_id=chunk.document_id,
                filename=filename,
                content=chunk.content,
                similarity=round(1 - distance, 4),
                chunk_index=chunk.chunk_index,
            )
            for chunk, filename, distance in rows
        ],
    )
