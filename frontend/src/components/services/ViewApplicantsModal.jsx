import React, { useState, useEffect } from 'react';
import { X, Users, Phone, Mail, Award, CheckCircle2, Clock, XCircle, FileText, Loader2, AlertCircle } from 'lucide-react';
import servicesApi from '../../utils/servicesApi';

export default function ViewApplicantsModal({ isOpen, onClose, job }) {
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    if (isOpen && job?._id) {
      fetchApplicants();
    }
  }, [isOpen, job]);

  const fetchApplicants = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await servicesApi.get(`/jobs/${job._id}/applications`);
      setApplicants(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load applicants.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (appId, newStatus) => {
    setUpdatingId(appId);
    try {
      await servicesApi.patch(`/jobs/applications/${appId}/status`, { status: newStatus });
      setApplicants((prev) =>
        prev.map((app) => (app._id === appId ? { ...app, status: newStatus } : app))
      );
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update application status.');
    } finally {
      setUpdatingId(null);
    }
  };

  if (!isOpen || !job) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6 bg-slate-950/75 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-700 to-slate-900 px-6 sm:px-8 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-2xl">
              <Users className="w-5 h-5 text-teal-200" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold font-outfit">Applicants for: {job.title}</h3>
              <p className="text-xs text-teal-100">
                {applicants.length} Total Registered Candidate Application{applicants.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8 max-h-[78vh] overflow-y-auto">
          {loading ? (
            <div className="py-16 text-center text-teal-700">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
              <p className="text-sm font-semibold">Loading applicants list...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-800 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          ) : applicants.length === 0 ? (
            <div className="py-16 text-center text-slate-500">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-base font-bold text-slate-700">No Applications Received Yet</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Pharmacists searching within your {job.visibilityRadiusKm || 25} km visibility radius will appear here once they apply.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {applicants.map((app) => (
                <div
                  key={app._id}
                  className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white transition-all space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900 text-base">{app.applicantName}</h4>
                        <span
                          className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                            app.status === 'shortlisted'
                              ? 'bg-emerald-100 text-emerald-800'
                              : app.status === 'reviewed'
                              ? 'bg-blue-100 text-blue-800'
                              : app.status === 'rejected'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {app.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Applied on {new Date(app.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleStatusChange(app._id, 'shortlisted')}
                        disabled={updatingId === app._id || app.status === 'shortlisted'}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors"
                      >
                        Shortlist
                      </button>
                      <button
                        onClick={() => handleStatusChange(app._id, 'reviewed')}
                        disabled={updatingId === app._id || app.status === 'reviewed'}
                        className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors"
                      >
                        Reviewed
                      </button>
                      <button
                        onClick={() => handleStatusChange(app._id, 'rejected')}
                        disabled={updatingId === app._id || app.status === 'rejected'}
                        className="px-3 py-1.5 bg-slate-200 hover:bg-rose-100 hover:text-rose-700 disabled:opacity-50 text-slate-700 text-xs font-bold rounded-xl transition-colors"
                      >
                        Decline
                      </button>
                    </div>
                  </div>

                  {/* Qualifications & Contacts */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                    <div className="flex items-center gap-2 text-slate-700">
                      <Award className="w-4 h-4 text-teal-600 flex-shrink-0" />
                      <span>Degree: <strong>{app.qualification || 'B.Pharm'}</strong></span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-700">
                      <Clock className="w-4 h-4 text-teal-600 flex-shrink-0" />
                      <span>Experience: <strong>{app.experienceYears || 0} Years</strong></span>
                    </div>

                    {app.licenseNumber && (
                      <div className="flex items-center gap-2 text-slate-700 truncate">
                        <FileText className="w-4 h-4 text-teal-600 flex-shrink-0" />
                        <span className="truncate">License: <strong>{app.licenseNumber}</strong></span>
                      </div>
                    )}
                  </div>

                  {/* Contact Options */}
                  <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-200/80">
                    <a
                      href={`tel:${app.applicantMobile}`}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 hover:text-teal-900 bg-teal-50 px-3 py-1.5 rounded-xl border border-teal-200"
                    >
                      <Phone className="w-3.5 h-3.5" /> Call: {app.applicantMobile}
                    </a>
                    <a
                      href={`mailto:${app.applicantEmail}`}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200"
                    >
                      <Mail className="w-3.5 h-3.5" /> {app.applicantEmail}
                    </a>
                  </div>

                  {app.coverNote && (
                    <div className="p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-600 italic">
                      "{app.coverNote}"
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
