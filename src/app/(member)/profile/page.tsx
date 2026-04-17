// TODO Phase 1: fetch real data from GymMaster API + Supabase members table
// const member = await getMemberAccount(session.token)
// const memberships = await getMemberships(session.token)

export default function ProfilePage() {
  return (
    <div>
      <p className="text-[11px] tracking-[0.3em] uppercase text-brand mb-2">
        Member
      </p>
      <h1 className="font-display text-5xl md:text-6xl text-text-primary leading-[0.95] mb-8">
        My Profile
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">

        {/* Personal details */}
        <div className="bg-bg-card border border-border-light rounded-2xl p-6 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand via-brand-light to-transparent" />
          <h2 className="font-semibold text-text-primary mb-4">
            Personal Details
          </h2>
          <div className="space-y-3 text-sm">
            {[
              { label: "Full Name", value: "—" },
              { label: "Email", value: "—" },
              { label: "Phone", value: "—" },
              { label: "Date of Birth", value: "—" },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between items-center border-b border-border-light pb-2 last:border-0 last:pb-0">
                <span className="text-text-secondary">{label}</span>
                <span className="text-text-primary font-medium">{value}</span>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-text-secondary/60 italic mt-4">
            Details are managed in GymMaster — contact your coach to update.
          </p>
        </div>

        {/* Membership & Billing */}
        <div className="bg-bg-card border border-border-light rounded-2xl p-6 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand via-brand-light to-transparent" />
          <h2 className="font-semibold text-text-primary mb-4">
            Membership & Billing
          </h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center border-b border-border-light pb-2">
              <span className="text-text-secondary">Status</span>
              <span className="inline-flex items-center gap-1.5 text-status-green font-medium">
                <span className="w-2 h-2 rounded-full bg-status-green inline-block" />
                Active
              </span>
            </div>
            <div className="flex justify-between items-center border-b border-border-light pb-2">
              <span className="text-text-secondary">Membership Type</span>
              <span className="text-text-primary font-medium">—</span>
            </div>
            <div className="flex justify-between items-center border-b border-border-light pb-2">
              <span className="text-text-secondary">Member Since</span>
              <span className="text-text-primary font-medium">—</span>
            </div>
            <div className="flex justify-between items-center border-b border-border-light pb-2">
              <span className="text-text-secondary">Next Renewal</span>
              <span className="text-text-primary font-medium">—</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-text-secondary">Last Payment</span>
              <span className="text-text-primary font-medium">—</span>
            </div>
          </div>
          <p className="text-[11px] text-text-secondary/60 italic mt-4">
            🚧 Pulled from GymMaster memberships API — Phase 1.
          </p>
        </div>

        {/* Notification preferences */}
        <div className="bg-bg-card border border-border-light rounded-2xl p-6 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand via-brand-light to-transparent" />
          <h2 className="font-semibold text-text-primary mb-4">
            Notifications
          </h2>
          <div className="space-y-3">
            {[
              { label: "New education content", hint: "When a new pathway or module is published" },
              { label: "Challenge updates", hint: "Leaderboard changes and challenge completions" },
              { label: "Awards & recognition", hint: "When you or a member receives an award" },
              { label: "Gym announcements", hint: "Closures, program changes, events" },
            ].map(({ label, hint }) => (
              <label key={label} className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  disabled
                  defaultChecked
                  className="mt-0.5 rounded border-border-light disabled:opacity-50"
                />
                <div>
                  <p className="text-sm text-text-primary">{label}</p>
                  <p className="text-xs text-text-secondary">{hint}</p>
                </div>
              </label>
            ))}
          </div>
          <p className="text-[11px] text-text-secondary/60 italic mt-4">
            🚧 Saves to member preferences — Phase 1.
          </p>
        </div>

        {/* Data & Privacy */}
        <div className="bg-bg-card border border-border-light rounded-2xl p-6 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand via-brand-light to-transparent" />
          <h2 className="font-semibold text-text-primary mb-4">
            Data & Privacy
          </h2>
          <p className="text-sm text-text-secondary mb-4 leading-relaxed">
            Your body composition, fitness test results, attendance, and education
            progress are stored securely and only accessible to you and Number One
            HSP coaches. Your data consent was recorded when you signed your
            GymMaster membership agreement.
          </p>
          <div className="space-y-2">
            <button
              disabled
              className="w-full text-left text-sm text-brand hover:text-brand-dark transition-colors disabled:opacity-50"
            >
              Request a copy of my data →
            </button>
            <button
              disabled
              className="w-full text-left text-sm text-status-red hover:opacity-80 transition-opacity disabled:opacity-50"
            >
              Request account deletion →
            </button>
          </div>
          <p className="text-[11px] text-text-secondary/60 italic mt-4">
            🚧 Data export and deletion requests — Phase 5 (GDPR compliance).
          </p>
        </div>

      </div>
    </div>
  );
}
