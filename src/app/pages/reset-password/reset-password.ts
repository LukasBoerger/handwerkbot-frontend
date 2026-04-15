import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-reset-password',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.scss',
})
export class ResetPassword implements OnInit {
  form: FormGroup;
  loading = false;
  success = false;
  error = '';
  hidePassword = true;
  token = '';

  private http = inject(HttpClient);
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  private apiUrl = 'https://api.kommuvo.de/api/auth';

  constructor() {
    this.form = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
    });
  }

  ngOnInit() {
    this.token = this.route.snapshot.queryParams['token'] || '';
    if (!this.token) this.router.navigate(['/login']);
  }

  submit() {
    if (this.form.invalid) return;
    const { password, confirmPassword } = this.form.value;

    if (password !== confirmPassword) {
      this.error = 'Passwörter stimmen nicht überein';
      return;
    }

    this.loading = true;
    this.error = '';

    this.http
      .post(`${this.apiUrl}/reset-password`, {
        token: this.token,
        password,
      })
      .subscribe({
        next: () => {
          this.success = true;
          this.loading = false;
          setTimeout(() => this.router.navigate(['/login']), 3000);
        },
        error: (err) => {
          this.error = err.error?.error || 'Link ungültig oder abgelaufen';
          this.loading = false;
        },
      });
  }
}
