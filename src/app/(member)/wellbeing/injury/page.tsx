import { notFound } from 'next/navigation'
import InjuryReport from '@/components/injury/InjuryReport'
import { isQuestionnaireEnabled } from '@/lib/questionnaire/enabled'

export const dynamic = 'force-dynamic'

// "Report an injury". Shares the questionnaire's on/off switch.
export default function InjuryPage() {
  if (!isQuestionnaireEnabled()) notFound()
  return <InjuryReport />
}
