SET DEFINE OFF;
SET SERVEROUTPUT ON;
SET FEEDBACK ON;
SET ECHO ON;
SET VERIFY OFF;
WHENEVER SQLERROR EXIT SQL.SQLCODE;

PROMPT === Compilando PACKAGE pkg_seguridad_admin ===
@@pkg-seguridad-admin-header.sql
SHOW ERRORS PACKAGE NGAC_USER.pkg_seguridad_admin;

PROMPT === Compilando PACKAGE BODY pkg_seguridad_admin ===
@@pkg-seguridad-admin-body.sql
SHOW ERRORS PACKAGE BODY NGAC_USER.pkg_seguridad_admin;

PROMPT === Estado final del objeto ===
SELECT object_name, object_type, status
FROM user_objects
WHERE object_name = 'PKG_SEGURIDAD_ADMIN'
ORDER BY object_type;

PROMPT === Fin de despliegue ===
