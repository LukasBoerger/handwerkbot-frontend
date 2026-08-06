import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { environment } from '../../environments/environment';

// Sperrt im Studienbetrieb (environment.studyMode=true) deployment-weit die vor dem
// Login erreichbaren, kommerziellen/öffentlichen Routen (Registrierung, Passwort-Reset,
// Preise) und leitet auf /login um. Synchron und ohne HTTP – im Gegensatz zum
// mandantenbezogenen studyModeRedirectGuard, der bewusst unverändert bleibt.
export const studyInstanceGuard: CanActivateFn = (): boolean | UrlTree => {
  if (!environment.studyMode) return true;
  return inject(Router).createUrlTree(['/login']);
};
