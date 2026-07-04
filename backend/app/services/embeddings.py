from fastembed import TextEmbedding

# BAAI/bge-small-en-v1.5: 384 dims, ONNX runtime (~150MB total vs ~400MB con PyTorch)
_model: TextEmbedding | None = None


def _get_model() -> TextEmbedding:
    global _model
    if _model is None:
        _model = TextEmbedding("BAAI/bge-small-en-v1.5")
    return _model


def embed_texts(texts: list[str]) -> list[list[float]]:
    model = _get_model()
    return [emb.tolist() for emb in model.embed(texts)]


def embed_query(text: str) -> list[float]:
    return embed_texts([text])[0]
