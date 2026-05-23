import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { EMPTY, Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AppointmentService {
  private apiUrl = environment.apiUrl + '/api/tenants';

  constructor(
    private http: HttpClient,
    private auth: AuthService,
  ) {}

  getMyAppointments(limit?: number): Observable<any[]> {
    const tenantId = localStorage.getItem('tenantId');
    if (!tenantId) return EMPTY;
    let params = new HttpParams();
    if (limit != null) {
      params = params.set('limit', limit.toString());
    }
    return this.http.get<any[]>(`${this.apiUrl}/${tenantId}/appointments`, {
      headers: this.getHeaders(),
      params,
    });
  }

  updateStatus(appointmentId: string, status: string): Observable<any> {
    const tenantId = localStorage.getItem('tenantId');
    if (!tenantId) return EMPTY;
    return this.http.patch(
      `${this.apiUrl}/${tenantId}/appointments/${appointmentId}/status`,
      { status },
      { headers: this.getHeaders() },
    );
  }

  updateNotes(appointmentId: string, notes: string): Observable<any> {
    const tenantId = localStorage.getItem('tenantId');
    if (!tenantId) return EMPTY;
    return this.http.patch(
      `${this.apiUrl}/${tenantId}/appointments/${appointmentId}/notes`,
      { notes },
      { headers: this.getHeaders() },
    );
  }

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${this.auth.getToken()}`,
    });
  }
}
