import { ChangeDetectorRef, Component, HostListener, inject, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AppointmentService } from '../../services/appointment.service';

@Component({
  selector: 'app-appointments-page',
  imports: [
    RouterLink,
    DatePipe,
    MatCardModule,
    MatButtonModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './appointments.html',
  styleUrl: './appointments.scss',
})
export class AppointmentsPage implements OnInit {
  appointments: any[] = [];
  filtered: any[] = [];
  loading = false;
  statusFilter: 'all' | 'confirmed' | 'pending' | 'rescheduled' | 'completed' | 'cancelled' = 'all';
  displayedColumns = this.getColumns();
  updatingId: string | null = null;
  savingNoteId: string | null = null;

  private appointmentService = inject(AppointmentService);
  private snackBar = inject(MatSnackBar);
  private cdr = inject(ChangeDetectorRef);

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
    const base =
      this.statusFilter === 'all'
        ? this.appointments
        : this.appointments.filter((a) => a.status === this.statusFilter);

    const now = Date.now();

    const upcoming = base
      .filter((a) => !a.datetime || new Date(a.datetime).getTime() >= now)
      .sort((a, b) => {
        if (!a.datetime) return 1;
        if (!b.datetime) return -1;
        return new Date(a.datetime).getTime() - new Date(b.datetime).getTime();
      });

    const past = base
      .filter((a) => a.datetime && new Date(a.datetime).getTime() < now)
      .sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime());

    this.filtered = [...upcoming, ...past];
    this.cdr.detectChanges();
  }

  setFilter(f: 'all' | 'confirmed' | 'pending' | 'rescheduled' | 'completed' | 'cancelled') {
    this.statusFilter = f;
    this.applyFilter();
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

  updateStatus(apt: any, status: string) {
    this.updatingId = apt.id;
    this.appointmentService.updateStatus(apt.id, status).subscribe({
      next: (updated) => {
        apt.status = updated.status;
        this.updatingId = null;
        this.applyFilter();
        this.cdr.detectChanges();
      },
      error: () => {
        this.updatingId = null;
        this.snackBar.open('❌ Fehler beim Aktualisieren', 'OK', { duration: 3000 });
        this.cdr.detectChanges();
      },
    });
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
}
