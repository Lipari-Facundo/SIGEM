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
    present_count integer;
    missing_columns text;
BEGIN
    SELECT COUNT(*)
      INTO present_count
      FROM unnest(expected_tables) AS expected(table_name)
     WHERE to_regclass(format('%I.%I', current_schema(), expected.table_name)) IS NOT NULL;

    IF present_count = 0 THEN
        RETURN;
    END IF;

    IF present_count <> cardinality(expected_tables) THEN
        RAISE EXCEPTION
            'SIGEM base schema is partial: found % of % required tables. No schema changes were made.',
            present_count, cardinality(expected_tables);
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
            'SIGEM base schema is incompatible; missing required columns: %. No schema changes were made.',
            missing_columns;
    END IF;
END;
$$;

CREATE TABLE IF NOT EXISTS usuarios (
    id bigserial PRIMARY KEY,
    username varchar(255) NOT NULL UNIQUE,
    password varchar(255) NOT NULL,
    nombre varchar(255) NOT NULL,
    apellido varchar(255) NOT NULL,
    dni varchar(255) UNIQUE,
    email varchar(255) NOT NULL UNIQUE,
    telefono varchar(255),
    fecha_nacimiento date,
    domicilio varchar(500),
    foto_perfil text,
    rol varchar(50) NOT NULL,
    disponible boolean NOT NULL DEFAULT true,
    activo boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS moviles (
    id bigserial PRIMARY KEY,
    tipo varchar(255) NOT NULL,
    tipo_movil varchar(50) NOT NULL,
    marca varchar(255) NOT NULL,
    modelo varchar(255) NOT NULL,
    patente varchar(255) NOT NULL UNIQUE,
    anio integer NOT NULL,
    numero_interno varchar(255) NOT NULL UNIQUE,
    fecha_registro date NOT NULL,
    base_operativa varchar(255) NOT NULL,
    kilometraje integer,
    kilometraje_actual integer,
    capacidad_pacientes integer,
    observaciones varchar(500),
    estado varchar(50) NOT NULL,
    estado_movil varchar(50) NOT NULL DEFAULT 'OPERATIVO',
    created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp
);

CREATE TABLE IF NOT EXISTS guardias (
    id bigserial PRIMARY KEY,
    enfermero_id bigint NOT NULL REFERENCES usuarios(id),
    movil_id bigint REFERENCES moviles(id),
    tipo_guardia varchar(20) NOT NULL DEFAULT 'MOVIL',
    turno varchar(50) NOT NULL,
    fecha_inicio timestamp NOT NULL,
    fecha_fin timestamp,
    estado varchar(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS incidentes (
    id bigserial PRIMARY KEY,
    titulo varchar(255) NOT NULL,
    descripcion text,
    ubicacion varchar(255) NOT NULL,
    motivo varchar(255) NOT NULL,
    paciente_nombre varchar(255) NOT NULL,
    paciente_dni varchar(255) NOT NULL,
    prioridad varchar(50) NOT NULL,
    numero_incidente bigint NOT NULL DEFAULT 1,
    asignado_a_id bigint REFERENCES usuarios(id),
    creado_por_id bigint REFERENCES usuarios(id),
    movil_id bigint REFERENCES moviles(id),
    fecha_asignacion timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_cierre timestamp,
    fecha_llegada_lugar timestamp,
    motivo_cancelacion text,
    estado varchar(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS notificaciones (
    id bigserial PRIMARY KEY,
    usuario_id bigint NOT NULL REFERENCES usuarios(id),
    incidente_id bigint REFERENCES incidentes(id),
    mensaje text NOT NULL,
    leida boolean NOT NULL DEFAULT false,
    fecha_creacion timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    tipo varchar(50) NOT NULL DEFAULT 'INCIDENTE_ASIGNADO'
);

CREATE TABLE IF NOT EXISTS incidente_historial_asignacion (
    id bigserial PRIMARY KEY,
    incidente_id bigint NOT NULL REFERENCES incidentes(id),
    enfermero_id bigint NOT NULL REFERENCES usuarios(id),
    movil_id bigint REFERENCES moviles(id),
    tipo varchar(50) NOT NULL,
    motivo text,
    fecha timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS insumos (
    id bigserial PRIMARY KEY,
    nombre varchar(255) NOT NULL,
    categoria varchar(50) NOT NULL,
    tipo varchar(50) NOT NULL,
    unidad_medida varchar(100),
    activo boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS stock_estandar_movil (
    id bigserial PRIMARY KEY,
    tipo_movil varchar(50) NOT NULL,
    insumo_id bigint NOT NULL REFERENCES insumos(id),
    cantidad_recomendada integer NOT NULL,
    CONSTRAINT uk_stock_estandar_tipo_insumo UNIQUE (tipo_movil, insumo_id)
);

CREATE TABLE IF NOT EXISTS stock_deposito_central (
    id bigserial PRIMARY KEY,
    insumo_id bigint NOT NULL UNIQUE REFERENCES insumos(id),
    cantidad_actual integer NOT NULL DEFAULT 0,
    cantidad_minima integer NOT NULL DEFAULT 0,
    activo boolean NOT NULL DEFAULT true,
    version bigint NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS movil_insumo (
    id bigserial PRIMARY KEY,
    movil_id bigint NOT NULL REFERENCES moviles(id),
    insumo_id bigint NOT NULL REFERENCES insumos(id),
    cantidad_actual integer NOT NULL DEFAULT 0,
    CONSTRAINT uk_movil_insumo UNIQUE (movil_id, insumo_id)
);

CREATE TABLE IF NOT EXISTS consumo_insumo (
    id bigserial PRIMARY KEY,
    movil_id bigint NOT NULL REFERENCES moviles(id),
    insumo_id bigint NOT NULL REFERENCES insumos(id),
    cantidad integer NOT NULL,
    observaciones text,
    enfermero_id bigint NOT NULL REFERENCES usuarios(id),
    incidente_id bigint REFERENCES incidentes(id),
    lote_id varchar(64) NOT NULL,
    fecha timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS solicitud_reposicion (
    id bigserial PRIMARY KEY,
    movil_id bigint REFERENCES moviles(id),
    enfermero_id bigint NOT NULL REFERENCES usuarios(id),
    fecha timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    estado varchar(50) NOT NULL DEFAULT 'PENDIENTE',
    observaciones text,
    motivo_resolucion varchar(500),
    usuario_ultima_gestion_id bigint REFERENCES usuarios(id),
    fecha_ultima_gestion timestamp
);

CREATE TABLE IF NOT EXISTS solicitud_reposicion_item (
    id bigserial PRIMARY KEY,
    solicitud_id bigint NOT NULL REFERENCES solicitud_reposicion(id),
    insumo_id bigint NOT NULL REFERENCES insumos(id),
    cantidad_solicitada integer NOT NULL,
    cantidad_entregada integer NOT NULL DEFAULT 0,
    cantidad_actual_al_momento integer NOT NULL,
    motivo_cambio varchar(40),
    detalle_cambio varchar(500)
);

CREATE TABLE IF NOT EXISTS movimiento_deposito_central (
    id bigserial PRIMARY KEY,
    stock_id bigint NOT NULL REFERENCES stock_deposito_central(id),
    usuario_id bigint NOT NULL REFERENCES usuarios(id),
    solicitud_id bigint REFERENCES solicitud_reposicion(id),
    tipo varchar(40) NOT NULL,
    cantidad integer NOT NULL,
    cantidad_anterior integer NOT NULL,
    cantidad_nueva integer NOT NULL,
    motivo varchar(500) NOT NULL,
    fecha timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS control_movil (
    id bigserial PRIMARY KEY,
    movil_id bigint NOT NULL REFERENCES moviles(id),
    guardia_id bigint NOT NULL REFERENCES guardias(id),
    enfermero_id bigint NOT NULL REFERENCES usuarios(id),
    fecha timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resultado varchar(50) NOT NULL,
    observaciones text,
    total_faltantes integer NOT NULL DEFAULT 0,
    total_equipos_con_novedad integer NOT NULL DEFAULT 0,
    total_discrepancias_sistema integer NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS control_movil_item (
    id bigserial PRIMARY KEY,
    control_id bigint NOT NULL REFERENCES control_movil(id),
    insumo_id bigint NOT NULL REFERENCES insumos(id),
    cantidad_recomendada integer NOT NULL,
    cantidad_sistema integer NOT NULL DEFAULT 0,
    cantidad_contada integer NOT NULL,
    estado_equipo varchar(50),
    observacion varchar(500),
    numero_serie varchar(100),
    test_ok boolean
);

CREATE TABLE IF NOT EXISTS equipos_medicos (
    id bigserial PRIMARY KEY,
    nombre varchar(255) NOT NULL,
    numero_serie varchar(100) NOT NULL UNIQUE,
    marca varchar(100),
    modelo varchar(100),
    estado varchar(50) NOT NULL DEFAULT 'DISPONIBLE'
);

CREATE TABLE IF NOT EXISTS asignaciones_equipos (
    id bigserial PRIMARY KEY,
    equipo_id bigint NOT NULL REFERENCES equipos_medicos(id),
    movil_id bigint NOT NULL REFERENCES moviles(id),
    coordinador_id bigint NOT NULL REFERENCES usuarios(id),
    fecha_asignacion timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_desasignacion timestamp,
    activo boolean NOT NULL DEFAULT true
);
