import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Settings } from './settings';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';

describe('Settings', () => {
  let component: Settings;
  let fixture: ComponentFixture<Settings>;
  let http: HttpTestingController;

  const authMock = {
    getToken: () => 'test-token',
    getUser: () => ({ fullName: 'Test User' }),
    isLoggedIn: () => true,
  };

  const BASE = `${environment.apiUrl}/api/tenants`;

  beforeEach(async () => {
    localStorage.setItem('tenantId', 'tenant-1');

    await TestBed.configureTestingModule({
      imports: [Settings],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideNoopAnimations(),
        { provide: AuthService, useValue: authMock },
      ],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(Settings);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  function flushInit() {
    fixture.detectChanges();
    http.expectOne((r) => r.url.includes('/api/tenants/tenant-1')).flush({});
    http.expectOne((r) => r.url.includes('/api/billing/status')).flush({ plan: 'starter', status: 'active' });
    http.expectOne((r) => r.url.includes('/auth/google/status')).flush({ connected: false });
  }

  it('sollte erstellt werden', () => {
    flushInit();
    expect(component).toBeTruthy();
  });

  it('sollte Formular mit Standardwerten initialisieren', () => {
    flushInit();
    expect(component.form.get('botName')?.value).toBe('KommuvoBot');
    expect(component.form.get('maxDaysAhead')?.value).toBe(28);
  });

  describe('loadSettings', () => {
    it('befüllt das Formular mit Tenant-Daten', () => {
      fixture.detectChanges();
      const tenantData = {
        businessName: 'Müller GmbH',
        businessOwner: 'Max',
        businessEmail: 'max@test.de',
        businessPhone: '0123',
        businessServices: 'Elektro, Sanitär',
        botName: 'MüllerBot',
        maxDaysAhead: 14,
      };
      http.expectOne(`${BASE}/tenant-1`).flush(tenantData);
      http.expectOne((r) => r.url.includes('/api/billing/status')).flush({});
      http.expectOne((r) => r.url.includes('/auth/google/status')).flush({ connected: false });

      expect(component.form.get('businessName')?.value).toBe('Müller GmbH');
      expect(component.form.get('botName')?.value).toBe('MüllerBot');
      expect(component.selectedServices).toContain('Elektro');
      expect(component.selectedServices).toContain('Sanitär');
      expect(component.loading).toBe(false);
    });

    it('parsed Öffnungszeiten aus "07:00-18:00" Format', () => {
      fixture.detectChanges();
      http.expectOne(`${BASE}/tenant-1`).flush({ hoursMon: '08:00-17:00' });
      http.expectOne((r) => r.url.includes('/api/billing/status')).flush({});
      http.expectOne((r) => r.url.includes('/auth/google/status')).flush({ connected: false });

      expect(component.form.get('openMon')?.value).toBe(true);
      expect(component.form.get('fromMon')?.value).toBe('08:00');
      expect(component.form.get('toMon')?.value).toBe('17:00');
    });

    it('setzt Tag auf geschlossen wenn keine Öffnungszeit vorhanden', () => {
      fixture.detectChanges();
      http.expectOne(`${BASE}/tenant-1`).flush({ hoursMon: null });
      http.expectOne((r) => r.url.includes('/api/billing/status')).flush({});
      http.expectOne((r) => r.url.includes('/auth/google/status')).flush({ connected: false });

      expect(component.form.get('openMon')?.value).toBe(false);
    });

    it('setzt loading auf false bei Fehler', () => {
      fixture.detectChanges();
      http.expectOne(`${BASE}/tenant-1`).flush(null, { status: 500, statusText: 'Error' });
      http.expectOne((r) => r.url.includes('/api/billing/status')).flush({});
      http.expectOne((r) => r.url.includes('/auth/google/status')).flush({ connected: false });

      expect(component.loading).toBe(false);
    });

    it('bricht ab wenn kein tenantId vorhanden', () => {
      localStorage.removeItem('tenantId');
      component.loadSettings();
      http.expectNone(`${BASE}/tenant-1`);
      expect(component.loading).toBe(false);
    });
  });

  describe('onServicesChanged', () => {
    it('aktualisiert selectedServices und Formular', () => {
      flushInit();
      component.onServicesChanged(['Elektro', 'Sanitär']);
      expect(component.selectedServices).toEqual(['Elektro', 'Sanitär']);
      expect(component.form.get('businessServices')?.value).toBe('Elektro, Sanitär');
    });
  });

  describe('save', () => {
    it('tut nichts bei ungültigem Formular', () => {
      flushInit();
      component.form.get('businessName')?.setValue('');
      component.save();
      http.expectNone((r) => r.method === 'PUT');
    });

    it('sendet PUT mit korrekten Öffnungszeiten', () => {
      fixture.detectChanges();
      http.expectOne(`${BASE}/tenant-1`).flush({
        businessName: 'Test GmbH', businessOwner: 'Max',
        businessPhone: '0123', businessEmail: 'a@b.de', businessServices: 'Elektro'
      });
      http.expectOne((r) => r.url.includes('/api/billing/status')).flush({});
      http.expectOne((r) => r.url.includes('/auth/google/status')).flush({ connected: false });

      component.form.patchValue({
        businessName: 'Test GmbH', businessOwner: 'Max',
        businessPhone: '0123', businessEmail: 'a@b.de', businessServices: 'Elektro',
        openMon: true, fromMon: '08:00', toMon: '17:00',
        openTue: false,
      });
      component.save();

      const req = http.expectOne((r) => r.method === 'PUT' && r.url.includes(BASE));
      expect(req.request.body.hoursMon).toBe('08:00-17:00');
      expect(req.request.body.hoursTue).toBeNull();
      req.flush({});
      expect(component.saving).toBe(false);
    });

    it('setzt saving auf false bei Fehler', () => {
      fixture.detectChanges();
      http.expectOne(`${BASE}/tenant-1`).flush({
        businessName: 'Test', businessOwner: 'X',
        businessPhone: '0', businessEmail: 'a@b.de', businessServices: 'X'
      });
      http.expectOne((r) => r.url.includes('/api/billing/status')).flush({});
      http.expectOne((r) => r.url.includes('/auth/google/status')).flush({ connected: false });

      component.form.patchValue({
        businessName: 'Test', businessOwner: 'X',
        businessPhone: '0', businessEmail: 'a@b.de', businessServices: 'X'
      });
      component.save();

      http.expectOne((r) => r.method === 'PUT').flush(null, { status: 500, statusText: 'Error' });
      expect(component.saving).toBe(false);
    });
  });

  describe('loadBillingStatus', () => {
    it('setzt billingStatus bei Erfolg', () => {
      fixture.detectChanges();
      http.expectOne(`${BASE}/tenant-1`).flush({});
      http.expectOne((r) => r.url.includes('/api/billing/status')).flush({ plan: 'pro', status: 'active' });
      http.expectOne((r) => r.url.includes('/auth/google/status')).flush({ connected: false });

      expect(component.billingStatus?.plan).toBe('pro');
      expect(component.billingLoading).toBe(false);
    });

    it('setzt billingLoading auf false bei Fehler', () => {
      fixture.detectChanges();
      http.expectOne(`${BASE}/tenant-1`).flush({});
      http.expectOne((r) => r.url.includes('/api/billing/status'))
        .flush(null, { status: 500, statusText: 'Error' });
      http.expectOne((r) => r.url.includes('/auth/google/status')).flush({ connected: false });

      expect(component.billingLoading).toBe(false);
    });
  });

  describe('loadGoogleStatus', () => {
    it('setzt googleConnected bei verbundenem Konto', () => {
      fixture.detectChanges();
      http.expectOne(`${BASE}/tenant-1`).flush({});
      http.expectOne((r) => r.url.includes('/api/billing/status')).flush({});
      http.expectOne((r) => r.url.includes('/auth/google/status')).flush({ connected: true });

      expect(component.googleConnected).toBe(true);
    });
  });

  describe('disconnectGoogle', () => {
    it('setzt googleConnected auf false nach Trennung', () => {
      flushInit();
      component.googleConnected = true;
      component.disconnectGoogle();

      http.expectOne((r) => r.method === 'DELETE' && r.url.includes('/auth/google/disconnect')).flush({});
      expect(component.googleConnected).toBe(false);
    });
  });
});
