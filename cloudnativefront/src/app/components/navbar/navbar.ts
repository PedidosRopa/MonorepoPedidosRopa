import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { CarritoService } from '../../core/carrito.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class NavbarComponent {
  protected readonly auth = inject(AuthService);
  protected readonly carrito = inject(CarritoService);

  login(): void {
    this.auth.login();
  }

  logout(): void {
    this.auth.logout();
  }

  toggleCarrito(): void {
    this.carrito.toggleSidebar();
  }
}
