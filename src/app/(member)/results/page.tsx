import Link from "next/link";

const CARDS = [
  {
    href: "/goals",
    emoji: "🎯",
    title: "Goals & Events",
    subtitle: "Your targets and upcoming event logging",
  },
  {
    href: "/results/strength",
    emoji: "🏋️",
    title: "S&C Testing",
    subtitle: "Your strength & conditioning testing history and PBs",
  },
  {
    href: "/results/body-composition",
    emoji: "⚖️",
    title: "InBody / Body Composition",
    subtitle: "Weight, muscle mass and body fat over time",
  },
  {
    href: "/nutrition",
    emoji: "🥗",
    title: "Nutrition",
    subtitle: "Your daily food and macro log",
  },
  {
    href: "/wellbeing",
    emoji: "💗",
    title: "Wellbeing",
    subtitle: "Your check-in questionnaires",
  },
  {
    href: "/messages",
    emoji: "💬",
    title: "Messages",
    subtitle: "Chat with your coach",
  },
  {
    href: "/results/snapshot",
    emoji: "📊",
    title: "Athlete Snapshot",
    subtitle: "Your full performance summary — body comp, strength PBs and upcoming events",
  },
];

export default function TrackingHubPage() {
  return (
    <div>
      <h1 className="font-display text-5xl md:text-6xl text-text-primary leading-[0.95] mb-8">
        My Tracking
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
        {CARDS.map(({ href, emoji, title, subtitle }) => (
          <Link
            key={href}
            href={href}
            className="group bg-bg-card border border-border-light rounded-2xl shadow-sm relative overflow-hidden hover:border-brand/40 transition-colors"
          >
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand via-brand-light to-transparent" />
            <div className="p-6 flex items-start gap-4">
              <span className="text-3xl leading-none mt-0.5">{emoji}</span>
              <div>
                <h2 className="font-semibold text-text-primary text-base mb-1 group-hover:text-brand transition-colors">
                  {title}
                </h2>
                <p className="text-sm text-text-secondary leading-snug">{subtitle}</p>
              </div>
            </div>
            <div className="px-6 pb-4 flex items-center justify-end">
              <span className="text-xs font-medium text-brand opacity-0 group-hover:opacity-100 transition-opacity">
                View →
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
