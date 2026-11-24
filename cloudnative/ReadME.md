# Pedidos Ropa — Backend Cloud Native (`cloudnative`)

Este documento detalla la evolución arquitectónica del backend de **Pedidos Ropa** desde su versión inicial (CRUD síncrono y colas de trabajo básicas en RabbitMQ) hacia una **Arquitectura Orientada a Eventos (EDA) y Federada**, incorporando **Control de Acceso Basado en Roles (RBAC) con Microsoft Entra ID**, **seguimiento logístico en tiempo real con Apache Kafka (KRaft)**, **almacenamiento de objetos en AWS S3** y **persistencia ligera del carrito de compras en PostgreSQL**.

---

## 1. Contraste General: Antes vs. Ahora (Backend)

| Dimensión Técnica | Estado Anterior (Versión Base) | Estado Actual (Backend Evolucionado) | Impacto y Beneficio Arquitectónico |
| :--- | :--- | :--- | :--- |
| **Identidad y Autorización** | Autenticación genérica (`authenticated()`). Sin diferenciación de permisos por rol ni soporte para método `PATCH` en CORS. | **100% Stateless con Entra ID RBAC.** Spring Security extrae el arreglo `"roles"` (`Administrador`, `Cliente`, `Repartidor`) directo del JWT. Sin tabla `usuarios` redundante. | Seguridad *Zero-Trust* sin sobrecargar PostgreSQL ni duplicar datos de identidad ya gestionados por Azure. |
| **Mensajería Asíncrona** | Broker único (**RabbitMQ**) para procesar pedidos creados y manejar fallos mediante *Dead Letter Queues* (DLQ). | **Arquitectura Dual-Broker:** **RabbitMQ** se mantiene para comandos de bodega y DLQ; **Apache Kafka (KRaft)** gestiona el *Event Streaming* del ciclo de vida del pedido. | Cada motor cumple su propósito óptimo: RabbitMQ para enrutamiento/reintentos y Kafka para logs de eventos ordenados con múltiples consumidores. |
| **Seguimiento de Pedidos (Tracker)** | El pedido solo guardaba su último estado (`PENDIENTE`, `PROCESANDO`, `COMPLETADO`, `CANCELADO`) sin registro histórico. | Nuevo flujo de **Repartidor + Tracker**: eventos `PedidoEstadoEvent` particionados por `idPedido` en el tópico `pedidos-estados`, consumidos en paralelo por `tracker-group` y `pedidos-group`. | Trazabilidad cronológica completa en base de datos y desacoplamiento total entre quien actualiza el estado y quien consulta el historial. |
| **Carrito de Compras** | Sin endpoints ni persistencia en servidor; el backend únicamente recibía el payload final al crear el pedido. | **Persistencia Ligera por Puntero JSON (`carritos_usuario`):** tabla clave-valor en PostgreSQL indexada por `entra_oid` que almacena `items_json` (`[{ productoId, cantidad }]`). | Persistencia entre sesiones y dispositivos con un peso mínimo en RDS ($\approx 80\text{ bytes}$ por usuario) sin levantar servidores Redis extra. |
| **Imágenes de Productos** | Entidad `Producto` únicamente textual sin soporte multimedia. | Almacenamiento de archivos binarios en **AWS S3** mediante AWS SDK v2, persistiendo solo la URL pública (`imagen_url`) en PostgreSQL. | Mantiene la base de datos relacional liviana y delega los archivos estáticos a un servicio de *Object Storage* escalable. |
| **Modelo de Datos (RDS)** | 3 tablas (`productos`, `pedidos`, `detalle_pedidos`). | 5 tablas (`productos`, `pedidos`, `detalle_pedidos`, `historial_pedidos`, `carritos_usuario`). | Modelo relacional limpio: normalizado para transacciones ACID y desnormalizado estratégicamente para historial de eventos y caché JSON. |

---

## 2. Arquitectura del Backend (Flujo End-to-End)

