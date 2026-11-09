import React from 'react';
import { ModerationBadge } from './ListingBadges';
import { assetUrl } from '../../utils/assetUrl';
import {
  X,
  Briefcase,
  Stethoscope,
  Building2,
  MapPin,
  Phone,
  Mail,
  Clock,
  Calendar,
  DollarSign,
  Award,
  CheckCircle2,
  ShieldCheck,
  Send,
  UserCheck
} from 'lucide-react';

export default function ListingDetailsModal({
  isOpen,
  onClose,
  item,
  type, // 'job' | 'collab' | 'pharmacist' | 'doctor'
  currentUser,
  t,
  lang,
  onPrimaryAction
}) {
  if (!isOpen || !item) return null;

  const isJob = type === 'job';
  const isCollab = type === 'collab';
  const isPharmacist = type === 'pharmacist';
  const isDoctor = type === 'doctor';

  const modalTitle = () => {
    if (isJob) return lang === 'hi' ? 'नौकरी विवरण' : 'Job Details';
    if (isCollab) return lang === 'hi' ? 'क्लिनिक चैंबर विवरण' : 'Chamber Listing Details';
    if (isPharmacist) return lang === 'hi' ? 'फार्मासिस्ट प्रोफाइल' : 'Pharmacist Profile';
    if (isDoctor) return lang === 'hi' ? 'डॉक्टर प्रोफाइल' : 'Doctor Profile';
    return lang === 'hi' ? 'विवरण' : 'Details';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 flex items-start justify-between gap-4 bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-start gap-3.5">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
              isJob ? 'bg-teal-50 text-teal-700' :
              isCollab ? 'bg-emerald-50 text-emerald-700' :
              isPharmacist ? 'bg-sky-50 text-sky-700' :
              'bg-teal-50 text-teal-700'
            }`}>
              {isJob && <Briefcase className="w-6 h-6" />}
              {isCollab && <Building2 className="w-6 h-6" />}
              {isPharmacist && <UserCheck className="w-6 h-6" />}
              {isDoctor && <Stethoscope className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                  {modalTitle()}
                </span>
                {(isJob || isCollab) && <ModerationBadge status={item.moderationStatus} />}
                {item.distanceKm !== undefined && item.distanceKm !== null && (
                  <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">
                    {item.distanceKm} {t.distanceAway || 'km away'}
                  </span>
                )}
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 font-outfit mt-1 break-words break-all">
                {isJob && (item.title || 'Pharmacy Vacancy')}
                {isCollab && (item.specializationNeeded ? `${item.specializationNeeded} Chamber` : 'Clinic Chamber')}
                {isPharmacist && item.name}
                {isDoctor && `Dr. ${item.name}`}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 font-medium break-words break-all">
                {isJob && (item.pharmacyName || 'Pharmacy')}
                {isCollab && (item.clinicOrChamberName || item.pharmacyName || 'Clinic')}
                {isPharmacist && (item.location?.city || 'Verified Pharmacist')}
                {isDoctor && (item.doctorDetails?.specialization || 'Medical Specialist')}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors flex-shrink-0"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-700 text-sm">
          {/* Chamber photos */}
          {isCollab && Array.isArray(item.images) && item.images.length > 0 && (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {item.images.map((url, i) => (
                <a
                  key={url}
                  href={assetUrl(url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 ${i === 0 ? 'col-span-2 row-span-2 aspect-[4/3] sm:col-span-2' : 'aspect-square'}`}
                >
                  <img src={assetUrl(url)} alt={`Chamber photo ${i + 1}`} loading="lazy" className="h-full w-full object-cover transition hover:scale-105" />
                </a>
              ))}
            </div>
          )}

          {/* Key Parameters Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {isJob && (
              <>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 min-w-0">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">{t.salary || 'Salary'}</span>
                  <span className="text-xs sm:text-sm font-extrabold text-slate-900 mt-0.5 block break-words break-all">{item.salaryRange || 'Negotiable'}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 min-w-0">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Job Type</span>
                  <span className="text-xs sm:text-sm font-extrabold text-slate-900 mt-0.5 block break-words break-all">{item.jobType || 'Full-time'}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 min-w-0">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Experience</span>
                  <span className="text-xs sm:text-sm font-extrabold text-slate-900 mt-0.5 block break-words break-all">{item.requiredExperience || '1-2 Years'}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 min-w-0">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Qualification</span>
                  <span className="text-xs sm:text-sm font-extrabold text-slate-900 mt-0.5 block break-words break-all">{item.requiredQualification || 'B.Pharm'}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 min-w-0">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Timings</span>
                  <span className="text-xs sm:text-sm font-extrabold text-slate-900 mt-0.5 block break-words break-all">{item.workTimings || 'Regular Shifts'}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 min-w-0">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Vacancies</span>
                  <span className="text-xs sm:text-sm font-extrabold text-slate-900 mt-0.5 block break-words break-all">{item.vacancies || 1} Open</span>
                </div>
              </>
            )}

            {isCollab && (
              <>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 min-w-0">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Specialization</span>
                  <span className="text-xs sm:text-sm font-extrabold text-slate-900 mt-0.5 block break-words break-all">{item.specializationNeeded || 'General Physician'}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 min-w-0">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">{t.timings || 'Timings'}</span>
                  <span className="text-xs sm:text-sm font-extrabold text-slate-900 mt-0.5 block break-words break-all">{item.preferredTimings || 'Flexible'}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 min-w-0">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Consultation Days</span>
                  <span className="text-xs sm:text-sm font-extrabold text-slate-900 mt-0.5 block break-words break-all">{item.consultationDays || 'Monday - Saturday'}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 min-w-0">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Terms</span>
                  <span className="text-xs sm:text-sm font-extrabold text-slate-900 mt-0.5 block break-words break-all">{item.collaborationTerms || 'Revenue Share / Rent'}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 col-span-2 min-w-0">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Facilities</span>
                  <span className="text-xs sm:text-sm font-extrabold text-slate-900 mt-0.5 block break-words break-all">{item.chamberFacilities || 'Patient Waiting Area, Pharmacy Counter'}</span>
                </div>
              </>
            )}

            {isPharmacist && (
              <>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 min-w-0">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Degree</span>
                  <span className="text-xs sm:text-sm font-extrabold text-slate-900 mt-0.5 block break-words break-all">{item.pharmacistDetails?.qualification || 'B.Pharm'}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 min-w-0">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Experience</span>
                  <span className="text-xs sm:text-sm font-extrabold text-slate-900 mt-0.5 block break-words break-all">{item.pharmacistDetails?.experienceYears || 0} Years</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 min-w-0">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Council Reg</span>
                  <span className="text-xs sm:text-sm font-extrabold text-slate-900 mt-0.5 block break-words break-all">{item.pharmacistDetails?.registrationNumber || 'Registered'}</span>
                </div>
              </>
            )}

            {isDoctor && (
              <>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 min-w-0">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Specialization</span>
                  <span className="text-xs sm:text-sm font-extrabold text-slate-900 mt-0.5 block break-words break-all">{item.doctorDetails?.specialization || 'General Physician'}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 min-w-0">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Medical Degree</span>
                  <span className="text-xs sm:text-sm font-extrabold text-slate-900 mt-0.5 block break-words break-all">{item.doctorDetails?.qualification || 'MBBS'}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 min-w-0">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Practice Experience</span>
                  <span className="text-xs sm:text-sm font-extrabold text-slate-900 mt-0.5 block break-words break-all">{item.doctorDetails?.experienceYears || 0} Years</span>
                </div>
              </>
            )}
          </div>

          {/* Detailed Description */}
          {item.description && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {lang === 'hi' ? 'विवरण' : 'Full Description'}
              </h4>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-slate-50/70 p-4 rounded-2xl border border-slate-100 whitespace-pre-line break-words break-all max-h-56 overflow-y-auto">
                {item.description}
              </p>
            </div>
          )}

          {/* Requirements (if Job) */}
          {isJob && item.requirements && item.requirements.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {lang === 'hi' ? 'आवश्यक योग्यताएं' : 'Requirements'}
              </h4>
              <ul className="space-y-1.5 bg-slate-50/70 p-4 rounded-2xl border border-slate-100 max-h-56 overflow-y-auto">
                {item.requirements.map((req, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
                    <span className="break-words break-all">{req}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Location Details */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {lang === 'hi' ? 'स्थान विवरण' : 'Location Details'}
            </h4>
            <div className="flex items-start gap-2.5 p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs sm:text-sm min-w-0">
              <MapPin className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <p className="font-bold text-slate-900 break-words break-all">
                  {item.location?.address || item.location?.city || 'Local Area'}
                </p>
                <p className="text-slate-500 mt-0.5 break-words break-all">
                  {[item.location?.city, item.location?.state, item.location?.pincode].filter(Boolean).join(', ')}
                </p>
              </div>
            </div>
          </div>

          {/* Direct Contact Information Box (Signed-in view) */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {lang === 'hi' ? 'संपर्क जानकारी' : 'Direct Contact Details'}
            </h4>
            <div className="p-4 rounded-2xl bg-teal-50/50 border border-teal-200/60 space-y-3 min-w-0">
              <div className="flex items-center gap-2 text-xs text-teal-800 font-bold">
                <ShieldCheck className="w-4 h-4 text-teal-700" />
                <span>Verified Direct Contact</span>
              </div>
              <div className="flex flex-wrap gap-3">
                {(item.contactPhone || item.mobile) && (
                  <a
                    href={`tel:${item.contactPhone || item.mobile}`}
                    className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-teal-200 text-teal-900 font-bold text-xs hover:bg-teal-50 transition-colors shadow-sm break-all"
                  >
                    <Phone className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
                    <span className="break-all">Call: {item.contactPhone || item.mobile}</span>
                  </a>
                )}
                {(item.contactEmail || item.email) && (
                  <a
                    href={`mailto:${item.contactEmail || item.email}`}
                    className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-teal-200 text-teal-900 font-bold text-xs hover:bg-teal-50 transition-colors shadow-sm break-all"
                  >
                    <Mail className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
                    <span className="break-all">Email: {item.contactEmail || item.email}</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer with Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs sm:text-sm hover:bg-slate-100 transition-colors"
          >
            {lang === 'hi' ? 'बंद करें' : 'Close'}
          </button>

          {onPrimaryAction && (
            <button
              onClick={() => {
                onClose();
                onPrimaryAction(item);
              }}
              className="px-6 py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center gap-2"
            >
              {isJob && <span>{item.hasApplied ? (t.applied || 'Applied') : (t.applyNow || 'Apply Now')}</span>}
              {isCollab && <span>{item.hasInquired ? (t.proposalSent || 'Proposal Sent') : (t.sendProposal || 'Send Proposal')}</span>}
              {isPharmacist && <span>Contact Pharmacist</span>}
              {isDoctor && <span>Invite Doctor</span>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
