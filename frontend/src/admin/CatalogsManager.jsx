import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  Trash2,
  Edit,
  Eye,
  Loader2,
  Globe,
  MapPin,
  Phone,
  Mail,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  Check,
  X,
  MessageCircle,
  User,
  ChevronLeft,
  ChevronRight,
  Download,
  Upload,
  RotateCcw,
  FileText,
  CheckSquare,
  Square
} from 'lucide-react';
import catalogApi from '../utils/catalogApi';
import SingleAddressAutocomplete from '../components/services/SingleAddressAutocomplete';
import { INDIAN_STATES, PHARMACY_CATEGORIES } from '../utils/catalogConstants';
import { useModal } from '../context/ModalContext';
import { lockScroll, unlockScroll } from '../utils/scrollLock';
import { resolveDocumentUrl, formatFileSize } from '../utils/documentUtils';

export default function CatalogsManager() {
  const { showModal } = useModal();

  // Overview stats
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Distributors listing & pagination
  const [distributors, setDistributors] = useState([]);
  const [totalDistributors, setTotalDistributors] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 12;

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [entryTypeFilter, setEntryTypeFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [stateFilter, setStateFilter] = useState('All');
  const [loadingDistributors, setLoadingDistributors] = useState(false);

  // Modals state
  const [createDistributorOpen, setCreateDistributorOpen] = useState(false);
  const [editingDistributor, setEditingDistributor] = useState(null);
  const [detailsDistributor, setDetailsDistributor] = useState(null);

  // Rejection modal
  const [rejectingDistributor, setRejectingDistributor] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectingLoading, setRejectingLoading] = useState(false);

  // Action status message
  const [actionMessage, setActionMessage] = useState('');
  const showNotification = (msg) => {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(''), 4000);
  };

  // Form State for Create / Edit
  const initialDistributorForm = {
    entryType: 'admin_entry',
    firmName: '',
    contactPerson: '',
    mobile: '',
    alternateMobile: '',
    whatsappNumber: '',
    email: '',
    categories: [],
    otherCategory: '',
    officeAddress: '',
    city: '',
    state: '',
    pincode: '',
    coordinates: [0, 0],
    panIndia: false,
    statesCovered: [],
    drugLicenseNumber: '',
    gstNumber: '',
    catalogDocument: null,
    drugLicenseDocument: null,
    minimumOrderValue: '',
    deliveryLeadTime: '24-48 Hours',
    paymentTerms: 'Credit / COD / Advance',
    notes: '',
    adminNotes: ''
  };

  const [formDistributor, setFormDistributor] = useState(initialDistributorForm);
  const [submittingForm, setSubmittingForm] = useState(false);
  const [formError, setFormError] = useState('');

  // Upload progress
  const [uploadingCatalog, setUploadingCatalog] = useState(false);
  const [uploadingLicense, setUploadingLicense] = useState(false);

  // Lock body scroll when any modal is open
  useEffect(() => {
    const isModalOpen =
      createDistributorOpen ||
      Boolean(editingDistributor) ||
      Boolean(detailsDistributor) ||
      Boolean(rejectingDistributor);

    if (isModalOpen) {
      lockScroll();
      return () => {
        unlockScroll();
      };
    }
  }, [createDistributorOpen, editingDistributor, detailsDistributor, rejectingDistributor]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, statusFilter, entryTypeFilter, categoryFilter, stateFilter]);

  // Fetch admin stats
  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const res = await catalogApi.get('/admin/stats');
      if (res.data?.success) {
        setStats(res.data.stats || {});
      }
    } catch (err) {
      console.error('Error loading admin stats:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  // Fetch distributors
  const fetchDistributors = async () => {
    setLoadingDistributors(true);
    try {
      const params = {
        page: currentPage,
        limit: pageSize,
        search: debouncedSearch.trim() || undefined,
        status: statusFilter !== 'All' ? statusFilter : undefined,
        entryType: entryTypeFilter !== 'All' ? entryTypeFilter : undefined,
        category: categoryFilter !== 'All' ? categoryFilter : undefined,
        state: stateFilter !== 'All' ? stateFilter : undefined
      };

      const res = await catalogApi.get('/admin/distributors', { params });
      if (res.data?.success) {
        setDistributors(res.data.distributors || []);
        setTotalDistributors(res.data.total || 0);
        setTotalPages(res.data.pages || 1);
      }
    } catch (err) {
      console.error('Error fetching admin distributors:', err);
    } finally {
      setLoadingDistributors(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchDistributors();
  }, [currentPage, debouncedSearch, statusFilter, entryTypeFilter, categoryFilter, stateFilter]);

  // Approve distributor
  const handleApprove = async (id, firmName) => {
    try {
      const res = await catalogApi.patch(`/admin/distributors/${id}/status`, {
        status: 'approved'
      });
      if (res.data?.success) {
        showNotification(`Distributor "${firmName}" approved and published to directory.`);
        fetchDistributors();
        fetchStats();
      }
    } catch (err) {
      console.error('Error approving distributor:', err);
      showModal({
        title: 'Action Failed',
        message: err.response?.data?.message || 'Failed to approve distributor.',
        type: 'danger'
      });
    }
  };

  // Open reject modal
  const handleOpenReject = (dist) => {
    setRejectingDistributor(dist);
    setRejectReason('');
  };

  // Submit reject
  const handleConfirmReject = async () => {
    if (!rejectingDistributor) return;
    setRejectingLoading(true);
    try {
      const res = await catalogApi.patch(`/admin/distributors/${rejectingDistributor._id}/status`, {
        status: 'rejected',
        adminNotes: rejectReason.trim()
      });
      if (res.data?.success) {
        showNotification(`Distributor "${rejectingDistributor.firmName}" marked as rejected.`);
        setRejectingDistributor(null);
        fetchDistributors();
        fetchStats();
      }
    } catch (err) {
      console.error('Error rejecting distributor:', err);
      showModal({
        title: 'Action Failed',
        message: err.response?.data?.message || 'Failed to update distributor status.',
        type: 'danger'
      });
    } finally {
      setRejectingLoading(false);
    }
  };

  // Delete distributor with confirmation
  const handleDelete = (id, firmName) => {
    showModal({
      title: 'Delete Distributor Listing',
      message: `Are you sure you want to permanently delete "${firmName}"? This action cannot be reversed.`,
      type: 'confirm',
      confirmText: 'Delete Permanently',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          const res = await catalogApi.delete(`/admin/distributors/${id}`);
          if (res.data?.success) {
            showNotification(`Distributor "${firmName}" permanently removed.`);
            fetchDistributors();
            fetchStats();
          }
        } catch (err) {
          console.error('Error deleting distributor:', err);
          showModal({
            title: 'Delete Failed',
            message: err.response?.data?.message || 'Failed to delete distributor.',
            type: 'danger'
          });
        }
      }
    });
  };

  // Open Direct Add Distributor Modal
  const handleOpenCreateModal = () => {
    setFormDistributor({ ...initialDistributorForm, entryType: 'admin_entry' });
    setFormError('');
    setCreateDistributorOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (dist) => {
    setEditingDistributor(dist);
    setFormDistributor({
      entryType: dist.entryType || 'admin_entry',
      firmName: dist.firmName || '',
      contactPerson: dist.contactPerson || '',
      mobile: dist.mobile || '',
      alternateMobile: dist.alternateMobile || '',
      whatsappNumber: dist.whatsappNumber || '',
      email: dist.email || '',
      categories: Array.isArray(dist.categories) ? dist.categories : [],
      otherCategory: dist.otherCategory || '',
      officeAddress: dist.officeAddress || '',
      city: dist.city || '',
      state: dist.state || '',
      pincode: dist.pincode || '',
      coordinates: dist.location?.coordinates || [0, 0],
      panIndia: Boolean(dist.supplyCoverage?.panIndia),
      statesCovered: Array.isArray(dist.supplyCoverage?.statesCovered) ? dist.supplyCoverage.statesCovered : [],
      drugLicenseNumber: dist.drugLicenseNumber || '',
      gstNumber: dist.gstNumber || '',
      catalogDocument: dist.catalogDocument?.url ? dist.catalogDocument : null,
      drugLicenseDocument: dist.drugLicenseDocument?.url ? dist.drugLicenseDocument : null,
      minimumOrderValue: dist.minimumOrderValue ? String(dist.minimumOrderValue) : '',
      deliveryLeadTime: dist.deliveryLeadTime || '24-48 Hours',
      paymentTerms: dist.paymentTerms || 'Credit / COD / Advance',
      notes: dist.notes || '',
      adminNotes: dist.adminNotes || ''
    });
    setFormError('');
  };

  // Handle Document Upload in Admin Modal
  const handleFileUpload = async (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 100 * 1024 * 1024) {
      showModal({
        title: 'File Too Large',
        message: 'The file exceeds the 100 MB limit. Please select a document under 100 MB.',
        type: 'warning'
      });
      return;
    }

    const isCatalog = type === 'catalog';
    if (isCatalog) setUploadingCatalog(true);
    else setUploadingLicense(true);

    try {
      const uploadForm = new FormData();
      uploadForm.append('file', file);

      const folder = isCatalog ? 'catalogs' : 'licenses';
      const res = await catalogApi.post(`/upload-document?folder=${folder}`, uploadForm, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data?.success && res.data.document) {
        if (isCatalog) {
          setFormDistributor((prev) => ({ ...prev, catalogDocument: res.data.document }));
          showNotification('Product catalog document uploaded and sanitized successfully.');
        } else {
          setFormDistributor((prev) => ({ ...prev, drugLicenseDocument: res.data.document }));
          showNotification('Drug license document uploaded and verified.');
        }
      }
    } catch (err) {
      console.error('File upload failed:', err);
      showModal({
        title: 'Upload Failed',
        message: err.response?.data?.message || 'File upload failed validation checks.',
        type: 'danger'
      });
    } finally {
      if (isCatalog) setUploadingCatalog(false);
      else setUploadingLicense(false);
    }
  };

  // Toggle category
  const toggleCategory = (cat) => {
    setFormDistributor((prev) => {
      const exists = prev.categories.includes(cat);
      const updated = exists ? prev.categories.filter((c) => c !== cat) : [...prev.categories, cat];
      return { ...prev, categories: updated };
    });
  };

  // Toggle state covered
  const toggleCoveredState = (st) => {
    setFormDistributor((prev) => {
      const exists = prev.statesCovered.includes(st);
      const updated = exists ? prev.statesCovered.filter((s) => s !== st) : [...prev.statesCovered, st];
      return { ...prev, statesCovered: updated };
    });
  };

  // Save Distributor (Create or Edit)
  const handleSaveDistributor = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formDistributor.firmName.trim()) {
      setFormError('Firm name is required.');
      return;
    }
    if (!formDistributor.officeAddress.trim()) {
      setFormError('Consolidated location / address is required.');
      return;
    }
    if (!formDistributor.mobile.trim() || !/^[6-9]\d{9}$/.test(formDistributor.mobile.trim())) {
      setFormError('Valid 10-digit primary mobile number is required.');
      return;
    }
    if (formDistributor.categories.length === 0 && !formDistributor.otherCategory.trim()) {
      setFormError('Please select at least one product category.');
      return;
    }

    setSubmittingForm(true);
    try {
      const payload = {
        entryType: formDistributor.entryType || 'admin_entry',
        firmName: formDistributor.firmName.trim(),
        contactPerson: formDistributor.contactPerson.trim(),
        mobile: formDistributor.mobile.trim(),
        alternateMobile: formDistributor.alternateMobile.trim(),
        whatsappNumber: formDistributor.whatsappNumber.trim(),
        email: formDistributor.email.trim(),
        categories: formDistributor.categories,
        otherCategory: formDistributor.otherCategory.trim(),
        officeAddress: formDistributor.officeAddress.trim(),
        city: formDistributor.city.trim(),
        state: formDistributor.state.trim(),
        pincode: formDistributor.pincode.trim(),
        coordinates: formDistributor.coordinates,
        panIndia: formDistributor.panIndia,
        statesCovered: formDistributor.statesCovered,
        drugLicenseNumber: formDistributor.drugLicenseNumber.trim(),
        gstNumber: formDistributor.gstNumber.trim(),
        catalogDocument: formDistributor.catalogDocument,
        drugLicenseDocument: formDistributor.drugLicenseDocument,
        minimumOrderValue: formDistributor.minimumOrderValue ? Number(formDistributor.minimumOrderValue) : 0,
        deliveryLeadTime: formDistributor.deliveryLeadTime.trim(),
        paymentTerms: formDistributor.paymentTerms.trim(),
        notes: formDistributor.notes.trim(),
        adminNotes: formDistributor.adminNotes.trim()
      };

      if (editingDistributor) {
        const res = await catalogApi.put(`/admin/distributors/${editingDistributor._id}`, payload);
        if (res.data?.success) {
          showNotification(`Distributor "${payload.firmName}" updated successfully.`);
          setEditingDistributor(null);
          fetchDistributors();
          fetchStats();
        }
      } else {
        const res = await catalogApi.post('/admin/distributors', payload);
        if (res.data?.success) {
          showNotification(`Distributor "${payload.firmName}" created and approved.`);
          setCreateDistributorOpen(false);
          fetchDistributors();
          fetchStats();
        }
      }
    } catch (err) {
      console.error('Error saving distributor:', err);
      setFormError(err.response?.data?.message || 'Failed to save distributor details.');
    } finally {
      setSubmittingForm(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto pb-12">
      {/* Top Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-600 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-teal-800">Platform Directory Administration</span>
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 font-outfit mt-1">
            Distributors Directory Manager
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Manage pharmaceutical distributors, approve community contributions, upload catalogs, and oversee verified listings.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="px-4 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Distributor</span>
        </button>
      </div>

      {/* Action Notification Alert */}
      {actionMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-2xl flex items-center gap-2.5 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Overview Metric Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Total */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Total Listings</span>
            <Building2 className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 font-outfit">
            {loadingStats ? <Loader2 className="w-5 h-5 animate-spin text-teal-600" /> : stats?.totalDistributors || 0}
          </div>
          <span className="text-[11px] text-slate-400 font-medium">All registered entities</span>
        </div>

        {/* Pending Review */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-amber-200/90 bg-amber-50/20 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-800">Pending Review</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-900 font-outfit">
            {loadingStats ? <Loader2 className="w-5 h-5 animate-spin text-amber-600" /> : stats?.pendingDistributors || 0}
          </div>
          <span className="text-[11px] text-amber-700 font-medium">Awaiting verification</span>
        </div>

        {/* Approved Live */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-emerald-200/90 bg-emerald-50/20 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800">Approved Live</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-900 font-outfit">
            {loadingStats ? <Loader2 className="w-5 h-5 animate-spin text-emerald-600" /> : stats?.approvedDistributors || 0}
          </div>
          <span className="text-[11px] text-emerald-700 font-medium">Publicly listed</span>
        </div>

        {/* Catalogs Uploaded */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-teal-200/90 bg-teal-50/20 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-teal-800">Catalogs Uploaded</span>
            <FileText className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-teal-900 font-outfit">
            {loadingStats ? <Loader2 className="w-5 h-5 animate-spin text-teal-600" /> : stats?.withCatalogCount || 0}
          </div>
          <span className="text-[11px] text-teal-700 font-medium">Entities with catalog doc</span>
        </div>

        {/* Pan-India Delivery */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Pan-India Reach</span>
            <Globe className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 font-outfit">
            {loadingStats ? <Loader2 className="w-5 h-5 animate-spin text-teal-600" /> : stats?.panIndiaDistributors || 0}
          </div>
          <span className="text-[11px] text-slate-400 font-medium">National distribution</span>
        </div>

        {/* Pharmacist Recommended */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-sky-200/90 bg-sky-50/20 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-sky-800">Pharmacist Inputs</span>
            <User className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-sky-900 font-outfit">
            {loadingStats ? <Loader2 className="w-5 h-5 animate-spin text-sky-600" /> : stats?.pharmacistEntryCount || 0}
          </div>
          <span className="text-[11px] text-sky-700 font-medium">Community submissions</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-4 sm:p-6 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Keyword Search */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search firm name, mobile, DL, address, category..."
              maxLength={100}
              className="w-full h-11 pl-10 pr-9 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600 bg-slate-50/70 focus:bg-white transition-all font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full h-11 px-3 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600 bg-slate-50/70 focus:bg-white font-medium text-slate-700"
            >
              <option value="All">All Statuses</option>
              <option value="pending_approval">Pending Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="draft">Draft</option>
            </select>
          </div>

          {/* Persona Filter */}
          <div>
            <select
              value={entryTypeFilter}
              onChange={(e) => setEntryTypeFilter(e.target.value)}
              className="w-full h-11 px-3 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600 bg-slate-50/70 focus:bg-white font-medium text-slate-700"
            >
              <option value="All">All Submission Types</option>
              <option value="distributor_self">Distributor Self-Registration</option>
              <option value="pharmacist_entry">Pharmacist Recommendation</option>
              <option value="admin_entry">Admin Direct Entry</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full h-11 px-3 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600 bg-slate-50/70 focus:bg-white font-medium text-slate-700"
            >
              <option value="All">All Categories</option>
              {PHARMACY_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* State filter row & reset */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-500">Filter by State:</span>
            <select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              className="h-8 px-2.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 bg-white"
            >
              <option value="All">All States</option>
              {INDIAN_STATES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          {(statusFilter !== 'All' || entryTypeFilter !== 'All' || categoryFilter !== 'All' || stateFilter !== 'All' || debouncedSearch) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('All');
                setEntryTypeFilter('All');
                setCategoryFilter('All');
                setStateFilter('All');
              }}
              className="text-teal-700 hover:underline font-bold flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Distributors Directory List / Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
        {loadingDistributors ? (
          <div className="p-16 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-teal-600 animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-semibold">Loading distributors...</p>
          </div>
        ) : distributors.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <Building2 className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">No distributors matching filters</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No directory entries matched your current search and filter combination.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="px-5 py-3.5">Distributor / Firm</th>
                  <th className="px-4 py-3.5">Submission Source</th>
                  <th className="px-4 py-3.5">Categories</th>
                  <th className="px-4 py-3.5">Location</th>
                  <th className="px-4 py-3.5">Catalog Doc</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {distributors.map((dist) => {
                  const hasCatalog = Boolean(dist.catalogDocument?.url);
                  const isPanIndia = Boolean(dist.supplyCoverage?.panIndia);

                  return (
                    <tr key={dist._id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Firm & Contact */}
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-900 text-sm">{dist.firmName}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {dist.contactPerson ? `${dist.contactPerson} • ` : ''}
                          <a href={`tel:${dist.mobile}`} className="text-teal-700 font-semibold hover:underline">
                            {dist.mobile}
                          </a>
                        </div>
                        {dist.drugLicenseNumber && (
                          <div className="text-[10px] text-slate-400 mt-0.5">DL: {dist.drugLicenseNumber}</div>
                        )}
                      </td>

                      {/* Persona Source */}
                      <td className="px-4 py-4">
                        {dist.entryType === 'pharmacist_entry' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-sky-50 text-sky-800 border border-sky-200 text-[10px] font-bold">
                            Pharmacist Rec.
                          </span>
                        ) : dist.entryType === 'admin_entry' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-bold">
                            Admin Entry
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200 text-[10px] font-bold">
                            Distributor Direct
                          </span>
                        )}
                        {dist.submitterName && (
                          <div className="text-[10px] text-slate-400 mt-1">by: {dist.submitterName}</div>
                        )}
                      </td>

                      {/* Categories */}
                      <td className="px-4 py-4 max-w-[200px]">
                        <div className="flex flex-wrap gap-1">
                          {Array.isArray(dist.categories) && dist.categories.length > 0 ? (
                            dist.categories.slice(0, 2).map((c) => (
                              <span
                                key={c}
                                className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-medium"
                              >
                                {c}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-400">None</span>
                          )}
                          {dist.categories?.length > 2 && (
                            <span className="text-[10px] text-slate-400 font-bold">+{dist.categories.length - 2}</span>
                          )}
                        </div>
                      </td>

                      {/* Location & Coverage */}
                      <td className="px-4 py-4 max-w-[220px]">
                        <div className="truncate font-medium text-slate-800" title={dist.officeAddress}>
                          {dist.officeAddress || [dist.city, dist.state].filter(Boolean).join(', ') || 'India'}
                        </div>
                        <div className="mt-1">
                          {isPanIndia ? (
                            <span className="px-2 py-0.5 bg-teal-50 text-teal-800 border border-teal-200/80 rounded text-[10px] font-bold">
                              Pan-India
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-medium">
                              {dist.state || 'Local State'}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Catalog Doc */}
                      <td className="px-4 py-4">
                        {hasCatalog ? (
                          <div className="space-y-1">
                            <a
                              href={resolveDocumentUrl(dist.catalogDocument.url)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-50 text-teal-800 hover:bg-teal-100 border border-teal-200 text-[11px] font-bold transition-colors"
                              title={dist.catalogDocument.originalName || 'Download Catalog Document'}
                            >
                              <FileText className="w-3.5 h-3.5 text-teal-700 flex-shrink-0" />
                              <span className="max-w-[110px] truncate">{dist.catalogDocument.originalName || 'Catalog Doc'}</span>
                              <ExternalLink className="w-3 h-3 text-teal-600 flex-shrink-0 ml-0.5" />
                            </a>
                            {dist.catalogDocument.size > 0 && (
                              <div className="text-[10px] text-slate-400 font-medium pl-0.5">
                                {formatFileSize(dist.catalogDocument.size)}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-400 text-[10px] font-medium">
                            No Catalog
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                            dist.status === 'approved'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : dist.status === 'rejected'
                              ? 'bg-rose-50 text-rose-800 border border-rose-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {dist.status === 'approved' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                          {dist.status === 'rejected' && <XCircle className="w-3 h-3 text-rose-600" />}
                          {dist.status === 'pending_approval' && <Clock className="w-3 h-3 text-amber-600" />}
                          <span className="capitalize">{dist.status.replace('_', ' ')}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {dist.status === 'pending_approval' && (
                            <>
                              <button
                                onClick={() => handleApprove(dist._id, dist.firmName)}
                                className="p-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg transition-colors"
                                title="Approve Distributor"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleOpenReject(dist)}
                                className="p-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg transition-colors"
                                title="Reject Distributor"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          )}

                          <button
                            onClick={() => setDetailsDistributor(dist)}
                            className="p-1.5 text-slate-500 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors"
                            title="View Full Profile"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleOpenEditModal(dist)}
                            className="p-1.5 text-slate-500 hover:text-sky-700 hover:bg-sky-50 rounded-lg transition-colors"
                            title="Edit Details"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleDelete(dist._id, dist.firmName)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete Listing"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="px-5 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 font-semibold bg-slate-50/50">
            <span>
              Showing Page {currentPage} of {totalPages} ({totalDistributors} total entries)
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 font-bold"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Prev</span>
              </button>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 font-bold"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ================= MODAL: CREATE / EDIT DISTRIBUTOR ================= */}
      <AnimatePresence>
        {(createDistributorOpen || Boolean(editingDistributor)) && (
          <motion.div
            key="admin-distributor-form-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            onClick={() => {
              setCreateDistributorOpen(false);
              setEditingDistributor(null);
            }}
            className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm p-2 sm:p-4 md:p-6 flex items-center justify-center overscroll-contain transform-gpu"
          >
            <motion.div
              key="admin-distributor-form-card"
              initial={{ opacity: 0, scale: 0.98, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 8 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl flex flex-col max-h-[92dvh] sm:max-h-[88vh] overflow-hidden overscroll-contain my-auto border border-slate-100"
            >
            {/* Header */}
            <div className="flex-shrink-0 px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-white z-10">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                  {editingDistributor ? 'Edit Listing' : 'Admin Direct Entry'}
                </span>
                <h3 className="font-extrabold text-slate-900 text-base sm:text-lg font-outfit">
                  {editingDistributor ? `Edit: ${editingDistributor.firmName}` : 'Add Distributor to Directory'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setCreateDistributorOpen(false);
                  setEditingDistributor(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSaveDistributor} className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5 overscroll-contain touch-pan-y text-xs">
                {formError && (
                  <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 font-semibold rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Firm Name & Contact Person */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Distributor / Firm Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formDistributor.firmName}
                      onChange={(e) => setFormDistributor({ ...formDistributor, firmName: e.target.value })}
                      placeholder="e.g. MediCore Pharmaceuticals"
                      maxLength={120}
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Contact Person Name</label>
                    <input
                      type="text"
                      value={formDistributor.contactPerson}
                      onChange={(e) => setFormDistributor({ ...formDistributor, contactPerson: e.target.value })}
                      placeholder="e.g. Ramesh Chandra"
                      maxLength={80}
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600"
                    />
                  </div>
                </div>

                {/* Mobile & WhatsApp */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Primary Mobile Number <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={formDistributor.mobile}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setFormDistributor({ ...formDistributor, mobile: val });
                      }}
                      placeholder="10-digit mobile"
                      maxLength={10}
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">WhatsApp Number (Optional)</label>
                    <input
                      type="tel"
                      value={formDistributor.whatsappNumber}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setFormDistributor({ ...formDistributor, whatsappNumber: val });
                      }}
                      placeholder="10-digit WhatsApp"
                      maxLength={10}
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600"
                    />
                  </div>
                </div>

                {/* Categories Dealt In */}
                <div className="space-y-2">
                  <label className="block font-bold text-slate-700">
                    Categories Dealt In <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {PHARMACY_CATEGORIES.map((cat) => {
                      const isSelected = formDistributor.categories.includes(cat);
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => toggleCategory(cat)}
                          className={`p-2 rounded-xl border text-left font-semibold flex items-center gap-1.5 transition-colors ${
                            isSelected
                              ? 'bg-teal-50 border-teal-600 text-teal-900 font-bold'
                              : 'bg-slate-50 border-slate-200 text-slate-700'
                          }`}
                        >
                          {isSelected ? (
                            <CheckSquare className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
                          ) : (
                            <Square className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                          )}
                          <span className="truncate">{cat}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Address & Location (Single Consolidated Field) */}
                <div>
                  <SingleAddressAutocomplete
                    value={formDistributor.officeAddress}
                    onChange={(loc) => {
                      setFormDistributor({
                        ...formDistributor,
                        officeAddress: loc.address,
                        city: loc.city || formDistributor.city,
                        state: loc.state || formDistributor.state,
                        pincode: loc.pincode || formDistributor.pincode,
                        coordinates: loc.coordinates || formDistributor.coordinates
                      });
                    }}
                    allowGps={true}
                    placeholder="Search address or location, or detect with GPS..."
                    helperText="Single unified address field with automatic city, state, and coordinates extraction."
                  />
                </div>

                {/* Delivery Coverage */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-800">Pan-India Delivery</span>
                      <p className="text-[11px] text-slate-500">Enable if distributor ships across all states</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormDistributor({ ...formDistributor, panIndia: !formDistributor.panIndia })}
                      className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors ${
                        formDistributor.panIndia ? 'bg-teal-700' : 'bg-slate-300'
                      }`}
                    >
                      <div
                        className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform ${
                          formDistributor.panIndia ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {!formDistributor.panIndia && (
                    <div className="pt-2 border-t border-slate-200 space-y-1.5">
                      <label className="block font-bold text-slate-700">Covered States</label>
                      <div className="max-h-28 overflow-y-auto p-1.5 bg-white rounded-lg border border-slate-200 grid grid-cols-2 gap-1">
                        {INDIAN_STATES.map((st) => (
                          <label key={st} className="flex items-center gap-1.5 text-[11px] cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formDistributor.statesCovered.includes(st)}
                              onChange={() => toggleCoveredState(st)}
                              className="rounded text-teal-600"
                            />
                            <span className="truncate">{st}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Upload Catalog PDF */}
                <div className="p-3.5 bg-teal-50/40 rounded-xl border border-teal-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-teal-700" />
                      Product Catalog Document (PDF / DOC / XLS){' '}
                      <span className="text-slate-400 font-normal text-xs">(Optional)</span>
                    </span>
                    {formDistributor.catalogDocument && (
                      <button
                        type="button"
                        onClick={() => setFormDistributor({ ...formDistributor, catalogDocument: null })}
                        className="text-[11px] text-rose-600 font-bold hover:underline"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  {formDistributor.catalogDocument ? (
                    <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between gap-2 text-xs text-emerald-800 font-semibold">
                      <div className="min-w-0 flex-1 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                        <span className="truncate">{formDistributor.catalogDocument.originalName || 'Catalog uploaded'}</span>
                        {formDistributor.catalogDocument.size > 0 && (
                          <span className="text-[10px] text-emerald-600 font-medium flex-shrink-0">
                            ({formatFileSize(formDistributor.catalogDocument.size)})
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {formDistributor.catalogDocument.url && (
                          <a
                            href={resolveDocumentUrl(formDistributor.catalogDocument.url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 text-emerald-700 hover:text-emerald-900 rounded hover:bg-emerald-100"
                            title="Preview Document"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                        <span className="text-[10px] bg-emerald-100 px-2 py-0.5 rounded-full font-bold">Verified</span>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label
                        className={`w-full py-2.5 px-3 border border-dashed rounded-xl flex items-center justify-center gap-2 font-bold cursor-pointer transition-colors ${
                          uploadingCatalog
                            ? 'bg-slate-100 text-slate-400 border-slate-300'
                            : 'border-teal-300 text-teal-800 hover:bg-teal-50'
                        }`}
                      >
                        {uploadingCatalog ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-600" />
                            <span>Sanitizing document...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-3.5 h-3.5 text-teal-600" />
                            <span>Upload Catalog File (Max 100MB)</span>
                          </>
                        )}
                        <input
                          type="file"
                          disabled={uploadingCatalog}
                          onChange={(e) => handleFileUpload(e, 'catalog')}
                          accept=".pdf,.doc,.docx,.xls,.xlsx,.csv"
                          className="hidden"
                        />
                      </label>
                    </div>
                  )}
                </div>

                {/* Drug license & GST */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Drug License Number</label>
                    <input
                      type="text"
                      value={formDistributor.drugLicenseNumber}
                      onChange={(e) => setFormDistributor({ ...formDistributor, drugLicenseNumber: e.target.value })}
                      placeholder="e.g. DL-20B/21B-XXXX"
                      maxLength={60}
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">GST Number</label>
                    <input
                      type="text"
                      value={formDistributor.gstNumber}
                      onChange={(e) => setFormDistributor({ ...formDistributor, gstNumber: e.target.value.toUpperCase() })}
                      placeholder="e.g. 07AAAAA0000A1Z5"
                      maxLength={15}
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600"
                    />
                  </div>
                </div>

                {/* Admin Notes */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Admin Notes / Remarks</label>
                  <textarea
                    rows={2}
                    value={formDistributor.adminNotes}
                    onChange={(e) => setFormDistributor({ ...formDistributor, adminNotes: e.target.value })}
                    placeholder="Internal verification notes or remarks..."
                    maxLength={500}
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600 resize-none"
                  />
                </div>
              </div>

              {/* Fixed Footer */}
              <div className="flex-shrink-0 px-5 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3 z-10">
                <button
                  type="button"
                  onClick={() => {
                    setCreateDistributorOpen(false);
                    setEditingDistributor(null);
                  }}
                  className="px-4 py-2 font-bold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submittingForm || uploadingCatalog}
                  className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl shadow-md disabled:opacity-50 flex items-center gap-2"
                >
                  {submittingForm && <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />}
                  <span>{editingDistributor ? 'Update Distributor' : 'Save & Publish'}</span>
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>

      {/* ================= MODAL: DETAILS VIEW ================= */}
      <AnimatePresence>
        {detailsDistributor && (
          <motion.div
            key="admin-distributor-details-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            onClick={() => setDetailsDistributor(null)}
            className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm p-2 sm:p-4 md:p-6 flex items-center justify-center overscroll-contain transform-gpu"
          >
            <motion.div
              key="admin-distributor-details-card"
              initial={{ opacity: 0, scale: 0.98, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 8 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl flex flex-col max-h-[92dvh] sm:max-h-[88vh] overflow-hidden overscroll-contain my-auto border border-slate-100"
            >
            <div className="flex-shrink-0 px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base sm:text-lg font-outfit">
                  {detailsDistributor.firmName}
                </h3>
                <span className="text-xs text-slate-500">ID: {detailsDistributor._id}</span>
              </div>
              <button
                onClick={() => setDetailsDistributor(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4 overscroll-contain touch-pan-y text-xs text-slate-700">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Location</span>
                <p className="font-semibold text-slate-900">{detailsDistributor.officeAddress || 'India'}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="font-bold text-slate-400 text-[10px] uppercase">Contact Person</span>
                  <p className="font-bold text-slate-900 mt-0.5">{detailsDistributor.contactPerson || 'None'}</p>
                </div>
                <div>
                  <span className="font-bold text-slate-400 text-[10px] uppercase">Primary Mobile</span>
                  <p className="font-bold text-slate-900 mt-0.5">{detailsDistributor.mobile}</p>
                </div>
                <div>
                  <span className="font-bold text-slate-400 text-[10px] uppercase">Drug License</span>
                  <p className="font-bold text-slate-900 mt-0.5">{detailsDistributor.drugLicenseNumber || 'None'}</p>
                </div>
                <div>
                  <span className="font-bold text-slate-400 text-[10px] uppercase">GST Number</span>
                  <p className="font-bold text-slate-900 mt-0.5">{detailsDistributor.gstNumber || 'None'}</p>
                </div>
              </div>

              {Array.isArray(detailsDistributor.categories) && detailsDistributor.categories.length > 0 && (
                <div>
                  <span className="font-bold text-slate-400 text-[10px] uppercase block mb-1">Categories</span>
                  <div className="flex flex-wrap gap-1.5">
                    {detailsDistributor.categories.map((c) => (
                      <span key={c} className="px-2 py-0.5 bg-teal-50 text-teal-800 rounded-md font-semibold text-xs border border-teal-200/60">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Attached Documents & Verification Section */}
              <div className="p-4 bg-slate-50/90 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-teal-700" />
                    Attached Documents & Verification
                  </span>
                  {detailsDistributor.catalogDocument?.url ? (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Catalog Available
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-slate-200/70 text-slate-600 text-[10px] font-semibold">
                      No Catalog
                    </span>
                  )}
                </div>

                {/* Product Catalog Document Card */}
                {detailsDistributor.catalogDocument?.url ? (
                  <div className="bg-white p-3 rounded-xl border border-teal-200/80 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-slate-900 truncate">
                          {detailsDistributor.catalogDocument.originalName || 'Product Catalog Document'}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                          {detailsDistributor.catalogDocument.size > 0 && (
                            <span className="font-medium">{formatFileSize(detailsDistributor.catalogDocument.size)}</span>
                          )}
                          {detailsDistributor.catalogDocument.uploadedAt && (
                            <span>• Uploaded {new Date(detailsDistributor.catalogDocument.uploadedAt).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <a
                      href={resolveDocumentUrl(detailsDistributor.catalogDocument.url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2 px-3 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>View / Download Product Catalog</span>
                      <ExternalLink className="w-3 h-3 opacity-80" />
                    </a>
                  </div>
                ) : (
                  <div className="p-3 bg-white rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                    No product catalog document was uploaded for this distributor.
                  </div>
                )}

                {/* Drug License Document (if uploaded) */}
                {detailsDistributor.drugLicenseDocument?.url && (
                  <div className="bg-white p-3 rounded-xl border border-indigo-200/80 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-slate-900 truncate">
                          {detailsDistributor.drugLicenseDocument.originalName || 'Drug License Copy'}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                          {detailsDistributor.drugLicenseDocument.size > 0 && (
                            <span className="font-medium">{formatFileSize(detailsDistributor.drugLicenseDocument.size)}</span>
                          )}
                          {detailsDistributor.drugLicenseDocument.uploadedAt && (
                            <span>• Uploaded {new Date(detailsDistributor.drugLicenseDocument.uploadedAt).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <a
                      href={resolveDocumentUrl(detailsDistributor.drugLicenseDocument.url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2 px-3 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Drug License Copy</span>
                      <ExternalLink className="w-3 h-3 opacity-80" />
                    </a>
                  </div>
                )}
              </div>

              {detailsDistributor.adminNotes && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 space-y-1">
                  <span className="font-bold text-amber-800 text-[10px] uppercase">Admin Remarks</span>
                  <p className="text-amber-900">{detailsDistributor.adminNotes}</p>
                </div>
              )}
            </div>

            <div className="flex-shrink-0 px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  const targetDist = detailsDistributor;
                  setDetailsDistributor(null);
                  handleDelete(targetDist._id, targetDist.firmName);
                }}
                className="px-3 py-1.5 text-rose-600 hover:bg-rose-50 text-xs font-bold rounded-xl border border-rose-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Delete this distributor listing"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const targetDist = detailsDistributor;
                    setDetailsDistributor(null);
                    handleOpenEditModal(targetDist);
                  }}
                  className="px-3 py-1.5 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDetailsDistributor(null)}
                  className="px-4 py-1.5 bg-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-300 text-xs cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>

    {/* ================= MODAL: REJECT CONFIRMATION WITH REASON ================= */}
    <AnimatePresence>
      {rejectingDistributor && (
        <motion.div
          key="admin-distributor-reject-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          onClick={() => setRejectingDistributor(null)}
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm p-3 sm:p-6 flex items-center justify-center overscroll-contain transform-gpu"
        >
          <motion.div
            key="admin-distributor-reject-card"
            initial={{ opacity: 0, scale: 0.98, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 8 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 space-y-4 my-auto border border-slate-100"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-rose-100 text-rose-700 rounded-2xl flex-shrink-0">
                <XCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Reject Distributor Listing</h3>
                <p className="text-xs text-slate-500">{rejectingDistributor.firmName}</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Reason for Rejection / Revision Note
              </label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Drug license copy is missing or illegible. Please re-upload with clear credentials."
                maxLength={300}
                className="w-full p-3 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-rose-600 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRejectingDistributor(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={rejectingLoading}
                onClick={handleConfirmReject}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md disabled:opacity-50 flex items-center gap-1.5"
              >
                {rejectingLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />}
                <span>Confirm Rejection</span>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </div>
  );
}
