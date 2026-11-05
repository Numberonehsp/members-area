import { notFound } from 'next/navigation'
import QuestionnaireForm from '@/components/questionnaire/QuestionnaireForm'
import { isQuestionnaireEnabled } from '@/lib/questionnaire/enabled'

export const dynamic = 'force-dynamic'

// Youth athlete profile: the shorter questionnaire for under 18s, completed with
// a parent or guardian. Off until QUESTIONNAIRE_ENABLED=true, like the adult one.
export default function YouthProfilePage() {
  if (!isQuestionnaireEnabled()) notFound()
  return <QuestionnaireForm variant="youth" />
}
