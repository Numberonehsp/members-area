import Link from "next/link";
import { cookies } from "next/headers";
import {
  fetchMemberScans,
  fetchMemberStrengthResults,
  fetchAllMemberEvents,
} from "@/lib/staffhub";
import type { InBodyScan, StrengthResult, MemberEvent } from "@/lib/staffhub";
import AthleteSnapshotView from "@/components/results/AthleteSnapshotView";

export const dynamic = "force-dynamic";

export default async function AthleteSnapshotPage() {
  const cookieStore = await cookies();
  const gymMasterId = cookieStore.get("gymmaster_member_id")?.value ?? "";

  const [scans, strengthResults, events] = await Promise.all([
    gymMasterId ? fetchMemberScans(gymMasterId) : Promise.resolve([] as InBodyScan[]),
    gymMasterId ? fetchMemberStrengthResults(gymMasterId) : Promise.resolve([] as StrengthResult[]),
    gymMasterId ? fetchAllMemberEvents(gymMasterId) : Promise.resolve([] as MemberEvent[]),
  ]);

  return (
    <div className="max-w-3xl">
      <Link
        href="/results"
        className="text-xs text-brand hover:text-brand-dark transition-colors font-medium inline-flex items-center gap-1 mb-3"
      >
        ← My Results
      </Link>
      <p className="text-[11px] tracking-[0.3em] uppercase text-brand mb-2 font-semibold">Results</p>
      <h1 className="font-display text-5xl md:text-6xl text-text-primary leading-[0.95] mb-8">
        Athlete Snapshot
      </h1>
      <AthleteSnapshotView
        scans={scans}
        strengthResults={strengthResults}
        events={events}
        goalsHref="/goals"
      />
    </div>
  );
}
