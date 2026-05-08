// Eigene Cypress-Befehle können hier registriert werden
// Beispiel: cy.login(), cy.seedDatabase(), etc.

export {};

declare global {
  namespace Cypress {
    interface Chainable {
      // Hier können eigene Befehle typisiert werden
    }
  }
}
