import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot } from '@angular/router';
import { environment } from '../../environments/environment';

export const siteLockGuard: CanActivateFn = (
  _route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot,
) => {
  if (!environment.sitePassword) return true;
  if (sessionStorage.getItem('site_unlocked') === 'true') return true;

  inject(Router).navigate(['/site-lock'], {
    queryParams: { returnUrl: state.url },
  });
  return false;
};
