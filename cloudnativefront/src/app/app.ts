import { Component, effect, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar';
import { CartSidebarComponent } from './components/ui/cart-sidebar/cart-sidebar';
import { AuthService } from './auth/auth.service';
import { CarritoService } from './core/carrito.service';

@Component({
  imports: [RouterOutlet, NavbarComponent, CartSidebarComponent],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  private readonly auth = inject(AuthService);
  private readonly carrito = inject(CarritoService);
  private estabaLogueado = false;

  constructor() {
    // Al cerrar sesión se limpia el carrito para no dejarlo a otro usuario del equipo.
    effect(() => {
      const logueado = this.auth.isLoggedIn();
      if (this.estabaLogueado && !logueado) {
        this.carrito.vaciar();
        this.carrito.cerrarSidebar();
      }
      this.estabaLogueado = logueado;
    });
  }
}
