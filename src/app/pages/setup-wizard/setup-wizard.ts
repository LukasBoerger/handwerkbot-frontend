import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { ServiceSelector } from '../../components/service-selector/service-selector';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';

function atLeastOneDayOpen(control: AbstractControl): ValidationErrors | null {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const anyOpen = days.some(d => control.get(`open${d}`)?.value === true);
  return anyOpen ? null : { noDaySelected: true };
}

@Component({
  selector: 'app-setup-wizard',
  imports: [
    ReactiveFormsModule,
    ServiceSelector,
    MatSnackBarModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './setup-wizard.html',
  styleUrl: './setup-wizard.scss',
})
export class SetupWizard implements OnInit {
  private auth = inject(AuthService);
  private http = inject(HttpClient);
  private snackBar = inject(MatSnackBar);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  private apiUrl = environment.apiUrl + '/api/tenants';

  currentStep = 1;
  savingStep = false;
  selectedServices: string[] = [];

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
    businessName: ['', Validators.required],
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

  ngOnInit(): void {
    const tenantId = localStorage.getItem('tenantId');
    if (!tenantId) return;
    this.http.get<any>(`${this.apiUrl}/${tenantId}`, { headers: this.getHeaders() })
      .subscribe({
        next: (tenant) => {
          this.step1.patchValue({
            businessName: tenant.businessName ?? '',
            businessOwner: tenant.businessOwner ?? '',
            businessEmail: tenant.businessEmail ?? '',
            botName: tenant.botName ?? 'KommuvoBot',
          });
          if (tenant.businessServices) {
            const services = tenant.businessServices
              .split(',')
              .map((s: string) => s.trim())
              .filter(Boolean);
            this.selectedServices = services;
            this.step1.get('businessServices')?.setValue(tenant.businessServices);
          }
        },
        error: () => {},
      });
  }

  get activeDays(): string[] {
    return this.days
      .filter(d => this.step2.get(`open${d.key}`)?.value)
      .map(d => d.label);
  }

  onServicesChanged(services: string[]): void {
    this.selectedServices = services;
    this.step1.get('businessServices')?.setValue(services.join(', '));
  }

  onNextStep1(): void {
    this.step1.markAllAsTouched();
    if (this.step1.invalid) {
      if (!this.selectedServices.length) {
        this.snackBar.open('Bitte wähle mindestens eine Leistung aus.', 'OK', { duration: 3000 });
      }
      return;
    }
    this.saveStep1();
  }

  onNextStep2(): void {
    this.step2.markAllAsTouched();
    if (this.step2.invalid) return;
    this.saveStep2();
  }

  prevStep(): void {
    this.currentStep--;
  }

  confirmWhatsApp(): void {
    this.currentStep = 4;
  }

  goToDashboard(): void {
    localStorage.setItem('setupDone', 'true');
    this.router.navigate(['/dashboard']);
  }

  private saveStep1(): void {
    const tenantId = localStorage.getItem('tenantId');
    if (!tenantId) { this.currentStep = 2; return; }
    this.savingStep = true;
    this.http
      .put(`${this.apiUrl}/${tenantId}`, this.step1.value, { headers: this.getHeaders() })
      .subscribe({
        next: () => { this.savingStep = false; this.currentStep = 2; },
        error: () => {
          this.savingStep = false;
          this.snackBar.open('Fehler beim Speichern', 'OK', { duration: 3000 });
        },
      });
  }

  private saveStep2(): void {
    const tenantId = localStorage.getItem('tenantId');
    if (!tenantId) { this.currentStep = 3; return; }
    this.savingStep = true;
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
        next: () => { this.savingStep = false; this.currentStep = 3; },
        error: () => {
          this.savingStep = false;
          this.snackBar.open('Fehler beim Speichern', 'OK', { duration: 3000 });
        },
      });
  }

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.auth.getToken()}` });
  }
}
