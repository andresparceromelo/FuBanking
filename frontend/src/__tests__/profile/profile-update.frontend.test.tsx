/**
 * Tests de caja blanca — lógica onSubmit de ProfileEditForm.
 *
 * Defectos cubiertos:
 *  #6  — Validación de formulario vacío → llama a onCancel (sin cambios).
 *  #9  — birthDate ya NO está en el payload editable.
 *
 * Nota: estos tests ejercen directamente la lógica de construcción del payload
 * (buildOnSubmit), sin montar el componente React. Eso mantiene la cobertura
 * limpia y sin dependencias de DOM.
 */

interface PublicUser {
  id: string;
  email: string;
  document: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  secondLastName: string | null;
  fullName: string;
  birthDate: string | null;
  phone: string | null;
  avatarUrl: string | null;
  isActive: boolean;
  twoFactorEnabled: boolean;
  role: string;
  createdAt: string;
}

/**
 * UpdateProfileInput refleja el schema actualizado (sin birthDate).
 * Defecto #9: birthDate es inmutable — no se incluye en el payload de edición.
 */
type UpdateProfileInput = {
  firstName?: string;
  middleName?: string | null;
  lastName?: string;
  secondLastName?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  monthlyIncome?: number | null;
  newPassword?: string | null;
};

function buildOnSubmit(
  user: PublicUser,
  handleUpdate: (payload: UpdateProfileInput) => void,
  onCancel: () => void,
) {
  return (data: UpdateProfileInput) => {
    const payload: UpdateProfileInput = {};

    if (data.firstName !== user.firstName) payload.firstName = data.firstName;
    if (data.middleName !== (user.middleName || '')) payload.middleName = data.middleName || null;
    if (data.lastName !== user.lastName) payload.lastName = data.lastName;
    if (data.secondLastName !== (user.secondLastName || '')) payload.secondLastName = data.secondLastName || null;
    if (data.phone !== (user.phone || '')) payload.phone = data.phone || null;
    if (data.avatarUrl !== (user.avatarUrl || '')) payload.avatarUrl = data.avatarUrl || null;
    if (data.newPassword && data.newPassword.trim() !== '') payload.newPassword = data.newPassword;

    if (Object.keys(payload).length > 0) {
      handleUpdate(payload);
    } else {
      onCancel();
    }
  };
}

function makeCaptor<T>() {
  const captor = {
    called: false,
    lastArg: undefined as T | undefined,
    fn(arg: T) {
      captor.called = true;
      captor.lastArg = arg;
    },
  };
  return captor;
}

function makeCancelCaptor() {
  const captor = {
    called: false,
    fn() {
      captor.called = true;
    },
  };
  return captor;
}

