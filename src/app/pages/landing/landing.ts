import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-landing',
  imports: [RouterLink],
  templateUrl: './landing.html',
  styleUrl: './landing.scss',
})
export class Landing {
  features = [
    'KI-Chatbot für WhatsApp',
    'Automatische Terminbuchung',
    'Google Calendar Integration',
    'Dashboard & Auswertungen',
    'E-Mail Support',
  ];

  steps = [
    { number: '01', title: 'Registrieren', description: 'Betrieb anlegen und WhatsApp-Nummer verbinden. Dauert 15 Minuten.' },
    { number: '02', title: 'Einrichten', description: 'Ihre Leistungen und Öffnungszeiten hinterlegen — fertig.' },
    { number: '03', title: 'Loslegen', description: 'Kommuvo übernimmt die Kundenkommunikation. Sie konzentrieren sich aufs Handwerk.' },
  ];
}
