ALTER TABLE solicitud_reposicion
    ADD COLUMN IF NOT EXISTS archivado boolean NOT NULL DEFAULT false;
