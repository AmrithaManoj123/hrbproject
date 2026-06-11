import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let http: HttpClient;
  let controller: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting()
      ]
    });

    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    controller.verify();
    localStorage.clear();
  });

  it('adds the bearer token when the stored JWT is not expired', () => {
    const token = jwtWithExpiry(Math.floor(Date.now() / 1000) + 3600);
    localStorage.setItem('token', token);

    http.get('/api/protected').subscribe();

    const request = controller.expectOne('/api/protected');
    expect(request.request.headers.get('Authorization')).toBe(`Bearer ${token}`);
    request.flush({});
  });

  it('does not add an authorization header for expired JWTs', () => {
    localStorage.setItem('token', jwtWithExpiry(Math.floor(Date.now() / 1000) - 60));

    http.get('/api/protected').subscribe();

    const request = controller.expectOne('/api/protected');
    expect(request.request.headers.has('Authorization')).toBeFalse();
    request.flush({});
  });

  function jwtWithExpiry(exp: number) {
    return [
      encode({ alg: 'HS256', typ: 'JWT' }),
      encode({ exp }),
      'signature'
    ].join('.');
  }

  function encode(value: object) {
    return btoa(JSON.stringify(value)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  }
});
