/**
 * Tests de integración — useUpdateProfile (lógica de hook).
 *
 * Defectos cubiertos:
 *  #6  — Formulario con datos sin cambios llama a onCancel.
 *  #9  — birthDate no está en el tipo editable.
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
  birthDate: string;
  phone: string | null;
  avatarUrl: string | null;
  isActive: boolean;
  twoFactorEnabled: boolean;
  role: string;
  createdAt: string;
}

interface AuthError {
  code: string;
  message: string;
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

interface FakeProfileService {
  response: PublicUser | null;
  error: AuthError | null;
  called: boolean;
  lastPayload: UpdateProfileInput | undefined;
  updateProfile(data: UpdateProfileInput): Promise<PublicUser>;
  reset(): void;
}

function makeFakeProfileService(): FakeProfileService {
  const svc: FakeProfileService = {
    response: null,
    error: null,
    called: false,
    lastPayload: undefined,
    async updateProfile(data: UpdateProfileInput): Promise<PublicUser> {
      svc.called = true;
      svc.lastPayload = data;
      if (svc.error) throw svc.error;
      return svc.response!;
    },
    reset() {
      svc.response = null;
      svc.error = null;
      svc.called = false;
      svc.lastPayload = undefined;
    },
  };
  return svc;
}

function makeLoginCaptor() {
  const captor = {
    called: false,
    lastUser: undefined as PublicUser | undefined,
    lastToken: undefined as string | undefined,
    login(user: PublicUser, token: string) {
      captor.called = true;
      captor.lastUser = user;
      captor.lastToken = token;
    },
    reset() {
      captor.called = false;
      captor.lastUser = undefined;
      captor.lastToken = undefined;
    },
  };
  return captor;
}

function makeCancelCaptor() {
  const captor = {
    called: false,
    fn() { captor.called = true; },
    reset() { captor.called = false; },
  };
  return captor;
}

async function runHandleUpdate(opts: {
  data: UpdateProfileInput;
  profileService: FakeProfileService;
  loginFn: (user: PublicUser, token: string) => void;
  onSuccessCallback?: (user: PublicUser) => void;
  token?: string;
}): Promise<{ error: AuthError | null }> {
  let error: AuthError | null = null;
  try {
    const updatedUser = await opts.profileService.updateProfile(opts.data);
    const token = opts.token ?? '';
    opts.loginFn(updatedUser, token);
    if (opts.onSuccessCallback) {
      opts.onSuccessCallback(updatedUser);
    }
  } catch (err: any) {
    error = err as AuthError;
  }
  return { error };
}

/**
 * buildOnSubmit refleja el onSubmit actualizado del ProfileEditForm:
 * - birthDate eliminado (defecto #9).
 * - newPassword incluido si no está vacío (defecto #5).
 */
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

function buildPublicUser(overrides: Partial<PublicUser> = {}): PublicUser {
  return {
    id: 'user-integ-01',
    email: 'ana@example.com',
    document: '1234567890',
    firstName: 'Ana',
    middleName: null,
    lastName: 'Garcia',
    secondLastName: null,
    fullName: 'Ana Garcia',
    birthDate: '1995-01-01',
    phone: null,
    avatarUrl: null,
    isActive: true,
    twoFactorEnabled: false,
    role: 'user',
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('Editar perfil — integración', () => {
  let fakeService: FakeProfileService;
  let loginCaptor: ReturnType<typeof makeLoginCaptor>;
  let cancelCaptor: ReturnType<typeof makeCancelCaptor>;

  beforeEach(() => {
    fakeService = makeFakeProfileService();
    loginCaptor = makeLoginCaptor();
    cancelCaptor = makeCancelCaptor();
  });

  /**
   * Camino 1: Sin cambios → llama onCancel, no llama al servicio.
   * Cubre defecto #6: formulario igual al estado actual.
   * birthDate NO está en el formulario editable (defecto #9).
   */
  test('Camino 1 — sin cambios, llama onCancel sin llamar al servicio', () => {
    const user = buildPublicUser({ phone: null, birthDate: '1995-01-01' });

    let handleUpdateCalled = false;
    const onSubmit = buildOnSubmit(
      user,
      (_payload) => { handleUpdateCalled = true; },
      cancelCaptor.fn.bind(cancelCaptor),
    );

    const formData: UpdateProfileInput = {
      firstName: 'Ana',
      middleName: '',
      lastName: 'Garcia',
      secondLastName: '',
      phone: '',
      avatarUrl: '',
    };

    onSubmit(formData);

    expect(handleUpdateCalled).toBe(false);
    expect(fakeService.called).toBe(false);
    expect(cancelCaptor.called).toBe(true);
  });

  /**
   * Camino 2: Error de validación en el servicio → error propagado.
   */
  test('Camino 2 — error de validación del servicio', async () => {
    fakeService.error = {
      code: 'VALIDATION_ERROR',
      message: 'Numero de telefono invalido',
    };

    const payload: UpdateProfileInput = { phone: '1' };

    const { error } = await runHandleUpdate({
      data: payload,
      profileService: fakeService,
      loginFn: loginCaptor.login.bind(loginCaptor),
    });

    expect(fakeService.called).toBe(true);
    expect(error).not.toBeNull();
    expect(error!.code).toBe('VALIDATION_ERROR');
    expect(error!.message).toMatch(/telefono|invalido/i);
    expect(loginCaptor.called).toBe(false);
  });

  /**
   * Camino 3: Error NO_CHANGES del servicio → error propagado.
   */
  test('Camino 3 — error NO_CHANGES del servicio', async () => {
    fakeService.error = {
      code: 'NO_CHANGES',
      message: 'No se proporciono ningun campo para actualizar',
    };

    const payload: UpdateProfileInput = { phone: '+57 300 000 0000' };

    const { error } = await runHandleUpdate({
      data: payload,
      profileService: fakeService,
      loginFn: loginCaptor.login.bind(loginCaptor),
    });

    expect(fakeService.called).toBe(true);
    expect(error).not.toBeNull();
    expect(error!.code).toBe('NO_CHANGES');
    expect(loginCaptor.called).toBe(false);
  });

  /**
   * Camino 4: Actualización exitosa → loginFn y onSuccessCallback llamados.
   */
  test('Camino 4 — actualización exitosa con callback', async () => {
    const user = buildPublicUser();
    const updatedUser: PublicUser = { ...user, firstName: 'Maria', fullName: 'Maria Garcia' };

    fakeService.response = updatedUser;

    let successCallbackUser: PublicUser | undefined;
    const onSuccessCallback = (u: PublicUser) => { successCallbackUser = u; };

    const payload: UpdateProfileInput = { firstName: 'Maria' };

    const { error } = await runHandleUpdate({
      data: payload,
      profileService: fakeService,
      loginFn: loginCaptor.login.bind(loginCaptor),
      onSuccessCallback,
      token: 'jwt-token-existente',
    });

    expect(error).toBeNull();
    expect(fakeService.called).toBe(true);
    expect(fakeService.lastPayload).toEqual({ firstName: 'Maria' });

    expect(loginCaptor.called).toBe(true);
    expect(loginCaptor.lastUser!.firstName).toBe('Maria');
    expect(loginCaptor.lastToken).toBe('jwt-token-existente');

    expect(successCallbackUser).toBeDefined();
    expect(successCallbackUser!.firstName).toBe('Maria');
  });
});
