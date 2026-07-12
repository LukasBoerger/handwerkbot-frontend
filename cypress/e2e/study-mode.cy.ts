// Study-Mode-Sichtbarkeit: studyMode=true (Feld im getTenant-Response) blendet
// kommerzielle Bereiche aus. Gegenprobe mit studyMode=false. Backend komplett gemockt.
// Selektoren über bestehende CSS-Klassen (keine data-cy an diesen Elementen vorhanden).

const TENANT_ID = 'tenant-cypress-study';

const session = {
  token: 'cypress-study-token',
  tenantId: TENANT_ID,
  user: { id: 'u-study', email: 'study@cypress.de', fullName: 'Study Tester' },
};

// getTenant-Mock als Fabrik: studyMode + Trial-Felder frei steuerbar.
function stubTenant(extra: Record<string, unknown>) {
  cy.intercept('GET', `**/api/tenants/${TENANT_ID}`, {
    statusCode: 200,
    body: { botName: 'StudyBot', businessName: 'Study GmbH', ...extra },
  }).as('getTenant');
}

function stubAppointments(body: unknown[] = []) {
  cy.intercept('GET', `**/api/tenants/${TENANT_ID}/appointments`, {
    statusCode: 200,
    body,
  }).as('getAppointments');
}

// Settings ruft zusätzlich Billing- und Google-Status ab – abfangen, damit keine
// Fehler-Snackbars die Assertions stören.
function stubSettingsSideCalls() {
  cy.intercept('GET', '**/api/billing/status', { statusCode: 200, body: {} }).as('getBilling');
  cy.intercept('GET', '**/auth/google/status', { statusCode: 200, body: { connected: false } }).as(
    'getGoogleStatus',
  );
}

function futureIso(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  d.setHours(10, 0, 0, 0);
  return d.toISOString();
}

describe('Study-Mode: kommerzielle Bereiche ausgeblendet', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
  });

  // ── studyMode = true ────────────────────────────────────────────────────────
  describe('studyMode = true', () => {
    it('Dashboard: kein Trial-Banner (weder expired noch warning)', () => {
      stubAppointments();
      stubTenant({ studyMode: true, trialExpired: true, trialDaysLeft: 0 });
      cy.loginAndVisit('/dashboard', session);
      cy.wait('@getAppointments');

      cy.get('.trial-expired-banner').should('not.exist');
      cy.get('.trial-warning-banner').should('not.exist');
    });

    it('Settings: keine WhatsApp-, Gefahrenzone- und Google-Calendar-Card', () => {
      stubSettingsSideCalls();
      stubTenant({ studyMode: true });
      cy.loginAndVisit('/settings', session);
      cy.wait('@getTenant');

      cy.get('.whatsapp-card').should('not.exist');
      cy.get('.danger-card').should('not.exist');
      cy.get('.google-card').should('not.exist');
    });
  });

  // ── studyMode = false (Gegenprobe) ──────────────────────────────────────────
  describe('studyMode = false (Gegenprobe)', () => {
    it('Dashboard: Trial-Banner erscheint (studyMode aus, Trial abgelaufen)', () => {
      stubAppointments();
      stubTenant({ studyMode: false, trialExpired: true, trialDaysLeft: 0 });
      cy.loginAndVisit('/dashboard', session);
      cy.wait('@getAppointments');

      cy.get('.trial-expired-banner').should('be.visible');
    });

    it('Settings: WhatsApp-, Gefahrenzone- und Google-Calendar-Card sichtbar', () => {
      stubSettingsSideCalls();
      stubTenant({ studyMode: false });
      cy.loginAndVisit('/settings', session);
      cy.wait('@getTenant');

      cy.get('.whatsapp-card').should('exist');
      cy.get('.danger-card').should('exist');
      cy.get('.google-card').should('exist');
    });
  });

  // ── Ist-Zustand Studienphase (Negativ-Dokumentation) ────────────────────────
  // Diese kommerziellen Elemente existieren aktuell in KEINEM Modus:
  //  - Preise-Link ist im Navbar-Template gar nicht implementiert
  //  - Umbuchen-Button wurde global entfernt (nicht studyMode-gated)
  // Daher kein studyMode-Differentiator – nur der Ist-Zustand wird abgesichert.
  // Revert/Anpassung nach Abschluss der Studie.
  describe('Nicht (mehr) vorhandene kommerzielle Elemente', () => {
    it('Navbar enthält keinen Preise-Link – in beiden Modi', () => {
      stubAppointments();
      [true, false].forEach((mode) => {
        stubTenant({ studyMode: mode });
        cy.loginAndVisit('/dashboard', session);
        cy.get('.navbar').find('a[routerLink="/pricing"]').should('not.exist');
      });
    });

    it('Dashboard-Aktionen enthalten keinen Umbuchen-Button – in beiden Modi', () => {
      const withAppointment = [
        {
          id: 'apt-study-1',
          customerName: 'Test Kunde',
          service: 'Elektroinstallation',
          datetime: futureIso(2),
          address: 'Teststraße 1',
          status: 'confirmed',
          createdAt: new Date().toISOString(),
        },
      ];
      [true, false].forEach((mode) => {
        stubTenant({ studyMode: mode });
        stubAppointments(withAppointment);
        cy.loginAndVisit('/dashboard', session);
        cy.wait('@getAppointments');

        cy.get('.action-btn--reschedule').should('not.exist');
        cy.get('[data-cy="appointments-table"]').should('not.contain.text', 'Umbuchen');
      });
    });
  });
});
