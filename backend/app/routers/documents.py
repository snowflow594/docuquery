from uuid import UUID
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import asyncio
from app.database import get_db
from app.models.document import Document, DocumentChunk
from app.schemas.document import DocumentResponse, DocumentDetailResponse
from app.services.pdf_processor import extract_text_from_pdf, chunk_text
from app.services.embeddings import embed_texts

router = APIRouter(prefix="/documents", tags=["documents"])

_EMBED_BATCH = 20


@router.post("/upload", response_model=DocumentResponse, status_code=201)
async def upload_document(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Solo se aceptan archivos PDF")

    MAX_SIZE_MB = 5
    contents = await file.read()
    if len(contents) > MAX_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=413, detail=f"El PDF no puede superar {MAX_SIZE_MB} MB")

    text = await asyncio.to_thread(extract_text_from_pdf, contents)
    del contents  # libera RAM del PDF crudo antes de embeddings

    if not text.strip():
        raise HTTPException(status_code=422, detail="No se pudo extraer texto del PDF")

    chunks = chunk_text(text)
    del text  # libera RAM del texto completo

    document = Document(filename=file.filename, total_chunks=len(chunks))
    db.add(document)
    await db.flush()

    # Procesar en lotes pequeños para mantener el pico de RAM bajo
    for batch_start in range(0, len(chunks), _EMBED_BATCH):
        batch = chunks[batch_start : batch_start + _EMBED_BATCH]
        embeddings = await asyncio.to_thread(embed_texts, batch)
        db.add_all([
            DocumentChunk(
                document_id=document.id,
                content=chunk,
                chunk_index=batch_start + i,
                embedding=emb,
            )
            for i, (chunk, emb) in enumerate(zip(batch, embeddings))
        ])
        await db.flush()

    await db.commit()
    await db.refresh(document)
    return document


@router.get("/", response_model=list[DocumentResponse])
async def list_documents(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Document).order_by(Document.created_at.desc())
    )
    return result.scalars().all()


@router.get("/{document_id}", response_model=DocumentDetailResponse)
async def get_document(document_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Document).where(Document.id == document_id)
    )
    document = result.scalar_one_or_none()
    if not document:
        raise HTTPException(status_code=404, detail="Documento no encontrado")
    return document


@router.delete("/{document_id}", status_code=204)
async def delete_document(document_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Document).where(Document.id == document_id))
    document = result.scalar_one_or_none()
    if not document:
        raise HTTPException(status_code=404, detail="Documento no encontrado")
    await db.delete(document)
    await db.commit()


@router.post("/reindex")
async def reindex_documents(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(DocumentChunk))
    chunks = result.scalars().all()
    if not chunks:
        return {"reindexed": 0}

    for batch_start in range(0, len(chunks), _EMBED_BATCH):
        batch = chunks[batch_start : batch_start + _EMBED_BATCH]
        embeddings = await asyncio.to_thread(embed_texts, [c.content for c in batch])
        for chunk, emb in zip(batch, embeddings):
            chunk.embedding = emb
        await db.flush()

    await db.commit()
    return {"reindexed": len(chunks)}
