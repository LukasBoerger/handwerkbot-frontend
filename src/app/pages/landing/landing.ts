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
    { emoji: '📅', title: 'Automatische Terminbuchung', description: 'Kunden buchen Termine direkt per WhatsApp – ohne dass Sie einen Finger rühren müssen.' },
    { emoji: '🤖', title: 'KI-gestützte Kommunikation', description: 'Claude AI beantwortet Kundenfragen rund um die Uhr – professionell und auf Deutsch.' },
    { emoji: '⏱️', title: 'Mehr Zeit fürs Handwerk', description: 'Sparen Sie täglich Stunden an Telefon- und WhatsApp-Kommunikation.' },
    { emoji: '💶', title: 'Günstig & einfach', description: 'Keine IT-Kenntnisse nötig. Setup in 15 Minuten. Ab 29€ pro Monat.' }
  ];

  steps = [
    { number: '01', title: 'Registrieren', description: 'Betrieb anlegen und WhatsApp-Nummer verbinden' },
    { number: '02', title: 'Einrichten', description: 'Leistungen und Öffnungszeiten hinterlegen' },
    { number: '03', title: 'Loslegen', description: 'Bot übernimmt ab sofort die Kundenkommunikation' }
  ];
}
