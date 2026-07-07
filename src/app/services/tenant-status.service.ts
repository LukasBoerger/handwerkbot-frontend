import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, shareReplay, map, catchError } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { Tenant } from '../models/tenant.model';

/**
 * Liefert das reine UI-Flag `studyMode` aus der bestehenden Tenant-Status-Response.
 * Wird u.a. von der Navbar genutzt, die selbst keinen Tenant lädt. Ein Fetch pro
 * App-Sitzung (shareReplay), damit die Navbar den Wert ohne eigenen Request-Spam
 * erhält. Fehlt das Feld oder scheitert der Request, gilt Normalmodus (false).
 */
@Injectable({ providedIn: 'root' })
export class TenantStatusService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  private studyMode$?: Observable<boolean>;

  studyMode(): Observable<boolean> {
    if (this.studyMode$) return this.studyMode$;

    const tenantId = localStorage.getItem('tenantId');
    const token = this.auth.getToken();
    // Vor dem Login (kein Token) NICHT cachen: sonst bliebe der persistente
    // Navbar-Wert nach dem Login ohne Reload dauerhaft auf false stehen.
    if (!tenantId || !token) {
      return of(false);
    }

    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    this.studyMode$ = this.http
      .get<Tenant>(`${environment.apiUrl}/api/tenants/${tenantId}`, { headers })
      .pipe(
        map((tenant) => tenant.studyMode ?? false),
        // Defensiv: Kann der Status nicht geladen werden, blenden wir nichts aus.
        catchError(() => of(false)),
        shareReplay(1),
      );
    return this.studyMode$;
  }
}
