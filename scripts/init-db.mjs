import { closePool, ensureSchema } from '../server/db.js'

try {
  await ensureSchema()
  console.log('Base de datos lista: users, sessions y user_data.')
} catch (error) {
  console.error('No se pudo inicializar la base de datos:', error.message)
  process.exitCode = 1
} finally {
  await closePool().catch(() => {})
}
