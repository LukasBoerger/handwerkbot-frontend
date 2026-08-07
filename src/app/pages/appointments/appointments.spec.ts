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

  // Studie: Abschließen führt an pending vorbei (kein Bestätigen, keine E-Mail).
  describe('Abschließen-Button', () => {
    function render(status: AppointmentStatus) {
      component.appointments = [makeApt('a1', status)];
      component.applyFilter();
      fixture.detectChanges();
    }

    it('ist bei Status "confirmed" sichtbar', () => {
      render('confirmed');
      expect(fixture.nativeElement.querySelector('.action-btn--complete')).toBeTruthy();
    });

    it('ist bei Status "pending" nicht sichtbar', () => {
      render('pending');
      expect(fixture.nativeElement.querySelector('.action-btn--complete')).toBeNull();
    });
  });

  // Interne Test-Chat-Kennung "simulate-…" wird nicht als Rufnummer angezeigt.
  describe('Kunden-Rufnummer', () => {
    function renderWithPhone(phone: string) {
      component.appointments = [{ ...makeApt('p1', 'confirmed'), phoneNumber: phone }];
      component.applyFilter();
      fixture.detectChanges();
    }

    it('blendet die simulate-Kennung aus', () => {
      renderWithPhone('simulate-11');
      expect(fixture.nativeElement.querySelector('.customer-phone')).toBeNull();
    });

    it('zeigt echte Rufnummern', () => {
      renderWithPhone('+49 170 1234567');
      const el = fixture.nativeElement.querySelector('.customer-phone');
      expect(el).toBeTruthy();
      expect(el.textContent).toContain('+49 170 1234567');
    });
  });
});
