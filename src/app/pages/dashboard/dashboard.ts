import { ChangeDetectorRef, Component, HostListener, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { AppointmentService } from '../../services/appointment.service';

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
    DatePipe,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatMenuModule,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  user: any;
  isDemo = this.auth.getUser()?.email === 'demo@kommuvo.de';
  appointments: any[] = [];
  filtered: any[] = [];
  loading = false;
  statusFilter: 'all' | 'confirmed' | 'completed' | 'cancelled' = 'all';
  displayedColumns = this.getColumns();

  weeklyChartData: WeekBar[] = [];
  calendarCells: CalendarDay[] = [];
  calendarMonthName = '';
  donutSegments: DonutSegment[] = [];
  donutTotal = 0;

  private auth = inject(AuthService);
  private appointmentService = inject(AppointmentService);
  private cdr = inject(ChangeDetectorRef);

  constructor() {
    this.user = this.auth.getUser();
  }

  ngOnInit() {
    this.loadAppointments();
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
    this.filtered = [...base]
      .sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime())
      .slice(0, 5);
    this.cdr.detectChanges();
  }

  setFilter(f: 'all' | 'confirmed' | 'completed' | 'cancelled') {
    this.statusFilter = f;
    this.applyFilter();
  }

  updateStatus(apt: any, status: string) {
    this.appointmentService.updateStatus(apt.id, status).subscribe({
      next: (updated) => {
        apt.status = updated.status;
        this.applyFilter();
        this.computeChartData();
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
    return this.appointments.filter((a) => a.status === 'confirmed').length;
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
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

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
        isToday: i + 1 === today,
        hasAppointment: aptDays.has(i + 1),
      })),
    ];
    this.calendarMonthName = now.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
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
    return ['customer', 'service', 'datetime', 'address', 'status', 'actions'];
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
