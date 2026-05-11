// Dashboard: Statistiken, Filter-Tabs, Terminaktionen (Absagen/Umbuchen/Wiederherstellen)
// Alle Tests laufen ohne Google Calendar – kein extern er Dienst wird aufgerufen.

const TENANT_ID = 'tenant-cypress-test';

const session = {
  token: 'cypress-test-token',
  tenantId: TENANT_ID,
  user: { id: 'u1', email: 'test@cypress.de', fullName: 'Cypress Tester' },
};

function futureIso(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  d.setHours(10, 0, 0, 0);
  return d.toISOString();
}

const appointments = [
  {
    id: 'apt-confirmed-1',
    customerName: 'Hans Müller',
    service: 'Elektroinstallation',
    phoneNumber: '+49 151 12345678',
    datetime: futureIso(2),
    address: 'Hauptstraße 1',
    status: 'confirmed',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'apt-pending-1',
    customerName: 'Maria Schmidt',
    service: 'Heizungswartung',
    phoneNumber: '+49 152 87654321',
    datetime: futureIso(3),
    address: 'Nebenstraße 2',
    status: 'pending',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'apt-cancelled-1',
    customerName: 'Karl Weber',
    service: 'Rohrbruch',
    phoneNumber: '+49 153 11223344',
    datetime: futureIso(4),
    address: 'Querstraße 3',
    status: 'cancelled',
    createdAt: new Date().toISOString(),
  },
];

describe('Dashboard – Statistiken und Filter', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.intercept('GET', `**/api/tenants/${TENANT_ID}/appointments`, {
      statusCode: 200,
      body: appointments,
    }).as('getAppointments');

    cy.loginAndVisit('/dashboard', session);
    cy.wait('@getAppointments');
  });

  // ── Statistik-Karten ──────────────────────────────────────────────────────

  it('zeigt die Gesamtanzahl aller Termine', () => {
    cy.get('[data-cy="stat-total"]').should('contain.text', '3');
  });

  it('zählt confirmed und pending als offen/bevorstehend', () => {
    cy.get('[data-cy="stat-upcoming"]').should('contain.text', '2');
  });

  // ── Filter-Tabs ───────────────────────────────────────────────────────────

  it('zeigt alle drei Termine beim "Alle"-Filter', () => {
    cy.get('[data-cy="appointments-table"]').should('contain.text', 'Hans Müller');
    cy.get('[data-cy="appointments-table"]').should('contain.text', 'Maria Schmidt');
    cy.get('[data-cy="appointments-table"]').should('contain.text', 'Karl Weber');
  });

  it('filtert auf bestätigte Termine', () => {
    cy.get('[data-cy="filter-confirmed"]').click();
    cy.get('[data-cy="appointments-table"]').should('contain.text', 'Hans Müller');
    cy.get('[data-cy="appointments-table"]').should('not.contain.text', 'Maria Schmidt');
    cy.get('[data-cy="appointments-table"]').should('not.contain.text', 'Karl Weber');
  });

  it('filtert auf ausstehende Termine', () => {
    cy.get('[data-cy="filter-pending"]').click();
    cy.get('[data-cy="appointments-table"]').should('contain.text', 'Maria Schmidt');
    cy.get('[data-cy="appointments-table"]').should('not.contain.text', 'Hans Müller');
  });

  it('filtert auf abgesagte Termine', () => {
    cy.get('[data-cy="filter-cancelled"]').click();
    cy.get('[data-cy="appointments-table"]').should('contain.text', 'Karl Weber');
    cy.get('[data-cy="appointments-table"]').should('not.contain.text', 'Hans Müller');
  });

  it('zeigt Empty-State wenn kein umgebuchter Termin vorhanden', () => {
    cy.get('[data-cy="filter-rescheduled"]').click();
    cy.get('[data-cy="appointments-empty"]').should('be.visible');
    cy.get('[data-cy="appointments-empty"]').should('contain.text', 'umgebucht');
  });

  it('zeigt Telefonnummer in der Kundenzelle', () => {
    cy.get('[data-cy="appointments-table"]').should('contain.text', '+49 151 12345678');
  });
});

