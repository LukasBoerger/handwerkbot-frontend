import { ChangeDetectorRef, Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-site-lock',
  imports: [ReactiveFormsModule, MatIconModule],
  templateUrl: './site-lock.html',
  styleUrl: './site-lock.scss',
})
export class SiteLockPage {
  form: FormGroup;
  error = '';
  hidePassword = true;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
  ) {
    this.form = this.fb.group({
      password: ['', Validators.required],
    });
  }

  submit() {
    if (this.form.invalid) return;
    const { password } = this.form.value;

    if (password === environment.sitePassword) {
      sessionStorage.setItem('site_unlocked', 'true');
      const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
      this.router.navigateByUrl(returnUrl);
    } else {
      this.error = 'Falsches Passwort';
      this.form.get('password')!.setValue('');
      this.cdr.detectChanges();
    }
  }
}
