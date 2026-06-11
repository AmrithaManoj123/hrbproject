import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { AuthResponse } from '../models/user.model';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;
  let router: jasmine.SpyObj<Router>;

  const response: AuthResponse = {
    token: 'header.payload.signature',
    user: {
      id: 'user-1',
      fullName: 'Admin User',
      email: 'admin@example.com',
      role: 'admin'
    }
  };

  beforeEach(() => {
    localStorage.clear();
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: router }
      ]
    });

    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  it('posts login credentials to the backend auth endpoint', () => {
    service.login('admin@example.com', 'password').subscribe(result => {
      expect(result).toEqual(response);
    });

    const request = http.expectOne(`${environment.apiUrl}/auth/login`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ email: 'admin@example.com', password: 'password' });
    request.flush(response);
  });

  it('stores the session and routes to the role dashboard after login', () => {
    service.completeLogin(response);

    expect(localStorage.getItem('token')).toBe(response.token);
    expect(JSON.parse(localStorage.getItem('user')!)).toEqual(response.user);
    expect(service.user()).toEqual(response.user);
    expect(router.navigate).toHaveBeenCalledWith(['/admin/dashboard']);
  });

  it('clears browser storage and in-memory user state', () => {
    service.completeLogin(response);

    service.clearSession();

    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
    expect(service.user()).toBeNull();
  });
});
