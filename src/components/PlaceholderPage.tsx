type Props = {
  title: string;
  description?: string;
  eyebrow?: string;
};

export default function PlaceholderPage({ title, description, eyebrow }: Props) {
  return (
    <div>
      {eyebrow && (
        <p className="text-[11px] tracking-[0.3em] uppercase text-brand mb-3">
          {eyebrow}
        </p>
      )}
      <h1 className="font-display text-5xl md:text-6xl text-text-primary mb-4 leading-[0.95]">
        {title}
      </h1>
      {description && (
        <p className="text-text-secondary text-base max-w-2xl">{description}</p>
      )}

      <div className="mt-10 bg-bg-card border border-border-light rounded-2xl p-6 md:p-8 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand via-brand-light to-brand" />
        <div className="flex items-center gap-3 text-text-secondary text-sm">
          <span className="inline-block w-2 h-2 rounded-full bg-status-amber" />
          Phase 1 skeleton — content for this page will be built in a later phase.
        </div>
      </div>
    </div>
  );
}
