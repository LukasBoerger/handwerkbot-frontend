import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { studyInstanceGuard } from './study-instance.guard';
import { environment } from '../../environments/environment';

describe('studyInstanceGuard', () => {
  const route = {} as ActivatedRouteSnapshot;
  const state = {} as RouterStateSnapshot;
  const originalStudyMode = environment.studyMode;

  afterEach(() => {
    environment.studyMode = originalStudyMode;
  });

  function run(studyMode: boolean) {
    environment.studyMode = studyMode;
    const urlTree = {} as UrlTree;
    const routerMock = { createUrlTree: (commands: unknown[]) => ({ ...urlTree, commands }) };
    TestBed.configureTestingModule({
      providers: [{ provide: Router, useValue: routerMock }],
    });
    return TestBed.runInInjectionContext(() => studyInstanceGuard(route, state));
  }

  it('leitet im Studienbetrieb auf /login um', () => {
    const result = run(true) as UrlTree & { commands: string[] };
    expect(result).not.toBe(true);
    expect(result.commands).toEqual(['/login']);
  });

  it('lässt Routen im Normalbetrieb passieren', () => {
    expect(run(false)).toBe(true);
  });
});
