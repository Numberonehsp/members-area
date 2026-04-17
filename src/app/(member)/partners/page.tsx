type Partner = {
  name: string;
  category: string;
  emoji: string;
  description: string;
  offer: string;
  website: string;
};

const partners: Partner[] = [
  {
    name: "Fuel & Flourish Nutrition",
    category: "Nutrition",
    emoji: "🥗",
    description:
      "Sports nutrition consultancy offering HSP members a free initial consultation and 10% off all coaching packages.",
    offer: "Free initial consultation + 10% off",
    website: "fuelflourish.co.uk",
  },
  {
    name: "Physio First Cardiff",
    category: "Physiotherapy",
    emoji: "🩺",
    description:
      "Expert physiotherapy and sports injury rehabilitation. Priority booking for HSP members and a discounted first session.",
    offer: "Priority booking + 15% off first session",
    website: "physiofirstcardiff.co.uk",
  },
  {
    name: "Revive Recovery Studio",
    category: "Recovery",
    emoji: "💆",
    description:
      "Ice baths, infrared sauna, and compression therapy. Show your HSP membership for a member discount on every visit.",
    offer: "10% off every visit",
    website: "reviverecovery.co.uk",
  },
  {
    name: "Performance Lab Apparel",
    category: "Apparel",
    emoji: "👕",
    description:
      "Technical training wear designed for performance. HSP members get an exclusive discount code — ask at the front desk.",
    offer: "Exclusive member discount",
    website: "perflab.co.uk",
  },
  {
    name: "Cardiff Meal Prep Co.",
    category: "Nutrition",
    emoji: "🍱",
    description:
      "Weekly meal prep service tailored to your macros. Mention HSP Gym for a discount on your first order.",
    offer: "10% off first order",
    website: "cardiffmealprep.co.uk",
  },
  {
    name: "SleepWell Clinic",
    category: "Wellness",
    emoji: "😴",
    description:
      "Sleep coaching and CBT-I therapy. Poor sleep kills performance — HSP members get a reduced rate on consultations.",
    offer: "Reduced rate on consultations",
    website: "sleepwellclinic.co.uk",
  },
  {
    name: "MindStrong Psychology",
    category: "Mental Performance",
    emoji: "🧠",
    description:
      "Sports psychology and performance mindset coaching. Supporting your mental game alongside your physical training.",
    offer: "Free 20-minute discovery call",
    website: "mindstrongpsych.co.uk",
  },
  {
    name: "The Protein Bakery",
    category: "Nutrition",
    emoji: "🧁",
    description:
      "High-protein baked goods and snacks. Collection available at the gym on Fridays — pre-order via their website.",
    offer: "Friday collection available at HSP",
    website: "theproteinbakery.co.uk",
  },
];

const categories = [
  "All",
  "Nutrition",
  "Physiotherapy",
  "Recovery",
  "Apparel",
  "Wellness",
  "Mental Performance",
];

export default function PartnersPage() {
  return (
    <div>
      {/* Page header */}
      <p className="text-xs font-semibold uppercase tracking-widest text-brand mb-2">
        Partners
      </p>
      <h1 className="font-display text-5xl md:text-6xl text-text-primary leading-[0.95] mb-3">
        Gym Partners
      </h1>
      <p className="text-text-secondary text-sm mb-8">
        Exclusive offers and discounts for Number One HSP members.
      </p>

      {/* Category filter pills (static) */}
      <div className="flex flex-wrap gap-2 mb-2">
        {categories.map((cat) => (
          <span
            key={cat}
            className={
              cat === "All"
                ? "px-3 py-1 rounded-full text-xs font-medium bg-brand text-white"
                : "px-3 py-1 rounded-full text-xs font-medium border border-border-light text-text-secondary"
            }
          >
            {cat}
          </span>
        ))}
      </div>
      <p className="text-[10px] text-text-secondary mb-8 opacity-60">
        (more filtering coming soon)
      </p>

      {/* Partners grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {partners.map((partner) => (
          <div
            key={partner.name}
            className="bg-bg-card border border-border-light rounded-2xl shadow-sm relative overflow-hidden p-5 flex flex-col"
          >
            {/* Teal top accent bar */}
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand via-brand to-transparent" />

            {/* Emoji */}
            <span className="text-4xl leading-none mb-3 block">{partner.emoji}</span>

            {/* Category badge */}
            <span className="inline-block self-start px-2 py-0.5 rounded-full text-[10px] font-medium border border-border-light text-text-secondary mb-2">
              {partner.category}
            </span>

            {/* Name */}
            <h2 className="font-semibold text-text-primary text-sm mb-2">
              {partner.name}
            </h2>

            {/* Description */}
            <p className="text-xs text-text-secondary leading-snug line-clamp-3 mb-3 flex-1">
              {partner.description}
            </p>

            {/* Offer highlight */}
            <div className="rounded-lg px-3 py-2 mb-4 text-xs text-brand font-medium bg-brand/10 border border-brand/20">
              🎁 {partner.offer}
            </div>

            {/* Visit Website button */}
            <a
              href={`https://${partner.website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center text-xs font-medium border border-border-light text-text-secondary rounded-lg py-2 transition-colors hover:bg-brand hover:border-brand hover:text-white"
            >
              Visit Website →
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
