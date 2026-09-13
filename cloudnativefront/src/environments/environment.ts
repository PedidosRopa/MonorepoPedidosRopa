// ============================================================
// Environment de producción.
// Reemplaza los placeholders con los valores de tu App Registration en Azure Entra ID.
// No commitear valores reales: usa variables de entorno en tu pipeline.
// ============================================================
export const environment = {
  production: true,

  // URL base del backend Spring Boot (sin slash final).
  // Ej: http://localhost:8080  |  https://mi-api.azurewebsites.net
  apiBaseUrl: 'http://localhost:8080',

  azure: {
    // Client ID de la SPA registrada en Azure (Application (client) ID).
    clientId: 'YOUR_AZURE_FRONTEND_CLIENT_ID',

    // Tenant ID del directorio (Directory (tenant) ID).
    tenantId: 'YOUR_AZURE_TENANT_ID',

    // Debe estar registrada en Azure como "Single-page application" Redirect URI.
    redirectUri: 'http://localhost:4200',

    // URI de cierre de sesión (post-logout). También debe estar registrada si se usa.
    postLogoutRedirectUri: 'http://localhost:4200/login',

    // Scopes que se piden al hacer login. Incluir User.Read solo si se consume Graph.
    // Para llamar al backend, exponer un scope en "Expose an API" del registro del BACKEND
    // y pedirlo aquí, ej: api://<BACKEND_CLIENT_ID>/access_as_user
    loginScopes: ['openid', 'profile', 'email', 'api://YOUR_BACKEND_CLIENT_ID/access_as_user'],

    // Scopes usados por el MsalInterceptor para adjuntar el Bearer JWT al backend.
    apiScopes: ['api://YOUR_BACKEND_CLIENT_ID/access_as_user'],
  },
};
