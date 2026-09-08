// ============================================================================
// 1. SERVICIO Y ESTADO FALSO DE FRONTEND (Simulador sin mocks automáticos)
// ============================================================================

class FakeCardApiService {
  constructor() {
    this.shouldFailNetwork = false;
    this.shouldReturnCorruptedData = false;
    this.httpStatusCode = 200;
  }

  async getMyCards() {
    if (this.shouldFailNetwork) throw new Error('Network Error: Failed to fetch');
    if (this.httpStatusCode === 500) throw new Error('500 Internal Server Error');
    if (this.shouldReturnCorruptedData) return null;

    return [
      { id: 'card_1', status: 'ACTIVA', maskedPan: '4532****1234' }
    ];
  }

  async createCard(accountId) {
    if (this.shouldFailNetwork) throw new Error('Network Error');
    if (this.httpStatusCode === 400) throw new Error('Límite de tarjetas alcanzado');
    return { id: 'card_new', status: 'ACTIVA', accountId };
  }

  async toggleLock(cardId) {
    if (this.shouldFailNetwork) throw new Error('Connection timeout');
    return { id: cardId, status: 'BLOQUEADA' };
  }

  async revealDetails(cardId) {
    if (this.httpStatusCode === 403) throw new Error('No autorizado');
    if (this.shouldFailNetwork) throw new Error('Error de descifrado');
    return { cvv: '888', pan: '4532111122223333' };
  }
}

class FakeUseCardsHook {
  constructor(apiService) {
    this.api = apiService;
    this.cards = [];
    this.isLoading = false;
    this.error = null;
  }

  async fetchCards() {
    this.isLoading = true;
    this.error = null;
    try {
      const data = await this.api.getMyCards();
      if (!Array.isArray(data)) {
        throw new TypeError('Respuesta inválida: Se esperaba un Array');
      }
      this.cards = data;
    } catch (err) {
      this.cards = [];
      this.error = err.message || 'Error desconocido al cargar';
    } finally {
      this.isLoading = false;
    }
  }

  async createCard(accountId) {
    this.isLoading = true;
    this.error = null;
    try {
      const newCard = await this.api.createCard(accountId);
      this.cards.unshift(newCard);
      return newCard;
    } catch (err) {
      this.error = err.message || 'Error al crear la tarjeta';
      return null;
    } finally {
      this.isLoading = false;
    }
  }

  async toggleLock(cardId) {
    this.isLoading = true;
    this.error = null;
    try {
      const updated = await this.api.toggleLock(cardId);
      this.cards = this.cards.map((c) => (c.id === cardId ? updated : c));
    } catch (err) {
      this.error = err.message || 'Error al cambiar estado';
    } finally {
      this.isLoading = false;
    }
  }
}

// ============================================================================
// 2. PRUEBAS DE CAJA BLANCA: BÚSQUEDA DE ERRORES Y EXCEPCIONES UI
// ============================================================================

describe('Pruebas Frontend - Detección de Errores y Excepciones UI', () => {
  let fakeApi;
  let hook;

  beforeEach(() => {
    fakeApi = new FakeCardApiService();
    hook = new FakeUseCardsHook(fakeApi);
  });

  describe('fetchCards() - Detección de fallos de red y payload', () => {
    test('ERROR: Caída de red debe apagar isLoading y registrar el mensaje de error', async () => {
      fakeApi.shouldFailNetwork = true;

      await hook.fetchCards();

      expect(hook.isLoading).toBe(false);
      expect(hook.cards).toEqual([]);
      expect(hook.error).toContain('Network Error');
    });

    test('ERROR: Servidor retorna 500 Internal Server Error', async () => {
      fakeApi.httpStatusCode = 500;

      await hook.fetchCards();

      expect(hook.isLoading).toBe(false);
      expect(hook.error).toBe('500 Internal Server Error');
    });

    test('ERROR (Bug de Payload): Servidor retorna null en lugar de Array', async () => {
      fakeApi.shouldReturnCorruptedData = true;

      await hook.fetchCards();

      expect(hook.isLoading).toBe(false);
      expect(hook.cards).toEqual([]);
      expect(hook.error).toContain('Respuesta inválida');
    });
  });

  describe('createCard() - Detección de rechazos del servidor', () => {
    test('ERROR: Intento de creación con límite alcanzado (HTTP 400)', async () => {
      fakeApi.httpStatusCode = 400;

      const result = await hook.createCard('acc_full');

      expect(result).toBeNull();
      expect(hook.isLoading).toBe(false);
      expect(hook.cards.length).toBe(0);
      expect(hook.error).toBe('Límite de tarjetas alcanzado');
    });

    test('ERROR: Caída de conexión al presionar "Crear"', async () => {
      fakeApi.shouldFailNetwork = true;

      const result = await hook.createCard('acc_1');

      expect(result).toBeNull();
      expect(hook.isLoading).toBe(false);
      expect(hook.error).toBe('Network Error');
    });
  });

  describe('toggleLock() - Fallos de sincronización de estado', () => {
    test('ERROR: Fallo de red durante el bloqueo debe mantener el estado previo de la tarjeta', async () => {
      hook.cards = [{ id: 'card_1', status: 'ACTIVA' }];
      fakeApi.shouldFailNetwork = true;

      await hook.toggleLock('card_1');

      expect(hook.isLoading).toBe(false);
      expect(hook.cards[0].status).toBe('ACTIVA');
      expect(hook.error).toBe('Connection timeout');
    });
  });

  describe('handleRevealSensitiveData() - Seguridad y Excepciones UI', () => {
    test('ERROR: Usuario no autorizado tratando de revelar CVV (HTTP 403)', async () => {
      fakeApi.httpStatusCode = 403;
      let uiState = { showData: false, sensitiveData: null, errorMsg: null };

      try {
        await fakeApi.revealDetails('card_1');
      } catch (err) {
        uiState.errorMsg = err.message;
        uiState.showData = false;
      }

      expect(uiState.showData).toBe(false);
      expect(uiState.sensitiveData).toBeNull();
      expect(uiState.errorMsg).toBe('No autorizado');
    });
  });
}); 

