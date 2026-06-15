-- ==========================================
-- ORACLE DATABASE INSTALLATION SCRIPT
-- ==========================================
-- Run this script using SQL*Plus or a similar tool:
-- @00-install.sql

SET ECHO ON;
SET VERIFY ON;

PROMPT Installing Sequences...
@@01-sequences.sql

PROMPT Installing Tables and Constraints...
@@02-tables.sql

PROMPT Installing Indexes...
@@03-indexes.sql

PROMPT Installing Data Inserts...
@@04-data-inserts.sql

PROMPT Installing Triggers...
@@05-triggers.sql

PROMPT Installing NGAC Security Package...
@@06-pkg-seguridad-ngac.sql

PROMPT Installing Admin Security Package...
@@07-pkg-seguridad-admin.sql

PROMPT Installing SAFI Admin Package...
@@08-pkg-safi-admin.sql

PROMPT Resetting Log Sequences...
@@09-reset-logs.sql

PROMPT Installation Complete.
