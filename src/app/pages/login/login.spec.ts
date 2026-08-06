import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { Login } from './login';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';

describe('Login', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;
  let loginSpy: ReturnType<typeof vi.fn>;
  let router: Router;

  beforeEach(async () => {
    loginSpy = vi.fn().mockReturnValue(of({}));

    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        provideRouter([{ path: 'dashboard', redirectTo: '' }]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNoopAnimations(),
        {
          provide: AuthService,
          useValue: {
            login: loginSpy,
            getToken: () => 'test-token',
            getUser: () => null,
            isLoggedIn: () => false,
            logout: vi.fn(),
          },
        },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('sollte erstellt werden', () => {
    expect(component).toBeTruthy();
  });

  it('sollte Formular mit leeren Feldern initialisieren', () => {
    expect(component.form.get('email')?.value).toBe('');
    expect(component.form.get('password')?.value).toBe('');
  });

  it('loading ist initial false', () => {
    expect(component.loading).toBe(false);
  });

  describe('submit', () => {
    it('tut nichts bei leerem Formular', () => {
      component.submit();
      expect(loginSpy).not.toHaveBeenCalled();
    });

    it('tut nichts bei ungültiger E-Mail', () => {
      component.form.setValue({ email: 'keine-email', password: 'passwort123' });
      component.submit();
      expect(loginSpy).not.toHaveBeenCalled();
    });

    it('navigiert zu /dashboard bei Erfolg', () => {
      const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
      component.form.setValue({ email: 'test@test.de', password: 'passwort123' });
      component.submit();
      expect(loginSpy).toHaveBeenCalledWith('test@test.de', 'passwort123');
      expect(navigateSpy).toHaveBeenCalledWith(['/dashboard']);
    });

    it('setzt error-Meldung aus der Server-Antwort', () => {
      loginSpy.mockReturnValue(throwError(() => ({ error: { error: 'Ungültige Zugangsdaten' } })));
      component.form.setValue({ email: 'test@test.de', password: 'falsch' });
      component.submit();
      expect(component.error).toBe('Ungültige Zugangsdaten');
      expect(component.loading).toBe(false);
    });

    it('setzt Standard-Fehlermeldung wenn kein error.error vorhanden', () => {
      loginSpy.mockReturnValue(throwError(() => ({})));
      component.form.setValue({ email: 'test@test.de', password: 'falsch' });
      component.submit();
      expect(component.error).toBe('Ungültige Zugangsdaten');
    });

    it('setzt loading auf true während des Logins', () => {
      let loadingDuringRequest = false;
      loginSpy.mockImplementation(() => {
        loadingDuringRequest = component.loading;
        return of({});
      });
      component.form.setValue({ email: 'test@test.de', password: 'passwort123' });
      component.submit();
      expect(loadingDuringRequest).toBe(true);
    });
  });

  describe('fillDemo', () => {
    it('füllt Demo-Zugangsdaten aus', () => {
      component.fillDemo();
      expect(component.form.get('email')?.value).toBe('demo@kommuvo.de');
      expect(component.form.get('password')?.value).toBe('demo1234');
    });

    it('startet Login nach dem Ausfüllen der Demo-Daten', () => {
      vi.spyOn(router, 'navigate').mockResolvedValue(true);
      component.fillDemo();
      expect(loginSpy).toHaveBeenCalledWith('demo@kommuvo.de', 'demo1234');
    });
  });

  describe('Studienbetrieb (environment.studyMode)', () => {
    // isStudyMode wird im Konstruktor aus dem globalen environment gelesen -> Flag vor
    // dem Erzeugen der Komponente setzen und danach zurücksetzen (kein Leaken in andere Specs).
    const originalStudyMode = environment.studyMode;

    afterEach(() => {
      environment.studyMode = originalStudyMode;
    });

    function renderWith(studyMode: boolean): HTMLElement {
      environment.studyMode = studyMode;
      const freshFixture = TestBed.createComponent(Login);
      freshFixture.detectChanges();
      return freshFixture.nativeElement as HTMLElement;
    }

    it('studyMode=true blendet Register-Block, Demo-Button und "Passwort vergessen" aus', () => {
      const el = renderWith(true);
      expect(el.querySelector('[data-cy="btn-demo"]')).toBeNull();
      expect(el.querySelector('.auth-footer')).toBeNull();
      expect(el.querySelector('.divider')).toBeNull();
      expect(el.querySelector('.forgot-link')).toBeNull();
    });

    it('studyMode=false zeigt Register-Block, Demo-Button und "Passwort vergessen"', () => {
      const el = renderWith(false);
      expect(el.querySelector('[data-cy="btn-demo"]')).toBeTruthy();
      expect(el.querySelector('.auth-footer')).toBeTruthy();
      expect(el.querySelector('.forgot-link')).toBeTruthy();
    });
  });
});
