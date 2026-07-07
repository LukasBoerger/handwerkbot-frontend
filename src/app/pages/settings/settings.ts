import {
  Component,
  DestroyRef,
  ElementRef,
  inject,
  OnInit,
  ChangeDetectorRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { take } from 'rxjs';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';
import { Tenant } from '../../models/tenant.model';
import { ServiceSelector } from '../../components/service-selector/service-selector';
import { focusFirstInvalid } from '../../shared/form-utils';

interface BillingStatus {
  subscriptionStatus: string;
  stripePriceId: string;
}

@Component({
  selector: 'app-delete-account-dialog',
  standalone: true,
  imports: [MatButtonModule, MatDialogModule],
  template: `
    <h2 mat-dialog-title>Account löschen</h2>
    <mat-dialog-content>
      <p>Bist du sicher? Alle deine Daten und Termine werden unwiderruflich gelöscht.</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Abbrechen</button>
      <button mat-raised-button color="warn" [mat-dialog-close]="true">Endgültig löschen</button>
    </mat-dialog-actions>
  `,
})
export class DeleteAccountDialogComponent {}

@Component({
  selector: 'app-settings',
  imports: [
    ReactiveFormsModule,
    ServiceSelector,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatSlideToggleModule,
    MatDialogModule,
  ],
  templateUrl: './settings.html',
  styleUrl: './settings.scss',
})
export class Settings implements OnInit {
  form: FormGroup;
  selectedServices: string[] = [];
  loading = false;
  loadError = false;
  saving = false;
  googleConnected = false;
  googleLoading = false;
  billingStatus: BillingStatus | null = null;
  billingLoading = false;
  portalLoading = false;
  deletingAccount = false;
  // Study-Mode blendet Abo-, WhatsApp- und Gefahrenzone-Karte aus (Default false).
  studyMode = false;
  private dialog = inject(MatDialog);
  private router = inject(Router);

  private auth = inject(AuthService);
  private http = inject(HttpClient);
  private snackBar = inject(MatSnackBar);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);
  private host = inject(ElementRef<HTMLElement>);

  private apiUrl = environment.apiUrl + '/api/tenants';

  readonly days = [
    { key: 'Mon', label: 'Montag' },
    { key: 'Tue', label: 'Dienstag' },
    { key: 'Wed', label: 'Mittwoch' },
    { key: 'Thu', label: 'Donnerstag' },
    { key: 'Fri', label: 'Freitag' },
    { key: 'Sat', label: 'Samstag' },
    { key: 'Sun', label: 'Sonntag' },
  ];

  constructor() {
    this.form = this.fb.group({
      businessName: ['', Validators.required],
      businessOwner: ['', Validators.required],
      businessPhone: ['', Validators.required],
      businessEmail: ['', [Validators.required, Validators.email]],
      businessServices: ['', Validators.required],
      botName: ['KommuvoBot', Validators.required],
      welcomeMessage: [''],
      outOfHoursMsg: [''],
      maxDaysAhead: [28, [Validators.required, Validators.min(1), Validators.max(365)]],
      // Pro Tag: open toggle + von + bis
      openMon: [false],
      fromMon: ['07:00'],
      toMon: ['18:00'],
      openTue: [false],
      fromTue: ['07:00'],
      toTue: ['18:00'],
      openWed: [false],
      fromWed: ['07:00'],
      toWed: ['18:00'],
      openThu: [false],
      fromThu: ['07:00'],
      toThu: ['18:00'],
      openFri: [false],
      fromFri: ['07:00'],
      toFri: ['18:00'],
      openSat: [false],
      fromSat: ['08:00'],
      toSat: ['13:00'],
      openSun: [false],
      fromSun: ['08:00'],
      toSun: ['13:00'],
      requestMode: [false],
    });
  }

  ngOnInit() {
    this.loadSettings();
    this.loadGoogleStatus();
    this.loadBillingStatus();

    // Nach OAuth-Redirect Feedback anzeigen
    this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      if (params['google'] === 'success') {
        this.googleConnected = true;
        this.snackBar.open('✅ Google Calendar erfolgreich verbunden!', 'OK', { duration: 4000 });
      } else if (params['google'] === 'error') {
        this.snackBar.open('❌ Google Calendar Verbindung fehlgeschlagen', 'OK', {
          duration: 4000,
        });
      }
    });
  }

  // True, wenn kein einziger Tag als geöffnet markiert ist – dann sind keine
  // Terminbuchungen möglich und wir zeigen im Template einen Warnhinweis.
  get hasNoOpenDay(): boolean {
    return this.days.every((d) => !this.form.get(`open${d.key}`)?.value);
  }

  loadSettings() {
    this.loading = true;
    this.loadError = false;
    const tenantId = localStorage.getItem('tenantId');
    if (!tenantId) {
      this.loading = false;
      return;
    }

    this.http.get<Tenant>(`${this.apiUrl}/${tenantId}`, { headers: this.getHeaders() }).subscribe({
      next: (tenant) => {
        this.studyMode = tenant.studyMode ?? false;
        this.form.patchValue(tenant);
        this.selectedServices = (tenant.businessServices || '')
          .split(',')
          .map((s: string) => s.trim())
          .filter((s: string) => s.length > 0);
        this.form.patchValue({ requestMode: !tenant.autoConfirm });
        // Strukturierte Öffnungszeiten aus "07:00-18:00" String aufdröseln
        for (const day of this.days) {
          const raw = (tenant as unknown as Record<string, string | null>)[`hours${day.key}`];
          if (raw && raw.includes('-')) {
            const [from, to] = raw.split('-');
            this.form.patchValue({
              [`open${day.key}`]: true,
              [`from${day.key}`]: from,
              [`to${day.key}`]: to,
            });
          } else {
            this.form.patchValue({ [`open${day.key}`]: false });
          }
        }
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.loadError = true;
        this.snackBar.open('❌ Einstellungen konnten nicht geladen werden', 'OK', {
          duration: 4000,
        });
        this.cdr.detectChanges();
      },
    });
  }

  onServicesChanged(services: string[]): void {
    this.selectedServices = services;
    this.form.get('businessServices')?.setValue(services.join(', '));
  }

  save() {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.snackBar.open('Bitte prüfe die rot markierten Pflichtfelder.', 'OK', { duration: 3000 });
      this.cdr.detectChanges();
      focusFirstInvalid(this.host.nativeElement);
      return;
    }
    this.saving = true;
    const tenantId = localStorage.getItem('tenantId');
    if (!tenantId) {
      this.saving = false;
      return;
    }

    // Von/Bis wieder zu "07:00-18:00" zusammenbauen
    const payload: Record<string, unknown> = { ...this.form.value };
    for (const day of this.days) {
      const open = this.form.value[`open${day.key}`];
      payload[`hours${day.key}`] = open
        ? `${this.form.value[`from${day.key}`]}-${this.form.value[`to${day.key}`]}`
        : null;
      // Hilfsfelder raus
      delete payload[`open${day.key}`];
      delete payload[`from${day.key}`];
      delete payload[`to${day.key}`];
    }
    payload['autoConfirm'] = !payload['requestMode'];
    delete payload['requestMode'];

    this.http.put(`${this.apiUrl}/${tenantId}`, payload, { headers: this.getHeaders() }).subscribe({
      next: () => {
        this.saving = false;
        this.snackBar.open('✅ Einstellungen gespeichert!', 'OK', { duration: 3000 });
        this.cdr.detectChanges();
      },
      error: () => {
        this.saving = false;
        this.snackBar.open('❌ Fehler beim Speichern', 'OK', { duration: 3000 });
        this.cdr.detectChanges();
      },
    });
  }

  loadBillingStatus() {
    this.billingLoading = true;
    this.http
      .get<BillingStatus>(environment.apiUrl + '/api/billing/status', {
        headers: this.getHeaders(),
      })
      .subscribe({
        next: (res) => {
          this.billingStatus = res;
          this.billingLoading = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.billingLoading = false;
          this.snackBar.open('❌ Abo-Status konnte nicht geladen werden', 'OK', { duration: 3000 });
          this.cdr.detectChanges();
        },
      });
  }

  openPortal() {
    this.portalLoading = true;
    this.http
      .post<{
        url: string;
      }>(environment.apiUrl + '/api/billing/portal', {}, { headers: this.getHeaders() })
      .subscribe({
        next: (res) => {
          window.location.href = res.url;
        },
        error: () => {
          this.portalLoading = false;
          this.snackBar.open('❌ Portal konnte nicht geöffnet werden', 'OK', { duration: 3000 });
          this.cdr.detectChanges();
        },
      });
  }

  loadGoogleStatus() {
    this.http
      .get<any>(environment.apiUrl + '/auth/google/status', {
        headers: this.getHeaders(),
      })
      .subscribe({
        next: (res) => {
          this.googleConnected = res.connected;
          this.cdr.detectChanges();
        },
        error: () => {
          this.snackBar.open('❌ Google-Status konnte nicht geladen werden', 'OK', {
            duration: 3000,
          });
        },
      });
  }

  connectGoogle() {
    this.googleLoading = true;
    this.http
      .get<any>(environment.apiUrl + '/auth/google/url', {
        headers: this.getHeaders(),
      })
      .subscribe({
        next: (res) => {
          this.googleLoading = false;
          window.location.href = res.url;
        },
        error: () => {
          this.googleLoading = false;
          this.snackBar.open('❌ Fehler beim Verbinden', 'OK', { duration: 3000 });
        },
      });
  }

  disconnectGoogle() {
    this.http
      .delete(environment.apiUrl + '/auth/google/disconnect', {
        headers: this.getHeaders(),
      })
      .subscribe({
        next: () => {
          this.googleConnected = false;
          this.snackBar.open('Google Calendar getrennt', 'OK', { duration: 3000 });
          this.cdr.detectChanges();
        },
        error: () => {
          this.snackBar.open('❌ Fehler beim Trennen', 'OK', { duration: 3000 });
        },
      });
  }

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${this.auth.getToken()}`,
    });
  }

  openDeleteDialog() {
    const ref = this.dialog.open(DeleteAccountDialogComponent, { width: '400px' });
    ref
      .afterClosed()
      .pipe(take(1))
      .subscribe((confirmed) => {
        if (!confirmed) return;
        this.deletingAccount = true;
        this.auth.deleteAccount().subscribe({
          next: () => {
            this.snackBar.open('Dein Account wurde gelöscht.', 'OK', { duration: 4000 });
            this.auth.logout();
          },
          error: () => {
            this.deletingAccount = false;
            this.snackBar.open('❌ Fehler beim Löschen des Accounts', 'OK', { duration: 3000 });
            this.cdr.detectChanges();
          },
        });
      });
  }
}
