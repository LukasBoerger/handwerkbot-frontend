import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-landing',
  imports: [RouterLink, MatButtonModule, MatIconModule, MatCardModule],
  templateUrl: './landing.html',
  styleUrl: './landing.scss',
})
export class Landing {
  plans = [
    {
      name: 'Starter',
      price: '39',
      highlight: false,
      features: ['1 WhatsApp-Nummer', 'Bis 100 Termine/Monat', 'KI-Kommunikation 24/7', 'E-Mail-Support'],
    },
    {
      name: 'Pro',
      price: '79',
      highlight: true,
      features: ['1 WhatsApp-Nummer', 'Unbegrenzte Termine', 'Google Calendar Sync', 'Prioritäts-Support'],
    },
    {
      name: 'Team',
      price: '199',
      highlight: false,
      features: ['Bis 3 WhatsApp-Nummern', 'Unbegrenzte Termine', 'Google Calendar Sync', 'Dedicated Support'],
    },
  ];

  steps = [
    { number: '01', title: 'Registrieren', description: 'Betrieb anlegen und WhatsApp-Nummer verbinden. Dauert 15 Minuten.' },
    { number: '02', title: 'Einrichten', description: 'Ihre Leistungen und Öffnungszeiten hinterlegen — fertig.' },
    { number: '03', title: 'Loslegen', description: 'Kommuvo übernimmt die Kundenkommunikation. Sie konzentrieren sich aufs Handwerk.' },
  ];
}
