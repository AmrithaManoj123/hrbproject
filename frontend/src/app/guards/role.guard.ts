import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard = (role: 'customer' | 'agent' | 'admin'): CanActivateFn => {
  // Each route declares the role it expects, so this guard prevents users from opening another role's dashboard by URL.
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    return auth.user()?.role === role ? true : router.parseUrl('/login');
  };
};
