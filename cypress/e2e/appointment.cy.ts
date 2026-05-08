describe('Termin anlegen via Chat und im Dashboard prüfen', () => {
  const TENANT_ID = 'tenant-cypress-test';

  // ── Zentrale Testdaten: Chat-Eingabe, API-Mock und Dashboard-Prüfung ────────
  // Alle Felder müssen übereinstimmen – Änderungen hier wirken sich überall aus
  const CUSTOMER_NAME = 'Max Müller';
  const SERVICE       = 'Elektroinstallation';
  const ADDRESS       = 'Hauptstraße 1, 59425 Unna';

  // "Morgen um 10 Uhr" als exakter Zeitstempel – entspricht der Chat-Eingabe
  const appointmentDate = new Date();
  appointmentDate.setDate(appointmentDate.getDate() + 1);
  appointmentDate.setHours(10, 0, 0, 0);

  // Erwartete Datumsanzeige im Dashboard: Angular DatePipe 'dd.MM.yyyy HH:mm'
  const dd   = String(appointmentDate.getDate()).padStart(2, '0');
  const mo   = String(appointmentDate.getMonth() + 1).padStart(2, '0');
  const yyyy = appointmentDate.getFullYear();
  const EXPECTED_DATE_DISPLAY = `${dd}.${mo}.${yyyy} 10:00`;

  // Mock-Appointment: exakt die Daten aus den Chat-Nachrichten
  const testAppointment = {
    id: 'apt-cypress-1',
    customerName: CUSTOMER_NAME,
    service:      SERVICE,
    datetime:     appointmentDate.toISOString(),
    address:      ADDRESS,
    status:       'confirmed',
    createdAt:    new Date().toISOString(),
  };

  const session = {
    token:    'cypress-test-token',
    tenantId: TENANT_ID,
    user:     { id: 'u1', email: 'test@cypress.de', fullName: 'Cypress Tester' },
  };

  // Bot-Antworten für genau 3 Chat-Nachrichten
  const chatReplies = [
    { reply: 'Gerne! Für wann soll der Termin sein?',   appointmentSaved: false },
    { reply: 'Wie lautet Ihr Name und Adresse?',         appointmentSaved: false },
    {
      reply: `Super! Ihr Termin für ${SERVICE} am ${dd}.${mo}.${yyyy} um 10:00 Uhr wurde bestätigt.`,
      appointmentSaved: true,
    },
  ];

  beforeEach(() => {
    cy.clearLocalStorage();

    cy.intercept('GET', `**/api/tenants/${TENANT_ID}`, {
      statusCode: 200,
      body: { botName: 'TestBot', welcomeMessage: 'Hallo! Wie kann ich Ihnen helfen?' },
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

  it('legt einen Termin via Chat an und prüft ihn im Dashboard', () => {
    // ── Chat öffnen ──────────────────────────────────────────────────────────
    cy.visit('/chat', {
      onBeforeLoad(win) {
        win.localStorage.setItem('token',    session.token);
        win.localStorage.setItem('tenantId', session.tenantId);
        win.localStorage.setItem('setupDone', 'true');
        win.localStorage.setItem('user',     JSON.stringify(session.user));
      },
    });

    cy.wait('@getTenant');
    cy.get('[data-cy="chat-messages"]').should('contain.text', 'Hallo!');

    // ── Nachricht 1: Leistungswunsch → API erhält tenantId + Service ─────────
    cy.get('[data-cy="chat-input"]')
      .should('not.be.disabled')
      .type(`Ich möchte einen Termin für ${SERVICE} buchen`);
    cy.get('[data-cy="chat-send"]').click();

    cy.wait('@chatSimulate').its('request.body').should('deep.include', {
      tenantId: TENANT_ID,
      message: `Ich möchte einen Termin für ${SERVICE} buchen`,
    });

    cy.get('[data-cy="chat-input"]').should('not.be.disabled');
    cy.get('[data-cy="chat-messages"]').should('contain.text', 'Für wann soll');

    // ── Nachricht 2: Datum → API erhält tenantId + Datumseingabe ────────────
    cy.get('[data-cy="chat-input"]').type('Morgen um 10 Uhr');
    cy.get('[data-cy="chat-send"]').click();

    cy.wait('@chatSimulate').its('request.body').should('deep.include', {
      tenantId: TENANT_ID,
      message: 'Morgen um 10 Uhr',
    });

    cy.get('[data-cy="chat-input"]').should('not.be.disabled');
    cy.get('[data-cy="chat-messages"]').should('contain.text', 'Name und Adresse');

    // ── Nachricht 3: Name + Adresse → API erhält tenantId + Kundendaten ──────
    cy.get('[data-cy="chat-input"]').type(`${CUSTOMER_NAME}, ${ADDRESS}`);
    cy.get('[data-cy="chat-send"]').click();

    cy.wait('@chatSimulate').its('request.body').should('deep.include', {
      tenantId: TENANT_ID,
      message: `${CUSTOMER_NAME}, ${ADDRESS}`,
    });

    // Snackbar bestätigt gespeicherten Termin
    cy.get('.mat-mdc-snack-bar-container').should('contain.text', '✅ Termin wurde gespeichert!');

    // ── Dashboard: alle Terminfelder gegen die gesendeten Chat-Daten prüfen ──
    cy.visit('/dashboard', {
      onBeforeLoad(win) {
        win.localStorage.setItem('token',    session.token);
        win.localStorage.setItem('tenantId', session.tenantId);
        win.localStorage.setItem('setupDone', 'true');
        win.localStorage.setItem('user',     JSON.stringify(session.user));
      },
    });

    cy.wait('@getAppointments');
    cy.get('[data-cy="appointments-table"]').should('be.visible');

    // Jedes Feld aus den Chat-Nachrichten muss in der Tabelle erscheinen
    cy.get('[data-cy="appointments-table"]').should('contain.text', CUSTOMER_NAME);
    cy.get('[data-cy="appointments-table"]').should('contain.text', SERVICE);
    cy.get('[data-cy="appointments-table"]').should('contain.text', ADDRESS);
    cy.get('[data-cy="appointments-table"]').should('contain.text', EXPECTED_DATE_DISPLAY);
    cy.get('[data-cy="appointments-table"]').should('contain.text', '✓ Bestätigt');
  });
});
