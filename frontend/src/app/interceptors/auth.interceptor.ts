import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const token = localStorage.getItem('token');

  // Attach the JWT only when it is still valid so API calls carry identity without sending stale credentials.
  const authenticatedRequest = token && !isTokenExpired(token)
    ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : request;

  return next(authenticatedRequest);
};

function isTokenExpired(token: string) {
  try {
    // The backend stores the expiry in the JWT payload; checking it here avoids avoidable 401 calls.
    const payload = JSON.parse(atob(token.split('.')[1])) as { exp?: number };
    return typeof payload.exp !== 'number' || payload.exp * 1000 <= Date.now();
  } catch {
    // If the token cannot be decoded, treat it as unsafe and let the request go out unauthenticated.
    return true;
  }
}
