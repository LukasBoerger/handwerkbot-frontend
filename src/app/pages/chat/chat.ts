import { Component, inject, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { TestChat } from '../../components/test-chat/test-chat';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-chat-page',
  imports: [TestChat],
  templateUrl: './chat.html',
  styleUrl: './chat.scss',
})
export class ChatPage implements OnInit {
  botName = 'KommuvoBot';

  private auth = inject(AuthService);
  private http = inject(HttpClient);

  ngOnInit(): void {
    const tenantId = localStorage.getItem('tenantId');
    if (!tenantId) return;
    this.http
      .get<any>(`${environment.apiUrl}/api/tenants/${tenantId}`, {
        headers: new HttpHeaders({ Authorization: `Bearer ${this.auth.getToken()}` }),
      })
      .subscribe({
        next: (t) => { if (t.botName) this.botName = t.botName; },
        error: () => {},
      });
  }
}
