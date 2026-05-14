import { Component, inject, OnInit, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { environment } from '../../../environments/environment';

interface Message {
  role: 'user' | 'bot';
  text: string;
  time: string;
}

interface PublicInfo {
  botName: string;
  businessName: string;
  welcomeMessage: string;
}

@Component({
  selector: 'app-public-chat-page',
  imports: [FormsModule, MatSnackBarModule],
  templateUrl: './public-chat.html',
  styleUrl: './public-chat.scss',
})
export class PublicChatPage implements OnInit {
  @ViewChild('messagesEnd') messagesEnd!: ElementRef;

  messages: Message[] = [];
  inputText = '';
  typing = false;
  botName = 'KI-Assistent';
  businessName = '';
  notFound = false;

  private token = '';
  private readonly apiBase = environment.apiUrl;

  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  private snackBar = inject(MatSnackBar);

  ngOnInit(): void {
    this.token = this.route.snapshot.paramMap.get('token') ?? '';

    this.http.get<PublicInfo>(`${this.apiBase}/api/tenants/public-info/${this.token}`).subscribe({
      next: (info) => {
        this.botName = info.botName || 'KI-Assistent';
        this.businessName = info.businessName || '';
        const welcome = info.welcomeMessage || 'Hallo! Wie kann ich Ihnen helfen?';
        this.pushBot(welcome);
      },
      error: () => {
        this.notFound = true;
        this.cdr.detectChanges();
      },
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

    this.http
      .post<{ reply: string; appointmentSaved?: boolean }>(
        `${this.apiBase}/public/chat/${this.token}`,
        { message: text, conversationHistory: history },
      )
      .subscribe({
        next: (res) => {
          this.typing = false;
          this.pushBot(res.reply);
          if (res.appointmentSaved) {
            this.snackBar.open('✅ Ihr Termin wurde erfolgreich gebucht!', 'OK', { duration: 5000 });
          }
        },
        error: () => {
          this.typing = false;
          this.pushBot('Entschuldigung, da ist etwas schiefgelaufen. Bitte versuchen Sie es erneut.');
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
}
