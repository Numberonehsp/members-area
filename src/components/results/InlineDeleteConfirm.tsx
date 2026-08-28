"use client";

import { useState } from "react";

type Props = {
  /** Perform the delete. The parent removes the row on resolve. */
  onConfirm: () => Promise<void> | void;
  className?: string;
};

export default function InlineDeleteConfirm({ onConfirm, className }: Props) {
  const [state, setState] = useState<"idle" | "confirming" | "deleting">("idle");

  if (state === "idle") {
    return (
      <button
        type="button"
        onClick={() => setState("confirming")}
        title="Delete"
        className={`text-text-muted hover:text-status-red transition-colors ${className ?? ""}`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
          <path d="M10 11v6M14 11v6" />
          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
        </svg>
      </button>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs ${className ?? ""}`}>
      <span className="text-status-red font-semibold">Delete?</span>
      <button
        type="button"
        disabled={state === "deleting"}
        onClick={async () => {
          setState("deleting");
          try {
            await onConfirm();
          } catch {
            setState("idle");
          }
        }}
        className="border border-status-red text-status-red rounded px-1.5 py-0.5 font-semibold disabled:opacity-50"
      >
        {state === "deleting" ? "…" : "Yes"}
      </button>
      <button
        type="button"
        disabled={state === "deleting"}
        onClick={() => setState("idle")}
        className="border border-border-light text-text-secondary rounded px-1.5 py-0.5 disabled:opacity-50"
      >
        No
      </button>
    </span>
  );
}
