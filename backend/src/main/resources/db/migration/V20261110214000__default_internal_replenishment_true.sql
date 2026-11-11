ALTER TABLE solicitud_reposicion
    ADD COLUMN IF NOT EXISTS es_interna boolean NOT NULL DEFAULT false;

ALTER TABLE solicitud_reposicion
    ALTER COLUMN es_interna SET DEFAULT true;
