// Mobile-Ansicht Tests – Viewport: 390×844 (iPhone 14 Pro)

const VIEWPORT = { width: 390, height: 844 };

const session = {
  token: 'cypress-test-token',
  tenantId: 'tenant-cypress-test',
  user: { id: 'u1', email: 'test@cypress.de', fullName: 'Cypress Tester' },
};

function loginViaLocalStorage(win: Window) {
  win.localStorage.setItem('token', session.token);
  win.localStorage.setItem('tenantId', session.tenantId);
  win.localStorage.setItem('setupDone', 'true');
  win.localStorage.setItem('user', JSON.stringify(session.user));
}

function checkNoHorizontalOverflow() {
  cy.document().then((doc) => {
    expect(doc.documentElement.scrollWidth).to.lte(VIEWPORT.width + 1);
  });
}

describe('Mobile-Ansicht', () => {
  beforeEach(() => {
    cy.viewport(VIEWPORT.width, VIEWPORT.height);
  });

  // ── Hamburger-Navigation ─────────────────────────────────────────────────────

  describe('Navbar: Hamburger-Menü', () => {
    it('zeigt Hamburger-Button statt Desktop-Links', () => {
      cy.visit('/');
      cy.get('.hamburger').should('be.visible');
      cy.get('.nav-links').should('not.have.class', 'mobile-open');
    });

    it('öffnet Menü beim Klick auf Hamburger', () => {
      cy.visit('/');
      cy.get('.hamburger').click();
      cy.get('.nav-links.mobile-open').should('be.visible');
    });

    it('schließt Menü beim zweiten Klick', () => {
      cy.visit('/');
      cy.get('.hamburger').click();
      cy.get('.nav-links.mobile-open').should('be.visible');
      cy.get('.hamburger').click();
      cy.get('.nav-links.mobile-open').should('not.exist');
    });

    it('schließt Menü beim Klick auf einen Link', () => {
      cy.visit('/');
      cy.get('.hamburger').click();
      cy.get('.nav-links.mobile-open .nav-link').first().click({ force: true });
      cy.get('.nav-links.mobile-open').should('not.exist');
    });
  });

  // ── Öffentliche Seiten ───────────────────────────────────────────────────────

  describe('Landing-Seite (/)', () => {
    beforeEach(() => cy.visit('/'));

    it('lädt ohne horizontalen Überlauf', () => {
      checkNoHorizontalOverflow();
    });

    it('zeigt Hero-Bereich vollständig', () => {
      cy.get('h1, h2').first().should('be.visible');
    });

    it('zeigt CTA-Button', () => {
      cy.get('.btn-hero').should('be.visible');
    });
  });

  describe('Login-Seite (/login)', () => {
    beforeEach(() => cy.visit('/login'));

    it('lädt ohne horizontalen Überlauf', () => {
      checkNoHorizontalOverflow();
    });

    it('zeigt E-Mail- und Passwort-Felder', () => {
      cy.get('input[type="email"], input[formControlName="email"]').should('be.visible');
      cy.get('input[type="password"]').should('be.visible');
    });

    it('Login-Button ist klickbar', () => {
      cy.get('button[type="submit"], button').contains(/anmelden|login/i).should('be.visible');
    });
  });

  describe('Registrierung (/register)', () => {
    beforeEach(() => cy.visit('/register'));

    it('lädt ohne horizontalen Überlauf', () => {
      checkNoHorizontalOverflow();
    });

    it('zeigt Name- und E-Mail-Feld im ersten Schritt', () => {
      cy.get('[data-cy="input-fullname"]').should('be.visible');
      cy.get('[data-cy="input-email"]').should('be.visible');
      cy.get('[data-cy="input-password"]').should('be.visible');
    });

    it('Weiter-Button ist sichtbar und klickbar', () => {
      cy.get('[data-cy="btn-next-account"]').should('be.visible');
    });
  });

  describe('Passwort vergessen (/forgot-password)', () => {
    beforeEach(() => cy.visit('/forgot-password'));

    it('lädt ohne horizontalen Überlauf', () => {
      checkNoHorizontalOverflow();
    });

    it('zeigt E-Mail-Eingabefeld', () => {
      cy.get('input[type="email"], input[formControlName="email"]').should('be.visible');
    });

    it('Senden-Button ist sichtbar', () => {
      cy.get('button[type="submit"], button').contains(/senden|link/i).should('be.visible');
    });
  });

  describe('Passwort zurücksetzen (/reset-password)', () => {
    beforeEach(() => cy.visit('/reset-password'));

    it('lädt ohne horizontalen Überlauf', () => {
      checkNoHorizontalOverflow();
    });

    it('zeigt Passwort-Formular oder Token-Hinweis', () => {
      cy.get('input[type="password"], p, h1, h2').first().should('be.visible');
    });
  });

  describe('Preise (/pricing)', () => {
    beforeEach(() => cy.visit('/pricing'));

    it('lädt ohne horizontalen Überlauf', () => {
      checkNoHorizontalOverflow();
    });

    it('zeigt mindestens eine Preiskarte', () => {
      cy.get('.plan, .pricing-card, mat-card, [class*="plan"]').first().should('be.visible');
    });
  });

  describe('Impressum (/impressum)', () => {
    beforeEach(() => cy.visit('/impressum'));

    it('lädt ohne horizontalen Überlauf', () => {
      checkNoHorizontalOverflow();
    });

    it('zeigt Impressum-Inhalt', () => {
      cy.contains(/impressum/i).should('be.visible');
    });
  });

  describe('Datenschutz (/datenschutz)', () => {
    beforeEach(() => cy.visit('/datenschutz'));

    it('lädt ohne horizontalen Überlauf', () => {
      checkNoHorizontalOverflow();
    });

    it('zeigt Datenschutz-Inhalt', () => {
      cy.contains(/datenschutz/i).should('be.visible');
    });
  });

  // ── Authentifizierte Seiten ──────────────────────────────────────────────────

  describe('Dashboard (/dashboard)', () => {
    beforeEach(() => {
      cy.clearLocalStorage();
      cy.intercept('GET', '**/api/tenants/**', {
        statusCode: 200,
        body: { botName: 'TestBot', welcomeMessage: 'Hallo!' },
      }).as('getTenant');
      cy.intercept('GET', '**/api/tenants/**/appointments', {
        statusCode: 200,
        body: [],
      }).as('getAppointments');

      cy.visit('/dashboard', { onBeforeLoad: loginViaLocalStorage });
    });

    it('lädt ohne horizontalen Überlauf', () => {
      checkNoHorizontalOverflow();
    });

    it('zeigt Navbar mit Hamburger', () => {
      cy.get('.hamburger').should('be.visible');
    });

    it('zeigt Dashboard-Inhalt', () => {
      cy.get('h1, h2, [data-cy="appointments-table"], .dashboard').first().should('exist');
    });
  });

  describe('Einstellungen (/settings)', () => {
    beforeEach(() => {
      cy.clearLocalStorage();
      cy.intercept('GET', '**/api/tenants/**', {
        statusCode: 200,
        body: { botName: 'TestBot', businessName: 'Testbetrieb' },
      }).as('getTenant');

      cy.visit('/settings', { onBeforeLoad: loginViaLocalStorage });
    });

    it('lädt ohne horizontalen Überlauf', () => {
      checkNoHorizontalOverflow();
    });

    it('zeigt Einstellungsformular', () => {
      cy.get('input, textarea, mat-form-field').first().should('exist');
    });

    it('zeigt Hamburger-Menü', () => {
      cy.get('.hamburger').should('be.visible');
    });
  });

  describe('Setup-Wizard (/setup)', () => {
    beforeEach(() => {
      cy.clearLocalStorage();
      cy.intercept('GET', '**/api/tenants/**', {
        statusCode: 200,
        body: {},
      }).as('getTenant');
      cy.intercept('PUT', '**/api/tenants/**', { statusCode: 200, body: {} }).as('updateTenant');

      cy.visit('/setup', {
        onBeforeLoad(win) {
          win.localStorage.setItem('token', session.token);
          win.localStorage.setItem('tenantId', session.tenantId);
          win.localStorage.setItem('user', JSON.stringify(session.user));
        },
      });
    });

    it('lädt ohne horizontalen Überlauf', () => {
      checkNoHorizontalOverflow();
    });

    it('zeigt ersten Wizard-Schritt', () => {
      cy.get(
        '[data-cy="input-setup-business-name"], input, mat-form-field, h1, h2'
      ).first().should('be.visible');
    });

    it('Weiter-Button ist sichtbar', () => {
      cy.get('[data-cy="btn-setup-next-step1"], button').contains(/weiter|next/i).should('be.visible');
    });
  });

  describe('Chat-Seite (/chat)', () => {
    beforeEach(() => {
      cy.clearLocalStorage();
      cy.intercept('GET', '**/api/tenants/**', {
        statusCode: 200,
        body: { botName: 'TestBot', welcomeMessage: 'Hallo! Wie kann ich helfen?' },
      }).as('getTenant');
      cy.intercept('POST', '**/api/chat/simulate', {
        statusCode: 200,
        body: { reply: 'Ich helfe Ihnen gerne!', appointmentSaved: false },
      }).as('chatSimulate');

      cy.visit('/chat', { onBeforeLoad: loginViaLocalStorage });
      cy.wait('@getTenant');
    });

    it('lädt ohne horizontalen Überlauf', () => {
      checkNoHorizontalOverflow();
    });

    it('Chat-Widget füllt die Bildschirmbreite', () => {
      cy.get('.chat-widget').then(($el) => {
        expect($el[0].getBoundingClientRect().width).to.be.gte(VIEWPORT.width * 0.95);
      });
    });

    it('Eingabefeld ist sichtbar und nicht außerhalb des Viewports', () => {
      cy.get('[data-cy="chat-input"]').should('be.visible').then(($el) => {
        const rect = $el[0].getBoundingClientRect();
        expect(rect.bottom).to.be.lte(VIEWPORT.height + 1);
      });
    });

    it('Senden-Button ist sichtbar', () => {
      cy.get('[data-cy="chat-send"]').should('be.visible');
    });

    it('Willkommensnachricht erscheint im Chat', () => {
      cy.get('[data-cy="chat-messages"]').should('contain.text', 'Hallo!');
    });

    it('Nachricht kann gesendet und Antwort empfangen werden', () => {
      cy.get('[data-cy="chat-messages"]').should('be.visible');
      cy.get('[data-cy="chat-input"]').should('not.be.disabled').type('Hallo', { force: true });
      cy.get('[data-cy="chat-send"]').click({ force: true });
      cy.wait('@chatSimulate');
      cy.get('[data-cy="chat-messages"]').should('contain.text', 'Ich helfe Ihnen gerne!');
    });

    it('kein Überlauf nach Keyboard-Öffnung (Input fokussiert)', () => {
      cy.get('[data-cy="chat-input"]').focus();
      checkNoHorizontalOverflow();
    });
  });
});
