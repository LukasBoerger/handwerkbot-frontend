import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
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

@Component({
  selector: 'app-pricing',
  imports: [RouterLink, MatProgressSpinnerModule],
  templateUrl: './pricing.html',
  styleUrl: './pricing.scss',
})
export class Pricing {
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  loadingPlan = signal<string | null>(null);

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

  checkout(planId: string) {
    this.loadingPlan.set(planId);
    const token = this.auth.getToken();
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();

    this.http
      .post<{ checkoutUrl: string }>('https://api.kommuvo.de/api/billing/checkout', { plan: planId }, { headers })
      .subscribe({
        next: (res) => {
          window.location.href = res.checkoutUrl;
        },
        error: () => {
          this.loadingPlan.set(null);
        },
      });
  }
}
