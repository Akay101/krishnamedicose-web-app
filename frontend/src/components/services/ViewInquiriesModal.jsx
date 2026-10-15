import React, { useState, useEffect } from 'react';
import { X, Stethoscope, Phone, Mail, Award, CheckCircle2, Clock, XCircle, FileText, Loader2, AlertCircle } from 'lucide-react';
import servicesApi from '../../utils/servicesApi';

export default function ViewInquiriesModal({ isOpen, onClose, collabPost }) {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    if (isOpen && collabPost?._id) {
      fetchInquiries();
    }
  }, [isOpen, collabPost]);

  const fetchInquiries = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await servicesApi.get(`/collab-posts/${collabPost._id}/inquiries`);
      setInquiries(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load inquiries.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (inqId, newStatus) => {
    setUpdatingId(inqId);
    try {
      await servicesApi.patch(`/collab-posts/inquiries/${inqId}/status`, { status: newStatus });
      setInquiries((prev) =>
        prev.map((inq) => (inq._id === inqId ? { ...inq, status: newStatus } : inq))
      );
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update inquiry status.');
    } finally {
      setUpdatingId(null);
    }
  };

  if (!isOpen || !collabPost) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6 bg-slate-950/75 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-slate-900 px-6 sm:px-8 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-2xl">
              <Stethoscope className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold font-outfit">Doctor Proposals: {collabPost.pharmacyName}</h3>
              <p className="text-xs text-emerald-100">
                {inquiries.length} Physician Collaboration Inquiry{inquiries.length !== 1 ? 's' : ''}
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
            <div className="py-16 text-center text-emerald-700">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
              <p className="text-sm font-semibold">Loading doctor inquiries...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-800 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          ) : inquiries.length === 0 ? (
            <div className="py-16 text-center text-slate-500">
              <Stethoscope className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-base font-bold text-slate-700">No Doctor Inquiries Yet</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Doctors registered within your {collabPost.visibilityRadiusKm || 30} km radius will be notified and can reach out directly here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {inquiries.map((inq) => (
                <div
                  key={inq._id}
                  className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white transition-all space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900 text-base">{inq.doctorName}</h4>
                        <span
                          className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                            inq.status === 'accepted'
                              ? 'bg-emerald-100 text-emerald-800'
                              : inq.status === 'contacted'
                              ? 'bg-blue-100 text-blue-800'
                              : inq.status === 'declined'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {inq.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Received on {new Date(inq.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleStatusChange(inq._id, 'accepted')}
                        disabled={updatingId === inq._id || inq.status === 'accepted'}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleStatusChange(inq._id, 'contacted')}
                        disabled={updatingId === inq._id || inq.status === 'contacted'}
                        className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors"
                      >
                        Contacted
                      </button>
                      <button
                        onClick={() => handleStatusChange(inq._id, 'declined')}
                        disabled={updatingId === inq._id || inq.status === 'declined'}
                        className="px-3 py-1.5 bg-slate-200 hover:bg-rose-100 hover:text-rose-700 disabled:opacity-50 text-slate-700 text-xs font-bold rounded-xl transition-colors"
                      >
                        Decline
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                    <div className="flex items-center gap-2 text-slate-700">
                      <Award className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span>Specialization: <strong>{inq.specialization || 'Medical Specialist'}</strong></span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-700">
                      <Clock className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span>Proposed: <strong>{inq.proposedTimings || 'Standard Chamber Timings'}</strong></span>
                    </div>

                    {inq.medicalRegistrationNumber && (
                      <div className="flex items-center gap-2 text-slate-700 truncate">
                        <FileText className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <span className="truncate">Council Reg: <strong>{inq.medicalRegistrationNumber}</strong></span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-200/80">
                    <a
                      href={`tel:${inq.doctorMobile}`}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 hover:text-emerald-900 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200"
                    >
                      <Phone className="w-3.5 h-3.5" /> Call Doctor: {inq.doctorMobile}
                    </a>
                    <a
                      href={`mailto:${inq.doctorEmail}`}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200"
                    >
                      <Mail className="w-3.5 h-3.5" /> {inq.doctorEmail}
                    </a>
                  </div>

                  {inq.message && (
                    <div className="p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-600 italic">
                      "{inq.message}"
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
