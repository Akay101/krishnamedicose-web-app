import { useCallback, useEffect, useState } from "react";
import { Check, Edit, Inbox, Loader2, Pause, Play, Plus, Trash2, X } from "lucide-react";
import servicesApi from "../../utils/servicesApi";
import { ModerationBadge, ModerationNotice } from "./ListingBadges";
import DoctorRequestModal from "./DoctorRequestModal";
import { useModal } from "../../context/ModalContext";
import { assetUrl } from "../../utils/assetUrl";

function OffersDrawer({ request, onClose }) {
  const [offers, setOffers] = useState(null);
  const load = useCallback(() => {
    servicesApi.get(`/doctor-requests/${request._id}/responses`).then((r) => setOffers(r.data)).catch(() => setOffers([]));
  }, [request._id]);
  useEffect(load, [load]);

  const setStatus = async (id, status) => {
    await servicesApi.patch(`/doctor-requests/responses/${id}/status`, { status });
    load();
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-end justify-center bg-ink-950/70 backdrop-blur-sm sm:items-center sm:p-6">
      <div className="flex max-h-[90dvh] w-full max-w-xl flex-col overflow-hidden bg-white shadow-2xl sm:rounded-3xl">
        <div className="flex items-start justify-between gap-3 border-b border-ink-100 px-5 py-4">
          <div>
            <p className="text-xs font-semibold text-sky-700">Chamber offers</p>
            <h3 className="font-display text-lg font-bold text-ink-900">{request.title}</h3>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl p-2 text-ink-400 hover:bg-ink-100" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 space-y-3 overflow-y-auto p-5">
          {offers === null ? (
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-sky-600" />
          ) : offers.length === 0 ? (
            <p className="py-8 text-center text-sm text-ink-500">No offers yet. You'll be emailed as soon as a pharmacy offers a chamber.</p>
          ) : (
            offers.map((o) => (
              <div key={o._id} className="rounded-2xl border border-ink-200/80 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-ink-900">{o.pharmacyName}</p>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${o.status === "accepted" ? "bg-emerald-50 text-emerald-700" : o.status === "declined" ? "bg-rose-50 text-rose-700" : "bg-ink-100 text-ink-600"}`}>
                    {o.status}
                  </span>
                </div>
                <p className="mt-1 text-xs text-ink-500">{o.responderName} · {o.responderMobile} · {o.responderEmail}</p>
                <p className="mt-2 text-sm text-ink-700">{o.message}</p>
                {o.chamberPostId && (
                  <div className="mt-3 flex gap-3 rounded-xl bg-ink-50 p-3 text-xs text-ink-700">
                    {o.chamberPostId.images?.[0] && (
                      <img src={assetUrl(o.chamberPostId.images[0])} alt="" className="h-14 w-14 shrink-0 rounded-lg object-cover" />
                    )}
                    <div>
                      <p className="font-semibold">{o.chamberPostId.clinicOrChamberName || o.chamberPostId.pharmacyName}</p>
                      <p>{o.chamberPostId.preferredTimings} · {o.chamberPostId.collaborationTerms}</p>
                      <p>{o.chamberPostId.location?.city}</p>
                    </div>
                  </div>
                )}
                {o.status === "pending" && (
                  <div className="mt-3 flex gap-2">
                    <button type="button" onClick={() => setStatus(o._id, "accepted")} className="btn-primary px-3 py-2 text-xs">
                      <Check className="h-4 w-4" /> Accept
                    </button>
                    <button type="button" onClick={() => setStatus(o._id, "declined")} className="btn-secondary px-3 py-2 text-xs">
                      Decline
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

/** Doctor: manage "looking for a chamber" requirements and the offers received. */
export default function MyDoctorRequests() {
  const { showModal } = useModal();
  const [items, setItems] = useState(null);
  const [editing, setEditing] = useState(null); // request object or {} for new
  const [viewingOffers, setViewingOffers] = useState(null);

  const load = useCallback(() => {
    servicesApi.get("/doctor-requests/my-requests").then((r) => setItems(r.data)).catch(() => setItems([]));
  }, []);
  useEffect(load, [load]);

  const toggleStatus = async (r) => {
    await servicesApi.put(`/doctor-requests/${r._id}`, { status: r.status === "active" ? "paused" : "active" });
    load();
  };

  const remove = (r) =>
    showModal({
      title: "Delete this requirement?",
      message: "Pharmacies will no longer see it and any offers will be removed.",
      type: "confirm",
      confirmText: "Delete",
      onConfirm: async () => {
        await servicesApi.delete(`/doctor-requests/${r._id}`);
        load();
      },
    });

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h4 className="font-display text-lg font-bold text-ink-900 sm:text-xl">My chamber requirements</h4>
          <p className="text-xs text-ink-500 sm:text-sm">Pharmacies near you can offer their chamber once a requirement is verified.</p>
        </div>
        <button type="button" onClick={() => setEditing({})} className="btn-primary self-start whitespace-nowrap sm:self-auto">
          <Plus className="h-4 w-4" /> Post requirement
        </button>
      </div>

      {items === null ? (
        <div className="h-32 animate-pulse rounded-2xl bg-ink-100" />
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink-200 bg-white px-6 py-10 text-center">
          <p className="text-sm font-semibold text-ink-700">You haven't posted a chamber requirement yet</p>
          <p className="mt-1 text-xs text-ink-500">Describe the chamber, timings and area you want — verified pharmacies will reach out.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((r) => (
            <article key={r._id} className="rounded-2xl border border-ink-200/80 bg-white p-4 shadow-soft sm:p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h5 className="font-semibold text-ink-900">{r.title}</h5>
                    <ModerationBadge status={r.moderationStatus} />
                    <span className="rounded-full bg-ink-100 px-2 py-0.5 text-[10px] font-bold uppercase text-ink-600">{r.status}</span>
                  </div>
                  <p className="text-xs text-ink-500">
                    {r.specialization} · {r.preferredTimings} · {r.location?.city || "Area not set"} (within {r.searchRadiusKm} km)
                  </p>
                  <p className="line-clamp-2 text-sm text-ink-600">{r.description}</p>
                  <ModerationNotice listing={r} />
                </div>
                <div className="flex flex-wrap items-center gap-2 md:flex-nowrap">
                  <button type="button" onClick={() => setViewingOffers(r)} className="btn-secondary whitespace-nowrap px-3 py-2 text-xs">
                    <Inbox className="h-4 w-4" /> Offers ({r.responsesCount || 0})
                  </button>
                  <button type="button" onClick={() => toggleStatus(r)} className="rounded-xl p-2 text-ink-500 hover:bg-ink-100" title={r.status === "active" ? "Pause" : "Activate"}>
                    {r.status === "active" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </button>
                  <button type="button" onClick={() => setEditing(r)} className="rounded-xl p-2 text-ink-500 hover:bg-ink-100" title="Edit">
                    <Edit className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => remove(r)} className="rounded-xl p-2 text-ink-500 hover:bg-rose-50 hover:text-rose-600" title="Delete">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {editing && (
        <DoctorRequestModal
          key={editing._id || "new"}
          isOpen
          initialRequest={editing._id ? editing : null}
          onClose={() => setEditing(null)}
          onSaved={load}
        />
      )}
      {viewingOffers && <OffersDrawer request={viewingOffers} onClose={() => { setViewingOffers(null); load(); }} />}
    </section>
  );
}
