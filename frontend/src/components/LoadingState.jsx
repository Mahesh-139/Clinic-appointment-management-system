import React from "react";

/**
 * Shown while a page or section is fetching data. Keep the animation
 * subtle — a simple pulsing spinner, not a full loading illustration.
 */
export default function LoadingState({ label = "Loading..." }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-500">
      <div
        className="h-8 w-8 animate-spin rounded-full border-2 border-clinic-200 border-t-clinic-600"
        role="status"
        aria-label={label}
      />
      <p className="text-sm">{label}</p>
    </div>
  );
}
