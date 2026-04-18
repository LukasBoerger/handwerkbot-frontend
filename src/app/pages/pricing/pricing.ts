import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../services/auth.service';

interface Plan {
  id: string;
  name: string;
  price: string;
  highlight: boolean;
  features: string[];
}

interface BillingStatus {
  plan: string;
  status: 'trial' | 'active' | 'cancelled';
}

@Component({
  selector: 'app-pricing',
  imports: [RouterLink, MatProgressSpinnerModule],
  templateUrl: './pricing.html',
  styleUrl: './pricing.scss',
})
export class Pricing implements OnInit {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private router = inject(Router);

  loadingPlan = signal<string | null>(null);
  portalLoading = signal(false);
  billingStatus = signal<BillingStatus | null>(null);

  plans: Plan[] = [
    {
      id: 'starter',
      name: 'Starter',
      price: '39',
      highlight: false,
      features: ['1 WhatsApp-Nummer', 'Bis 100 Termine/Monat', 'KI-Kommunikation 24/7', 'E-Mail-Support'],
    },
    {
      id: 'pro',
      name: 'Pro',
      price: '79',
      highlight: true,
      features: ['1 WhatsApp-Nummer', 'Unbegrenzte Termine', 'Google Calendar Sync', 'Prioritäts-Support'],
    },
    {
      id: 'team',
      name: 'Team',
      price: '199',
      highlight: false,
      features: ['Bis 3 WhatsApp-Nummern', 'Unbegrenzte Termine', 'Google Calendar Sync', 'Dedicated Support'],
    },
  ];

  ngOnInit() {
    if (this.auth.isLoggedIn()) {
      this.http
        .get<BillingStatus>('https://api.kommuvo.de/api/billing/status', { headers: this.authHeaders() })
        .subscribe({ next: (res) => this.billingStatus.set(res), error: () => {} });
    }
  }

  isActivePlan(planId: string): boolean {
    const s = this.billingStatus();
    return s?.status === 'active' && s.plan === planId;
  }

  checkout(planId: string) {
    if (!this.auth.isLoggedIn()) {
      localStorage.setItem('selectedPlan', planId);
      this.router.navigate(['/register'], { queryParams: { plan: planId } });
      return;
    }

    this.loadingPlan.set(planId);
    this.http
      .post<{ checkoutUrl: string }>('https://api.kommuvo.de/api/billing/checkout', { plan: planId }, { headers: this.authHeaders() })
      .subscribe({
        next: (res) => { window.location.href = res.checkoutUrl; },
        error: () => { this.loadingPlan.set(null); },
      });
  }

  openPortal() {
    this.portalLoading.set(true);
    this.http
      .post<{ url: string }>('https://api.kommuvo.de/api/billing/portal', {}, { headers: this.authHeaders() })
      .subscribe({
        next: (res) => { window.location.href = res.url; },
        error: () => { this.portalLoading.set(false); },
      });
  }

  private authHeaders(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.auth.getToken()}` });
  }
}
