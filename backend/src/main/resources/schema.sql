ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS telefono varchar(255);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS fecha_nacimiento date;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS domicilio varchar(500);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS foto_perfil text;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS disponible boolean NOT NULL DEFAULT true;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS activo boolean NOT NULL DEFAULT true;

CREATE TABLE IF NOT EXISTS guardias (
    id serial PRIMARY KEY,
    enfermero_id bigint NOT NULL,
    movil_id bigint NOT NULL,
    turno varchar(50) NOT NULL,
    fecha_inicio timestamp NOT NULL,
    fecha_fin timestamp,
    estado varchar(50) NOT NULL,
    CONSTRAINT fk_guardia_enfermero FOREIGN KEY (enfermero_id) REFERENCES usuarios(id),
    CONSTRAINT fk_guardia_movil FOREIGN KEY (movil_id) REFERENCES moviles(id)
);

CREATE TABLE IF NOT EXISTS incidentes (
    id serial PRIMARY KEY,
    titulo varchar(255) NOT NULL,
    descripcion text,
    ubicacion varchar(255) NOT NULL,
    motivo varchar(255) NOT NULL,
    paciente_nombre varchar(255) NOT NULL,
    paciente_dni varchar(255) NOT NULL,
    prioridad varchar(50) NOT NULL,
    numero_incidente bigint NOT NULL DEFAULT 1,
    asignado_a_id bigint,
    movil_id bigint,
    fecha_asignacion timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_cierre timestamp,
    estado varchar(50) NOT NULL,
    CONSTRAINT fk_incidente_asignado FOREIGN KEY (asignado_a_id) REFERENCES usuarios(id),
    CONSTRAINT fk_incidente_movil FOREIGN KEY (movil_id) REFERENCES moviles(id)
);

ALTER TABLE incidentes ADD COLUMN IF NOT EXISTS ubicacion varchar(255);
ALTER TABLE incidentes ADD COLUMN IF NOT EXISTS motivo varchar(255);
ALTER TABLE incidentes ADD COLUMN IF NOT EXISTS paciente_nombre varchar(255);
ALTER TABLE incidentes ADD COLUMN IF NOT EXISTS paciente_dni varchar(255);
ALTER TABLE incidentes ADD COLUMN IF NOT EXISTS prioridad varchar(50);
ALTER TABLE incidentes ADD COLUMN IF NOT EXISTS numero_incidente bigint NOT NULL DEFAULT 1;
ALTER TABLE incidentes ALTER COLUMN numero_incidente TYPE bigint USING NULLIF(numero_incidente, '')::bigint;
ALTER TABLE incidentes ALTER COLUMN fecha DROP NOT NULL;
ALTER TABLE incidentes ALTER COLUMN hora DROP NOT NULL;
ALTER TABLE incidentes ALTER COLUMN lugar DROP NOT NULL;
ALTER TABLE incidentes ALTER COLUMN direccion DROP NOT NULL;
ALTER TABLE incidentes ALTER COLUMN barrio DROP NOT NULL;
ALTER TABLE incidentes ALTER COLUMN localidad DROP NOT NULL;
ALTER TABLE incidentes ALTER COLUMN edad DROP NOT NULL;
ALTER TABLE incidentes ALTER COLUMN sexo DROP NOT NULL;
ALTER TABLE incidentes ALTER COLUMN telefono DROP NOT NULL;
ALTER TABLE incidentes ALTER COLUMN tipo_incidente DROP NOT NULL;
ALTER TABLE incidentes ALTER COLUMN usuario_creador_id DROP NOT NULL;
ALTER TABLE incidentes ADD COLUMN IF NOT EXISTS fecha_llegada_lugar timestamp;
ALTER TABLE incidentes ADD COLUMN IF NOT EXISTS motivo_cancelacion text;
ALTER TABLE incidentes DROP CONSTRAINT IF EXISTS incidentes_estado_check;
ALTER TABLE incidentes ADD CONSTRAINT incidentes_estado_check
    CHECK (estado IN ('PENDIENTE', 'PENDIENTE_REASIGNACION', 'EN_PROCESO', 'RECHAZADO', 'FINALIZADO', 'CANCELADO'));

