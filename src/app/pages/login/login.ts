import { ChangeDetectorRef, Component, ElementRef, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../services/auth.service';
import { focusFirstInvalid } from '../../shared/form-utils';

@Component({
  selector: 'app-login',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  form: FormGroup;
  loading = false;
  error = '';
  hidePassword = true;

  private host = inject(ElementRef<HTMLElement>);

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  // Demo-Zugangsdaten sind bekannt und absichtlich hardcodiert
  fillDemo() {
    this.form.setValue({ email: 'demo@kommuvo.de', password: 'demo1234' });
    this.form.updateValueAndValidity();
    this.submit();
  }

  submit() {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.cdr.detectChanges();
      focusFirstInvalid(this.host.nativeElement);
      return;
    }
    this.loading = true;
    this.error = '';

    const { email, password } = this.form.value;
    this.auth.login(email, password).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        if (typeof err.error?.error === 'string') {
          this.error = err.error.error;
        } else if (Array.isArray(err.error?.errors)) {
          this.error = err.error.errors.join(', ');
        } else {
          this.error = 'Ungültige Zugangsdaten';
        }
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }
}
