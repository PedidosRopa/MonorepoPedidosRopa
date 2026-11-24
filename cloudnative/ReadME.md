# Pedidos Ropa — Backend Cloud Native (`cloudnative`)

Este documento detalla la evolución arquitectónica del backend de **Pedidos Ropa** desde su versión inicial (CRUD síncrono y mensajería básica en RabbitMQ) hacia una **Arquitectura Orientada a Eventos (EDA) y Federada**, integrando **Control de Acceso Basado en Roles (RBAC) con Microsoft Entra ID**, **streaming de eventos y auditoría en tiempo real con Apache Kafka**, **almacenamiento de objetos en AWS S3** y **persistencia ligera del carrito de compras en PostgreSQL**.

---

## 1. Contraste General: Antes vs. Ahora (Backend)

| Dimensión Técnica | Estado Anterior (Versión Base) | Estado Actual (Backend Finalizado) | Impacto y Beneficio Arquitectónico |
| :--- | :--- | :--- | :--- |
| **Identidad y Autorización** | Autenticación genérica (`authenticated()`). Sin diferenciación de permisos por rol ni soporte para método `PATCH` en CORS. | **100% Stateless con Entra ID RBAC.** Spring Security extrae el arreglo `"roles"` (`Administrador`, `Cliente`, `Repartidor`) directo del JWT. Sin tabla `usuarios` redundante. | Seguridad *Zero-Trust* sin sobrecargar PostgreSQL ni duplicar datos de identidad ya gestionados por Azure. |
| **Mensajería Asíncrona** | Broker único (**RabbitMQ**) para procesar pedidos creados y manejar fallos mediante *Dead Letter Queues* (DLQ). | **Arquitectura Dual-Broker:** **RabbitMQ** se mantiene para comandos de bodega y DLQ; **Apache Kafka** gestiona el *Event Streaming* operativo y de auditoría. | Cada motor cumple su propósito óptimo: RabbitMQ para enrutamiento/reintentos de tareas y Kafka para logs de eventos retenidos con múltiples consumidores. |
| **Tópicos Kafka y Retención** | Sin integración con Apache Kafka. | **2 tópicos configurados con políticas diferenciadas:**<br>1. `pedidos-estados` (3 particiones, retención 7 días).<br>2. `auditoria-admin` (2 particiones, retención 30 días). | Aislamiento por dominio de datos y tiempos de retención (`retention.ms`) ajustados al ciclo logístico y de cumplimiento. |
| **Seguimiento de Pedidos (Tracker)** | El pedido solo guardaba su último estado (`PENDIENTE`, `PROCESANDO`, `COMPLETADO`, `CANCELADO`) sin registro histórico. | Flujo **Repartidor + Tracker**: eventos `PedidoEstadoEvent` particionados por `idPedido` en `pedidos-estados`, consumidos en paralelo por `tracker-group` y `pedidos-group`. | Trazabilidad cronológica completa en base de datos y desacoplamiento total entre quien actualiza el estado y quien consulta el historial. |
| **Auditoría Administrativa** | Sin registro centralizado de acciones administrativas. | **Auditoría desacoplada con Spring AOP (`@AuditarAdmin`):** intercepta operaciones críticas y publica `AdminAuditEvent` en `auditoria-admin`, consumido por `auditoria-logs-group` y `auditoria-alertas-group`. | Separación limpia entre lógica de negocio e infraestructura de observabilidad y seguridad. |
| **Tolerancia a Fallos y Gestión** | Sin administración dinámica de streaming ni manejo de eventos corruptos en Kafka. | **`DefaultErrorHandler`** con 3 reintentos (`FixedBackOff`) y envío automático a **`.DLT`** (*Dead Letter Topic*), más API REST **`/api/admin/kafka`** (`AdminClient`) y **Kafka-UI**. | Resiliencia ante mensajes malformados y administración replicable de tópicos, configuraciones y *consumer groups*. |
| **Carrito de Compras** | Sin endpoints ni persistencia en servidor; el backend únicamente recibía el payload final al crear el pedido. | **Persistencia Ligera por Puntero JSON (`carritos_usuario`):** tabla clave-valor en PostgreSQL indexada por `entra_oid` que almacena `items_json` (`[{ productoId, cantidad }]`). | Persistencia entre sesiones y dispositivos con un peso mínimo en RDS ($\approx 80\text{ bytes}$ por usuario) sin levantar servidores Redis extra. |
| **Imágenes de Productos** | Entidad `Producto` únicamente textual sin soporte multimedia. | Almacenamiento de archivos binarios en **AWS S3** mediante AWS SDK v2, persistiendo solo la URL pública (`imagen_url`) en PostgreSQL. | Mantiene la base de datos relacional liviana y delega los archivos estáticos a un servicio de *Object Storage* escalable. |
| **Modelo de Datos (RDS)** | 3 tablas (`productos`, `pedidos`, `detalle_pedidos`). | 5 tablas (`productos`, `pedidos`, `detalle_pedidos`, `historial_pedidos`, `carritos_usuario`). | Modelo relacional limpio: normalizado para transacciones ACID y desnormalizado estratégicamente para historial de eventos y caché JSON. |

