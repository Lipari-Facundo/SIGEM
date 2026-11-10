DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM asignaciones_equipos
        WHERE activo
        GROUP BY equipo_id
        HAVING COUNT(*) > 1
    ) THEN
        RAISE EXCEPTION 'No se puede migrar: hay equipos con más de una asignación activa';
    END IF;
END;
$$;

CREATE TABLE IF NOT EXISTS tipos_equipos_medicos (
    codigo varchar(50) PRIMARY KEY,
    nombre varchar(100) NOT NULL,
    insumo_id bigint UNIQUE,
    CONSTRAINT ck_tipos_equipos_medicos_codigo
        CHECK (codigo IN ('ELECTROCARDIOGRAFO', 'CARDIODESFIBRILADOR', 'RESPIRADOR')),
    CONSTRAINT fk_tipo_equipo_insumo
        FOREIGN KEY (insumo_id) REFERENCES insumos(id) ON DELETE RESTRICT
);

INSERT INTO tipos_equipos_medicos (codigo, nombre)
VALUES
    ('ELECTROCARDIOGRAFO', 'Electrocardiógrafo'),
    ('CARDIODESFIBRILADOR', 'Cardiodesfibrilador'),
    ('RESPIRADOR', 'Respirador')
ON CONFLICT (codigo) DO NOTHING;

ALTER TABLE equipos_medicos
    ADD COLUMN IF NOT EXISTS tipo_equipo_id varchar(50);

ALTER TABLE equipos_medicos
    ADD CONSTRAINT fk_equipo_tipo_equipo
    FOREIGN KEY (tipo_equipo_id) REFERENCES tipos_equipos_medicos(codigo) ON DELETE RESTRICT;

ALTER TABLE equipos_medicos
    ADD CONSTRAINT uk_equipo_id_tipo_equipo UNIQUE (id, tipo_equipo_id);

ALTER TABLE equipos_medicos
    ADD CONSTRAINT ck_equipo_medico_estado
    CHECK (estado IN (
        'OPERATIVO', 'FUNCIONANDO', 'AVERIADO', 'EN_MANTENIMIENTO', 'BAJA',
        'DISPONIBLE', 'EN_USO', 'MANTENIMIENTO', 'FUERA_DE_SERVICIO'
    )) NOT VALID;

ALTER TABLE asignaciones_equipos
    ADD COLUMN IF NOT EXISTS tipo_equipo_id varchar(50);

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM asignaciones_equipos a
        JOIN equipos_medicos e ON e.id = a.equipo_id
        WHERE a.activo
          AND COALESCE(a.tipo_equipo_id, e.tipo_equipo_id) IS NOT NULL
        GROUP BY a.movil_id, COALESCE(a.tipo_equipo_id, e.tipo_equipo_id)
        HAVING COUNT(*) > 1
    ) THEN
        RAISE EXCEPTION 'No se puede migrar: hay móviles con varios equipos activos del mismo tipo';
    END IF;
END;
$$;

ALTER TABLE asignaciones_equipos
    ADD CONSTRAINT fk_asignacion_tipo_equipo
    FOREIGN KEY (tipo_equipo_id) REFERENCES tipos_equipos_medicos(codigo) ON DELETE RESTRICT;

ALTER TABLE asignaciones_equipos
    ADD CONSTRAINT fk_asignacion_equipo_tipo
    FOREIGN KEY (equipo_id, tipo_equipo_id)
    REFERENCES equipos_medicos(id, tipo_equipo_id) ON DELETE RESTRICT NOT VALID;

ALTER TABLE asignaciones_equipos
    ADD CONSTRAINT ck_asignacion_equipo_fechas
    CHECK (
        (activo AND fecha_desasignacion IS NULL)
        OR (NOT activo AND fecha_desasignacion IS NOT NULL)
    ) NOT VALID;

ALTER TABLE asignaciones_equipos
    ADD CONSTRAINT ck_asignacion_equipo_fecha_orden
    CHECK (fecha_desasignacion IS NULL OR fecha_desasignacion >= fecha_asignacion) NOT VALID;

CREATE UNIQUE INDEX IF NOT EXISTS uk_asignacion_activa_equipo
    ON asignaciones_equipos (equipo_id)
    WHERE activo;

