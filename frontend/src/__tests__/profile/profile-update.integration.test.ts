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

type UpdateProfileInput = {
  firstName?: string;
  middleName?: string | null;
  lastName?: string;
  secondLastName?: string | null;
  birthDate?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
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

    const currentBirthDateStr = user.birthDate ? user.birthDate.split('T')[0] : '';
    if (data.birthDate !== currentBirthDateStr) payload.birthDate = data.birthDate || null;

    if (data.phone !== (user.phone || '')) payload.phone = data.phone || null;
    if (data.avatarUrl !== (user.avatarUrl || '')) payload.avatarUrl = data.avatarUrl || null;

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
    birthDate: '1995-01-01T00:00:00.000Z',
    phone: null,
    avatarUrl: null,
    isActive: true,
    twoFactorEnabled: false,
    role: 'user',
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('Editar perfil', () => {
  let fakeService: FakeProfileService;
  let loginCaptor: ReturnType<typeof makeLoginCaptor>;
  let cancelCaptor: ReturnType<typeof makeCancelCaptor>;

  beforeEach(() => {
    fakeService = makeFakeProfileService();
    loginCaptor = makeLoginCaptor();
    cancelCaptor = makeCancelCaptor();
  });

  test('Camino 1', () => {
    const user = buildPublicUser({ phone: null, birthDate: '1995-01-01T00:00:00.000Z' });

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
      birthDate: '1995-01-01',
      phone: '',
      avatarUrl: '',
    };

    onSubmit(formData);

    expect(handleUpdateCalled).toBe(false);
    expect(fakeService.called).toBe(false);
    expect(cancelCaptor.called).toBe(true);
  });

  test('Camino 2', async () => {
    const user = buildPublicUser({ phone: null });

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

  test('Camino 3', async () => {
    const user = buildPublicUser({ phone: '+57 300 000 0000' });

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

  test('Camino 4', async () => {
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
