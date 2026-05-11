export interface CypressSession {
  token: string;
  tenantId: string;
  user: { id: string; email: string; fullName: string };
}

/**
 * Besucht eine URL und setzt die Session-Daten im localStorage,
 * bevor Angular initialisiert wird (via onBeforeLoad).
 */
Cypress.Commands.add('loginAndVisit', (url: string, session: CypressSession) => {
  cy.visit(url, {
    onBeforeLoad(win) {
      win.localStorage.setItem('token', session.token);
      win.localStorage.setItem('tenantId', session.tenantId);
      win.localStorage.setItem('setupDone', 'true');
      win.localStorage.setItem('user', JSON.stringify(session.user));
    },
  });
});

declare global {
  namespace Cypress {
    interface Chainable {
      loginAndVisit(url: string, session: CypressSession): Chainable<void>;
    }
  }
}
