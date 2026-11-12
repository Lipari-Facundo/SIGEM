DO $$
DECLARE
    expected_tables text[] := ARRAY[
        'usuarios', 'moviles', 'guardias', 'incidentes', 'notificaciones',
        'incidente_historial_asignacion', 'insumos', 'stock_estandar_movil',
        'stock_deposito_central', 'movil_insumo', 'consumo_insumo',
        'solicitud_reposicion', 'solicitud_reposicion_item',
        'movimiento_deposito_central', 'control_movil', 'control_movil_item',
        'equipos_medicos', 'asignaciones_equipos'
    ];
    expected_columns text[][] := ARRAY[
        ['usuarios', 'id'], ['usuarios', 'username'], ['usuarios', 'password'],
        ['usuarios', 'nombre'], ['usuarios', 'apellido'], ['usuarios', 'dni'],
        ['usuarios', 'email'], ['usuarios', 'rol'], ['usuarios', 'disponible'], ['usuarios', 'activo'],
        ['moviles', 'id'], ['moviles', 'tipo'], ['moviles', 'tipo_movil'], ['moviles', 'marca'],
        ['moviles', 'modelo'], ['moviles', 'patente'], ['moviles', 'anio'],
        ['moviles', 'numero_interno'], ['moviles', 'fecha_registro'], ['moviles', 'base_operativa'],
        ['moviles', 'kilometraje'], ['moviles', 'kilometraje_actual'], ['moviles', 'capacidad_pacientes'],
        ['moviles', 'observaciones'], ['moviles', 'estado'], ['moviles', 'estado_movil'],
        ['moviles', 'created_at'], ['moviles', 'updated_at'],
        ['guardias', 'id'], ['guardias', 'enfermero_id'], ['guardias', 'movil_id'],
        ['guardias', 'tipo_guardia'], ['guardias', 'turno'], ['guardias', 'fecha_inicio'],
        ['guardias', 'fecha_fin'], ['guardias', 'estado'],
        ['incidentes', 'id'], ['incidentes', 'titulo'], ['incidentes', 'descripcion'],
        ['incidentes', 'ubicacion'], ['incidentes', 'motivo'], ['incidentes', 'paciente_nombre'],
        ['incidentes', 'paciente_dni'], ['incidentes', 'prioridad'], ['incidentes', 'numero_incidente'],
        ['incidentes', 'asignado_a_id'], ['incidentes', 'creado_por_id'], ['incidentes', 'movil_id'],
        ['incidentes', 'fecha_asignacion'], ['incidentes', 'fecha_cierre'],
        ['incidentes', 'fecha_llegada_lugar'], ['incidentes', 'motivo_cancelacion'], ['incidentes', 'estado'],
        ['notificaciones', 'id'], ['notificaciones', 'usuario_id'], ['notificaciones', 'incidente_id'],
        ['notificaciones', 'mensaje'], ['notificaciones', 'leida'], ['notificaciones', 'fecha_creacion'],
        ['notificaciones', 'tipo'],
        ['incidente_historial_asignacion', 'id'], ['incidente_historial_asignacion', 'incidente_id'],
        ['incidente_historial_asignacion', 'enfermero_id'], ['incidente_historial_asignacion', 'movil_id'],
        ['incidente_historial_asignacion', 'tipo'], ['incidente_historial_asignacion', 'motivo'],
        ['incidente_historial_asignacion', 'fecha'],
        ['insumos', 'id'], ['insumos', 'nombre'], ['insumos', 'categoria'], ['insumos', 'tipo'],
        ['insumos', 'unidad_medida'], ['insumos', 'activo'],
        ['stock_estandar_movil', 'id'], ['stock_estandar_movil', 'tipo_movil'],
        ['stock_estandar_movil', 'insumo_id'], ['stock_estandar_movil', 'cantidad_recomendada'],
        ['stock_deposito_central', 'id'], ['stock_deposito_central', 'insumo_id'],
        ['stock_deposito_central', 'cantidad_actual'], ['stock_deposito_central', 'cantidad_minima'],
        ['stock_deposito_central', 'activo'], ['stock_deposito_central', 'version'],
        ['movil_insumo', 'id'], ['movil_insumo', 'movil_id'], ['movil_insumo', 'insumo_id'],
        ['movil_insumo', 'cantidad_actual'],
        ['consumo_insumo', 'id'], ['consumo_insumo', 'movil_id'], ['consumo_insumo', 'insumo_id'],
        ['consumo_insumo', 'cantidad'], ['consumo_insumo', 'enfermero_id'], ['consumo_insumo', 'incidente_id'],
        ['consumo_insumo', 'lote_id'], ['consumo_insumo', 'fecha'],
        ['solicitud_reposicion', 'id'], ['solicitud_reposicion', 'movil_id'],
        ['solicitud_reposicion', 'enfermero_id'], ['solicitud_reposicion', 'fecha'],
        ['solicitud_reposicion', 'estado'],
        ['solicitud_reposicion_item', 'id'], ['solicitud_reposicion_item', 'solicitud_id'],
        ['solicitud_reposicion_item', 'insumo_id'], ['solicitud_reposicion_item', 'cantidad_solicitada'],
        ['solicitud_reposicion_item', 'cantidad_entregada'], ['solicitud_reposicion_item', 'cantidad_actual_al_momento'],
        ['movimiento_deposito_central', 'id'], ['movimiento_deposito_central', 'stock_id'],
        ['movimiento_deposito_central', 'usuario_id'], ['movimiento_deposito_central', 'solicitud_id'],
        ['movimiento_deposito_central', 'tipo'], ['movimiento_deposito_central', 'cantidad'],
        ['movimiento_deposito_central', 'cantidad_anterior'], ['movimiento_deposito_central', 'cantidad_nueva'],
        ['movimiento_deposito_central', 'motivo'], ['movimiento_deposito_central', 'fecha'],
        ['control_movil', 'id'], ['control_movil', 'movil_id'], ['control_movil', 'guardia_id'],
        ['control_movil', 'enfermero_id'], ['control_movil', 'fecha'], ['control_movil', 'resultado'],
        ['control_movil', 'observaciones'], ['control_movil', 'total_faltantes'],
        ['control_movil', 'total_equipos_con_novedad'], ['control_movil', 'total_discrepancias_sistema'],
        ['control_movil_item', 'id'], ['control_movil_item', 'control_id'],
        ['control_movil_item', 'insumo_id'], ['control_movil_item', 'cantidad_recomendada'],
        ['control_movil_item', 'cantidad_sistema'], ['control_movil_item', 'cantidad_contada'],
        ['control_movil_item', 'estado_equipo'], ['control_movil_item', 'observacion'],
        ['control_movil_item', 'numero_serie'], ['control_movil_item', 'test_ok'],
        ['equipos_medicos', 'id'], ['equipos_medicos', 'nombre'], ['equipos_medicos', 'numero_serie'],
        ['equipos_medicos', 'marca'], ['equipos_medicos', 'modelo'], ['equipos_medicos', 'estado'],
        ['asignaciones_equipos', 'id'], ['asignaciones_equipos', 'equipo_id'],
        ['asignaciones_equipos', 'movil_id'], ['asignaciones_equipos', 'coordinador_id'],
        ['asignaciones_equipos', 'fecha_asignacion'], ['asignaciones_equipos', 'fecha_desasignacion'],
        ['asignaciones_equipos', 'activo']
    ];
    missing_tables text;
    missing_columns text;
BEGIN
    SELECT string_agg(expected.table_name, ', ')
      INTO missing_tables
      FROM unnest(expected_tables) AS expected(table_name)
     WHERE to_regclass(format('%I.%I', current_schema(), expected.table_name)) IS NULL;

    IF missing_tables IS NOT NULL THEN
        RAISE EXCEPTION
            'Baselined SIGEM schema is incomplete; missing required tables: %.',
            missing_tables;
    END IF;

    SELECT string_agg(
               format('%I.%I', expected_columns[column_index][1], expected_columns[column_index][2]),
               ', '
           )
      INTO missing_columns
      FROM generate_subscripts(expected_columns, 1) AS column_index
     WHERE NOT EXISTS (
         SELECT 1
           FROM information_schema.columns column_info
          WHERE column_info.table_schema = current_schema()
            AND column_info.table_name = expected_columns[column_index][1]
            AND column_info.column_name = expected_columns[column_index][2]
     );

    IF missing_columns IS NOT NULL THEN
        RAISE EXCEPTION
            'Baselined SIGEM schema is incompatible; missing required columns: %.',
            missing_columns;
    END IF;
END;
$$;
