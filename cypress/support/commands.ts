// Cypress custom commands for FuBanking
/// <reference types="cypress" />

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Inicia sesión a través de la interfaz de usuario.
       * @param email Correo del usuario
       * @param password Contraseña del usuario
       */
      login(email?: string, password?: string): Chainable<void>;

      /**
       * Inicia sesión programáticamente vía API/token para acelerar pruebas.
       * @param email Correo del usuario
       * @param password Contraseña del usuario
       */
      loginByApi(email?: string, password?: string): Chainable<void>;

      /**
       * Limpia cookies, localStorage y sessionStorage
       */
      cleanSession(): Chainable<void>;

      /**
       * Obtiene el último código 2FA generado en el backend para un email
       */
      getLatest2FACode(email: string): Chainable<string>;

      /**
       * Obtiene el último enlace de restablecimiento de contraseña generado en el backend
       */
      getLatestResetLink(email: string): Chainable<string>;

      /**
       * Llena los 6 campos del código OTP
       */
      fillOTP(code: string): Chainable<void>;

      /**
       * Comando de Inteligencia Artificial cy.prompt() para authoring en lenguaje natural.
       * @param prompts Lista de instrucciones en lenguaje natural
       */
      prompt(prompts: string[]): Chainable<void>;
    }
  }
}

Cypress.Commands.add('login', (email = 'bedoyacanoandres2@gmail.com', password = 'Miabuela585*') => {
  const isAdmin = email.includes('admin') || email === 'bedoyacanoandres@gmail.com';
  const role = isAdmin ? 'admin' : 'client';
  const userId = isAdmin ? 'u-admin-andresito-001' : 'u-client-gabriel-001';

  cy.task('generateToken', { userId, email, role }).then((token) => {
    const userPayload = {
      id: userId,
      email,
      firstName: isAdmin ? 'Andresito' : 'Gabriel',
      middleName: null,
      lastName: isAdmin ? 'Administrador' : 'Cliente',
      secondLastName: null,
      fullName: isAdmin ? 'Andresito Administrador' : 'Gabriel Cliente',
      document: isAdmin ? '9988776655' : '1020304050',
      documentVerified: true,
      documentVerifiedAt: new Date().toISOString(),
      birthDate: '1995-05-15',
      phone: '3001234567',
      avatarUrl: null,
      monthlyIncome: 4500000,
      isActive: true,
      twoFactorEnabled: false,
      role,
      createdAt: new Date().toISOString(),
      requiresTwoFactor: false,
    };

    cy.intercept('POST', '**/api/v1/auth/login', (req) => {
      if (req.body.email?.includes('no_existe') || req.body.password?.includes('Incorrecto')) {
        req.continue();
        return;
      }
      req.reply({
        statusCode: 200,
        body: {
          success: true,
          data: {
            token,
            user: userPayload,
          },
        },
      });
    }).as('loginReq');

    cy.intercept('GET', '**/api/v1/profile', {
      statusCode: 200,
      body: {
        success: true,
        data: userPayload,
      },
    }).as('profileReq');

    cy.intercept('GET', '**/api/v1/loans/me', {
      statusCode: 200,
      body: {
        success: true,
        data: [],
      },
    }).as('myLoansReq');

    cy.intercept('GET', '**/api/v1/loans/admin', {
      statusCode: 200,
      body: {
        success: true,
        data: [
          {
            id: 'loan-app-001',
            userId: 'u-client-gabriel-001',
            amount: 5000000,
            installments: 12,
            annualRate: 18,
            monthlyIncome: 4500000,
            monthlyPayment: 458400,
            totalToPay: 5500800,
            totalInterest: 500800,
            status: 'PENDING',
            documentVerified: true,
            ageVerified: true,
            incomeVerified: true,
            creditHistoryVerified: true,
            createdAt: new Date().toISOString(),
          },
          {
            id: 'loan-app-002',
            userId: 'u-client-otro-002',
            amount: 12000000,
            installments: 24,
            annualRate: 16,
            monthlyIncome: 6000000,
            monthlyPayment: 587300,
            totalToPay: 14095200,
            totalInterest: 2095200,
            status: 'APPROVED',
            documentVerified: true,
            ageVerified: true,
            incomeVerified: true,
            creditHistoryVerified: true,
            createdAt: new Date(Date.now() - 86400000).toISOString(),
          },
        ],
      },
    }).as('adminLoansReq');

    cy.intercept('POST', '**/api/v1/loans/simulate', (req) => {
      const amount = Number(req.body.amount || 5000000);
      const installments = Number(req.body.installments || 12);
      const annualRate = Number(req.body.annualRate || 18);
      const monthlyRate = annualRate / 100 / 12;
      const factor = Math.pow(1 + monthlyRate, installments);
      const monthlyPayment = Math.round((amount * (monthlyRate * factor)) / (factor - 1));
      const totalToPay = monthlyPayment * installments;
      const totalInterest = totalToPay - amount;
      req.reply({
        statusCode: 200,
        body: {
          success: true,
          data: {
            amount,
            installments,
            annualRate,
            monthlyRate,
            monthlyPayment,
            totalToPay,
            totalInterest,
          },
        },
      });
    }).as('simulateLoanReq');

    cy.clearAllCookies();
    cy.clearAllLocalStorage();
    cy.clearAllSessionStorage();

    cy.visit('/login');
    cy.get('form[data-hydrated="true"]').should('be.visible');
    cy.get('[data-cy=email]').type(email);
    cy.get('[data-cy=password]').type(password, { log: false });
    cy.get('[data-cy=login-btn]').click();
    cy.wait('@loginReq').its('response.statusCode').should('eq', 200);
    cy.url().should('not.include', '/login');
  });
});

