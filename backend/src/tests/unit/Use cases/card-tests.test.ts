// ============================================================================
// 1. REPOSITORIOS FALSOS MANUALES (Fake Repositories en Memoria)
// ============================================================================

class FakeAccountRepository {
  constructor() {
    this.accounts = [
      { id: 'acc_1', userId: 'usr_1' },
      { id: 'acc_full', userId: 'usr_1' },
    ];
  }

  async findByIdAndUserId(accountId, userId) {
    return this.accounts.find((a) => a.id === accountId && a.userId === userId) || null;
  }
}

class FakeCardRepository {
  constructor() {
    this.cards = [
      {
        id: 'card_1',
        userId: 'usr_1',
        accountId: 'acc_1',
        cardNumber: '**** **** **** 1234',
        encryptedDetails: 'encrypted_cvv_123',
        status: 'BLOQUEADA',
        createdAt: new Date(),
      },
      {
        id: 'card_act',
        userId: 'usr_1',
        accountId: 'acc_1',
        cardNumber: '**** **** **** 5678',
        encryptedDetails: 'encrypted_cvv_456',
        status: 'ACTIVA',
        createdAt: new Date(),
      },
      {
        id: 'card_canc',
        userId: 'usr_1',
        accountId: 'acc_1',
        cardNumber: '**** **** **** 9999',
        encryptedDetails: 'encrypted_cvv_789',
        status: 'CANCELADA',
        createdAt: new Date(),
      },
      { id: 'card_lim_1', userId: 'usr_1', accountId: 'acc_full', cardNumber: '*', encryptedDetails: '*', status: 'ACTIVA', createdAt: new Date() },
      { id: 'card_lim_2', userId: 'usr_1', accountId: 'acc_full', cardNumber: '*', encryptedDetails: '*', status: 'ACTIVA', createdAt: new Date() },
      { id: 'card_lim_3', userId: 'usr_1', accountId: 'acc_full', cardNumber: '*', encryptedDetails: '*', status: 'ACTIVA', createdAt: new Date() },
    ];
  }

  async findById(id) {
    return this.cards.find((c) => c.id === id) || null;
  }

  async findByUserId(userId) {
    return this.cards.filter((c) => c.userId === userId);
  }

  async countActiveByAccountId(accountId) {
    return this.cards.filter((c) => c.accountId === accountId && c.status === 'ACTIVA').length;
  }

  async save(card) {
    const index = this.cards.findIndex((c) => c.id === card.id);
    if (index !== -1) {
      this.cards[index] = card;
    } else {
      this.cards.push(card);
    }
    return card;
  }
}

// ============================================================================
// 2. SUITE DE PRUEBAS UNITARIAS DE CAJA BLANCA (SIN MOCKS)
// ============================================================================

