// Short privacy and data protection notice shown before a member consents to
// share health information. Draft wording: needs the owner's sign-off.

export default function PrivacyNotice({ what = 'these answers' }: { what?: string }) {
  return (
    <div className="rounded-xl border border-border-light bg-bg-main p-4 text-xs text-text-secondary space-y-1.5" aria-label="Privacy notice">
      <p className="font-semibold text-text-primary text-sm">How we use {what}</p>
      <p>
        Number One HSP collects this health information so your coaches can plan your training safely and talk it through with you at check-ins. It is optional.
      </p>
      <p>
        Your coaches can see it. We do not sell it or use it for marketing, and we only share it outside the gym if you ask us to or the law requires it. We keep it while you are a member.
      </p>
      <p>You can ask us to show you, correct or delete it at any time: speak to any coach or message the team in this app.</p>
    </div>
  )
}
