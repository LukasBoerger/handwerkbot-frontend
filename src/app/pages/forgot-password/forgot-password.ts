import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-forgot-password',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.scss',
})
export class ForgotPassword {
  form: FormGroup;
  loading = false;
  sent = false;

  private http = inject(HttpClient);
  private fb = inject(FormBuilder);

  private apiUrl = 'https://api.kommuvo.de/api/auth';

  constructor() {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  submit() {
    if (this.form.invalid) return;
    this.loading = true;

    this.http.post(`${this.apiUrl}/forgot-password`, this.form.value).subscribe({
      next: () => {
        this.sent = true;
        this.loading = false;
      },
      error: () => {
        this.sent = true; // Immer success zeigen (Security)
        this.loading = false;
      },
    });
  }
}
