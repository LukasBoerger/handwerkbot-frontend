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
  features = [
    {
      icon: 'schedule',
      title: 'Automatische Terminbuchung',
      description: 'Kunden buchen Termine direkt per WhatsApp – ohne dass Sie einen Finger rühren müssen.'
    },
    {
      icon: 'smart_toy',
      title: 'KI-gestützte Kommunikation',
      description: 'Claude AI beantwortet Kundenfragen rund um die Uhr – professionell und auf Deutsch.'
    },
    {
      icon: 'trending_up',
      title: 'Mehr Zeit fürs Handwerk',
      description: 'Sparen Sie täglich Stunden an Telefon- und WhatsApp-Kommunikation.'
    },
    {
      icon: 'euro',
      title: 'Günstig & einfach',
      description: 'Keine IT-Kenntnisse nötig. Setup in 15 Minuten. Ab 29€ pro Monat.'
    }
  ];

  steps = [
    { number: '1', title: 'Registrieren', description: 'Betrieb anlegen und WhatsApp-Nummer verbinden' },
    { number: '2', title: 'Einrichten', description: 'Leistungen und Öffnungszeiten hinterlegen' },
    { number: '3', title: 'Loslegen', description: 'Bot übernimmt ab sofort die Kundenkommunikation' }
  ];
}
