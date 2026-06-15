# SAFI-NGAC Database Schema Backup & Adaptation (Multi-Engine)

This repository contains the complete schema definition and procedures of the SAFI-NGAC database (originally implemented in Oracle 21c XE), adapted for the following 7 database engines:

1. **Oracle** (Original clean backup)
2. **SQL Server** (Stored Procedures & Functions adaptation)
3. **PostgreSQL** (PL/pgSQL functions & schema grouping adaptation)
4. **MySQL** (InnoDB Stored Procedures adaptation)
5. **MariaDB** (Stored Procedures & Sequence adaptation)
6. **MongoDB (NoSQL)** (JSON Schema Validation & Collection Design)
7. **Neo4j (Graph DB)** (Cypher native traversal & graph relationship mapping)

---

## Directory Structure

```text
database-backup/
├── README.md                           # General documentation and mapping guide
├── 00-oracle/                          # Original Oracle DDL (Cleaned of proprietary storage settings)
│   ├── 01-sequences.sql
│   ├── 02-tables.sql
│   ├── 03-indexes.sql
│   ├── 04-triggers.sql
│   ├── 05-pkg-seguridad-ngac.sql
│   ├── 06-pkg-seguridad-admin.sql
│   └── 07-pkg-safi-admin.sql
├── 01-sqlserver/                       # SQL Server adaptation
│   ├── 01-tables.sql
│   ├── 02-triggers.sql
│   ├── 03-procedures-ngac.sql
│   ├── 04-procedures-admin.sql
│   └── 05-procedures-safi.sql
├── 02-postgresql/                      # PostgreSQL adaptation
│   ├── 01-tables.sql
│   ├── 02-triggers.sql
│   ├── 03-functions-ngac.sql
│   ├── 04-functions-admin.sql
│   └── 05-functions-safi.sql
├── 03-mysql/                           # MySQL adaptation
│   ├── 01-tables.sql
│   ├── 02-triggers.sql
│   ├── 03-procedures-ngac.sql
│   ├── 04-procedures-admin.sql
│   └── 05-procedures-safi.sql
├── 04-mariadb/                         # MariaDB adaptation
│   ├── 01-tables.sql
│   ├── 02-triggers.sql
│   ├── 03-procedures-ngac.sql
│   ├── 04-procedures-admin.sql
│   └── 05-procedures-safi.sql
├── 05-nosql-mongodb/                   # MongoDB NoSQL adaptation
│   ├── 01-collections.js
│   ├── 02-indexes.js
│   └── 03-seed-data.js
└── 06-neo4j-graph/                     # Neo4j Graph DB adaptation
    ├── 01-constraints-indexes.cypher
    ├── 02-node-labels.cypher
    ├── 03-relationships.cypher
    ├── 04-queries-ngac.cypher
    ├── 05-queries-admin.cypher
    └── 06-queries-safi.cypher
```

---

## Data Type Mappings

| Oracle | SQL Server | PostgreSQL | MySQL/MariaDB | MongoDB | Neo4j |
|--------|-----------|------------|---------------|---------|-------|
| `NUMBER` | `BIGINT` / `INT` | `BIGINT` / `INTEGER` | `BIGINT` / `INT` | `NumberLong` | `Integer` / `Float` |
| `NUMBER(1,0)` | `BIT` | `SMALLINT` | `TINYINT(1)` | `Boolean` | `Boolean` |
| `VARCHAR2(n)` | `NVARCHAR(n)` | `VARCHAR(n)` | `VARCHAR(n)` | `String` | `String` |
| `DATE` | `DATETIME2` | `TIMESTAMP` | `DATETIME` | `Date` | `DateTime` |
| `TIMESTAMP(6)` | `DATETIME2(6)` | `TIMESTAMP(6)` | `DATETIME(6)` | `Date` | `DateTime` |
| `CLOB` | `NVARCHAR(MAX)` | `TEXT` | `LONGTEXT` | `String` | `String` |
| `SEQUENCE` | `IDENTITY` | `SERIAL`/`SEQUENCE` | `AUTO_INCREMENT` | `ObjectId` | `apoc.uuid` / Auto |

---

## Adaptation Strategies

### 1. Procedures & Packages
Oracle packages group functions and procedures. Other systems handle this differently:
- **SQL Server, MySQL, MariaDB**: Grouped by prefixing procedure names (`ngac_fn_verificar_acceso`, `admin_p_upsert_nodo`, etc.).
- **PostgreSQL**: Kept inside a dedicated schema `ngac` for clean namespaces.
- **MongoDB**: Code logic belongs in the application layer (JavaScript/Node.js). A sample adapter file is provided explaining how to perform queries.
- **Neo4j**: Procedural logic is replaced by native Cypher Graph Traversal.

### 2. Hierarchies & Graph Traversals
NGAC relies heavily on checking path existence between nodes in a Directed Acyclic Graph (DAG).
- **Relational Databases (Oracle, PG, SQL Server)**: Done using Recursive Common Table Expressions (CTE) with `CONNECT BY` or `WITH RECURSIVE`.
- **MySQL (older versions) / MariaDB**: Transformed to recursive loops inside Stored Procedures.
- **Neo4j**: Run using native Cypher traversals: `(usr)-[:ASIGNACION*]->(ua)-[:PERMITE]->(oa)<-[:ASIGNACION*]-(obj)`. This is highly performant and readable.

### 3. Autoincrement PKs
- **Oracle / PostgreSQL / MariaDB**: Native sequences.
- **SQL Server**: `IDENTITY(1,1)`.
- **MySQL**: `AUTO_INCREMENT`.
- **MongoDB**: Native `_id` `ObjectId`.
- **Neo4j**: Uniqueness constraints + custom property assignments using `randomUUID()`.
