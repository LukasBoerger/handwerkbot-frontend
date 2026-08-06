import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable, firstValueFrom, of } from 'rxjs';
import { studyModeRedirectGuard } from './study-mode-redirect.guard';
import { TenantStatusService } from '../services/tenant-status.service';

describe('studyModeRedirectGuard', () => {
  const route = {} as ActivatedRouteSnapshot;
  const state = {} as RouterStateSnapshot;

  function setup(studyMode: boolean) {
    const urlTree = {} as UrlTree;
    const routerMock = { createUrlTree: (commands: unknown[]) => ({ ...urlTree, commands }) };
    const tenantStatusMock = { studyMode: () => of(studyMode) };

    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: routerMock },
        { provide: TenantStatusService, useValue: tenantStatusMock },
      ],
    });

    const result = TestBed.runInInjectionContext(() =>
      studyModeRedirectGuard(route, state),
    ) as Observable<boolean | UrlTree>;
    return { result };
  }

  it('leitet im Study-Mode auf /dashboard um', async () => {
    const { result } = setup(true);
    const value = (await firstValueFrom(result)) as UrlTree & { commands: string[] };

    // UrlTree statt true -> Redirect greift, Ziel ist /dashboard
    expect(value).not.toBe(true);
    expect(value.commands).toEqual(['/dashboard']);
  });

  it('lässt Nicht-Study-Mandanten passieren', async () => {
    const { result } = setup(false);
    const value = await firstValueFrom(result);

    expect(value).toBe(true);
  });
});
