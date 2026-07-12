// Auth-Verhalten: Antwortet die API mit 401, leitet der HttpInterceptor via
// authService.logout() auf /login um. Kein weißer Screen, keine Endlosschleife.

const TENANT_ID = 'tenant-cypress-401';

const session = {
  token: 'cypress-401-token',
  tenantId: TENANT_ID,
  user: { id: 'u-401', email: 'expired@cypress.de', fullName: '401 Tester' },
};

function stub401() {
  cy.intercept('GET', `**/api/tenants/${TENANT_ID}`, {
    statusCode: 401,
    body: { message: 'Unauthorized' },
  }).as('getTenant');
  cy.intercept('GET', `**/api/tenants/${TENANT_ID}/appointments`, {
    statusCode: 401,
    body: { message: 'Unauthorized' },
  }).as('getAppointments');
}

describe('Auth – 401 leitet auf Login um', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
  });

  it('leitet bei 401 der Termin-API auf /login um (kein weißer Screen)', () => {
    stub401();
    cy.loginAndVisit('/dashboard', session);

    cy.url().should('include', '/login');
    // Login-Formular ist gerendert → kein weißer Screen
    cy.get('[data-cy="input-email"]').should('be.visible');
    cy.get('[data-cy="btn-login"]').should('be.visible');
  });

  it('bleibt stabil auf der Login-Seite (keine Endlosschleife)', () => {
    stub401();
    cy.loginAndVisit('/dashboard', session);

    cy.url().should('include', '/login');
    // Kurz abwarten und erneut prüfen: keine Weiterleitungs-/Reload-Schleife
    cy.wait(1000);
    cy.url().should('include', '/login');
    cy.get('[data-cy="input-email"]').should('be.visible');
  });
});
