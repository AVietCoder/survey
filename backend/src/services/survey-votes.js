import { ok } from '../config/supabase.js'
import { HttpError } from '../middleware/auth.js'

/**
 * Khảo sát mặc định của trang chủ, chọn bằng bình chọn của admin (migration 020).
 * Quy tắc: mỗi admin một phiếu (đổi được); chỉ khảo sát ĐÃ XUẤT BẢN được tính; nhiều phiếu nhất thắng;
 * hòa phiếu thì khảo sát nhận phiếu sớm nhất thắng, rồi theo id để kết quả luôn xác định.
 * Không có phiếu nào → không có khảo sát mặc định (không tự chọn bừa).
 */
const MISSING = ['42P01', 'PGRST205', 'PGRST204']

function votesResult(result) {
  if (MISSING.includes(result?.error?.code)) throw new HttpError(503, 'Chạy backend/migrations/020_survey_votes.sql để bật bình chọn khảo sát mặc định')
  return ok(result)
}

export function createSurveyVotesService(db) {
  const q = votesResult

  async function publishedSurveys() {
    return ok(await db.from('surveys').select('id,title,description,public_slug,status,user_id').eq('status', 'published'))
  }

  /** Bảng phiếu cho admin: mọi khảo sát đã xuất bản kèm số phiếu, đã sắp xếp theo thứ tự thắng. */
  async function tally(adminId = null) {
    const [surveys, votes] = await Promise.all([publishedSurveys(), db.from('survey_votes').select('admin_id,survey_id,voted_at').then(q)])
    const byId = new Map(surveys.map(s => [s.id, { survey: s, count: 0, first: null }]))
    let mine = null
    for (const vote of votes) {
      if (vote.admin_id === adminId) mine = vote.survey_id
      const entry = byId.get(vote.survey_id)
      if (!entry) continue                                        // khảo sát đã đóng/xóa: phiếu không được tính
      entry.count += 1
      if (!entry.first || vote.voted_at < entry.first) entry.first = vote.voted_at
    }
    const rows = [...byId.values()].sort((a, b) => b.count - a.count || (a.first ? (b.first ? (a.first < b.first ? -1 : a.first > b.first ? 1 : 0) : -1) : (b.first ? 1 : 0)) || (a.survey.id < b.survey.id ? -1 : 1))
    return {
      surveys: rows.map(({ survey, count }) => ({ id: survey.id, title: survey.title, slug: survey.public_slug, votes: count, mine: survey.id === mine })),
      defaultSurveyId: rows[0]?.count > 0 ? rows[0].survey.id : null, myVote: byId.has(mine) ? mine : null
    }
  }

  /** Chỉ trả thông tin công khai tối thiểu; thiếu migration hoặc chưa có phiếu → null (giữ hành vi cũ). */
  async function defaultSurvey() {
    try {
      const { surveys, defaultSurveyId } = await tally()
      const winner = surveys.find(s => s.id === defaultSurveyId)
      if (!winner) return null
      const full = ok(await db.from('surveys').select('title,description,public_slug').eq('id', winner.id).maybeSingle())
      return full ? { slug: full.public_slug, title: full.title, description: full.description } : null
    } catch (error) {
      if (error.status === 503) return null
      throw error
    }
  }

  async function vote(adminId, surveyId) {
    const survey = ok(await db.from('surveys').select('id,status,title').eq('id', surveyId).maybeSingle())
    if (!survey || survey.status !== 'published') throw new HttpError(400, 'Chỉ bình chọn được cho khảo sát đã xuất bản')
    const existing = q(await db.from('survey_votes').select('admin_id').eq('admin_id', adminId).maybeSingle())
    const row = { survey_id: survey.id, voted_at: new Date().toISOString() }
    if (existing) q(await db.from('survey_votes').update(row).eq('admin_id', adminId))
    else q(await db.from('survey_votes').insert({ admin_id: adminId, ...row }))
    return survey
  }

  async function clearVote(adminId) {
    q(await db.from('survey_votes').delete().eq('admin_id', adminId))
  }

  return { tally, defaultSurvey, vote, clearVote }
}
