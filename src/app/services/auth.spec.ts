import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        RouterTestingModule.withRoutes([{ path: '**', redirectTo: '' }]),
      ],
      providers: [AuthService],
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

    const req = http.expectOne('https://api.kommuvo.de/api/auth/login');
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
});
