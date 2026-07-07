from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.database import get_db
from app.models.conversation import Conversation, Message
from app.schemas.chat import (
    ChatRequest,
    ChatResponse,
    ConversationSummary,
    ConversationDetail,
)
from app.schemas.document import SearchResultItem
from app.services.retrieval import retrieve_chunks
from app.services.llm import generate_answer

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("/", response_model=ChatResponse)
async def chat(body: ChatRequest, db: AsyncSession = Depends(get_db)):
    # 1. Cargar o crear la conversación
    if body.conversation_id:
        result = await db.execute(
            select(Conversation).where(Conversation.id == body.conversation_id)
        )
        conversation = result.scalar_one_or_none()
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversación no encontrada")
    else:
        conversation = Conversation(title=body.query[:80], document_id=body.document_id)
        db.add(conversation)
        await db.flush()

    # 2. Historial previo (ordenado cronológicamente)
    history_result = await db.execute(
        select(Message)
        .where(Message.conversation_id == conversation.id)
        .order_by(Message.created_at)
    )
    history = [
        {"role": m.role, "content": m.content}
        for m in history_result.scalars().all()
    ]

    # 3. Recuperar contexto relevante (filtra por documento si aplica)
    doc_filter = body.document_id or conversation.document_id
    chunks = await retrieve_chunks(
        db, body.query, top_k=body.top_k, document_id=doc_filter
    )
    if not chunks:
        raise HTTPException(
            status_code=404,
            detail="No hay documentos indexados para responder. Sube un PDF primero.",
        )

    # 4. Generar respuesta con Claude
    answer = await generate_answer(body.query, chunks, history)

    # 5. Persistir el turno (pregunta + respuesta)
    db.add(Message(conversation_id=conversation.id, role="user", content=body.query))
    db.add(Message(conversation_id=conversation.id, role="assistant", content=answer))
    await db.commit()

    return ChatResponse(
        conversation_id=conversation.id,
        answer=answer,
        sources=[SearchResultItem(**c) for c in chunks],
    )


@router.get("/conversations", response_model=list[ConversationSummary])
async def list_conversations(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Conversation, func.count(Message.id).label("message_count"))
        .outerjoin(Message, Message.conversation_id == Conversation.id)
        .group_by(Conversation.id)
        .order_by(Conversation.created_at.desc())
    )
    return [
        ConversationSummary(
            id=conv.id,
            title=conv.title,
            created_at=conv.created_at,
            message_count=count,
        )
        for conv, count in result.all()
    ]


@router.get("/conversations/{conversation_id}", response_model=ConversationDetail)
async def get_conversation(conversation_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Conversation)
        .where(Conversation.id == conversation_id)
        .options(selectinload(Conversation.messages))
    )
    conversation = result.scalar_one_or_none()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversación no encontrada")
    return conversation
