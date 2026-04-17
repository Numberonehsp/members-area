import Link from "next/link";

type LeaderboardEntry = {
  rank: number;
  name: string;
  value: number;
  isMe?: boolean;
};

type ChallengeData = {
  title: string;
  description: string;
  type: "attendance" | "education";
  target: number;
  unit: string;
  startDate: string;
  endDate: string;
  daysLeft: number;
  current: number;
  joined: boolean;
  leaderboard: LeaderboardEntry[];
};

const CHALLENGES: Record<string, ChallengeData> = {
  "1": {
    title: "April Attendance Challenge",
    description:
      "Hit 16 visits this month and earn your place on the leaderboard. Every session counts.",
    type: "attendance",
    target: 16,
    unit: "visits",
    startDate: "1 Apr 2026",
    endDate: "30 Apr 2026",
    daysLeft: 21,
    current: 9,
    joined: true,
    leaderboard: [
      { rank: 1, name: "Morgan Evans", value: 18 },
      { rank: 2, name: "Priya Sharma", value: 16 },
      { rank: 3, name: "Alex Johnson", value: 14 },
      { rank: 4, name: "Ed Harper", value: 9, isMe: true },
      { rank: 5, name: "Sam Davies", value: 8 },
    ],
  },
  "2": {
    title: "Nutrition Pathway Sprint",
    description:
      "Complete 4 modules from the Nutrition Foundations pathway before the deadline. Learn while you compete.",
    type: "education",
    target: 4,
    unit: "modules",
    startDate: "1 Apr 2026",
    endDate: "14 Apr 2026",
    daysLeft: 14,
    current: 2,
    joined: true,
    leaderboard: [
      { rank: 1, name: "Priya Sharma", value: 4 },
      { rank: 2, name: "Ed Harper", value: 2, isMe: true },
      { rank: 3, name: "Alex Johnson", value: 2 },
      { rank: 4, name: "Sam Davies", value: 1 },
    ],
  },
};

const MEDALS = ["🥇", "🥈", "🥉"];

export default async function ChallengeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const challenge = CHALLENGES[id];

  if (!challenge) {
    return (
      <div className="py-16 text-center">
        <p className="text-text-secondary text-sm mb-4">Challenge not found.</p>
        <Link
          href="/community"
          className="text-brand text-sm font-medium hover:underline"
        >
          ← Back to Community
        </Link>
      </div>
    );
  }

  const pct = Math.min(100, Math.round((challenge.current / challenge.target) * 100));
  const onTrack = challenge.current / challenge.target >= (1 - challenge.daysLeft / 30);
  const typeBadgeClass =
    challenge.type === "attendance"
      ? "bg-brand/10 text-brand border border-brand/20"
      : "bg-status-amber/10 text-status-amber border border-status-amber/20";
  const typeLabel = challenge.type === "attendance" ? "Attendance" : "Education";

  return (
    <div>
      {/* Back link */}
      <Link
        href="/community"
        className="inline-flex items-center gap-1 text-xs text-text-secondary hover:text-brand transition-colors mb-6 font-medium"
      >
        ← Community
      </Link>

      {/* Header */}
      <div className="mb-8">
        <span
          className={`inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-full mb-3 ${typeBadgeClass}`}
        >
          {typeLabel}
        </span>
        <h1 className="font-display text-5xl md:text-6xl text-text-primary leading-[0.95] mb-3">
          {challenge.title}
        </h1>
        <p className="text-text-secondary text-sm max-w-prose">
          {challenge.description}
        </p>
      </div>

      {/* Dates + days left */}
      <div className="flex flex-wrap items-center gap-3 mb-8">
        <span className="text-xs text-text-secondary font-medium">
          {challenge.startDate} — {challenge.endDate}
        </span>
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-bg-card border border-border-light text-text-primary">
          <span className="w-1.5 h-1.5 rounded-full bg-brand inline-block" />
          {challenge.daysLeft} days left
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* My Progress card */}
        <div className="bg-bg-card border border-border-light rounded-2xl p-6 relative overflow-hidden shadow-sm">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand via-brand-light to-transparent" />
          <h2 className="font-semibold text-text-primary text-sm mb-5">My Progress</h2>

          {/* Big number */}
          <div className="flex items-end gap-2 mb-1">
            <span className="font-display text-6xl text-text-primary leading-none font-data">
              {challenge.current}
            </span>
            <span className="text-text-secondary text-xl mb-1.5 font-data">
              / {challenge.target}
            </span>
          </div>
          <p className="text-xs text-text-secondary mb-4 capitalize">{challenge.unit}</p>

          {/* Progress bar */}
          <div className="w-full bg-border-light rounded-full h-2.5 mb-2 overflow-hidden">
            <div
              className="h-full bg-brand rounded-full transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="flex items-center justify-between mb-4">
            <span className="font-data text-xs text-text-secondary">{pct}% complete</span>
          </div>

          <p className={`text-sm font-semibold ${onTrack ? "text-status-green" : "text-status-amber"}`}>
            {onTrack ? "You're on track! 💪" : "Keep going!"}
          </p>
        </div>

        {/* Leaderboard card */}
        <div className="bg-bg-card border border-border-light rounded-2xl p-6 relative overflow-hidden shadow-sm">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand via-brand-light to-transparent" />
          <h2 className="font-semibold text-text-primary text-sm mb-5">Leaderboard</h2>

          <ol className="space-y-2">
            {challenge.leaderboard.map((entry) => (
              <li
                key={entry.rank}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl ${
                  entry.isMe
                    ? "bg-brand/5 border border-brand/20"
                    : "bg-bg-main border border-transparent"
                }`}
              >
                <span className="w-6 text-center text-sm leading-none">
                  {entry.rank <= 3 ? MEDALS[entry.rank - 1] : (
                    <span className="font-data text-xs text-text-secondary">{entry.rank}</span>
                  )}
                </span>
                <span
                  className={`flex-1 text-sm font-medium ${
                    entry.isMe ? "text-brand" : "text-text-primary"
                  }`}
                >
                  {entry.name}
                  {entry.isMe && (
                    <span className="ml-2 text-[10px] font-semibold text-brand bg-brand/10 px-1.5 py-0.5 rounded-full">
                      You
                    </span>
                  )}
                </span>
                <span className="font-data text-sm text-text-primary font-semibold">
                  {entry.value}
                  <span className="text-text-secondary font-normal text-xs ml-1">
                    {challenge.unit}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* Join / Leave button */}
      <div className="mt-6">
        <button className="text-sm font-semibold px-5 py-2.5 rounded-xl border transition-colors border-border-light text-text-secondary hover:border-status-red/40 hover:text-status-red">
          {challenge.joined ? "Leave Challenge" : "Join Challenge"}
        </button>
      </div>
    </div>
  );
}
