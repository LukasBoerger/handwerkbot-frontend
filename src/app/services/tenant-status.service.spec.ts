import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TenantStatusService } from './tenant-status.service';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

describe('TenantStatusService', () => {
  let service: TenantStatusService;
  let http: HttpTestingController;

  const authMock = { getToken: () => 'test-token' };
  const BASE = `${environment.apiUrl}/api/tenants`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authMock },
      ],
    });
    service = TestBed.inject(TenantStatusService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  it('liefert studyMode=true aus der Tenant-Response', () => {
    localStorage.setItem('tenantId', 'tenant-1');
    let result: boolean | undefined;
    service.studyMode().subscribe((v) => (result = v));
    http.expectOne(`${BASE}/tenant-1`).flush({ studyMode: true });
    expect(result).toBe(true);
  });

  it('mappt fehlendes studyMode-Feld auf false (Fallback)', () => {
    localStorage.setItem('tenantId', 'tenant-1');
    let result: boolean | undefined;
    service.studyMode().subscribe((v) => (result = v));
    http.expectOne(`${BASE}/tenant-1`).flush({});
    expect(result).toBe(false);
  });

  it('liefert false und macht keinen Request ohne tenantId', () => {
    let result: boolean | undefined;
    service.studyMode().subscribe((v) => (result = v));
    http.expectNone(`${BASE}/tenant-1`);
    expect(result).toBe(false);
  });

  it('cacht den Wert – nur ein HTTP-Request bei mehreren Abrufen', () => {
    localStorage.setItem('tenantId', 'tenant-1');
    service.studyMode().subscribe();
    service.studyMode().subscribe();
    http.expectOne(`${BASE}/tenant-1`).flush({ studyMode: true });
    http.expectNone(`${BASE}/tenant-1`);
  });

  it('liefert false bei Fehler (defensiv, blendet nichts aus)', () => {
    localStorage.setItem('tenantId', 'tenant-1');
    let result: boolean | undefined;
    service.studyMode().subscribe((v) => (result = v));
    http.expectOne(`${BASE}/tenant-1`).flush(null, { status: 500, statusText: 'Error' });
    expect(result).toBe(false);
  });
});
