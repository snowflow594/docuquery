# DocuQuery

Sistema RAG (Retrieval-Augmented Generation) que permite hacer preguntas en lenguaje natural sobre documentos PDF. Sube un PDF, haz una pregunta, y obtén una respuesta generada por IA basada en el contenido del documento.

## Stack

- **Backend:** Python 3.14 + FastAPI (async)
- **Base de datos:** PostgreSQL 16 + pgvector (búsqueda semántica por coseno)
- **Embeddings:** sentence-transformers `all-MiniLM-L6-v2` (384 dimensiones)
- **LLM:** Claude API (Anthropic)
- **PDF parsing:** pypdf

## Arquitectura

```
PDF → extracción de texto → chunks (800 chars, overlap 150)
    → embeddings (384-dim) → almacenados en pgvector

Pregunta → embedding → búsqueda coseno → top-k chunks
         → prompt con contexto → Claude API → respuesta
```

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/documents/upload` | Sube y procesa un PDF |
| `GET` | `/documents/` | Lista documentos subidos |
| `GET` | `/documents/{id}` | Detalle de un documento |
| `POST` | `/search/` | Búsqueda semántica en los chunks |
| `POST` | `/ask/` | Pregunta en lenguaje natural (RAG completo) |
| `GET` | `/health` | Estado del servicio |

## Inicio rápido

### Requisitos

- Docker Desktop
- Python 3.14+

### Configuración

```bash
# 1. Levantar la base de datos
docker compose up -d

# 2. Crear entorno virtual e instalar dependencias
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con tu ANTHROPIC_API_KEY

# 4. Iniciar el servidor
uvicorn app.main:app --reload --port 8000
```

La documentación interactiva estará disponible en `http://localhost:8000/docs`.

## Fases del proyecto

- [x] Fase 1 — Backend base (FastAPI + PostgreSQL + upload de PDFs)
- [x] Fase 2 — Motor de búsqueda semántica (embeddings + pgvector)
- [ ] Fase 3 — Integración LLM (Claude API + endpoint `/ask`)
- [ ] Fase 4 — Frontend React
