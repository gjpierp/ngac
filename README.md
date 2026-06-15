# SAFI-NGAC

Monorepo del ecosistema administrativo SAFI-NGAC. El proyecto integra un frontend en Angular, un backend administrativo en Node.js con TypeScript, un servicio de autenticacion/menu conectado a Oracle y un gateway HTTP que centraliza el acceso a los servicios.

## Componentes

| Componente     | Tecnologia                     | Puerto por defecto | Descripcion                           |
| -------------- | ------------------------------ | ------------------ | ------------------------------------- |
| Frontend       | Angular 21                     | 4200 en desarrollo | Interfaz administrativa NGAC          |
| Gateway        | Node.js + Express              | 3200               | Punto de entrada para frontend y APIs |
| Backend admin  | Node.js + Express + TypeScript | 3205               | API administrativa NGAC               |
| Auth service   | Node.js + Express              | 3100               | Generacion de menu y acceso a Oracle  |
| Spring gateway | Spring Boot + Spring Cloud     | 8080               | Gateway con discovery por Eureka      |
| Eureka server  | Spring Boot + Netflix Eureka   | 9090               | Registro central de servicios         |
| Oracle DB      | Oracle                         | 1521               | Persistencia y paquetes SQL           |

Para convivencia con Docker y local en la misma maquina, el stack Docker publica por defecto el gateway en 3210, el backend en 3215 y Eureka en 9091.

## Arquitectura

El flujo principal del sistema es el siguiente:

1. El frontend consume el gateway como punto unico de entrada.
2. El gateway enruta /api/v1/admin hacia el backend administrativo.
3. El gateway enruta /api/v1/menu hacia el servicio ngac-auth-service.
4. El backend administrativo y el auth service se conectan a Oracle.
5. Los servicios pueden registrarse en Eureka cuando la configuracion esta habilitada.
6. El spring-boot-gateway puede descubrir servicios registrados usando lb://service-name.

## Estructura del repositorio

```text
.
|-- backend/                API administrativa NGAC
|-- frontend/               Aplicacion Angular
|-- gateway/                API gateway y reverse proxy
|-- ngac-auth-service/      Servicio de menu/autenticacion
|-- eureka-server/          Registro Eureka del equipo
|-- spring-boot-gateway/    Variante Spring Boot del gateway
|-- spring-boot-microservice/ Variante Spring Boot de microservicio
|-- init-db.sh              Inicializacion de base de datos Oracle
|-- init-db-lf.sh           Variante del script de inicializacion
```

## Requisitos

- Node.js 20 o superior
- npm 10 o superior
- Oracle Database accesible desde la maquina o desde contenedores
- Oracle Instant Client si el driver oracledb lo requiere en tu entorno
- Java si vas a trabajar con los modulos Spring Boot
- Servicio Eureka si quieres discovery entre servicios por nombre

## Instalacion

Instala dependencias por modulo:

```bash
cd frontend && npm install
cd ../backend && npm install
cd ../gateway && npm install
cd ../ngac-auth-service && npm install
```

## Variables de entorno

Configura las variables necesarias antes de iniciar los servicios. Las mas relevantes que aparecen en el codigo son:

En backend y gateway, si existe .env.local en la carpeta del modulo, ese archivo sobreescribe .env cuando corres en desarrollo. En Docker se usan las variables declaradas en la imagen o en docker-compose.

### Backend admin

- PORT
- DB_USER
- DB_PASSWORD
- DB_CONNECTION_STRING
- EUREKA_ENABLED
- EUREKA_HOST
- EUREKA_PORT

### Gateway

- PORT
- AUTH_SERVICE_URL
- BACKEND_SERVICE_URL
- FRONTEND_SERVICE_URL
- EUREKA_HOST
- EUREKA_PORT
- EUREKA_DEFAULT_ZONE

### Auth service

- PORT
- DB_USER
- DB_PASSWORD
- DB_CONNECTION_STRING
- EUREKA_ENABLED
- EUREKA_HOST
- EUREKA_PORT

### Spring Boot Gateway

- EUREKA_HOST
- EUREKA_PORT
- EUREKA_DEFAULT_ZONE

### Eureka Server

- SERVER_PORT
- EUREKA_HOST
- EUREKA_DEFAULT_ZONE

