import { Router } from 'express'
import { pool } from './db.js'
import { requireAuth } from './auth.js'

const ARRAY_KEYS = [
  'wallets',
  'categories',
  'transactions',
  'transfers',
  'recurring',
]

function cleanAppData(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  for (const key of ARRAY_KEYS) {
    if (!Array.isArray(value[key])) return null
  }
  if (!value.settings || typeof value.settings !== 'object') return null

  return {
    wallets: value.wallets,
    categories: value.categories,
    transactions: value.transactions,
    transfers: value.transfers,
    recurring: value.recurring,
    settings: value.settings,
  }
}

export const dataRouter = Router()
dataRouter.use(requireAuth)

dataRouter.get('/', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT data, updated_at FROM user_data WHERE user_id = $1',
      [req.user.id],
    )
    res.json({
      data: rows[0]?.data ?? null,
      updatedAt: rows[0]?.updated_at ?? null,
    })
  } catch (error) {
    next(error)
  }
})

dataRouter.put('/', async (req, res, next) => {
  try {
    const data = cleanAppData(req.body?.data)
    if (!data) {
      return res.status(400).json({ error: 'Los datos enviados no son válidos.' })
    }

    const { rows } = await pool.query(
      `INSERT INTO user_data (user_id, data, updated_at)
       VALUES ($1, $2::jsonb, now())
       ON CONFLICT (user_id)
       DO UPDATE SET data = EXCLUDED.data, updated_at = now()
       RETURNING updated_at`,
      [req.user.id, JSON.stringify(data)],
    )

    res.json({ ok: true, updatedAt: rows[0].updated_at })
  } catch (error) {
    next(error)
  }
})
