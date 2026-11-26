#  PedidosRopa — Plataforma E-Commerce Cloud Native

Plataforma integral de comercio electrónico de vestuario construida bajo una arquitectura **Cloud Native orientada a eventos**, compuesta por una SPA en **Angular 22** desplegada en **AWS Amplify** y un backend en **Spring Boot (Java 21)** desplegado en **AWS EC2**, con autenticación federada empresarial (**Microsoft Entra ID**), mensajería híbrida (**Apache Kafka + RabbitMQ**) y pasarela de pagos en tiempo real (**Mercado Pago**).

> **Asignatura:** DSY1107 - Desarrollo Cloud Native I  
> **Integrantes:** Maximiliano Olguín · Domingo Chávez

---

##  Arquitectura General

```text
                        ┌──────────────────────────────┐
                        │     Microsoft Entra ID       │
                        │   (OAuth 2.0 / OIDC / JWT)   │
                        └──────────────┬───────────────┘
                                       │ Emite & Valida JWT (PKCE)
┌───────────────────┐                  ▼                  ┌─────────────────────────┐
│  Frontend Angular │ ───────► ┌───────────────┐ ───────► │   Backend Spring Boot   │
│   (AWS Amplify)   │          │  AWS API GW   │          │   (AWS EC2 + Docker)    │
└───────────────────┘          └───────▲───────┘          └─┬───────┬───────┬───────┘
                                       │                    │       │       │
┌───────────────────┐                  │                    │       │       ▼
│   Mercado Pago    │ ─── Webhook ─────┘                    │       │  ┌─────────┐
│  (Checkout Pro)   │   (POST /api/pagos/webhook)           │       │  │ AWS S3  │
└───────────────────┘                                       │       │  └─────────┘
                                                            │       ▼
                              ┌─────────────────────────────┤  ┌──────────────┐
                              │                             │  │   AWS RDS    │
                              ▼                             ▼  │ (PostgreSQL) │
                 ┌─────────────────────────┐   ┌──────────────┐└──────────────┘
                 │   Clúster Apache Kafka  │   │   RabbitMQ   │
                 │  (2 Brokers + Zookeeper │   │ (Colas + DLQ)│
                 │   + Kafka UI + DLT)     │   └──────────────┘
                 └─────────────────────────┘
```

### Stack Tecnológico

| Capa | Tecnologías |
| :--- | :--- |
| **Frontend (`cloudnativefront/`)** | Angular 22, TypeScript, Angular Signals, `@azure/msal-angular` & `@azure/msal-browser` (Authorization Code + PKCE), desplegado en **AWS Amplify** |
| **Backend (`cloudnative/`)** | Java 21, Spring Boot 3, Spring Security (OAuth2 Resource Server), Spring AOP, Spring Kafka, Spring AMQP |
| **Streaming & Mensajería** | Apache Kafka (`cp-kafka:7.6.1`, 2 brokers + Zookeeper + Kafka UI) y RabbitMQ 3 Management |
| **Base de Datos & Storage** | PostgreSQL en **Amazon RDS**, almacenamiento de imágenes de catálogo en **Amazon S3** |
| **Pasarela de Pagos** | SDK oficial de Mercado Pago (Checkout Pro + Webhooks asíncronos) |
| **Seguridad & API Management** | Microsoft Entra ID (RBAC con roles `Administrador`, `Repartidor`, `Cliente`) + **AWS API Gateway** |
| **Infraestructura & CI/CD** | Docker, Docker Compose y **GitHub Actions** hacia **AWS EC2** + despliegue continuo en **AWS Amplify**[cite: 4, 5, 11, 12, 13] |

---

##  Estructura del Monorepo

```text
MonorepoPedidosRopa/
├── .github/workflows/
│   └── deploy-backend.yml        # Pipeline CI/CD hacia AWS EC2
├── cloudnative/                  # Backend Spring Boot (Java 21)
│   ├── src/main/java/com/ev1/cloudnative/
│   │   ├── audit/                # Aspecto AOP (@AuditarAdmin) y productor de auditoría
│   │   ├── config/               # KafkaConfig, SecurityConfig, S3Config, RabbitConfig
│   │   ├── controllers/          # REST APIs + KafkaAdminController + PagoController
│   │   ├── dtos/                 # Contratos de API y eventos Kafka (records inmutables)
│   │   ├── model/                # Entidades JPA (Pedido, HistorialPedido, Producto, etc.)
│   │   ├── repositories/         # Spring Data JPA
│   │   └── services/             # Lógica de negocio, PagoService y consumidores Kafka
│   └── docker-compose.yml        # Orquestación de Kafka, Zookeeper, Kafka UI, RabbitMQ y Backend
└── cloudnativefront/             # Frontend SPA en Angular 22
    ├── src/app/
    │   ├── auth/                 # auth.config.ts (MSAL + protectedResourceMap), auth.service.ts, guards
    │   ├── core/                 # Modelos tipados, servicios HTTP hacia API Gateway y manejo de sesión
    │   ├── features/
    │   │   ├── catalogo/         # Vitrina pública de productos con imágenes servidas desde AWS S3
    │   │   ├── carrito/          # Gestión de carrito de compras y generación de órdenes
    │   │   ├── pedidos/          # Historial de compras y Tracker en tiempo real del pedido
    │   │   ├── pagos/            # Integración Checkout Pro y vistas de retorno (/pago-exitoso, /pago-fallido, /pago-pendiente)
    │   │   ├── reparto/          # Panel operativo para cambio de estado logístico (Repartidor)
    │   │   └── admin/            # Gestión CRUD de productos/imágenes S3 + consolas de Kafka y RabbitMQ
    │   └── shared/               # Navbar reactiva por rol, badges de estado y componentes reutilizables
    └── src/environments/         # Configuración de endpoints API Gateway y tenant/clientId de Entra ID[cite: 4, 5, 8, 11, 13]
```

