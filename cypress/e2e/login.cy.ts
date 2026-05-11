// Login-Flow: Formular, Validierung, Fehler, Erfolg

describe('Login-Seite', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.visit('/login');
  });

  // ── Formular-Darstellung ─────────────────────────────────────────────────

  it('zeigt E-Mail-, Passwort-Feld und Login-Button', () => {
    cy.get('[data-cy="input-email"]').should('be.visible');
    cy.get('[data-cy="input-password"]').should('be.visible');
    cy.get('[data-cy="btn-login"]').should('be.visible');
  });

  it('Login-Button ist bei leerem Formular deaktiviert', () => {
    cy.get('[data-cy="btn-login"]').should('be.disabled');
  });

  it('Login-Button bleibt deaktiviert wenn nur E-Mail eingetragen', () => {
    cy.get('[data-cy="input-email"]').type('test@test.de');
    cy.get('[data-cy="btn-login"]').should('be.disabled');
  });

  it('Login-Button wird aktiv wenn E-Mail und Passwort ausgefüllt sind', () => {
    cy.get('[data-cy="input-email"]').type('test@test.de');
    cy.get('[data-cy="input-password"]').type('passwort123');
    cy.get('[data-cy="btn-login"]').should('not.be.disabled');
  });

  // ── Demo-Button ──────────────────────────────────────────────────────────

  it('Demo-Button füllt E-Mail-Feld mit Demo-Adresse', () => {
    cy.get('[data-cy="btn-demo"]').click();
    cy.get('[data-cy="input-email"]').should('have.value', 'demo@kommuvo.de');
  });

  // ── Fehlerfall ───────────────────────────────────────────────────────────

  it('zeigt Fehlermeldung bei falschen Zugangsdaten (401)', () => {
    cy.intercept('POST', '**/api/auth/login', {
      statusCode: 401,
      body: { message: 'Ungültige Zugangsdaten' },
    }).as('loginFail');

    cy.get('[data-cy="input-email"]').type('falsch@test.de');
    cy.get('[data-cy="input-password"]').type('falschespasswort');
    cy.get('[data-cy="btn-login"]').click();

    cy.wait('@loginFail');
    cy.get('.error-banner').should('be.visible');
  });

  // ── Erfolgsfall ──────────────────────────────────────────────────────────

  it('leitet nach erfolgreichem Login zum Dashboard weiter', () => {
    cy.intercept('POST', '**/api/auth/login', {
      statusCode: 200,
      body: {
        token: 'cypress-token-login-test',
        tenantId: 'tenant-login-test',
        user: { id: 'u1', email: 'login@test.de', fullName: 'Login Tester' },
      },
    }).as('loginSuccess');

    cy.intercept('GET', '**/api/tenants/tenant-login-test', {
      statusCode: 200,
      body: { botName: 'TestBot', businessName: 'Test GmbH' },
    }).as('getTenant');

    cy.intercept('GET', '**/api/tenants/tenant-login-test/appointments', {
      statusCode: 200,
      body: [],
    }).as('getAppointments');

    cy.get('[data-cy="input-email"]').type('login@test.de');
    cy.get('[data-cy="input-password"]').type('richtiges-passwort');
    cy.get('[data-cy="btn-login"]').click();

    cy.wait('@loginSuccess');
    cy.url().should('include', '/dashboard');
  });

  it('speichert Token und TenantId nach erfolgreichem Login im localStorage', () => {
    cy.intercept('POST', '**/api/auth/login', {
      statusCode: 200,
      body: {
        token: 'mein-test-token',
        tenantId: 'tenant-42',
        user: { id: 'u99', email: 'storage@test.de', fullName: 'Storage Tester' },
      },
    }).as('loginStorage');

    cy.intercept('GET', '**/api/tenants/**', { statusCode: 200, body: {} }).as('getTenant');

    cy.get('[data-cy="input-email"]').type('storage@test.de');
    cy.get('[data-cy="input-password"]').type('passwort');
    cy.get('[data-cy="btn-login"]').click();
    cy.wait('@loginStorage');

    cy.window().its('localStorage').invoke('getItem', 'token').should('eq', 'mein-test-token');
    cy.window().its('localStorage').invoke('getItem', 'tenantId').should('eq', 'tenant-42');
  });
});
