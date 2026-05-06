import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatStepper, MatStepperModule } from '@angular/material/stepper';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  imports: [
    ReactiveFormsModule, RouterLink,
    MatCardModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatProgressSpinnerModule,
    MatStepperModule, MatSnackBarModule,
  ],
  templateUrl: './register.html',
  styleUrl: './register.scss'
})
export class Register implements OnInit {
  accountForm: FormGroup;
  businessForm: FormGroup;
  loading = false;
  error = '';
  hidePassword = true;
  selectedPlan: string | null = null;

  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  private snackBar = inject(MatSnackBar);

  constructor() {
    this.accountForm = this.fb.group({
      fullName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]]
    });

    this.businessForm = this.fb.group({
      businessName: ['', Validators.required],
      businessPhone: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['plan']) {
        this.selectedPlan = params['plan'];
      }
    });
  }

  submit(stepper: MatStepper) {
    if (this.accountForm.invalid || this.businessForm.invalid) return;
    this.loading = true;
    this.error = '';

    this.auth.register({
      ...this.accountForm.value,
      ...this.businessForm.value
    }).subscribe({
      next: () => {
        if (this.selectedPlan) {
          this.startCheckout(this.selectedPlan);
        } else {
          this.router.navigate(['/setup']);
        }
      },
      error: (err) => {
        const msg = err.error?.error || 'Registrierung fehlgeschlagen';
        this.error = msg;
        this.loading = false;
        if (msg.toLowerCase().includes('e-mail') ||
            msg.toLowerCase().includes('mail')) {
          stepper.selectedIndex = 0;
        }
      }
    });
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
            { duration: 4000 }
          );
          this.router.navigate(['/pricing']);
        }
      });
  }
}
