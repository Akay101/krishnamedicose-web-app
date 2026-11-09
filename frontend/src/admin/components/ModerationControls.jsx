import { Check, X } from 'lucide-react';
import { ModerationBadge } from '../../components/services/ListingBadges';

const MODERATION_FILTERS = [
  { value: 'pending', label: 'Pending review' },
  { value: 'approved', label: 'Verified' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'All', label: 'All' }
];

export function ModerationFilter({ value, onChange, pendingCount }) {
  return (
    <div className="flex flex-wrap gap-2">
      {MODERATION_FILTERS.map((f) => (
        <button
          key={f.value}
          type="button"
          onClick={() => onChange(f.value)}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
            value === f.value ? 'bg-ink-900 text-white' : 'bg-ink-100 text-ink-600 hover:bg-ink-200'
          }`}
        >
          {f.label}
          {f.value === 'pending' && pendingCount > 0 && (
            <span className="ml-1.5 rounded-full bg-saffron-400 px-1.5 text-[10px] font-bold text-ink-950">{pendingCount}</span>
          )}
        </button>
      ))}
    </div>
  );
}

export function ReviewActions({ listing, onApprove, onReject }) {
  const status = listing.moderationStatus;
  return (
    <div className="flex flex-col items-start gap-1.5">
      <ModerationBadge status={status} />
      <div className="flex gap-1">
        {status !== 'approved' && status !== undefined && (
          <button
            type="button"
            onClick={() => onApprove(listing)}
            className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2 py-1 text-[10px] font-bold text-white hover:bg-emerald-700"
          >
            <Check className="h-3 w-3" /> Approve
          </button>
        )}
        {status !== 'rejected' && (
          <button
            type="button"
            onClick={() => onReject(listing)}
            className="inline-flex items-center gap-1 rounded-lg bg-white px-2 py-1 text-[10px] font-bold text-rose-700 ring-1 ring-inset ring-rose-200 hover:bg-rose-50"
          >
            <X className="h-3 w-3" /> Reject
          </button>
        )}
      </div>
      {status === 'rejected' && listing.moderationNote && (
        <p className="max-w-[180px] text-[10px] text-rose-600">{listing.moderationNote}</p>
      )}
    </div>
  );
}

