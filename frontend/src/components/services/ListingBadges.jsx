import { BadgeCheck, Clock3, XCircle } from "lucide-react";

/** Shown on every public listing: only admin-approved posts reach the feeds. */
export function VerifiedBadge({ compact = false }) {
  return (
    <span
      title="Reviewed and verified by the Krishna Medicose team"
      className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-700 ring-1 ring-inset ring-brand-200"
    >
      <BadgeCheck className="h-3 w-3" />
      {compact ? "Verified" : "Verified by Krishna Medicose"}
    </span>
  );
}

/** Review state of the member's own listing. Legacy rows without a status count as approved. */
export function ModerationBadge({ status }) {
  if (status === "pending") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-saffron-50 px-2 py-0.5 text-[10px] font-bold text-saffron-600 ring-1 ring-inset ring-saffron-200">
        <Clock3 className="h-3 w-3" /> Verification pending
      </span>
    );
  }
  if (status === "rejected") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700 ring-1 ring-inset ring-rose-200">
        <XCircle className="h-3 w-3" /> Not approved
      </span>
    );
  }
  return <VerifiedBadge />;
}

/** Explains what happens next for a pending / rejected listing. */
export function ModerationNotice({ listing }) {
  if (listing?.moderationStatus === "pending") {
    return (
      <p className="rounded-xl bg-saffron-50 px-3 py-2 text-[11px] font-medium text-saffron-600">
        Hidden from members until the Krishna Medicose team verifies it. You'll get an email once it's approved.
      </p>
    );
  }
  if (listing?.moderationStatus === "rejected") {
    return (
      <p className="rounded-xl bg-rose-50 px-3 py-2 text-[11px] font-medium text-rose-700">
        Not approved{listing.moderationNote ? `: ${listing.moderationNote}` : "."} Edit the listing to send it for review again.
      </p>
    );
  }
  return null;
}