describe('Dashboard – Termin absagen', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.intercept('GET', `**/api/tenants/${TENANT_ID}/appointments`, {
      statusCode: 200,
      body: appointments,
    }).as('getAppointments');

    cy.loginAndVisit('/dashboard', session);
    cy.wait('@getAppointments');
  });

  it('setzt Status auf "cancelled" und zeigt korrektes Badge', () => {
    cy.intercept('PATCH', `**/api/tenants/${TENANT_ID}/appointments/apt-confirmed-1/status`, {
      statusCode: 200,
      body: { ...appointments[0], status: 'cancelled' },
    }).as('cancelApt');

    cy.get('[data-cy="btn-cancel-apt-confirmed-1"]').click();
    cy.wait('@cancelApt');

    cy.get('[data-cy="apt-row-apt-confirmed-1"] .status-badge')
      .should('contain.text', '✕ Abgesagt');
  });

  it('zeigt nach dem Absagen den Wiederherstellen-Button', () => {
    cy.intercept('PATCH', `**/api/tenants/${TENANT_ID}/appointments/apt-confirmed-1/status`, {
      statusCode: 200,
      body: { ...appointments[0], status: 'cancelled' },
    }).as('cancelApt');

    cy.get('[data-cy="btn-cancel-apt-confirmed-1"]').click();
    cy.wait('@cancelApt');

    cy.get('[data-cy="btn-restore-apt-confirmed-1"]').should('exist');
  });

  it('kann einen pending-Termin ebenfalls absagen', () => {
    cy.intercept('PATCH', `**/api/tenants/${TENANT_ID}/appointments/apt-pending-1/status`, {
      statusCode: 200,
      body: { ...appointments[1], status: 'cancelled' },
    }).as('cancelPending');

    cy.get('[data-cy="btn-cancel-apt-pending-1"]').click();
    cy.wait('@cancelPending');

    cy.get('[data-cy="apt-row-apt-pending-1"] .status-badge')
      .should('contain.text', '✕ Abgesagt');
  });
});

describe('Dashboard – Termin umbuchen', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.intercept('GET', `**/api/tenants/${TENANT_ID}/appointments`, {
      statusCode: 200,
      body: appointments,
    }).as('getAppointments');

    cy.loginAndVisit('/dashboard', session);
    cy.wait('@getAppointments');
  });

  it('setzt Status auf "rescheduled" und zeigt korrektes Badge', () => {
    cy.intercept('PATCH', `**/api/tenants/${TENANT_ID}/appointments/apt-confirmed-1/status`, {
      statusCode: 200,
      body: { ...appointments[0], status: 'rescheduled' },
    }).as('rescheduleApt');

    cy.get('[data-cy="btn-reschedule-apt-confirmed-1"]').click();
    cy.wait('@rescheduleApt');

    cy.get('[data-cy="apt-row-apt-confirmed-1"] .status-badge')
      .should('contain.text', '↺ Umgebucht');
  });

  it('zeigt nach dem Umbuchen den Bestätigen-Button', () => {
    cy.intercept('PATCH', `**/api/tenants/${TENANT_ID}/appointments/apt-confirmed-1/status`, {
      statusCode: 200,
      body: { ...appointments[0], status: 'rescheduled' },
    }).as('rescheduleApt');

    cy.get('[data-cy="btn-reschedule-apt-confirmed-1"]').click();
    cy.wait('@rescheduleApt');

    cy.get('[data-cy="btn-confirm-apt-confirmed-1"]').should('exist');
  });
});

describe('Dashboard – Termin wiederherstellen', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.intercept('GET', `**/api/tenants/${TENANT_ID}/appointments`, {
      statusCode: 200,
      body: appointments,
    }).as('getAppointments');

    cy.loginAndVisit('/dashboard', session);
    cy.wait('@getAppointments');
  });

  it('stellt einen abgesagten Termin auf "confirmed" zurück', () => {
    cy.intercept('PATCH', `**/api/tenants/${TENANT_ID}/appointments/apt-cancelled-1/status`, {
      statusCode: 200,
      body: { ...appointments[2], status: 'confirmed' },
    }).as('restoreApt');

    cy.get('[data-cy="btn-restore-apt-cancelled-1"]').click();
    cy.wait('@restoreApt');

    cy.get('[data-cy="apt-row-apt-cancelled-1"] .status-badge')
      .should('contain.text', '✓ Bestätigt');
  });

  it('zeigt nach der Wiederherstellung Absagen- und Umbuchen-Button', () => {
    cy.intercept('PATCH', `**/api/tenants/${TENANT_ID}/appointments/apt-cancelled-1/status`, {
      statusCode: 200,
      body: { ...appointments[2], status: 'confirmed' },
    }).as('restoreApt');

    cy.get('[data-cy="btn-restore-apt-cancelled-1"]').click();
    cy.wait('@restoreApt');

    cy.get('[data-cy="btn-cancel-apt-cancelled-1"]').should('exist');
    cy.get('[data-cy="btn-reschedule-apt-cancelled-1"]').should('exist');
  });
});
