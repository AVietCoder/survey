import { supabase, ok } from '../config/supabase.js'
import { getOwned } from '../services/surveys.js'

export async function listBySurvey(req, res) {
  const s = await getOwned(req.params.surveyId, req.user.id)
  const responses = ok(await supabase.from('responses')
    .select('id, started_at, submitted_at, duration_seconds, quality_status, quality_score, signals')
    .eq('survey_id', s.id).not('submitted_at', 'is', null).order('submitted_at', { ascending: false }).limit(200))
  res.json({ responses })
}