```text
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
|  [PedidoController]   ---> [PedidoService]                                |                       |
|                               |       |                                   v                       |
|         +---------------------+       +-------------------+       +-----------------------+       |
|         | (Comando Creación)                              |       |  PostgreSQL (AWS RDS) |       |
|         v                                                 |       |  - productos          |       |
|  +--------------+      +-----------------------------+    |       |  - pedidos            |       |
|  |   RabbitMQ   | ---> | PedidoProcesamientoListener | ---+-----> |  - detalle_pedidos    |       |
|  |  (+ DLQ)     |      +-----------------------------+    |       |  - carritos_usuario   |       |
|  +--------------+                                         |       |  - historial_pedidos  |       |
|                                                           v       +-----------------------+       |
|                                                 +-------------------+                 ^           |
|                                                 |   Apache Kafka    |                 |           |
|                                                 |  (Modo KRaft)     |                 |           |
|                                                 | Tópico:           |                 |           |
|                                                 | pedidos-estados   |                 |           |
|                                                 +---------+---------+                 |           |
|                                                           |                           |           |
|                                        +------------------+------------------+        |           |
|                                        v                                     v        |           |
|                        [Consumidor: tracker-group]           [Consumidor: pedidos-group]          |
|                        (Inserta hito en historial)           (Sincroniza estado maestro)          |
+---------------------------------------------------------------------------------------------------+
```

### Modelo Entidad-Relación Actualizado (PostgreSQL)