CREATE TABLE IF NOT EXISTS notificaciones (
    id serial PRIMARY KEY,
    usuario_id bigint NOT NULL,
    incidente_id bigint NOT NULL,
    mensaje text NOT NULL,
    leida boolean NOT NULL DEFAULT false,
    fecha_creacion timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notificacion_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    CONSTRAINT fk_notificacion_incidente FOREIGN KEY (incidente_id) REFERENCES incidentes(id)
);

ALTER TABLE notificaciones ADD COLUMN IF NOT EXISTS mensaje text;
ALTER TABLE notificaciones ADD COLUMN IF NOT EXISTS leida boolean NOT NULL DEFAULT false;
ALTER TABLE notificaciones ADD COLUMN IF NOT EXISTS fecha_creacion timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE notificaciones ADD COLUMN IF NOT EXISTS tipo varchar(50) NOT NULL DEFAULT 'INCIDENTE_ASIGNADO';

CREATE TABLE IF NOT EXISTS incidente_historial_asignacion (
    id serial PRIMARY KEY,
    incidente_id bigint NOT NULL,
    enfermero_id bigint NOT NULL,
    movil_id bigint,
    tipo varchar(50) NOT NULL,
    motivo text,
    fecha timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_historial_incidente FOREIGN KEY (incidente_id) REFERENCES incidentes(id),
    CONSTRAINT fk_historial_enfermero FOREIGN KEY (enfermero_id) REFERENCES usuarios(id),
    CONSTRAINT fk_historial_movil FOREIGN KEY (movil_id) REFERENCES moviles(id)
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
    insumo_id bigint NOT NULL,
    cantidad_recomendada integer NOT NULL,
    CONSTRAINT uk_stock_estandar_tipo_insumo UNIQUE (tipo_movil, insumo_id),
    CONSTRAINT fk_stock_estandar_insumo FOREIGN KEY (insumo_id) REFERENCES insumos(id)
);

CREATE TABLE IF NOT EXISTS movil_insumo (
    id bigserial PRIMARY KEY,
    movil_id bigint NOT NULL,
    insumo_id bigint NOT NULL,
    cantidad_actual integer NOT NULL DEFAULT 0,
    CONSTRAINT uk_movil_insumo UNIQUE (movil_id, insumo_id),
    CONSTRAINT fk_movil_insumo_movil FOREIGN KEY (movil_id) REFERENCES moviles(id),
    CONSTRAINT fk_movil_insumo_insumo FOREIGN KEY (insumo_id) REFERENCES insumos(id)
);

CREATE TABLE IF NOT EXISTS consumo_insumo (
    id serial PRIMARY KEY,
    movil_id bigint NOT NULL REFERENCES moviles(id),
    insumo_id bigint NOT NULL REFERENCES insumos(id),
    cantidad integer NOT NULL,
    enfermero_id bigint NOT NULL REFERENCES usuarios(id),
    incidente_id bigint REFERENCES incidentes(id),
    lote_id varchar(64) NOT NULL,
    fecha timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS solicitud_reposicion (
    id serial PRIMARY KEY,
    movil_id bigint NOT NULL REFERENCES moviles(id),
    enfermero_id bigint NOT NULL REFERENCES usuarios(id),
    fecha timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    estado varchar(50) NOT NULL DEFAULT 'PENDIENTE',
    observaciones text
);

CREATE TABLE IF NOT EXISTS solicitud_reposicion_item (
    id serial PRIMARY KEY,
    solicitud_id bigint NOT NULL REFERENCES solicitud_reposicion(id),
    insumo_id bigint NOT NULL REFERENCES insumos(id),
    cantidad_solicitada integer NOT NULL,
    cantidad_actual_al_momento integer NOT NULL
);
