import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { RouterTestingModule } from '@angular/router/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Settings } from './settings';
import { AuthService } from '../../services/auth.service';

describe('Settings', () => {
  let component: Settings;
  let fixture: ComponentFixture<Settings>;

  const authServiceMock = {
    getToken: () => 'test-token',
    getUser: () => ({ fullName: 'Test User' }),
    isLoggedIn: () => true,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        Settings,
        ReactiveFormsModule,
        HttpClientTestingModule,
        MatSnackBarModule,
        RouterTestingModule.withRoutes([{ path: '**', redirectTo: '' }]),
        NoopAnimationsModule,
      ],
      providers: [{ provide: AuthService, useValue: authServiceMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(Settings);
    component = fixture.componentInstance;
  });

  it('sollte erstellt werden', () => {
    expect(component).toBeTruthy();
  });

  it('sollte Formular mit Standardwerten initialisieren', () => {
    expect(component.form.get('botName')?.value).toBe('KommuvoBot');
    expect(component.form.get('maxDaysAhead')?.value).toBe(28);
  });
});
