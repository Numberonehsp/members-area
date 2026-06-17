import Link from "next/link";
import { getAllMembers } from "@/lib/gymmaster";
import {
  fetchMemberScans,
  fetchMemberStrengthResults,
  fetchAllMemberEvents,
} from "@/lib/staffhub";
import type { InBodyScan, StrengthResult, MemberEvent } from "@/lib/staffhub";
import AthleteSnapshotView from "@/components/results/AthleteSnapshotView";

export const dynamic = "force-dynamic";

export default async function CoachAthleteSnapshotPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [allMembers, scans, strengthResults, events] = await Promise.all([
    getAllMembers(),
    fetchMemberScans(id),
    fetchMemberStrengthResults(id),
    fetchAllMemberEvents(id),
  ]) as [Awaited<ReturnType<typeof getAllMembers>>, InBodyScan[], StrengthResult[], MemberEvent[]];

  const member = allMembers.find((m) => m.id === id);
  const memberName = member ? `${member.firstName} ${member.lastName}` : `Member #${id}`;

  return (
    <div className="max-w-3xl">
      <div className="mb-2 flex items-center gap-2 text-xs text-text-secondary">
        <Link href="/coach/members" className="hover:text-brand transition-colors">All Members</Link>
        <span>›</span>
        <Link href={`/coach/members/${id}`} className="hover:text-brand transition-colors">{memberName}</Link>
        <span>›</span>
        <span className="text-text-primary">Athlete Snapshot</span>
      </div>
      <p className="text-[11px] tracking-[0.3em] uppercase text-brand mb-2 font-semibold">Coach · Member Detail</p>
      <h1 className="font-display text-5xl md:text-6xl text-text-primary leading-[0.95] mb-2">
        {memberName}
      </h1>
      <p className="text-text-secondary text-sm mb-8">Athlete Snapshot</p>
      <AthleteSnapshotView
        scans={scans}
        strengthResults={strengthResults}
        events={events}
        isCoach
      />
    </div>
  );
}
