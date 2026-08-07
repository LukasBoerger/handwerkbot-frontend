import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TestChat } from './test-chat';
import { AuthService } from '../../services/auth.service';

describe('TestChat', () => {
  let component: TestChat;
  let fixture: ComponentFixture<TestChat>;
  let http: HttpTestingController;

  const authMock = { getToken: () => 'test-token' };

  beforeEach(async () => {
    // scrollIntoView ist im Test-DOM nicht implementiert – No-op, damit der scroll()-Timer nicht wirft.
    Element.prototype.scrollIntoView = () => {};
    localStorage.setItem('tenantId', 'tenant-1');

    await TestBed.configureTestingModule({
      imports: [TestChat],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideNoopAnimations(),
        { provide: AuthService, useValue: authMock },
      ],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(TestChat);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  // ngOnInit lädt die Begrüßung über /api/tenants/{id}
  function init() {
    fixture.detectChanges();
    http
      .expectOne((r) => r.url.includes('/api/tenants/tenant-1'))
      .flush({ welcomeMessage: 'Hallo' });
  }

  function sendAndRespond(body: {
    reply?: string;
    appointmentSaved?: boolean;
    appointmentStatus?: string;
    blocked?: boolean;
    reason?: string;
  }) {
    component.inputText = 'Ich hätte gern einen Termin';
    component.send();
    http.expectOne((r) => r.url.includes('/api/chat/simulate')).flush(body);
    fixture.detectChanges();
  }

  function botMessages(): string[] {
    return component.messages.filter((m) => m.role === 'bot').map((m) => m.text);
  }

  it('sollte erstellt werden', () => {
    init();
    expect(component).toBeTruthy();
  });

  it('zeigt bei blocked=true + trial_expired einen Hinweis und KEINE Bot-Bubble', () => {
    init();
    sendAndRespond({
      blocked: true,
      reason: 'trial_expired',
      reply: 'Ihr Zugang ist abgelaufen.',
      appointmentSaved: false,
    });

    expect(component.blocked).toBe(true);
    expect(component.blockReason).toBe('trial_expired');
    // Die reply darf NICHT als normale Bot-Nachricht erscheinen (nur die Begrüßung bleibt).
    expect(botMessages()).toEqual(['Hallo']);

    const banner = fixture.nativeElement.querySelector('[data-cy="chat-blocked"]');
    expect(banner).toBeTruthy();
    expect(banner.textContent).toContain('Testzeitraum abgelaufen');

    // Eingabe ist gesperrt: ein weiterer Sendeversuch löst keinen Request aus.
    component.inputText = 'Noch eine Nachricht';
    component.send();
    http.expectNone((r) => r.url.includes('/api/chat/simulate'));
  });

  it('zeigt bei blocked=true + inactive den passenden Hinweistext', () => {
    init();
    sendAndRespond({
      blocked: true,
      reason: 'inactive',
      reply: 'Ihr Zugang ist abgelaufen.',
      appointmentSaved: false,
    });

    expect(component.blocked).toBe(true);
    expect(component.blockReason).toBe('inactive');
    expect(botMessages()).toEqual(['Hallo']);

    const banner = fixture.nativeElement.querySelector('[data-cy="chat-blocked"]');
    expect(banner.textContent).toContain('Abonnement nicht aktiv');
  });

  it('rendert eine normale Antwort unverändert als Bot-Bubble (kein Hinweis)', () => {
    init();
    sendAndRespond({ reply: 'Gerne, wann passt es Ihnen?', appointmentSaved: false });

    expect(component.blocked).toBe(false);
    expect(botMessages()).toContain('Gerne, wann passt es Ihnen?');

    const banner = fixture.nativeElement.querySelector('[data-cy="chat-blocked"]');
    expect(banner).toBeNull();

    const input = fixture.nativeElement.querySelector('[data-cy="chat-input"]');
    expect(input.disabled).toBe(false);
  });

  it('Toast bei sofortiger Buchung (confirmed) spricht von gespeichertem Termin', () => {
    init();
    const openSpy = vi.spyOn(fixture.debugElement.injector.get(MatSnackBar), 'open');
    sendAndRespond({ reply: 'Gebucht.', appointmentSaved: true, appointmentStatus: 'confirmed' });

    expect(openSpy).toHaveBeenCalledTimes(1);
    expect(openSpy.mock.calls[0][0]).toContain('gespeichert');
  });

  it('Toast im Anfrage-Modus (pending) spricht von einer Anfrage, nicht von einer Buchung', () => {
    init();
    const openSpy = vi.spyOn(fixture.debugElement.injector.get(MatSnackBar), 'open');
    sendAndRespond({
      reply: 'Anfrage erhalten.',
      appointmentSaved: true,
      appointmentStatus: 'pending',
    });

    expect(openSpy).toHaveBeenCalledTimes(1);
    expect(openSpy.mock.calls[0][0]).toMatch(/anfrage/i);
    expect(openSpy.mock.calls[0][0]).not.toContain('gespeichert');
  });

  it('zeigt im Study-Mode einen neutralen Block-Hinweis ohne Abo-Bezug und ohne Pricing-Link', () => {
    // Begrüßung mit studyMode=true laden (statt des Standard-init()).
    fixture.detectChanges();
    http
      .expectOne((r) => r.url.includes('/api/tenants/tenant-1'))
      .flush({ welcomeMessage: 'Hallo', studyMode: true });

    sendAndRespond({ blocked: true, reason: 'trial_expired', appointmentSaved: false });

    expect(component.studyMode).toBe(true);

    const banner = fixture.nativeElement.querySelector('[data-cy="chat-blocked"]');
    expect(banner).toBeTruthy();
    // Neutrale Formulierung statt "Testzeitraum abgelaufen"/Abo-Text.
    expect(banner.textContent).toContain('Studienleitung');
    expect(banner.textContent).not.toContain('Testzeitraum');
    expect(banner.textContent).not.toContain('Abonnement');
    // Kein kommerzieller /pricing-Link im Study-Mode.
    expect(banner.querySelector('a')).toBeNull();
  });
});
