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

type UpdateProfileInput = {
  firstName?: string;
  middleName?: string | null;
  lastName?: string;
  secondLastName?: string | null;
  birthDate?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
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

describe('onSubmit de ProfileEditForm', () => {

  test('Camino 1', () => {
    const user = buildUser();
    const updateCaptor = makeCaptor<UpdateProfileInput>();
    const cancelCaptor = makeCancelCaptor();
    const onSubmit = buildOnSubmit(user, updateCaptor.fn.bind(updateCaptor), cancelCaptor.fn.bind(cancelCaptor));

    const data: UpdateProfileInput = {
      firstName: 'Ana',
      middleName: '',
      lastName: 'Garcia',
      secondLastName: '',
      birthDate: '',
      phone: '',
      avatarUrl: '',
    };

    onSubmit(data);

    expect(cancelCaptor.called).toBe(true);
    expect(updateCaptor.called).toBe(false);
  });

  test('Camino 2', () => {
    const user = buildUser();
    const updateCaptor = makeCaptor<UpdateProfileInput>();
    const cancelCaptor = makeCancelCaptor();
    const onSubmit = buildOnSubmit(user, updateCaptor.fn.bind(updateCaptor), cancelCaptor.fn.bind(cancelCaptor));

    const data: UpdateProfileInput = {
      firstName: 'Maria',
      middleName: '',
      lastName: 'Garcia',
      secondLastName: '',
      birthDate: '',
      phone: '',
      avatarUrl: '',
    };

    onSubmit(data);

    expect(updateCaptor.called).toBe(true);
    expect(updateCaptor.lastArg).toEqual({ firstName: 'Maria' });
    expect(cancelCaptor.called).toBe(false);
  });

  test('Camino 3', () => {
    const user = buildUser();
    const updateCaptor = makeCaptor<UpdateProfileInput>();
    const cancelCaptor = makeCancelCaptor();
    const onSubmit = buildOnSubmit(user, updateCaptor.fn.bind(updateCaptor), cancelCaptor.fn.bind(cancelCaptor));

    const data: UpdateProfileInput = {
      firstName: 'Ana',
      middleName: 'Lucia',
      lastName: 'Garcia',
      secondLastName: '',
      birthDate: '',
      phone: '',
      avatarUrl: '',
    };

    onSubmit(data);

    expect(updateCaptor.called).toBe(true);
    expect(updateCaptor.lastArg).toEqual({ middleName: 'Lucia' });
    expect(cancelCaptor.called).toBe(false);
  });

  test('Camino 4', () => {
    const user = buildUser();
    const updateCaptor = makeCaptor<UpdateProfileInput>();
    const cancelCaptor = makeCancelCaptor();
    const onSubmit = buildOnSubmit(user, updateCaptor.fn.bind(updateCaptor), cancelCaptor.fn.bind(cancelCaptor));

    const data: UpdateProfileInput = {
      firstName: 'Ana',
      middleName: '',
      lastName: 'Lopez',
      secondLastName: '',
      birthDate: '',
      phone: '',
      avatarUrl: '',
    };

    onSubmit(data);

    expect(updateCaptor.called).toBe(true);
    expect(updateCaptor.lastArg).toEqual({ lastName: 'Lopez' });
    expect(cancelCaptor.called).toBe(false);
  });

  test('Camino 5', () => {
    const user = buildUser();
    const updateCaptor = makeCaptor<UpdateProfileInput>();
    const cancelCaptor = makeCancelCaptor();
    const onSubmit = buildOnSubmit(user, updateCaptor.fn.bind(updateCaptor), cancelCaptor.fn.bind(cancelCaptor));

    const data: UpdateProfileInput = {
      firstName: 'Ana',
      middleName: '',
      lastName: 'Garcia',
      secondLastName: 'Torres',
      birthDate: '',
      phone: '',
      avatarUrl: '',
    };

    onSubmit(data);

    expect(updateCaptor.called).toBe(true);
    expect(updateCaptor.lastArg).toEqual({ secondLastName: 'Torres' });
    expect(cancelCaptor.called).toBe(false);
  });

  test('Camino 6', () => {
    const user = buildUser({ birthDate: '1990-05-15T00:00:00.000Z' });
    const updateCaptor = makeCaptor<UpdateProfileInput>();
    const cancelCaptor = makeCancelCaptor();
    const onSubmit = buildOnSubmit(user, updateCaptor.fn.bind(updateCaptor), cancelCaptor.fn.bind(cancelCaptor));

    const data: UpdateProfileInput = {
      firstName: 'Ana',
      middleName: '',
      lastName: 'Garcia',
      secondLastName: '',
      birthDate: '1990-05-15',
      phone: '',
      avatarUrl: '',
    };

    onSubmit(data);

    expect(cancelCaptor.called).toBe(true);
    expect(updateCaptor.called).toBe(false);
  });

  test('Camino 7', () => {
    const user = buildUser({ birthDate: '1990-05-15T00:00:00.000Z' });
    const updateCaptor = makeCaptor<UpdateProfileInput>();
    const cancelCaptor = makeCancelCaptor();
    const onSubmit = buildOnSubmit(user, updateCaptor.fn.bind(updateCaptor), cancelCaptor.fn.bind(cancelCaptor));

    const data: UpdateProfileInput = {
      firstName: 'Ana',
      middleName: '',
      lastName: 'Garcia',
      secondLastName: '',
      birthDate: '1995-03-20',
      phone: '',
      avatarUrl: '',
    };

    onSubmit(data);

    expect(updateCaptor.called).toBe(true);
    expect(updateCaptor.lastArg).toEqual({ birthDate: '1995-03-20' });
    expect(cancelCaptor.called).toBe(false);
  });

  test('Camino 8', () => {
    const user = buildUser({ phone: null });
    const updateCaptor = makeCaptor<UpdateProfileInput>();
    const cancelCaptor = makeCancelCaptor();
    const onSubmit = buildOnSubmit(user, updateCaptor.fn.bind(updateCaptor), cancelCaptor.fn.bind(cancelCaptor));

    const data: UpdateProfileInput = {
      firstName: 'Ana',
      middleName: '',
      lastName: 'Garcia',
      secondLastName: '',
      birthDate: '',
      phone: '+57 310 000 0000',
      avatarUrl: '',
    };

    onSubmit(data);

    expect(updateCaptor.called).toBe(true);
    expect(updateCaptor.lastArg).toEqual({ phone: '+57 310 000 0000' });
    expect(cancelCaptor.called).toBe(false);
  });

  test('Camino 9', () => {
    const user = buildUser({ avatarUrl: null });
    const updateCaptor = makeCaptor<UpdateProfileInput>();
    const cancelCaptor = makeCancelCaptor();
    const onSubmit = buildOnSubmit(user, updateCaptor.fn.bind(updateCaptor), cancelCaptor.fn.bind(cancelCaptor));

    const data: UpdateProfileInput = {
      firstName: 'Ana',
      middleName: '',
      lastName: 'Garcia',
      secondLastName: '',
      birthDate: '',
      phone: '',
      avatarUrl: 'https://cdn.example.com/avatar.png',
    };

    onSubmit(data);

    expect(updateCaptor.called).toBe(true);
    expect(updateCaptor.lastArg).toEqual({ avatarUrl: 'https://cdn.example.com/avatar.png' });
    expect(cancelCaptor.called).toBe(false);
  });
});
