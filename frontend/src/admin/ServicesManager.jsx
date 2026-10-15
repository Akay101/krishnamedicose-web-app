import React, { useState, useEffect } from 'react';
import {
  Users,
  Briefcase,
  Stethoscope,
  Building2,
  ShieldCheck,
  ShieldAlert,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Trash2,
  Lock,
  Unlock,
  FileText,
  MapPin,
  ExternalLink,
  Eye,
  Loader2,
  AlertCircle,
  RefreshCw,
  Phone,
  Mail,
  Edit,
  X,
  Clock,
  Calendar,
  DollarSign,
  Award,
  Check
} from 'lucide-react';
import servicesApi from '../utils/servicesApi';

export default function ServicesManager() {
  const [activeTab, setActiveTab] = useState('users'); // 'users', 'jobs', 'collabs'
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Users data
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('All');
  const [userBlockedFilter, setUserBlockedFilter] = useState('');

  // Jobs data
  const [jobs, setJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [jobSearch, setJobSearch] = useState('');

  // Collabs data
  const [collabs, setCollabs] = useState([]);
  const [loadingCollabs, setLoadingCollabs] = useState(false);
  const [collabSearch, setCollabSearch] = useState('');

  // Document preview modal
  const [previewDocUrl, setPreviewDocUrl] = useState('');

  // Modals for complete admin control
  const [selectedUserForDetails, setSelectedUserForDetails] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [selectedJobForDetails, setSelectedJobForDetails] = useState(null);
  const [selectedCollabForDetails, setSelectedCollabForDetails] = useState(null);
  const [savingEditUser, setSavingEditUser] = useState(false);

  // Action status message
  const [actionMessage, setActionMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'jobs') fetchJobs();
    if (activeTab === 'collabs') fetchCollabs();
  }, [activeTab, userSearch, userRoleFilter, userBlockedFilter, jobSearch, collabSearch]);

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const res = await servicesApi.get('/admin/stats');
      setStats(res.data);
    } catch (err) {
      console.error('Failed to load admin stats:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await servicesApi.get('/admin/users', {
        params: {
          search: userSearch,
          role: userRoleFilter,
          isBlocked: userBlockedFilter
        }
      });
      setUsers(res.data.users);
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to fetch users.');
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchJobs = async () => {
    setLoadingJobs(true);
    try {
      const res = await servicesApi.get('/admin/jobs', {
        params: { search: jobSearch }
      });
      setJobs(res.data);
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to fetch jobs.');
    } finally {
      setLoadingJobs(false);
    }
  };

  const fetchCollabs = async () => {
    setLoadingCollabs(true);
    try {
      const res = await servicesApi.get('/admin/collab-posts', {
        params: { search: collabSearch }
      });
      setCollabs(res.data);
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to fetch collaborations.');
    } finally {
      setLoadingCollabs(false);
    }
  };

  // Toggle user block
  const handleToggleBlock = async (user) => {
    const action = user.isBlocked ? 'unblock' : 'block';
    let reason = '';
    if (!user.isBlocked) {
      reason = window.prompt('Specify reason for account suspension (optional):', 'Administrative review');
      if (reason === null) return;
    }

    try {
      const res = await servicesApi.patch(`/admin/users/${user._id}/toggle-block`, { blockReason: reason });
      setUsers((prev) =>
        prev.map((u) => (u._id === user._id ? { ...u, isBlocked: res.data.isBlocked, blockReason: reason } : u))
      );
      setSelectedUserForDetails((prev) =>
        prev && prev._id === user._id ? { ...prev, isBlocked: res.data.isBlocked, blockReason: reason } : prev
      );
      showNotification(res.data.message);
      fetchStats();
    } catch (err) {
      alert(err.response?.data?.message || `Failed to ${action} user.`);
    }
  };

  // Toggle user verify
  const handleToggleVerify = async (user) => {
    try {
      const res = await servicesApi.patch(`/admin/users/${user._id}/toggle-verify`);
      setUsers((prev) =>
        prev.map((u) => (u._id === user._id ? { ...u, isVerified: res.data.isVerified } : u))
      );
      setSelectedUserForDetails((prev) =>
        prev && prev._id === user._id ? { ...prev, isVerified: res.data.isVerified } : prev
      );
      showNotification(res.data.message);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update verification status.');
    }
  };

  // Save edited user details
  const handleSaveEditUser = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    setSavingEditUser(true);
    try {
      const res = await servicesApi.put(`/admin/users/${editingUser._id}`, editingUser);
      setUsers((prev) => prev.map((u) => (u._id === editingUser._id ? res.data.user : u)));
      setSelectedUserForDetails((prev) => (prev && prev._id === editingUser._id ? res.data.user : prev));
      showNotification('User details updated successfully.');
      setEditingUser(null);
      fetchStats();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update user.');
    } finally {
      setSavingEditUser(false);
    }
  };

  // Delete user
  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to PERMANENTLY delete this user account and all their postings?')) return;
    try {
      const res = await servicesApi.delete(`/admin/users/${userId}`);
      setUsers((prev) => prev.filter((u) => u._id !== userId));
      setSelectedUserForDetails((prev) => (prev && prev._id === userId ? null : prev));
      showNotification(res.data.message);
      fetchStats();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete user.');
    }
  };

  // Toggle job status
  const handleToggleJobStatus = async (job) => {
    try {
      const res = await servicesApi.patch(`/admin/jobs/${job._id}/status`);
      setJobs((prev) => prev.map((j) => (j._id === job._id ? res.data.job : j)));
      setSelectedJobForDetails((prev) => (prev && prev._id === job._id ? res.data.job : prev));
      showNotification(res.data.message);
      fetchStats();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update job status.');
    }
  };

  // Delete job
  const handleDeleteJob = async (jobId) => {
    if (!window.confirm('Delete this job post permanently?')) return;
    try {
      const res = await servicesApi.delete(`/admin/jobs/${jobId}`);
      setJobs((prev) => prev.filter((j) => j._id !== jobId));
      setSelectedJobForDetails((prev) => (prev && prev._id === jobId ? null : prev));
      showNotification(res.data.message);
      fetchStats();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete job.');
    }
  };

  // Toggle collab status
  const handleToggleCollabStatus = async (collab) => {
    try {
      const res = await servicesApi.patch(`/admin/collab-posts/${collab._id}/status`);
      setCollabs((prev) => prev.map((c) => (c._id === collab._id ? res.data.post : c)));
      setSelectedCollabForDetails((prev) => (prev && prev._id === collab._id ? res.data.post : prev));
      showNotification(res.data.message);
      fetchStats();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update collaboration status.');
    }
  };

  // Delete collab
  const handleDeleteCollab = async (collabId) => {
    if (!window.confirm('Delete this doctor collaboration listing permanently?')) return;
    try {
      const res = await servicesApi.delete(`/admin/collab-posts/${collabId}`);
      setCollabs((prev) => prev.filter((c) => c._id !== collabId));
      setSelectedCollabForDetails((prev) => (prev && prev._id === collabId ? null : prev));
      showNotification(res.data.message);
      fetchStats();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete collaboration listing.');
    }
  };

  const getUserLicenseDoc = (user) => {
    if (!user) return '';
    return (
      user.pharmacyDetails?.licenseImage ||
      user.pharmacistDetails?.licenseImage ||
      user.pharmacistDetails?.resumeUrl ||
      ''
    );
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const showNotification = (msg) => {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(''), 3500);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 font-outfit">
            Services and Users
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Manage services, registered users, pharmacy job vacancies, and doctor clinic chambers with full administrative control.
          </p>
        </div>

        <button
          onClick={() => {
            fetchStats();
            if (activeTab === 'users') fetchUsers();
            if (activeTab === 'jobs') fetchJobs();
            if (activeTab === 'collabs') fetchCollabs();
          }}
          className="self-start sm:self-auto px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-2 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Notifications */}
      {actionMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-xs font-bold text-emerald-800 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{actionMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2 text-xs font-bold text-rose-800 animate-fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold uppercase text-slate-400 block">Total Users</span>
          <span className="text-2xl font-extrabold text-slate-900 font-outfit mt-1 block">
            {stats ? stats.totalUsers : '-'}
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold uppercase text-teal-600 block">Pharmacy Owners</span>
          <span className="text-2xl font-extrabold text-teal-700 font-outfit mt-1 block">
            {stats ? stats.totalOwners : '-'}
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold uppercase text-sky-600 block">Pharmacists</span>
          <span className="text-2xl font-extrabold text-sky-700 font-outfit mt-1 block">
            {stats ? stats.totalPharmacists : '-'}
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold uppercase text-emerald-600 block">Doctors</span>
          <span className="text-2xl font-extrabold text-emerald-700 font-outfit mt-1 block">
            {stats ? stats.totalDoctors : '-'}
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold uppercase text-amber-600 block">Active Jobs</span>
          <span className="text-2xl font-extrabold text-amber-700 font-outfit mt-1 block">
            {stats ? stats.totalActiveJobs : '-'}
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold uppercase text-indigo-600 block">Active Collabs</span>
          <span className="text-2xl font-extrabold text-indigo-700 font-outfit mt-1 block">
            {stats ? stats.totalActiveCollabs : '-'}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'users'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Users</span>
        </button>

        <button
          onClick={() => setActiveTab('jobs')}
          className={`pb-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'jobs'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>Job Vacancies</span>
        </button>

        <button
          onClick={() => setActiveTab('collabs')}
          className={`pb-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'collabs'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Stethoscope className="w-4 h-4" />
          <span>Doctor Chambers</span>
        </button>
      </div>

      {/* ================= TAB 1: USERS MANAGEMENT ================= */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-4">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search user name, email, mobile, pharmacy..."
                className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-teal-600"
              >
                <option value="All">All Roles</option>
                <option value="pharmacy_owner">Pharmacy Owners</option>
                <option value="job_seeker_pharmacist">Pharmacists (Job Seekers)</option>
                <option value="doctor">Doctors</option>
              </select>

              <select
                value={userBlockedFilter}
                onChange={(e) => setUserBlockedFilter(e.target.value)}
                className="px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-teal-600"
              >
                <option value="">All Account Statuses</option>
                <option value="false">Active Only</option>
                <option value="true">Suspended Only</option>
              </select>
            </div>
          </div>

          {/* Users Table */}
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4">User & Role</th>
                    <th className="px-6 py-4">Contact Info</th>
                    <th className="px-6 py-4">Professional Details</th>
                    <th className="px-6 py-4">Location</th>
                    <th className="px-6 py-4">License Document</th>
                    <th className="px-6 py-4">Account Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingUsers ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-teal-700">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                        <span>Loading user accounts...</span>
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                        No service users found matching your filters.
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => {
                      const licenseUrl =
                        u.pharmacyDetails?.licenseImage || u.pharmacistDetails?.licenseImage;

                      return (
                        <tr key={u._id} className="hover:bg-slate-50/70 transition-colors">
                          {/* Name & Role */}
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-900 text-sm">{u.name}</div>
                            <span
                              className={`inline-block text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full mt-1 ${
                                u.role === 'pharmacy_owner'
                                  ? 'bg-teal-100 text-teal-800'
                                  : u.role === 'job_seeker_pharmacist'
                                  ? 'bg-sky-100 text-sky-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {u.role === 'pharmacy_owner'
                                ? 'Pharmacy Owner'
                                : u.role === 'job_seeker_pharmacist'
                                ? 'Pharmacist'
                                : 'Doctor'}
                            </span>
                          </td>

                          {/* Contact */}
                          <td className="px-6 py-4 space-y-1">
                            <div className="flex items-center gap-1.5 text-slate-700">
                              <Phone className="w-3.5 h-3.5 text-slate-400" />
                              <span>{u.mobile}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-slate-600">
                              <Mail className="w-3.5 h-3.5 text-slate-400" />
                              <span>{u.email}</span>
                            </div>
                          </td>

                          {/* Credentials */}
                          <td className="px-6 py-4">
                            {u.role === 'pharmacy_owner' && (
                              <div>
                                <span className="font-bold text-slate-800 block">
                                  {u.pharmacyDetails?.pharmacyName || 'Pharmacy'}
                                </span>
                                <span className="text-[11px] text-slate-500">
                                  DL: {u.pharmacyDetails?.licenseNumber || 'N/A'}
                                </span>
                              </div>
                            )}

                            {u.role === 'job_seeker_pharmacist' && (
                              <div>
                                <span className="font-bold text-slate-800 block">
                                  {u.pharmacistDetails?.qualification || 'B.Pharm'}
                                </span>
                                <span className="text-[11px] text-slate-500">
                                  Exp: {u.pharmacistDetails?.experienceYears || 0} Yrs | Reg: {u.pharmacistDetails?.licenseNumber || 'N/A'}
                                </span>
                              </div>
                            )}

                            {u.role === 'doctor' && (
                              <div>
                                <span className="font-bold text-slate-800 block">
                                  {u.doctorDetails?.specialization || 'Specialist'}
                                </span>
                                <span className="text-[11px] text-slate-500">
                                  {u.doctorDetails?.qualification} | Council Reg: {u.doctorDetails?.medicalRegistrationNumber || 'N/A'}
                                </span>
                              </div>
                            )}
                          </td>

                          {/* Location */}
                          <td className="px-6 py-4">
                            <div className="text-slate-800 font-semibold">{u.location?.city || 'N/A'}</div>
                            <div className="text-[11px] text-slate-500 truncate max-w-[150px]">
                              {u.location?.address}
                            </div>
                          </td>

                          {/* License Document */}
                          <td className="px-6 py-4">
                            {licenseUrl ? (
                              <button
                                onClick={() => setPreviewDocUrl(licenseUrl)}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 text-[11px] font-bold rounded-lg border border-teal-200 transition-colors"
                              >
                                <Eye className="w-3 h-3" />
                                <span>View Document</span>
                              </button>
                            ) : (
                              <span className="text-slate-400 italic">No document</span>
                            )}
                          </td>

                          {/* Account Status */}
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-1 items-start">
                              <span
                                className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                                  u.isBlocked
                                    ? 'bg-rose-100 text-rose-800'
                                    : 'bg-emerald-100 text-emerald-800'
                                }`}
                              >
                                {u.isBlocked ? 'Suspended' : 'Active'}
                              </span>

                              <button
                                onClick={() => handleToggleVerify(u)}
                                className={`text-[10px] font-bold flex items-center gap-1 ${
                                  u.isVerified ? 'text-teal-700' : 'text-slate-400 hover:text-slate-600'
                                }`}
                              >
                                <ShieldCheck className="w-3 h-3" />
                                <span>{u.isVerified ? 'Verified' : 'Unverified'}</span>
                              </button>
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="px-6 py-4 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              {/* View Full Profile */}
                              <button
                                onClick={() => setSelectedUserForDetails(u)}
                                className="p-1.5 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 transition-colors"
                                title="View User Details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              {/* Edit User Info */}
                              <button
                                onClick={() =>
                                  setEditingUser({
                                    ...u,
                                    name: u.name || '',
                                    email: u.email || '',
                                    mobile: u.mobile || '',
                                    role: u.role || 'pharmacy_owner',
                                    isVerified: Boolean(u.isVerified),
                                    isBlocked: Boolean(u.isBlocked),
                                    blockReason: u.blockReason || '',
                                    location: {
                                      city: u.location?.city || '',
                                      address: u.location?.address || '',
                                      state: u.location?.state || '',
                                      pincode: u.location?.pincode || '',
                                    },
                                    pharmacyDetails: {
                                      pharmacyName: u.pharmacyDetails?.pharmacyName || '',
                                      licenseNumber: u.pharmacyDetails?.licenseNumber || '',
                                    },
                                    pharmacistDetails: {
                                      qualification: u.pharmacistDetails?.qualification || '',
                                      licenseNumber: u.pharmacistDetails?.licenseNumber || '',
                                      experienceYears: u.pharmacistDetails?.experienceYears ?? 0,
                                    },
                                    doctorDetails: {
                                      specialization: u.doctorDetails?.specialization || '',
                                      qualification: u.doctorDetails?.qualification || '',
                                      medicalRegistrationNumber: u.doctorDetails?.medicalRegistrationNumber || '',
                                      experienceYears: u.doctorDetails?.experienceYears ?? 0,
                                    },
                                  })
                                }
                                className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
                                title="Edit User Account"
                              >
                                <Edit className="w-4 h-4" />
                              </button>

                              {/* Block / Unblock */}
                              <button
                                onClick={() => handleToggleBlock(u)}
                                className={`p-1.5 rounded-lg transition-colors ${
                                  u.isBlocked
                                    ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                    : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                                }`}
                                title={u.isBlocked ? 'Unblock User' : 'Suspend / Block User'}
                              >
                                {u.isBlocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                              </button>

                              {/* Delete */}
                              <button
                                onClick={() => handleDeleteUser(u._id)}
                                className="p-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors"
                                title="Delete User Permanently"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: ALL JOBS ================= */}
      {activeTab === 'jobs' && (
        <div className="space-y-4">
          <div className="p-4 bg-white rounded-2xl border border-slate-200">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={jobSearch}
                onChange={(e) => setJobSearch(e.target.value)}
                placeholder="Search job title, pharmacy name, city..."
                className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4">Title & Pharmacy</th>
                    <th className="px-6 py-4">Type & Degree</th>
                    <th className="px-6 py-4">Salary Range</th>
                    <th className="px-6 py-4">Location & Radius</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingJobs ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-teal-700">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                        <span>Loading job posts...</span>
                      </td>
                    </tr>
                  ) : jobs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                        No job posts found.
                      </td>
                    </tr>
                  ) : (
                    jobs.map((job) => (
                      <tr key={job._id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900 text-sm">{job.title}</div>
                          <div className="text-xs text-slate-500">{job.pharmacyName}</div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-800">{job.jobType}</div>
                          <div className="text-[11px] text-slate-500">Degree: {job.requiredQualification}</div>
                        </td>

                        <td className="px-6 py-4 font-semibold text-slate-700">{job.salaryRange}</td>

                        <td className="px-6 py-4">
                          <div>{job.location?.city || 'Local Zone'}</div>
                          <div className="text-[11px] text-slate-500">Radius: {job.visibilityRadiusKm || 25} km</div>
                        </td>

                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleToggleJobStatus(job)}
                            className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full transition-colors ${
                              job.status === 'active'
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                            }`}
                            title="Click to toggle status (active / closed)"
                          >
                            {job.status}
                          </button>
                        </td>

                        <td className="px-6 py-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => setSelectedJobForDetails(job)}
                              className="p-1.5 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 transition-colors"
                              title="View Full Job Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleDeleteJob(job._id)}
                              className="p-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors"
                              title="Delete Job"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 3: ALL COLLAB POSTS ================= */}
      {activeTab === 'collabs' && (
        <div className="space-y-4">
          <div className="p-4 bg-white rounded-2xl border border-slate-200">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={collabSearch}
                onChange={(e) => setCollabSearch(e.target.value)}
                placeholder="Search specialization, pharmacy name, city..."
                className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4">Specialization & Facility</th>
                    <th className="px-6 py-4">Timings & Days</th>
                    <th className="px-6 py-4">Collaboration Terms</th>
                    <th className="px-6 py-4">Location & Radius</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingCollabs ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-teal-700">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                        <span>Loading doctor collaboration listings...</span>
                      </td>
                    </tr>
                  ) : collabs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                        No collaboration listings found.
                      </td>
                    </tr>
                  ) : (
                    collabs.map((collab) => (
                      <tr key={collab._id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900 text-sm">
                            Needs: {collab.specializationNeeded}
                          </div>
                          <div className="text-xs text-slate-500">
                            {collab.clinicOrChamberName || collab.pharmacyName}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-800">{collab.preferredTimings}</div>
                          <div className="text-[11px] text-slate-500">{collab.consultationDays}</div>
                        </td>

                        <td className="px-6 py-4 font-semibold text-emerald-800">{collab.collaborationTerms}</td>

                        <td className="px-6 py-4">
                          <div>{collab.location?.city || 'Local Zone'}</div>
                          <div className="text-[11px] text-slate-500">Radius: {collab.visibilityRadiusKm || 30} km</div>
                        </td>

                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleToggleCollabStatus(collab)}
                            className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full transition-colors ${
                              collab.status === 'active'
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                            }`}
                            title="Click to toggle status (active / closed)"
                          >
                            {collab.status}
                          </button>
                        </td>

                        <td className="px-6 py-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => setSelectedCollabForDetails(collab)}
                              className="p-1.5 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 transition-colors"
                              title="View Full Chamber Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleDeleteCollab(collab._id)}
                              className="p-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors"
                              title="Delete Collaboration Listing"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 1: USER DETAILS MODAL ================= */}
      {selectedUserForDetails && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl overflow-hidden shadow-2xl p-6 sm:p-8 space-y-6 my-8 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-200">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-black text-slate-900">{selectedUserForDetails.name}</h3>
                  <span
                    className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                      selectedUserForDetails.isBlocked
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {selectedUserForDetails.isBlocked ? 'Suspended' : 'Active'}
                  </span>
                  {selectedUserForDetails.isVerified && (
                    <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      Verified
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1 capitalize">
                  Role: {selectedUserForDetails.role?.replace(/_/g, ' ')}
                </p>
              </div>
              <button
                onClick={() => setSelectedUserForDetails(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Block reason notice if suspended */}
            {selectedUserForDetails.isBlocked && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-rose-600" />
                <div>
                  <span className="font-bold">Suspension Reason: </span>
                  <span>{selectedUserForDetails.blockReason || 'Administrative suspension'}</span>
                </div>
              </div>
            )}

            {/* Contact & Location Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Mobile</span>
                <p className="font-bold text-slate-900">{selectedUserForDetails.mobile || 'N/A'}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Email</span>
                <p className="font-bold text-slate-900">{selectedUserForDetails.email || 'N/A'}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">City / Region</span>
                <p className="font-bold text-slate-900">{selectedUserForDetails.location?.city || 'N/A'}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Pincode / State</span>
                <p className="font-bold text-slate-900">
                  {selectedUserForDetails.location?.pincode || 'N/A'} {selectedUserForDetails.location?.state ? `(${selectedUserForDetails.location.state})` : ''}
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl sm:col-span-2 space-y-1">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Full Address</span>
                <p className="font-semibold text-slate-800">{selectedUserForDetails.location?.address || 'No address provided'}</p>
              </div>
            </div>

            {/* Role Specific Details */}
            <div className="p-4 bg-teal-50/50 rounded-2xl border border-teal-100 text-xs space-y-3">
              <h4 className="font-bold text-teal-900 uppercase tracking-wider text-[11px]">Professional Credentials</h4>
              
              {selectedUserForDetails.role === 'pharmacy_owner' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-500 text-[11px]">Pharmacy Name:</span>
                    <p className="font-bold text-slate-900">{selectedUserForDetails.pharmacyDetails?.pharmacyName || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[11px]">Drug License Number:</span>
                    <p className="font-bold text-slate-900">{selectedUserForDetails.pharmacyDetails?.licenseNumber || 'N/A'}</p>
                  </div>
                </div>
              )}

              {selectedUserForDetails.role === 'job_seeker_pharmacist' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <span className="text-slate-500 text-[11px]">Qualification:</span>
                    <p className="font-bold text-slate-900">{selectedUserForDetails.pharmacistDetails?.qualification || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[11px]">Pharmacy Reg / License:</span>
                    <p className="font-bold text-slate-900">{selectedUserForDetails.pharmacistDetails?.licenseNumber || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[11px]">Experience:</span>
                    <p className="font-bold text-slate-900">{selectedUserForDetails.pharmacistDetails?.experienceYears ?? 0} Years</p>
                  </div>
                </div>
              )}

              {selectedUserForDetails.role === 'doctor' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-500 text-[11px]">Specialization:</span>
                    <p className="font-bold text-slate-900">{selectedUserForDetails.doctorDetails?.specialization || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[11px]">Degree / Qualification:</span>
                    <p className="font-bold text-slate-900">{selectedUserForDetails.doctorDetails?.qualification || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[11px]">Medical Council Reg:</span>
                    <p className="font-bold text-slate-900">{selectedUserForDetails.doctorDetails?.medicalRegistrationNumber || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[11px]">Experience:</span>
                    <p className="font-bold text-slate-900">{selectedUserForDetails.doctorDetails?.experienceYears ?? 0} Years</p>
                  </div>
                </div>
              )}
            </div>

            {/* License Document Preview */}
            <div className="p-3.5 bg-slate-50 rounded-xl flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Verification Document</span>
                <p className="font-medium text-slate-700">
                  {getUserLicenseDoc(selectedUserForDetails) ? 'Document uploaded on file' : 'No document uploaded'}
                </p>
              </div>
              {getUserLicenseDoc(selectedUserForDetails) && (
                <button
                  onClick={() => setPreviewDocUrl(getUserLicenseDoc(selectedUserForDetails))}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold rounded-lg border border-teal-200 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Inspect Document</span>
                </button>
              )}
            </div>

            {/* Meta */}
            <div className="text-[11px] text-slate-400 flex justify-between">
              <span>Account Created: {formatDate(selectedUserForDetails.createdAt)}</span>
              <span>User ID: {selectedUserForDetails._id}</span>
            </div>

            {/* Actions / Admin Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => handleToggleVerify(selectedUserForDetails)}
                  className="px-3 py-1.5 rounded-xl border border-teal-200 bg-teal-50 text-teal-800 text-xs font-bold hover:bg-teal-100 transition-colors"
                >
                  {selectedUserForDetails.isVerified ? 'Mark Unverified' : 'Mark Verified'}
                </button>

                <button
                  onClick={() => handleToggleBlock(selectedUserForDetails)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                    selectedUserForDetails.isBlocked
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100'
                      : 'bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100'
                  }`}
                >
                  {selectedUserForDetails.isBlocked ? 'Unblock User' : 'Suspend User'}
                </button>

                <button
                  onClick={() => {
                    setEditingUser({
                      ...selectedUserForDetails,
                      name: selectedUserForDetails.name || '',
                      email: selectedUserForDetails.email || '',
                      mobile: selectedUserForDetails.mobile || '',
                      role: selectedUserForDetails.role || 'pharmacy_owner',
                      isVerified: Boolean(selectedUserForDetails.isVerified),
                      isBlocked: Boolean(selectedUserForDetails.isBlocked),
                      blockReason: selectedUserForDetails.blockReason || '',
                      location: {
                        city: selectedUserForDetails.location?.city || '',
                        address: selectedUserForDetails.location?.address || '',
                        state: selectedUserForDetails.location?.state || '',
                        pincode: selectedUserForDetails.location?.pincode || '',
                      },
                      pharmacyDetails: {
                        pharmacyName: selectedUserForDetails.pharmacyDetails?.pharmacyName || '',
                        licenseNumber: selectedUserForDetails.pharmacyDetails?.licenseNumber || '',
                      },
                      pharmacistDetails: {
                        qualification: selectedUserForDetails.pharmacistDetails?.qualification || '',
                        licenseNumber: selectedUserForDetails.pharmacistDetails?.licenseNumber || '',
                        experienceYears: selectedUserForDetails.pharmacistDetails?.experienceYears ?? 0,
                      },
                      doctorDetails: {
                        specialization: selectedUserForDetails.doctorDetails?.specialization || '',
                        qualification: selectedUserForDetails.doctorDetails?.qualification || '',
                        medicalRegistrationNumber: selectedUserForDetails.doctorDetails?.medicalRegistrationNumber || '',
                        experienceYears: selectedUserForDetails.doctorDetails?.experienceYears ?? 0,
                      },
                    });
                    setSelectedUserForDetails(null);
                  }}
                  className="px-3 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-800 text-xs font-bold hover:bg-indigo-100 transition-colors flex items-center gap-1"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Edit Profile</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDeleteUser(selectedUserForDetails._id)}
                  className="px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs font-bold hover:bg-rose-100 transition-colors flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete User</span>
                </button>

                <button
                  onClick={() => setSelectedUserForDetails(null)}
                  className="px-4 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: EDIT USER MODAL ================= */}
      {editingUser && (
        <div className="fixed inset-0 z-[145] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl overflow-hidden shadow-2xl p-6 sm:p-8 space-y-6 my-8 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <h3 className="text-lg font-black text-slate-900">Edit User Account</h3>
                <p className="text-xs text-slate-500">Update account details, role specifications, or verification status.</p>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditUser} className="space-y-4 text-xs">
              {/* Basic Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={editingUser.name || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Mobile Number</label>
                  <input
                    type="tel"
                    required
                    value={editingUser.mobile || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, mobile: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={editingUser.email || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Role</label>
                  <select
                    value={editingUser.role || 'pharmacy_owner'}
                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600"
                  >
                    <option value="pharmacy_owner">Pharmacy Owner</option>
                    <option value="job_seeker_pharmacist">Pharmacist</option>
                    <option value="doctor">Doctor</option>
                  </select>
                </div>
              </div>

              {/* Location Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">City</label>
                  <input
                    type="text"
                    value={editingUser.location?.city || ''}
                    onChange={(e) =>
                      setEditingUser({
                        ...editingUser,
                        location: { ...editingUser.location, city: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">State</label>
                  <input
                    type="text"
                    value={editingUser.location?.state || ''}
                    onChange={(e) =>
                      setEditingUser({
                        ...editingUser,
                        location: { ...editingUser.location, state: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Pincode</label>
                  <input
                    type="text"
                    value={editingUser.location?.pincode || ''}
                    onChange={(e) =>
                      setEditingUser({
                        ...editingUser,
                        location: { ...editingUser.location, pincode: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Full Address</label>
                <input
                  type="text"
                  value={editingUser.location?.address || ''}
                  onChange={(e) =>
                    setEditingUser({
                      ...editingUser,
                      location: { ...editingUser.location, address: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600"
                />
              </div>

              {/* Role-Specific fields */}
              {editingUser.role === 'pharmacy_owner' && (
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <h4 className="font-bold text-slate-800">Pharmacy Details</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Pharmacy Name</label>
                      <input
                        type="text"
                        value={editingUser.pharmacyDetails?.pharmacyName || ''}
                        onChange={(e) =>
                          setEditingUser({
                            ...editingUser,
                            pharmacyDetails: { ...editingUser.pharmacyDetails, pharmacyName: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600 bg-white"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Drug License Number</label>
                      <input
                        type="text"
                        value={editingUser.pharmacyDetails?.licenseNumber || ''}
                        onChange={(e) =>
                          setEditingUser({
                            ...editingUser,
                            pharmacyDetails: { ...editingUser.pharmacyDetails, licenseNumber: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600 bg-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {editingUser.role === 'job_seeker_pharmacist' && (
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <h4 className="font-bold text-slate-800">Pharmacist Credentials</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Qualification</label>
                      <input
                        type="text"
                        value={editingUser.pharmacistDetails?.qualification || ''}
                        onChange={(e) =>
                          setEditingUser({
                            ...editingUser,
                            pharmacistDetails: { ...editingUser.pharmacistDetails, qualification: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600 bg-white"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Pharmacy Reg / License</label>
                      <input
                        type="text"
                        value={editingUser.pharmacistDetails?.licenseNumber || ''}
                        onChange={(e) =>
                          setEditingUser({
                            ...editingUser,
                            pharmacistDetails: { ...editingUser.pharmacistDetails, licenseNumber: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600 bg-white"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Experience (Years)</label>
                      <input
                        type="number"
                        min="0"
                        value={editingUser.pharmacistDetails?.experienceYears ?? 0}
                        onChange={(e) =>
                          setEditingUser({
                            ...editingUser,
                            pharmacistDetails: { ...editingUser.pharmacistDetails, experienceYears: Number(e.target.value) },
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600 bg-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {editingUser.role === 'doctor' && (
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <h4 className="font-bold text-slate-800">Doctor Credentials</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Specialization</label>
                      <input
                        type="text"
                        value={editingUser.doctorDetails?.specialization || ''}
                        onChange={(e) =>
                          setEditingUser({
                            ...editingUser,
                            doctorDetails: { ...editingUser.doctorDetails, specialization: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600 bg-white"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Degree / Qualification</label>
                      <input
                        type="text"
                        value={editingUser.doctorDetails?.qualification || ''}
                        onChange={(e) =>
                          setEditingUser({
                            ...editingUser,
                            doctorDetails: { ...editingUser.doctorDetails, qualification: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600 bg-white"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Medical Council Reg</label>
                      <input
                        type="text"
                        value={editingUser.doctorDetails?.medicalRegistrationNumber || ''}
                        onChange={(e) =>
                          setEditingUser({
                            ...editingUser,
                            doctorDetails: { ...editingUser.doctorDetails, medicalRegistrationNumber: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600 bg-white"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Experience (Years)</label>
                      <input
                        type="number"
                        min="0"
                        value={editingUser.doctorDetails?.experienceYears ?? 0}
                        onChange={(e) =>
                          setEditingUser({
                            ...editingUser,
                            doctorDetails: { ...editingUser.doctorDetails, experienceYears: Number(e.target.value) },
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600 bg-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Status Toggles */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex flex-wrap items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                    <input
                      type="checkbox"
                      checked={Boolean(editingUser.isVerified)}
                      onChange={(e) => setEditingUser({ ...editingUser, isVerified: e.target.checked })}
                      className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
                    />
                    <span>Verified Account</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                    <input
                      type="checkbox"
                      checked={Boolean(editingUser.isBlocked)}
                      onChange={(e) => setEditingUser({ ...editingUser, isBlocked: e.target.checked })}
                      className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
                    />
                    <span>Suspended / Blocked Account</span>
                  </label>
                </div>

                {editingUser.isBlocked && (
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Suspension Reason</label>
                    <input
                      type="text"
                      placeholder="e.g. Terms violation or invalid license"
                      value={editingUser.blockReason || ''}
                      onChange={(e) => setEditingUser({ ...editingUser, blockReason: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600 bg-white"
                    />
                  </div>
                )}
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEditUser}
                  className="px-5 py-2 rounded-xl bg-teal-700 text-white text-xs font-bold hover:bg-teal-800 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  {savingEditUser ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>{savingEditUser ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 3: JOB DETAILS MODAL ================= */}
      {selectedJobForDetails && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl overflow-hidden shadow-2xl p-6 sm:p-8 space-y-6 my-8 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-200">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-black text-slate-900">{selectedJobForDetails.title}</h3>
                  <button
                    onClick={() => handleToggleJobStatus(selectedJobForDetails)}
                    className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full transition-colors ${
                      selectedJobForDetails.status === 'active'
                        ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    }`}
                    title="Click to toggle status"
                  >
                    {selectedJobForDetails.status}
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-1">{selectedJobForDetails.pharmacyName}</p>
              </div>
              <button
                onClick={() => setSelectedJobForDetails(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Specifications Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Job Type</span>
                <p className="font-bold text-slate-900">{selectedJobForDetails.jobType || 'Full-time'}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Required Qualification</span>
                <p className="font-bold text-slate-900">{selectedJobForDetails.requiredQualification || 'N/A'}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Salary Range</span>
                <p className="font-bold text-slate-900">{selectedJobForDetails.salaryRange || 'Negotiable'}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Experience Required</span>
                <p className="font-bold text-slate-900">{selectedJobForDetails.experienceRequiredYears ?? 0} Years</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Shift / Timings</span>
                <p className="font-bold text-slate-900">{selectedJobForDetails.shiftTimings || 'Regular Shifts'}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Location & Radius</span>
                <p className="font-bold text-slate-900">
                  {selectedJobForDetails.location?.city || 'Local Area'} (Within {selectedJobForDetails.visibilityRadiusKm || 25} km)
                </p>
              </div>
            </div>

            {/* Address */}
            {selectedJobForDetails.location?.address && (
              <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Full Address</span>
                <p className="font-semibold text-slate-800">{selectedJobForDetails.location.address}</p>
              </div>
            )}

            {/* Description */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Vacancy Description</span>
              <p className="text-slate-800 whitespace-pre-line leading-relaxed">
                {selectedJobForDetails.description || 'No detailed description provided.'}
              </p>
            </div>

            {/* Owner Details */}
            {selectedJobForDetails.ownerId && (
              <div className="p-3 bg-teal-50/50 rounded-xl border border-teal-100 text-xs space-y-1">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Posted By Employer</span>
                <div className="flex flex-wrap items-center gap-4 text-slate-700">
                  <span className="font-bold">{selectedJobForDetails.ownerId.name || 'Owner'}</span>
                  <span>{selectedJobForDetails.ownerId.mobile}</span>
                  <span>{selectedJobForDetails.ownerId.email}</span>
                </div>
              </div>
            )}

            {/* Meta */}
            <div className="text-[11px] text-slate-400 flex justify-between">
              <span>Posted: {formatDate(selectedJobForDetails.createdAt)}</span>
              <span>Job ID: {selectedJobForDetails._id}</span>
            </div>

            {/* Admin Controls Footer */}
            <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-200">
              <button
                onClick={() => handleToggleJobStatus(selectedJobForDetails)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                  selectedJobForDetails.status === 'active'
                    ? 'bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100'
                    : 'bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100'
                }`}
              >
                {selectedJobForDetails.status === 'active' ? 'Close Vacancy' : 'Reopen Vacancy'}
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    handleDeleteJob(selectedJobForDetails._id);
                    setSelectedJobForDetails(null);
                  }}
                  className="px-3 py-2 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs font-bold hover:bg-rose-100 transition-colors flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Vacancy</span>
                </button>

                <button
                  onClick={() => setSelectedJobForDetails(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 4: DOCTOR CHAMBER DETAILS MODAL ================= */}
      {selectedCollabForDetails && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl overflow-hidden shadow-2xl p-6 sm:p-8 space-y-6 my-8 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-200">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-black text-slate-900">
                    Needs: {selectedCollabForDetails.specializationNeeded}
                  </h3>
                  <button
                    onClick={() => handleToggleCollabStatus(selectedCollabForDetails)}
                    className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full transition-colors ${
                      selectedCollabForDetails.status === 'active'
                        ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    }`}
                    title="Click to toggle status"
                  >
                    {selectedCollabForDetails.status}
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {selectedCollabForDetails.clinicOrChamberName || selectedCollabForDetails.pharmacyName}
                </p>
              </div>
              <button
                onClick={() => setSelectedCollabForDetails(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Specifications Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Preferred Timings</span>
                <p className="font-bold text-slate-900">{selectedCollabForDetails.preferredTimings || 'Flexible'}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Consultation Days</span>
                <p className="font-bold text-slate-900">{selectedCollabForDetails.consultationDays || 'All Week'}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Collaboration Terms</span>
                <p className="font-bold text-emerald-800">{selectedCollabForDetails.collaborationTerms || 'Mutual Agreement'}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Location & Radius</span>
                <p className="font-bold text-slate-900">
                  {selectedCollabForDetails.location?.city || 'Local Area'} (Within {selectedCollabForDetails.visibilityRadiusKm || 30} km)
                </p>
              </div>
            </div>

            {/* Facilities & Address */}
            <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Chamber Facilities</span>
              <p className="font-semibold text-slate-800">
                {Array.isArray(selectedCollabForDetails.chamberFacilities) && selectedCollabForDetails.chamberFacilities.length > 0
                  ? selectedCollabForDetails.chamberFacilities.join(', ')
                  : selectedCollabForDetails.facilitiesAvailable || 'Standard Clinic Equipment'}
              </p>
            </div>

            {selectedCollabForDetails.location?.address && (
              <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Full Address</span>
                <p className="font-semibold text-slate-800">{selectedCollabForDetails.location.address}</p>
              </div>
            )}

            {/* Additional Details */}
            {(selectedCollabForDetails.description || selectedCollabForDetails.additionalNotes) && (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Details & Terms</span>
                <p className="text-slate-800 whitespace-pre-line leading-relaxed">
                  {selectedCollabForDetails.description || selectedCollabForDetails.additionalNotes}
                </p>
              </div>
            )}

            {/* Owner Details */}
            {selectedCollabForDetails.ownerId && (
              <div className="p-3 bg-teal-50/50 rounded-xl border border-teal-100 text-xs space-y-1">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Posted By Organizer</span>
                <div className="flex flex-wrap items-center gap-4 text-slate-700">
                  <span className="font-bold">{selectedCollabForDetails.ownerId.name || 'Organizer'}</span>
                  <span>{selectedCollabForDetails.ownerId.mobile}</span>
                  <span>{selectedCollabForDetails.ownerId.email}</span>
                </div>
              </div>
            )}

            {/* Meta */}
            <div className="text-[11px] text-slate-400 flex justify-between">
              <span>Posted: {formatDate(selectedCollabForDetails.createdAt)}</span>
              <span>Listing ID: {selectedCollabForDetails._id}</span>
            </div>

            {/* Admin Controls Footer */}
            <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-200">
              <button
                onClick={() => handleToggleCollabStatus(selectedCollabForDetails)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                  selectedCollabForDetails.status === 'active'
                    ? 'bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100'
                    : 'bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100'
                }`}
              >
                {selectedCollabForDetails.status === 'active' ? 'Close Chamber Listing' : 'Reopen Chamber Listing'}
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    handleDeleteCollab(selectedCollabForDetails._id);
                    setSelectedCollabForDetails(null);
                  }}
                  className="px-3 py-2 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs font-bold hover:bg-rose-100 transition-colors flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Listing</span>
                </button>

                <button
                  onClick={() => setSelectedCollabForDetails(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* License Preview Modal */}
      {previewDocUrl && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl overflow-hidden shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h4 className="font-bold text-slate-900">License Document Inspection</h4>
              <button
                onClick={() => setPreviewDocUrl('')}
                className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-auto rounded-xl bg-slate-100 flex items-center justify-center p-4">
              {previewDocUrl.endsWith('.pdf') ? (
                <iframe src={previewDocUrl} className="w-full h-[500px]" title="Document Preview" />
              ) : (
                <img
                  src={previewDocUrl}
                  alt="License Credential"
                  className="max-h-[500px] w-auto object-contain rounded-lg shadow"
                />
              )}
            </div>

            <div className="flex justify-end">
              <a
                href={previewDocUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-700 text-white rounded-xl text-xs font-bold"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open in New Tab</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
