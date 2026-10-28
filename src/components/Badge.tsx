import type { ReactNode } from "react";

const labels: Record<string, string> = {
  "on-track": "On track",
  good: "On track",
  valid: "Validated",
  confirmed: "Confirmed",
  critical: "Needs attention",
  bad: "Needs attention",
  high: "High priority",
  invalid: "Invalid",
  watch: "Watch",
  medium: "Medium priority",
  "needs-review": "Needs review",
  suggested: "Suggested",
  unavailable: "Cannot calculate",
  unresolved: "Unresolved",
  sample: "Sample data",
  low: "Low priority",
};

export function Badge({
  status = "sample",
  children,
}: {
  status?: string;
  children?: ReactNode;
}) {
  const tone = ["on-track", "good", "valid", "confirmed"].includes(status)
    ? "good"
    : ["critical", "bad", "high", "invalid"].includes(status)
      ? "bad"
      : ["watch", "medium", "needs-review", "suggested"].includes(status)
        ? "watch"
        : "neutral";
  return (
    <span className={`badge ${tone}`}>
      <span className="status-dot" aria-hidden="true" />
      {children ?? labels[status] ?? status}
    </span>
  );
}

export default Badge;
