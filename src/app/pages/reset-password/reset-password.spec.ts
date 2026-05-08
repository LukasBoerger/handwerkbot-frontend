import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter, Router, ActivatedRoute } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ResetPassword } from './reset-password';
import { environment } from '../../../environments/environment';

describe('ResetPassword', () => {
  let component: ResetPassword;
  let fixture: ComponentFixture<ResetPassword>;
  let http: HttpTestingController;
  let router: Router;

  const API = `${environment.apiUrl}/api/auth/reset-password`;
  const TEST_TOKEN = 'valid-reset-token-123';

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResetPassword],
      providers: [
        provideRouter([{ path: 'login', redirectTo: '' }]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNoopAnimations(),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParams: { token: TEST_TOKEN } } },
        },
      ],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(ResetPassword);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    http.verify();
  });

  it('sollte erstellt werden', () => {
    expect(component).toBeTruthy();
  });

  it('liest Token aus URL-Parameter beim Initialisieren', () => {
    expect(component.token).toBe(TEST_TOKEN);
  });

  it('initialisiert Formular mit leeren Passwortfeldern', () => {
    expect(component.form.get('password')?.value).toBe('');
    expect(component.form.get('confirmPassword')?.value).toBe('');
  });

  it('success und loading sind initial false', () => {
    expect(component.success).toBe(false);
    expect(component.loading).toBe(false);
  });

  describe('submit', () => {
    it('tut nichts bei ungültigem Formular', () => {
      component.submit();
      http.expectNone(API);
    });

    it('tut nichts bei zu kurzem Passwort', () => {
      component.form.setValue({ password: 'kurz', confirmPassword: 'kurz' });
      component.submit();
      http.expectNone(API);
    });

    it('setzt error wenn Passwörter nicht übereinstimmen', () => {
      component.form.setValue({ password: 'passwort123', confirmPassword: 'anderes456' });
      component.submit();
      expect(component.error).toBe('Passwörter stimmen nicht überein');
      http.expectNone(API);
    });

    it('sendet POST mit Token und neuem Passwort', () => {
      component.form.setValue({ password: 'neuesPasswort1', confirmPassword: 'neuesPasswort1' });
      component.submit();

      const req = http.expectOne(API);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ token: TEST_TOKEN, password: 'neuesPasswort1' });
      req.flush({});
    });

    it('setzt success=true und loading=false bei Erfolg', () => {
      component.form.setValue({ password: 'neuesPasswort1', confirmPassword: 'neuesPasswort1' });
      component.submit();
      http.expectOne(API).flush({});

      expect(component.success).toBe(true);
      expect(component.loading).toBe(false);
    });

    it('setzt loading=true während der Anfrage läuft', () => {
      component.form.setValue({ password: 'neuesPasswort1', confirmPassword: 'neuesPasswort1' });
      component.submit();
      expect(component.loading).toBe(true);
      http.expectOne(API).flush({});
    });

    it('setzt error-Meldung aus Server-Antwort bei Fehler', () => {
      component.form.setValue({ password: 'neuesPasswort1', confirmPassword: 'neuesPasswort1' });
      component.submit();
      http.expectOne(API).flush(
        { error: 'Link ungültig oder abgelaufen' },
        { status: 400, statusText: 'Bad Request' },
      );

      expect(component.error).toBe('Link ungültig oder abgelaufen');
      expect(component.loading).toBe(false);
    });

    it('setzt Standard-Fehlermeldung wenn kein error-Body vorhanden', () => {
      component.form.setValue({ password: 'neuesPasswort1', confirmPassword: 'neuesPasswort1' });
      component.submit();
      http.expectOne(API).flush(null, { status: 500, statusText: 'Error' });

      expect(component.error).toBe('Link ungültig oder abgelaufen');
    });
  });

  describe('ohne Token', () => {
    it('navigiert zu /login wenn kein Token vorhanden', async () => {
      await TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [ResetPassword],
        providers: [
          provideRouter([]),
          provideHttpClient(),
          provideHttpClientTesting(),
          provideNoopAnimations(),
          { provide: ActivatedRoute, useValue: { snapshot: { queryParams: {} } } },
        ],
      }).compileComponents();

      const localHttp = TestBed.inject(HttpTestingController);
      const localRouter = TestBed.inject(Router);
      const navigateSpy = vi.spyOn(localRouter, 'navigate').mockResolvedValue(true);
      const localFixture = TestBed.createComponent(ResetPassword);
      localFixture.detectChanges();

      expect(navigateSpy).toHaveBeenCalledWith(['/login']);
      localHttp.verify();
    });
  });
});
