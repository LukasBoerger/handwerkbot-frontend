import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class AppointmentService {

  private apiUrl = 'https://handwerkbot-java-production.up.railway.app/api/tenants';

  constructor(private http: HttpClient, private auth: AuthService) {}

  getMyAppointments(): Observable<any[]> {
    const tenantId = localStorage.getItem('tenantId');
    return this.http.get<any[]>(
      `${this.apiUrl}/${tenantId}/appointments`,
      { headers: this.getHeaders() }
    );
  }

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Authorization': `Bearer ${this.auth.getToken()}`
    });
  }
}