---

##  Frontend (`cloudnativefront/`) — Arquitectura y Funcionalidades

La aplicación web está desarrollada en **Angular 22** utilizando **Angular Signals** (`signal`, `computed`) para manejo reactivo del estado de sesión, carrito y seguimiento de pedidos.

### Seguridad y Control de Acceso (MSAL + RBAC)

* **Flujo OAuth 2.0 / OpenID Connect con PKCE:** Configurado en `auth.config.ts` mediante `@azure/msal-browser` (`PublicClientApplication` con caché en `LocalStorage`) y `@azure/msal-angular` (`MsalGuard`, `MsalRedirectComponent`).
* **Inyección Automática de JWT (`MsalInterceptor`):** Adjunta automáticamente el header `Authorization: Bearer <token>` únicamente en las rutas protegidas definidas en `protectedResourceMap`:
  * `/api/pedidos` y `/api/pedidos/*`
  * `/api/carrito` y `/api/carrito/*`
  * `/api/pagos/*` y `/api/pagos/**`
  * `/api/admin` y `/api/admin/*`
  * Escritura en catálogo (`POST`, `PUT`, `PATCH`, `DELETE` sobre `/api/productos/**`), manteniendo `GET /api/productos` público para navegación sin login.
* **Resolución Reactiva de Roles (`AuthService`):** Extrae el claim `roles` desde `idTokenClaims` (de forma síncrona) o mediante `acquireTokenSilent` sobre el *access token* (asíncrono con deduplicación de llamadas), exponiendo señales computadas (`isAdmin`, `isStaff`, `isCliente`) y jerarquía de permisos (`ADMINISTRADOR > REPARTIDOR > CLIENTE`) consumidas por `roleGuard` para proteger rutas en el cliente[cite: 4, 5, 13].

### Vistas y Módulos por Rol

| Rol | Funcionalidades en la Interfaz |
| :--- | :--- |
| **Público (Sin sesión)** | Exploración del catálogo de prendas con imágenes alojadas en AWS S3 y detalle de productos. |
| **Cliente (`CLIENTE`)** | Gestión de carrito de compras, confirmación de pedido, pago en línea vía **Mercado Pago Checkout Pro**, vistas de retorno (`/pago-exitoso`, `/pago-fallido`, `/pago-pendiente`) y **Tracker en vivo** con línea de tiempo de estados (`Pendiente` → `Pagado` → `Procesando` → `En preparación` → `En camino` → `Entregado` → `Completado`). |
| **Repartidor (`REPARTIDOR`)** | Panel de despacho para actualizar el avance logístico de las órdenes en tiempo real (`PATCH /api/pedidos/{id}/estado`), disparando eventos en Kafka hacia el tracker del cliente. |
| **Administrador (`ADMINISTRADOR`)** | CRUD completo de productos con carga de imágenes a S3, gestión operativa de pedidos, **Consola de Administración Kafka** (creación, edición en caliente y borrado de tópicos + monitoreo de Consumer Groups) y **Consola de RabbitMQ** (colas, exchanges y bindings)[cite: 1, 4, 5, 8, 13]. |

---

##  Streaming de Eventos con Apache Kafka

El sistema utiliza **Apache Kafka** para desacoplar el seguimiento logístico en tiempo real y la auditoría administrativa, coexistiendo con **RabbitMQ** (encargado de colas transaccionales puntuales con `ACK` manual y `DLQ`).

### Tópicos y Dimensionamiento

| Tópico | Propósito | Particiones | Réplicas | Retención | Clave |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `pedidos-estados` | Transiciones de estado del pedido (`PENDIENTE` → `PAGADO` → `ENTREGADO`) | 3 | 2 | 7 días | `idPedido` |
| `pedidos-estados.DLT` | Dead Letter Topic para eventos de pedidos fallidos tras reintentos | 3 | 2 | 14 días | Clave original |
| `auditoria-admin` | Bitácora inmutable de acciones administrativas capturadas vía AOP | 3 | 2 | 30 días | `adminEmail` |
| `auditoria-admin.DLT` | Dead Letter Topic para eventos de auditoría inválidos o fallidos | 3 | 2 | 30 días | Clave original[cite: 13] |

