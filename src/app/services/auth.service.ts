import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = environment.apiUrl + '/api/auth';

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {}

  register(data: {
    email: string;
    password: string;
    fullName: string;
    businessName: string;
    businessPhone: string;
  }): Observable<any> {
    return this.http
      .post(`${this.apiUrl}/register`, data)
      .pipe(tap((res: any) => this.saveSession(res)));
  }

  login(email: string, password: string): Observable<any> {
    return this.http
      .post(`${this.apiUrl}/login`, { email, password })
      .pipe(tap((res: any) => this.saveSession(res)));
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('tenantId');
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getUser(): any {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) : null;
  }

  setTokenFromOAuth(token: string, tenantId: string) {
    localStorage.setItem('token', token);
    localStorage.setItem('tenantId', tenantId);
  }

  private saveSession(res: any) {
    localStorage.setItem('token', res.token);
    localStorage.setItem('user', JSON.stringify(res.user));
    localStorage.setItem('tenantId', res.tenantId || res.tenant?.id);
  }
}
