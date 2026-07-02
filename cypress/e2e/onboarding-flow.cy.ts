describe('Onboarding Flow', () => {

  beforeEach(() => {
    // Auth-Token setzen, damit der authGuard /setup rendert
    // (gleiches Muster wie der bestehende "Betriebsname"-Test).
    // Nur Token, keine tenantId: so überspringt ngOnInit den Tenant-Load.
    cy.window().then((win) => {
      win.localStorage.setItem('token', 'cypress-test-token');
    });
  });

  it('sollte nach Login den Setup-Wizard anzeigen', () => {
    cy.visit('/login');
    cy.get('input[type="email"]').type('test@example.com');
    cy.get('input[type="password"]').type('password123');
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/setup');
  });

  it('sollte Betriebsname vorausgefüllt haben', () => {
    // Setup: localStorage mit tenantId und token setzen
    cy.window().then(win => {
      win.localStorage.setItem('token', 'test-token');
      win.localStorage.setItem('tenantId', '1');
    });
    // Mock API Response
    cy.intercept('GET', '/api/tenants/1', {
      statusCode: 200,
      body: {
        businessName: 'Elektro Test GmbH',
        businessOwner: 'Max Mustermann',
        businessEmail: 'test@test.de',
        botName: 'KommuvoBot'
      }
    });
    cy.visit('/setup');
    cy.get('input[formControlName="businessName"]')
      .should('have.value', 'Elektro Test GmbH');
  });

  it('sollte Fehlermeldung zeigen wenn keine Leistung gewählt', () => {
    cy.visit('/setup');
    // Schritt 1 Felder ausfüllen außer Leistungen
    cy.get('input[formControlName="businessName"]').type('Test GmbH');
    cy.get('input[formControlName="businessOwner"]').type('Max Test');
    cy.get('input[formControlName="businessEmail"]').type('test@test.de');
    // Weiter klicken ohne Leistung
    cy.contains('button', 'Weiter').click();
    cy.contains('mindestens eine Leistung').should('be.visible');
  });

});
