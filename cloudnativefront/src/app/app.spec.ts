import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Subject, of } from 'rxjs';
import { InteractionStatus } from '@azure/msal-browser';
import { MsalBroadcastService, MsalService } from '@azure/msal-angular';
import { App } from './app';

/** Stubs mínimos de MSAL: evitan abrir una sesión real en pruebas. */
const msalServiceStub = {
  handleRedirectObservable: () => of(null),
  loginRedirect: () => of(null),
  logoutRedirect: () => of(null),
  instance: {
    getAllAccounts: () => [],
    getActiveAccount: () => null,
    setActiveAccount: () => undefined,
    acquireTokenSilent: () => of(null),
  },
};

const msalBroadcastStub = {
  inProgress$: of(InteractionStatus.None),
  // Subject que nunca emite: evita procesar eventos de MSAL en pruebas.
  msalSubject$: new Subject<never>(),
};

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        { provide: MsalService, useValue: msalServiceStub },
        { provide: MsalBroadcastService, useValue: msalBroadcastStub },
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the navbar brand', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.brand')?.textContent).toContain('PedidosRopa');
  });
});
