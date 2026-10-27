describe('API de Créditos: simulación, validación matemática y seguridad', () => {
  const apiUrl = Cypress.env('apiUrl') || 'http://localhost:3001/api/v1';
  let clientToken = '';
  let adminToken = '';

  before(() => {
    // Generar tokens JWT firmados válidamente por el backend para pruebas directas de API
    cy.task<string>('generateToken', {
      userId: 'u-client-gabriel-001',
      email: 'bedoyacanoandres2@gmail.com',
      role: 'client',
    }).then((token) => {
      clientToken = token;
    });

    cy.task<string>('generateToken', {
      userId: 'u-admin-andresito-001',
      email: 'bedoyacanoandres@gmail.com',
      role: 'admin',
    }).then((token) => {
      adminToken = token;
    });
  });

  it('calcula la simulación de un préstamo válido correctamente en el backend (HTTP 200)', () => {
    cy.request({
      method: 'POST',
      url: `${apiUrl}/loans/simulate`,
      headers: { Authorization: `Bearer ${clientToken}` },
      body: {
        amount: 3000000,
        installments: 12,
        annualRate: 15,
      },
    }).then(({ status, body }) => {
      expect(status).to.eq(200);
      expect(body.success).to.be.true;
      expect(body.data).to.have.property('monthlyPayment');
      expect(body.data).to.have.property('totalToPay');
      expect(body.data).to.have.property('totalInterest');
      expect(body.data.monthlyPayment).to.be.greaterThan(0);
      expect(body.data.totalToPay).to.be.greaterThan(3000000);
      expect(body.data.totalInterest).to.be.greaterThan(0);
    });
  });

  it('rechaza montos inválidos o negativos (HTTP 400)', () => {
    cy.request({
      method: 'POST',
      url: `${apiUrl}/loans/simulate`,
      headers: { Authorization: `Bearer ${clientToken}` },
      body: {
        amount: -500000,
        installments: 12,
        annualRate: 15,
      },
      failOnStatusCode: false,
    }).then(({ status, body }) => {
      expect(status).to.eq(400);
      expect(body.success).to.be.false;
    });
  });

  it('rechaza número de cuotas en cero o negativas (HTTP 400)', () => {
    cy.request({
      method: 'POST',
      url: `${apiUrl}/loans/simulate`,
      headers: { Authorization: `Bearer ${clientToken}` },
      body: {
        amount: 1000000,
        installments: 0,
        annualRate: 15,
      },
      failOnStatusCode: false,
    }).then(({ status, body }) => {
      expect(status).to.eq(400);
      expect(body.success).to.be.false;
    });
  });

  it('rechaza simulación sin cabecera de autenticación (HTTP 401)', () => {
    cy.request({
      method: 'POST',
      url: `${apiUrl}/loans/simulate`,
      body: {
        amount: 1000000,
        installments: 6,
        annualRate: 18,
      },
      failOnStatusCode: false,
    }).then(({ status }) => {
      expect(status).to.eq(401);
    });
  });

  it('rechaza token JWT con firma alterada o corrupta (HTTP 401)', () => {
    cy.request({
      method: 'POST',
      url: `${apiUrl}/loans/simulate`,
      headers: { Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.tokenInvalido.firmaErronea' },
      body: {
        amount: 1000000,
        installments: 6,
        annualRate: 18,
      },
      failOnStatusCode: false,
    }).then(({ status }) => {
      expect(status).to.eq(401);
    });
  });
});
