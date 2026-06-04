import { HttpClient } from '@angular/common/http';
import { Injectable, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { AuthResponse, User } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
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
    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
    this.userSignal.set(response.user);
    this.router.navigate([`/${response.user.role}/dashboard`]);
  }

  logout() {
    this.clearSession();
    this.router.navigate(['/login']);
  }

  clearSession() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.userSignal.set(null);
  }

  token() {
    return localStorage.getItem('token');
  }

  private readUser(): User | null {
    const raw = localStorage.getItem('user');
    if (!raw) return null;

    try {
      return JSON.parse(raw) as User;
    } catch {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return null;
    }
  }
}
