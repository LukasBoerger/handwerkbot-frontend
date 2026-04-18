import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatStepperModule } from '@angular/material/stepper';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  imports: [
    ReactiveFormsModule, RouterLink,
    MatCardModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatProgressSpinnerModule,
    MatStepperModule
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

  submit() {
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
          this.router.navigate(['/dashboard']);
        }
      },
      error: (err) => {
        this.error = err.error?.error || 'Registrierung fehlgeschlagen';
        this.loading = false;
      }
    });
  }

  private startCheckout(planId: string) {
    const headers = new HttpHeaders({ Authorization: `Bearer ${this.auth.getToken()}` });
    this.http
      .post<{ checkoutUrl: string }>('https://api.kommuvo.de/api/billing/checkout', { plan: planId }, { headers })
      .subscribe({
        next: (res) => {
          localStorage.removeItem('selectedPlan');
          window.location.href = res.checkoutUrl;
        },
        error: () => {
          this.router.navigate(['/dashboard']);
        }
      });
  }
}
