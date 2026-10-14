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
  // Todas las llamadas a la API del backend llevan el access token del scope de la API.
  protectedResourceMap.set(`${environment.apiBaseUrl}/api/*`, [...environment.azure.apiScopes]);
  // Entrada adicional por si se usa URL relativa tras proxy (ej: "ng serve --proxy-config").
  protectedResourceMap.set('/api/*', [...environment.azure.apiScopes]);

  return {
    interactionType: InteractionType.Redirect,
    protectedResourceMap,
  };
}
