describe('Onboarding: Registrierung + Setup-Wizard', () => {
  beforeEach(() => {
    cy.clearLocalStorage();

    cy.intercept('POST', '**/api/auth/register', {
      statusCode: 200,
      body: {
        token: 'cypress-test-token-abc123',
        tenantId: 'tenant-cypress-test',
        user: {
          id: 'user-cypress-test',
          email: 'cypress@test.de',
          fullName: 'Cypress Tester',
        },
      },
    }).as('register');

    cy.intercept('PUT', '**/api/tenants/**', {
      statusCode: 200,
      body: {},
    }).as('updateTenant');

    // Dashboard-API-Aufrufe abfangen damit kein Fehler entsteht
    cy.intercept('GET', '**/api/tenants/**', {
      statusCode: 200,
      body: {},
    }).as('getTenant');
  });

  it('durchläuft Registrierung und Setup-Wizard vollständig', () => {
    // ── Schritt 1: Registrierung – Account ──────────────────────────────────
    cy.visit('/register');

    cy.get('[data-cy="input-fullname"]').type('Max Müller', { force: true });
    cy.get('[data-cy="input-email"]').type('max@cypress-test.de', { force: true });
    cy.get('[data-cy="input-password"]').type('testpasswort123', { force: true });

    cy.get('[data-cy="btn-next-account"]').click();

    // ── Schritt 2: Registrierung – Betrieb ──────────────────────────────────
    cy.get('[data-cy="input-business-name"]').type('Müller Elektro GmbH', { force: true });
    cy.get('[data-cy="input-business-phone"]').type('+49 2381 123456', { force: true });

    cy.get('[data-cy="btn-submit-register"]').click();
    cy.wait('@register');

    // ── Setup-Wizard: Schritt 1 – Betriebsdaten ─────────────────────────────
    cy.url().should('include', '/setup');

    cy.get('[data-cy="input-setup-business-name"]').type('Müller Elektro GmbH', { force: true });
    cy.get('[data-cy="input-setup-owner"]').type('Max Müller', { force: true });
    cy.get('[data-cy="input-setup-email"]').type('kontakt@mueller-elektro.de', { force: true });

    // Leistung auswählen: Kategorie öffnen, dann Service anklicken
    cy.get('[data-cy="category-Elektro"]').click();
    cy.get('[data-cy="service-Elektroinstallation"]').click();

    cy.get('[data-cy="input-setup-bot-name"]').clear({ force: true }).type('MuellerBot', { force: true });

    cy.get('[data-cy="btn-setup-next-step1"]').click();
    cy.wait('@updateTenant');

    // ── Setup-Wizard: Schritt 2 – Öffnungszeiten ────────────────────────────
    cy.get('[data-cy="toggle-Mon"]').click();
    cy.get('[data-cy="toggle-Tue"]').click();
    cy.get('[data-cy="toggle-Wed"]').click();
    cy.get('[data-cy="toggle-Thu"]').click();
    cy.get('[data-cy="toggle-Fri"]').click();

    cy.get('[data-cy="btn-setup-next-step2"]').click();
    cy.wait('@updateTenant');

    // ── Setup-Wizard: Schritt 3 – WhatsApp-Anleitung ────────────────────────
    cy.get('[data-cy="btn-setup-whatsapp-confirm"]').click();

    // ── Setup-Wizard: Schritt 4 – Abschluss ─────────────────────────────────
    cy.get('[data-cy="btn-setup-to-dashboard"]').click();

    // ── Ergebnis prüfen ──────────────────────────────────────────────────────
    cy.url().should('include', '/dashboard');
    cy.window().its('localStorage').invoke('getItem', 'setupDone').should('eq', 'true');
  });
});
