from anthropic import AsyncAnthropic
from app.config import settings

_client: AsyncAnthropic | None = None


def _get_client() -> AsyncAnthropic:
    global _client
    if _client is None:
        _client = AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
    return _client


SYSTEM_PROMPT = """Eres DocuQuery, un asistente que responde preguntas sobre los documentos del usuario.

Reglas:
- Usa EXCLUSIVAMENTE la información del contexto proporcionado entre las etiquetas <contexto>.
- Si la respuesta no se encuentra en el contexto, indícalo claramente; no inventes información.
- Responde en español, de forma clara y concisa.
- Cuando sea útil, menciona el fragmento o documento de origen."""


def _build_context(chunks: list[dict]) -> str:
    blocks = []
    for i, c in enumerate(chunks, 1):
        blocks.append(f"[Fragmento {i} — {c['filename']}]\n{c['content']}")
    return "\n\n".join(blocks)


async def generate_answer(
    query: str,
    context_chunks: list[dict],
    history: list[dict],
) -> str:
    """Genera una respuesta RAG con Claude.

    El contexto recuperado se inyecta en el system prompt de esta petición; el
    historial (mensajes plano user/assistant) se pasa tal cual en `messages`.
    """
    client = _get_client()
    context = _build_context(context_chunks)
    system = f"{SYSTEM_PROMPT}\n\n<contexto>\n{context}\n</contexto>"

    messages = [{"role": m["role"], "content": m["content"]} for m in history]
    messages.append({"role": "user", "content": query})

    response = await client.messages.create(
        model=settings.CHAT_MODEL,
        max_tokens=2048,
        system=system,
        messages=messages,
    )

    return "".join(block.text for block in response.content if block.type == "text")
