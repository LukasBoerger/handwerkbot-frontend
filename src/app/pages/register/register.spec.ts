import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter, Router, ActivatedRoute } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { Register } from './register';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';

describe('Register', () => {
  let component: Register;
  let fixture: ComponentFixture<Register>;
  let http: HttpTestingController;
  let router: Router;
  let registerSpy: ReturnType<typeof vi.fn>;
  let getTokenSpy: ReturnType<typeof vi.fn>;

  const stepperMock: any = { selectedIndex: 0 };
  const validAccount = { fullName: 'Max Mustermann', email: 'max@test.de', password: 'sicher123' };
  const validBusiness = { businessName: 'Muster GmbH', businessPhone: '0123456789' };

  function fillForms() {
    component.accountForm.setValue(validAccount);
    component.businessForm.setValue(validBusiness);
  }

  beforeEach(async () => {
    registerSpy = vi.fn().mockReturnValue(of({}));
    getTokenSpy = vi.fn().mockReturnValue('test-token');

    await TestBed.configureTestingModule({
      imports: [Register],
      providers: [
        provideRouter([{ path: '**', redirectTo: '' }]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNoopAnimations(),
        {
          provide: AuthService,
          useValue: {
            register: registerSpy,
            getToken: getTokenSpy,
            login: vi.fn(),
            logout: vi.fn(),
            isLoggedIn: () => false,
            getUser: () => null,
          },
        },
        { provide: ActivatedRoute, useValue: { queryParams: of({}) } },
      ],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(Register);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    http.verify();
  });

  it('sollte erstellt werden', () => {
    expect(component).toBeTruthy();
  });

  it('initialisiert Formulare mit leeren Feldern', () => {
    expect(component.accountForm.get('email')?.value).toBe('');
    expect(component.businessForm.get('businessName')?.value).toBe('');
  });

  it('selectedPlan ist initial null', () => {
    expect(component.selectedPlan).toBeNull();
  });

  describe('submit', () => {
    it('tut nichts wenn accountForm ungültig', () => {
      component.accountForm.setValue({ fullName: '', email: '', password: '' });
      component.submit(stepperMock);
      expect(registerSpy).not.toHaveBeenCalled();
    });

    it('tut nichts wenn businessForm ungültig', () => {
      component.accountForm.setValue(validAccount);
      component.businessForm.setValue({ businessName: '', businessPhone: '' });
      component.submit(stepperMock);
      expect(registerSpy).not.toHaveBeenCalled();
    });

    it('navigiert zu /setup nach erfolgreicher Registrierung ohne Plan', () => {
      const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
      fillForms();
      component.submit(stepperMock);
      expect(registerSpy).toHaveBeenCalled();
      expect(navigateSpy).toHaveBeenCalledWith(['/setup']);
    });

    it('startet Checkout nach Registrierung mit Plan', () => {
      component.selectedPlan = 'pro';
      fillForms();
      component.submit(stepperMock);

      const req = http.expectOne(`${environment.apiUrl}/api/billing/checkout`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ plan: 'pro' });
      req.flush({ url: 'https://stripe.com/checkout' });
    });

    it('navigiert zu /pricing bei Checkout-Fehler', () => {
      component.selectedPlan = 'pro';
      fillForms();
      const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
      component.submit(stepperMock);

      http.expectOne(`${environment.apiUrl}/api/billing/checkout`).flush(
        null,
        { status: 500, statusText: 'Error' },
      );
      expect(component.loading).toBe(false);
      expect(navigateSpy).toHaveBeenCalledWith(['/pricing']);
    });

    it('setzt error und loading=false bei Registrierungsfehler', () => {
      registerSpy.mockReturnValue(
        throwError(() => ({ error: { error: 'Nutzername bereits vergeben' } })),
      );
      fillForms();
      component.submit(stepperMock);
      expect(component.error).toBe('Nutzername bereits vergeben');
      expect(component.loading).toBe(false);
    });

    it('setzt stepper auf Schritt 0 wenn Fehler E-Mail enthält', () => {
      stepperMock.selectedIndex = 1;
      registerSpy.mockReturnValue(
        throwError(() => ({ error: { error: 'E-Mail bereits in Verwendung' } })),
      );
      fillForms();
      component.submit(stepperMock);
      expect(stepperMock.selectedIndex).toBe(0);
    });

    it('setzt Standard-Fehlermeldung wenn kein error.error vorhanden', () => {
      registerSpy.mockReturnValue(throwError(() => ({})));
      fillForms();
      component.submit(stepperMock);
      expect(component.error).toBe('Registrierung fehlgeschlagen');
    });
  });
});
