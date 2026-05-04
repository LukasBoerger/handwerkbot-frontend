import { Component, inject, OnInit, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';

interface Message {
  role: 'user' | 'bot';
  text: string;
  time: string;
}

@Component({
  selector: 'app-test-chat',
  imports: [FormsModule],
  templateUrl: './test-chat.html',
  styleUrl: './test-chat.scss',
})
export class TestChat implements OnInit {
  @ViewChild('messagesEnd') messagesEnd!: ElementRef;

  messages: Message[] = [];
  inputText = '';
  typing = false;

  private auth = inject(AuthService);
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  private readonly apiBase = 'https://api.kommuvo.de';
  private readonly fallback = 'Vielen Dank für Ihre Nachricht! Wann würden Sie einen Termin wünschen?';

  ngOnInit(): void {
    const tenantId = localStorage.getItem('tenantId');
    this.http
      .get<any>(`${this.apiBase}/api/tenants/${tenantId}`, { headers: this.headers() })
      .subscribe({
        next: (t) => this.pushBot(t.welcomeMessage || 'Hallo! Wie kann ich Ihnen helfen?'),
        error: ()  => this.pushBot('Hallo! Wie kann ich Ihnen helfen?'),
      });
  }

  send(): void {
    const text = this.inputText.trim();
    if (!text || this.typing) return;

    const history = [...this.messages];
    this.inputText = '';
    this.messages.push({ role: 'user', text, time: this.now() });
    this.typing = true;
    this.scroll();

    const tenantId = localStorage.getItem('tenantId');
    this.http
      .post<{ reply: string }>(
        `${this.apiBase}/api/chat/simulate`,
        { tenantId, message: text, conversationHistory: history },
        { headers: this.headers() },
      )
      .subscribe({
        next: (res) => {
          this.typing = false;
          this.pushBot(res.reply);
        },
        error: () => {
          setTimeout(() => {
            this.typing = false;
            this.pushBot(this.fallback);
            this.cdr.detectChanges();
          }, 1200);
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
