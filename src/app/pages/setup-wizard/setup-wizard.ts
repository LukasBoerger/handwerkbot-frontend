import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatStepper, MatStepperModule } from '@angular/material/stepper';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';

function atLeastOneDayOpen(control: AbstractControl): ValidationErrors | null {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const anyOpen = days.some(d => control.get(`open${d}`)?.value === true);
  return anyOpen ? null : { noDaySelected: true };
}

@Component({
  selector: 'app-setup-wizard',
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatStepperModule,
  ],
  templateUrl: './setup-wizard.html',
  styleUrl: './setup-wizard.scss',
})
export class SetupWizard {
  private auth = inject(AuthService);
  private http = inject(HttpClient);
  private snackBar = inject(MatSnackBar);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);

  private apiUrl = 'https://api.kommuvo.de/api/tenants';

  readonly days = [
    { key: 'Mon', label: 'Montag' },
    { key: 'Tue', label: 'Dienstag' },
    { key: 'Wed', label: 'Mittwoch' },
    { key: 'Thu', label: 'Donnerstag' },
    { key: 'Fri', label: 'Freitag' },
    { key: 'Sat', label: 'Samstag' },
    { key: 'Sun', label: 'Sonntag' },
  ];

  step1 = this.fb.group({
    businessOwner: ['', Validators.required],
    businessEmail: ['', [Validators.required, Validators.email]],
    businessServices: ['', Validators.required],
    botName: ['KommuvoBot', Validators.required],
  });

  step2 = this.fb.group({
    openMon: [false], fromMon: ['07:00'], toMon: ['18:00'],
    openTue: [false], fromTue: ['07:00'], toTue: ['18:00'],
    openWed: [false], fromWed: ['07:00'], toWed: ['18:00'],
    openThu: [false], fromThu: ['07:00'], toThu: ['18:00'],
    openFri: [false], fromFri: ['07:00'], toFri: ['18:00'],
    openSat: [false], fromSat: ['08:00'], toSat: ['13:00'],
    openSun: [false], fromSun: ['08:00'], toSun: ['13:00'],
  }, { validators: atLeastOneDayOpen });

  get activeDays(): string[] {
    return this.days
      .filter(d => this.step2.get(`open${d.key}`)?.value)
      .map(d => d.label);
  }

  onNextStep1(stepper: MatStepper): void {
    this.step1.markAllAsTouched();
    if (this.step1.invalid) return;
    this.saveStep1();
    stepper.next();
  }

  onNextStep2(stepper: MatStepper): void {
    this.step2.markAllAsTouched();
    if (this.step2.invalid) return;
    this.saveStep2();
    stepper.next();
  }

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  private saveStep1(): void {
    const tenantId = localStorage.getItem('tenantId');
    this.http
      .put(`${this.apiUrl}/${tenantId}`, this.step1.value, { headers: this.getHeaders() })
      .subscribe({
        error: () => this.snackBar.open('❌ Fehler beim Speichern', 'OK', { duration: 3000 }),
      });
  }

  private saveStep2(): void {
    const tenantId = localStorage.getItem('tenantId');
    const payload: Record<string, string | null> = {};
    for (const day of this.days) {
      const open = this.step2.get(`open${day.key}`)?.value;
      const from = this.step2.get(`from${day.key}`)?.value;
      const to = this.step2.get(`to${day.key}`)?.value;
      payload[`hours${day.key}`] = open ? `${from}-${to}` : null;
    }
    this.http
      .put(`${this.apiUrl}/${tenantId}`, payload, { headers: this.getHeaders() })
      .subscribe({
        error: () => this.snackBar.open('❌ Fehler beim Speichern', 'OK', { duration: 3000 }),
      });
  }

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.auth.getToken()}` });
  }
}
