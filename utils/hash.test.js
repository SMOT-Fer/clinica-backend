// /utils/hash.test.js
require('dotenv').config();
const { hashPassword, comparePassword } = require('./hash.util');

async function test() {
  const plain = 'temporal';

  console.log('🔐 Password plano:', plain);

  const hash = await hashPassword(plain);
  console.log('✅ Hash generado:', hash);

  const ok = await comparePassword(plain, hash);
  console.log('🔁 Comparación correcta:', ok);

  const fail = await comparePassword('wrong', hash);
  console.log('❌ Comparación incorrecta:', fail);
}

test()
  .then(() => process.exit())
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
