import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { requireAdmin, requireAuth } from '../middleware/auth.js'
import * as auth from '../controllers/auth.js'
import * as surveys from '../controllers/surveys.js'
import * as pub from '../controllers/public.js'
import * as responses from '../controllers/responses.js'
import * as analytics from '../controllers/analytics.js'
import * as admin from '../controllers/admin.js'
import * as researchProjects from '../controllers/research-projects.js'
import * as exports from '../controllers/exports.js'

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
r.put('/responses/:responseId/review', requireAuth, w(responses.review))
r.get('/analytics/overview', requireAuth, w(analytics.overview))
r.get('/analytics/survey/:surveyId', requireAuth, w(analytics.bySurvey))
r.post('/analytics/survey/:surveyId/reliability', requireAuth, w(analytics.reliability))
r.post('/analytics/survey/:surveyId/analysis', requireAuth, w(analytics.relationshipAnalysis))
r.get('/exports/survey/:surveyId.csv', requireAuth, limit(10), w(exports.surveyCsv))
r.get('/exports/survey/:surveyId.xlsx', requireAuth, limit(10), w(exports.surveyXlsx))

const rp = Router().use(requireAuth)
rp.get('/', w(researchProjects.list)).post('/', w(researchProjects.create))
rp.get('/:id', w(researchProjects.get)).patch('/:id', w(researchProjects.update))
rp.get('/:id/participants', w(researchProjects.listParticipants))
rp.post('/:id/participants', w(researchProjects.addParticipant))
rp.get('/:id/dataset-versions', w(researchProjects.listDatasetVersions))
rp.post('/:id/dataset-versions', limit(5), w(researchProjects.createDatasetVersion))
rp.patch('/:id/participants/:participantId', w(researchProjects.updateParticipant))
rp.post('/:id/members', w(researchProjects.addMember))
rp.delete('/:id/members/:userId', w(researchProjects.removeMember))
rp.post('/:id/surveys/:surveyId', w(researchProjects.linkSurvey))
rp.delete('/:id/surveys/:surveyId', w(researchProjects.unlinkSurvey))
rp.post('/:id/notes', w(researchProjects.addNote))
r.use('/research/projects', rp)
r.get('/research/surveys', requireAuth, w(researchProjects.listAccessibleSurveys))

const ad = Router().use(requireAuth, requireAdmin)
ad.get('/overview', w(admin.overview))
ad.get('/users/search', w(admin.searchUsers))
ad.get('/users', w(admin.listUsers)).post('/users', limit(20), w(admin.createUser))
ad.put('/users/:id', w(admin.updateUser)).delete('/users/:id', w(admin.removeUser))
ad.get('/surveys', w(admin.listSurveys)).post('/surveys', w(admin.createSurvey))
ad.get('/surveys/:id', w(admin.getSurvey)).put('/surveys/:id', w(admin.updateSurvey)).delete('/surveys/:id', w(admin.removeSurvey))
ad.get('/surveys/:id/responses', w(admin.listResponses))
ad.delete('/responses/:id', w(admin.removeResponse))
r.use('/admin', ad)

export default r
