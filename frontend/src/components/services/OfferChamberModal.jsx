import { useEffect, useState } from "react";
import { Building2, Loader2, Send, X } from "lucide-react";
import servicesApi from "../../utils/servicesApi";
import { useModal } from "../../context/ModalContext";

/** Pharmacy / clinic: offer a chamber to a doctor who is looking for one. */
export default function OfferChamberModal({ request, onClose, onSent }) {
  const { showModal } = useModal();
  const [chambers, setChambers] = useState([]);
  const [chamberPostId, setChamberPostId] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    servicesApi
      .get("/collab-posts/my-posts")
      .then((res) => setChambers((res.data || []).filter((c) => !c.moderationStatus || c.moderationStatus === "approved")))
      .catch(() => setChambers([]));
  }, []);

  if (!request) return null;

  const send = async () => {
    setError("");
    if (message.trim().length < 10) return setError("Please write a short message (at least 10 characters).");
    setSending(true);
    try {
      const res = await servicesApi.post(`/doctor-requests/${request._id}/respond`, {
        message: message.trim(),
        ...(chamberPostId && { chamberPostId }),
      });
      onSent?.();
      onClose();
      showModal({ title: "Offer sent", message: res.data.message, type: "success" });
    } catch (err) {
      setError(err.response?.data?.message || "Could not send your offer.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-end justify-center bg-ink-950/70 backdrop-blur-sm sm:items-center sm:p-6">
      <div className="w-full max-w-lg overflow-hidden bg-white shadow-2xl sm:rounded-3xl">
        <div className="flex items-start justify-between gap-4 border-b border-ink-100 px-5 py-4 sm:px-6">
          <div>
            <p className="text-xs font-semibold text-sky-700">Offer your chamber</p>
            <h3 className="font-display text-lg font-bold text-ink-900">Dr. {request.doctorId?.name}</h3>
            <p className="text-xs text-ink-500">
              {request.specialization} · {request.preferredTimings} · {request.location?.city}
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl p-2 text-ink-400 hover:bg-ink-100" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-4 px-5 py-5 sm:px-6">
          {chambers.length > 0 && (
            <label className="block">
              <span className="field-label">Attach one of your verified chambers (optional)</span>
              <select className="input" value={chamberPostId} onChange={(e) => setChamberPostId(e.target.value)}>
                <option value="">— No listing attached —</option>
                {chambers.map((c) => (
                  <option key={c._id} value={c._id}>
                    {(c.clinicOrChamberName || c.pharmacyName) + " · " + c.preferredTimings}
                  </option>
                ))}
              </select>
            </label>
          )}
          {chambers.length === 0 && (
            <p className="flex items-start gap-2 rounded-xl bg-ink-50 px-3 py-2.5 text-xs text-ink-600">
              <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
              Tip: list your chamber with photos (Add Chamber Listing) so you can attach it to offers.
            </p>
          )}
          <label className="block">
            <span className="field-label">Message to the doctor</span>
            <textarea
              rows={4}
              maxLength={800}
              className="input resize-none"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Introduce your pharmacy, the chamber available, timings and terms you can offer."
            />
          </label>
          {error && <p className="text-sm font-medium text-rose-600">{error}</p>}
        </div>
        <div className="flex flex-col-reverse gap-2 border-t border-ink-100 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <button type="button" onClick={onClose} className="btn-ghost">
            Cancel
          </button>
          <button type="button" onClick={send} disabled={sending} className="btn-primary">
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send offer
          </button>
        </div>
      </div>
    </div>
  );
}
