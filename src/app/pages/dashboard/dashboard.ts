import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
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
  appointments: any[] = [];
  filtered: any[] = [];
  loading = false;
  statusFilter: 'all' | 'confirmed' | 'completed' | 'cancelled' = 'all';
  displayedColumns = ['customer', 'service', 'datetime', 'address', 'status', 'actions'];

  private auth = inject(AuthService);
  private appointmentService = inject(AppointmentService);
  private router = inject(Router);
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
    this.filtered =
      this.statusFilter === 'all'
        ? this.appointments
        : this.appointments.filter((a) => a.status === this.statusFilter);
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
        this.cdr.detectChanges();
      },
    });
  }

  get totalCount() {
    return this.appointments.length;
  }
  get todayCount() {
    const today = new Date().toDateString();
    return this.appointments.filter((a) => new Date(a.createdAt).toDateString() === today).length;
  }
  get upcomingCount() {
    return this.appointments.filter((a) => a.status === 'confirmed').length;
  }

  logout() {
    this.auth.logout();
  }
}
