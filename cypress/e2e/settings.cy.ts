// Settings: Anfrage-Modus-Umschaltung (Punkt 4) und Pflichtfeld-Validierung (Punkt 6).
// Backend komplett gemockt. Selektoren über bestehende CSS-Klassen/mat-error.

const TENANT_ID = 'tenant-cypress-settings';

const session = {
  token: 'cypress-settings-token',
  tenantId: TENANT_ID,
  user: { id: 'u-settings', email: 'settings@cypress.de', fullName: 'Settings Tester' },
};

// Vollständig gültiger Tenant, damit das Formular valide ist und Speichern durchläuft.
const validTenant = {
  businessName: 'Muster Elektro GmbH',
  businessOwner: 'Hans Muster',
  businessPhone: '+49 2381 123456',
  businessEmail: 'info@muster-elektro.de',
  businessServices: 'Elektroinstallation, Reparaturen',
  botName: 'MusterBot',
  maxDaysAhead: 28,
  autoConfirm: true,
  studyMode: false,
  hoursMon: '07:00-18:00',
};

function stubTenant(body: Record<string, unknown>) {
  cy.intercept('GET', `**/api/tenants/${TENANT_ID}`, { statusCode: 200, body }).as('getTenant');
}

function stubSideCalls() {
  cy.intercept('GET', '**/api/billing/status', { statusCode: 200, body: {} }).as('getBilling');
  cy.intercept('GET', '**/auth/google/status', { statusCode: 200, body: { connected: false } }).as(
    'getGoogleStatus',
  );
  cy.intercept('PUT', `**/api/tenants/${TENANT_ID}`, { statusCode: 200, body: {} }).as(
    'updateTenant',
  );
}

describe('Settings – Anfrage-Modus (requestMode)', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    stubSideCalls();
    stubTenant(validTenant);
    cy.loginAndVisit('/settings', session);
    cy.wait('@getTenant');
  });

  it('zeigt den Hinweistext beim Aktivieren des Anfrage-Modus', () => {
    // Startzustand (autoConfirm=true → requestMode=false): kein Hinweis
    cy.get('.mode-hint').should('not.exist');

    // Zweite Mode-Card = "Anfrage-Modus"
    cy.get('.mode-card').eq(1).click();

    cy.get('.mode-hint').should('be.visible').and('contain.text', 'Ausstehend');
  });

  it('sendet autoConfirm=false beim Speichern im Anfrage-Modus', () => {
    cy.get('.mode-card').eq(1).click();
    cy.get('.btn-save').click();

    cy.wait('@updateTenant').then((interception) => {
      expect(interception.request.body).to.have.property('autoConfirm', false);
      // Frontend mappt requestMode → autoConfirm; requestMode darf nicht im Payload sein.
      expect(interception.request.body).to.not.have.property('requestMode');
    });

    cy.get('.mat-mdc-snack-bar-container').should('contain.text', '✅ Einstellungen gespeichert!');
  });

  it('sendet autoConfirm=true im Automatik-Modus', () => {
    // Erste Mode-Card = "Automatisch"
    cy.get('.mode-card').eq(0).click();
    cy.get('.btn-save').click();

    cy.wait('@updateTenant').then((interception) => {
      expect(interception.request.body).to.have.property('autoConfirm', true);
    });
  });
});

describe('Settings – Pflichtfeld-Validierung', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    stubSideCalls();
  });

  it('zeigt Fehlermeldungen bei leeren Pflichtfeldern und speichert nicht', () => {
    // Leerer Tenant → Pflichtfelder bleiben leer → Formular invalide
    stubTenant({ studyMode: false });
    cy.loginAndVisit('/settings', session);
    cy.wait('@getTenant');

    cy.get('.btn-save').click();

    // Sichtbare Pflichtfeld-Fehler + Hinweis-Snackbar, KEIN PUT
    cy.get('mat-error').should('be.visible').and('contain.text', 'Pflichtfeld');
    cy.get('.mat-mdc-snack-bar-container').should('contain.text', 'Pflichtfelder');
    cy.get('@updateTenant.all').should('have.length', 0);
  });

  it('speichert bei gültiger Eingabe und zeigt Erfolgsfeedback', () => {
    stubTenant(validTenant);
    cy.loginAndVisit('/settings', session);
    cy.wait('@getTenant');

    cy.get('.btn-save').click();

    cy.wait('@updateTenant');
    cy.get('.mat-mdc-snack-bar-container').should('contain.text', '✅ Einstellungen gespeichert!');
  });
});
