ALTER TABLE consumo_insumo
    ADD COLUMN IF NOT EXISTS observaciones text,
    ADD COLUMN IF NOT EXISTS motivo_excepcion_control varchar(500),
    ADD COLUMN IF NOT EXISTS usuario_excepcion_control_id bigint REFERENCES usuarios(id),
    ADD COLUMN IF NOT EXISTS fecha_excepcion_control timestamp;

ALTER TABLE solicitud_reposicion
    ADD COLUMN IF NOT EXISTS motivo_excepcion_control varchar(500),
    ADD COLUMN IF NOT EXISTS usuario_excepcion_control_id bigint REFERENCES usuarios(id),
    ADD COLUMN IF NOT EXISTS fecha_excepcion_control timestamp;

ALTER TABLE notificaciones
    ALTER COLUMN incidente_id DROP NOT NULL;

ALTER TABLE notificaciones
    ADD COLUMN IF NOT EXISTS solicitud_id bigint REFERENCES solicitud_reposicion(id);
