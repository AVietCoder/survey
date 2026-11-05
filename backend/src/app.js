import 'dotenv/config'
import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import routes from './routes/index.js'
import { errorHandler } from './middleware/auth.js'

for (const k of ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'JWT_SECRET'])
  if (!process.env[k]) console.warn(`⚠  Thiếu biến môi trường ${k} (xem .env.example)`)

const app = express()
app.set('trust proxy', 1)
app.use(express.json({ limit: '1mb' }))
app.use(cookieParser())
if (process.env.CORS_ORIGIN) app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }))

app.use('/api', routes)
app.use('/api', (_req, res) => res.status(404).json({ error: 'Không tìm thấy' }))

// Phục vụ frontend tĩnh (bỏ đoạn này khi tách frontend sang Next.js)
const web = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../frontend')
app.use(express.static(web))

app.use(errorHandler)
const port = process.env.PORT || 3000
app.listen(port, () => console.log(`brainst0rm chạy tại http://localhost:${port}`))
