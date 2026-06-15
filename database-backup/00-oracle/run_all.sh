#!/usr/bin/env bash
set -e
# Ejecuta todos los scripts .sql al iniciar el contenedor Oracle
for sql_file in /container-entrypoint-initdb.d/*.sql; do
  echo "Ejecutando $sql_file..."
  sqlplus / as sysdba @$sql_file
done
