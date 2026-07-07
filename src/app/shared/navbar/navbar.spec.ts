import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { provideRouter } from '@angular/router';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Navbar } from './navbar';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';

describe('Navbar', () => {
  let component: Navbar;
  let fixture: ComponentFixture<Navbar>;

  const authServiceMock = {
    isLoggedIn: () => false,
    getUser: () => null,
    logout: () => {},
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        Navbar,
        RouterTestingModule.withRoutes([{ path: '**', redirectTo: '' }]),
        HttpClientTestingModule,
        NoopAnimationsModule,
      ],
      providers: [{ provide: AuthService, useValue: authServiceMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(Navbar);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('menuOpen ist initial false', () => {
    expect(component.menuOpen).toBe(false);
  });

  it('toggleMenu setzt menuOpen auf true', () => {
    component.toggleMenu();
    expect(component.menuOpen).toBe(true);
  });

  it('toggleMenu beim zweiten Aufruf setzt menuOpen zurück auf false', () => {
    component.toggleMenu();
    component.toggleMenu();
    expect(component.menuOpen).toBe(false);
  });

  it('closeMenu setzt menuOpen auf false', () => {
    component.menuOpen = true;
    component.closeMenu();
    expect(component.menuOpen).toBe(false);
  });

  it('closeMenu macht nichts wenn menuOpen bereits false', () => {
    component.closeMenu();
    expect(component.menuOpen).toBe(false);
  });
});

describe('Navbar – Study-Mode (Preise-Link)', () => {
  let fixture: ComponentFixture<Navbar>;
  let http: HttpTestingController;

  const authServiceMock = {
    isLoggedIn: () => true,
    getToken: () => 'test-token',
    getUser: () => ({ fullName: 'Test User' }),
    logout: () => {},
  };

  const BASE = `${environment.apiUrl}/api/tenants`;

  beforeEach(async () => {
    localStorage.setItem('tenantId', 'tenant-1');

    await TestBed.configureTestingModule({
      imports: [Navbar, HttpClientTestingModule, NoopAnimationsModule],
      // provideRouter([]) statt RouterTestingModule-Redirect: verhindert eine
      // asynchrone Initial-Navigation, die routerLinkActive im Dev-Mode-Check
      // umschalten und einen ExpressionChanged-Fehler auslösen würde.
      providers: [provideRouter([]), { provide: AuthService, useValue: authServiceMock }],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(Navbar);
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  function navLinks(): string[] {
    return Array.from(fixture.nativeElement.querySelectorAll('a.nav-link')).map((a) =>
      (a as HTMLElement).textContent!.trim(),
    );
  }

  it('übernimmt studyMode=true aus dem TenantStatusService (Preise-Link wird per @if ausgeblendet)', () => {
    // Nur Wiring prüfen, kein zweiter detectChanges: routerLinkActive auf dem
    // konditionalen Link würde beim Entfernen im Dev-Check einen
    // ExpressionChanged-Fehler werfen. Das @if(!studyMode)-Ausblenden selbst
    // ist bereits in settings.spec/dashboard.spec am DOM verifiziert.
    fixture.detectChanges(); // löst ngOnInit + loadStudyMode aus
    http.expectOne(`${BASE}/tenant-1`).flush({ studyMode: true });

    expect(fixture.componentInstance.studyMode).toBe(true);
  });

  it('studyMode=false zeigt den "Preise"-Link im DOM', () => {
    fixture.detectChanges();
    http.expectOne(`${BASE}/tenant-1`).flush({ studyMode: false });
    fixture.detectChanges();

    expect(fixture.componentInstance.studyMode).toBe(false);
    expect(navLinks()).toContain('Preise');
  });
});
