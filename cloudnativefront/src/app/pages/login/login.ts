import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class LoginComponent {
  protected readonly auth = inject(AuthService);
  protected readonly tokenPreview = signal<string | null>(null);
  protected readonly loadingToken = signal(false);

  login(): void {
    this.auth.login();
  }

  logout(): void {
    this.auth.logout();
    this.tokenPreview.set(null);
  }

  async verToken(): Promise<void> {
    this.loadingToken.set(true);
    try {
      const token = await this.auth.getAccessToken();
      this.tokenPreview.set(token ? `${token.slice(0, 60)}… (largo ${token.length})` : 'No se pudo obtener token. Revisa scopes en environment.');
    } finally {
      this.loadingToken.set(false);
    }
  }
}
