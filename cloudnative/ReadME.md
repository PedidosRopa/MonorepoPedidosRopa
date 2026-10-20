# PedidosRopa — Backend

API REST para catálogo e inventario de ropa y gestión de pedidos. Este módulo está desarrollado con Java y Spring Boot y forma parte del monorepo junto con el frontend Angular de [`cloudnativefront`](../cloudnativefront/README.md).

## Contenido

- [Arquitectura y tecnologías](#arquitectura-y-tecnologías)
- [Requisitos](#requisitos)
- [Configuración](#configuración)
- [Ejecución local](#ejecución-local)
- [API REST](#api-rest)
- [Autenticación y autorización](#autenticación-y-autorización)
- [Persistencia y reglas de negocio](#persistencia-y-reglas-de-negocio)
- [RabbitMQ](#rabbitmq)
- [Pruebas y documentación de API](#pruebas-y-documentación-de-api)
- [Contenedores y despliegue](#contenedores-y-despliegue)

## Arquitectura y tecnologías

La aplicación es un único servicio Spring Boot; no implementa un BFF ni un API Gateway propio. En el despliegue actual, el frontend se sirve por AWS Amplify y consume esta API a través del API Gateway configurado en el entorno de producción.

| Área | Implementación |
| --- | --- |
| Lenguaje y runtime | Java 21 |
| Framework web | Spring Boot 4.1.1, Spring MVC |
| Seguridad | Spring Security OAuth2 Resource Server; valida access tokens JWT de Microsoft Entra ID |
| Datos | Spring Data JPA / Hibernate y PostgreSQL |
| Mensajería | Spring AMQP y RabbitMQ |
| Validación y mapeo | Jakarta Validation, MapStruct y Lombok |
| API docs | Springdoc OpenAPI 2.8.14 / Swagger UI |
| Build | Maven Wrapper |

PostgreSQL es el único driver de base de datos incluido. No hay configuración ni dependencia H2 en el proyecto actual.

## Requisitos

- JDK 21.
- PostgreSQL accesible desde el proceso del backend.
- RabbitMQ accesible desde el proceso del backend.
- Una app registration de Microsoft Entra ID para la API, con el scope delegado `access_as_user`, además del tenant y audience correspondientes.
- Maven no es necesario si se utiliza el Maven Wrapper incluido.

## Configuración

La configuración está en `src/main/resources/application.properties`. Las credenciales y las direcciones de servicios se pasan mediante variables de entorno; no se deben guardar secretos en el repositorio.

| Variable | Uso |
| --- | --- |
| `DB_URL` | URL JDBC de PostgreSQL, por ejemplo `jdbc:postgresql://localhost:5432/pedidosropa`. Obligatoria. |
| `DB_USERNAME` | Usuario de PostgreSQL. Obligatoria. |
| `DB_PASSWORD` | Contraseña de PostgreSQL. Obligatoria. |
| `AZURE_TENANT_ID` | Tenant de Entra ID que emite los tokens. Obligatoria. |
| `AZURE_CLIENT_ID` | Audience de la API; la configuración admite el ID y `api://<AZURE_CLIENT_ID>`. Obligatoria. |
| `RABBITMQ_HOST` | Host de RabbitMQ; por defecto, `rabbitmq` (nombre del servicio en Docker Compose). |
| `RABBITMQ_PORT` | Puerto AMQP; por defecto, `5672`. |
| `RABBITMQ_USERNAME` | Usuario AMQP; por defecto, `guest`. |
| `RABBITMQ_PASSWORD` | Contraseña AMQP; por defecto, `guest`. |

La URL del issuer se deriva de `AZURE_TENANT_ID`: `https://login.microsoftonline.com/<AZURE_TENANT_ID>/v2.0`. El frontend solicita el scope de API delegado `api://<id-de-la-api>/access_as_user`; debe corresponder a la audiencia que valida este servicio.

JPA tiene `spring.jpa.hibernate.ddl-auto=update`: Hibernate actualiza el esquema al iniciar. No hay un sistema de migraciones versionadas configurado.

### CORS

`SecurityConfig` permite actualmente el origen de producción `https://deploy.d2oilif5re81zp.amplifyapp.com`, los métodos HTTP comunes y las cabeceras usadas por Angular/MSAL. `http://localhost:4200` no está incluido. Para ejecutar el frontend local en un navegador, se debe permitir explícitamente su origen en `SecurityConfig` y reiniciar el backend. Ajustar esta lista al dominio real al cambiar el dominio del frontend; no se habilitan orígenes arbitrarios.

## Ejecución local

### 1. Iniciar RabbitMQ

Desde `cloudnative`, levantar solo el servicio RabbitMQ definido en `docker-compose.yml`:

```bash
docker compose up -d rabbitmq
```

El servicio publica AMQP en `localhost:5672` y la consola de administración en `http://localhost:15672`. El backend ejecutado directamente desde el host debe conectarse a `localhost`, no al hostname Docker `rabbitmq`.

### 2. Preparar PostgreSQL

Crear una base de datos y un usuario, y asegurarse de que PostgreSQL escucha en una dirección accesible al backend. PostgreSQL no está incluido como servicio en el `docker-compose.yml`.

### 3. Exportar variables y arrancar Spring Boot

Ejemplo para PowerShell; reemplazar los valores de ejemplo por la configuración local de la base de datos y de Entra ID:

```powershell
$env:DB_URL = "jdbc:postgresql://localhost:5432/pedidosropa"
$env:DB_USERNAME = "<usuario>"
$env:DB_PASSWORD = "<contraseña>"
$env:AZURE_TENANT_ID = "<tenant-id>"
$env:AZURE_CLIENT_ID = "<api-client-id>"
$env:RABBITMQ_HOST = "localhost"
$env:RABBITMQ_PORT = "5672"
$env:RABBITMQ_USERNAME = "guest"
$env:RABBITMQ_PASSWORD = "guest"
.\mvnw.cmd spring-boot:run
```

En macOS/Linux se puede usar `./mvnw spring-boot:run` y exportar las mismas variables con el mecanismo del shell. La API queda disponible en `http://localhost:8080`.

Para probar endpoints autenticados, iniciar sesión mediante el frontend o adquirir un access token válido para el scope de la API. La ruta pública del catálogo no requiere token.

## API REST

Todos los endpoints están bajo `/api`. Los ejemplos de respuesta omiten campos que pueden ser `null` y muestran la forma general, no datos reales.

### Productos — `/api/productos`

| Método y ruta | Acceso | Resultado |
| --- | --- | --- |
| `GET /api/productos` | Público | Lista el catálogo. Acepta `categoria` y/o `talla`; si se envían ambos, aplica ambos filtros. |
| `GET /api/productos/{id}` | Público | Consulta un producto por ID. |
| `POST /api/productos` | JWT | Crea un producto y devuelve `201 Created`. |
| `DELETE /api/productos/{id}` | JWT | Elimina un producto y devuelve `204 No Content`. |

Ejemplo de cuerpo para crear un producto:

```json
{
  "nombre": "Polera básica",
  "descripcion": "Algodón",
  "precio": 12990,
  "stock": 20,
  "categoria": "Poleras",
  "talla": "M",
  "genero": "Unisex"
}
```

`nombre`, `categoria` y `talla` son obligatorios; `precio` debe ser positivo y `stock` no puede ser negativo.

### Pedidos — `/api/pedidos`

| Método y ruta | Acceso | Resultado |
| --- | --- | --- |
| `GET /api/pedidos` | JWT | Lista todos los pedidos del sistema. No hay una restricción de rol administrador implementada. |
| `GET /api/pedidos/mis-pedidos` | JWT | Filtra por la identidad extraída del JWT. |
| `POST /api/pedidos` | JWT | Valida y descuenta stock, calcula el total en el servidor, persiste el pedido y publica el evento de pedido. Devuelve `201 Created`. |
| `DELETE /api/pedidos/{id}` | JWT | Cancela el pedido, repone el stock y devuelve `204 No Content`. No comprueba que el pedido pertenezca al usuario autenticado. |

Ejemplo de creación:

```json
{
  "descPedido": "Entregar por la tarde",
  "items": [
    { "productoId": 1, "cantidad": 2 },
    { "productoId": 4, "cantidad": 1 }
  ]
}
```

`items` debe contener al menos un elemento, cada `productoId` debe existir y `cantidad` debe ser al menos 1. El precio, subtotal, total, estado inicial (`PENDIENTE`), fecha y usuario no se aceptan del cliente: el backend los establece usando los datos del producto y del JWT.

La respuesta contiene `idPedido`, `descPedido`, `usuarioEmail`, `montoTotal`, `estado`, `fechaPedido` y `detalles`. Cada detalle incluye ID y nombre del producto, cantidad, precio unitario congelado al momento de la compra y subtotal.

### Administración de RabbitMQ — `/api/admin/rabbitmq`

Todas las rutas requieren un JWT válido. No hay autorización por roles ni endpoints de consulta/listado en este controlador.

| Método y ruta | Resultado |
| --- | --- |
| `POST /api/admin/rabbitmq/queues` | Crea una cola (`201`). Body: `{"nombre":"cola.demo","durable":true}`. |
| `DELETE /api/admin/rabbitmq/queues/{nombre}` | Elimina la cola (`204`) o devuelve `404` si no existía. |
| `POST /api/admin/rabbitmq/exchanges` | Crea un exchange `direct`, `topic` o `fanout` (`201`). Body: `{"nombre":"exchange.demo","tipo":"direct"}`. |
| `DELETE /api/admin/rabbitmq/exchanges/{nombre}` | Elimina el exchange (`204`) o devuelve `404` si no existía. |
| `POST /api/admin/rabbitmq/bindings` | Vincula una cola con un exchange (`201`). Body: `{"colaNombre":"cola.demo","exchangeNombre":"exchange.demo","routingKey":"demo.key"}`. |

No existe una ruta para eliminar bindings. Estas operaciones modifican la topología real del broker; usarlas con cuidado.

### Errores

La validación de los cuerpos, el stock insuficiente y la cancelación de un pedido ya cancelado producen `400 Bad Request`; un pedido inexistente produce `404 Not Found`. La eliminación de una cola o exchange inexistente también produce `404`. Los errores manejados se devuelven en formato `ProblemDetail`. Una petición sin token válido a una ruta protegida recibe `401` o `403`, según el caso.

**Comportamiento actual a tener en cuenta:** la consulta o eliminación de un producto inexistente lanza una `RuntimeException` genérica en `ProductoService`; el manejador global no la convierte en `404`, por lo que actualmente acaba como `500 Internal Server Error`.

## Autenticación y autorización

El backend actúa como OAuth2 Resource Server: valida firma, emisor, expiración y audience del JWT contra los metadatos/JWKS de Microsoft Entra ID. El frontend usa MSAL para el inicio de sesión y envía un access token, no un ID token, al scope de la API en `Authorization: Bearer <access-token>`.

- Son públicos Swagger/OpenAPI, las peticiones `OPTIONS` y las rutas `GET /api/productos/**`.
- Cualquier otra ruta requiere un JWT válido.
- El email del pedido se toma de `preferred_username`, luego de `email`, y como último recurso de `sub`.
- La configuración actual no define roles ni permisos específicos para endpoints de administrador. En particular, `GET /api/pedidos` devuelve todos los pedidos a cualquier usuario autenticado.

## Persistencia y reglas de negocio

- `Producto`: nombre, descripción, precio, stock, categoría, talla y género.
- `Pedido`: usuario, fecha, descripción, total y estado.
- `DetallePedido`: producto, cantidad y precio unitario de la compra.
- Un pedido puede estar en `PENDIENTE`, `PENDIENTE_APROBACION`, `PROCESANDO`, `COMPLETADO` o `CANCELADO`. El flujo de creación actual establece `PENDIENTE`; el endpoint de cancelación lo cambia a `CANCELADO`.
- La creación del pedido verifica el stock por producto, calcula el precio en el servidor y descuenta unidades dentro de una transacción.
- La cancelación repone las unidades de los detalles y no permite cancelar dos veces el mismo pedido.

## RabbitMQ

Al iniciar, Spring declara exchanges, colas durables y bindings para pedidos y productos.

| Flujo | Exchange y tipo | Cola | Routing key | DLX / DLQ |
| --- | --- | --- | --- | --- |
| Pedido | `pedidos.exchange` (`topic`) | `pedidos.procesamiento.queue` | `pedidos.creado.routing.key` | `pedidos.dlx` / `pedidos.procesamiento.dlq`, key `pedidos.dlq.routing.key` |
| Producto | `productos.exchange` (`direct`) | `productos.procesamiento.queue` | `productos.routing.key` | `productos.dlx` / `productos.procesamiento.dlq`, key `productos.dlq.routing.key` |

Al crear un pedido, el servicio publica un evento JSON con ID, usuario, total, fecha y resumen de productos. El listener de pedidos simula el procesamiento, confirma mensajes válidos (`ACK`) y envía mensajes fallidos a la DLQ (`NACK` sin reencolar). El listener de la DLQ registra el evento y lo confirma.

Aunque la topología de productos está declarada y existe un DTO de stock bajo, en el código actual no hay publicador ni listener de eventos de producto. La DLQ de productos tampoco tiene un listener implementado.

Los nombres de esta topología se encuentran en `application.properties`; la conexión se configura con las variables `RABBITMQ_*` descritas arriba.

## Pruebas y documentación de API

Desde `cloudnative`:

```bash
./mvnw test
```

En Windows:

```powershell
.\mvnw.cmd test
```

La suite actual contiene una prueba de carga del contexto (`contextLoads`); no representa pruebas funcionales de todos los endpoints o del broker.

Con la aplicación en ejecución:

- Swagger UI: `http://localhost:8080/swagger-ui/index.html`
- OpenAPI JSON: `http://localhost:8080/v3/api-docs`

## Contenedores y despliegue

El `dockerfile` construye un JAR con Maven y Java 21 y lo ejecuta en una imagen JRE. `docker-compose.yml` define el backend y RabbitMQ, pero **no** define PostgreSQL. Para levantar el backend en Compose, hay que proporcionar en el entorno o en un archivo `.env` las variables de base de datos y Entra ID indicadas antes; `DB_URL` debe ser alcanzable desde el contenedor (en Windows/macOS, `localhost` dentro del contenedor no es el host). En la red de Compose el backend debe usar `RABBITMQ_HOST=rabbitmq`.

RabbitMQ restringe por defecto el usuario `guest` a conexiones locales al propio broker. Como el backend en Compose se conecta desde otro contenedor, hay que configurar un usuario/contraseña no predeterminados en el broker y proporcionar los mismos valores mediante `RABBITMQ_USERNAME` y `RABBITMQ_PASSWORD` al backend. El Compose actual no configura esas credenciales de broker.

Ejemplo de ciclo de vida, tras preparar las variables y una base de datos accesible:

```bash
docker compose up --build -d
docker compose logs -f backend
docker compose down
```

El repositorio configura el build de Amplify para el frontend. No contiene una configuración de despliegue del backend a API Gateway, EC2 o RDS; esos recursos deben configurarse por separado y sus direcciones/orígenes deben coincidir con la configuración del frontend y CORS.