---

## 2. Arquitectura del Backend (Flujo End-to-End)

```
+-----------------------+       JWT (Roles: Admin, Cliente, Repartidor)       +-----------------------+
|     Cliente REST      | <-------------------------------------------------> |  Microsoft Entra ID   |
|  (Bearer Token JWT)   |                                                     |       (IDaaS)         |
+-----------+-----------+                                                     +-----------------------+
            |
            | HTTPS / REST
            v
+---------------------------------------------------------------------------------------------------+
|                             Backend Spring Boot 4.1 (Java 21 - Docker / EC2)                      |
|                                                                                                   |
|  [ProductoController] ---> [S3Service] -----------------------------------> ( AWS S3 Bucket )     |
|  [CarritoController]  ---> [CarritoService] (Puntero entra_oid -> JSON) --+                       |
|  [KafkaAdminController] -> [AdminClient] ----+                            |                       |
|  [AOP @AuditarAdmin] ----> [AdminAuditProd] -+                            v                       |
|  [PedidoController]   ---> [PedidoService]   |                    +-----------------------+       |
|                               |       |      |                    |  PostgreSQL (AWS RDS) |       |
|         +---------------------+       |      |                    |  - productos          |       |
|         | (Comando Creación)          |      |                    |  - pedidos            |       |
|         v                             v      v                    |  - detalle_pedidos    |       |
|  +--------------+           +--------------------------+          |  - carritos_usuario   |       |
|  |   RabbitMQ   |           |  Apache Kafka + Zookeeper|          |  - historial_pedidos  |       |
|  |  (+ DLQ)     |           |  + Kafka-UI (:8090)      |          +-----------------------+       |
|  +------+-------+           +----+----------------+----+                      ^                   |
|         |                        |                |                           |                   |
|         v                        |                |                           |                   |
|  [PedidoProcesamiento]           |                |                           |                   |
|  (Bodega / StockBajo)            |                |                           |                   |
|                                  v                v                           |                   |
|               [Tópico: pedidos-estados]      [Tópico: auditoria-admin]        |                   |
|               (3 part. | ret. 7 días)        (2 part. | ret. 30 días)         |                   |
|                      |                                |                       |                   |
|         +------------+------------+      +------------+------------+          |                   |
|         v                         v      v                         v          |                   |
|  [tracker-group]          [pedidos-group] [auditoria-logs]  [auditoria-alertas]                   |
|  (Inserta hito RDS) --------+             (Bitácora JSON)   (Alertas críticas)                    |
|                             +-------------------------------------------------+                   |
|                             * Fallos tras 3 reintentos -> <topico>.DLT                            |
+---------------------------------------------------------------------------------------------------+
```

### Modelo Entidad-Relación Actualizado (PostgreSQL)

```
+-----------------------+           +---------------------------+
|   carritos_usuario    |           |         productos         |
+-----------------------+           +---------------------------+
| PK entra_oid          |           | PK id_producto            |
|    items_json (TEXT)  |           |    nombre                 |
+-----------------------+           |    descripcion            |
                                    |    precio                 |
+-----------------------+           |    stock                  |
|        pedidos        |           |    categoria              |
+-----------------------+           |    talla                  |
| PK id_pedido          |<---+      |    genero                 |
|    desc_pedido        |    |      |    imagen_url (AWS S3)    |
|    usuario_email      |    |      +---------------------------+
|    monto_total        |    |                    ^
|    fecha_pedido       |    |                    | (N:1)
|    estado             |    |      +---------------------------+
+-----------------------+    |      |      detalle_pedidos      |
           |                 |      +---------------------------+
           | (1:N)           +------| PK id_detalle             |
           v                        | FK id_pedido              |
+-----------------------+           | FK id_producto            |
|   historial_pedidos   |           |    cantidad               |
+-----------------------+           |    precio_unitario        |
| PK id_historial       |           +---------------------------+
| FK id_pedido          |
|    estado_anterior    |
|    estado_nuevo       |
|    actualizado_por... |
|    fecha_cambio       |
+-----------------------+
```

---

## 3. Cambios Implementados en el Backend (`cloudnative`)

### 3.1. Infraestructura y Contenedores (`docker-compose.yml` y `application.properties`)

