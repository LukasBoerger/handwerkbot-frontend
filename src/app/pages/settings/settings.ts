import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-settings',
  imports: [
    ReactiveFormsModule, RouterLink,
    MatCardModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatSnackBarModule,
    MatProgressSpinnerModule, MatDividerModule
  ],
  templateUrl: './settings.html',
  styleUrl: './settings.scss'
})
export class Settings implements OnInit {
  form: FormGroup;
  loading = false;
  saving = false;

  private auth = inject(AuthService);
  private http = inject(HttpClient);
  private snackBar = inject(MatSnackBar);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);

  private apiUrl = 'https://handwerkbot-java-production.up.railway.app/api/tenants';

  constructor() {
    this.form = this.fb.group({
      businessName: ['', Validators.required],
      businessOwner: ['', Validators.required],
      businessPhone: ['', Validators.required],
      businessEmail: ['', [Validators.required, Validators.email]],
      businessServices: ['', Validators.required],
      businessHours: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.loadSettings();
  }

  loadSettings() {
    this.loading = true;
    const tenantId = localStorage.getItem('tenantId');

    this.http.get<any>(
      `${this.apiUrl}/${tenantId}`,
      { headers: this.getHeaders() }
    ).subscribe({
      next: (tenant) => {
        this.form.patchValue(tenant);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  save() {
    if (this.form.invalid) return;
    this.saving = true;
    const tenantId = localStorage.getItem('tenantId');

    this.http.put(
      `${this.apiUrl}/${tenantId}`,
      this.form.value,
      { headers: this.getHeaders() }
    ).subscribe({
      next: () => {
        this.saving = false;
        this.snackBar.open('✅ Einstellungen gespeichert!', 'OK', { duration: 3000 });
        this.cdr.detectChanges();
      },
      error: () => {
        this.saving = false;
        this.snackBar.open('❌ Fehler beim Speichern', 'OK', { duration: 3000 });
        this.cdr.detectChanges();
      }
    });
  }

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Authorization': `Bearer ${this.auth.getToken()}`
    });
  }
}
