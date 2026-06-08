import { HttpClient } from '@angular/common/http';
import { Injectable, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { AuthResponse, User } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  // Keeps the logged-in user in a signal so guards, templates, and components react immediately after login/logout.
  private readonly userSignal = signal<User | null>(this.readUser());
  readonly user = this.userSignal.asReadonly();
  readonly isLoggedIn = computed(() => !!this.userSignal());

  constructor(private readonly http: HttpClient, private readonly router: Router) {}

  register(fullName: string, email: string, password: string) {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/register`, { fullName, email, password });
  }

  login(email: string, password: string) {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, { email, password });
  }

  completeLogin(response: AuthResponse) {
    // Persist the server-issued session so refreshes keep the user signed in.
    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));

    // Update in-memory state before routing so protected pages render with the current user available.
    this.userSignal.set(response.user);
    this.router.navigate([`/${response.user.role}/dashboard`]);
  }

  clearSession() {
    // Centralize session cleanup here because the service owns both browser storage and the auth signal.
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.userSignal.set(null);
  }

  token() {
    return localStorage.getItem('token');
  }

  private readUser(): User | null {
    // Restore the cached user when the app starts so page reloads do not force a fresh login.
    const raw = localStorage.getItem('user');
    if (!raw) return null;

    try {
      return JSON.parse(raw) as User;
    } catch {
      // Bad cached JSON means the local session is unreliable, so clear it and start logged out.
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return null;
    }
  }
}