* **Clúster Completo de Mensajería y Observabilidad:** `docker-compose.yml` orquesta los servicios `zookeeper` (`confluentinc/cp-zookeeper:7.6.1`), `kafka` (`confluentinc/cp-kafka:7.6.1`), `kafka-ui` (`provectuslabs/kafka-ui` expuesto en el puerto `8090`), `rabbitmq:3-management` y `backend`, con límites de memoria (`KAFKA_HEAP_OPTS`) calibrados para instancias AWS EC2.
* **Propiedades de Kafka y S3:** Se incorporaron `spring.kafka.bootstrap-servers`, los tópicos `app.kafka.topics.pedidos-estados=pedidos-estados` y `app.kafka.topics.auditoria-admin=auditoria-admin`, y las variables `aws.s3.bucket` / `aws.s3.region` en `application.properties`.

### 3.2. Seguridad Federada (`SecurityConfig.java` y `SecurityUtils.java`)

* Se habilitó `@EnableMethodSecurity` para proteger endpoints a nivel de método con `@PreAuthorize`.
* Se configuró `JwtAuthenticationConverter` mapeando el claim `"roles"` del token de Microsoft Entra ID con el prefijo `ROLE_` (`ROLE_Administrador`, `ROLE_Cliente`, `ROLE_Repartidor`).
* Se habilitó el método HTTP `PATCH` en `CorsConfigurationSource`.
* `SecurityUtils` extrae tanto `email` (`preferred_username`) como el identificador único inmutable `oid` (`extractOid(Jwt)`).

### 3.3. Arquitectura Multi-Tópico, Consumer Groups y Resiliencia (`KafkaConfig.java`)

* **Tópico 1 — `pedidos-estados`:** Configurado con **3 particiones**, **1 réplica**, `retention.ms=604800000` (7 días) y `cleanup.policy=delete`. `PedidoEstadoProducer` publica `PedidoEstadoEvent` usando `idPedido` como *Message Key* para garantizar orden estricto por orden. Es consumido por dos grupos independientes:
  * `tracker-group`: Persiste cada hito cronológico en `historial_pedidos`.
  * `pedidos-group`: Sincroniza el estado maestro en `pedidos` y registra analítica de entregas completadas.
* **Tópico 2 — `auditoria-admin`:** Configurado con **2 particiones**, **1 réplica**, `retention.ms=2592000000` (30 días) y `cleanup.policy=delete`. Mediante la anotación `@AuditarAdmin` y el aspecto `AdminAuditAspect` (Spring AOP), cada operación administrativa en Productos, S3, RabbitMQ o Kafka publica `AdminAuditEvent` con *Message Key* `adminEmail`. Es consumido por dos grupos independientes:
  * `auditoria-logs-group`: Valida el payload y escribe la bitácora estructurada de auditoría.
  * `auditoria-alertas-group`: Monitorea operaciones destructivas (`ELIMINAR_PRODUCTO`, `ELIMINAR_TOPICO`, `MODIFICAR_CONFIG_TOPICO`, `ELIMINAR_COLA`, `ELIMINAR_EXCHANGE`) y emite alertas de seguridad.
* **Manejo de Errores y DLT (`DefaultErrorHandler`):** Configurado con `FixedBackOff(2000L, 3L)` (3 reintentos cada 2 segundos) y `DeadLetterPublishingRecoverer` para redirigir eventos defectuosos hacia `<topico>.DLT` sin detener el consumo.

### 3.4. Administración Dinámica de Kafka (`KafkaAdminController.java`)

* Implementado sobre la API moderna de `AdminClient` (Kafka 4.1) y restringido a `hasRole('Administrador')`, permite listar tópicos y sus configuraciones, crear nuevos tópicos con particiones/retención personalizadas, modificar `retention.ms` o `cleanup.policy` en caliente mediante `incrementalAlterConfigs`, eliminar tópicos e inspeccionar los *consumer groups* activos (`listGroups(ListGroupsOptions.forConsumerGroups())`).

### 3.5. Almacenamiento Multimedia y Carrito Persistente

* **AWS S3 (`S3Service` y `ProductoService`):** Sube archivos binarios al bucket configurado bajo la ruta `productos/{uuid}-{filename}` y almacena la URL pública resultante en `Producto.imagenUrl`.
* **Carrito Puntero (`CarritoUsuario`, `CarritoService`, `CarritoController`):** Persiste el listado compacto de `DetalleItemDto` (`productoId` y `cantidad`) serializado en JSON bajo la clave primaria `entra_oid`. Al confirmar un pedido en `PedidoService.crearPedido()`, el carrito del usuario se elimina automáticamente dentro de la misma transacción.

### 3.6. Contrato de Endpoints REST

