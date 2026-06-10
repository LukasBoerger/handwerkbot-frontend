import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { Dashboard } from './dashboard';
import { AuthService } from '../../services/auth.service';
import { AppointmentService } from '../../services/appointment.service';
import { AppointmentStatus } from '../../models/appointment.model';

describe('Dashboard', () => {
  let component: Dashboard;
  let fixture: ComponentFixture<Dashboard>;

  const now = new Date();

  function makeApt(id: string, status: AppointmentStatus, service = 'Elektro') {
    return {
      id,
      service,
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

  const testAppointments = [
    makeApt('1', 'confirmed'),
    makeApt('2', 'completed', 'Sanitär'),
    makeApt('3', 'cancelled'),
  ];

  let logoutSpy: ReturnType<typeof vi.fn>;
  let appointmentSvc: {
    getMyAppointments: ReturnType<typeof vi.fn>;
    updateStatus: ReturnType<typeof vi.fn>;
  };
  let authMock: object;

  beforeEach(async () => {
    logoutSpy = vi.fn();
    appointmentSvc = {
      getMyAppointments: vi.fn().mockReturnValue(of(testAppointments)),
      updateStatus: vi.fn().mockReturnValue(of({ id: '1', status: 'completed' })),
    };
    authMock = {
      getToken: () => 'test-token',
      getUser: () => ({ fullName: 'Test User', email: 'test@test.de' }),
      isLoggedIn: () => true,
      logout: logoutSpy,
    };

    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNoopAnimations(),
        { provide: AuthService, useValue: authMock },
        { provide: AppointmentService, useValue: appointmentSvc },
        { provide: ActivatedRoute, useValue: { queryParams: of({}) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Dashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('sollte erstellt werden', () => {
    expect(component).toBeTruthy();
  });

  it('lädt Termine beim Initialisieren', () => {
    expect(appointmentSvc.getMyAppointments).toHaveBeenCalled();
    expect(component.appointments.length).toBe(3);
    expect(component.loading).toBe(false);
  });

  it('berechnet Diagrammdaten nach dem Laden', () => {
    expect(component.weeklyChartData.length).toBe(7);
    expect(component.calendarMonthName).toBeTruthy();
    expect(component.donutSegments.length).toBeGreaterThan(0);
  });

  describe('totalCount', () => {
    it('gibt die Gesamtanzahl zurück', () => {
      expect(component.totalCount).toBe(3);
    });
  });

  describe('upcomingCount', () => {
    it('gibt Anzahl der bestätigten Termine zurück', () => {
      expect(component.upcomingCount).toBe(1);
    });

    it('zählt auch pending- und rescheduled-Termine', () => {
      component.appointments = [
        makeApt('1', 'confirmed'),
        makeApt('2', 'pending'),
        makeApt('3', 'rescheduled'),
        makeApt('4', 'cancelled'),
        makeApt('5', 'completed'),
      ];
      expect(component.upcomingCount).toBe(3);
    });
  });

  describe('todayCount', () => {
    it('gibt Anzahl der heute erstellten Termine zurück', () => {
      expect(component.todayCount).toBe(3);
    });
  });

  describe('thisWeekCount', () => {
    it('gibt Anzahl der Termine dieser Woche zurück', () => {
      expect(component.thisWeekCount).toBe(3);
    });
  });

  describe('trendUpcoming', () => {
    it('enthält Prozentwert wenn Termine vorhanden', () => {
      expect(component.trendUpcoming).toContain('%');
    });

    it('gibt "Keine Termine" zurück bei leerer Liste', () => {
      component.appointments = [];
      expect(component.trendUpcoming).toBe('Keine Termine');
    });
  });

  describe('trendTotal', () => {
    it('gibt "+N zum Vormonat" zurück wenn Vormonat leer war', () => {
      expect(component.trendTotal).toContain('zum Vormonat');
    });

    it('gibt "Keine Daten" zurück wenn keine Termine vorhanden', () => {
      component.appointments = [];
      expect(component.trendTotal).toBe('Keine Daten');
    });
  });

  describe('trendToday', () => {
    it('gibt einen Trend-String mit "vs. gestern" zurück', () => {
      expect(component.trendToday).toContain('vs. gestern');
    });
  });

  describe('trendThisWeek', () => {
    it('gibt einen Trend-String mit "vs. letzte Woche" zurück', () => {
      expect(component.trendThisWeek).toContain('vs. letzte Woche');
    });
  });

  describe('isDemo', () => {
    it('gibt false zurück für regulären Nutzer', () => {
      expect(component.isDemo).toBe(false);
    });
  });

  describe('isNewUser', () => {
    it('gibt true zurück wenn setupDone nicht gesetzt', () => {
      localStorage.removeItem('setupDone');
      expect(component.isNewUser).toBe(true);
    });

    it('gibt false zurück wenn setupDone gesetzt', () => {
      localStorage.setItem('setupDone', 'true');
      expect(component.isNewUser).toBe(false);
    });
  });

  describe('setFilter / applyFilter', () => {
    it('filtert nach "confirmed"', () => {
      component.setFilter('confirmed');
      expect(component.filtered.every((a) => a.status === 'confirmed')).toBe(true);
    });

    it('filtert nach "completed"', () => {
      component.setFilter('completed');
      expect(component.filtered.every((a) => a.status === 'completed')).toBe(true);
    });

    it('filtert nach "cancelled"', () => {
      component.setFilter('cancelled');
      expect(component.filtered.every((a) => a.status === 'cancelled')).toBe(true);
    });

    it('filtert nach "pending"', () => {
      component.appointments = [
        makeApt('p1', 'pending'),
        makeApt('c1', 'confirmed'),
        makeApt('x1', 'cancelled'),
      ];
      component.setFilter('pending');
      expect(component.filtered.length).toBe(1);
      expect(component.filtered[0].status).toBe('pending');
    });

    it('filtert nach "rescheduled"', () => {
      component.appointments = [
        makeApt('r1', 'rescheduled'),
        makeApt('r2', 'rescheduled'),
        makeApt('c1', 'confirmed'),
      ];
      component.setFilter('rescheduled');
      expect(component.filtered.every((a) => a.status === 'rescheduled')).toBe(true);
    });

    it('zeigt alle Termine bei "all"', () => {
      component.setFilter('all');
      expect(component.filtered.length).toBe(3);
    });

    it('begrenzt Anzeige auf maximal 5 Einträge', () => {
      component.appointments = Array.from({ length: 10 }, (_, i) => makeApt(`${i}`, 'confirmed'));
      component.setFilter('all');
      expect(component.filtered.length).toBe(5);
    });

    it('sortiert zukünftige Termine vor vergangenen', () => {
      const future = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      const past = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      component.appointments = [
        { ...makeApt('past1', 'confirmed'), datetime: past },
        { ...makeApt('future1', 'confirmed'), datetime: future },
      ];
      component.setFilter('all');
      expect(component.filtered[0].id).toBe('future1');
      expect(component.filtered[1].id).toBe('past1');
    });

    it('platziert Termine ohne Datum nach zukünftigen Terminen', () => {
      const future = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      component.appointments = [
        { ...makeApt('nodate', 'confirmed'), datetime: null },
        { ...makeApt('future1', 'confirmed'), datetime: future },
      ];
      component.setFilter('all');
      expect(component.filtered[0].id).toBe('future1');
      expect(component.filtered[1].id).toBe('nodate');
    });
  });

  describe('updateStatus', () => {
    it('ruft appointmentService.updateStatus mit korrekten Parametern auf', () => {
      const apt = makeApt('1', 'confirmed');
      component.updateStatus(apt, 'completed');
      expect(appointmentSvc.updateStatus).toHaveBeenCalledWith('1', 'completed');
    });

    it('aktualisiert den Status des Termins nach Erfolg', () => {
      appointmentSvc.updateStatus.mockReturnValue(of({ id: '1', status: 'completed' }));
      const apt = makeApt('1', 'confirmed');
      component.updateStatus(apt, 'completed');
      expect(apt.status).toBe('completed');
      expect(component.updatingId).toBeNull();
    });

    it('setzt updatingId bei Fehler zurück', () => {
      appointmentSvc.updateStatus.mockReturnValue(throwError(() => new Error('Fehler')));
      const apt = makeApt('1', 'confirmed');
      component.updateStatus(apt, 'completed');
      expect(component.updatingId).toBeNull();
    });
  });

  describe('loadAppointments', () => {
    it('setzt appointments auf [] und loading auf false bei Fehler', () => {
      appointmentSvc.getMyAppointments.mockReturnValue(throwError(() => new Error('Fehler')));
      component.loadAppointments();
      expect(component.appointments).toEqual([]);
      expect(component.loading).toBe(false);
    });

    it('verarbeitet auch nicht-Array-Antworten als leeres Array', () => {
      appointmentSvc.getMyAppointments.mockReturnValue(of(null as any));
      component.loadAppointments();
      expect(component.appointments).toEqual([]);
    });
  });

  describe('logout', () => {
    it('ruft auth.logout auf', () => {
      logoutSpy.mockClear();
      component.logout();
      expect(logoutSpy).toHaveBeenCalled();
    });
  });

  describe('onResize', () => {
    it('aktualisiert displayedColumns', () => {
      component.onResize();
      expect(component.displayedColumns.length).toBeGreaterThan(0);
    });
  });
});
