
export const environment = {
  production: true,

  apiBaseUrl: 'http://localhost:8080',

  azure: {
    clientId: 'YOUR_AZURE_FRONTEND_CLIENT_ID',

    tenantId: 'YOUR_AZURE_TENANT_ID',

    redirectUri: 'http://localhost:4200',

    postLogoutRedirectUri: 'http://localhost:4200/login',

    loginScopes: ['openid', 'profile', 'email', 'api://YOUR_BACKEND_CLIENT_ID/access_as_user'],

    apiScopes: ['api://YOUR_BACKEND_CLIENT_ID/access_as_user'],
  },
};
