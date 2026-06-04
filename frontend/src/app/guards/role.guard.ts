import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard = (role: 'customer' | 'agent' | 'admin'): CanActivateFn => {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    return auth.user()?.role === role ? true : router.parseUrl('/login');
  };
};
