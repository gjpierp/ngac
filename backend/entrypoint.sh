#!/usr/bin/env sh

# Esperar a que Oracle esté listo (máximo 120 intentos, 5 s entre cada uno) usando netcat
MAX_ATTEMPTS=120
attempt=0
HOST=$(echo "$DB_CONNECTION_STRING" | cut -d":" -f1)
PORT=1521
while ! nc -z $HOST $PORT > /dev/null 2>&1; do
  attempt=$((attempt+1))
  if [ $attempt -ge $MAX_ATTEMPTS ]; then
    echo "No se pudo conectar a Oracle después de $MAX_ATTEMPTS intentos. Abortando."
    exit 1
  fi
  echo "Esperando a Oracle... ($attempt/$MAX_ATTEMPTS)"
  sleep 5
done

echo "Oracle está disponible. Continuando con la carga..."

   # Esperar a que el esquema esté creado (archivo .schema_created)
   while [ ! -f /backup/.schema_created ]; do
     echo "Esperando a que se creen las tablas en Oracle..."
     sleep 5
   done

# Ruta del archivo Excel y marca de carga
EXCEL_FILE="/excel/NGACRol - Permisos - Opciones - v2.xlsx"
LOADED_FLAG="/excel/.loaded"

# Si está habilitada la carga automática y no se ha cargado antes
if [ "${LOAD_EXCEL_ON_START}" = "true" ] && [ ! -f "$LOADED_FLAG" ] && [ -f "$EXCEL_FILE" ]; then
  echo "Ejecutando carga de Excel..."
  python3 /usr/src/app/scripts/load_excel_to_oracle.py
  if [ $? -eq 0 ]; then
    echo "Carga completada con éxito. Creando respaldo y marca..."
    mkdir -p /excel/backup
    cp "$EXCEL_FILE" /excel/backup/NGACRol_backup.xlsx
    touch "$LOADED_FLAG"
  else
    echo "Error durante la carga de Excel."
    exit 1
  fi
fi

# Lanzar la aplicación Node.js
exec npm start
