-- Datos de demostracion para Equipos Medicos.
-- Solo INSERT: no actualiza ni elimina equipos, asignaciones ni eventos existentes.
-- Ejecutar unicamente en la base local de desarrollo sigem_dev despues de aplicar
-- las migraciones V20261109163500 y V20261109175000.
-- La transaccion completa se revierte ante cualquier inconsistencia.

BEGIN;

DO $seed$
DECLARE
    v_actor_id bigint;
    v_actor_nombre text;
    v_responsable_id bigint;
    v_responsable_nombre text;
    v_movil record;
    v_tipo record;
    v_estado text;
    v_ubicacion text;
    v_equipo_id bigint;
    v_movimiento_id bigint;
    v_asignaciones_activas integer;
    v_equipo_creado boolean;
    v_serie text;
    v_fecha_preventivo date;
    v_movil_count integer;
    v_tipo_count integer;
BEGIN
    IF current_database() <> 'sigem_dev' THEN
        RAISE EXCEPTION 'Base actual "%"; este seed solo permite sigem_dev.', current_database();
    END IF;

    IF to_regclass('tipos_equipos_medicos') IS NULL
       OR to_regclass('equipos_medicos') IS NULL
       OR to_regclass('asignaciones_equipos') IS NULL
       OR to_regclass('movimientos_equipos') IS NULL
       OR to_regclass('movimientos_equipos_detalle') IS NULL
       OR to_regclass('mantenimientos_equipos') IS NULL THEN
        RAISE EXCEPTION 'Faltan tablas del modulo. Verifica las migraciones antes de ejecutar el seed.';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = 'movimientos_equipos_detalle'
          AND column_name = 'numero_serie_snapshot'
    ) OR NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = 'mantenimientos_equipos'
          AND column_name = 'actor_id'
    ) THEN
        RAISE EXCEPTION 'Faltan columnas de snapshots/auditoria. Aplica las migraciones antes del seed.';
    END IF;

    SELECT count(*) INTO v_tipo_count
    FROM tipos_equipos_medicos
    WHERE codigo IN ('CARDIODESFIBRILADOR', 'ELECTROCARDIOGRAFO', 'RESPIRADOR');

    IF v_tipo_count <> 3 THEN
        RAISE EXCEPTION 'El catalogo debe contener exactamente los tres tipos permitidos del modulo.';
    END IF;

    SELECT id, concat_ws(' ', nombre, apellido)
      INTO v_actor_id, v_actor_nombre
      FROM usuarios
     WHERE activo
       AND rol IN ('ADM', 'JEF', 'COORD_ENF')
     ORDER BY CASE rol WHEN 'JEF' THEN 1 WHEN 'ADM' THEN 2 ELSE 3 END, id
     LIMIT 1;

    IF v_actor_id IS NULL THEN
        RAISE EXCEPTION 'No hay un usuario activo ADM, JEF o COORD_ENF para registrar auditoria.';
    END IF;

    SELECT id, concat_ws(' ', nombre, apellido)
      INTO v_responsable_id, v_responsable_nombre
      FROM usuarios
     WHERE activo AND disponible AND rol = 'ENF'
     ORDER BY id
     LIMIT 1;

    IF v_responsable_id IS NULL THEN
        RAISE EXCEPTION 'No hay un enfermero activo y disponible para el responsable de los datos demo.';
    END IF;

    SELECT count(*) INTO v_movil_count
    FROM moviles
    WHERE estado_movil = 'OPERATIVO';

    IF v_movil_count = 0 THEN
        RAISE EXCEPTION 'No hay moviles operativos para asignarles los equipos demo.';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM asignaciones_equipos a
        JOIN equipos_medicos e ON e.id = a.equipo_id
        JOIN moviles m ON m.id = a.movil_id
        WHERE a.activo
          AND m.estado_movil = 'OPERATIVO'
          AND (
              coalesce(a.tipo_equipo_id, e.tipo_equipo_id) IS NULL
              OR (a.tipo_equipo_id IS NOT NULL
                  AND a.tipo_equipo_id IS DISTINCT FROM e.tipo_equipo_id)
          )
    ) THEN
        RAISE EXCEPTION 'Hay asignaciones activas sin tipo o con tipos incompatibles en moviles operativos. Clasificalas solo con evidencia antes de continuar.';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM asignaciones_equipos a
        JOIN equipos_medicos e ON e.id = a.equipo_id
        JOIN moviles m ON m.id = a.movil_id
        WHERE a.activo
          AND m.estado_movil = 'OPERATIVO'
          AND e.estado NOT IN ('OPERATIVO', 'EN_USO')
    ) THEN
        RAISE EXCEPTION 'Hay equipos existentes asignados con estado que la vista operativa considera no disponible. Revisa esos registros antes de continuar.';
    END IF;

    FOR v_movil IN
        SELECT id, numero_interno, patente
        FROM moviles
        WHERE estado_movil = 'OPERATIVO'
        ORDER BY numero_interno, id
    LOOP
        FOR v_tipo IN
            SELECT codigo, nombre
            FROM tipos_equipos_medicos
            WHERE codigo IN ('CARDIODESFIBRILADOR', 'ELECTROCARDIOGRAFO', 'RESPIRADOR')
            ORDER BY codigo
        LOOP
            SELECT count(*) INTO v_asignaciones_activas
            FROM asignaciones_equipos a
            JOIN equipos_medicos e ON e.id = a.equipo_id
            WHERE a.movil_id = v_movil.id
              AND a.activo
              AND coalesce(a.tipo_equipo_id, e.tipo_equipo_id) = v_tipo.codigo;

            IF v_asignaciones_activas > 1 THEN
                RAISE EXCEPTION 'El movil % ya tiene mas de una asignacion activa de tipo %.',
                    v_movil.numero_interno, v_tipo.codigo;
            END IF;

            IF v_asignaciones_activas = 0 THEN
                v_serie := format('DEMO-EQM-M%s-%s', v_movil.id, v_tipo.codigo);
                v_equipo_id := NULL;

                INSERT INTO equipos_medicos
                    (nombre, tipo_equipo_id, numero_serie, marca, modelo, estado)
                VALUES
                    (v_tipo.nombre, v_tipo.codigo, v_serie, 'SIGEM-DEMO', 'Equipo de prueba', 'OPERATIVO')
                ON CONFLICT (numero_serie) DO NOTHING
                RETURNING id INTO v_equipo_id;

                v_equipo_creado := v_equipo_id IS NOT NULL;

                IF NOT v_equipo_creado THEN
                    SELECT id INTO v_equipo_id
                    FROM equipos_medicos
                    WHERE numero_serie = v_serie
                      AND tipo_equipo_id = v_tipo.codigo
                      AND marca = 'SIGEM-DEMO'
                      AND estado = 'OPERATIVO';

                    IF v_equipo_id IS NULL THEN
                        RAISE EXCEPTION 'La serie demo % ya existe con datos ajenos al seed; no se modifico.', v_serie;
                    END IF;

                    IF EXISTS (
                        SELECT 1 FROM asignaciones_equipos
                        WHERE equipo_id = v_equipo_id AND activo
                    ) THEN
                        RAISE EXCEPTION 'El equipo demo % ya esta asignado a otro movil.', v_serie;
                    END IF;
                END IF;

                INSERT INTO asignaciones_equipos
                    (equipo_id, tipo_equipo_id, movil_id, coordinador_id,
                     fecha_asignacion, fecha_desasignacion, activo)
                VALUES
                    (v_equipo_id, v_tipo.codigo, v_movil.id, v_actor_id,
                     current_timestamp, NULL, true);

                INSERT INTO movimientos_equipos
                    (fecha_hora, tipo_movimiento, actor_id, responsable_id,
                     actor_nombre_snapshot, responsable_nombre_snapshot, motivo, observaciones)
                VALUES
                    (current_timestamp, 'ASIGNACION', v_actor_id, v_responsable_id,
                     v_actor_nombre, v_responsable_nombre, 'ASIGNACION_DEMO_SIGEM',
                     'Asignacion de demostracion. Serie: ' || v_serie)
                RETURNING id INTO v_movimiento_id;

                INSERT INTO movimientos_equipos_detalle
                    (movimiento_id, equipo_id, tipo_equipo_snapshot, numero_serie_snapshot,
                     marca_snapshot, modelo_snapshot, estado_anterior, estado_nuevo,
                     ubicacion_anterior, ubicacion_nueva, movil_anterior_id, movil_nuevo_id,
                     movil_anterior_nombre_snapshot, movil_nuevo_nombre_snapshot)
                VALUES
                    (v_movimiento_id, v_equipo_id, v_tipo.codigo, v_serie,
                     'SIGEM-DEMO', 'Equipo de prueba', 'OPERATIVO', 'OPERATIVO',
                     'DEPOSITO_ENFERMERIA', 'MOVIL', NULL, v_movil.id, NULL,
                     concat_ws(' · ', v_movil.numero_interno, v_movil.patente));
            END IF;
        END LOOP;
    END LOOP;

    FOR v_tipo IN
        SELECT codigo, nombre
        FROM tipos_equipos_medicos
        WHERE codigo IN ('CARDIODESFIBRILADOR', 'ELECTROCARDIOGRAFO', 'RESPIRADOR')
        ORDER BY codigo
    LOOP
        FOREACH v_estado IN ARRAY ARRAY[
            'FUNCIONANDO', 'DISPONIBLE', 'AVERIADO', 'EN_MANTENIMIENTO', 'BAJA'
        ]
        LOOP
            v_serie := format('DEMO-EQM-X-%s-%s', v_tipo.codigo, v_estado);
            v_equipo_id := NULL;
            v_movimiento_id := NULL;

            v_ubicacion := CASE v_estado
                WHEN 'EN_MANTENIMIENTO' THEN 'CENTRO_REPARACION'
                WHEN 'BAJA' THEN 'RETIRADO_BAJA'
                ELSE 'DEPOSITO_ENFERMERIA'
            END;

            INSERT INTO equipos_medicos
                (nombre, tipo_equipo_id, numero_serie, marca, modelo, estado)
            VALUES
                (v_tipo.nombre, v_tipo.codigo, v_serie, 'SIGEM-DEMO', 'Equipo de prueba', v_estado)
            ON CONFLICT (numero_serie) DO NOTHING
            RETURNING id INTO v_equipo_id;

            v_equipo_creado := v_equipo_id IS NOT NULL;

            IF NOT v_equipo_creado THEN
                SELECT id INTO v_equipo_id
                FROM equipos_medicos
                WHERE numero_serie = v_serie
                  AND tipo_equipo_id = v_tipo.codigo
                  AND marca = 'SIGEM-DEMO'
                  AND estado = v_estado;

                IF v_equipo_id IS NULL THEN
                    RAISE EXCEPTION 'La serie demo % ya existe con datos ajenos al seed; no se modifico.', v_serie;
                END IF;

                IF EXISTS (
                    SELECT 1 FROM asignaciones_equipos
                    WHERE equipo_id = v_equipo_id AND activo
                ) THEN
                    RAISE EXCEPTION 'El equipo extra demo % tiene una asignacion activa; no se modifico.', v_serie;
                END IF;
            ELSE
                IF v_estado = 'DISPONIBLE' THEN
                    v_fecha_preventivo := CASE v_tipo.codigo
                        WHEN 'CARDIODESFIBRILADOR' THEN current_date - interval '1 year 20 days'
                        WHEN 'ELECTROCARDIOGRAFO' THEN current_date - interval '1 year' + interval '15 days'
                        ELSE current_date - interval '6 months'
                    END::date;

                    INSERT INTO mantenimientos_equipos
                        (equipo_id, tipo, fecha_realizacion, responsable_id, actor_id,
                         actor_nombre_snapshot, responsable_nombre_snapshot,
                         tipo_equipo_snapshot, numero_serie_snapshot, marca_snapshot, modelo_snapshot,
                         estado_anterior_snapshot, estado_nuevo_snapshot,
                         ubicacion_anterior_snapshot, ubicacion_nueva_snapshot,
                         movil_id_snapshot, movil_nombre_snapshot, observaciones, movimiento_id)
                    VALUES
                        (v_equipo_id, 'PREVENTIVO', v_fecha_preventivo, v_responsable_id, v_actor_id,
                         v_actor_nombre, v_responsable_nombre, v_tipo.codigo, v_serie,
                         'SIGEM-DEMO', 'Equipo de prueba', 'DISPONIBLE', 'DISPONIBLE',
                         'DEPOSITO_ENFERMERIA', 'DEPOSITO_ENFERMERIA', NULL, NULL,
                         'Mantenimiento preventivo de demostracion.', NULL);
                ELSIF v_estado IN ('AVERIADO', 'EN_MANTENIMIENTO') THEN
                    INSERT INTO mantenimientos_equipos
                        (equipo_id, tipo, fecha_realizacion, responsable_id, actor_id,
                         actor_nombre_snapshot, responsable_nombre_snapshot,
                         tipo_equipo_snapshot, numero_serie_snapshot, marca_snapshot, modelo_snapshot,
                         estado_anterior_snapshot, estado_nuevo_snapshot,
                         ubicacion_anterior_snapshot, ubicacion_nueva_snapshot,
                         movil_id_snapshot, movil_nombre_snapshot, observaciones, movimiento_id)
                    VALUES
                        (v_equipo_id, 'CORRECTIVO', current_date - 3, v_responsable_id, v_actor_id,
                         v_actor_nombre, v_responsable_nombre, v_tipo.codigo, v_serie,
                         'SIGEM-DEMO', 'Equipo de prueba', v_estado, v_estado,
                         v_ubicacion, v_ubicacion, NULL, NULL,
                         'Mantenimiento correctivo de demostracion.', NULL);
                END IF;
            END IF;
        END LOOP;
    END LOOP;

    RAISE NOTICE 'Seed demo completado: se preservaron los registros existentes; se cubrieron % moviles operativos.',
        v_movil_count;
END
$seed$;

COMMIT;
