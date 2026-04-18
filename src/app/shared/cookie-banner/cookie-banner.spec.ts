import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { CookieBanner } from './cookie-banner';

describe('CookieBanner', () => {
  let component: CookieBanner;
  let fixture: ComponentFixture<CookieBanner>;

  beforeEach(async () => {
    localStorage.removeItem('cookie_accepted');

    await TestBed.configureTestingModule({
      imports: [
        CookieBanner,
        RouterTestingModule.withRoutes([{ path: '**', redirectTo: '' }]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CookieBanner);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  afterEach(() => {
    localStorage.removeItem('cookie_accepted');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should be visible when cookie not accepted', () => {
    expect(component.visible()).toBeTruthy();
  });

  it('should hide and set localStorage on accept', () => {
    component.accept();
    expect(component.visible()).toBeFalsy();
    expect(localStorage.getItem('cookie_accepted')).toBe('true');
  });
});