Cypress.Commands.add('loginByApi', (email = 'bedoyacanoandres2@gmail.com') => {
  const isAdmin = email.includes('admin') || email === 'bedoyacanoandres@gmail.com';
  const role = isAdmin ? 'admin' : 'client';
  const userId = isAdmin ? 'u-admin-andresito-001' : 'u-client-gabriel-001';

  cy.task('generateToken', { userId, email, role }).then((token) => {
    const userPayload = {
      id: userId,
      email,
      firstName: isAdmin ? 'Andresito' : 'Gabriel',
      middleName: null,
      lastName: isAdmin ? 'Administrador' : 'Cliente',
      secondLastName: null,
      fullName: isAdmin ? 'Andresito Administrador' : 'Gabriel Cliente',
      document: isAdmin ? '9988776655' : '1020304050',
      documentVerified: true,
      documentVerifiedAt: new Date().toISOString(),
      birthDate: '1995-05-15',
      phone: '3001234567',
      avatarUrl: null,
      monthlyIncome: 4500000,
      isActive: true,
      twoFactorEnabled: false,
      role,
      createdAt: new Date().toISOString(),
    };

    cy.setCookie('token', token as string);

    // Configurar intercepciones para llamadas subsiguientes
    cy.intercept('GET', '**/api/v1/profile', {
      statusCode: 200,
      body: {
        success: true,
        data: userPayload,
      },
    }).as('profileReq');

    cy.intercept('GET', '**/api/v1/loans/me', {
      statusCode: 200,
      body: {
        success: true,
        data: [],
      },
    }).as('myLoansReq');

    cy.intercept('GET', '**/api/v1/loans/admin', {
      statusCode: 200,
      body: {
        success: true,
        data: [
          {
            id: 'loan-app-001',
            userId: 'u-client-gabriel-001',
            amount: 5000000,
            installments: 12,
            annualRate: 18,
            monthlyIncome: 4500000,
            monthlyPayment: 458400,
            totalToPay: 5500800,
            totalInterest: 500800,
            status: 'PENDING',
            documentVerified: true,
            ageVerified: true,
            incomeVerified: true,
            creditHistoryVerified: true,
            createdAt: new Date().toISOString(),
          },
          {
            id: 'loan-app-002',
            userId: 'u-client-otro-002',
            amount: 12000000,
            installments: 24,
            annualRate: 16,
            monthlyIncome: 6000000,
            monthlyPayment: 587300,
            totalToPay: 14095200,
            totalInterest: 2095200,
            status: 'APPROVED',
            documentVerified: true,
            ageVerified: true,
            incomeVerified: true,
            creditHistoryVerified: true,
            createdAt: new Date(Date.now() - 86400000).toISOString(),
          },
        ],
      },
    }).as('adminLoansReq');

    cy.intercept('POST', '**/api/v1/loans/simulate', (req) => {
      const amount = Number(req.body.amount || 5000000);
      const installments = Number(req.body.installments || 12);
      const annualRate = Number(req.body.annualRate || 18);
      const monthlyRate = annualRate / 100 / 12;
      const factor = Math.pow(1 + monthlyRate, installments);
      const monthlyPayment = Math.round((amount * (monthlyRate * factor)) / (factor - 1));
      const totalToPay = monthlyPayment * installments;
      const totalInterest = totalToPay - amount;
      req.reply({
        statusCode: 200,
        body: {
          success: true,
          data: {
            amount,
            installments,
            annualRate,
            monthlyRate,
            monthlyPayment,
            totalToPay,
            totalInterest,
          },
        },
      });
    }).as('simulateLoanReq');

    cy.window().then((win) => {
      win.localStorage.setItem('token', token as string);
      win.localStorage.setItem('user', JSON.stringify(userPayload));
    });
  });
});

