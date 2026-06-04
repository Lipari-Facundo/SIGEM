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
