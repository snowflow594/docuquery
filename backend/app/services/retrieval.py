import asyncio
from uuid import UUID
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.document import Document, DocumentChunk
from app.services.embeddings import embed_query


async def retrieve_chunks(
    db: AsyncSession,
    query: str,
    top_k: int = 5,
    document_id: UUID | None = None,
    min_similarity: float = 0.5,
) -> list[dict]:
    """Recupera los chunks más relevantes para una consulta vía búsqueda vectorial.

    embed_query es CPU-bound (modelo de embeddings), se corre en un thread para
    no bloquear el event loop. Devuelve dicts compatibles con SearchResultItem.
    """
    query_embedding = await asyncio.get_event_loop().run_in_executor(
        None, embed_query, query
    )

    # cosine_distance = 1 - cosine_similarity, así que similarity >= min_similarity
    # equivale a distance <= (1 - min_similarity)
    max_distance = 1 - min_similarity

    stmt = (
        select(
            DocumentChunk.id,
            DocumentChunk.document_id,
            DocumentChunk.content,
            DocumentChunk.chunk_index,
            Document.filename,
            DocumentChunk.embedding.cosine_distance(query_embedding).label("distance"),
        )
        .join(Document, DocumentChunk.document_id == Document.id)
        .where(DocumentChunk.embedding.isnot(None))
        .where(DocumentChunk.embedding.cosine_distance(query_embedding) <= max_distance)
    )

    if document_id:
        stmt = stmt.where(DocumentChunk.document_id == document_id)

    stmt = stmt.order_by("distance").limit(top_k)

    result = await db.execute(stmt)
    return [
        {
            "chunk_id": row.id,
            "document_id": row.document_id,
            "filename": row.filename,
            "content": row.content,
            "chunk_index": row.chunk_index,
            "similarity": round(1 - row.distance, 4),
        }
        for row in result.all()
    ]
