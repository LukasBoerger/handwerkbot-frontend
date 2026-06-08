import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { AppointmentService } from './appointment.service';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';
import { Appointment } from '../models/appointment.model';

describe('AppointmentService', () => {
  let service: AppointmentService;
  let http: HttpTestingController;

  const authMock = { getToken: () => 'test-token' };
  const BASE = `${environment.apiUrl}/api/tenants`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AppointmentService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authMock },
      ],
    });
    service = TestBed.inject(AppointmentService);
    http = TestBed.inject(HttpTestingController);
    localStorage.clear();
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  describe('getMyAppointments', () => {
    it('gibt EMPTY zurück wenn kein tenantId vorhanden', () => {
      let emitted = false;
      let completed = false;
      service.getMyAppointments().subscribe({
        next: () => {
          emitted = true;
        },
        complete: () => {
          completed = true;
        },
      });
      expect(emitted).toBe(false);
      expect(completed).toBe(true);
    });

    it('fragt Termine mit korrekter URL ab', () => {
      localStorage.setItem('tenantId', 'tenant-1');
      const result: Appointment[] = [];
      service.getMyAppointments().subscribe((data) => result.push(...data));

      const req = http.expectOne(`${BASE}/tenant-1/appointments`);
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('Authorization')).toBe('Bearer test-token');
      req.flush([{ id: 'apt-1', service: 'Elektro' }]);

      expect(result.length).toBe(1);
      expect(result[0].id).toBe('apt-1');
    });
  });

  describe('updateStatus', () => {
    it('gibt EMPTY zurück wenn kein tenantId vorhanden', () => {
      let emitted = false;
      let completed = false;
      service.updateStatus('apt-1', 'completed').subscribe({
        next: () => {
          emitted = true;
        },
        complete: () => {
          completed = true;
        },
      });
      expect(emitted).toBe(false);
      expect(completed).toBe(true);
    });

    it('sendet PATCH mit korrektem Status', () => {
      localStorage.setItem('tenantId', 'tenant-1');
      const results: Appointment[] = [];
      service.updateStatus('apt-42', 'completed').subscribe((r) => results.push(r));

      const req = http.expectOne(`${BASE}/tenant-1/appointments/apt-42/status`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ status: 'completed' });
      expect(req.request.headers.get('Authorization')).toBe('Bearer test-token');
      req.flush({ id: 'apt-42', status: 'completed' });

      expect(results[0].status).toBe('completed');
    });
  });
});
