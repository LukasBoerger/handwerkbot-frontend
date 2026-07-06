import { ChangeDetectorRef, Component, ElementRef, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { environment } from '../../../environments/environment';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../services/auth.service';
import { focusFirstInvalid } from '../../shared/form-utils';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class Register {
  accountForm: FormGroup;
  businessForm: FormGroup;
  loading = false;
  error = '';
  hidePassword = true;
  currentStep = 1;

  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private host = inject(ElementRef<HTMLElement>);

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

  nextStep() {
    this.accountForm.markAllAsTouched();
    if (this.accountForm.invalid) {
      this.cdr.detectChanges();
      focusFirstInvalid(this.host.nativeElement);
      return;
    }
    this.currentStep = 2;
  }

  prevStep() {
    this.currentStep = 1;
  }

  submit() {
    this.accountForm.markAllAsTouched();
    this.businessForm.markAllAsTouched();
    if (this.accountForm.invalid || this.businessForm.invalid) {
      if (this.accountForm.invalid) {
        this.currentStep = 1;
      }
      this.cdr.detectChanges();
      focusFirstInvalid(this.host.nativeElement);
      return;
    }
    this.loading = true;
    this.error = '';

    this.auth
      .register({
        ...this.accountForm.value,
        ...this.businessForm.value,
      })
      .subscribe({
        next: () => {
          this.loading = false;
          this.router.navigate(['/setup']);
        },
        error: (err) => {
          let msg = 'Registrierung fehlgeschlagen';
          if (typeof err.error?.error === 'string') {
            msg = err.error.error;
          } else if (Array.isArray(err.error?.errors)) {
            msg = err.error.errors.join(', ');
          } else if (typeof err.error === 'string') {
            msg = err.error;
          }
          this.error = msg;
          this.loading = false;
          if (msg.toLowerCase().includes('mail')) {
            this.currentStep = 1;
          }
          this.cdr.detectChanges();
        },
      });
  }

  loginWithGoogle() {
    window.location.href = environment.apiUrl + '/oauth2/authorization/google';
  }
}
