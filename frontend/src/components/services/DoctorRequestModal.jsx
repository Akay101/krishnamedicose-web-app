import { useState } from "react";
import { AlertCircle, Loader2, Search, X } from "lucide-react";
import servicesApi from "../../utils/servicesApi";
import LocationPicker from "./LocationPicker";
import { useModal } from "../../context/ModalContext";
import { useAccount } from "../../context/AccountContext";

const REQUIREMENT_OPTIONS = [
  "Air-conditioned consultation room",
  "Patient waiting area",
  "Receptionist / appointment desk",
  "Attached pharmacy",
  "Examination couch",
  "Ground floor / accessible",
  "Parking space",
  "Diagnostic / lab tie-up",
];

const Label = ({ children, required }) => (
  <span className="mb-1.5 block text-xs font-semibold text-ink-700">
    {children} {required && <span className="text-rose-500">*</span>}
  </span>
);

/** Doctor: create or edit a "looking for a chamber" requirement. */
export default function DoctorRequestModal({ isOpen, onClose, onSaved, initialRequest = null, adminMode = false }) {
  const { user } = useAccount();
  const { showModal } = useModal();
  const loc = initialRequest?.location || user?.location || {};
  const [form, setForm] = useState({
    title: initialRequest?.title || "",
    specialization: initialRequest?.specialization || user?.doctorDetails?.specialization || "",
    qualification: initialRequest?.qualification || user?.doctorDetails?.qualification || "",
    experienceYears: initialRequest?.experienceYears ?? user?.doctorDetails?.experienceYears ?? 0,
    preferredTimings: initialRequest?.preferredTimings || "Evening 6:00 PM - 9:00 PM",
    consultationDays: initialRequest?.consultationDays || "Monday to Saturday",
    expectedTerms: initialRequest?.expectedTerms || "Revenue share / Negotiable",
    requirements: initialRequest?.requirements || ["Air-conditioned consultation room", "Patient waiting area"],
    description: initialRequest?.description || "",
    searchRadiusKm: initialRequest?.searchRadiusKm || 15,
    address: loc.address || "",
    city: loc.city || "",
    state: loc.state || "",
    pincode: loc.pincode || "",
    coordinates: loc.coordinates || [77.1025, 28.7041],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const toggleReq = (r) =>
    setForm((f) => ({ ...f, requirements: f.requirements.includes(r) ? f.requirements.filter((x) => x !== r) : [...f.requirements, r] }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.description.trim().length < 10) return setError("Please describe what you are looking for (at least 10 characters).");
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        specialization: form.specialization.trim(),
        qualification: form.qualification.trim(),
        experienceYears: Number(form.experienceYears) || 0,
        preferredTimings: form.preferredTimings.trim(),
        consultationDays: form.consultationDays.trim(),
        expectedTerms: form.expectedTerms.trim(),
        requirements: form.requirements,
        description: form.description.trim(),
        searchRadiusKm: Number(form.searchRadiusKm) || 15,
        location: { address: form.address, city: form.city, state: form.state, pincode: form.pincode, coordinates: form.coordinates },
      };
      const base = adminMode ? "/admin/doctor-requests" : "/doctor-requests";
      const res = initialRequest?._id
        ? await servicesApi.put(`${base}/${initialRequest._id}`, payload)
        : await servicesApi.post("/doctor-requests", payload);
      onSaved?.(res.data.request);
      onClose();
      showModal({
        title: adminMode ? "Requirement updated" : "Sent for verification",
        message: res.data.message,
        type: "success",
      });
    } catch (err) {
      setError(err.response?.data?.message || "Could not save your chamber requirement.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-end justify-center bg-ink-950/70 backdrop-blur-sm sm:items-center sm:p-6">
      <div className="flex max-h-[100dvh] w-full max-w-2xl flex-col overflow-hidden bg-white shadow-2xl sm:max-h-[92vh] sm:rounded-3xl">
        <div className="flex items-start justify-between gap-4 bg-gradient-to-r from-sky-800 to-ink-950 px-5 py-4 text-white sm:px-7 sm:py-5">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/10">
              <Search className="h-5 w-5 text-sky-200" />
            </span>
            <div>
              <h3 className="font-display text-lg font-bold">{initialRequest ? "Edit chamber requirement" : "Looking for a chamber?"}</h3>
              <p className="text-xs text-sky-100">Tell verified pharmacies and clinics what you need. They can offer you their chamber.</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl p-2 text-sky-100 hover:bg-white/10" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={submit} className="flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-7">
          {error && (
            <p className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
            </p>
          )}

          <label className="block">
            <Label required>Title</Label>
            <input required minLength={3} maxLength={120} className="input" value={form.title} onChange={set("title")} placeholder="e.g. Pediatrician looking for evening chamber in Indirapuram" />
          </label>

          <div className="grid gap-4 sm:grid-cols-3">
            <label className="block sm:col-span-1">
              <Label required>Specialization</Label>
              <input required maxLength={80} className="input" value={form.specialization} onChange={set("specialization")} placeholder="Pediatrician" />
            </label>
            <label className="block">
              <Label>Qualification</Label>
              <input maxLength={60} className="input" value={form.qualification} onChange={set("qualification")} placeholder="MBBS, MD" />
            </label>
            <label className="block">
              <Label>Experience (years)</Label>
              <input type="number" min={0} max={60} className="input" value={form.experienceYears} onChange={set("experienceYears")} />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <label className="block">
              <Label required>Preferred timings</Label>
              <input required maxLength={80} className="input" value={form.preferredTimings} onChange={set("preferredTimings")} />
            </label>
            <label className="block">
              <Label>Days</Label>
              <input maxLength={80} className="input" value={form.consultationDays} onChange={set("consultationDays")} />
            </label>
            <label className="block">
              <Label>Expected terms</Label>
              <input maxLength={120} className="input" value={form.expectedTerms} onChange={set("expectedTerms")} />
            </label>
          </div>

          <div>
            <Label>What the chamber needs</Label>
            <div className="flex flex-wrap gap-2">
              {REQUIREMENT_OPTIONS.map((r) => {
                const on = form.requirements.includes(r);
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => toggleReq(r)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium ring-1 ring-inset transition ${
                      on ? "bg-sky-50 text-sky-800 ring-sky-300" : "bg-white text-ink-600 ring-ink-200 hover:ring-ink-300"
                    }`}
                  >
                    {r}
                  </button>
                );
              })}
            </div>
          </div>

          <label className="block">
            <span className="mb-1.5 flex items-center justify-between text-xs font-semibold text-ink-700">
              <span>About you & what you're looking for <span className="text-rose-500">*</span></span>
              <span className="font-normal text-ink-400">{form.description.length} / 1000</span>
            </span>
            <textarea required rows={3} maxLength={1000} className="input resize-y" value={form.description} onChange={set("description")} placeholder="Patient focus, expected footfall, languages spoken, availability start date…" />
          </label>

          <div className="space-y-3 border-t border-ink-100 pt-5">
            <p className="text-xs font-bold uppercase tracking-wider text-ink-500">Preferred area</p>
            <div className="rounded-2xl bg-sky-50/70 p-4 ring-1 ring-inset ring-sky-100">
              <div className="flex items-center justify-between gap-3 text-xs font-semibold text-sky-900">
                <span>Search radius</span>
                <span className="rounded-lg bg-white px-2.5 py-1 font-bold ring-1 ring-sky-200">{form.searchRadiusKm} km</span>
              </div>
              <input type="range" min={1} max={50} value={form.searchRadiusKm} onChange={set("searchRadiusKm")} className="mt-2 w-full cursor-pointer accent-sky-600" />
            </div>
            <LocationPicker
              value={{ address: form.address, city: form.city, state: form.state, pincode: form.pincode, coordinates: form.coordinates }}
              onChange={(l) => setForm((f) => ({ ...f, address: l.address, city: l.city, state: l.state, pincode: l.pincode, coordinates: l.coordinates }))}
              showMapPreview
            />
          </div>
        </form>

        <div className="flex flex-col-reverse gap-2 border-t border-ink-100 bg-white px-5 py-4 sm:flex-row sm:justify-end sm:px-7">
          <button type="button" onClick={onClose} className="btn-ghost">
            Cancel
          </button>
          <button type="button" onClick={submit} disabled={saving} className="btn-primary">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {initialRequest ? "Save changes" : "Submit for verification"}
          </button>
        </div>
      </div>
    </div>
  );
}
