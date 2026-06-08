import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  standalone: true,
  imports: [FormsModule, RouterLink],
  styleUrls: ['../auth-page.styles.css'],
  template: `
    <main class="auth-page">
      <section class="auth-shell" aria-label="Login to AI Support Triage">
        <section class="brand-panel" aria-label="AI Support Triage">
          <div class="brand-row">
            <svg class="brand-icon" viewBox="0 0 80 80" aria-hidden="true">
              <defs>
                <linearGradient id="brandBlueLogin" x1="0" x2="1" y1="0" y2="1">
                  <stop offset="0" stop-color="#0b6de0"/>
                  <stop offset="1" stop-color="#043fa6"/>
                </linearGradient>
              </defs>
              <path d="M17 41c0-15 10-26 23-26s23 11 23 26" fill="none" stroke="url(#brandBlueLogin)" stroke-width="4" stroke-linecap="round"/>
              <rect x="18" y="35" width="13" height="24" rx="7" fill="url(#brandBlueLogin)"/>
              <rect x="49" y="35" width="13" height="24" rx="7" fill="url(#brandBlueLogin)"/>
              <rect x="26" y="28" width="28" height="26" rx="10" fill="url(#brandBlueLogin)"/>
              <circle cx="35" cy="41" r="3" fill="#ffffff"/>
              <circle cx="45" cy="41" r="3" fill="#ffffff"/>
              <path d="M34 52c4 4 12 4 16 0" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round"/>
              <path d="M40 58v8" stroke="url(#brandBlueLogin)" stroke-width="5" stroke-linecap="round"/>
              <path d="M30 68h20" stroke="url(#brandBlueLogin)" stroke-width="6" stroke-linecap="round"/>
              <path d="M60 47c7-1 8-6 8-10" fill="none" stroke="#18a99b" stroke-width="3" stroke-linecap="round"/>
            </svg>
            <div>
              <p class="brand-title">AI Support <span>Triage</span></p>
              <p class="brand-tagline">Intelligent. Automated. Efficient.</p>
            </div>
          </div>

          <div class="lead">
            <h2>AI-Powered Customer Support Triage Platform</h2>
            <p class="lead-copy">We classify, prioritize, and route tickets to the right agents — automatically.</p>
          </div>

          <div class="robot-scene" aria-hidden="true">
            <div class="robot">
              <div class="robot-head"><div class="robot-face"><span class="robot-smile"></span></div></div>
              <span class="ear left"></span><span class="ear right"></span><span class="mic"></span>
              <span class="body"></span><span class="arm left"></span><span class="arm right"></span><span class="finger"></span>
            </div>
            <div class="laptop"></div>
            <div class="bubble chat"><span class="dot"></span></div>
            <div class="bubble note"></div>
            <div class="check">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 6 9 17l-5-5"/>
              </svg>
            </div>
          </div>
        </section>

        <section class="auth-card" aria-label="Login form">
          <header class="card-head">
            <div class="head-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
                <rect x="5" y="10" width="14" height="10" rx="2"/>
                <path d="M8 10V7a4 4 0 0 1 8 0v3"/>
                <path d="M12 14v2"/>
              </svg>
            </div>
            <h1>Welcome Back</h1>
            <p>Sign in to your account</p>
          </header>

          <form (ngSubmit)="submit()" #loginForm="ngForm" novalidate>
            <label class="field">
              <span>Email</span>
              <span class="input-row">
                <span class="field-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M4 6h16v12H4z"/>
                    <path d="m4 7 8 6 8-6"/>
                  </svg>
                </span>
                <input
                  type="email"
                  name="email"
                  [(ngModel)]="email"
                  (ngModelChange)="error = ''"
                  autocomplete="email"
                  placeholder="Enter your email"
                  required>
                <span aria-hidden="true"></span>
              </span>
            </label>

            <label class="field">
              <span>Password</span>
              <span class="input-row">
                <span class="field-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="5" y="11" width="14" height="10" rx="2"/>
                    <path d="M8 11V8a4 4 0 0 1 8 0v3"/>
                    <path d="M12 15v2"/>
                  </svg>
                </span>
                <input
                  [type]="showPassword ? 'text' : 'password'"
                  name="password"
                  [(ngModel)]="password"
                  (ngModelChange)="error = ''"
                  autocomplete="current-password"
                  placeholder="Enter your password"
                  required>
                <button class="toggle-password" type="button" (click)="showPassword = !showPassword" [attr.aria-label]="showPassword ? 'Hide password' : 'Show password'">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                </button>
              </span>
            </label>

            <div class="form-row">
              <label class="remember">
                <input type="checkbox" name="rememberMe" [(ngModel)]="rememberMe">
                <span>Remember me</span>
              </label>
              <button class="text-link" type="button">Forgot password?</button>
            </div>

            @if (error) {
              <p class="error">{{ error }}</p>
            }

            <button class="primary" type="submit" [disabled]="isSubmitting || loginForm.invalid">
              {{ isSubmitting ? 'Logging in...' : 'Login' }}
            </button>
          </form>

          <div class="divider">OR</div>

          <a class="switch-link" routerLink="/register">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M16 21v-2a4 4 0 0 0-8 0v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            New user? <span>Register here</span>
          </a>
        </section>

        <p class="footer-note">© 2024 AI Support Triage Platform. All rights reserved.</p>
      </section>
    </main>
  `
})
export class LoginComponent {
  email = '';
  password = '';
  error = '';
  isSubmitting = false;
  showPassword = false;
  rememberMe = false;

  constructor(private readonly auth: AuthService) {
    // Opening the login page should always start from a clean local session.
    this.auth.clearSession();
  }

  submit() {
    // Normalize before sending so email casing and accidental spaces do not block valid users.
    const email = this.email.trim().toLowerCase();
    const password = this.password.trim();
    this.error = '';

    if (!email || !password) {
      this.error = 'Enter your email and password.';
      return;
    }

    this.isSubmitting = true;
    this.auth.login(email, password).subscribe({
      // AuthService stores the token and routes to the dashboard that matches the returned role.
      next: response => this.auth.completeLogin(response),
      error: response => {
        this.error = this.errorMessage(response);
        this.isSubmitting = false;
      }
    });
  }

  private errorMessage(response: any) {
    if (response.status === 0) {
      return 'Cannot reach the backend API. Make sure http://localhost:5000 is running.';
    }

    if (Array.isArray(response?.error?.details) && response.error.details.length > 0) {
      return response.error.details.map((detail: any) => detail.message).join(' ');
    }

    return response?.error?.error ?? 'Invalid email or password';
  }
}