### Fan-Out con Consumer Groups Independientes

* **`tracker-group`** (`PedidoEstadoConsumer.registrarHistorialTracker`): Persiste cada transición en `historial_pedidos` para alimentar el tracker en vivo del cliente.
* **`pedidos-group`** (`PedidoEstadoConsumer.sincronizarYAnalizarPedido`): Sincroniza el estado maestro del pedido y calcula métricas de ciclo logístico.
* **`auditoria-logs-group`** (`AdminAuditConsumer.registrarBitacoraAdmin`): Registra todas las operaciones ejecutadas bajo `@AuditarAdmin`.
* **`auditoria-alertas-group`** (`AdminAuditConsumer.evaluarAlertasSeguridad`): Filtra operaciones destructivas (eliminación de productos, tópicos o colas) y dispara `[ALERTA-SEGURIDAD]`[cite: 13].

### Tolerancia a Fallos

* Publicación confiable con `acks=all` y `retries=3`.
* Manejo de errores en consumidores con `DefaultErrorHandler` (`FixedBackOff` de 3 reintentos cada 2 segundos) y derivación automática mediante `DeadLetterPublishingRecoverer` hacia los tópicos `.DLT`[cite: 13].

---

##  Flujo de Pago Automatizado (Mercado Pago + Webhooks)
1. El cliente presiona **"Pagar con Mercado Pago"** en el Tracker de Angular (`POST /api/pagos/preferencia/{idPedido}` con Bearer JWT).
2. `PagoService` crea la preferencia en Mercado Pago inyectando dinámicamente `notificationUrl` (`MP_WEBHOOK_URL`) apuntando al endpoint público de AWS API Gateway y redirige al usuario a Checkout Pro.
3. Al aprobarse el pago, Mercado Pago envía un `POST /api/pagos/webhook` (ruta pública `.permitAll()` en `SecurityConfig` y sin Authorizer en API Gateway).
4. `PagoController` consulta el estado oficial del pago contra la API de Mercado Pago, marca el pedido como `PAGADO` y publica el evento en `pedidos-estados` para actualizar el historial del cliente en tiempo real[cite: 2, 4, 8, 13].

---

##  Endpoints Administrativos de Mensajería
Protegidos con `@PreAuthorize("hasRole('Administrador')")` y auditados automáticamente con `@AuditarAdmin`:

* `GET /api/admin/kafka/topics` — Lista tópicos, particiones, réplicas y configuraciones activas.
* `POST /api/admin/kafka/topics` — Crea nuevos tópicos con particiones, réplicas y retención personalizadas.
* `PATCH /api/admin/kafka/topics/{nombre}/config` — Modifica `retention.ms` o `cleanup.policy` en caliente.
* `DELETE /api/admin/kafka/topics/{nombre}` — Elimina tópicos.
* `GET /api/admin/kafka/consumer-groups` — Inspecciona estado, miembros y particiones asignadas por grupo.
* `/api/admin/rabbitmq/**` — Administración equivalente de colas, exchanges y bindings en RabbitMQ[cite: 13].

---

##  Despliegue y Ejecución

### CI/CD en la Nube

* **Frontend (`cloudnativefront/`):** Despliegue continuo automatizado en **AWS Amplify** (`https://deploy.d2oilif5re81zp.amplifyapp.com`).
* **Backend (`cloudnative/`):** Despliegue automatizado en **AWS EC2** mediante **GitHub Actions** (`.github/workflows/deploy-backend.yml`) ante cada `push` a la rama `deploy` que modifique `cloudnative/**`[cite: 12, 13].

### Secrets / Variables Requeridas (Backend)

| Variable | Descripción |
| :--- | :--- |
| `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` | Conexión JDBC hacia PostgreSQL en Amazon RDS |
| `AZURE_TENANT_ID`, `AZURE_CLIENT_ID` | Configuración de Microsoft Entra ID para validación JWT |
| `AWS_S3_BUCKET`, `AWS_REGION` | Bucket S3 para almacenamiento de imágenes de productos |
| `MP_ACCESS_TOKEN` | Credencial privada del SDK de Mercado Pago |
| `MP_WEBHOOK_URL` | URL pública de API Gateway hacia `POST /api/pagos/webhook` |
| `FRONTEND_URL` | URL pública del frontend en AWS Amplify (para `backUrls` y CORS) |
| `EC2_HOST`, `EC2_USERNAME`, `EC2_SSH_KEY` | Credenciales SSH utilizadas por GitHub Actions para desplegar[cite: 11, 12] |

### Ejecución Local

**1. Backend y Mensajería (`cloudnative/`):**
```bash
cd cloudnative
docker compose up -d --build
```
* **API Backend & Swagger UI:** `http://localhost:8080/swagger-ui.html`
* **Kafka UI:** `http://localhost:8090`
* **RabbitMQ Management:** `http://localhost:15672`[cite: 11, 13]

**2. Frontend Angular (`cloudnativefront/`):**
```bash
cd cloudnativefront
npm install
npm start
ng serve
```
* **Aplicación Web:** `http://localhost:4200`