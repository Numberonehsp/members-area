import { notFound } from 'next/navigation'
import QuestionnaireForm from '@/components/questionnaire/QuestionnaireForm'
import { isQuestionnaireEnabled } from '@/lib/questionnaire/enabled'

export const dynamic = 'force-dynamic'

// "My health profile": the member questionnaire. Switched off until
// QUESTIONNAIRE_ENABLED=true, so it can ship before it is ready for members.
export default function HealthProfilePage() {
  if (!isQuestionnaireEnabled()) notFound()
  return <QuestionnaireForm />
}
