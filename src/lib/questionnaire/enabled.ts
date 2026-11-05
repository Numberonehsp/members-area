// The questionnaire ships switched off. Set QUESTIONNAIRE_ENABLED=true in the
// Vercel project (server env, not NEXT_PUBLIC_) to turn it on.
export function isQuestionnaireEnabled(): boolean {
  return process.env.QUESTIONNAIRE_ENABLED === 'true'
}
