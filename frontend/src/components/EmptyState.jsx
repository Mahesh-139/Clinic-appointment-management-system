import React from "react";

/**
 * Shown when a list has no data yet. title/description should speak in the
 * interface's voice and, where relevant, tell the user what action to take.
 */
export default function EmptyState({ title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl2 border border-dashed border-slate-300 py-16 text-center">
      <h3 className="text-base font-semibold text-slate-800">{title}</h3>
      {description && <p className="max-w-sm text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
