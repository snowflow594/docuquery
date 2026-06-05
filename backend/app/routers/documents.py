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


@router.post("/upload", response_model=DocumentResponse, status_code=201)
async def upload_document(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Solo se aceptan archivos PDF")

    MAX_SIZE_MB = 15
    contents = await file.read()
    if len(contents) > MAX_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=413, detail=f"El PDF no puede superar {MAX_SIZE_MB} MB")
    text = extract_text_from_pdf(contents)

    if not text.strip():
        raise HTTPException(status_code=422, detail="No se pudo extraer texto del PDF")

    chunks = chunk_text(text)

    # embed_texts es CPU-bound, lo corremos en un thread para no bloquear el event loop
    embeddings = await asyncio.get_event_loop().run_in_executor(None, embed_texts, chunks)

    document = Document(filename=file.filename, total_chunks=len(chunks))
    db.add(document)
    await db.flush()

    db.add_all([
        DocumentChunk(document_id=document.id, content=chunk, chunk_index=i, embedding=emb)
        for i, (chunk, emb) in enumerate(zip(chunks, embeddings))
    ])

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
