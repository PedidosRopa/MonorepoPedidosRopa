// ============================================================
// Environment de desarrollo (ng serve).
// Reemplaza los placeholders con los valores de tu App Registration en Azure Entra ID.
// ============================================================
export const environment = {
  production: false,

  // URL base del backend Spring Boot (sin slash final).
  apiBaseUrl: 'http://localhost:8080',

  azure: {
    // Client ID de la SPA registrada en Azure (Application (client) ID).
    clientId: 'YOUR_AZURE_FRONTEND_CLIENT_ID',

    // Tenant ID del directorio (Directory (tenant) ID).
    tenantId: 'YOUR_AZURE_TENANT_ID',

    // Debe estar registrada en Azure como "Single-page application" Redirect URI.
    redirectUri: 'http://localhost:4200',

    postLogoutRedirectUri: 'http://localhost:4200/login',

    loginScopes: ['openid', 'profile', 'email', 'api://YOUR_BACKEND_CLIENT_ID/access_as_user'],

    apiScopes: ['api://YOUR_BACKEND_CLIENT_ID/access_as_user'],
  },
};
