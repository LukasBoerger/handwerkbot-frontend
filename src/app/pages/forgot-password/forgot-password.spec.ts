import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ForgotPassword } from './forgot-password';
import { environment } from '../../../environments/environment';

describe('ForgotPassword', () => {
  let component: ForgotPassword;
  let fixture: ComponentFixture<ForgotPassword>;
  let http: HttpTestingController;

  const API = `${environment.apiUrl}/api/auth/forgot-password`;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ForgotPassword],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNoopAnimations(),
      ],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(ForgotPassword);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    http.verify();
  });

  it('sollte erstellt werden', () => {
    expect(component).toBeTruthy();
  });

  it('initialisiert Formular mit leerem E-Mail-Feld', () => {
    expect(component.form.get('email')?.value).toBe('');
  });

  it('sent und loading sind initial false', () => {
    expect(component.sent).toBe(false);
    expect(component.loading).toBe(false);
  });

  describe('submit', () => {
    it('tut nichts bei leerem Formular', () => {
      component.submit();
      http.expectNone(API);
      expect(component.loading).toBe(false);
    });

    it('tut nichts bei ungültiger E-Mail', () => {
      component.form.setValue({ email: 'keine-email' });
      component.submit();
      http.expectNone(API);
    });

    it('sendet POST-Anfrage mit E-Mail', () => {
      component.form.setValue({ email: 'test@test.de' });
      component.submit();

      const req = http.expectOne(API);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ email: 'test@test.de' });
      req.flush({});
    });

    it('setzt sent=true und loading=false bei Erfolg', () => {
      component.form.setValue({ email: 'test@test.de' });
      component.submit();
      http.expectOne(API).flush({});

      expect(component.sent).toBe(true);
      expect(component.loading).toBe(false);
    });

    it('setzt sent=true und loading=false auch bei Fehler (Security)', () => {
      component.form.setValue({ email: 'test@test.de' });
      component.submit();
      http.expectOne(API).flush(null, { status: 500, statusText: 'Error' });

      expect(component.sent).toBe(true);
      expect(component.loading).toBe(false);
    });

    it('setzt loading=true während der Anfrage läuft', () => {
      component.form.setValue({ email: 'test@test.de' });
      component.submit();
      expect(component.loading).toBe(true);
      http.expectOne(API).flush({});
    });
  });
});
