import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { SetupWizard } from './setup-wizard';
import { AuthService } from '../../services/auth.service';

describe('SetupWizard', () => {
  let component: SetupWizard;
  let fixture: ComponentFixture<SetupWizard>;
  let http: HttpTestingController;

  const authMock = { getToken: () => 'test-token', isLoggedIn: () => true };

  beforeEach(async () => {
    // Kein tenantId -> ngOnInit macht keinen HTTP-Call, saveStepX springt direkt weiter
    localStorage.removeItem('tenantId');

    await TestBed.configureTestingModule({
      imports: [SetupWizard],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideNoopAnimations(),
        { provide: AuthService, useValue: authMock },
      ],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(SetupWizard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  it('sollte erstellt werden', () => {
    expect(component).toBeTruthy();
  });

  it('bleibt auf Schritt 1, wenn Pflichtfelder in Schritt 1 leer sind', () => {
    // businessName/businessOwner/businessEmail leer -> step1 ungültig
    component.onNextStep1();
    expect(component.currentStep).toBe(1);
    expect(component.step1.invalid).toBe(true);
    expect(component.step1.get('businessName')?.touched).toBe(true);
  });

  it('wechselt zu Schritt 2, wenn Schritt 1 vollständig ausgefüllt ist', () => {
    component.onServicesChanged(['Elektroinstallation']);
    component.step1.patchValue({
      businessName: 'Müller GmbH',
      businessOwner: 'Max Müller',
      businessEmail: 'max@test.de',
      botName: 'KommuvoBot',
    });
    component.onNextStep1();
    expect(component.currentStep).toBe(2);
  });

  it('bleibt auf Schritt 2, wenn kein Öffnungstag aktiv ist', () => {
    component.currentStep = 2;
    component.step2.patchValue({
      openMon: false,
      openTue: false,
      openWed: false,
      openThu: false,
      openFri: false,
      openSat: false,
      openSun: false,
    });
    component.onNextStep2();
    expect(component.currentStep).toBe(2);
    expect(component.step2.hasError('noDaySelected')).toBe(true);
  });

  it('wechselt zu Schritt 3, wenn mindestens ein Tag aktiv ist', () => {
    component.currentStep = 2;
    // Default: Mo–Fr aktiv -> gültig
    component.onNextStep2();
    expect(component.currentStep).toBe(3);
  });
});
