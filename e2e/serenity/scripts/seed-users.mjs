const TEST_CREDENTIALS = {
  validUser: {
    email: 'e2e-user@fubanking.test',
    password: 'E2eSegura123!'
  },
  twoFactorUser: {
    email: 'e2e-2fa@fubanking.test',
    password: 'E2eSegura123!'
  }
};
const API_URL = process.env.E2E_API_URL || 'http://localhost:3001/api/v1';

async function registerUser(userConfig) {
  const payload = {
    firstName: "Test",
    lastName: "User",
    document: Math.floor(Math.random() * 100000000).toString(),
    birthDate: "1990-01-01",
    email: userConfig.email,
    password: userConfig.password,
    confirmPassword: userConfig.password,
    phone: "3000000000",
    monthlyIncome: 5000000
  };

  try {
    console.log(`Registrando usuario: ${payload.email}...`);
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log(`✅ Usuario ${payload.email} registrado correctamente.`);
    } else {
      console.error(`❌ Error registrando ${payload.email}:`, data.message || data);
    }
  } catch (error) {
    console.error(`💥 Error de red registrando ${payload.email}. ¿Está encendido el backend en ${API_URL}?`, error);
  }
}

async function run() {
  console.log('--- SEEDING E2E TEST USERS ---');
  await registerUser(TEST_CREDENTIALS.validUser);
  await registerUser(TEST_CREDENTIALS.twoFactorUser);
  
  console.log('\nRecuerda habilitar el 2FA manualmente para el usuario twoFactorUser si la prueba C2 de 2FA te falla.');
  console.log('------------------------------');
}

run();
