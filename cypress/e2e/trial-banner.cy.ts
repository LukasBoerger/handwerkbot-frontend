// Trial-Banner-Logik im Dashboard (studyMode=false). Alle Felder stammen aus dem
// getTenant-Response (trialExpired, trialDaysLeft). Backend komplett gemockt.
// Selektoren über bestehende CSS-Klassen (kein data-cy an den Bannern vorhanden).

const TENANT_ID = 'tenant-cypress-trial';

const session = {
  token: 'cypress-trial-token',
  tenantId: TENANT_ID,
  user: { id: 'u-trial', email: 'trial@cypress.de', fullName: 'Trial Tester' },
};

function stubTenant(extra: Record<string, unknown>) {
  cy.intercept('GET', `**/api/tenants/${TENANT_ID}`, {
    statusCode: 200,
    body: { botName: 'TrialBot', businessName: 'Trial GmbH', studyMode: false, ...extra },
  }).as('getTenant');
}

describe('Dashboard – Trial-Banner-Logik', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.intercept('GET', `**/api/tenants/${TENANT_ID}/appointments`, {
      statusCode: 200,
      body: [],
    }).as('getAppointments');
  });

  it('zeigt Expired-Banner mit Pricing-Link bei abgelaufenem Trial', () => {
    stubTenant({ trialExpired: true, trialDaysLeft: 0 });
    cy.loginAndVisit('/dashboard', session);
    cy.wait('@getAppointments');

    cy.get('.trial-expired-banner').should('be.visible');
    cy.get('.trial-expired-banner').find('a[routerLink="/pricing"]').should('exist');
    cy.get('.trial-warning-banner').should('not.exist');
  });

  it('zeigt Warning-Banner mit Resttagen bei Trial <= 7 Tagen', () => {
    stubTenant({ trialExpired: false, trialDaysLeft: 5 });
    cy.loginAndVisit('/dashboard', session);
    cy.wait('@getAppointments');

    cy.get('.trial-warning-banner').should('be.visible').and('contain.text', '5');
    cy.get('.trial-expired-banner').should('not.exist');
  });

  it('zeigt kein Banner bei aktivem Abo', () => {
    stubTenant({ trialExpired: false, trialDaysLeft: 99, subscriptionStatus: 'active' });
    cy.loginAndVisit('/dashboard', session);
    cy.wait('@getAppointments');

    cy.get('.trial-expired-banner').should('not.exist');
    cy.get('.trial-warning-banner').should('not.exist');
  });
});