| Dominio | Método | Endpoint | Rol Requerido | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| **Productos** | `GET` | `/api/productos` | Público | Lista o filtra productos por `categoria` y `talla` (incluye `imagenUrl`). |
| **Productos** | `POST` | `/api/productos` | `Administrador` | Crea un nuevo producto en el catálogo (auditado en Kafka). |
| **Productos** | `POST` | `/api/productos/{id}/imagen` | `Administrador` | Sube una imagen (`multipart/form-data`, campo `file`) a AWS S3 y guarda su URL. |
| **Productos** | `DELETE` | `/api/productos/{id}` | `Administrador` | Elimina un producto del catálogo (auditado y alertado en Kafka). |
| **Carrito** | `GET` | `/api/carrito` | Autenticado | Recupera el arreglo JSON `[{ productoId, cantidad }]` asociado al `oid` del usuario. |
| **Carrito** | `PUT` | `/api/carrito` | Autenticado | Sincroniza y persiste los ítems del carrito del usuario en PostgreSQL. |
| **Carrito** | `DELETE` | `/api/carrito` | Autenticado | Vacía el carrito del usuario. |
| **Pedidos** | `POST` | `/api/pedidos` | Autenticado | Crea orden, descuenta stock, publica en RabbitMQ + Kafka y limpia el carrito en RDS. |
| **Pedidos** | `GET` | `/api/pedidos/mis-pedidos` | Autenticado | Lista los pedidos del usuario autenticado. |
| **Pedidos** | `GET` | `/api/pedidos` | `Repartidor`, `Administrador` | Lista todos los pedidos del sistema para gestión operativa y despacho. |
| **Pedidos** | `PATCH` | `/api/pedidos/{id}/estado` | `Repartidor`, `Administrador` | Cambia el estado del pedido (`EN_PREPARACION`, `EN_CAMINO`, `ENTREGADO`, etc.) y dispara `PedidoEstadoEvent` hacia Kafka. |
| **Pedidos** | `GET` | `/api/pedidos/{id}/historial` | Autenticado | Devuelve la línea de tiempo cronológica del pedido almacenada en `historial_pedidos`. |
| **Pedidos** | `DELETE` | `/api/pedidos/{id}` | Autenticado | Cancela el pedido, restituye stock y emite evento `CANCELADO` a Kafka. |
| **Admin Kafka** | `GET` | `/api/admin/kafka/topics` | `Administrador` | Lista tópicos, particiones, réplicas y políticas (`retention.ms`, `cleanup.policy`). |
| **Admin Kafka** | `POST` | `/api/admin/kafka/topics` | `Administrador` | Crea dinámicamente un tópico en el broker Kafka. |
| **Admin Kafka** | `PATCH` | `/api/admin/kafka/topics/{nombre}/config` | `Administrador` | Actualiza dinámicamente `retention.ms` o `cleanup.policy` de un tópico. |
| **Admin Kafka** | `DELETE` | `/api/admin/kafka/topics/{nombre}` | `Administrador` | Elimina un tópico del clúster Kafka. |
| **Admin Kafka** | `GET` | `/api/admin/kafka/consumer-groups` | `Administrador` | Inspecciona el estado, miembros activos y tópicos asignados de cada *consumer group*. |
| **Admin RabbitMQ** | `GET/POST/DELETE` | `/api/admin/rabbit/**` | `Administrador` | Gestión dinámica de colas, *exchanges* y *bindings* en RabbitMQ (auditado en Kafka). |

---

## 4. Versionamiento en Apache Kafka y Schema Evolution

El versionamiento en la capa de streaming se aborda en dos niveles complementarios:

1. **Versionamiento de Cliente y API Administrativa (Apache Kafka 4.1):**
   * El proyecto utiliza `spring-kafka` junto a `kafka-clients` 4.1 (incluido en Spring Boot 4.1.1), empleando las APIs vigentes de administración unificada de grupos (`AdminClient.listGroups(ListGroupsOptions.forConsumerGroups())`, `GroupListing` y `ConsumerGroupDescription.groupState()`), eliminando métodos deprecados de versiones 3.x.
2. **Versionamiento de Esquemas y Eventos (*Schema Evolution*):**
   * Permite evolucionar la estructura de los mensajes (por ejemplo, añadir nuevos campos de telemetría a `PedidoEstadoEvent` o `AdminAuditEvent`) sin interrumpir a los consumidores activos.
   * **Estrategia aplicada:** Inclusión explícita del atributo `schemaVersion: "1.0"` en ambos DTOs de eventos JSON, permitiendo a los consumidores aplicar deserialización condicional o enrutar versiones incompatibles hacia tópicos versionados (ej. `pedidos-estados.v2`), siguiendo principios de compatibilidad **Backward** (consumidores nuevos leen eventos antiguos) y **Forward** (consumidores antiguos ignoran campos nuevos).