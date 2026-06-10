import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { Pricing } from './pricing';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';

describe('Pricing', () => {
  let component: Pricing;
  let fixture: ComponentFixture<Pricing>;
  let httpMock: HttpTestingController;
  let router: Router;

  function setup(isLoggedIn: boolean) {
    const authMock = {
      getToken: () => (isLoggedIn ? 'test-token' : null),
      isLoggedIn: () => isLoggedIn,
    };

    TestBed.configureTestingModule({
      imports: [
        Pricing,
        RouterTestingModule.withRoutes([{ path: '**', redirectTo: '' }]),
        HttpClientTestingModule,
        NoopAnimationsModule,
      ],
      providers: [{ provide: AuthService, useValue: authMock }],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(Pricing);
    component = fixture.componentInstance;
  }

  afterEach(() => {
    httpMock.verify();
  });

  describe('nicht eingeloggt', () => {
    beforeEach(() => setup(false));

    it('sollte erstellt werden', () => {
      expect(component).toBeTruthy();
    });

    it('ngOnInit stellt keine HTTP-Anfrage wenn nicht eingeloggt', () => {
      fixture.detectChanges();
      httpMock.expectNone(`${environment.apiUrl}/api/billing/status`);
    });

    it('features-Liste enthält 5 Einträge', () => {
      expect(component.features.length).toBe(5);
    });

    it('isActive gibt false zurück wenn kein Billing-Status', () => {
      expect(component.isActive).toBe(false);
    });

    it('checkout() navigiert zu /register wenn nicht eingeloggt', () => {
      const navSpy = vi.spyOn(router, 'navigate');
      component.checkout();
      expect(navSpy).toHaveBeenCalledWith(['/register']);
      expect(component.loading).toBe(false);
    });
  });

  describe('eingeloggt', () => {
    beforeEach(() => setup(true));

    it('ngOnInit lädt Billing-Status', () => {
      fixture.detectChanges();
      const req = httpMock.expectOne(`${environment.apiUrl}/api/billing/status`);
      expect(req.request.method).toBe('GET');
      req.flush({ subscriptionStatus: 'active' });
      expect(component.billingStatus?.subscriptionStatus).toBe('active');
    });

    it('ngOnInit behandelt Fehler beim Laden des Billing-Status', () => {
      fixture.detectChanges();
      const req = httpMock.expectOne(`${environment.apiUrl}/api/billing/status`);
      req.error(new ErrorEvent('network error'));
      expect(component.billingStatus).toBeNull();
    });

    it('isActive gibt true zurück bei subscriptionStatus active', () => {
      component.billingStatus = { subscriptionStatus: 'active' };
      expect(component.isActive).toBe(true);
    });

    it('isActive gibt false zurück bei subscriptionStatus trial', () => {
      component.billingStatus = { subscriptionStatus: 'trial' };
      expect(component.isActive).toBe(false);
    });

    it('checkout() setzt loading auf true und stellt POST-Anfrage', () => {
      component.checkout();
      expect(component.loading).toBe(true);
      const req = httpMock.expectOne(`${environment.apiUrl}/api/billing/checkout`);
      expect(req.request.method).toBe('POST');
      req.flush({ url: 'https://stripe.com/checkout/session' });
    });

    it('checkout() setzt loading auf false bei Fehler', () => {
      component.checkout();
      const req = httpMock.expectOne(`${environment.apiUrl}/api/billing/checkout`);
      req.error(new ErrorEvent('network error'));
      expect(component.loading).toBe(false);
    });

    it('openPortal() setzt portalLoading auf true und stellt POST-Anfrage', () => {
      component.openPortal();
      expect(component.portalLoading).toBe(true);
      const req = httpMock.expectOne(`${environment.apiUrl}/api/billing/portal`);
      expect(req.request.method).toBe('POST');
      req.flush({ url: 'https://billing.stripe.com/portal' });
    });

    it('openPortal() setzt portalLoading auf false bei Fehler', () => {
      component.openPortal();
      const req = httpMock.expectOne(`${environment.apiUrl}/api/billing/portal`);
      req.error(new ErrorEvent('network error'));
      expect(component.portalLoading).toBe(false);
    });

    it('authHeaders enthalten Bearer-Token', () => {
      component.checkout();
      const req = httpMock.expectOne(`${environment.apiUrl}/api/billing/checkout`);
      expect(req.request.headers.get('Authorization')).toBe('Bearer test-token');
      req.flush({ url: 'https://stripe.com' });
    });
  });
});
