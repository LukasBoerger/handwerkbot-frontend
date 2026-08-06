import { Component, inject, OnInit, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';

interface Message {
  role: 'user' | 'bot';
  text: string;
  time: string;
}

interface SimulateResponse {
  reply: string;
  appointmentSaved?: boolean;
  blocked?: boolean;
  reason?: string;
}

@Component({
  selector: 'app-test-chat',
  imports: [FormsModule, MatSnackBarModule, RouterLink],
  templateUrl: './test-chat.html',
  styleUrl: './test-chat.scss',
})
export class TestChat implements OnInit {
  @ViewChild('messagesEnd') messagesEnd!: ElementRef;

  messages: Message[] = [];
  inputText = '';
  typing = false;

  // Zugang gesperrt (abgelaufener Trial / inaktives Abo) – persistenter Hinweis statt Bot-Bubble.
  blocked = false;
  blockReason: string | null = null;
  // Study-Mode blendet den kommerziellen /pricing-Link im Block-Hinweis aus.
  studyMode = false;

  private auth = inject(AuthService);
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  private snackBar = inject(MatSnackBar);

  private readonly apiBase = environment.apiUrl;
  private readonly fallback =
    'Vielen Dank für Ihre Nachricht! Wann würden Sie einen Termin wünschen?';

  ngOnInit(): void {
    const tenantId = localStorage.getItem('tenantId');
    if (!tenantId) {
      this.pushBot('Hallo! Wie kann ich Ihnen helfen?');
      return;
    }
    this.http
      .get<any>(`${this.apiBase}/api/tenants/${tenantId}`, { headers: this.headers() })
      .subscribe({
        next: (t) => {
          this.studyMode = t.studyMode ?? false;
          this.pushBot(t.welcomeMessage || 'Hallo! Wie kann ich Ihnen helfen?');
        },
        // Bewusste Degradation: Schlägt das Laden der (rein kosmetischen)
        // Willkommensnachricht fehl, zeigen wir die Standard-Begrüßung statt
        // den Test-Chat mit einer Fehlermeldung zu starten.
        error: () => this.pushBot('Hallo! Wie kann ich Ihnen helfen?'),
      });
  }

  get blockTitle(): string {
    // Im Study-Mode kein Abo-Bezug – neutraler Hinweis.
    if (this.studyMode) return 'Zugang nicht aktiv';
    switch (this.blockReason) {
      case 'trial_expired':
        return 'Testzeitraum abgelaufen';
      case 'inactive':
        return 'Abonnement nicht aktiv';
      default:
        return 'Zugang nicht aktiv';
    }
  }

  get blockMessage(): string {
    // Im Study-Mode kein Abo-/Pricing-Bezug – Teilnehmende an die Studienleitung verweisen.
    if (this.studyMode) {
      return 'Der Zugang ist derzeit nicht aktiv. Bitte wende dich an die Studienleitung.';
    }
    switch (this.blockReason) {
      case 'trial_expired':
        return 'Dein Testzeitraum ist abgelaufen. Schließe ein Abonnement ab, um den Bot weiter zu nutzen.';
      case 'inactive':
        return 'Dein Abonnement ist nicht aktiv (gekündigt oder pausiert). Reaktiviere es, um den Bot weiter zu nutzen.';
      default:
        return 'Dein Zugang ist derzeit nicht aktiv. Bitte schließe ein Abonnement ab, um fortzufahren.';
    }
  }

  send(): void {
    const text = this.inputText.trim();
    if (!text || this.typing || this.blocked) return;

    const history = [...this.messages];
    this.inputText = '';
    this.messages.push({ role: 'user', text, time: this.now() });
    this.typing = true;
    this.scroll();

    const tenantId = localStorage.getItem('tenantId');
    if (!tenantId) {
      this.typing = false;
      this.pushBot(this.fallback);
      return;
    }
    this.http
      .post<SimulateResponse>(
        `${this.apiBase}/api/chat/simulate`,
        { tenantId, message: text, conversationHistory: history },
        { headers: this.headers() },
      )
      .subscribe({
        next: (res) => {
          this.typing = false;
          if (res.blocked) {
            this.blocked = true;
            this.blockReason = res.reason ?? null;
            this.scroll();
            this.cdr.detectChanges();
            return;
          }
          this.pushBot(res.reply);
          if (res.appointmentSaved) {
            this.snackBar.open('✅ Termin wurde gespeichert!', 'OK', { duration: 4000 });
          }
        },
        error: () => {
          // Kein getarnter Fake-Reply: Fehler klar als Störung anzeigen,
          // damit der Nutzer den Bot nicht fälschlich für funktionsfähig hält.
          this.typing = false;
          this.pushBot(
            '⚠️ Der Bot ist gerade nicht erreichbar. Bitte versuchen Sie es gleich erneut.',
          );
          this.snackBar.open('❌ Bot aktuell nicht erreichbar', 'OK', { duration: 4000 });
          this.cdr.detectChanges();
        },
      });
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.send();
    }
  }

  private pushBot(text: string): void {
    this.messages.push({ role: 'bot', text, time: this.now() });
    this.scroll();
    this.cdr.detectChanges();
  }

  private scroll(): void {
    setTimeout(() => {
      this.messagesEnd?.nativeElement?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  }

  private now(): string {
    return new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  }

  private headers(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.auth.getToken()}` });
  }
}