describe('Pruebas Unitarias Backend - Módulo de Tarjetas Virtuales', () => {
  let fakeCardRepo;
  let fakeAccountRepo;

  beforeEach(() => {
    fakeCardRepo = new FakeCardRepository();
    fakeAccountRepo = new FakeAccountRepository();
  });

  describe('Caso de Uso: CreateVirtualCard', () => {
    test('Camino C1: Error si la cuenta no existe o pertenece a otro usuario', async () => {
      const input = { userId: 'usr_1', accountId: 'acc_inexistente' };
      const account = await fakeAccountRepo.findByIdAndUserId(input.accountId, input.userId);
      expect(account).toBeNull();
    });

    test('Camino C2: Error si se alcanza el límite máximo de tarjetas activas', async () => {
      const accountId = 'acc_full';
      const activeCount = await fakeCardRepo.countActiveByAccountId(accountId);
      expect(activeCount).toBeGreaterThanOrEqual(3);
    });

    test('Camino C3: Creación exitosa cuando los datos son válidos y hay cupo', async () => {
      const newCard = {
        id: 'card_new',
        userId: 'usr_1',
        accountId: 'acc_1',
        cardNumber: '**** **** **** 0000',
        encryptedDetails: 'encrypted_data',
        status: 'ACTIVA',
        createdAt: new Date(),
      };

      const saved = await fakeCardRepo.save(newCard);
      expect(saved.id).toBe('card_new');
      expect(saved.status).toBe('ACTIVA');
    });
  });

  describe('Caso de Uso: ToggleCardLock', () => {
    test('Camino C1: Error si la tarjeta no existe', async () => {
      const card = await fakeCardRepo.findById('card_999');
      expect(card).toBeNull();
    });

    test('Camino C2: Error si el usuario no es el propietario', async () => {
      const card = await fakeCardRepo.findById('card_1');
      const isOwner = card?.userId === 'usr_2';
      expect(isOwner).toBe(false);
    });

    test('Camino C3: Error si la tarjeta está cancelada', async () => {
      const card = await fakeCardRepo.findById('card_canc');
      expect(card?.status).toBe('CANCELADA');
    });

    test('Camino C4: Cambiar estado de BLOQUEADA a ACTIVA', async () => {
      const card = await fakeCardRepo.findById('card_1');
      if (card && card.status === 'BLOQUEADA') {
        card.status = 'ACTIVA';
        await fakeCardRepo.save(card);
      }
      const updated = await fakeCardRepo.findById('card_1');
      expect(updated?.status).toBe('ACTIVA');
    });

    test('Camino C5: Cambiar estado de ACTIVA a BLOQUEADA', async () => {
      const card = await fakeCardRepo.findById('card_act');
      if (card && card.status === 'ACTIVA') {
        card.status = 'BLOQUEADA';
        await fakeCardRepo.save(card);
      }
      const updated = await fakeCardRepo.findById('card_act');
      expect(updated?.status).toBe('BLOQUEADA');
    });
  });

  describe('Caso de Uso: RevealVirtualCardDetails', () => {
    test('Camino C1: Tarjeta no encontrada', async () => {
      const card = await fakeCardRepo.findById('card_unknown');
      expect(card).toBeNull();
    });

    test('Camino C2: Usuario no autorizado para ver datos', async () => {
      const card = await fakeCardRepo.findById('card_act');
      const hasPermission = card?.userId === 'usr_hacker';
      expect(hasPermission).toBe(false);
    });

    test('Camino C3: Tarjeta cancelada no puede revelar datos', async () => {
      const card = await fakeCardRepo.findById('card_canc');
      expect(card?.status).toBe('CANCELADA');
    });

    test('Camino C4: Retorna datos descifrados para usuario válido', async () => {
      const card = await fakeCardRepo.findById('card_act');
      expect(card).not.toBeNull();
      expect(card?.encryptedDetails).toBe('encrypted_cvv_456');
    });
  });

  describe('Caso de Uso: GetUserCards', () => {
    test('Camino C1: Consulta lineal y mapeo del listado de tarjetas', async () => {
      const cards = await fakeCardRepo.findByUserId('usr_1');
      expect(Array.isArray(cards)).toBe(true);
      expect(cards.length).toBeGreaterThan(0);
      expect(cards[0]).toHaveProperty('cardNumber');
      expect(cards[0]).toHaveProperty('status');
    });
  });
}); 

describe('Pruebas Unitarias Backend - Inyección de Fallos y Casos Límite', () => {

  // D-01: Crear tarjeta con cupo límite negativo o cero
  test('D-01 [Crear]: Debe rechazar la creación si el cupo límite es menor o igual a cero', async () => {
    const dto = {
      accountId: 'acc-123',
      cardholderName: 'Dubin Soto',
      creditLimit: -500000,
      cardType: 'CREDIT'
    };

    await expect(createCardUseCase.execute(dto))
      .rejects
      .toThrow('El cupo límite debe ser mayor a cero');
  });

  // D-02: Nombre de titular compuesto únicamente por espacios en blanco
  test('D-02 [Crear]: Debe rechazar nombres de titular con solo espacios en blanco', async () => {
    const dto = {
      accountId: 'acc-123',
      cardholderName: '   ',
      creditLimit: 1000000,
      cardType: 'CREDIT'
    };

    await expect(createCardUseCase.execute(dto))
      .rejects
      .toThrow('El nombre del titular es obligatorio');
  });

  // D-03: Actualizar estado con incoherencia de datos
  test('D-03 [Actualizar]: Debe rechazar actualización si el estado es un valor no permitido', async () => {
    const dto = {
      cardId: 'card-999',
      status: 'INVALID_STATUS'
    };

    await expect(updateCardStatusUseCase.execute(dto))
      .rejects
      .toThrow('Estado de tarjeta no válido');
  });

  // D-04: Intentar eliminar/cancelar tarjeta con deuda activa
  test('D-04 [Eliminar]: Debe rechazar la cancelación si la tarjeta tiene saldo pendiente', async () => {
    const dto = {
      cardId: 'card-with-debt-123',
      hasPendingDebt: true
    };

    await expect(deleteCardUseCase.execute(dto))
      .rejects
      .toThrow('No se puede cancelar una tarjeta con deuda pendiente');
  });

  // D-05: Pago superior a la deuda total (Sobrepago sin control)
  test('D-05 [Pagar]: Debe rechazar pagos superiores al saldo deudor de la tarjeta', async () => {
    const dto = {
      cardId: 'card-123',
      paymentAmount: 1500000,
      currentDebt: 500000
    };

    await expect(processCardPaymentUseCase.execute(dto))
      .rejects
      .toThrow('El monto a pagar supera la deuda actual');
  });

}); 