```text
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
* **Kafka sin ZooKeeper (KRaft):** Se incorporó el servicio `kafka` (`apache/kafka:3.9.0`) en `docker-compose.yml` operando como `broker,controller` simultáneamente, con límite de memoria (`KAFKA_HEAP_OPTS="-Xmx512M -Xms256M"`) para convivir de forma estable junto a Spring Boot y RabbitMQ en la instancia EC2.
* **Propiedades de Kafka y S3:** Se añadieron las configuraciones de serialización JSON (`spring.kafka.*`), el tópico `app.kafka.topics.pedidos-estados=pedidos-estados` y las variables `aws.s3.bucket` / `aws.s3.region` en `application.properties`.

### 3.2. Seguridad Federada (`SecurityConfig.java` y `SecurityUtils.java`)
* Se habilitó `@EnableMethodSecurity` para proteger endpoints a nivel de método con `@PreAuthorize`.
* Se configuró `JwtAuthenticationConverter` mapeando el claim `"roles"` del token de Microsoft Entra ID con el prefijo `ROLE_` (`ROLE_Administrador`, `ROLE_Cliente`, `ROLE_Repartidor`).
* Se habilitó el método HTTP `PATCH` en `CorsConfigurationSource`.
* `SecurityUtils` extrae tanto `email` (`preferred_username`) como el identificador único inmutable `oid` (`extractOid(Jwt)`).

### 3.3. Flujo de Eventos con Apache Kafka (`KafkaConfig` y `PedidoEstadoKafkaConsumer`)
* **Tópico Particionado:** `KafkaConfig` declara el tópico `pedidos-estados` con **3 particiones**.
* **Orden Garantizado por Pedido:** Al publicar `PedidoEstadoEvent` (versionado con `schemaVersion: "1.0"`), `PedidoService` envía `idPedido.toString()` como **Message Key**, asegurando que todas las transiciones de un mismo pedido caigan en la misma partición y se procesen en orden estricto.
* **Consumidores Desacoplados:**
  * `tracker-group`: Escucha `pedidos-estados` y registra cada cambio cronológico en la tabla `historial_pedidos`.
  * `pedidos-group`: Escucha el mismo evento y sincroniza el estado maestro en la tabla `pedidos`.

### 3.4. Almacenamiento Multimedia y Carrito Persistente
* **AWS S3 (`S3Service` y `ProductoService`):** Sube archivos binarios al bucket configurado bajo la ruta `productos/{uuid}-{filename}` y almacena la URL pública resultante en `Producto.imagenUrl`.
* **Carrito Puntero (`CarritoUsuario`, `CarritoService`, `CarritoController`):** Persiste el listado compacto de `DetalleItemDto` (`productoId` y `cantidad`) serializado en JSON bajo la clave primaria `entra_oid`. Al confirmar un pedido en `PedidoService.crearPedido()`, el carrito del usuario se elimina automáticamente dentro de la misma transacción.

### 3.5. Contrato de Endpoints REST

| Dominio | Método | Endpoint | Rol Requerido | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| **Productos** | `GET` | `/api/productos` | Público | Lista o filtra productos por `categoria` y `talla` (incluye `imagenUrl`). |
| **Productos** | `POST` | `/api/productos` | `Administrador` | Crea un nuevo producto en el catálogo. |
| **Productos** | `POST` | `/api/productos/{id}/imagen` | `Administrador` | Sube una imagen (`multipart/form-data`, campo `file`) a AWS S3 y guarda su URL. |
| **Productos** | `DELETE` | `/api/productos/{id}` | `Administrador` | Elimina un producto del catálogo. |
| **Carrito** | `GET` | `/api/carrito` | Autenticado | Recupera el arreglo JSON `[{ productoId, cantidad }]` asociado al `oid` del usuario. |
| **Carrito** | `PUT` | `/api/carrito` | Autenticado | Sincroniza y persiste los ítems del carrito del usuario en PostgreSQL. |
| **Carrito** | `DELETE` | `/api/carrito` | Autenticado | Vacía el carrito del usuario. |
| **Pedidos** | `POST` | `/api/pedidos` | Autenticado | Crea orden, descuenta stock, publica en RabbitMQ + Kafka y limpia el carrito en RDS. |
| **Pedidos** | `GET` | `/api/pedidos/mis-pedidos` | Autenticado | Lista los pedidos del usuario autenticado. |
| **Pedidos** | `GET` | `/api/pedidos` | `Repartidor`, `Administrador` | Lista todos los pedidos del sistema para gestión operativa y despacho. |
| **Pedidos** | `PATCH` | `/api/pedidos/{id}/estado` | `Repartidor`, `Administrador` | Cambia el estado del pedido (`EN_PREPARACION`, `EN_CAMINO`, `ENTREGADO`, etc.) y dispara `PedidoEstadoEvent` hacia Kafka. |
| **Pedidos** | `GET` | `/api/pedidos/{id}/historial` | Autenticado | Devuelve la línea de tiempo cronológica del pedido almacenada en `historial_pedidos`. |
| **Pedidos** | `DELETE` | `/api/pedidos/{id}` | Autenticado | Cancela el pedido, restituye stock y emite evento `CANCELADO` a Kafka. |

---

## 4. Versionamiento en Apache Kafka (KRaft y Schema Evolution)

El versionamiento en la capa de mensajería se aborda en dos niveles complementarios:

1. **Versionamiento de Plataforma (Broker — KRaft vs. ZooKeeper):**
   * A partir de **Kafka 3.3+** y consolidado en **Kafka 4.0**, se elimina la dependencia externa de **Apache ZooKeeper** mediante el protocolo de consenso interno **KRaft (Kafka Raft)**. Esto reduce el consumo de memoria RAM en contenedores Docker, acelera la recuperación ante fallos y simplifica el despliegue en AWS EC2.
2. **Versionamiento de Esquemas y Eventos (*Schema Evolution*):**
   * Permite evolucionar la estructura de los mensajes (por ejemplo, añadir nuevos campos de telemetría a `PedidoEstadoEvent`) sin romper a los consumidores activos.
   * **Estrategia aplicada:** Inclusión explícita del atributo `schemaVersion: "1.0"` en el payload JSON del evento, permitiendo a los consumidores aplicar deserialización condicional o enrutar versiones incompatibles hacia tópicos versionados (ej. `pedidos-estados.v2`), siguiendo principios de compatibilidad **Backward** (consumidores nuevos leen eventos antiguos) y **Forward** (consumidores antiguos ignoran campos nuevos).