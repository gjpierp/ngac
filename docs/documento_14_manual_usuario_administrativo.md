# Documento 14. Manual de Usuario Administrativo

## Proyecto: SAFI-NGAC - Plataforma Administrativa de Negocios y Control de Acceso Militar NGAC

---

## 1. Control de Cambios del Documento

| Versión | Fecha      | Autor                                             | Cambios Realizados                                                                                                                                                                                |
| :------ | :--------- | :------------------------------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| v1.0    | 03/06/2026 | Arquitectura de Software, Operación e Integración | Creación inicial del manual de usuario administrativo a partir de las rutas Angular, la barra lateral dinámica, el generador de contexto y las APIs administrativas observadas en el repositorio. |

---

## 2. Propósito y Alcance

El propósito de este documento es describir el uso funcional del cliente administrativo SAFI-NGAC desde la perspectiva del usuario operador, explicando navegación, módulos principales, flujos de gestión y consideraciones prácticas para trabajar con el sistema.

El alcance cubre exclusivamente la aplicación web administrativa observada en el frontend Angular y su interacción con las APIs del backend y del motor de menú. No incluye aplicación móvil ni procesos externos que no aparezcan reflejados en el repositorio.

---

## 3. Visión General de la Aplicación

SAFI-NGAC presenta una interfaz administrativa web con un punto de entrada principal y una navegación lateral dinámica, cuyo contenido depende del contexto y de los nodos devueltos por el motor de accesos. La experiencia del usuario se organiza por módulos funcionales y rutas internas gestionadas por Angular.

| Elemento               | Función de usuario                                                        |
| :--------------------- | :------------------------------------------------------------------------ |
| Tablero                | Vista inicial con indicadores y panorama general                          |
| Barra lateral dinámica | Navegación por módulos y accesos según contexto                           |
| Generador de contexto  | Construcción y simulación del contexto operativo                          |
| Módulos de gestión     | Administración de nodos, políticas, permisos, roles, usuarios y entidades |
| Hubes especializados   | Pantallas de detalle o composición de políticas y roles                   |

### Observaciones de uso:

- El menú no es estático; depende del contexto de simulación y de la estructura cargada.
- La navegación del sistema está pensada para administración técnica y funcional.
- El tablero actúa como punto de entrada por defecto.

---

## 4. Acceso y Navegación Principal

El enrutamiento del frontend dirige al usuario autenticado o habilitado hacia una estructura principal con redirección inicial al tablero. Desde allí, la barra lateral muestra rutas funcionales disponibles.

| Ruta funcional     | Propósito observable                       |
| :----------------- | :----------------------------------------- |
| tablero            | Visualización inicial y resumen            |
| nodos              | Gestión de nodos de seguridad o estructura |
| tipos-nodo         | Administración de tipos de nodo            |
| politicas          | Gestión de políticas                       |
| jerarquia          | Construcción jerárquica                    |
| clonacion          | Clonación de jerarquías                    |
| permisos           | Administración de permisos                 |
| matriz-permisos    | Consulta matricial de permisos             |
| comparador         | Comparación de permisos                    |
| operaciones        | Gestión de operaciones                     |
| roles              | Gestión de roles                           |
| asignar-roles      | Asignación de roles                        |
| generador-contexto | Generación y simulación de contexto        |
| safi               | Gestión SAFI general                       |
| usuarios           | Gestión de usuarios                        |
| entidades          | Gestión de entidades                       |
| unidades           | Gestión de unidades                        |
| homologacion-roles | Homologación de roles                      |

### Reglas de navegación:

1. El sistema redirige la ruta vacía hacia el tablero.
2. La barra lateral expande automáticamente la ruta activa.
3. El menú puede cambiar si cambia el contexto de simulación.

---

## 5. Menú Dinámico y Contexto de Usuario

La barra lateral consume un flujo dinámico de nodos y menús desde los servicios de accesos. El usuario no navega solo por rutas fijas; también depende del menú generado para su contexto actual.

| Concepto               | Efecto funcional                                        |
| :--------------------- | :------------------------------------------------------ |
| Contexto de simulación | Determina el menú visible y el alcance de navegación    |
| Nodos enriquecidos     | Permiten mostrar etiquetas, iconos y rutas consistentes |
| Expansión automática   | Facilita ubicar la opción actualmente activa            |
| Orden visual           | Mantiene secuencia estable del menú                     |

### Implicaciones para el usuario:

- Si cambia el contexto, el menú puede recargarse.
- Un acceso visible en un contexto puede no aparecer en otro.
- La estructura lateral refleja la jerarquía real entregada por el motor del sistema.

---

## 6. Módulos de Gestión Principales

### 6.1. Tablero

| Objetivo                 | Uso esperado                                              |
| :----------------------- | :-------------------------------------------------------- |
| Mostrar indicadores base | Consultar el estado general del ecosistema administrativo |

### 6.2. Nodos, tipos y jerarquía

| Módulo     | Finalidad                                      |
| :--------- | :--------------------------------------------- |
| nodos      | Administrar nodos disponibles en la estructura |
| tipos-nodo | Mantener clasificación de nodos                |
| jerarquia  | Construir o revisar relaciones jerárquicas     |
| clonacion  | Replicar estructuras jerárquicas               |

### 6.3. Políticas, permisos y operaciones

| Módulo          | Finalidad                                 |
| :-------------- | :---------------------------------------- |
| politicas       | Gestionar políticas de acceso             |
| permisos        | Ajustar permisos o relaciones funcionales |
| matriz-permisos | Revisar permisos en formato consolidado   |
| comparador      | Contrastar configuraciones de permisos    |
| operaciones     | Gestionar operaciones disponibles         |

