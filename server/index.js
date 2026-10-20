import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'
import { authRouter } from './auth.js'
import { closePool, ensureSchema, pool } from './db.js'
import { dataRouter } from './data.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distDir = path.resolve(__dirname, '..', 'dist')
const indexHtml = path.join(distDir, 'index.html')
const port = Number(process.env.PORT ?? 3001)

const app = express()
app.set('trust proxy', 1)
app.disable('x-powered-by')

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  next()
})

app.use(express.json({ limit: '10mb' }))

app.use('/api', (_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store')
  next()
})

app.get('/api/health', async (_req, res, next) => {
  try {
    await pool.query('SELECT 1')
    res.json({ ok: true })
  } catch (error) {
    next(error)
  }
})

app.use('/api/auth', authRouter)
app.use('/api/data', dataRouter)

app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada.' })
})

if (existsSync(indexHtml)) {
  app.use(express.static(distDir, { index: false }))
  app.get('*', (_req, res) => {
    res.sendFile(indexHtml)
  })
}

app.use((error, _req, res, _next) => {
  if (error?.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Los datos enviados son demasiado grandes.' })
  }
  if (error instanceof SyntaxError && 'body' in error) {
    return res.status(400).json({ error: 'El cuerpo de la petición no es JSON válido.' })
  }
  console.error('Error del servidor:', error?.message ?? error)
  res.status(500).json({ error: 'Error interno del servidor.' })
})

async function start() {
  await ensureSchema()
  await pool.query('DELETE FROM sessions WHERE expires_at < now()')
  app.listen(port, '0.0.0.0', () => {
    console.log(`Bolsillo escuchando en el puerto ${port}`)
  })
}

start().catch(async (error) => {
  console.error('No se pudo iniciar el servidor:', error.message)
  await closePool().catch(() => {})
  process.exit(1)
})

async function shutdown() {
  await closePool().catch(() => {})
  process.exit(0)
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
