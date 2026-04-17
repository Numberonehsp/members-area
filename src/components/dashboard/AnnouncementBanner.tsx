type Announcement = {
  id: string;
  title: string;
  body: string | null;
  priority: string;
  published_at: string;
};

type Props = {
  announcements: Announcement[];
};

export default function AnnouncementBanner({ announcements }: Props) {
  if (!announcements || announcements.length === 0) return null;

  return (
    <div className="flex flex-col gap-3 mb-6">
      {announcements.map((a) => (
        <div
          key={a.id}
          className={`rounded-xl px-5 py-4 border-l-4 ${
            a.priority === "high"
              ? "bg-brand/10 border-brand"
              : "bg-bg-card border-border-light"
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p
                className={`font-semibold text-sm ${
                  a.priority === "high" ? "text-brand" : "text-text-primary"
                }`}
              >
                {a.priority === "high" && (
                  <span className="mr-1.5">📌</span>
                )}
                {a.title}
              </p>
              {a.body && (
                <p className="text-text-secondary text-sm mt-1 leading-relaxed">
                  {a.body}
                </p>
              )}
            </div>
            <span className="shrink-0 text-[11px] text-text-secondary whitespace-nowrap">
              {new Date(a.published_at).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
              })}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