### 6.4. Roles y asignaciones

| Módulo             | Finalidad                                     |
| :----------------- | :-------------------------------------------- |
| roles              | Administrar roles del sistema                 |
| asignar-roles      | Asociar roles a usuarios u otros elementos    |
| homologacion-roles | Normalizar o relacionar roles entre contextos |

### 6.5. Gestión SAFI y maestros administrativos

| Módulo    | Finalidad                                        |
| :-------- | :----------------------------------------------- |
| safi      | Consola funcional general de administración SAFI |
| usuarios  | Alta, baja y mantenimiento de usuarios           |
| entidades | Mantenimiento de entidades                       |
| unidades  | Mantenimiento de unidades organizativas          |

---

## 7. Flujos Funcionales Relevantes

| Flujo                       | Descripción resumida                                  |
| :-------------------------- | :---------------------------------------------------- |
| Consultar tablero           | Entrar al sistema y revisar panorama general          |
| Navegar por menú contextual | Seleccionar módulos visibles según el contexto activo |
| Gestionar roles             | Crear, modificar, revisar o eliminar roles            |
| Gestionar usuarios          | Consultar usuarios y sus relaciones funcionales       |
| Simular contexto            | Generar un contexto y observar el menú resultante     |
| Revisar permisos            | Inspeccionar permisos por módulo, matriz o comparador |

### Flujo base sugerido para un operador:

1. Ingresar al tablero.
2. Verificar o generar el contexto de trabajo.
3. Navegar al módulo funcional correspondiente.
4. Ejecutar consulta o mantenimiento requerido.
5. Validar el resultado funcional en la navegación o en los datos mostrados.

---

## 8. Integración con Servicios del Backend

La experiencia del usuario administrativo depende de varias rutas backend y del motor de menú. Aunque el usuario no consume directamente la API, sus pantallas dependen de estas capacidades técnicas.

| Servicio o ruta               | Función visible para el usuario                 |
| :---------------------------- | :---------------------------------------------- |
| /api/v1/admin/dashboard/stats | Alimenta información del tablero                |
| /api/v1/admin/roles           | Gestión de roles                                |
| /api/v1/admin/arbol           | Consulta de estructura o árbol                  |
| /api/v1/admin/menu/context    | Generación de menú por contexto                 |
| /api/v1/admin/safi/usuarios   | Gestión de usuarios                             |
| /api/v1/menu                  | Resolución de menú desde el servicio de accesos |

### Lectura funcional:

- Si falla el backend, el usuario observará pantallas sin datos o con errores operativos.
- Si falla el servicio de menú o el contexto, la navegación lateral puede quedar incompleta.
- La funcionalidad visible del sistema depende de la coordinación entre frontend, backend y Oracle.

---

## 9. Recomendaciones de Uso para el Usuario Operador

| Recomendación                                                      | Justificación                                        |
| :----------------------------------------------------------------- | :--------------------------------------------------- |
| Verificar el contexto antes de operar                              | El menú y la disponibilidad funcional dependen de él |
| Navegar desde la barra lateral y el tablero                        | Mantiene coherencia con la estructura del sistema    |
| Confirmar cambios críticos en módulos de seguridad                 | Reduce errores sobre roles, políticas y permisos     |
| Revisar jerarquía y permisos antes de homologar o clonar           | Evita inconsistencias funcionales                    |
| Validar usuarios, entidades y unidades con criterio administrativo | Asegura consistencia del modelo operativo            |

---

## 10. Problemas Comunes y Resolución Básica

| Situación observable                    | Posible interpretación                      | Acción recomendada                       |
| :-------------------------------------- | :------------------------------------------ | :--------------------------------------- |
| No aparece una opción en el menú        | Contexto o permisos insuficientes           | Revisar contexto y generación de menú    |
| Un módulo abre sin datos                | Falla de backend o servicio asociado        | Validar disponibilidad del servicio      |
| El árbol o jerarquía no refleja cambios | Inconsistencia de datos o recarga pendiente | Revalidar estructura y contexto          |
| No se visualizan roles o usuarios       | Problema de API o datos base                | Revisar rutas administrativas vinculadas |
| El tablero no carga indicadores         | Falla en dashboard stats o integración      | Revisar disponibilidad del backend       |

### Regla práctica:

Cuando el problema afecte navegación o visibilidad, primero revisar el contexto y el menú dinámico; cuando afecte datos, revisar el backend y la base de datos.

---

## 11. Buenas Prácticas de Operación Funcional

1. Trabajar con contexto válido antes de administrar nodos, roles o permisos.
2. Registrar cambios sensibles sobre seguridad y homologación.
3. Validar impactos de roles y políticas después de modificaciones importantes.
4. Evitar operar simultáneamente sin confirmar el alcance funcional de los cambios.
5. Escalar a soporte técnico cuando el problema supere la navegación o la consistencia visible.

---

## 12. Conclusiones

SAFI-NGAC expone una consola administrativa robusta, orientada a la gestión de seguridad, jerarquías, roles, permisos y maestros funcionales mediante una navegación dinámica controlada por contexto. Desde la perspectiva del usuario, el uso correcto del sistema depende de comprender la relación entre menú, contexto y módulos de administración.

Este Documento 14 cierra la serie documental proporcionando la guía funcional que faltaba: traduce las rutas y componentes reales del frontend en un manual de uso administrativo, alineado con la arquitectura y los servicios que sostienen la operación del sistema.