## Arranque local

Levanta cada servicio en una terminal separada.

Ejemplos listos para puertos locales:

- [backend/.env.local.example](backend/.env.local.example)
- [gateway/.env.local.example](gateway/.env.local.example)

### 1. Frontend

```bash
cd frontend
npm start
```

Disponible en http://localhost:4200.

### 2. Backend administrativo

```bash
cd backend
npm run dev
```

Disponible en http://localhost:3205.

### 3. Auth service

```bash
cd ngac-auth-service
npm start
```

Disponible en http://localhost:3100.

### 4. Gateway

```bash
cd gateway
npm run dev
```

Disponible en http://localhost:3200.

### 5. Eureka Server

```bash
cd eureka-server
mvn spring-boot:run
```

Disponible en http://localhost:9090.

### 6. Spring Boot Gateway

```bash
cd spring-boot-gateway
mvn spring-boot:run
```

Disponible en http://localhost:8080.

## Arranque con Docker

El compose principal permite separar puerto interno del contenedor y puerto publicado al host.

Variables disponibles en [ngac-auth-service/docker-compose.yml](ngac-auth-service/docker-compose.yml):

- NGAC_BACKEND_CONTAINER_PORT
- NGAC_BACKEND_HOST_PORT
- NGAC_GATEWAY_CONTAINER_PORT
- NGAC_GATEWAY_HOST_PORT

Ejemplo de valores en [ngac-auth-service/.env.docker.example](ngac-auth-service/.env.docker.example).

Con la configuracion actual por defecto:

- El backend escucha dentro del contenedor en 3200 y se publica al host en 3215.
- El gateway escucha dentro del contenedor en 8080 y se publica al host en 3210.
- Eureka se publica al host en 9091 para no colisionar con el modo local.

## Rutas principales

### Gateway

- GET /gateway/health
- /api/v1/admin/\* -> proxy al backend administrativo
- /api/v1/menu -> proxy al auth service

### Eureka Server

- GET /
- GET /actuator/health
- GET /eureka/apps

### Backend admin

- GET /api/v1/admin/ping
- GET /api/v1/admin/dashboard/stats
- GET /api/v1/admin/roles
- GET /api/v1/admin/arbol
- POST /api/v1/admin/menu/context
- GET /api/v1/admin/safi/usuarios

### Auth service

- GET /info
- POST /api/v1/menu

## Base de datos

El repositorio incluye scripts para inicializar objetos y datos base de Oracle:

- init-db.sh
- init-db-lf.sh
- ngac-auth-service/script/

Los scripts usan las variables DB_USER, DB_PASSWORD y DB_CONNECTION_STRING. El script principal ejecuta, en orden, la estructura base, paquetes PL/SQL, datos de accesos y politicas finales.

## Comandos utiles

### Frontend

- npm start
- npm run build
- npm test

### Backend

- npm run dev
- npm run build
- npm start

### Gateway

- npm run dev
- npm start

### Eureka Server

- mvn spring-boot:run
- mvn -DskipTests package

### Spring Boot Gateway

- mvn spring-boot:run
- mvn -DskipTests package

### Auth service

- npm start

## Estrategia de ramas

Para este repositorio se recomienda un flujo simple de ramas:

- main: contiene el estado estable del proyecto.
- feature/\*: para funcionalidades o cambios de varias sesiones.
- fix/\*: para correcciones puntuales.

Convencion sugerida:

- feature/<modulo>-<cambio>
- fix/<modulo>-<problema>

Ejemplos:

- feature/frontend-dashboard
- feature/backend-roles
- fix/gateway-routing
- fix/auth-env-config

Si el cambio es pequeno y controlado, puede hacerse directamente sobre main. Si toca varias carpetas, dura mas de una sesion o puede romper integraciones, usa una rama feature/_ o fix/_.

## Notas

- El frontend tiene un README propio generado por Angular CLI, pero este archivo documenta el sistema completo.
- El gateway tiene valores por defecto pensados para desarrollo local y contenedores; ajusta los targets con variables de entorno cuando cambie la topologia.
- Eureka es opcional en desarrollo local; los servicios pueden iniciar sin registro si no detectan la configuracion correspondiente.
