import {
  IPublicClientApplication,
  PublicClientApplication,
  InteractionType,
  BrowserCacheLocation,
  LogLevel,
} from '@azure/msal-browser';
import {
  MsalGuardConfiguration,
  MsalInterceptorConfiguration,
} from '@azure/msal-angular';
import { environment } from '../../environments/environment';

export const loginRequest = {
  scopes: [...environment.azure.loginScopes],
};

export function msalInstanceFactory(): IPublicClientApplication {
  return new PublicClientApplication({
    auth: {
      clientId: environment.azure.clientId,
      authority: `https://login.microsoftonline.com/${environment.azure.tenantId}`,
      redirectUri: environment.azure.redirectUri,
      postLogoutRedirectUri: environment.azure.postLogoutRedirectUri,
    },
    cache: {
      cacheLocation: BrowserCacheLocation.LocalStorage,
    },
    system: {
      loggerOptions: {
        loggerCallback: (level, message) => {
          if (level <= LogLevel.Warning) {
            // eslint-disable-next-line no-console
            console.log(`[MSAL ${LogLevel[level]}] ${message}`);
          }
        },
        logLevel: LogLevel.Warning,
        piiLoggingEnabled: false,
      },
    },
  });
}

export function msalGuardConfigFactory(): MsalGuardConfiguration {
  return {
    interactionType: InteractionType.Redirect,
    authRequest: loginRequest,
  };
}

export function msalInterceptorConfigFactory(): MsalInterceptorConfiguration {
  const protectedResourceMap = new Map<string, Array<string> | null>();
  // Endpoints protegidos del backend requieren Bearer JWT.
  // Los endpoints públicos (GET /api/productos) NO están en este mapa para evitar
  // redirecciones automáticas a Microsoft cuando no hay sesión activa.
  protectedResourceMap.set(`${environment.apiBaseUrl}/api/pedidos/*`, [...environment.azure.apiScopes]);
  protectedResourceMap.set(`${environment.apiBaseUrl}/api/carrito/*`, [...environment.azure.apiScopes]);
  protectedResourceMap.set(`${environment.apiBaseUrl}/api/admin/*`, [...environment.azure.apiScopes]);
  protectedResourceMap.set('/api/pedidos/*', [...environment.azure.apiScopes]);
  protectedResourceMap.set('/api/carrito/*', [...environment.azure.apiScopes]);
  protectedResourceMap.set('/api/admin/*', [...environment.azure.apiScopes]);

  return {
    interactionType: InteractionType.Popup,
    protectedResourceMap,
  };
}
