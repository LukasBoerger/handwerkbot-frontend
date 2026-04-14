import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
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

@Component({
  selector: 'app-settings',
  imports: [
    ReactiveFormsModule,
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
  ],
  templateUrl: './settings.html',
  styleUrl: './settings.scss',
})
export class Settings implements OnInit {
  form: FormGroup;
  loading = false;
  saving = false;
  googleConnected = false;
  googleLoading = false;

  private auth = inject(AuthService);
  private http = inject(HttpClient);
  private snackBar = inject(MatSnackBar);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);
  private route = inject(ActivatedRoute);

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

  constructor() {
    this.form = this.fb.group({
      businessName: ['', Validators.required],
      businessOwner: ['', Validators.required],
      businessPhone: ['', Validators.required],
      businessEmail: ['', [Validators.required, Validators.email]],
      businessServices: ['', Validators.required],
      botName: ['HandwerkBot', Validators.required],
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
    });
  }

  ngOnInit() {
    this.loadSettings();
    this.loadGoogleStatus();

    // Nach OAuth-Redirect Feedback anzeigen
    this.route.queryParams.subscribe((params) => {
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

  loadSettings() {
    this.loading = true;
    const tenantId = localStorage.getItem('tenantId');

    this.http.get<any>(`${this.apiUrl}/${tenantId}`, { headers: this.getHeaders() }).subscribe({
      next: (tenant) => {
        this.form.patchValue(tenant);
        // Strukturierte Öffnungszeiten aus "07:00-18:00" String aufdröseln
        for (const day of this.days) {
          const raw: string = tenant[`hours${day.key}`];
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
        this.cdr.detectChanges();
      },
    });
  }

  save() {
    if (this.form.invalid) return;
    this.saving = true;
    const tenantId = localStorage.getItem('tenantId');

    // Von/Bis wieder zu "07:00-18:00" zusammenbauen
    const payload: any = { ...this.form.value };
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

  loadGoogleStatus() {
    this.http
      .get<any>('https://api.kommuvo.de/auth/google/status', {
        headers: this.getHeaders(),
      })
      .subscribe({
        next: (res) => {
          this.googleConnected = res.connected;
          this.cdr.detectChanges();
        },
        error: () => {},
      });
  }

  connectGoogle() {
    this.googleLoading = true;
    this.http
      .get<any>('https://api.kommuvo.de/auth/google/url', {
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
      .delete('https://api.kommuvo.de/auth/google/disconnect', {
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
}
