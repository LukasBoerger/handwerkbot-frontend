// Buchungsflow mit Kunden-E-Mail: Die im Chat genannte E-Mail wird an
// chat/simulate übermittelt; der gemockte Termin trägt sie und sie erscheint
// als klickbarer Link in der Dashboard-Terminliste. Backend komplett gemockt.

const TENANT_ID = 'tenant-cypress-email';

const CUSTOMER_NAME = 'Erika Beispiel';
const SERVICE = 'Heizungswartung';
const ADDRESS = 'Ringstraße 7, 44135 Dortmund';
const CUSTOMER_EMAIL = 'erika@example.de';

const appointmentDate = (() => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(9, 0, 0, 0);
  return d;
})();

const testAppointment = {
  id: 'apt-email-1',
  customerName: CUSTOMER_NAME,
  service: SERVICE,
  datetime: appointmentDate.toISOString(),
  address: ADDRESS,
  customerEmail: CUSTOMER_EMAIL,
  status: 'confirmed',
  createdAt: new Date().toISOString(),
};

const session = {
  token: 'cypress-email-token',
  tenantId: TENANT_ID,
  user: { id: 'u-email', email: 'tester@cypress.de', fullName: 'Email Tester' },
};

// Bot-Antworten für zwei Chat-Nachrichten: erst Rückfrage, dann Bestätigung.
const chatReplies = [
  { reply: 'Gerne! Wie lautet Ihr Name und Ihre E-Mail-Adresse?', appointmentSaved: false },
  { reply: `Super! Ihr Termin für ${SERVICE} wurde bestätigt.`, appointmentSaved: true },
];

describe('Buchung mit Kunden-E-Mail', () => {
  beforeEach(() => {
    cy.clearLocalStorage();

    cy.intercept('GET', `**/api/tenants/${TENANT_ID}`, {
      statusCode: 200,
      body: { botName: 'MailBot', welcomeMessage: 'Hallo! Wie kann ich Ihnen helfen?' },
    }).as('getTenant');

    let callCount = 0;
    cy.intercept('POST', '**/api/chat/simulate', (req) => {
      const response = chatReplies[callCount] ?? chatReplies[chatReplies.length - 1];
      callCount++;
      req.reply({ statusCode: 200, body: response });
    }).as('chatSimulate');

    cy.intercept('GET', `**/api/tenants/${TENANT_ID}/appointments`, {
      statusCode: 200,
      body: [testAppointment],
    }).as('getAppointments');
  });

  it('übermittelt die E-Mail an chat/simulate und zeigt sie im Dashboard', () => {
    cy.loginAndVisit('/chat', session);
    cy.wait('@getTenant');
    cy.get('[data-cy="chat-messages"]').should('contain.text', 'Hallo!');

    // ── Nachricht mit Kundendaten inkl. E-Mail → Request-Body enthält die E-Mail ──
    const dataMessage = `${CUSTOMER_NAME}, ${ADDRESS}, E-Mail: ${CUSTOMER_EMAIL}`;
    cy.get('[data-cy="chat-input"]').should('not.be.disabled').type(dataMessage);
    cy.get('[data-cy="chat-send"]').click();

    cy.wait('@chatSimulate').then((interception) => {
      expect(interception.request.body).to.deep.include({
        tenantId: TENANT_ID,
        message: dataMessage,
      });
      expect(interception.request.body.message).to.contain(CUSTOMER_EMAIL);
    });

    cy.get('[data-cy="chat-messages"]').should('contain.text', 'Name und Ihre E-Mail');

    // ── Bestätigungs-Nachricht → Termin wird gespeichert ────────────────────────
    cy.get('[data-cy="chat-input"]').should('not.be.disabled').type('Ja, bitte so buchen');
    cy.get('[data-cy="chat-send"]').click();
    cy.wait('@chatSimulate');

    cy.get('.mat-mdc-snack-bar-container').should('contain.text', '✅ Termin wurde gespeichert!');

    // ── Dashboard: E-Mail erscheint in der Terminliste ──────────────────────────
    cy.loginAndVisit('/dashboard', session);
    cy.wait('@getAppointments');

    cy.get('[data-cy="appointments-table"]').should('contain.text', CUSTOMER_NAME);
    cy.get('[data-cy="appointments-table"]').should('contain.text', CUSTOMER_EMAIL);
    cy.get('.customer-email').should('have.attr', 'href', `mailto:${CUSTOMER_EMAIL}`);
  });
});
