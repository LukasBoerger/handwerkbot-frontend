import { ChangeDetectorRef, Component, DestroyRef, HostListener, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { AppointmentService } from '../../services/appointment.service';
import { environment } from '../../../environments/environment';

interface WeekBar {
  label: string;
  count: number;
  isCurrent: boolean;
  heightPercent: number;
}

interface CalendarDay {
  value: number | null;
  isToday: boolean;
  hasAppointment: boolean;
}

interface DonutSegment {
  service: string;
  count: number;
  percent: number;
  color: string;
  dashArray: string;
  transform: string;
}

@Component({
  selector: 'app-dashboard',
  imports: [
    RouterLink,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    MatSnackBarModule,
    DatePipe,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  user: any;
  get isDemo(): boolean {
    return this.auth.getUser()?.email === 'demo@kommuvo.de';
  }

  get isNewUser(): boolean {
    return !localStorage.getItem('setupDone');
  }
  appointments: any[] = [];
  filtered: any[] = [];
  loading = false;
  statusFilter: 'all' | 'confirmed' | 'pending' | 'rescheduled' | 'completed' | 'cancelled' = 'all';
  displayedColumns = this.getColumns();

  weeklyChartData: WeekBar[] = [];
  calendarCells: CalendarDay[] = [];
  calendarMonthName = '';
  calendarDate: Date = new Date();
  selectedDate: Date | null = null;
  filteredByDate: any[] = [];
  donutSegments: DonutSegment[] = [];
  donutTotal = 0;

  trialExpired = false;
  trialDaysLeft = 0;
  publicToken: string | null = null;

  updatingId: string | null = null;
  savingNoteId: string | null = null;

  private auth = inject(AuthService);
  private appointmentService = inject(AppointmentService);
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);

  constructor() {
    this.user = this.auth.getUser();
  }

  ngOnInit() {
    this.loadAppointments();
    this.loadTenantInfo();
    this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      if (params['payment'] === 'success') {
        this.snackBar.open('Zahlung erfolgreich! Ihr Abonnement ist jetzt aktiv.', 'OK', { duration: 5000 });
      }
    });
  }

  private loadTenantInfo() {
    const tenantId = localStorage.getItem('tenantId');
    const token = localStorage.getItem('token');
    if (!tenantId || !token) return;

    this.http.get<any>(`${environment.apiUrl}/api/tenants/${tenantId}`, {
      headers: { Authorization: `Bearer ${token}` },
    }).subscribe({
      next: (data) => {
        this.trialExpired = data.trialExpired ?? false;
        this.trialDaysLeft = data.trialDaysLeft ?? 0;
        this.publicToken = data.publicToken ?? null;
        this.cdr.detectChanges();
      },
      error: () => {},
    });
  }

  loadAppointments() {
    this.loading = true;
    this.appointmentService.getMyAppointments().subscribe({
      next: (data) => {
        this.appointments = Array.isArray(data) ? data : [];
        this.applyFilter();
        this.computeChartData();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.appointments = [];
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  applyFilter() {
    const base =
      this.statusFilter === 'all'
        ? this.appointments
        : this.appointments.filter((a) => a.status === this.statusFilter);

    const now = Date.now();

    // Zukünftige Termine (oder ohne Datum): aufsteigend sortiert
    const upcoming = base
      .filter((a) => !a.datetime || new Date(a.datetime).getTime() >= now)
      .sort((a, b) => {
        if (!a.datetime) return 1;
        if (!b.datetime) return -1;
        return new Date(a.datetime).getTime() - new Date(b.datetime).getTime();
      });

    // Vergangene Termine: neueste zuerst
    const past = base
      .filter((a) => a.datetime && new Date(a.datetime).getTime() < now)
      .sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime());

    this.filtered = [...upcoming, ...past].slice(0, 5);
    this.cdr.detectChanges();
  }

  setFilter(f: 'all' | 'confirmed' | 'pending' | 'rescheduled' | 'completed' | 'cancelled') {
    this.statusFilter = f;
    this.applyFilter();
  }

  updateStatus(apt: any, status: string) {
    this.updatingId = apt.id;
    this.appointmentService.updateStatus(apt.id, status).subscribe({
      next: (updated) => {
        apt.status = updated.status;
        this.updatingId = null;
        this.applyFilter();
        this.computeChartData();
        this.cdr.detectChanges();
      },
      error: () => {
        this.updatingId = null;
        this.snackBar.open('❌ Fehler beim Aktualisieren', 'OK', { duration: 3000 });
        this.cdr.detectChanges();
      },
    });
  }

  // ── Stat counts ────────────────────────────────────────────────────────────

  get totalCount() {
    return this.appointments.length;
  }

  get todayCount() {
    const today = new Date().toDateString();
    return this.appointments.filter(
      (a) => new Date(a.createdAt).toDateString() === today,
    ).length;
  }

  get upcomingCount() {
    return this.appointments.filter((a) =>
      ['confirmed', 'pending', 'rescheduled'].includes(a.status),
    ).length;
  }

  get thisWeekCount() {
    const start = this.weekStart(new Date(), 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 7);
    return this.appointments.filter((a) => {
      const d = new Date(a.datetime || a.createdAt);
      return d >= start && d < end;
    }).length;
  }

  // ── Trend texts ────────────────────────────────────────────────────────────

  get upcomingNext(): any[] {
    const now = Date.now();
    return this.appointments
      .filter((a) => a.datetime && new Date(a.datetime).getTime() >= now)
      .sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime())
      .slice(0, 5);
  }

  get trendTotal(): string {
    const now = new Date();
    const thisStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const curr = this.appointments.filter((a) => new Date(a.createdAt) >= thisStart).length;
    const prev = this.appointments.filter((a) => {
      const d = new Date(a.createdAt);
      return d >= lastStart && d < thisStart;
    }).length;
    return this.formatTrend(curr, prev, 'zum Vormonat');
  }

  get trendToday(): string {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const curr = this.appointments.filter((a) => new Date(a.createdAt) >= today).length;
    const prev = this.appointments.filter((a) => {
      const d = new Date(a.createdAt);
      return d >= yesterday && d < today;
    }).length;
    return this.formatTrend(curr, prev, 'vs. gestern');
  }

  get trendUpcoming(): string {
    const total = this.appointments.length;
    if (total === 0) return 'Keine Termine';
    return `${Math.round((this.upcomingCount / total) * 100)}% aller Termine`;
  }

  get trendThisWeek(): string {
    const thisStart = this.weekStart(new Date(), 0);
    const lastStart = this.weekStart(new Date(), 1);
    const thisEnd = new Date(thisStart);
    thisEnd.setDate(thisStart.getDate() + 7);
    const lastEnd = new Date(lastStart);
    lastEnd.setDate(lastStart.getDate() + 7);
    const curr = this.appointments.filter((a) => {
      const d = new Date(a.datetime || a.createdAt);
      return d >= thisStart && d < thisEnd;
    }).length;
    const prev = this.appointments.filter((a) => {
      const d = new Date(a.datetime || a.createdAt);
      return d >= lastStart && d < lastEnd;
    }).length;
    return this.formatTrend(curr, prev, 'vs. letzte Woche');
  }

  // ── Chart data (computed once after load) ─────────────────────────────────

  private computeChartData() {
    this.weeklyChartData = this.buildWeeklyChart();
    this.buildCalendar();
    this.buildDonut();
  }

  private buildWeeklyChart(): WeekBar[] {
    const now = new Date();
    const weeks = Array.from({ length: 7 }, (_, i) => {
      const start = this.weekStart(now, 6 - i);
      const end = new Date(start);
      end.setDate(start.getDate() + 7);
      const count = this.appointments.filter((a) => {
        const d = new Date(a.createdAt);
        return d >= start && d < end;
      }).length;
      return { label: `KW\u00a0${this.isoWeek(start)}`, count, isCurrent: i === 6, heightPercent: 0 };
    });
    const max = Math.max(...weeks.map((w) => w.count), 1);
    return weeks.map((w) => ({ ...w, heightPercent: Math.max((w.count / max) * 100, 4) }));
  }

  private buildCalendar() {
    const year = this.calendarDate.getFullYear();
    const month = this.calendarDate.getMonth();
    const now = new Date();
    const isCurrentMonth = now.getFullYear() === year && now.getMonth() === month;

    const aptDays = new Set(
      this.appointments
        .filter((a) => a.datetime)
        .map((a) => {
          const d = new Date(a.datetime);
          return d.getFullYear() === year && d.getMonth() === month ? d.getDate() : -1;
        })
        .filter((d) => d !== -1),
    );

    const firstDow = new Date(year, month, 1).getDay();
    const offset = (firstDow + 6) % 7; // Monday-first
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = now.getDate();

    this.calendarCells = [
      ...Array(offset).fill({ value: null, isToday: false, hasAppointment: false }),
      ...Array.from({ length: daysInMonth }, (_, i) => ({
        value: i + 1,
        isToday: isCurrentMonth && i + 1 === today,
        hasAppointment: aptDays.has(i + 1),
      })),
    ];
    this.calendarMonthName = this.calendarDate.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
  }

  private buildDonut() {
    const map = new Map<string, number>();
    this.appointments.forEach((a) => {
      const s = (a.service as string) || 'Sonstige';
      map.set(s, (map.get(s) ?? 0) + 1);
    });
    const sorted = [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
    this.donutTotal = sorted.reduce((s, [, c]) => s + c, 0);
    if (this.donutTotal === 0) { this.donutSegments = []; return; }

    const C = 2 * Math.PI * 40;
    const colors = ['#7c6eff', '#4ade80', '#60a5fa'];
    let cumArc = 0;

    this.donutSegments = sorted.map(([service, count], i) => {
      const frac = count / this.donutTotal;
      const arcLen = frac * C;
      const rotation = (cumArc / C) * 360 - 90;
      cumArc += arcLen;
      return {
        service,
        count,
        percent: Math.round(frac * 100),
        color: colors[i],
        dashArray: `${arcLen} ${C}`,
        transform: `rotate(${rotation}, 50, 50)`,
      };
    });
  }

  onDayClick(cell: CalendarDay) {
    if (cell.value === null) return;
    const year = this.calendarDate.getFullYear();
    const month = this.calendarDate.getMonth();
    this.selectedDate = new Date(year, month, cell.value);
    this.filteredByDate = this.appointments.filter((a) => {
      if (!a.datetime) return false;
      const d = new Date(a.datetime);
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === cell.value;
    });
    this.cdr.detectChanges();
  }

  isSelectedDay(cell: CalendarDay): boolean {
    if (!this.selectedDate || cell.value === null) return false;
    const year = this.calendarDate.getFullYear();
    const month = this.calendarDate.getMonth();
    return (
      this.selectedDate.getFullYear() === year &&
      this.selectedDate.getMonth() === month &&
      this.selectedDate.getDate() === cell.value
    );
  }

  get selectedDateLabel(): string {
    if (!this.selectedDate) return '';
    return this.selectedDate.toLocaleDateString('de-DE', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
    });
  }

  prevMonth() {
    this.calendarDate = new Date(this.calendarDate.getFullYear(), this.calendarDate.getMonth() - 1, 1);
    this.selectedDate = null;
    this.filteredByDate = [];
    this.buildCalendar();
    this.cdr.detectChanges();
  }

  nextMonth() {
    this.calendarDate = new Date(this.calendarDate.getFullYear(), this.calendarDate.getMonth() + 1, 1);
    this.selectedDate = null;
    this.filteredByDate = [];
    this.buildCalendar();
    this.cdr.detectChanges();
  }

  saveNote(apt: any, event: FocusEvent) {
    const textarea = event.target as HTMLTextAreaElement;
    const newValue = textarea.value;
    if (newValue === (apt.notes ?? '')) return;

    this.savingNoteId = apt.id;
    this.appointmentService.updateNotes(apt.id, newValue).subscribe({
      next: (updated) => {
        apt.notes = updated.notes ?? null;
        this.savingNoteId = null;
        this.cdr.detectChanges();
      },
      error: () => {
        this.savingNoteId = null;
        textarea.value = apt.notes ?? '';
        this.snackBar.open('Notiz konnte nicht gespeichert werden', 'OK', { duration: 3000 });
        this.cdr.detectChanges();
      },
    });
  }

  goToAppointments(status?: string) {
    if (status) {
      this.router.navigate(['/appointments'], { queryParams: { status } });
    } else {
      this.router.navigate(['/appointments']);
    }
  }

  openChat(): void {
    window.open('/chat', '_blank');
  }

  copyPublicLink(): void {
    if (!this.publicToken) {
      this.snackBar.open('Link nicht verfügbar – bitte Seite neu laden.', 'OK', { duration: 3000 });
      return;
    }
    const link = `${window.location.origin}/public/chat/${this.publicToken}`;
    navigator.clipboard.writeText(link).then(() => {
      this.snackBar.open('Link kopiert! ✓', 'OK', { duration: 3000 });
    });
  }

  logout() {
    this.auth.logout();
  }

  @HostListener('window:resize')
  onResize() {
    this.displayedColumns = this.getColumns();
  }

  private getColumns(): string[] {
    if (typeof window !== 'undefined' && window.innerWidth < 600) {
      return ['customer', 'datetime', 'status', 'actions'];
    }
    return ['customer', 'service', 'datetime', 'address', 'status', 'notes', 'actions'];
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private weekStart(date: Date, weeksAgo: number): Date {
    const d = new Date(date);
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7) - weeksAgo * 7);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private isoWeek(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const y = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d.getTime() - y.getTime()) / 86_400_000 + 1) / 7);
  }

  private formatTrend(curr: number, prev: number, suffix: string): string {
    if (prev === 0) return curr > 0 ? `+${curr} ${suffix}` : 'Keine Daten';
    const pct = Math.round(((curr - prev) / prev) * 100);
    return `${pct >= 0 ? '+' : ''}${pct}% ${suffix}`;
  }

  readonly weekDays = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
}
