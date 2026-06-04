import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const token = localStorage.getItem('token');
  const authenticatedRequest = token && !isTokenExpired(token)
    ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : request;

  return next(authenticatedRequest);
};

function isTokenExpired(token: string) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1])) as { exp?: number };
    return typeof payload.exp !== 'number' || payload.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}
