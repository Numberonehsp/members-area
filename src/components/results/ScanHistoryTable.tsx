"use client";

import { useRouter } from "next/navigation";
import type { InBodyScan } from "@/lib/staffhub";
import InlineDeleteConfirm from "@/components/results/InlineDeleteConfirm";

function formatDateLabel(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });
}

type Props = {
  scans: InBodyScan[];
  canDelete: boolean;
};

export default function ScanHistoryTable({ scans, canDelete }: Props) {
  const router = useRouter();

  async function handleDelete(id: string) {
    await fetch("/api/inbody/member", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    router.refresh();
  }

  // scans arrive newest-first from fetchMemberScans
  return (
    <div className="bg-bg-card border border-border-light rounded-2xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-border-light">
        <h2 className="font-semibold text-text-primary text-sm">Scan History</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-light bg-bg-main/50">
              {["Date", "Weight", "SMM", "BF%", "BF Mass"].map((col) => (
                <th key={col} className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  {col}
                </th>
              ))}
              {canDelete && <th className="px-4 py-3" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-border-light">
            {scans.map((scan, i) => {
              const isLatest = i === 0;
              return (
                <tr
                  key={scan.id}
                  className={isLatest ? "bg-brand/5" : "hover:bg-bg-main/60 transition-colors"}
                >
                  <td className="px-4 py-3 font-medium text-text-primary text-xs">
                    {formatDateLabel(scan.scan_date)}
                    {isLatest && (
                      <span className="ml-2 text-[10px] font-semibold text-brand bg-brand/10 px-2 py-0.5 rounded-full">
                        Latest
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-data text-text-primary">{scan.weight != null ? `${scan.weight} kg` : "—"}</td>
                  <td className="px-4 py-3 font-data text-text-primary">{scan.smm != null ? `${scan.smm} kg` : "—"}</td>
                  <td className="px-4 py-3 font-data text-text-primary">{scan.bf_pct != null ? `${scan.bf_pct}%` : "—"}</td>
                  <td className="px-4 py-3 font-data text-text-primary">{scan.bf_mass != null ? `${scan.bf_mass} kg` : "—"}</td>
                  {canDelete && (
                    <td className="px-4 py-3 text-right">
                      <InlineDeleteConfirm onConfirm={() => handleDelete(scan.id)} />
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="px-5 py-3 border-t border-border-light">
        <span className="text-xs text-text-secondary">{scans.length} scan{scans.length !== 1 ? "s" : ""} recorded</span>
      </div>
    </div>
  );
}
