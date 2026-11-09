ALTER TABLE movimientos_equipos
    ADD COLUMN IF NOT EXISTS actor_nombre_snapshot varchar(255);
ALTER TABLE movimientos_equipos
    ADD COLUMN IF NOT EXISTS responsable_nombre_snapshot varchar(255);

ALTER TABLE movimientos_equipos_detalle
    ADD COLUMN IF NOT EXISTS tipo_equipo_snapshot varchar(50);
ALTER TABLE movimientos_equipos_detalle
    ADD COLUMN IF NOT EXISTS numero_serie_snapshot varchar(100);
ALTER TABLE movimientos_equipos_detalle
    ADD COLUMN IF NOT EXISTS marca_snapshot varchar(100);
ALTER TABLE movimientos_equipos_detalle
    ADD COLUMN IF NOT EXISTS modelo_snapshot varchar(100);
ALTER TABLE movimientos_equipos_detalle
    ADD COLUMN IF NOT EXISTS movil_anterior_nombre_snapshot varchar(255);
ALTER TABLE movimientos_equipos_detalle
    ADD COLUMN IF NOT EXISTS movil_nuevo_nombre_snapshot varchar(255);

ALTER TABLE mantenimientos_equipos
    ADD COLUMN IF NOT EXISTS actor_id bigint;
ALTER TABLE mantenimientos_equipos
    ADD COLUMN IF NOT EXISTS actor_nombre_snapshot varchar(255);
ALTER TABLE mantenimientos_equipos
    ADD COLUMN IF NOT EXISTS responsable_nombre_snapshot varchar(255);
ALTER TABLE mantenimientos_equipos
    ADD COLUMN IF NOT EXISTS tipo_equipo_snapshot varchar(50);
ALTER TABLE mantenimientos_equipos
    ADD COLUMN IF NOT EXISTS numero_serie_snapshot varchar(100);
ALTER TABLE mantenimientos_equipos
    ADD COLUMN IF NOT EXISTS marca_snapshot varchar(100);
ALTER TABLE mantenimientos_equipos
    ADD COLUMN IF NOT EXISTS modelo_snapshot varchar(100);
ALTER TABLE mantenimientos_equipos
    ADD COLUMN IF NOT EXISTS estado_anterior_snapshot varchar(40);
ALTER TABLE mantenimientos_equipos
    ADD COLUMN IF NOT EXISTS estado_nuevo_snapshot varchar(40);
ALTER TABLE mantenimientos_equipos
    ADD COLUMN IF NOT EXISTS ubicacion_anterior_snapshot varchar(40);
ALTER TABLE mantenimientos_equipos
    ADD COLUMN IF NOT EXISTS ubicacion_nueva_snapshot varchar(40);
ALTER TABLE mantenimientos_equipos
    ADD COLUMN IF NOT EXISTS movil_id_snapshot bigint;
ALTER TABLE mantenimientos_equipos
    ADD COLUMN IF NOT EXISTS movil_nombre_snapshot varchar(255);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_mantenimiento_actor'
    ) THEN
        ALTER TABLE mantenimientos_equipos
            ADD CONSTRAINT fk_mantenimiento_actor
            FOREIGN KEY (actor_id) REFERENCES usuarios(id) ON DELETE RESTRICT;
    END IF;
END;
$$;

CREATE OR REPLACE VIEW vw_asignaciones_equipos_activas_sin_tipo AS
SELECT a.id AS asignacion_id, a.equipo_id, a.movil_id, a.tipo_equipo_id,
       e.tipo_equipo_id AS tipo_equipo_del_equipo
FROM asignaciones_equipos a
JOIN equipos_medicos e ON e.id = a.equipo_id
WHERE a.activo
  AND (a.tipo_equipo_id IS NULL OR a.tipo_equipo_id IS DISTINCT FROM e.tipo_equipo_id);

CREATE OR REPLACE FUNCTION validar_asignacion_equipo_medico()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    equipo_tipo varchar(50);
    equipo_estado varchar(40);
BEGIN
    IF TG_TABLE_NAME = 'equipos_medicos' THEN
        IF NEW.estado = 'BAJA'
           AND EXISTS (
               SELECT 1 FROM asignaciones_equipos
               WHERE equipo_id = NEW.id AND activo
           ) THEN
            RAISE EXCEPTION 'No se puede dar de baja un equipo con asignación activa';
        END IF;
        RETURN NEW;
    END IF;

    IF NEW.activo THEN
        IF NEW.tipo_equipo_id IS NULL THEN
            RAISE EXCEPTION 'Una asignación activa nueva requiere tipo de equipo clasificado';
        END IF;

        SELECT tipo_equipo_id, estado
          INTO equipo_tipo, equipo_estado
          FROM equipos_medicos
         WHERE id = NEW.equipo_id
         FOR UPDATE;

        IF equipo_estado = 'BAJA' THEN
            RAISE EXCEPTION 'No se puede asignar un equipo dado de baja';
        END IF;
        IF equipo_tipo IS DISTINCT FROM NEW.tipo_equipo_id THEN
            RAISE EXCEPTION 'El tipo de asignación no coincide con el tipo del equipo';
        END IF;
        IF EXISTS (
            SELECT 1
              FROM asignaciones_equipos a
              LEFT JOIN equipos_medicos e ON e.id = a.equipo_id
             WHERE a.activo
               AND a.movil_id = NEW.movil_id
               AND a.id IS DISTINCT FROM NEW.id
               AND COALESCE(a.tipo_equipo_id, e.tipo_equipo_id) IS NULL
        ) THEN
            RAISE EXCEPTION 'El móvil tiene una asignación activa sin tipo que requiere clasificación';
        END IF;
        IF EXISTS (
            SELECT 1
              FROM asignaciones_equipos a
              LEFT JOIN equipos_medicos e ON e.id = a.equipo_id
             WHERE a.activo
               AND a.movil_id = NEW.movil_id
               AND a.id IS DISTINCT FROM NEW.id
               AND COALESCE(a.tipo_equipo_id, e.tipo_equipo_id) = NEW.tipo_equipo_id
        ) THEN
            RAISE EXCEPTION 'El móvil ya tiene un equipo activo de ese tipo';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validar_asignacion_equipo_medico ON asignaciones_equipos;
CREATE TRIGGER trg_validar_asignacion_equipo_medico
    BEFORE INSERT OR UPDATE ON asignaciones_equipos
    FOR EACH ROW EXECUTE FUNCTION validar_asignacion_equipo_medico();

DROP TRIGGER IF EXISTS trg_impedir_baja_equipo_asignado ON equipos_medicos;
CREATE TRIGGER trg_impedir_baja_equipo_asignado
    BEFORE UPDATE OF estado ON equipos_medicos
    FOR EACH ROW EXECUTE FUNCTION validar_asignacion_equipo_medico();
