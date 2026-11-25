import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar';
import { CartSidebarComponent } from './components/ui/cart-sidebar/cart-sidebar';

@Component({
  imports: [RouterOutlet, NavbarComponent, CartSidebarComponent],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {}
