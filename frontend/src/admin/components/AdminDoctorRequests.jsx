import { useCallback, useEffect, useState } from 'react';
import { Edit, Loader2, Search, ShieldCheck, Trash2, XCircle } from 'lucide-react';
import servicesApi from '../../utils/servicesApi';
import { useModal } from '../../context/ModalContext';
import { ModerationFilter, ReviewActions } from './ModerationControls';
import DoctorRequestModal from '../../components/services/DoctorRequestModal';

/** Admin: review "doctor looking for a chamber" requirements. */
export default function AdminDoctorRequests({ pendingCount = 0, onChanged }) {
  const { showModal } = useModal();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [moderation, setModeration] = useState('pending');
  const [rejecting, setRejecting] = useState(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(null);
  const [flash, setFlash] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await servicesApi.get('/admin/doctor-requests', { params: { search, moderation } });
      setItems(res.data || []);
    } finally {
      setLoading(false);
    }
  }, [search, moderation]);

  useEffect(() => {
    const t = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, search]);

  const review = async (item, action, note = '') => {
    setBusy(true);
    try {
      const res = await servicesApi.patch(`/admin/doctor-requests/${item._id}/moderate`, { action, note });
      setFlash(res.data.message);
      setTimeout(() => setFlash(''), 3500);
      setRejecting(null);
      setReason('');
      load();
      onChanged?.();
    } catch (err) {
      setFlash(err.response?.data?.message || 'Could not update the review.');
    } finally {
      setBusy(false);
    }
  };

  const remove = (item) =>
    showModal({
      title: 'Delete requirement?',
      message: 'This permanently removes the requirement and any chamber offers on it.',
      type: 'confirm',
      confirmText: 'Delete',
      onConfirm: async () => {
        await servicesApi.delete(`/admin/doctor-requests/${item._id}`);
        load();
        onChanged?.();
      }
    });

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title, specialization, city..."
            className="w-full rounded-xl border border-slate-200 py-2 pl-10 pr-4 text-xs focus:border-teal-600 focus:outline-none"
          />
        </div>
        <div className="mt-3">
          <ModerationFilter value={moderation} onChange={setModeration} pendingCount={pendingCount} />
        </div>
      </div>

      {flash && <p className="rounded-xl bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-700">{flash}</p>}

      <div className="space-y-3">
        {loading ? (
          <div className="flex justify-center py-12 text-teal-700">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <p className="rounded-2xl border border-slate-200 bg-white py-12 text-center text-sm text-slate-400">No doctor requirements found.</p>
        ) : (
          items.map((r) => (
            <div key={r._id} className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 flex-1 space-y-1">
                <p className="font-bold text-slate-900">{r.title}</p>
                <p className="text-xs text-slate-500">
                  Dr. {r.doctorId?.name} · {r.doctorId?.email} · {r.doctorId?.mobile}
                </p>
                <p className="flex items-center gap-1 text-xs">
                  {r.doctorId?.isVerified ? (
                    <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                      <ShieldCheck className="h-3.5 w-3.5" /> Doctor profile verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 font-semibold text-amber-700">
                      <XCircle className="h-3.5 w-3.5" /> Doctor profile not verified (Reg. no: {r.doctorId?.doctorDetails?.medicalRegistrationNumber || '—'})
                    </span>
                  )}
                </p>
                <p className="text-xs text-slate-600">
                  {r.specialization} · {r.preferredTimings} · {r.location?.city} (within {r.searchRadiusKm} km) · {r.expectedTerms}
                </p>
                <p className="line-clamp-2 text-xs text-slate-500">{r.description}</p>
              </div>
              <div className="flex items-start gap-4">
                <ReviewActions listing={r} onApprove={(l) => review(l, 'approve')} onReject={(l) => setRejecting(l)} />
                <div className="flex gap-1">
                  <button type="button" onClick={() => setEditing(r)} className="rounded-lg bg-slate-100 p-1.5 text-slate-700 hover:bg-slate-200" title="Edit">
                    <Edit className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => remove(r)} className="rounded-lg bg-rose-50 p-1.5 text-rose-700 hover:bg-rose-100" title="Delete">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {rejecting && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-ink-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md space-y-4 rounded-3xl bg-white p-6 shadow-2xl">
            <h3 className="font-display text-lg font-bold text-ink-900">Reject this requirement?</h3>
            <textarea rows={4} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} className="input resize-none" placeholder="Reason sent to the doctor" />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setRejecting(null)} className="btn-ghost px-4 py-2.5">Cancel</button>
              <button
                type="button"
                disabled={busy || reason.trim().length < 5}
                onClick={() => review(rejecting, 'reject', reason.trim())}
                className="btn bg-rose-600 px-4 py-2.5 text-white hover:bg-rose-700"
              >
                Reject & notify
              </button>
            </div>
          </div>
        </div>
      )}

      {editing && (
        <DoctorRequestModal key={editing._id} isOpen adminMode initialRequest={editing} onClose={() => setEditing(null)} onSaved={load} />
      )}
    </div>
  );
}
