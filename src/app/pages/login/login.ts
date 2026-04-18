import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [
    ReactiveFormsModule, RouterLink,
    MatCardModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatProgressSpinnerModule
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {
  form: FormGroup;
  loading = false;
  error = '';
  hidePassword = true;

  private cdr = inject(ChangeDetectorRef);

  constructor(private fb: FormBuilder,
              private auth: AuthService,
              private router: Router) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  fillDemo() {
    this.form.setValue({ email: 'demo@kommuvo.de', password: 'demo1234' });
    this.loading = true;
    this.submit();
  }

  submit() {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = '';

    const { email, password } = this.form.value;
    this.auth.login(email, password).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => {
        this.error = err.error?.error || 'Ungültige Zugangsdaten';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }
}
