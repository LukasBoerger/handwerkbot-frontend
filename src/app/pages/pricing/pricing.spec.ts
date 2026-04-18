import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Pricing } from './pricing';
import { AuthService } from '../../services/auth.service';

describe('Pricing', () => {
  let component: Pricing;
  let fixture: ComponentFixture<Pricing>;

  const authServiceMock = {
    getToken: () => null,
    isLoggedIn: () => false,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        Pricing,
        RouterTestingModule.withRoutes([{ path: '**', redirectTo: '' }]),
        HttpClientTestingModule,
        NoopAnimationsModule,
      ],
      providers: [{ provide: AuthService, useValue: authServiceMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(Pricing);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
