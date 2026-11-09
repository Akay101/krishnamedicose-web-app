import { useCallback, useEffect, useState } from "react";
import { CalendarClock, CheckCircle2, Handshake, Lock, MapPin, Search, Stethoscope } from "lucide-react";
import servicesApi from "../../utils/servicesApi";
import { VerifiedBadge } from "./ListingBadges";
import OfferChamberModal from "./OfferChamberModal";

/**
 * Verified doctors looking for a chamber.
 * Signed-out visitors see previews; offering a chamber requires a pharmacy / member account.
 */
export default function DoctorRequestsFeed({ currentUser, requireAuth, params = {}, compact = false }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [offering, setOffering] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const canOffer = !currentUser || ["pharmacy_owner", "general_user"].includes(currentUser.role);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await servicesApi.get("/doctor-requests/feed", { params: { ...params, search } });
      setItems(res.data || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, params.lat, params.lng, params.radiusKm, currentUser?._id]);

  useEffect(() => {
    const t = setTimeout(load, search ? 350 : 0);
    return () => clearTimeout(t);
  }, [load, search]);

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h4 className="font-display text-lg font-bold text-ink-900 sm:text-xl">Doctors looking for a chamber</h4>
          <p className="text-xs text-ink-500 sm:text-sm">Verified doctors who want to consult from a pharmacy or clinic near you.</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input className="input py-2.5 pl-9" placeholder="Search specialization or city" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {[0, 1].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-2xl bg-ink-100" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink-200 bg-white px-6 py-10 text-center">
          <Stethoscope className="mx-auto h-8 w-8 text-ink-300" />
          <p className="mt-2 text-sm font-semibold text-ink-700">No verified doctor requirements here yet</p>
          <p className="text-xs text-ink-500">Try a wider distance or check back soon.</p>
        </div>
      ) : (
        <div className={`grid gap-3 ${compact ? "" : "sm:grid-cols-2"}`}>
          {items.map((r) => {
            const open = expanded === r._id;
            return (
              <article key={r._id} className="flex flex-col rounded-2xl border border-ink-200/80 bg-white p-4 shadow-soft transition hover:border-sky-300 sm:p-5">
                <div className="flex items-start gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-100">
                    <Stethoscope className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <h5 className="truncate font-semibold text-ink-900">Dr. {r.doctorId?.name}</h5>
                      <VerifiedBadge compact />
                    </div>
                    <p className="truncate text-xs text-ink-500">
                      {r.specialization}
                      {r.qualification ? ` · ${r.qualification}` : ""}
                      {r.experienceYears ? ` · ${r.experienceYears} yrs` : ""}
                    </p>
                  </div>
                  {r.distanceKm !== null && r.distanceKm !== undefined && (
                    <span className="shrink-0 whitespace-nowrap rounded-full bg-ink-100 px-2 py-0.5 text-[11px] font-semibold text-ink-600">{r.distanceKm} km</span>
                  )}
                </div>

                <p className="mt-3 text-sm font-semibold text-ink-800">{r.title}</p>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-600">
                  <span className="inline-flex items-center gap-1"><CalendarClock className="h-3.5 w-3.5 text-sky-600" />{r.preferredTimings}</span>
                  <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-sky-600" />{r.location?.city || "Nearby"} · within {r.searchRadiusKm} km</span>
                </div>
                <p className={`mt-2 text-xs leading-relaxed text-ink-600 ${open ? "" : "line-clamp-2"}`}>{r.description}</p>

                {open && (
                  <div className="mt-3 space-y-2 rounded-xl bg-ink-50 p-3 text-xs text-ink-700">
                    <p><strong>Days:</strong> {r.consultationDays}</p>
                    <p><strong>Expected terms:</strong> {r.expectedTerms}</p>
                    {r.requirements?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {r.requirements.map((x) => (
                          <span key={x} className="rounded-full bg-white px-2 py-0.5 ring-1 ring-ink-200">{x}</span>
                        ))}
                      </div>
                    )}
                    {r.isContactLocked ? (
                      <p className="flex items-center gap-1.5 text-ink-500"><Lock className="h-3.5 w-3.5" /> Sign in to see the doctor's contact details.</p>
                    ) : (
                      <p><strong>Contact:</strong> {r.doctorId?.mobile} · {r.doctorId?.email}</p>
                    )}
                  </div>
                )}

                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-ink-100 pt-3">
                  <button
                    type="button"
                    onClick={() => requireAuth(() => setExpanded(open ? null : r._id))}
                    className="btn-secondary px-3.5 py-2 text-xs"
                  >
                    {open ? "Hide details" : "See details"}
                  </button>
                  {canOffer &&
                    (r.hasResponded ? (
                      <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
                        <CheckCircle2 className="h-4 w-4" /> Offer sent
                      </span>
                    ) : (
                      <button type="button" onClick={() => requireAuth(() => setOffering(r))} className="btn-primary px-3.5 py-2 text-xs">
                        <Handshake className="h-4 w-4" /> Offer my chamber
                      </button>
                    ))}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {offering && <OfferChamberModal request={offering} onClose={() => setOffering(null)} onSent={load} />}
    </section>
  );
}
