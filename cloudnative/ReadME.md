# PedidosRopa - Backend Cloud Native

Sistema backend RESTful desarrollado en Java con Spring Boot para la gestión de productos y pedidos en la arquitectura de la aplicación **App de pedidos** (Asignatura: Desarrollo Cloud Native I - DSY1107).

---

## Arquitectura del Sistema

* **Frontend:** Angular con integración MSAL para login federado contra Azure AD.
* **API Gateway:** AWS API Gateway como puerta de entrada unificada y enrutador público.
* **Backend:** Microservicio en Spring Boot desplegado en instancias AWS EC2, actuando como BFF y servidor de recursos.
* **Identidad (IDaaS):** Azure AD emite y valida tokens JWT (comprobación de firma, expiración e issuer).
* **Base de Datos:** Persistencia relacional conectada mediante Spring Data JPA.

---

## Tecnologías Utilizadas

* **Lenguaje:** Java 21 (LTS)
* **Framework:** Spring Boot 3.4.x
* **Seguridad:** Spring Security + OAuth2 Resource Server (JWT validation)
* **Persistencia:** Spring Data JPA / Hibernate
* **Base de Datos:** H2 (Desarrollo local) / PostgreSQL o MySQL (Producción AWS RDS)
* **Documentación:** SpringDoc OpenAPI 3 / Swagger UI
* **Utilidades:** Lombok

---

## Modelo de Dominio

### Entidad: `Producto`

| Atributo | Tipo | Descripción |
| :--- | :--- | :--- |
| `idProducto` | `Long` | Identificador único autogenerado (`@Id`) |
| `nombre` | `String` | Nombre comercial del producto |
| `descripcion` | `String` | Detalle del producto |
| `precio` | `Double` | Valor unitario |
| `stock` | `Integer` | Cantidad disponible en inventario |

### Entidad: `Pedido`

| Atributo | Tipo | Descripción |
| :--- | :--- | :--- |
| `idPedido` | `Long` | Identificador único autogenerado (`@Id`) |
| `descPedido` | `String` | Descripción u observaciones del pedido |
| `usuarioEmail` | `String` | Email del cliente (extraído dinámicamente del JWT) |
| `montoTotal` | `Double` | Total a pagar |
| `fechaPedido` | `LocalDateTime` | Fecha y hora de creación |
| `estado` | `String` | Estado inicial (`"PENDIENTE"`) |

---

## 🔒 Seguridad y Flujo de Autorización

1. El cliente envía el token JWT recibido de Azure AD en la cabecera `Authorization: Bearer <token>`.
2. `SecurityConfig` intercepta la petición a través de OAuth2 Resource Server.
3. Spring Security valida contra Azure AD la vigencia, la firma digital y el issuer de la clave.
4. El controlador lee el claim `preferred_username` o `email` mediante `@AuthenticationPrincipal Jwt jwt` para filtrar u asociar registros por usuario de forma transparente.

---

## 🚀 Endpoints de la API

### Módulo de Productos (`/api/productos`)

| Método | Endpoint | Acceso | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/productos` | Público | Lista el catálogo completo de productos |
| `GET` | `/api/productos/{id}` | Autenticado | Obtiene el detalle de un producto por ID |
| `POST` | `/api/productos` | Autenticado | Registra un nuevo producto en la base de datos |
| `DELETE` | `/api/productos/{id}` | Autenticado | Elimina un producto por ID |

### Módulo de Pedidos (`/api/pedidos`)

| Método | Endpoint | Acceso | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/pedidos` | Autenticado | Obtiene la totalidad de los pedidos |
| `GET` | `/api/pedidos/mis-pedidos` | Autenticado | Retorna **únicamente** los pedidos asignados al email del JWT |
| `POST` | `/api/pedidos` | Autenticado | Registra una nueva orden vinculando el email del usuario del token |
| `DELETE` | `/api/pedidos/{id}` | Autenticado | Cancela o elimina una orden de compra |

---

## Configuración y Ejecución

### 1. Requisitos Previos

* JDK 21 instalado.
* Maven 3.8+ o Wrapper de Maven (`./mvnw`).

### 2. Pasos de Ejecución

```bash
# 1. Clonar el repositorio
git clone <URL_DEL_REPOSITO>

# 2. Entrar al directorio del proyecto
cd cloudnative

# 3. Compilar el proyecto omite las pruebas
mvn clean package -DskipTests

# 4. Iniciar la aplicación
mvn spring-boot:run