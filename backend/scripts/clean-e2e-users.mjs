import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import WebSocket from 'ws';

// Inyectar WebSocket globalmente para versiones antiguas de Node (<22)
global.WebSocket = WebSocket;

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("Faltan variables de entorno SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function run() {
  console.log("Obteniendo usuarios E2E de tabla 'users'...");
  
  const { data: usersE2e, error: err1 } = await supabase
    .from('users')
    .select('id, email')
    .like('email', '%e2e%');
    
  const { data: usersTest, error: err2 } = await supabase
    .from('users')
    .select('id, email')
    .like('email', '%@fubanking.test%');
    
  if (err1 || err2) {
    console.error("Error obteniendo usuarios:", err1 || err2);
    return;
  }
  
  const allUsers = [...(usersE2e || []), ...(usersTest || [])].reduce((acc, current) => {
    if (!acc.find(item => item.id === current.id)) {
      acc.push(current);
    }
    return acc;
  }, []);

  console.log(`Se encontraron ${allUsers.length} usuarios de prueba para borrar.`);
  
  let totalDeleted = 0;
  
  for (const user of allUsers) {
    console.log(`Borrando usuario: ${user.email} (ID: ${user.id})...`);
    
    // 1. Borrar de la tabla personalizada (public.users)
    const { error: dbError } = await supabase.from('users').delete().eq('id', user.id);
    
    if (dbError) {
      console.error(`Error borrando ${user.email} de la tabla users:`, dbError.message);
      continue;
    }
    
    // 2. Borrar también de auth.users (Supabase Auth) si existe ahí
    const { error: authError } = await supabase.auth.admin.deleteUser(user.id);
    if (authError && !authError.message.includes('User not found')) {
      console.error(`Error borrando ${user.email} de auth:`, authError.message);
    }

    totalDeleted++;
  }
  
  console.log(`\n✅ Proceso completado. Total de usuarios e2e borrados: ${totalDeleted}`);
}

run();
