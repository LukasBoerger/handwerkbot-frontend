// Slot-Konflikt: Das System darf keine doppelte Buchung für denselben Zeitslot erlauben.
// Kein echter API-Call – Mocks simulieren die Backend-Konfliktlogik.

const TENANT_ID = 'tenant-cypress-conflict';

const session = {
  token: 'cypress-conflict-token',
  tenantId: TENANT_ID,
  user: { id: 'u2', email: 'conflict@cypress.de', fullName: 'Conflict Tester' },
};

const slotDate = (() => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(14, 0, 0, 0);
  return d;
})();

const existingAppointment = {
  id: 'apt-existing-1',
  customerName: 'Erster Kunde',
  service: 'Elektroinstallation',
  phoneNumber: '+49 151 99988877',
  datetime: slotDate.toISOString(),
  address: 'Musterstraße 1',
  status: 'confirmed',
  createdAt: new Date().toISOString(),
};

describe('Slot-Konflikt: Doppelbuchung wird verhindert', () => {
  beforeEach(() => {
    cy.clearLocalStorage();

    cy.intercept('GET', `**/api/tenants/${TENANT_ID}`, {
      statusCode: 200,
      body: { botName: 'KonfliktBot', welcomeMessage: 'Hallo! Termin buchen?' },
    }).as('getTenant');
  });

  it('zeigt Konfliktmeldung und speichert keinen zweiten Termin für denselben Slot', () => {
    // Backend: zweite Buchung wird abgelehnt (appointmentSaved: false)
    const conflictReplies = [
      { reply: 'Gerne! Für wann soll der Termin sein?', appointmentSaved: false },
      { reply: 'Wie lautet Ihr Name und Adresse?', appointmentSaved: false },
      {
        reply: 'Dieser Zeitslot ist leider bereits belegt. Bitte wählen Sie eine andere Zeit.',
        appointmentSaved: false,
      },
    ];

    let callIndex = 0;
    cy.intercept('POST', '**/api/chat/simulate', (req) => {
      const reply = conflictReplies[callIndex] ?? conflictReplies[conflictReplies.length - 1];
      callIndex++;
      req.reply({ statusCode: 200, body: reply });
    }).as('chatSimulate');

    // Dashboard-Mock gibt immer nur den einen bestehenden Termin zurück
    cy.intercept('GET', `**/api/tenants/${TENANT_ID}/appointments`, {
      statusCode: 200,
      body: [existingAppointment],
    }).as('getAppointments');

    // Chat aufrufen und denselben Slot anfragen
    cy.loginAndVisit('/chat', session);
    cy.wait('@getTenant');

    cy.get('[data-cy="chat-input"]').type('Ich brauche morgen um 14 Uhr einen Termin für Elektro');
    cy.get('[data-cy="chat-send"]').click();
    cy.wait('@chatSimulate');
    cy.get('[data-cy="chat-messages"]').should('contain.text', 'Für wann');

    cy.get('[data-cy="chat-input"]').type('Morgen um 14 Uhr');
    cy.get('[data-cy="chat-send"]').click();
    cy.wait('@chatSimulate');
    cy.get('[data-cy="chat-messages"]').should('contain.text', 'Name und Adresse');

    cy.get('[data-cy="chat-input"]').type('Zweiter Kunde, Teststraße 2');
    cy.get('[data-cy="chat-send"]').click();
    cy.wait('@chatSimulate');

    // Kein "Termin gespeichert"-Snackbar bei Konflikt
    cy.get('[data-cy="chat-messages"]').should('contain.text', 'bereits belegt');
    cy.get('.mat-mdc-snack-bar-container').should('not.exist');

    // Dashboard zeigt weiterhin nur den ursprünglichen Termin
    cy.loginAndVisit('/dashboard', session);
    cy.wait('@getAppointments');

    cy.get('[data-cy="stat-total"]').should('contain.text', '1');
    cy.get('[data-cy="appointments-table"]').should('contain.text', 'Erster Kunde');
    cy.get('[data-cy="appointments-table"]').should('not.contain.text', 'Zweiter Kunde');
  });

  it('erster Termin wird korrekt gespeichert (kein Konflikt)', () => {
    // Normale Buchung ohne Konflikt
    const normalReplies = [
      { reply: 'Für wann soll der Termin sein?', appointmentSaved: false },
      { reply: 'Wie lautet Ihr Name und Adresse?', appointmentSaved: false },
      {
        reply: 'Super! Ihr Termin wurde bestätigt.',
        appointmentSaved: true,
      },
    ];

    let callIndex = 0;
    cy.intercept('POST', '**/api/chat/simulate', (req) => {
      const reply = normalReplies[callIndex] ?? normalReplies[normalReplies.length - 1];
      callIndex++;
      req.reply({ statusCode: 200, body: reply });
    }).as('chatSimulate');

    cy.intercept('GET', `**/api/tenants/${TENANT_ID}/appointments`, {
      statusCode: 200,
      body: [existingAppointment],
    }).as('getAppointments');

    cy.loginAndVisit('/chat', session);
    cy.wait('@getTenant');

    cy.get('[data-cy="chat-input"]').type('Ich möchte einen Termin buchen');
    cy.get('[data-cy="chat-send"]').click();
    cy.wait('@chatSimulate');

    cy.get('[data-cy="chat-input"]').type('Übermorgen um 10 Uhr');
    cy.get('[data-cy="chat-send"]').click();
    cy.wait('@chatSimulate');

    cy.get('[data-cy="chat-input"]').type('Erster Kunde, Musterstraße 1');
    cy.get('[data-cy="chat-send"]').click();
    cy.wait('@chatSimulate');

    // Termin wurde gespeichert
    cy.get('.mat-mdc-snack-bar-container').should('contain.text', '✅ Termin wurde gespeichert!');
  });
});
