import cohere
from app.config import settings

_client: cohere.Client | None = None


def _get_client() -> cohere.Client:
    global _client
    if _client is None:
        _client = cohere.Client(api_key=settings.COHERE_API_KEY)
    return _client


def embed_texts(texts: list[str]) -> list[list[float]]:
    response = _get_client().embed(
        texts=texts,
        model="embed-multilingual-light-v3.0",
        input_type="search_document",
    )
    return response.embeddings  # type: ignore[return-value]


def embed_query(text: str) -> list[float]:
    response = _get_client().embed(
        texts=[text],
        model="embed-multilingual-light-v3.0",
        input_type="search_query",
    )
    return response.embeddings[0]  # type: ignore[index]
