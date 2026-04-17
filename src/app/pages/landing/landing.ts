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
  painPoints = [
    { emoji: '📵', text: 'Sie sind auf der Baustelle und verpassen WhatsApp-Anfragen' },
    { emoji: '🕗', text: 'Abends verbringen Sie Stunden damit, Termine manuell zu koordinieren' },
    { emoji: '😤', text: 'Kunden wechseln zum Konkurrenten weil niemand antwortet' },
  ];

  features = [
    { emoji: '📅', title: 'Automatische Terminbuchung', description: 'Kein Anruf nötig. Kein Hin-und-Her. Termin steht.' },
    { emoji: '🤖', title: 'KI-gestützte Kommunikation', description: 'Um 22 Uhr fragt jemand nach einem Termin? Bot antwortet sofort.' },
    { emoji: '⏱️', title: 'Mehr Zeit fürs Handwerk', description: 'Sparen Sie täglich Stunden an Telefon- und WhatsApp-Kommunikation.' },
    { emoji: '💶', title: 'Günstig & einfach', description: 'Keine IT-Kenntnisse nötig. Setup in 15 Minuten. Ab 39€ pro Monat.' },
    { emoji: '📆', title: 'Google Calendar Sync', description: 'Alle Termine landen automatisch in Ihrem Google Kalender – immer aktuell, überall sichtbar.' },
  ];

  testimonials = [
    { quote: 'Seit HandwerkBot spare ich 2 Stunden täglich.', name: 'Klaus M.', job: 'Elektriker' },
    { quote: 'Meine Kunden sind begeistert wie schnell sie Antwort kriegen.', name: 'Sandra K.', job: 'Malerin' },
    { quote: 'Setup war in 10 Minuten erledigt.', name: 'Thomas B.', job: 'Klempner' },
  ];

  plans = [
    { name: 'Starter', price: '39', highlight: false, features: ['1 WhatsApp-Nummer', 'Bis 100 Termine/Monat', 'KI-Kommunikation 24/7', 'E-Mail-Support'] },
    { name: 'Pro', price: '79', highlight: true, features: ['1 WhatsApp-Nummer', 'Unbegrenzte Termine', 'Google Calendar Sync', 'Prioritäts-Support'] },
    { name: 'Team', price: '199', highlight: false, features: ['Bis 3 WhatsApp-Nummern', 'Unbegrenzte Termine', 'Google Calendar Sync', 'Dedicated Support'] },
  ];

  steps = [
    { number: '01', title: 'Registrieren', description: 'Betrieb anlegen und WhatsApp-Nummer verbinden' },
    { number: '02', title: 'Einrichten', description: 'Leistungen und Öffnungszeiten hinterlegen' },
    { number: '03', title: 'Loslegen', description: 'Bot übernimmt ab sofort die Kundenkommunikation' }
  ];
}
