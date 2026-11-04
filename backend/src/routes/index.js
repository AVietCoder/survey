import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { requireAuth } from '../middleware/auth.js'
import * as auth from '../controllers/auth.js'
import * as surveys from '../controllers/surveys.js'
import * as pub from '../controllers/public.js'
import * as responses from '../controllers/responses.js'
import * as analytics from '../controllers/analytics.js'

// Bọc handler async để lỗi đi vào errorHandler
const w = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)
const limit = (max, windowMs = 15 * 60 * 1000) => rateLimit({ windowMs, max, standardHeaders: true, legacyHeaders: false, message: { error: 'Quá nhiều yêu cầu, vui lòng thử lại sau' } })

const r = Router()

const a = Router()
a.post('/register', limit(20), w(auth.register))
a.post('/login', limit(30), w(auth.login))
a.post('/logout', auth.logout)
a.get('/me', requireAuth, w(auth.me))
r.use('/auth', a)

const s = Router().use(requireAuth)
s.get('/', w(surveys.list)).post('/', w(surveys.create))
s.get('/:id', w(surveys.get)).put('/:id', w(surveys.update)).delete('/:id', w(surveys.remove))
r.use('/surveys', s)

const p = Router()
p.get('/surveys/:slug', w(pub.getBySlug))
p.post('/surveys/:slug/start', limit(60), w(pub.start))
p.post('/surveys/:slug/responses', limit(30), w(pub.submit))
r.use('/public', p)

r.get('/responses/survey/:surveyId', requireAuth, w(responses.listBySurvey))
r.get('/analytics/overview', requireAuth, w(analytics.overview))
r.get('/analytics/survey/:surveyId', requireAuth, w(analytics.bySurvey))

export default r
