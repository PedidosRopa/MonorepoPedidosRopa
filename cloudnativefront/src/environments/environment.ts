
export const environment = {
  production: true,

  apiBaseUrl: 'https://0l0fz7jsp3.execute-api.us-east-1.amazonaws.com/',

  azure: {
    clientId: '269c19eb-1cf2-4be3-80f0-b3167584cbc1',

    tenantId: 'b71db8e1-9664-4416-9575-b24979352b34',

    redirectUri: 'https://main.d3b5udaeum350v.amplifyapp.com',

    postLogoutRedirectUri: 'https://main.d3b5udaeum350v.amplifyapp.com/login',

    loginScopes: ['openid', 'profile', 'email', 'api://f72177e7-8274-457f-8340-2c60ebb2becf/access_as_user'],

    apiScopes: ['api://f72177e7-8274-457f-8340-2c60ebb2becf/access_as_user'],
  },
};
