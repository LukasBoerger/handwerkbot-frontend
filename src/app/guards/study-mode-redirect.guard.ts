import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { Observable, map } from 'rxjs';
import { TenantStatusService } from '../services/tenant-status.service';

// Leitet Study-Mode-Mandanten von /setup direkt auf /dashboard um. Der Onboarding-
// Wizard ist im Study-Mode nicht vorgesehen; die Umleitung passiert hier im Guard,
// damit der Wizard selbst unangetastet bleibt. Scheitert die Statusabfrage, gilt
// Normalmodus (studyMode=false) – der Wizard bleibt dann erreichbar.
export const studyModeRedirectGuard: CanActivateFn = (): Observable<boolean | UrlTree> => {
  const tenantStatus = inject(TenantStatusService);
  const router = inject(Router);

  return tenantStatus
    .studyMode()
    .pipe(map((studyMode) => (studyMode ? router.createUrlTree(['/dashboard']) : true)));
};
