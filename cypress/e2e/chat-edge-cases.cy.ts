// Chat-Randfälle mit gemockten Bot-Antworten: ungültiges Datum wird im Chat-UI
// korrekt gerendert und es entsteht KEIN Termin. Backend komplett gemockt.
// (Slot-belegt ist bereits in appointment-conflict.cy.ts abgedeckt – nicht dupliziert.)

const TENANT_ID = 'tenant-cypress-edge';

const session = {
  token: 'cypress-edge-token',
  tenantId: TENANT_ID,
  user: { id: 'u-edge', email: 'edge@cypress.de', fullName: 'Edge Tester' },
};

describe('Chat-Randfälle: ungültige Bot-Antworten', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.intercept('GET', `**/api/tenants/${TENANT_ID}`, {
      statusCode: 200,
      body: { botName: 'EdgeBot', welcomeMessage: 'Hallo! Wie kann ich helfen?' },
    }).as('getTenant');
    cy.intercept('GET', `**/api/tenants/${TENANT_ID}/appointments`, {
      statusCode: 200,
      body: [],
    }).as('getAppointments');
  });

  it('zeigt Hinweis bei ungültigem Datum und speichert keinen Termin', () => {
    cy.intercept('POST', '**/api/chat/simulate', {
      statusCode: 200,
      body: {
        reply: 'Der 30.02.2026 ist kein gültiges Datum. Bitte nennen Sie einen anderen Termin.',
        appointmentSaved: false,
      },
    }).as('chatSimulate');

    cy.loginAndVisit('/chat', session);
    cy.wait('@getTenant');

    cy.get('[data-cy="chat-input"]')
      .should('not.be.disabled')
      .type('Ich möchte am 30.02.2026 einen Termin');
    cy.get('[data-cy="chat-send"]').click();
    cy.wait('@chatSimulate');

    // Meldung im Chat-UI, kein Speichern-Snackbar
    cy.get('[data-cy="chat-messages"]').should('contain.text', 'kein gültiges Datum');
    cy.get('.mat-mdc-snack-bar-container').should('not.exist');

    // Dashboard bleibt leer (keine Buchung entstanden)
    cy.loginAndVisit('/dashboard', session);
    cy.wait('@getAppointments');
    cy.get('[data-cy="stat-total"]').should('contain.text', '0');
  });
});
