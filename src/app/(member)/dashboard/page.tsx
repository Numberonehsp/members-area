import { cookies } from "next/headers";
import AnnouncementBanner from "@/components/dashboard/AnnouncementBanner";
import WelcomeBanner from "@/components/dashboard/WelcomeBanner";
import QuickStats from "@/components/dashboard/QuickStats";
import AttendanceStreak from "@/components/dashboard/AttendanceStreak";
import AttendanceWidget from "@/components/dashboard/AttendanceWidget";
import ChallengesPreview from "@/components/dashboard/ChallengesPreview";
import AwardsPreview from "@/components/dashboard/AwardsPreview";
import NextTestWeek from "@/components/dashboard/NextTestWeek";
import GymEvents from "@/components/dashboard/GymEvents";
import ContinueLearning from "@/components/education/ContinueLearning";
import { SEED_PATHWAYS, SEED_MODULES } from "@/lib/education-seed";
import { fetchAnnouncements } from "@/lib/staffhub";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const firstName = cookieStore.get("gymmaster_first_name")?.value || "there";

  // Fetch live announcements from Staff Hub (replaces hardcoded sample data)
  const announcements = await fetchAnnouncements();
  const latestAnnouncement = announcements[0] ?? null;

  const inProgressPathway = SEED_PATHWAYS.find(
    (p) => (p.completed_count ?? 0) > 0 && (p.completed_count ?? 0) < (p.module_count ?? 0)
  );
  const inProgressModule = inProgressPathway
    ? SEED_MODULES[inProgressPathway.id]?.find((m) => m.progress_status === "in_progress") ??
      SEED_MODULES[inProgressPathway.id]?.find(
        (m) => m.progress_status === "not_started" && !m.is_locked
      )
    : null;

  return (
    <div>
      {/* Welcome */}
      <WelcomeBanner firstName={firstName} />

      {/* Announcements — live from Staff Hub */}
      <AnnouncementBanner announcement={latestAnnouncement} />

      {/* Quick Stats — 4 key metrics */}
      <QuickStats />

      {/* Main grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Continue Learning */}
        {inProgressPathway && inProgressModule ? (
          <ContinueLearning pathway={inProgressPathway} module={inProgressModule} />
        ) : (
          <div className="bg-bg-card border border-border-light rounded-2xl p-5 relative overflow-hidden shadow-sm">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand via-brand-light to-transparent" />
            <h2 className="font-semibold text-text-primary text-sm mb-2">Continue Learning</h2>
            <p className="text-text-secondary text-sm">
              Start a pathway in the Education Hub to track your progress here.
            </p>
          </div>
        )}

        {/* Attendance streak — weekly heatmap */}
        <AttendanceStreak />

        {/* Commitment Club — monthly progress */}
        <AttendanceWidget />

        {/* Active Challenges — live from Staff Hub */}
        <ChallengesPreview />

        {/* Latest Awards */}
        <AwardsPreview />

        {/* Next Test Week */}
        <NextTestWeek />

        {/* Gym Events — live from Staff Hub */}
        <GymEvents />
      </div>
    </div>
  );
}
