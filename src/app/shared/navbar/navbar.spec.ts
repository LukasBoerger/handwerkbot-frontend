import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Navbar } from './navbar';
import { AuthService } from '../../services/auth.service';

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
