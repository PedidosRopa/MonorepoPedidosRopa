# Cloudnativefront

Frontend Angular 22 (standalone components + SSR) del sistema de pedidos de ropa.
Consume el backend `cloudnative` (Spring Boot) vía REST con un JWT de Microsoft Entra ID (IDaaS) inyectado automáticamente por `MsalInterceptor`.

## Funcionalidades (alineadas con el backend)

| Vista | Ruta | Endpoint(s) del backend |
| --- | --- | --- |
| Productos | `/productos` (pública) | `GET/POST/DELETE /api/productos` (+ filtros `?categoria=&talla=`) |
| Nuevo pedido | `/nuevo-pedido` (protegida) | `POST /api/pedidos` con `{ descPedido, items }` (el monto y estado los calcula el back) |
| Mis pedidos | `/pedidos` (protegida) | `GET /api/pedidos`, `GET /api/pedidos/mis-pedidos`, `DELETE /api/pedidos/{id}` |
| Admin RabbitMQ | `/admin-rabbit` (protegida) | `POST/DELETE /api/admin/rabbitmq/{queues,exchanges,bindings}` |
| Login | `/login` | OAuth 2.0 / OpenID Connect con Microsoft Entra ID (MSAL redirected flow) |

- El JWT se envía como `Authorization: Bearer <token>` en cada llamada a `/api/*` (ver `src/app/auth/auth.config.ts` → `protectedResourceMap`).
- Los modelos/DTOs de `src/app/core/models.ts` reflejan los `dtos` del backend (`PedidoRequestDto`, `PedidoResponseDto`, `ProductoDto`, `QueueRequestDTO`, `ExchangeRequestDTO`, `BindingRequestDTO`).

## Ejecución local

1. Levanta el backend (`../cloudnative`, usa RabbitMQ con `docker-compose up -d rabbitmq` si vas a probar mensajería).
2. Levanta el frontend:

```bash
npm install
ng serve
```

- `ng serve` usa la configuración **development** (`environment.development.ts`): backend en `http://localhost:8080` y redirect en `http://localhost:4200`.
- Para que el login funcione en local, la app registration de Entra ID debe tener `http://localhost:4200` como redirect URI (SPA).
- `ng build` (producción) usa `environment.ts`: apunta al API Gateway (`apiBaseUrl`) y a los redirect URIs desplegados en la nube, listo para desplegar sin cambios adicionales.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
