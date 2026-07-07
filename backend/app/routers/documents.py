from uuid import UUID
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import asyncio
from app.database import get_db, AsyncSessionLocal
from app.models.document import Document, DocumentChunk
from app.schemas.document import DocumentResponse, DocumentDetailResponse
from app.services.pdf_processor import extract_text_from_pdf, chunk_text
from app.services.embeddings import embed_texts

router = APIRouter(prefix="/documents", tags=["documents"])

_EMBED_BATCH = 20


async def _process_pdf(document_id: UUID, contents: bytes) -> None:
    async with AsyncSessionLocal() as db:
        try:
            text = await asyncio.to_thread(extract_text_from_pdf, contents)
            del contents

            if not text.strip():
                raise ValueError("No text extracted")

            chunks = chunk_text(text)
            del text

            result = await db.execute(select(Document).where(Document.id == document_id))
            document = result.scalar_one_or_none()
            if not document:
                return

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

            document.total_chunks = len(chunks)
            await db.commit()

        except Exception:
            # Si el procesamiento falla, elimina el registro para que el usuario pueda reintentar
            async with AsyncSessionLocal() as err_db:
                result = await err_db.execute(select(Document).where(Document.id == document_id))
                doc = result.scalar_one_or_none()
                if doc:
                    await err_db.delete(doc)
                    await err_db.commit()


@router.post("/upload", response_model=DocumentResponse, status_code=201)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Solo se aceptan archivos PDF")

    MAX_SIZE_MB = 5
    contents = await file.read()
    if len(contents) > MAX_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=413, detail=f"El PDF no puede superar {MAX_SIZE_MB} MB")

    document = Document(filename=file.filename, total_chunks=0)
    db.add(document)
    await db.commit()
    await db.refresh(document)

    background_tasks.add_task(_process_pdf, document.id, contents)
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
