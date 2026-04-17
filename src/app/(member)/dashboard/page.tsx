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

// TODO Phase 1: replace with real Supabase + GymMaster data once auth is wired
const SAMPLE_ANNOUNCEMENTS = [
  {
    id: "1",
    title: "New testing block starts Monday 14th April",
    body: "Make sure you've booked in for your testing session. Results will be available in your dashboard the same day.",
    priority: "high",
    published_at: new Date().toISOString(),
  },
  {
    id: "2",
    title: "Gym closed Easter Bank Holiday — Friday 18th & Monday 21st April",
    body: null,
    priority: "normal",
    published_at: new Date().toISOString(),
  },
];

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const firstName = cookieStore.get("gymmaster_first_name")?.value || "there";

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

      {/* Announcements */}
      <AnnouncementBanner announcements={SAMPLE_ANNOUNCEMENTS} />

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

        {/* Active Challenges */}
        <ChallengesPreview />

        {/* Latest Awards */}
        <AwardsPreview />

        {/* Next Test Week */}
        <NextTestWeek />

        {/* Gym Events */}
        <GymEvents />
      </div>
    </div>
  );
}
