import { cookies } from "next/headers";
import AnnouncementBanner from "@/components/dashboard/AnnouncementBanner";
import MessageNotification from "@/components/dashboard/MessageNotification";
import WelcomeBanner from "@/components/dashboard/WelcomeBanner";
import QuickStats from "@/components/dashboard/QuickStats";
import AttendanceStreak from "@/components/dashboard/AttendanceStreak";
import ChallengesPreview from "@/components/dashboard/ChallengesPreview";
import AwardsPreview from "@/components/dashboard/AwardsPreview";
import GymEvents from "@/components/dashboard/GymEvents";
import ContinueLearning from "@/components/education/ContinueLearning";
import CoachTasksPreview from "@/components/dashboard/CoachTasksPreview";
import { SEED_PATHWAYS, SEED_MODULES } from "@/lib/education-seed";
import { fetchAnnouncements } from "@/lib/staffhub";
import { getAnnualVisits } from "@/lib/gymmaster";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const firstName = cookieStore.get("gymmaster_first_name")?.value || "there";
  const gymMasterId = cookieStore.get("gymmaster_member_id")?.value ?? "";
  const token = cookieStore.get("gymmaster_token")?.value ?? "";

  // Visits this month — best-effort, fallback to 0
  let visitsThisMonth = 0;
  if (gymMasterId && gymMasterId !== "DEMO" && token && token !== "demo-token") {
    try {
      const annual = await getAnnualVisits(gymMasterId, token);
      const thisMonth = new Date().getMonth() + 1;
      visitsThisMonth = annual.find((m) => m.month === thisMonth)?.visitCount ?? 0;
    } catch {
      // silently ignore
    }
  }

  // Fetch live announcements from Staff Hub (replaces hardcoded sample data)
  const announcements = await fetchAnnouncements();
  const latestAnnouncement = announcements[0] ?? null;

  const inProgressPathway = SEED_PATHWAYS.filter(p => p.is_published !== false).find(
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

      {/* Coach message notification — shown when there are unread messages */}
      <MessageNotification gymMasterId={gymMasterId} />

      {/* Quick Stats — live InBody data + visits */}
      <QuickStats gymMasterId={gymMasterId} visitsThisMonth={visitsThisMonth} />

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

        {/* Attendance + Commitment Club — combined card */}
        <AttendanceStreak />

        {/* Gym Events — live from Staff Hub */}
        <GymEvents />

        {/* Active Challenges — live from Staff Hub */}
        <ChallengesPreview />

        {/* Latest Awards */}
        <AwardsPreview />

        {/* Coach-assigned tasks */}
        <CoachTasksPreview />

      </div>
    </div>
  );
}
