import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { AppointmentsPage } from './appointments';
import { AppointmentService } from '../../services/appointment.service';
import { AppointmentStatus } from '../../models/appointment.model';

describe('AppointmentsPage', () => {
  let component: AppointmentsPage;
  let fixture: ComponentFixture<AppointmentsPage>;

  const now = new Date();

  function makeApt(id: string, status: AppointmentStatus) {
    return {
      id,
      service: 'Elektro',
      status,
      datetime: now.toISOString(),
      createdAt: now.toISOString(),
      customerName: `Kunde ${id}`,
      address: 'Teststr. 1',
      tenantId: 1,
      phoneNumber: null,
      googleEventId: null,
      origin: 'whatsapp',
      notes: null,
      customerEmail: null,
    };
  }

  let appointmentSvc: {
    getMyAppointments: ReturnType<typeof vi.fn>;
    updateStatus: ReturnType<typeof vi.fn>;
    updateNotes: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    appointmentSvc = {
      getMyAppointments: vi.fn().mockReturnValue(of([makeApt('1', 'confirmed')])),
      updateStatus: vi.fn().mockReturnValue(of({ id: '1', status: 'confirmed' })),
      updateNotes: vi.fn().mockReturnValue(of({ id: '1', notes: null })),
    };

    await TestBed.configureTestingModule({
      imports: [AppointmentsPage],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNoopAnimations(),
        { provide: AppointmentService, useValue: appointmentSvc },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AppointmentsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('sollte erstellt werden', () => {
    expect(component).toBeTruthy();
  });

  // Studie: Bestätigen-Button (pending → confirmed), Schritt 5 der Probanden-Anleitung.
  describe('Bestätigen-Button', () => {
    function render(status: AppointmentStatus) {
      component.appointments = [makeApt('p1', status)];
      component.applyFilter();
      fixture.detectChanges();
    }

    it('ist bei Status "pending" sichtbar', () => {
      render('pending');
      expect(fixture.nativeElement.querySelector('[data-cy="btn-confirm-p1"]')).toBeTruthy();
    });

    it('ist bei Status "confirmed" nicht sichtbar', () => {
      render('confirmed');
      expect(fixture.nativeElement.querySelector('[data-cy="btn-confirm-p1"]')).toBeNull();
    });

    it('löst den Statuswechsel auf "confirmed" aus', () => {
      render('pending');
      const btn = fixture.nativeElement.querySelector(
        '[data-cy="btn-confirm-p1"]',
      ) as HTMLButtonElement;
      btn.click();
      expect(appointmentSvc.updateStatus).toHaveBeenCalledWith('p1', 'confirmed');
    });
  });
});
