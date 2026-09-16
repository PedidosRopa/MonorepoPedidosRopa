
export const environment = {
  production: true,

  apiBaseUrl: 'http://localhost:8080',

  azure: {
    clientId: '269c19eb-1cf2-4be3-80f0-b3167584cbc1',

    tenantId: 'b71db8e1-9664-4416-9575-b24979352b34',

    redirectUri: 'http://localhost:4200',

    postLogoutRedirectUri: 'http://localhost:4200/login',

    loginScopes: ['openid', 'profile', 'email', 'api://f72177e7-8274-457f-8340-2c60ebb2becf/access_as_user'],

    apiScopes: ['api://f72177e7-8274-457f-8340-2c60ebb2becf/access_as_user'],
  },
};
