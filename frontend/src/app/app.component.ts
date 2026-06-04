import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterLink, RouterOutlet],
  template: `
    @if (showHeader) {
    <header class="app-header">
      <a class="brand" routerLink="/login">AI Customer Support</a>
      <nav>
        <a routerLink="/login">Login</a>
        <a routerLink="/register">Register</a>
      </nav>
    </header>
    }
    <router-outlet></router-outlet>
  `
})
export class AppComponent {
  showHeader = false;
}
