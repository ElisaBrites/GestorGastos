import { createHash, randomBytes } from 'node:crypto'
import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { pool } from './db.js'

const COOKIE_NAME = 'bolsillo_session'
const SESSION_DAYS = 30
const USERNAME_RE = /^[\p{L}\p{N}._-]{3,32}$/u
const LOGIN_WINDOW_MS = 15 * 60 * 1000
const LOGIN_MAX_ATTEMPTS = 20
const attempts = new Map()

function hashToken(token) {
  return createHash('sha256').update(token).digest('hex')
}

function parseCookies(header = '') {
  const cookies = {}
  for (const part of header.split(';')) {
    const separator = part.indexOf('=')
    if (separator < 0) continue
    const key = part.slice(0, separator).trim()
    const value = part.slice(separator + 1).trim()
    if (!key) continue
    try {
      cookies[key] = decodeURIComponent(value)
    } catch {
      cookies[key] = value
    }
  }
  return cookies
}

function cookieOptions(expiresAt) {
  const secure =
    process.env.COOKIE_SECURE === 'false'
      ? false
      : process.env.NODE_ENV === 'production' || process.env.RENDER === 'true'
  return {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    ...(expiresAt ? { expires: expiresAt } : {}),
  }
}

function setSessionCookie(res, token, expiresAt) {
  res.cookie(COOKIE_NAME, token, cookieOptions(expiresAt))
}

function clearSessionCookie(res) {
  res.clearCookie(COOKIE_NAME, cookieOptions())
}

function publicUser(row) {
  return { id: row.id, username: row.username }
}

function validateCredentials(username, password) {
  const clean = typeof username === 'string' ? username.trim() : ''
  if (!USERNAME_RE.test(clean)) {
    return {
      error:
        'El usuario debe tener entre 3 y 32 caracteres y usar solo letras, números, punto, guion o guion bajo.',
    }
  }
  if (typeof password !== 'string' || password.length < 8) {
    return { error: 'La contraseña debe tener al menos 8 caracteres.' }
  }
  if (Buffer.byteLength(password, 'utf8') > 72) {
    return { error: 'La contraseña no puede superar los 72 caracteres.' }
  }
  return { username: clean }
}

function loginLimiter(req, res, next) {
  const now = Date.now()
  const key = req.ip ?? 'unknown'
  const entry = attempts.get(key)

  if (!entry || now > entry.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + LOGIN_WINDOW_MS })
    return next()
  }

  if (entry.count >= LOGIN_MAX_ATTEMPTS) {
    const retryAfter = Math.max(1, Math.ceil((entry.resetAt - now) / 1000))
    res.set('Retry-After', String(retryAfter))
    return res.status(429).json({
      error: 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.',
    })
  }

  entry.count += 1
  if (attempts.size > 5_000) {
    for (const [attemptKey, value] of attempts) {
      if (now > value.resetAt) attempts.delete(attemptKey)
    }
  }
  next()
}

function clearAttempts(req) {
  attempts.delete(req.ip ?? 'unknown')
}

async function findSessionUser(req) {
  const token = parseCookies(req.headers.cookie ?? '')[COOKIE_NAME]
  if (!token) return null

  const { rows } = await pool.query(
    `SELECT u.id, u.username, s.id AS session_id
       FROM sessions s
       JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = $1 AND s.expires_at > now()`,
    [hashToken(token)],
  )
  return rows[0] ?? null
}

export async function requireAuth(req, res, next) {
  try {
    const user = await findSessionUser(req)
    if (!user) return res.status(401).json({ error: 'No autenticado.' })
    req.user = {
      id: user.id,
      username: user.username,
      sessionId: user.session_id,
    }
    next()
  } catch (error) {
    next(error)
  }
}

async function createSession(userId) {
  const token = randomBytes(32).toString('base64url')
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000)
  await pool.query(
    'INSERT INTO sessions (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
    [userId, hashToken(token), expiresAt],
  )
  return { token, expiresAt }
}

export const authRouter = Router()

authRouter.get('/status', async (req, res, next) => {
  try {
    const [{ rows: countRows }, user] = await Promise.all([
      pool.query('SELECT count(*)::int AS count FROM users'),
      findSessionUser(req),
    ])
    res.json({
      hasUser: countRows[0].count > 0,
      hasUsers: countRows[0].count > 0,
      user: user ? publicUser(user) : null,
    })
  } catch (error) {
    next(error)
  }
})

async function createAccount(req, res, { firstOnly }) {
  const { username, password } = req.body ?? {}
  const valid = validateCredentials(username, password)
  if (valid.error) return res.status(400).json({ error: valid.error })

  if (firstOnly) {
    const { rows } = await pool.query('SELECT count(*)::int AS count FROM users')
    if (rows[0].count > 0) {
      return res.status(409).json({ error: 'Ya existe una cuenta. Inicia sesión.' })
    }
  }

  const passwordHash = await bcrypt.hash(password, 12)
  let user
  try {
    const inserted = await pool.query(
      'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username',
      [valid.username, passwordHash],
    )
    user = inserted.rows[0]
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({
        error: firstOnly
          ? 'Ya existe una cuenta. Inicia sesión.'
          : 'Ya existe un usuario con ese nombre.',
      })
    }
    throw error
  }

  const session = await createSession(user.id)
  setSessionCookie(res, session.token, session.expiresAt)
  clearAttempts(req)
  res.status(201).json({ user: publicUser(user) })
}

authRouter.post('/setup', loginLimiter, async (req, res, next) => {
  try {
    await createAccount(req, res, { firstOnly: true })
  } catch (error) {
    next(error)
  }
})

authRouter.post('/register', loginLimiter, async (req, res, next) => {
  try {
    await createAccount(req, res, { firstOnly: false })
  } catch (error) {
    next(error)
  }
})

authRouter.post('/login', loginLimiter, async (req, res, next) => {
  try {
    const { username, password } = req.body ?? {}
    if (typeof username !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ error: 'Escribe tu usuario y tu contraseña.' })
    }

    const { rows } = await pool.query(
      'SELECT id, username, password_hash FROM users WHERE lower(username) = lower($1)',
      [username.trim()],
    )
    const user = rows[0]
    const valid = user ? await bcrypt.compare(password, user.password_hash) : false

    if (!valid) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos.' })
    }

    const session = await createSession(user.id)
    setSessionCookie(res, session.token, session.expiresAt)
    clearAttempts(req)
    res.json({ user: publicUser(user) })
  } catch (error) {
    next(error)
  }
})

authRouter.post('/logout', async (req, res, next) => {
  try {
    const user = await findSessionUser(req)
    if (user) {
      await pool.query('DELETE FROM sessions WHERE id = $1', [user.session_id])
    }
    clearSessionCookie(res)
    res.status(204).end()
  } catch (error) {
    next(error)
  }
})

authRouter.get('/me', requireAuth, (req, res) => {
  res.json({ user: { id: req.user.id, username: req.user.username } })
})
