import { supabase, ok } from '../config/supabase.js'
import { getOwned, loadQuestions } from '../services/surveys.js'

function summarize(rs) {
  const done = rs.filter(r => r.submitted_at)
  const q = { normal: 0, suspicious: 0, spam: 0 }
  done.forEach(r => q[r.quality_status]++)
  const durs = done.map(r => r.duration_seconds).filter(d => d != null)
  const days = [...Array(14)].map((_, i) => new Date(Date.now() - (13 - i) * 864e5).toISOString().slice(0, 10))
  const cnt = Object.fromEntries(days.map(d => [d, 0]))
  done.forEach(r => { const d = r.submitted_at.slice(0, 10); if (d in cnt) cnt[d]++ })
  return {
    started: rs.length, completed: done.length,
    completionRate: rs.length ? Math.round(done.length / rs.length * 100) : 0,
    avgDuration: durs.length ? Math.round(durs.reduce((a, b) => a + b, 0) / durs.length) : null,
    quality: q, normalRate: done.length ? Math.round(q.normal / done.length * 100) : null,
    series: days.map(d => ({ date: d, count: cnt[d] }))
  }
}

export async function overview(req, res) {
  const surveys = ok(await supabase.from('surveys').select('id').eq('user_id', req.user.id))
  const ids = surveys.map(s => s.id)
  const rs = ids.length ? ok(await supabase.from('responses').select('survey_id, submitted_at, duration_seconds, quality_status').in('survey_id', ids)) : []
  res.json({ totalSurveys: surveys.length, ...summarize(rs) })
}

const bars = (counts, order) => {
  const n = Object.values(counts).reduce((a, b) => a + b, 0)
  return (order || Object.keys(counts)).map(label => ({ label, count: counts[label] || 0, pct: n ? Math.round((counts[label] || 0) / n * 100) : 0 }))
}

function questionStats(q, vals) {
  const base = { id: q.id, text: q.question_text, type: q.question_type, n: vals.length }
  const labels = q.options.map(o => o.label), t = q.question_type
  if (t === 'single' || t === 'image' || t === 'mc') {
    const c = {}; vals.forEach(v => [].concat(v).forEach(x => c[x] = (c[x] || 0) + 1))
    return { ...base, kind: 'bars', bars: bars(c, labels) }
  }
  if (t === 'likert' || t === 'rating') {
    const max = 5, c = {}; vals.forEach(v => c[v] = (c[v] || 0) + 1)
    return { ...base, kind: 'bars', avg: vals.length ? +(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2) : null, bars: bars(c, [1, 2, 3, 4, 5].map(String)) .map(b => ({ ...b, label: b.label + (t === 'rating' ? ' ★' : '') })) }
  }
  if (t === 'slider') {
    const c = { '0–20': 0, '21–40': 0, '41–60': 0, '61–80': 0, '81–100': 0 }
    vals.forEach(v => c[Object.keys(c)[Math.min(4, Math.floor(Math.max(0, v - 1) / 20))]]++)
    return { ...base, kind: 'bars', avg: vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null, bars: bars(c) }
  }
  if (t === 'rank') {
    const sum = {}; vals.forEach(v => v.forEach((x, i) => sum[x] = (sum[x] || 0) + i + 1))
    return { ...base, kind: 'rows', rows: labels.map(l => ({ label: l, avg: vals.length ? +((sum[l] || 0) / vals.length).toFixed(2) : null, max: labels.length })), hint: 'Thứ hạng trung bình (1 = quan trọng nhất)' }
  }
  if (t === 'sd' || t === 'matrix') {
    const cols = q.settings.cols || [], acc = {}
    vals.forEach(v => Object.entries(v).forEach(([k, x]) => { const n = t === 'sd' ? +x : cols.indexOf(x) + 1; (acc[k] ||= []).push(n) }))
    const keys = t === 'sd' ? (q.settings.pairs || []).map(p => p.join('|')) : labels
    return { ...base, kind: 'rows', rows: keys.map(k => ({ label: k.replace('|', ' ↔ '), avg: acc[k]?.length ? +(acc[k].reduce((a, b) => a + b, 0) / acc[k].length).toFixed(2) : null, max: t === 'sd' ? 5 : cols.length })) }
  }
  return { ...base, kind: 'text', samples: vals.slice(-5).reverse() }
}

export async function bySurvey(req, res) {
  const s = await getOwned(req.params.surveyId, req.user.id)
  const rs = ok(await supabase.from('responses').select('submitted_at, duration_seconds, quality_status, signals').eq('survey_id', s.id))
  const questions = await loadQuestions(s.id)
  const rows = ok(await supabase.from('answers').select('question_id, answer_value, responses!inner(survey_id, quality_status)')
    .eq('responses.survey_id', s.id).neq('responses.quality_status', 'spam'))   // loại phản hồi spam khỏi thống kê câu hỏi
  const by = {}; rows.forEach(r => (by[r.question_id] ||= []).push(r.answer_value))
  const signalCounts = {}
  rs.filter(r => r.submitted_at).forEach(r => (r.signals || []).forEach(x => signalCounts[x.code] = (signalCounts[x.code] || 0) + 1))
  res.json({ survey: { id: s.id, title: s.title, status: s.status, public_slug: s.public_slug }, ...summarize(rs), signalCounts,
    questions: questions.map(q => questionStats(q, by[q.id] || [])) })
}
