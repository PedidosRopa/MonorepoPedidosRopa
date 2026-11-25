import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { CarritoService } from '../../core/carrito.service';
import { Icon } from '../ui/icon';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, Icon],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavbarComponent {
  protected readonly auth = inject(AuthService);
  protected readonly carrito = inject(CarritoService);

  login(): void {
    this.auth.login();
  }

  toggleCarrito(): void {
    this.carrito.toggleSidebar();
  }
}
