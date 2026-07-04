-- DocuQuery – Schema para Supabase
-- Ejecutar en: Supabase Dashboard → SQL Editor

-- 1. Extensión pgvector (ya viene instalada en Supabase, esto es por si acaso)
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Documentos
CREATE TABLE IF NOT EXISTS documents (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    filename    VARCHAR(255) NOT NULL,
    total_chunks INTEGER     DEFAULT 0,
    created_at  TIMESTAMP   DEFAULT NOW()
);

-- 3. Chunks con embeddings (all-MiniLM-L6-v2 produce vectores de 384 dimensiones)
CREATE TABLE IF NOT EXISTS document_chunks (
    id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID    NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    content     TEXT    NOT NULL,
    chunk_index INTEGER NOT NULL,
    embedding   vector(384),
    created_at  TIMESTAMP DEFAULT NOW()
);

-- 4. Conversaciones
CREATE TABLE IF NOT EXISTS conversations (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    title       VARCHAR(255),
    document_id UUID         REFERENCES documents(id) ON DELETE SET NULL,
    created_at  TIMESTAMP    DEFAULT NOW()
);

-- 5. Mensajes
CREATE TABLE IF NOT EXISTS messages (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID        NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    role            VARCHAR(20) NOT NULL,   -- 'user' | 'assistant'
    content         TEXT        NOT NULL,
    created_at      TIMESTAMP   DEFAULT NOW()
);

-- 6. Índice IVFFlat para búsqueda vectorial por coseno
--    Crear DESPUÉS de tener al menos ~100 filas en document_chunks.
--    Si la tabla está vacía, comentar estas líneas y ejecutar luego.
-- CREATE INDEX IF NOT EXISTS document_chunks_embedding_idx
--     ON document_chunks USING ivfflat (embedding vector_cosine_ops)
--     WITH (lists = 100);