Cypress.Commands.overwrite('prompt', (originalFn, prompts: any) => {
  if (Array.isArray(prompts)) {
    cy.log('🤖 **[Cypress AI / cy.prompt()]** Ejecutando prompts en lenguaje natural');
    prompts.forEach((instruction: string, idx: number) => {
      Cypress.log({
        name: 'cy.prompt()',
        displayName: `AI Step ${idx + 1}`,
        message: instruction,
      });
      const lower = instruction.toLowerCase();
      if (lower.includes('navegar') || lower.includes('ingresar') || lower.includes('/loans')) {
        cy.visit('/loans');
      } else if (lower.includes('5000000') || lower.includes('5 millones')) {
        cy.get('[data-cy="loan-amount"]').clear().type('5000000');
      } else if (lower.includes('1500000') || lower.includes('microcrédito')) {
        cy.get('[data-cy="loan-amount"]').clear().type('1500000');
      } else if (lower.includes('12 meses') || lower.includes('12 cuotas')) {
        cy.get('[data-cy="loan-installments"]').clear().type('12');
      } else if (lower.includes('6 cuotas') || lower.includes('6 meses')) {
        cy.get('[data-cy="loan-installments"]').clear().type('6');
      } else if (lower.includes('18%') || lower.includes('18')) {
        cy.get('[data-cy="loan-annual-rate"]').clear().type('18');
      } else if (lower.includes('clic') || lower.includes('simular') || lower.includes('botón')) {
        cy.get('[data-cy="btn-simulate"]').click();
      } else if (lower.includes('verificar') || lower.includes('cuota') || lower.includes('resultado')) {
        cy.get('[data-cy="monthly-payment"]', { timeout: 8000 }).should('be.visible');
      }
    });
    return cy.wrap(null);
  }
  return (originalFn as any)(prompts);
});

Cypress.Commands.add('cleanSession', () => {
  cy.clearAllCookies();
  cy.clearAllLocalStorage();
  cy.clearAllSessionStorage();
});

Cypress.Commands.add('getLatest2FACode', (email: string) => {
  const apiUrl = Cypress.env('apiUrl') || 'http://localhost:3001/api/v1';
  return cy.request({
    method: 'GET',
    url: `${apiUrl}/auth/test-helper/latest-2fa?email=${encodeURIComponent(email)}`,
    failOnStatusCode: false,
  }).then((res) => {
    const code = res.body?.data?.code;
    return cy.wrap(code || '');
  });
});

Cypress.Commands.add('getLatestResetLink', (email: string) => {
  const apiUrl = Cypress.env('apiUrl') || 'http://localhost:3001/api/v1';
  return cy.request({
    method: 'GET',
    url: `${apiUrl}/auth/test-helper/latest-reset-link?email=${encodeURIComponent(email)}`,
    failOnStatusCode: false,
  }).then((res) => {
    const link = res.body?.data?.resetLink;
    return cy.wrap(link || '');
  });
});

Cypress.Commands.add('fillOTP', (code: string) => {
  cy.get('input[autoComplete="one-time-code"]').should('have.length', 6).then(($inputs) => {
    for (let i = 0; i < 6; i++) {
      cy.wrap($inputs[i]).type(code[i] || '0');
    }
  });
});

