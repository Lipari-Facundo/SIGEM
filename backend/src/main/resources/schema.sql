ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS telefono varchar(255);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS fecha_nacimiento date;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS domicilio varchar(500);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS foto_perfil text;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS disponible boolean NOT NULL DEFAULT true;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS activo boolean NOT NULL DEFAULT true;
