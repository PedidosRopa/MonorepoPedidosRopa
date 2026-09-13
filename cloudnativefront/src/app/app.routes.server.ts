import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    // La app usa MSAL (localStorage + redirect) que solo corre en el browser.
    // Client-side rendering evita fallos de prerender en el build/servidor.
    path: '**',
    renderMode: RenderMode.Client
  }
];
