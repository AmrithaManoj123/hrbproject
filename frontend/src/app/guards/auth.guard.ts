import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // Gate protected routes by session state; redirecting with a UrlTree lets Angular cancel the current navigation cleanly.
  if (auth.isLoggedIn()) return true;
  return router.parseUrl('/login');
};
