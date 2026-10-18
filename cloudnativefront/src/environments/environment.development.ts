
export const environment = {
  production: false,

  // URL base del backend Spring Boot (mvnw spring-boot:run en ./cloudnative)
  apiBaseUrl: 'http://localhost:8080',

  azure: {
    // App registration (SPA) del frontend en Microsoft Entra ID.
    clientId: '269c19eb-1cf2-4be3-80f0-b3167584cbc1',

    // Tenant del IDaaS.
    tenantId: 'b71db8e1-9664-4416-9575-b24979352b34',

    // Redirect local: debe estar registrado en la app de Entra ID.
    redirectUri: 'http://localhost:4200',

    postLogoutRedirectUri: 'http://localhost:4200/login',

    // App registration (API) del backend: scope delegado access_as_user.
    loginScopes: ['openid', 'profile', 'email', 'api://f72177e7-8274-457f-8340-2c60ebb2becf/access_as_user'],

    apiScopes: ['api://f72177e7-8274-457f-8340-2c60ebb2becf/access_as_user'],
  },
};
