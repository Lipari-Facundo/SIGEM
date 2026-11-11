ALTER TABLE solicitud_reposicion ALTER COLUMN movil_id DROP NOT NULL;
ALTER TABLE solicitud_reposicion
    ADD COLUMN IF NOT EXISTS prioridad varchar(20) NOT NULL DEFAULT 'NORMAL';
ALTER TABLE solicitud_reposicion
    ADD COLUMN IF NOT EXISTS es_interna boolean NOT NULL DEFAULT false;

ALTER TABLE solicitud_reposicion
    DROP CONSTRAINT IF EXISTS ck_solicitud_reposicion_prioridad;
ALTER TABLE solicitud_reposicion
    ADD CONSTRAINT ck_solicitud_reposicion_prioridad
    CHECK (prioridad IN ('URGENTE', 'NORMAL', 'PROGRAMADA'));
