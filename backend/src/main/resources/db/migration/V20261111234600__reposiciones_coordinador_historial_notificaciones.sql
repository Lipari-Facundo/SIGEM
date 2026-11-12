ALTER TABLE solicitud_reposicion
    ADD COLUMN IF NOT EXISTS guardia_id bigint REFERENCES guardias(id);

ALTER TABLE notificaciones
    ADD COLUMN IF NOT EXISTS compartida boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS solicitud_reposicion_gestion (
    id bigserial PRIMARY KEY,
    solicitud_id bigint NOT NULL REFERENCES solicitud_reposicion(id),
    coordinador_id bigint NOT NULL REFERENCES usuarios(id),
    accion varchar(30) NOT NULL,
    detalle text NOT NULL,
    observaciones text,
    fecha timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);
