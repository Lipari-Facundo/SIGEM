ALTER TABLE control_movil_item
    ADD COLUMN IF NOT EXISTS equipo_no_coincide boolean NOT NULL DEFAULT false;

ALTER TABLE control_movil_item
    ADD COLUMN IF NOT EXISTS equipo_observado varchar(500);

DO $$
DECLARE
    legacy_count integer;
    cardio_count integer;
    ecg_count integer;
    respirador_count integer;
    cardio_id bigint;
    ecg_id bigint;
    respirador_id bigint;
BEGIN
    SELECT COUNT(*) INTO legacy_count
    FROM insumos
    WHERE lower(nombre) = lower('Desfibrilador');

    SELECT COUNT(*) INTO cardio_count
    FROM insumos
    WHERE lower(nombre) = lower('Cardiodesfibrilador');

    IF legacy_count > 1 OR cardio_count > 1
       OR (legacy_count = 1 AND cardio_count = 1) THEN
        RAISE EXCEPTION
            'No se puede renombrar Desfibrilador de forma segura: hay duplicados o ambos nombres; requiere conciliación manual';
    END IF;

    IF legacy_count = 1 THEN
        UPDATE insumos
        SET nombre = 'Cardiodesfibrilador', activo = true
        WHERE lower(nombre) = lower('Desfibrilador');
    ELSIF cardio_count = 0 THEN
        INSERT INTO insumos (nombre, categoria, tipo, unidad_medida, activo)
        VALUES ('Cardiodesfibrilador', 'EQUIPO_MEDICO', 'REUTILIZABLE', 'Unidad', true);
    END IF;

    SELECT COUNT(*) INTO ecg_count
    FROM insumos
    WHERE lower(nombre) = lower('Electrocardiograma');

    IF ecg_count > 1 THEN
        RAISE EXCEPTION 'Hay más de un insumo Electrocardiograma; requiere conciliación manual';
    ELSIF ecg_count = 0 THEN
        INSERT INTO insumos (nombre, categoria, tipo, unidad_medida, activo)
        VALUES ('Electrocardiograma', 'EQUIPO_MEDICO', 'REUTILIZABLE', 'Unidad', true);
    END IF;

    SELECT COUNT(*) INTO respirador_count
    FROM insumos
    WHERE lower(nombre) = lower('Respirador');

    IF respirador_count > 1 THEN
        RAISE EXCEPTION 'Hay más de un insumo Respirador; requiere conciliación manual';
    ELSIF respirador_count = 0 THEN
        INSERT INTO insumos (nombre, categoria, tipo, unidad_medida, activo)
        VALUES ('Respirador', 'EQUIPO_MEDICO', 'REUTILIZABLE', 'Unidad', true);
    END IF;

    SELECT id INTO cardio_id FROM insumos WHERE lower(nombre) = lower('Cardiodesfibrilador');
    SELECT id INTO ecg_id FROM insumos WHERE lower(nombre) = lower('Electrocardiograma');
    SELECT id INTO respirador_id FROM insumos WHERE lower(nombre) = lower('Respirador');

    IF NOT EXISTS (
        SELECT 1 FROM insumos
        WHERE id = cardio_id AND categoria = 'EQUIPO_MEDICO' AND tipo = 'REUTILIZABLE'
    ) OR NOT EXISTS (
        SELECT 1 FROM insumos
        WHERE id = ecg_id AND categoria = 'EQUIPO_MEDICO' AND tipo = 'REUTILIZABLE'
    ) OR NOT EXISTS (
        SELECT 1 FROM insumos
        WHERE id = respirador_id AND categoria = 'EQUIPO_MEDICO' AND tipo = 'REUTILIZABLE'
    ) THEN
        RAISE EXCEPTION
            'Los insumos de equipos médicos deben ser de categoría EQUIPO_MEDICO y tipo REUTILIZABLE';
    END IF;

    UPDATE insumos
    SET activo = true
    WHERE id IN (cardio_id, ecg_id, respirador_id);

    IF NOT EXISTS (SELECT 1 FROM tipos_equipos_medicos WHERE codigo = 'CARDIODESFIBRILADOR')
       OR NOT EXISTS (SELECT 1 FROM tipos_equipos_medicos WHERE codigo = 'ELECTROCARDIOGRAFO')
       OR NOT EXISTS (SELECT 1 FROM tipos_equipos_medicos WHERE codigo = 'RESPIRADOR') THEN
        RAISE EXCEPTION 'Faltan tipos de equipos médicos requeridos; aplicar primero el modelo de Equipos Médicos';
    END IF;

    IF EXISTS (
        SELECT 1 FROM tipos_equipos_medicos
        WHERE codigo = 'CARDIODESFIBRILADOR'
          AND insumo_id IS NOT NULL AND insumo_id <> cardio_id
    ) OR EXISTS (
        SELECT 1 FROM tipos_equipos_medicos
        WHERE codigo = 'ELECTROCARDIOGRAFO'
          AND insumo_id IS NOT NULL AND insumo_id <> ecg_id
    ) OR EXISTS (
        SELECT 1 FROM tipos_equipos_medicos
        WHERE codigo = 'RESPIRADOR'
          AND insumo_id IS NOT NULL AND insumo_id <> respirador_id
    ) OR EXISTS (
        SELECT 1 FROM tipos_equipos_medicos
        WHERE insumo_id IN (cardio_id, ecg_id, respirador_id)
          AND codigo NOT IN ('CARDIODESFIBRILADOR', 'ELECTROCARDIOGRAFO', 'RESPIRADOR')
    ) THEN
        RAISE EXCEPTION 'Hay asociaciones tipo-equipo/insumo incompatibles; requiere conciliación manual';
    END IF;

    UPDATE tipos_equipos_medicos
    SET insumo_id = cardio_id
    WHERE codigo = 'CARDIODESFIBRILADOR';

    UPDATE tipos_equipos_medicos
    SET insumo_id = ecg_id
    WHERE codigo = 'ELECTROCARDIOGRAFO';

    UPDATE tipos_equipos_medicos
    SET insumo_id = respirador_id
    WHERE codigo = 'RESPIRADOR';

    INSERT INTO stock_estandar_movil (tipo_movil, insumo_id, cantidad_recomendada)
    VALUES
        ('AMBULANCIA_UTIM', respirador_id, 1),
        ('AMBULANCIA_TRASLADO', respirador_id, 1),
        ('VEHICULO_APOYO', respirador_id, 1),
        ('OTRO', respirador_id, 1)
    ON CONFLICT (tipo_movil, insumo_id)
    DO UPDATE SET cantidad_recomendada = EXCLUDED.cantidad_recomendada;
END;
$$;
