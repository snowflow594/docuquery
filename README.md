# DocuQuery

Sistema RAG (Retrieval-Augmented Generation) que permite hacer preguntas en lenguaje natural sobre documentos PDF. Sube un PDF, haz una pregunta y obtén una respuesta generada por IA basada exclusivamente en el contenido del documento, con citas de los fragmentos utilizados.

**Demo:** https://docuquery-pi.vercel.app

## Stack

| Capa | Tecnología |
|------|------------|
| **Frontend** | React 18 + Vite + TypeScript + Tailwind CSS |
| **Backend** | Python 3.11 + FastAPI (async) |
| **Base de datos** | PostgreSQL 16 + pgvector |
| **Embeddings** | fastembed · `BAAI/bge-small-en-v1.5` (384 dimensiones, ONNX) |
| **LLM** | Claude API (Anthropic) — `claude-haiku-4-5` |
| **PDF parsing** | pypdf |
| **Despliegue** | Vercel + Render + Supabase (free tier) |

## Arquitectura

```
Ingesta
PDF → extracción de texto → chunks (800 chars, overlap 150)
    → embeddings (384-dim) → almacenados en pgvector

Consulta
Pregunta → embedding → búsqueda coseno → top-k chunks relevantes
         → prompt con contexto + historial → Claude API → respuesta
```

## Endpoints de la API

### Documentos

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/documents/upload` | Sube y procesa un PDF (extrae texto, genera embeddings) |
| `GET` | `/documents/` | Lista todos los documentos indexados |
| `GET` | `/documents/{id}` | Detalle de un documento |
| `POST` | `/documents/reindex` | Regenera todos los embeddings |

### Búsqueda y chat

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/search/` | Búsqueda semántica directa sobre los chunks |
| `POST` | `/chat/` | Pregunta en lenguaje natural — pipeline RAG completo |
| `GET` | `/chat/conversations` | Lista el historial de conversaciones |
| `GET` | `/chat/conversations/{id}` | Detalle de una conversación con sus mensajes |

### Sistema

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/health` | Estado del servicio |

## Estructura del proyecto

```
docuquery/
├── docker-compose.yml          # PostgreSQL + pgvector (solo desarrollo local)
├── render.yaml                 # Configuración de despliegue en Render
├── supabase_schema.sql         # Schema SQL para Supabase
├── backend/
│   ├── requirements.txt
│   ├── run.py
│   └── app/
│       ├── main.py             # FastAPI + CORS + lifespan
│       ├── config.py           # Variables de entorno (pydantic-settings)
│       ├── database.py         # Engine async SQLAlchemy + SSL para cloud
│       ├── models/             # ORM: Document, Chunk, Conversation, Message
│       ├── schemas/            # Pydantic I/O schemas
│       ├── routers/            # documents, search, chat
│       └── services/
│           ├── pdf_processor.py  # Extracción y chunking
│           ├── embeddings.py     # fastembed (ONNX)
│           ├── retrieval.py      # Búsqueda coseno con pgvector
│           └── llm.py            # Integración con Claude API
└── frontend/
    └── src/
        ├── App.tsx             # Routing principal
        ├── services/api.ts     # Cliente HTTP (axios)
        ├── components/
        │   ├── Sidebar.tsx
        │   ├── TopBar.tsx
        │   └── UploadModal.tsx
        └── pages/
            ├── ChatPage.tsx
            ├── DocumentsPage.tsx
            ├── HistoryPage.tsx
            └── SettingsPage.tsx
```

## Desarrollo local

### Requisitos

- Docker Desktop
- Python 3.11+
- Node.js 18+

### 1. Base de datos

```bash
docker compose up -d
```

Levanta PostgreSQL 16 con pgvector en el puerto `5433`.

### 2. Backend

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# macOS / Linux
source venv/bin/activate

pip install -r requirements.txt
```

Crea el archivo `.env` en `backend/` (ver `backend/.env.example`):

```env
DATABASE_URL=postgresql+psycopg://postgres:password@localhost:5433/docuquery
ANTHROPIC_API_KEY=sk-ant-...
CHAT_MODEL=claude-haiku-4-5
ALLOWED_ORIGINS=http://localhost:5173
```

Inicia el servidor:

```bash
python run.py
# o bien: uvicorn app.main:app --reload --port 8000
```

La API estará en `http://localhost:8000` y la documentación interactiva en `http://localhost:8000/docs`.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

La aplicación estará en `http://localhost:5173`.

## Variables de entorno

| Variable | Descripción | Default |
|----------|-------------|---------|
| `DATABASE_URL` | Conexión async a PostgreSQL (driver psycopg3) | `postgresql+psycopg://postgres:password@localhost:5432/docuquery` |
| `ANTHROPIC_API_KEY` | API key de Anthropic | — |
| `CHAT_MODEL` | Modelo de Claude a utilizar | `claude-haiku-4-5` |
| `ALLOWED_ORIGINS` | Orígenes CORS permitidos, separados por coma | `http://localhost:5173,http://localhost:3000` |

## Despliegue (free tier)

| Servicio | Plataforma | Notas |
|----------|------------|-------|
| Frontend | Vercel | Variable `VITE_API_URL` = URL del backend |
| Backend | Render | `render.yaml` en la raíz del repo |
| Base de datos | Supabase | Ejecutar `supabase_schema.sql` en el SQL Editor |

## Fases del proyecto

- [x] Fase 1 — Backend base (FastAPI + PostgreSQL + upload de PDFs)
- [x] Fase 2 — Motor de búsqueda semántica (embeddings + pgvector)
- [x] Fase 3 — Integración LLM (Claude API + pipeline RAG + historial de conversaciones)
- [x] Fase 4 — Frontend React (Chat, Documentos, Historial, Ajustes)
- [x] Fase 5 — Despliegue en producción (Vercel + Render + Supabase)
