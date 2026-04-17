export default async function CoachMemberDetailPage({
  params,
}: PageProps<"/coach/members/[id]">) {
  const { id } = await params;

  return (
    <div>
      <div className="mb-2">
        <a
          href="/coach/members"
          className="text-xs text-text-secondary hover:text-brand transition-colors"
        >
          ← All Members
        </a>
      </div>
      <p className="text-[11px] tracking-[0.3em] uppercase text-brand mb-2">
        Coach · Member Detail
      </p>
      <h1 className="font-display text-5xl md:text-6xl text-text-primary leading-[0.95] mb-1">
        Member
      </h1>
      <p className="text-text-secondary text-sm mb-8 font-mono text-xs">
        ID: {id}
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left column — member summary + coach notes */}
        <div className="flex flex-col gap-4">

          {/* Member summary card */}
          <div className="bg-bg-card border border-border-light rounded-2xl p-5 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand via-brand-light to-transparent" />
            <h2 className="font-semibold text-text-primary text-sm mb-3">
              Member Profile
            </h2>
            <div className="space-y-2 text-sm text-text-secondary">
              <p>Name: <span className="text-text-primary">—</span></p>
              <p>Email: <span className="text-text-primary">—</span></p>
              <p>Phone: <span className="text-text-primary">—</span></p>
              <p>Member since: <span className="text-text-primary">—</span></p>
              <p>Membership: <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-status-green inline-block" /> Active</span></p>
            </div>
            <p className="text-[11px] text-text-secondary/60 italic mt-3">
              🚧 Populated from GymMaster sync — Phase 1.
            </p>
          </div>

          {/* Coach Notes */}
          <div className="bg-bg-card border border-border-light rounded-2xl p-5 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand via-brand-light to-transparent" />
            <div className="flex items-center gap-2 mb-3">
              <h2 className="font-semibold text-text-primary text-sm">
                🗒 Coach Notes
              </h2>
              <span className="text-[10px] text-text-secondary/60 italic">
                — internal only, never shown to member
              </span>
            </div>
            <textarea
              rows={6}
              placeholder="e.g. Lower back niggle — avoid heavy deadlifts for now. Goal is first pull-up by June. Responds well to encouragement during metcons."
              disabled
              className="w-full text-sm border border-border-light rounded-lg px-3 py-2.5 bg-bg-main text-text-primary placeholder:text-text-secondary/40 disabled:opacity-60 resize-none leading-relaxed"
            />
            <div className="flex items-center justify-between mt-2">
              <p className="text-[11px] text-text-secondary/60 italic">
                🚧 Saves to members.coach_notes — Phase 1.
              </p>
              <button
                disabled
                className="bg-brand text-white text-xs font-semibold px-3 py-1.5 rounded-lg opacity-50 cursor-not-allowed"
              >
                Save Notes
              </button>
            </div>
          </div>

        </div>

        {/* Right columns — data panels */}
        <div className="lg:col-span-2 flex flex-col gap-4">

          {[
            { title: "Body Composition History", emoji: "⚖️", phase: "Phase 3", desc: "InBody scan trend — weight, SMM, BF%, BFM over time." },
            { title: "S&C Test Results", emoji: "🏋️", phase: "Phase 3", desc: "All testing blocks with PB highlights and trend charts." },
            { title: "Education Progress", emoji: "📚", phase: "Phase 2", desc: "Pathway completion, modules watched, quiz scores." },
            { title: "Attendance Log", emoji: "📅", phase: "Phase 1", desc: "Monthly visit calendar synced from GymMaster." },
          ].map((panel) => (
            <div
              key={panel.title}
              className="bg-bg-card border border-border-light rounded-2xl p-5 shadow-sm relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand via-brand-light to-transparent" />
              <div className="flex items-start justify-between gap-2 mb-1">
                <h2 className="font-semibold text-text-primary text-sm">
                  {panel.emoji} {panel.title}
                </h2>
                <span className="text-[10px] bg-status-amber/10 text-status-amber border border-status-amber/20 px-2 py-0.5 rounded-full shrink-0">
                  {panel.phase}
                </span>
              </div>
              <p className="text-text-secondary text-sm">{panel.desc}</p>
            </div>
          ))}

        </div>
      </div>
    </div>
  );
}
