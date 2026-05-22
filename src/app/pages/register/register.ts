import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../services/auth.service';

function extractErrorMessage(error: any): string {
  if (typeof error === 'string') return error;
  if (error?.error?.errors && Array.isArray(error.error.errors)) {
    return error.error.errors.join(', ');
  }
  if (error?.error?.error) return error.error.error;
  if (error?.error?.message) return error.error.message;
  if (error?.message) return error.message;
  return 'Ein Fehler ist aufgetreten.';
}

@Component({
  selector: 'app-register',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class Register implements OnInit {
  accountForm: FormGroup;
  businessForm: FormGroup;
  loading = false;
  error = '';
  hidePassword = true;
  selectedPlan: string | null = null;
  currentStep = 1;

  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  private snackBar = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);

  constructor() {
    this.accountForm = this.fb.group({
      fullName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
    });

    this.businessForm = this.fb.group({
      businessName: ['', Validators.required],
      businessPhone: ['', Validators.required],
    });
  }

  ngOnInit() {
    this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      if (params['plan']) {
        this.selectedPlan = params['plan'];
      }
    });
  }

  nextStep() {
    this.accountForm.markAllAsTouched();
    if (this.accountForm.invalid) return;
    this.currentStep = 2;
  }

  prevStep() {
    this.currentStep = 1;
  }

  submit() {
    this.accountForm.markAllAsTouched();
    this.businessForm.markAllAsTouched();
    if (this.accountForm.invalid || this.businessForm.invalid) return;
    this.loading = true;
    this.error = '';

    this.auth.register({
      ...this.accountForm.value,
      ...this.businessForm.value,
    }).subscribe({
      next: () => {
        if (this.selectedPlan) {
          this.startCheckout(this.selectedPlan);
        } else {
          this.loading = false;
          this.router.navigate(['/setup']);
        }
      },
      error: (err) => {
        const msg = extractErrorMessage(err);
        this.error = msg;
        this.loading = false;
        if (msg.toLowerCase().includes('e-mail') || msg.toLowerCase().includes('mail')) {
          this.currentStep = 1;
        }
      },
    });
  }

  loginWithGoogle() {
    window.location.href = environment.apiUrl + '/oauth2/authorization/google';
  }

  private startCheckout(planId: string) {
    const headers = new HttpHeaders({ Authorization: `Bearer ${this.auth.getToken()}` });
    this.http
      .post<{ url: string }>(environment.apiUrl + '/api/billing/checkout', { plan: planId }, { headers })
      .subscribe({
        next: (res) => {
          localStorage.removeItem('selectedPlan');
          window.location.href = res.url;
        },
        error: () => {
          this.loading = false;
          this.snackBar.open(
            'Zahlung konnte nicht gestartet werden. Bitte versuche es erneut.',
            'OK',
            { duration: 4000 },
          );
          this.router.navigate(['/pricing']);
        },
      });
  }
}
