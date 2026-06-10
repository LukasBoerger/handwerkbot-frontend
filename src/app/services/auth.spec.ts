import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: '**', redirectTo: '' }]),
      ],
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  it('sollte erstellt werden', () => {
    expect(service).toBeTruthy();
  });

  it('sollte nach Login Token speichern', () => {
    service.login('test@test.de', 'passwort123').subscribe();

    const req = http.expectOne(`${environment.apiUrl}/api/auth/login`);
    expect(req.request.method).toBe('POST');
    req.flush({ token: 'abc123', tenantId: 1, user: { fullName: 'Max' } });

    expect(localStorage.getItem('token')).toBe('abc123');
    expect(localStorage.getItem('tenantId')).toBe('1');
  });

  it('sollte isLoggedIn true zurückgeben wenn Token vorhanden', () => {
    localStorage.setItem('token', 'test-token');
    expect(service.isLoggedIn()).toBeTruthy();
  });

  it('sollte isLoggedIn false zurückgeben wenn kein Token', () => {
    localStorage.removeItem('token');
    expect(service.isLoggedIn()).toBeFalsy();
  });

  it('sollte nach logout localStorage leeren', () => {
    localStorage.setItem('token', 'test-token');
    localStorage.setItem('tenantId', '1');
    service.logout();
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('tenantId')).toBeNull();
  });

  it('sollte nach logout auch user entfernen', () => {
    localStorage.setItem('user', JSON.stringify({ fullName: 'Max' }));
    service.logout();
    expect(localStorage.getItem('user')).toBeNull();
  });

  it('getToken gibt null zurück wenn kein Token', () => {
    expect(service.getToken()).toBeNull();
  });

  it('getToken gibt gespeicherten Token zurück', () => {
    localStorage.setItem('token', 'mein-token');
    expect(service.getToken()).toBe('mein-token');
  });

  it('getUser gibt null zurück wenn kein User gespeichert', () => {
    expect(service.getUser()).toBeNull();
  });

  it('getUser gibt geparsten User zurück', () => {
    localStorage.setItem('user', JSON.stringify({ fullName: 'Max Mustermann' }));
    expect(service.getUser()?.fullName).toBe('Max Mustermann');
  });

  it('setTokenFromOAuth speichert token und tenantId', () => {
    service.setTokenFromOAuth('oauth-token', '42');
    expect(localStorage.getItem('token')).toBe('oauth-token');
    expect(localStorage.getItem('tenantId')).toBe('42');
  });

  it('register speichert Session nach Erfolg', () => {
    service
      .register({
        email: 'neu@test.de',
        password: 'geheim123',
        fullName: 'Neu User',
        businessName: 'Testbetrieb',
        businessPhone: '0123456789',
      })
      .subscribe();

    const req = http.expectOne(`${environment.apiUrl}/api/auth/register`);
    expect(req.request.method).toBe('POST');
    req.flush({ token: 'reg-token', tenantId: 5, user: { fullName: 'Neu User' } });

    expect(localStorage.getItem('token')).toBe('reg-token');
    expect(localStorage.getItem('tenantId')).toBe('5');
  });

  it('deleteAccount sendet DELETE-Anfrage mit Auth-Header', () => {
    localStorage.setItem('token', 'del-token');
    service.deleteAccount().subscribe();

    const req = http.expectOne(`${environment.apiUrl}/api/users/me`);
    expect(req.request.method).toBe('DELETE');
    expect(req.request.headers.get('Authorization')).toBe('Bearer del-token');
    req.flush(null);
  });
});