CREATE UNIQUE INDEX IF NOT EXISTS uk_asignacion_activa_movil_tipo
    ON asignaciones_equipos (movil_id, tipo_equipo_id)
    WHERE activo AND tipo_equipo_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS ix_asignaciones_equipo_historial
    ON asignaciones_equipos (equipo_id, fecha_asignacion DESC);

CREATE UNIQUE INDEX IF NOT EXISTS uk_equipos_medicos_numero_serie
    ON equipos_medicos (numero_serie);

CREATE TABLE IF NOT EXISTS movimientos_equipos (
    id bigserial PRIMARY KEY,
    fecha_hora timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    tipo_movimiento varchar(40) NOT NULL,
    actor_id bigint NOT NULL,
    responsable_id bigint,
    motivo varchar(500) NOT NULL,
    observaciones text,
    movimiento_original_id bigint,
    CONSTRAINT ck_movimiento_equipo_tipo CHECK (
        tipo_movimiento IN (
            'ALTA', 'CLASIFICACION', 'ASIGNACION', 'REEMPLAZO', 'DESASIGNACION',
            'ENVIO_MANTENIMIENTO', 'RECEPCION_MANTENIMIENTO',
            'BAJA', 'CORRECCION'
        )
    ),
    CONSTRAINT fk_movimiento_equipo_actor
        FOREIGN KEY (actor_id) REFERENCES usuarios(id) ON DELETE RESTRICT,
    CONSTRAINT fk_movimiento_equipo_responsable
        FOREIGN KEY (responsable_id) REFERENCES usuarios(id) ON DELETE RESTRICT,
    CONSTRAINT fk_movimiento_equipo_original
        FOREIGN KEY (movimiento_original_id) REFERENCES movimientos_equipos(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS ix_movimientos_equipos_fecha_tipo
    ON movimientos_equipos (fecha_hora DESC, tipo_movimiento);
CREATE INDEX IF NOT EXISTS ix_movimientos_equipos_original
    ON movimientos_equipos (movimiento_original_id)
    WHERE movimiento_original_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS movimientos_equipos_detalle (
    id bigserial PRIMARY KEY,
    movimiento_id bigint NOT NULL,
    equipo_id bigint NOT NULL,
    estado_anterior varchar(40),
    estado_nuevo varchar(40) NOT NULL,
    ubicacion_anterior varchar(40),
    ubicacion_nueva varchar(40) NOT NULL,
    movil_anterior_id bigint,
    movil_nuevo_id bigint,
    CONSTRAINT uk_movimiento_equipo_detalle UNIQUE (movimiento_id, equipo_id),
    CONSTRAINT ck_movimiento_detalle_estado_anterior CHECK (
        estado_anterior IS NULL OR estado_anterior IN (
            'OPERATIVO', 'FUNCIONANDO', 'AVERIADO', 'EN_MANTENIMIENTO', 'BAJA',
            'DISPONIBLE', 'EN_USO', 'MANTENIMIENTO', 'FUERA_DE_SERVICIO'
        )
    ),
    CONSTRAINT ck_movimiento_detalle_estado_nuevo CHECK (
        estado_nuevo IN (
            'OPERATIVO', 'FUNCIONANDO', 'AVERIADO', 'EN_MANTENIMIENTO', 'BAJA',
            'DISPONIBLE', 'EN_USO', 'MANTENIMIENTO', 'FUERA_DE_SERVICIO'
        )
    ),
    CONSTRAINT ck_movimiento_detalle_ubicacion_anterior CHECK (
        ubicacion_anterior IS NULL OR ubicacion_anterior IN (
            'MOVIL', 'DEPOSITO_ENFERMERIA', 'CENTRO_REPARACION', 'RETIRADO_BAJA'
        )
    ),
    CONSTRAINT ck_movimiento_detalle_ubicacion_nueva CHECK (
        ubicacion_nueva IN (
            'MOVIL', 'DEPOSITO_ENFERMERIA', 'CENTRO_REPARACION', 'RETIRADO_BAJA'
        )
    ),
    CONSTRAINT fk_movimiento_detalle_movimiento
        FOREIGN KEY (movimiento_id) REFERENCES movimientos_equipos(id) ON DELETE RESTRICT,
    CONSTRAINT fk_movimiento_detalle_equipo
        FOREIGN KEY (equipo_id) REFERENCES equipos_medicos(id) ON DELETE RESTRICT,
    CONSTRAINT fk_movimiento_detalle_movil_anterior
        FOREIGN KEY (movil_anterior_id) REFERENCES moviles(id) ON DELETE RESTRICT,
    CONSTRAINT fk_movimiento_detalle_movil_nuevo
        FOREIGN KEY (movil_nuevo_id) REFERENCES moviles(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS ix_movimiento_detalle_equipo
    ON movimientos_equipos_detalle (equipo_id, movimiento_id);
CREATE UNIQUE INDEX IF NOT EXISTS uk_movimiento_equipo_detalle
    ON movimientos_equipos_detalle (movimiento_id, equipo_id);

CREATE TABLE IF NOT EXISTS mantenimientos_equipos (
    id bigserial PRIMARY KEY,
    equipo_id bigint NOT NULL,
    tipo varchar(20) NOT NULL,
    fecha_realizacion date NOT NULL,
    responsable_id bigint NOT NULL,
    observaciones text,
    movimiento_id bigint,
    CONSTRAINT ck_mantenimiento_equipo_tipo
        CHECK (tipo IN ('PREVENTIVO', 'CORRECTIVO')),
    CONSTRAINT fk_mantenimiento_equipo
        FOREIGN KEY (equipo_id) REFERENCES equipos_medicos(id) ON DELETE RESTRICT,
    CONSTRAINT fk_mantenimiento_responsable
        FOREIGN KEY (responsable_id) REFERENCES usuarios(id) ON DELETE RESTRICT,
    CONSTRAINT fk_mantenimiento_movimiento
        FOREIGN KEY (movimiento_id) REFERENCES movimientos_equipos(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS ix_mantenimientos_equipo_fecha_tipo
    ON mantenimientos_equipos (equipo_id, fecha_realizacion DESC, tipo);
CREATE INDEX IF NOT EXISTS ix_mantenimientos_movimiento
    ON mantenimientos_equipos (movimiento_id)
    WHERE movimiento_id IS NOT NULL;

ALTER TABLE control_movil_item
    ADD COLUMN IF NOT EXISTS equipo_medico_id bigint;
ALTER TABLE control_movil_item
    ADD COLUMN IF NOT EXISTS tipo_equipo_snapshot varchar(50);
ALTER TABLE control_movil_item
    ADD COLUMN IF NOT EXISTS numero_serie_snapshot varchar(100);

ALTER TABLE control_movil_item
    ADD CONSTRAINT fk_control_item_equipo_medico
    FOREIGN KEY (equipo_medico_id) REFERENCES equipos_medicos(id) ON DELETE RESTRICT;
ALTER TABLE control_movil_item
    ADD CONSTRAINT fk_control_item_tipo_equipo_snapshot
    FOREIGN KEY (tipo_equipo_snapshot) REFERENCES tipos_equipos_medicos(codigo) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS ix_control_item_equipo_medico
    ON control_movil_item (equipo_medico_id)
    WHERE equipo_medico_id IS NOT NULL;

CREATE OR REPLACE FUNCTION impedir_mutacion_historial_equipos()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE EXCEPTION 'El historial de equipos es inmutable';
END;
$$;

CREATE TRIGGER trg_movimientos_equipos_inmutables
    BEFORE UPDATE OR DELETE ON movimientos_equipos
    FOR EACH ROW EXECUTE FUNCTION impedir_mutacion_historial_equipos();

CREATE TRIGGER trg_movimientos_equipos_detalle_inmutables
    BEFORE UPDATE OR DELETE ON movimientos_equipos_detalle
    FOR EACH ROW EXECUTE FUNCTION impedir_mutacion_historial_equipos();

CREATE TRIGGER trg_mantenimientos_equipos_inmutables
    BEFORE UPDATE OR DELETE ON mantenimientos_equipos
    FOR EACH ROW EXECUTE FUNCTION impedir_mutacion_historial_equipos();
