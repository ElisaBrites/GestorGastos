import { readFile } from 'node:fs/promises'
import pg from 'pg'

const { Pool } = pg
const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('Falta DATABASE_URL. Configúrala en .env o en las variables de Render.')
}

const useSsl = process.env.DATABASE_SSL !== 'false'

export const pool = new Pool({
  connectionString,
  ssl: useSsl ? { rejectUnauthorized: false } : undefined,
  max: Number(process.env.PG_POOL_MAX ?? 5),
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
  application_name: 'bolsillo',
})

pool.on('error', (error) => {
  console.error('Error inesperado en PostgreSQL:', error.message)
})

export async function ensureSchema() {
  const schema = await readFile(new URL('./schema.sql', import.meta.url), 'utf8')
  await pool.query(schema)
}

export async function closePool() {
  await pool.end()
}
