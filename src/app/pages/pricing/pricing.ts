import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';

interface BillingStatus {
  subscriptionStatus: 'trial' | 'active' | 'cancelled';
}

@Component({
  selector: 'app-pricing',
  imports: [MatProgressSpinnerModule],
  templateUrl: './pricing.html',
  styleUrl: './pricing.scss',
})
export class Pricing implements OnInit {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  loading = false;
  portalLoading = false;
  billingStatus: BillingStatus | null = null;

  readonly features = [
    'KI-Chatbot für WhatsApp',
    'Automatische Terminbuchung',
    'Google Calendar Integration',
    'Dashboard & Auswertungen',
    'E-Mail Support',
  ];

  ngOnInit() {
    if (this.auth.isLoggedIn()) {
      this.http
        .get<BillingStatus>(`${environment.apiUrl}/api/billing/status`, { headers: this.authHeaders() })
        .subscribe({
          next: (res) => { this.billingStatus = res; this.cdr.detectChanges(); },
          error: () => {},
        });
    }
  }

  get isActive(): boolean {
    return this.billingStatus?.subscriptionStatus === 'active';
  }

  checkout() {
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/register']);
      return;
    }

    this.loading = true;
    this.http
      .post<{ url: string }>(`${environment.apiUrl}/api/billing/checkout`, {}, { headers: this.authHeaders() })
      .subscribe({
        next: (res) => { window.location.href = res.url; },
        error: () => { this.loading = false; this.cdr.detectChanges(); },
      });
  }

  openPortal() {
    this.portalLoading = true;
    this.http
      .post<{ url: string }>(`${environment.apiUrl}/api/billing/portal`, {}, { headers: this.authHeaders() })
      .subscribe({
        next: (res) => { window.location.href = res.url; },
        error: () => { this.portalLoading = false; this.cdr.detectChanges(); },
      });
  }

  private authHeaders(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.auth.getToken()}` });
  }
}
