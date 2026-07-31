// =============================================
// Education access control
//
// Content is tagged with a required_plan. A member's
// access is the union of plans granted by their active
// GymMaster memberships. The mapping below is the only
// place you need to update when memberships change.
// =============================================

export type EducationPlan = 'foundations' | 'gym-only' | 'sweat' | 'perform' | 'nutrition'

// Maps GymMaster membership names → plan tags.
// Perform is a superset: it includes all plans.
// Add a new membership by adding one line here.
export const MEMBERSHIP_PLAN_MAP: Partial<Record<string, EducationPlan[]>> = {
  'Foundations Program':         ['foundations'],
  'Gym Only':                    ['gym-only'],
  'Sweat':                       ['gym-only', 'sweat'],
  'Sweat 6 Month':               ['gym-only', 'sweat'],
  'Perform':                     ['gym-only', 'sweat', 'perform', 'nutrition'],
  'Perform 6 Month':             ['gym-only', 'sweat', 'perform', 'nutrition'],
  'Nutrition Support':           ['nutrition'],  // future GymMaster membership
}

export const PLAN_LABELS: Record<EducationPlan | 'free', string> = {
  free:          'Free to all members',
  foundations:   'Foundations Programme',
  'gym-only':    'Gym Only+',
  sweat:         'Sweat+',
  perform:       'Perform only',
  nutrition:     'Nutrition add-on',
}

export const PLAN_OPTIONS: { value: EducationPlan | ''; label: string }[] = [
  { value: '',            label: 'Free to all members' },
  { value: 'foundations', label: 'Foundations Programme only' },
  { value: 'gym-only',    label: 'Gym Only and above' },
  { value: 'sweat',       label: 'Sweat and above' },
  { value: 'perform',     label: 'Perform only' },
  { value: 'nutrition',   label: 'Nutrition add-on' },
]

/** Parse the gymmaster_plans cookie value into a Set of plan tags. */
export function parseMemberPlans(cookieValue: string | undefined): Set<string> {
  if (!cookieValue) return new Set()
  return new Set(cookieValue.split(',').map(s => s.trim()).filter(Boolean))
}

/**
 * Determine whether a member can access content with the given required_plan.
 *
 * 'full'   — member has access
 * 'locked' — member can see the content exists but cannot open it (upgrade prompt)
 * 'hidden' — content is completely hidden
 *
 * `kind` distinguishes two very different foundations use cases:
 * - 'pathway'  — a foundations programme, e.g. "Foundations Recovery". Members
 *   not on the programme should still see it exists (locked, like any other
 *   paid pathway) so they know the content is there.
 * - 'resource' (default) — an individual per-session PDF sent by a coach after
 *   a specific 1-to-1 session (e.g. "Recovery 1"). These stay fully hidden
 *   from everyone else — they're personal session materials, not a general
 *   upgrade prompt, and showing them to non-foundations members would be
 *   confusing (nothing to "unlock" — they were never sent that session).
 */
export function canAccess(
  requiredPlan: EducationPlan | null | undefined,
  memberPlans: Set<string>,
  kind: 'pathway' | 'resource' = 'resource'
): 'full' | 'locked' | 'hidden' {
  if (!requiredPlan) return 'full'
  if (memberPlans.has(requiredPlan)) return 'full'
  if (requiredPlan === 'foundations') return kind === 'pathway' ? 'locked' : 'hidden'
  return 'locked'
}

/** Human-readable label for the plan required to unlock this content. */
export function upgradePlanLabel(requiredPlan: EducationPlan): string {
  return PLAN_LABELS[requiredPlan] ?? requiredPlan
}