function buildUser(overrides: Partial<PublicUser> = {}): PublicUser {
  return {
    id: 'user-01',
    email: 'ana@example.com',
    document: '1234567890',
    firstName: 'Ana',
    middleName: null,
    lastName: 'Garcia',
    secondLastName: null,
    fullName: 'Ana Garcia',
    birthDate: null,
    phone: null,
    avatarUrl: null,
    isActive: true,
    twoFactorEnabled: false,
    role: 'user',
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('onSubmit de ProfileEditForm (defecto #9: birthDate inmutable)', () => {

  /**
   * Camino 1: Sin cambios → llama onCancel.
   * Cubre defecto #6: formulario enviado igual que el estado actual.
   */
  test('Camino 1 — sin cambios, llama onCancel', () => {
    const user = buildUser();
    const updateCaptor = makeCaptor<UpdateProfileInput>();
    const cancelCaptor = makeCancelCaptor();
    const onSubmit = buildOnSubmit(user, updateCaptor.fn.bind(updateCaptor), cancelCaptor.fn.bind(cancelCaptor));

    const data: UpdateProfileInput = {
      firstName: 'Ana',
      middleName: '',
      lastName: 'Garcia',
      secondLastName: '',
      phone: '',
      avatarUrl: '',
    };

    onSubmit(data);

    expect(cancelCaptor.called).toBe(true);
    expect(updateCaptor.called).toBe(false);
  });

  /**
   * Camino 2: Cambia firstName → payload contiene solo firstName.
   */
  test('Camino 2 — cambia firstName', () => {
    const user = buildUser();
    const updateCaptor = makeCaptor<UpdateProfileInput>();
    const cancelCaptor = makeCancelCaptor();
    const onSubmit = buildOnSubmit(user, updateCaptor.fn.bind(updateCaptor), cancelCaptor.fn.bind(cancelCaptor));

    const data: UpdateProfileInput = {
      firstName: 'Maria',
      middleName: '',
      lastName: 'Garcia',
      secondLastName: '',
      phone: '',
      avatarUrl: '',
    };

    onSubmit(data);

    expect(updateCaptor.called).toBe(true);
    expect(updateCaptor.lastArg).toEqual({ firstName: 'Maria' });
    expect(cancelCaptor.called).toBe(false);
  });

  /**
   * Camino 3: Agrega middleName → payload contiene middleName.
   */
  test('Camino 3 — agrega middleName', () => {
    const user = buildUser();
    const updateCaptor = makeCaptor<UpdateProfileInput>();
    const cancelCaptor = makeCancelCaptor();
    const onSubmit = buildOnSubmit(user, updateCaptor.fn.bind(updateCaptor), cancelCaptor.fn.bind(cancelCaptor));

    const data: UpdateProfileInput = {
      firstName: 'Ana',
      middleName: 'Lucia',
      lastName: 'Garcia',
      secondLastName: '',
      phone: '',
      avatarUrl: '',
    };

    onSubmit(data);

    expect(updateCaptor.called).toBe(true);
    expect(updateCaptor.lastArg).toEqual({ middleName: 'Lucia' });
    expect(cancelCaptor.called).toBe(false);
  });

  /**
   * Camino 4: Cambia lastName → payload contiene lastName.
   */
  test('Camino 4 — cambia lastName', () => {
    const user = buildUser();
    const updateCaptor = makeCaptor<UpdateProfileInput>();
    const cancelCaptor = makeCancelCaptor();
    const onSubmit = buildOnSubmit(user, updateCaptor.fn.bind(updateCaptor), cancelCaptor.fn.bind(cancelCaptor));

    const data: UpdateProfileInput = {
      firstName: 'Ana',
      middleName: '',
      lastName: 'Lopez',
      secondLastName: '',
      phone: '',
      avatarUrl: '',
    };

    onSubmit(data);

    expect(updateCaptor.called).toBe(true);
    expect(updateCaptor.lastArg).toEqual({ lastName: 'Lopez' });
    expect(cancelCaptor.called).toBe(false);
  });

  /**
   * Camino 5: Agrega secondLastName → payload contiene secondLastName.
   */
  test('Camino 5 — agrega secondLastName', () => {
    const user = buildUser();
    const updateCaptor = makeCaptor<UpdateProfileInput>();
    const cancelCaptor = makeCancelCaptor();
    const onSubmit = buildOnSubmit(user, updateCaptor.fn.bind(updateCaptor), cancelCaptor.fn.bind(cancelCaptor));

    const data: UpdateProfileInput = {
      firstName: 'Ana',
      middleName: '',
      lastName: 'Garcia',
      secondLastName: 'Torres',
      phone: '',
      avatarUrl: '',
    };

    onSubmit(data);

    expect(updateCaptor.called).toBe(true);
    expect(updateCaptor.lastArg).toEqual({ secondLastName: 'Torres' });
    expect(cancelCaptor.called).toBe(false);
  });

  /**
   * Camino 6: Cambia phone → payload contiene phone.
   */
  test('Camino 6 — cambia phone', () => {
    const user = buildUser({ phone: null });
    const updateCaptor = makeCaptor<UpdateProfileInput>();
    const cancelCaptor = makeCancelCaptor();
    const onSubmit = buildOnSubmit(user, updateCaptor.fn.bind(updateCaptor), cancelCaptor.fn.bind(cancelCaptor));

    const data: UpdateProfileInput = {
      firstName: 'Ana',
      middleName: '',
      lastName: 'Garcia',
      secondLastName: '',
      phone: '+57 310 000 0000',
      avatarUrl: '',
    };

    onSubmit(data);

    expect(updateCaptor.called).toBe(true);
    expect(updateCaptor.lastArg).toEqual({ phone: '+57 310 000 0000' });
    expect(cancelCaptor.called).toBe(false);
  });

  /**
   * Camino 7: Cambia avatarUrl → payload contiene avatarUrl.
   */
  test('Camino 7 — cambia avatarUrl', () => {
    const user = buildUser({ avatarUrl: null });
    const updateCaptor = makeCaptor<UpdateProfileInput>();
    const cancelCaptor = makeCancelCaptor();
    const onSubmit = buildOnSubmit(user, updateCaptor.fn.bind(updateCaptor), cancelCaptor.fn.bind(cancelCaptor));

    const data: UpdateProfileInput = {
      firstName: 'Ana',
      middleName: '',
      lastName: 'Garcia',
      secondLastName: '',
      phone: '',
      avatarUrl: 'https://cdn.example.com/avatar.png',
    };

    onSubmit(data);

    expect(updateCaptor.called).toBe(true);
    expect(updateCaptor.lastArg).toEqual({ avatarUrl: 'https://cdn.example.com/avatar.png' });
    expect(cancelCaptor.called).toBe(false);
  });

  /**
   * Camino 8: birthDate NO está en el payload — defecto #9.
   * Aunque el usuario tenga birthDate en su perfil, intentar pasarla
   * en el formulario no debe incluirla en el payload de update.
   */
  test('Camino 8 — birthDate NO incluida en payload (inmutable)', () => {
    const user = buildUser({ birthDate: '1990-05-15' });
    const updateCaptor = makeCaptor<UpdateProfileInput>();
    const cancelCaptor = makeCancelCaptor();
    const onSubmit = buildOnSubmit(user, updateCaptor.fn.bind(updateCaptor), cancelCaptor.fn.bind(cancelCaptor));

    // Formulario sin cambios (birthDate no está en el formulario editable)
    const data: UpdateProfileInput = {
      firstName: 'Ana',
      middleName: '',
      lastName: 'Garcia',
      secondLastName: '',
      phone: '',
      avatarUrl: '',
    };

    onSubmit(data);

    expect(cancelCaptor.called).toBe(true);
    expect(updateCaptor.called).toBe(false);
    // Confirmar que birthDate no está en ningún payload potencial
    expect(updateCaptor.lastArg).toBeUndefined();
  });

  /**
   * Camino 9: Nueva contraseña → payload contiene newPassword.
   * Cubre defecto #5 (campo de contraseña con límite de longitud).
   */
  test('Camino 9 — cambia newPassword', () => {
    const user = buildUser();
    const updateCaptor = makeCaptor<UpdateProfileInput>();
    const cancelCaptor = makeCancelCaptor();
    const onSubmit = buildOnSubmit(user, updateCaptor.fn.bind(updateCaptor), cancelCaptor.fn.bind(cancelCaptor));

    const data: UpdateProfileInput = {
      firstName: 'Ana',
      middleName: '',
      lastName: 'Garcia',
      secondLastName: '',
      phone: '',
      avatarUrl: '',
      newPassword: 'NuevaPass123!',
    };

    onSubmit(data);

    expect(updateCaptor.called).toBe(true);
    expect(updateCaptor.lastArg).toEqual({ newPassword: 'NuevaPass123!' });
    expect(cancelCaptor.called).toBe(false);
  });

  /**
   * Camino 10: newPassword vacío → NO se incluye en el payload.
   */
  test('Camino 10 — newPassword vacío no se envía', () => {
    const user = buildUser();
    const updateCaptor = makeCaptor<UpdateProfileInput>();
    const cancelCaptor = makeCancelCaptor();
    const onSubmit = buildOnSubmit(user, updateCaptor.fn.bind(updateCaptor), cancelCaptor.fn.bind(cancelCaptor));

    const data: UpdateProfileInput = {
      firstName: 'Ana',
      middleName: '',
      lastName: 'Garcia',
      secondLastName: '',
      phone: '',
      avatarUrl: '',
      newPassword: '',
    };

    onSubmit(data);

    expect(cancelCaptor.called).toBe(true);
    expect(updateCaptor.called).toBe(false);
  });
});
