-- MIGRACIÓN: Separar RUT en safi_usuarios
-- 1. Agregar columnas nuevas
ALTER TABLE safi_usuarios ADD (rut_numero VARCHAR2(10), rut_dv CHAR(1));

-- 2. Migrar datos existentes (asume formato rut: '12345678-9' o similar)
UPDATE safi_usuarios
   SET rut_numero = REGEXP_REPLACE(rut, '[^0-9]', ''),
       rut_dv = SUBSTR(rut, -1, 1);

-- 3. (Opcional) Eliminar columna antigua después de verificar migración
-- ALTER TABLE safi_usuarios DROP COLUMN rut;

-- 4. (Opcional) Crear índice único si aplica
-- CREATE UNIQUE INDEX idx_safi_usuarios_rut_numero_dv ON safi_usuarios(rut_numero, rut_dv);

-- NOTA: Revisar que todos los RUT estén en formato correcto antes de ejecutar el update.
