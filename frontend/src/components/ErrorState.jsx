import React from "react";
import Button from "./Button.jsx";

/**
 * Shown when a request fails. Explains what happened and offers a retry —
 * never vague, never apologetic.
 */
export default function ErrorState({
  title = "Something went wrong",
  description = "We couldn't load this information. Please try again.",
  onRetry,
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl2 border border-red-200 bg-red-50 py-16 text-center">
      <h3 className="text-base font-semibold text-red-800">{title}</h3>
      <p className="max-w-sm text-sm text-red-600">{description}</p>
      {onRetry && (
        <div className="mt-3">
          <Button variant="secondary" onClick={onRetry}>
            Try again
          </Button>
        </div>
      )}
    </div>
  );
}
