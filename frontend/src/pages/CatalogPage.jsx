import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  Pill,
  MapPin,
  Search,
  Filter,
  Plus,
  CheckCircle2,
  Clock,
  Lock,
  AlertCircle,
  Phone,
  Mail,
  FileText,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  Globe,
  ShieldCheck,
  Eye,
  Loader2,
  ExternalLink,
  MessageCircle,
  RotateCcw,
  User,
  LogOut,
  Upload,
  Download,
  CheckSquare,
  Square,
  ArrowLeft
} from 'lucide-react';
import SiteHeader from '../components/layout/SiteHeader';
import ServicesAuthModal from '../components/services/ServicesAuthModal';
import SingleAddressAutocomplete from '../components/services/SingleAddressAutocomplete';
import catalogApi from '../utils/catalogApi';
import { INDIAN_STATES, PHARMACY_CATEGORIES } from '../utils/catalogConstants';
import { useModal } from '../context/ModalContext';
import { lockScroll, unlockScroll } from '../utils/scrollLock';
import { resolveDocumentUrl, formatFileSize } from '../utils/documentUtils';

export default function CatalogPage({ embedded = false, parentUser, onOpenAuth }) {
  const { showModal } = useModal();

  // Authentication state
  const [currentUser, setCurrentUser] = useState(() => {
    if (embedded && parentUser !== undefined) {
      return parentUser;
    }
    try {
      const rawUser = localStorage.getItem('service_user');
      const token = localStorage.getItem('service_token');
      if (rawUser && token) {
        return JSON.parse(rawUser);
      }
    } catch {
      return null;
    }
    return null;
  });
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login');
  const [pendingAddAfterAuth, setPendingAddAfterAuth] = useState(false);

  // Directory view: 'directory' | 'my_submissions'
  const [activeTab, setActiveTab] = useState('directory');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedState, setSelectedState] = useState('All');
  const [panIndiaOnly, setPanIndiaOnly] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 12;

  // Data states
  const [distributors, setDistributors] = useState([]);
  const [totalDistributors, setTotalDistributors] = useState(0);
  const [loadingDistributors, setLoadingDistributors] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);

  const [mySubmissions, setMySubmissions] = useState([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

  // Modals state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addModalStep, setAddModalStep] = useState('select'); // 'select' | 'form'
  const [selectedPersona, setSelectedPersona] = useState('distributor_self'); // 'distributor_self' | 'pharmacist_entry'
  const [detailsDistributor, setDetailsDistributor] = useState(null);

  // Form states
  const initialDistributorForm = {
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
    notes: ''
  };

  const [formData, setFormData] = useState(initialDistributorForm);
  const [submittingForm, setSubmittingForm] = useState(false);
  const [formError, setFormError] = useState('');

  // Document upload state
  const [uploadingCatalog, setUploadingCatalog] = useState(false);
  const [uploadingLicense, setUploadingLicense] = useState(false);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState({ text: '', type: 'success' });
  const showToast = (text, type = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage({ text: '', type: 'success' }), 4500);
  };

  // Lock body scroll with scrollbar width compensation whenever any modal is active
  useEffect(() => {
    const isAnyModalActive = addModalOpen || Boolean(detailsDistributor) || authModalOpen;

    if (isAnyModalActive) {
      lockScroll();
      return () => {
        unlockScroll();
      };
    }
  }, [addModalOpen, detailsDistributor, authModalOpen]);

  // Read current user
  useEffect(() => {
    if (embedded && parentUser !== undefined) {
      setCurrentUser(parentUser);
      return;
    }

    const checkAuth = () => {
      try {
        const rawUser = localStorage.getItem('service_user');
        const token = localStorage.getItem('service_token');
        if (rawUser && token) {
          const parts = token.split('.');
          if (parts.length === 3) {
            const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
            if (payload.exp && payload.exp * 1000 <= Date.now()) {
              localStorage.removeItem('service_token');
              localStorage.removeItem('service_user');
              setCurrentUser(null);
              return;
            }
          }
          setCurrentUser(JSON.parse(rawUser));
        } else {
          setCurrentUser(null);
        }
      } catch {
        setCurrentUser(null);
      }
    };

    checkAuth();
    window.addEventListener('service_auth_change', checkAuth);
    return () => window.removeEventListener('service_auth_change', checkAuth);
  }, [embedded, parentUser]);

  // When user signs in after requesting to add distributor, automatically open the add workflow
  useEffect(() => {
    if (currentUser && pendingAddAfterAuth) {
      setPendingAddAfterAuth(false);
      setAddModalStep('select');
      setAddModalOpen(true);
    }
  }, [currentUser, pendingAddAfterAuth]);

  // Debounce search query (350ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset page to 1 when filters or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, selectedCategory, selectedState, panIndiaOnly]);

  // Fetch distributors directory
  const fetchDistributors = async () => {
    setLoadingDistributors(true);
    try {
      const params = {
        page: currentPage,
        limit: pageSize,
        search: debouncedSearch.trim() || undefined,
        category: selectedCategory !== 'All' ? selectedCategory : undefined,
        state: selectedState !== 'All' ? selectedState : undefined,
        panIndiaOnly: panIndiaOnly ? 'true' : undefined
      };

      const res = await catalogApi.get('/distributors', { params });
      if (res.data?.success) {
        setDistributors(res.data.distributors || []);
        setTotalDistributors(res.data.total || 0);
        setTotalPages(res.data.pages || 1);
      }
    } catch (err) {
      console.error('Error fetching distributors:', err);
    } finally {
      setLoadingDistributors(false);
      setInitialLoaded(true);
    }
  };

  useEffect(() => {
    if (activeTab === 'directory') {
      fetchDistributors();
    }
  }, [currentPage, debouncedSearch, selectedCategory, selectedState, panIndiaOnly, activeTab]);

  // Fetch my submissions
  const fetchMySubmissions = async () => {
    if (!currentUser) return;
    setLoadingSubmissions(true);
    try {
      const res = await catalogApi.get('/my-contributions');
      if (res.data?.success) {
        setMySubmissions(res.data.distributors || []);
      }
    } catch (err) {
      console.error('Error loading submissions:', err);
    } finally {
      setLoadingSubmissions(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'my_submissions' && currentUser) {
      fetchMySubmissions();
    }
  }, [activeTab, currentUser]);

  // Open "Add Distributor" flow
  const handleOpenAddDistributor = () => {
    if (!currentUser) {
      setPendingAddAfterAuth(true);
      if (embedded && onOpenAuth) {
        onOpenAuth('login');
      } else {
        setAuthModalMode('login');
        setAuthModalOpen(true);
      }
      return;
    }
    setAddModalStep('select');
    setAddModalOpen(true);
  };

  // Select persona and open form
  const handleSelectPersona = (persona) => {
    if (!currentUser) {
      setAddModalOpen(false);
      setPendingAddAfterAuth(true);
      if (embedded && onOpenAuth) {
        onOpenAuth('login');
      } else {
        setAuthModalMode('login');
        setAuthModalOpen(true);
      }
      return;
    }
    setSelectedPersona(persona);
    setFormData({
      ...initialDistributorForm,
      contactPerson: persona === 'distributor_self' ? currentUser?.name || '' : '',
      mobile: persona === 'distributor_self' ? currentUser?.mobile || '' : ''
    });
    setFormError('');
    setAddModalStep('form');
  };

  // Toggle multi-select category
  const toggleCategory = (cat) => {
    setFormData((prev) => {
      const exists = prev.categories.includes(cat);
      const updated = exists ? prev.categories.filter((c) => c !== cat) : [...prev.categories, cat];
      return { ...prev, categories: updated };
    });
  };

  // Toggle covered states
  const toggleCoveredState = (st) => {
    setFormData((prev) => {
      const exists = prev.statesCovered.includes(st);
      const updated = exists ? prev.statesCovered.filter((s) => s !== st) : [...prev.statesCovered, st];
      return { ...prev, statesCovered: updated };
    });
  };

  // Upload Catalog Document (PDF, DOC, XLS)
  const handleFileUpload = async (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!currentUser) {
      showModal({
        title: 'Authentication Required',
        message: 'Please sign in or create an account to upload documents.',
        type: 'warning'
      });
      if (embedded && onOpenAuth) {
        onOpenAuth('login');
      } else {
        setAuthModalMode('login');
        setAuthModalOpen(true);
      }
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      showModal({
        title: 'File Too Large',
        message: 'The selected file exceeds the 100 MB size limit. Please choose a document under 100 MB.',
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
          setFormData((prev) => ({ ...prev, catalogDocument: res.data.document }));
          showToast('Product catalog uploaded and verified successfully.');
        } else {
          setFormData((prev) => ({ ...prev, drugLicenseDocument: res.data.document }));
          showToast('Drug license document uploaded and verified successfully.');
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

  // Submit Distributor Form
  const handleSubmitDistributor = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!currentUser) {
      setFormError('Authentication required. Please sign in to submit distributor details.');
      if (embedded && onOpenAuth) {
        onOpenAuth('login');
      } else {
        setAuthModalMode('login');
        setAuthModalOpen(true);
      }
      return;
    }

    // Validations
    if (!formData.firmName.trim()) {
      setFormError('Distributor firm name is required.');
      return;
    }
    if (formData.firmName.trim().length > 120) {
      setFormError('Firm name cannot exceed 120 characters.');
      return;
    }

    if (!formData.officeAddress.trim()) {
      setFormError('Consolidated location / address is required.');
      return;
    }

    if (!formData.mobile.trim()) {
      setFormError('Primary mobile number is required.');
      return;
    }
    if (!/^[6-9]\d{9}$/.test(formData.mobile.trim())) {
      setFormError('Mobile number must be a valid 10-digit Indian phone number.');
      return;
    }

    if (formData.categories.length === 0 && !formData.otherCategory.trim()) {
      setFormError('Please select at least one product category (e.g., Allopathic, Generic, OTC).');
      return;
    }

    if (selectedPersona === 'distributor_self') {
      if (!formData.contactPerson.trim()) {
        setFormError('Contact person name is required.');
        return;
      }
      if (formData.alternateMobile && !/^[6-9]\d{9}$/.test(formData.alternateMobile.trim())) {
        setFormError('Alternate mobile must be a valid 10-digit Indian phone number.');
        return;
      }
      if (formData.whatsappNumber && !/^[6-9]\d{9}$/.test(formData.whatsappNumber.trim())) {
        setFormError('WhatsApp number must be a valid 10-digit Indian phone number.');
        return;
      }
    }

    setSubmittingForm(true);
    try {
      const payload = {
        entryType: selectedPersona,
        firmName: formData.firmName.trim(),
        contactPerson: formData.contactPerson.trim(),
        mobile: formData.mobile.trim(),
        alternateMobile: formData.alternateMobile.trim(),
        whatsappNumber: formData.whatsappNumber.trim(),
        email: formData.email.trim(),
        categories: formData.categories,
        otherCategory: formData.otherCategory.trim(),
        officeAddress: formData.officeAddress.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        pincode: formData.pincode.trim(),
        coordinates: formData.coordinates,
        panIndia: formData.panIndia,
        statesCovered: formData.statesCovered,
        drugLicenseNumber: formData.drugLicenseNumber.trim(),
        gstNumber: formData.gstNumber.trim(),
        catalogDocument: formData.catalogDocument,
        drugLicenseDocument: formData.drugLicenseDocument,
        minimumOrderValue: formData.minimumOrderValue ? Number(formData.minimumOrderValue) : 0,
        deliveryLeadTime: formData.deliveryLeadTime.trim(),
        paymentTerms: formData.paymentTerms.trim(),
        notes: formData.notes.trim()
      };

      const res = await catalogApi.post('/distributors', payload);
      if (res.data?.success) {
        setAddModalOpen(false);
        setFormData(initialDistributorForm);

        showModal({
          title: 'Distributor Submitted Successfully',
          message:
            'Thank you for submitting this distributor entry. It has been placed in the verification queue and will appear publicly in the directory upon administrative approval.',
          type: 'success'
        });

        if (activeTab === 'my_submissions') {
          fetchMySubmissions();
        } else {
          fetchDistributors();
        }
      }
    } catch (err) {
      console.error('Error submitting distributor:', err);
      setFormError(err.response?.data?.message || 'Failed to submit distributor. Please try again.');
    } finally {
      setSubmittingForm(false);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('service_token');
    localStorage.removeItem('service_user');
    window.dispatchEvent(new Event('service_auth_change'));
    setCurrentUser(null);
    setActiveTab('directory');
    showToast('Signed out successfully.');
  };

  return (
    <div className={`min-h-screen ${embedded ? 'py-2' : 'pt-24 pb-16 bg-slate-50 text-slate-900'} relative`}>
      {!embedded && <SiteHeader />}
      

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8 relative z-10">
        {/* Header Banner */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-8 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold">
                <Building2 className="w-3.5 h-3.5 text-teal-600" />
                <span>Pan-India Pharmaceutical Network</span>
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 font-outfit tracking-tight">
                Pharma Distributors Directory
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-2xl leading-relaxed">
                Connect directly with verified pharmaceutical distributors, super-stockists, PCD franchise suppliers,
                and download product catalogs.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              {currentUser ? (
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => setActiveTab(activeTab === 'directory' ? 'my_submissions' : 'directory')}
                    className={`px-3.5 py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-2 ${
                      activeTab === 'my_submissions'
                        ? 'bg-teal-700 text-white border-teal-800 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>My Submissions</span>
                  </button>

                  <button
                    onClick={handleOpenAddDistributor}
                    className="px-4 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Distributor</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => {
                      if (embedded && onOpenAuth) {
                        onOpenAuth('login');
                      } else {
                        setAuthModalMode('login');
                        setAuthModalOpen(true);
                      }
                    }}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={handleOpenAddDistributor}
                    className="px-4 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Sign In to Add Distributor</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* User Status Bar if logged in */}
          {currentUser && (
            <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
              <div className="flex items-center gap-2 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Signed in as:</span>
                <strong className="text-slate-900">{currentUser.name || currentUser.firmName || 'Verified User'}</strong>
                <span className="text-slate-400">({currentUser.mobile || currentUser.email})</span>
              </div>
              <button
                onClick={handleSignOut}
                className="text-slate-400 hover:text-rose-600 text-xs font-bold flex items-center gap-1 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>

        {/* ================= TAB 1: DIRECTORY BROWSE ================= */}
        {activeTab === 'directory' && (
          <div className="space-y-6">
            {/* Search & Filter Bar */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-sm space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                {/* Search Bar */}
                <div className="md:col-span-6 relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by firm name, contact, city, state, or categories..."
                    maxLength={100}
                    className="w-full h-11 pl-10 pr-9 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600 bg-slate-50/70 focus:bg-white transition-all shadow-sm"
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

                {/* State Filter */}
                <div className="md:col-span-3">
                  <select
                    value={selectedState}
                    onChange={(e) => setSelectedState(e.target.value)}
                    className="w-full h-11 px-3 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600 bg-slate-50/70 focus:bg-white transition-all font-medium text-slate-700"
                  >
                    <option value="All">All States / UTs</option>
                    {INDIAN_STATES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Pan India Toggle */}
                <div className="md:col-span-3 flex items-center justify-between sm:justify-start gap-2.5 h-11 px-3 bg-slate-50/80 rounded-xl border border-slate-200">
                  <span className="text-xs font-bold text-slate-700">Pan-India Delivery</span>
                  <button
                    type="button"
                    onClick={() => setPanIndiaOnly(!panIndiaOnly)}
                    className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors ${
                      panIndiaOnly ? 'bg-teal-700' : 'bg-slate-300'
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                        panIndiaOnly ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Category Pills Horizontal Scroll */}
              <div className="pt-2 border-t border-slate-100 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                <span className="text-[11px] font-bold text-slate-400 whitespace-nowrap flex items-center gap-1">
                  <Filter className="w-3 h-3" />
                  Category:
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedCategory('All')}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                    selectedCategory === 'All'
                      ? 'bg-teal-700 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All Categories
                </button>
                {PHARMACY_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                      selectedCategory === cat
                        ? 'bg-teal-700 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Results Count & State Indicators */}
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-1">
              <div>
                Showing <strong className="text-slate-900">{distributors.length}</strong> of{' '}
                <strong className="text-slate-900">{totalDistributors}</strong> verified distributors
                {selectedCategory !== 'All' && <span> in {selectedCategory}</span>}
                {selectedState !== 'All' && <span> ({selectedState})</span>}
              </div>
              {(selectedCategory !== 'All' || selectedState !== 'All' || panIndiaOnly || debouncedSearch) && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('All');
                    setSelectedState('All');
                    setPanIndiaOnly(false);
                  }}
                  className="text-teal-700 hover:underline flex items-center gap-1 text-xs font-bold"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Filters</span>
                </button>
              )}
            </div>

            {/* Distributors Grid */}
            {loadingDistributors ? (
              <div className="p-16 bg-white rounded-3xl border border-slate-200 text-center space-y-3">
                <Loader2 className="w-8 h-8 text-teal-600 animate-spin mx-auto" />
                <p className="text-xs text-slate-500 font-semibold">Loading distributors directory...</p>
              </div>
            ) : distributors.length === 0 ? (
              <div className="p-12 sm:p-16 bg-white rounded-3xl border border-slate-200 text-center space-y-4">
                <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
                  <Building2 className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-800">No matching distributors found</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Try adjusting your category filter, location, or search keyword. You can also add a new distributor to the directory.
                  </p>
                </div>
                <button
                  onClick={handleOpenAddDistributor}
                  className="px-4 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 shadow-md transition-all"
                >
                  {currentUser ? <Plus className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                  <span>{currentUser ? 'Add First Distributor' : 'Sign In to Add Distributor'}</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                {distributors.map((dist) => {
                  const hasCatalog = dist.catalogDocument && dist.catalogDocument.url;
                  const categoriesList = Array.isArray(dist.categories) ? dist.categories : [];
                  const isPanIndia = Boolean(dist.supplyCoverage?.panIndia);

                  return (
                    <div
                      key={dist._id}
                      className="bg-white rounded-2xl border border-slate-200/90 hover:border-teal-500/80 hover:shadow-md transition-all p-5 flex flex-col justify-between space-y-4"
                    >
                      {/* Top Header */}
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <h3 className="font-extrabold text-slate-900 text-base leading-snug break-words">
                              {dist.firmName}
                            </h3>
                            {dist.contactPerson && (
                              <p className="text-xs text-slate-500 font-medium mt-0.5 truncate">
                                Contact: {dist.contactPerson}
                              </p>
                            )}
                          </div>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold flex-shrink-0 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            Verified
                          </span>
                        </div>

                        {/* Badges: Submission Persona & Supply scope */}
                        <div className="flex flex-wrap items-center gap-1.5">
                          {isPanIndia ? (
                            <span className="px-2 py-0.5 bg-teal-50 text-teal-800 border border-teal-200 rounded-lg text-[10px] font-bold">
                              Pan-India Delivery
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-lg text-[10px] font-semibold">
                              State Delivery
                            </span>
                          )}

                          {dist.entryType === 'pharmacist_entry' ? (
                            <span className="px-2 py-0.5 bg-sky-50 text-sky-800 border border-sky-200 rounded-lg text-[10px] font-semibold">
                              Pharmacist Recommended
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-800 border border-indigo-200 rounded-lg text-[10px] font-semibold">
                              Direct Distributor
                            </span>
                          )}
                        </div>

                        {/* Categories pills */}
                        {categoriesList.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {categoriesList.slice(0, 3).map((c) => (
                              <span
                                key={c}
                                className="px-2 py-0.5 bg-slate-50 text-slate-600 rounded-md text-[10px] font-medium border border-slate-100"
                              >
                                {c}
                              </span>
                            ))}
                            {categoriesList.length > 3 && (
                              <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded-md text-[10px] font-bold">
                                +{categoriesList.length - 3} more
                              </span>
                            )}
                          </div>
                        )}

                        {/* Location Single String */}
                        <div className="flex items-start gap-1.5 text-xs text-slate-600 pt-1">
                          <MapPin className="w-3.5 h-3.5 text-teal-600 flex-shrink-0 mt-0.5" />
                          <span className="line-clamp-2 leading-relaxed">
                            {dist.officeAddress || [dist.city, dist.state].filter(Boolean).join(', ') || 'India'}
                          </span>
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="space-y-2 pt-3 border-t border-slate-100">
                        {/* Download Catalog PDF Button (if attached) */}
                        {hasCatalog && (
                          <a
                            href={resolveDocumentUrl(dist.catalogDocument.url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full py-2 px-3 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download Product Catalog</span>
                            {dist.catalogDocument.size > 0 && (
                              <span className="text-[10px] text-teal-700 font-semibold opacity-90">
                                ({formatFileSize(dist.catalogDocument.size)})
                              </span>
                            )}
                            <ExternalLink className="w-3 h-3 opacity-70 ml-0.5" />
                          </a>
                        )}

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setDetailsDistributor(dist)}
                            className="flex-1 py-2 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View Details</span>
                          </button>

                          {dist.mobile && (
                            <a
                              href={`tel:${dist.mobile}`}
                              className="p-2 rounded-xl bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-600 transition-colors"
                              title={`Call ${dist.mobile}`}
                            >
                              <Phone className="w-4 h-4" />
                            </a>
                          )}

                          {(dist.whatsappNumber || dist.mobile) && (
                            <a
                              href={`https://wa.me/91${dist.whatsappNumber || dist.mobile}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors"
                              title="Chat on WhatsApp"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200">
                <span className="text-xs text-slate-500 font-semibold">
                  Page {currentPage} of {totalPages} ({totalDistributors} distributors)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Previous</span>
                  </button>
                  <button
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 2: MY SUBMISSIONS ================= */}
        {activeTab === 'my_submissions' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900">My Submitted Distributors</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Track the verification status of distributor listings you submitted to the directory.
                  </p>
                </div>
                <button
                  onClick={fetchMySubmissions}
                  disabled={loadingSubmissions}
                  className="px-3 py-1.5 text-xs font-bold text-teal-700 hover:bg-teal-50 rounded-xl transition-colors flex items-center gap-1"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${loadingSubmissions ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>

              {loadingSubmissions ? (
                <div className="p-12 text-center">
                  <Loader2 className="w-6 h-6 text-teal-600 animate-spin mx-auto" />
                </div>
              ) : mySubmissions.length === 0 ? (
                <div className="p-10 text-center space-y-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <Building2 className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs text-slate-500 font-semibold">You have not submitted any distributors yet.</p>
                  <button
                    onClick={handleOpenAddDistributor}
                    className="px-4 py-2 bg-teal-700 text-white text-xs font-bold rounded-xl"
                  >
                    Submit a Distributor
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {mySubmissions.map((sub) => (
                    <div key={sub._id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-900 text-sm">{sub.firmName}</h4>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              sub.status === 'approved'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : sub.status === 'rejected'
                                ? 'bg-rose-50 text-rose-800 border border-rose-200'
                                : 'bg-amber-50 text-amber-800 border border-amber-200'
                            }`}
                          >
                            {sub.status === 'approved' && 'Approved & Live'}
                            {sub.status === 'rejected' && 'Revision Required'}
                            {sub.status === 'pending_approval' && 'Pending Admin Review'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-1">{sub.officeAddress || 'India'}</p>
                        {sub.adminNotes && (
                          <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200 mt-1">
                            Admin Note: {sub.adminNotes}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <button
                          onClick={() => setDetailsDistributor(sub)}
                          className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ================= UNIFIED ADD DISTRIBUTOR MODAL ================= */}
      <AnimatePresence>
        {addModalOpen && currentUser && (
          <motion.div
            key="add-distributor-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            onClick={() => setAddModalOpen(false)}
            className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm p-2 sm:p-4 md:p-6 flex items-center justify-center overscroll-contain transform-gpu"
          >
            <AnimatePresence mode="wait">
              {addModalStep === 'select' ? (
                <motion.div
                  key="add-card-select"
                  initial={{ opacity: 0, scale: 0.97, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97, y: 8 }}
                  transition={{ duration: 0.16, ease: 'easeOut' }}
                  onClick={(e) => e.stopPropagation()}
                  className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden overscroll-contain flex flex-col my-auto border border-slate-100"
                >
                  {/* Header */}
                  <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-base font-outfit">Add Distributor Entry</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Please choose how you are submitting this distributor:</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAddModalOpen(false)}
                      className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Persona Cards Body */}
                  <div className="p-6 space-y-4">
                    {/* Option 1: Distributor Self-Registration */}
                    <button
                      type="button"
                      onClick={() => handleSelectPersona('distributor_self')}
                      className="w-full text-left p-4 sm:p-5 rounded-2xl border-2 border-slate-200 hover:border-teal-600 bg-slate-50/60 hover:bg-teal-50/40 transition-all group flex items-start gap-4 shadow-sm"
                    >
                      <div className="p-3 bg-teal-100 text-teal-800 rounded-2xl group-hover:scale-105 transition-transform flex-shrink-0 mt-0.5">
                        <Building2 className="w-6 h-6" />
                      </div>
                      <div className="space-y-1 min-w-0 flex-1">
                        <h4 className="font-bold text-slate-900 text-sm sm:text-base group-hover:text-teal-900">
                          I am a Distributor (Register My Firm)
                        </h4>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          Register your wholesale or PCD firm with full details, upload your product catalog document (PDF)
                          and drug license, and specify your delivery coverage.
                        </p>
                        <span className="inline-block text-[11px] font-bold text-teal-700 mt-1 group-hover:underline">
                          Complete registration flow with file uploads &rarr;
                        </span>
                      </div>
                    </button>

                    {/* Option 2: Pharmacist Recommendation */}
                    <button
                      type="button"
                      onClick={() => handleSelectPersona('pharmacist_entry')}
                      className="w-full text-left p-4 sm:p-5 rounded-2xl border-2 border-slate-200 hover:border-sky-600 bg-slate-50/60 hover:bg-sky-50/40 transition-all group flex items-start gap-4 shadow-sm"
                    >
                      <div className="p-3 bg-sky-100 text-sky-800 rounded-2xl group-hover:scale-105 transition-transform flex-shrink-0 mt-0.5">
                        <Pill className="w-6 h-6" />
                      </div>
                      <div className="space-y-1 min-w-0 flex-1">
                        <h4 className="font-bold text-slate-900 text-sm sm:text-base group-hover:text-sky-900">
                          I am a Pharmacist (Add a Distributor)
                        </h4>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          Quickly recommend a trusted distributor or agency you purchase from. Enter the distributor name,
                          categories, location, contact number, and optionally attach their product catalog.
                        </p>
                        <span className="inline-block text-[11px] font-bold text-sky-700 mt-1 group-hover:underline">
                          Quick recommendation flow (catalog optional) &rarr;
                        </span>
                      </div>
                    </button>
                  </div>

                  {/* Footer */}
                  <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => setAddModalOpen(false)}
                      className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800"
                    >
                      Cancel
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="add-card-form"
                  initial={{ opacity: 0, scale: 0.97, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97, y: 8 }}
                  transition={{ duration: 0.16, ease: 'easeOut' }}
                  onClick={(e) => e.stopPropagation()}
                  className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl flex flex-col max-h-[92dvh] sm:max-h-[88vh] overflow-hidden overscroll-contain my-auto border border-slate-100"
                >
                  {/* Fixed Header */}
                  <div className="flex-shrink-0 px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-white z-10">
                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => setAddModalStep('select')}
                        className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
                        title="Change submission type"
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </button>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              selectedPersona === 'distributor_self'
                                ? 'bg-teal-50 text-teal-800 border border-teal-200'
                                : 'bg-sky-50 text-sky-800 border border-sky-200'
                            }`}
                          >
                            {selectedPersona === 'distributor_self' ? 'Distributor Self-Registration' : 'Pharmacist Recommendation'}
                          </span>
                        </div>
                        <h3 className="font-extrabold text-slate-900 text-base sm:text-lg font-outfit">
                          {selectedPersona === 'distributor_self'
                            ? 'Register Distributor Firm & Catalog'
                            : 'Add Distributor Recommendation'}
                        </h3>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAddModalOpen(false)}
                      className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

              {/* Scrollable Form Body */}
              <form onSubmit={handleSubmitDistributor} className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5 overscroll-contain touch-pan-y">
                  {formError && (
                    <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{formError}</span>
                    </div>
                  )}

                  {/* Firm Name */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Distributor / Firm Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.firmName}
                      onChange={(e) => setFormData({ ...formData, firmName: e.target.value })}
                      placeholder="e.g. Apex Pharmaceuticals & Surgical Agencies"
                      maxLength={120}
                      className="w-full h-11 px-4 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600 bg-slate-50/70 focus:bg-white transition-colors"
                    />
                  </div>

                  {/* Contact Person (Distributor flow) */}
                  {selectedPersona === 'distributor_self' && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Contact Person Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.contactPerson}
                        onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                        placeholder="e.g. Rajesh Kumar (Proprietor / Sales Head)"
                        maxLength={80}
                        className="w-full h-11 px-4 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600 bg-slate-50/70 focus:bg-white transition-colors"
                      />
                    </div>
                  )}

                  {/* Primary Mobile */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Primary Mobile Number <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        value={formData.mobile}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                          setFormData({ ...formData, mobile: val });
                        }}
                        placeholder="10-digit mobile number"
                        maxLength={10}
                        className="w-full h-11 px-4 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600 bg-slate-50/70 focus:bg-white transition-colors"
                      />
                    </div>

                    {selectedPersona === 'distributor_self' && (
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          WhatsApp Number (Optional)
                        </label>
                        <input
                          type="tel"
                          value={formData.whatsappNumber}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                            setFormData({ ...formData, whatsappNumber: val });
                          }}
                          placeholder="10-digit WhatsApp number"
                          maxLength={10}
                          className="w-full h-11 px-4 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600 bg-slate-50/70 focus:bg-white transition-colors"
                        />
                      </div>
                    )}
                  </div>

                  {/* Categories Dealt In (Multi-select) */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-700">
                      Product Categories Dealt In <span className="text-rose-500">*</span>
                    </label>
                    <p className="text-[11px] text-slate-500">Select all categories this distributor handles:</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {PHARMACY_CATEGORIES.map((cat) => {
                        const isSelected = formData.categories.includes(cat);
                        return (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => toggleCategory(cat)}
                            className={`p-2.5 rounded-xl border text-xs font-semibold text-left transition-colors flex items-center gap-2 ${
                              isSelected
                                ? 'bg-teal-50 border-teal-600 text-teal-900 font-bold'
                                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-teal-600 flex-shrink-0" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-300 flex-shrink-0" />
                            )}
                            <span className="truncate">{cat}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Other category custom text */}
                    {formData.categories.includes('Other') && (
                      <div className="pt-2">
                        <input
                          type="text"
                          value={formData.otherCategory}
                          onChange={(e) => setFormData({ ...formData, otherCategory: e.target.value })}
                          placeholder="Specify custom pharmacy category..."
                          maxLength={80}
                          className="w-full h-10 px-3.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600"
                        />
                      </div>
                    )}
                  </div>

                  {/* Address & Location (Single Consolidated Field) */}
                  <div>
                    <SingleAddressAutocomplete
                      value={formData.officeAddress}
                      onChange={(loc) => {
                        setFormData({
                          ...formData,
                          officeAddress: loc.address,
                          city: loc.city || formData.city,
                          state: loc.state || formData.state,
                          pincode: loc.pincode || formData.pincode,
                          coordinates: loc.coordinates || formData.coordinates
                        });
                      }}
                      allowGps={selectedPersona === 'distributor_self'}
                      placeholder={
                        selectedPersona === 'distributor_self'
                          ? 'Search warehouse address, city, or detect with GPS...'
                          : 'Search city, area, or address...'
                      }
                      helperText={
                        selectedPersona === 'distributor_self'
                          ? 'Single consolidated address. You can detect via GPS or search by city/area.'
                          : 'Single location. Type your city or area and select from the suggestions.'
                      }
                    />
                  </div>

                  {/* Pharmacist Entry: Product Catalog Upload (Optional) */}
                  {selectedPersona === 'pharmacist_entry' && (
                    <div className="space-y-2.5 p-4 bg-teal-50/40 rounded-2xl border border-teal-100">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <FileText className="w-4 h-4 text-teal-700" />
                            Product Catalog Document (PDF / DOC / XLS){' '}
                            <span className="text-slate-400 font-normal text-[11px]">(Optional)</span>
                          </span>
                          <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                            Have this distributor's product rate list or catalog file? Attach it here (PDF, DOC, XLS).
                          </p>
                        </div>
                        {formData.catalogDocument && (
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, catalogDocument: null })}
                            className="text-[11px] text-rose-600 font-bold hover:underline flex-shrink-0"
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      {formData.catalogDocument ? (
                        <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between text-xs text-emerald-800 font-semibold gap-2">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <FileText className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                            <span className="truncate">
                              {formData.catalogDocument.originalName || 'Catalog uploaded'}
                            </span>
                            {formData.catalogDocument.size > 0 && (
                              <span className="text-[10px] text-emerald-600 font-medium flex-shrink-0">
                                ({formatFileSize(formData.catalogDocument.size)})
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full font-bold flex-shrink-0">
                            Verified
                          </span>
                        </div>
                      ) : (
                        <div>
                          <label
                            className={`w-full py-2.5 px-3 border border-dashed rounded-xl flex items-center justify-center gap-2 text-xs font-bold cursor-pointer transition-colors ${
                              uploadingCatalog
                                ? 'bg-slate-100 text-slate-400 border-slate-300'
                                : 'border-teal-300 text-teal-800 hover:bg-teal-50/80 bg-white shadow-sm'
                            }`}
                          >
                            {uploadingCatalog ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
                                <span>Sanitizing & uploading catalog...</span>
                              </>
                            ) : (
                              <>
                                <Upload className="w-4 h-4 text-teal-600" />
                                <span>Upload Catalog PDF (Optional, Max 100MB)</span>
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
                  )}

                  {/* ================= DISTRIBUTOR SELF ONLY FIELDS ================= */}
                  {selectedPersona === 'distributor_self' && (
                    <>
                      {/* Delivery Coverage */}
                      <div className="space-y-3 p-4 bg-slate-50/80 rounded-2xl border border-slate-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-xs font-bold text-slate-800">Pan-India Delivery</span>
                            <p className="text-[11px] text-slate-500">Deliver products to all states across India</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, panIndia: !formData.panIndia })}
                            className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors ${
                              formData.panIndia ? 'bg-teal-700' : 'bg-slate-300'
                            }`}
                          >
                            <div
                              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                                formData.panIndia ? 'translate-x-4' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>

                        {!formData.panIndia && (
                          <div className="pt-2 border-t border-slate-200 space-y-2">
                            <label className="block text-xs font-bold text-slate-700">Specific States Covered</label>
                            <div className="max-h-36 overflow-y-auto overscroll-contain p-2 bg-white rounded-xl border border-slate-200 grid grid-cols-2 gap-1.5">
                              {INDIAN_STATES.map((st) => {
                                const checked = formData.statesCovered.includes(st);
                                return (
                                  <label
                                    key={st}
                                    className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-50 text-xs cursor-pointer"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={() => toggleCoveredState(st)}
                                      className="rounded text-teal-600 focus:ring-teal-500"
                                    />
                                    <span className="truncate">{st}</span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Documents Upload Section */}
                      <div className="space-y-4 p-4 bg-teal-50/40 rounded-2xl border border-teal-100">
                        <div>
                          <span className="text-xs font-bold text-slate-900">Documents & Verification</span>
                          <p className="text-[11px] text-slate-500">
                            Strict sanitary validation is performed on all uploads. Scripts and executables are blocked.
                          </p>
                        </div>

                        {/* 1. Product Catalog Upload (PDF / Document) */}
                        <div className="p-3 bg-white rounded-xl border border-teal-200/80 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                              <FileText className="w-4 h-4 text-teal-700" />
                              Product Catalog Document (PDF / DOC / XLS){' '}
                              <span className="text-slate-400 font-normal text-[11px]">(Optional)</span>
                            </span>
                            {formData.catalogDocument && (
                              <button
                                type="button"
                                onClick={() => setFormData({ ...formData, catalogDocument: null })}
                                className="text-[11px] text-rose-600 font-bold hover:underline"
                              >
                                Remove
                              </button>
                            )}
                          </div>

                          {formData.catalogDocument ? (
                            <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between text-xs text-emerald-800 font-semibold gap-2">
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <FileText className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                                <span className="truncate">
                                  {formData.catalogDocument.originalName || 'Catalog uploaded'}
                                </span>
                                {formData.catalogDocument.size > 0 && (
                                  <span className="text-[10px] text-emerald-600 font-medium flex-shrink-0">
                                    ({formatFileSize(formData.catalogDocument.size)})
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full font-bold flex-shrink-0">
                                Verified
                              </span>
                            </div>
                          ) : (
                            <div>
                              <label
                                className={`w-full py-2.5 px-3 border border-dashed rounded-xl flex items-center justify-center gap-2 text-xs font-bold cursor-pointer transition-colors ${
                                  uploadingCatalog
                                    ? 'bg-slate-100 text-slate-400 border-slate-300'
                                    : 'border-teal-300 text-teal-800 hover:bg-teal-50'
                                }`}
                              >
                                {uploadingCatalog ? (
                                  <>
                                    <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
                                    <span>Sanitizing & uploading catalog...</span>
                                  </>
                                ) : (
                                  <>
                                    <Upload className="w-4 h-4 text-teal-600" />
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

                        {/* 2. Drug License Upload */}
                        <div className="p-3 bg-white rounded-xl border border-teal-200/80 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                              <ShieldCheck className="w-4 h-4 text-teal-700" />
                              Drug License Document (PDF / JPG / PNG)
                            </span>
                            {formData.drugLicenseDocument && (
                              <button
                                type="button"
                                onClick={() => setFormData({ ...formData, drugLicenseDocument: null })}
                                className="text-[11px] text-rose-600 font-bold hover:underline"
                              >
                                Remove
                              </button>
                            )}
                          </div>

                          {formData.drugLicenseDocument ? (
                            <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-200 flex items-center justify-between text-xs text-emerald-800 font-semibold">
                              <span className="truncate">
                                {formData.drugLicenseDocument.originalName || 'Drug license uploaded'}
                              </span>
                              <span className="text-[10px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                                Verified
                              </span>
                            </div>
                          ) : (
                            <div>
                              <label
                                className={`w-full py-2.5 px-3 border border-dashed rounded-xl flex items-center justify-center gap-2 text-xs font-bold cursor-pointer transition-colors ${
                                  uploadingLicense
                                    ? 'bg-slate-100 text-slate-400 border-slate-300'
                                    : 'border-teal-300 text-teal-800 hover:bg-teal-50'
                                }`}
                              >
                                {uploadingLicense ? (
                                  <>
                                    <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
                                    <span>Sanitizing & uploading license...</span>
                                  </>
                                ) : (
                                  <>
                                    <Upload className="w-4 h-4 text-teal-600" />
                                    <span>Upload Drug License (PDF / Image)</span>
                                  </>
                                )}
                                <input
                                  type="file"
                                  disabled={uploadingLicense}
                                  onChange={(e) => handleFileUpload(e, 'license')}
                                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                                  className="hidden"
                                />
                              </label>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* License numbers */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">Drug License Number</label>
                          <input
                            type="text"
                            value={formData.drugLicenseNumber}
                            onChange={(e) => setFormData({ ...formData, drugLicenseNumber: e.target.value })}
                            placeholder="e.g. DL-20B/21B-XXXX"
                            maxLength={60}
                            className="w-full h-11 px-4 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600 bg-slate-50/70"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">GST Number</label>
                          <input
                            type="text"
                            value={formData.gstNumber}
                            onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value.toUpperCase() })}
                            placeholder="e.g. 07AAAAA0000A1Z5"
                            maxLength={15}
                            className="w-full h-11 px-4 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600 bg-slate-50/70"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Remarks / Notes */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      {selectedPersona === 'distributor_self' ? 'Distributor Notes / Terms' : 'Recommendation Notes'}
                    </label>
                    <textarea
                      rows={2}
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder={
                        selectedPersona === 'distributor_self'
                          ? 'Minimum order value, delivery turnaround time, or payment terms...'
                          : 'Why do you recommend this distributor? (e.g. prompt delivery, broad stock)'
                      }
                      maxLength={500}
                      className="w-full p-3 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600 bg-slate-50/70 focus:bg-white resize-none"
                    />
                  </div>
                </div>

                {/* Fixed Footer */}
                <div className="flex-shrink-0 px-5 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3 z-10">
                  <button
                    type="button"
                    onClick={() => setAddModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={submittingForm || uploadingCatalog || uploadingLicense}
                    className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-xl shadow-md disabled:opacity-50 flex items-center gap-2"
                  >
                    {submittingForm && <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />}
                    <span>Submit for Admin Approval</span>
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    )}
  </AnimatePresence>

      {/* ================= MODAL 3: DISTRIBUTOR DETAILS MODAL ================= */}
      <AnimatePresence>
        {detailsDistributor && (
          <motion.div
            key="details-distributor-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            onClick={() => setDetailsDistributor(null)}
            className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm p-2 sm:p-4 md:p-6 flex items-center justify-center overscroll-contain transform-gpu"
          >
            <motion.div
              key="details-distributor-card"
              initial={{ opacity: 0, scale: 0.98, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 8 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl flex flex-col max-h-[92dvh] sm:max-h-[88vh] overflow-hidden overscroll-contain my-auto border border-slate-100"
            >
              {/* Header */}
              <div className="flex-shrink-0 px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base sm:text-lg font-outfit">
                    {detailsDistributor.firmName}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                      Verified Distributor
                    </span>
                    {detailsDistributor.supplyCoverage?.panIndia && (
                      <span className="px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 text-[10px] font-bold border border-teal-200">
                        Pan-India Delivery
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setDetailsDistributor(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4 overscroll-contain touch-pan-y text-xs text-slate-700">
                {/* Location */}
                <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Address & Location</span>
                  <div className="flex items-start gap-1.5 font-medium text-slate-800">
                    <MapPin className="w-3.5 h-3.5 text-teal-600 flex-shrink-0 mt-0.5" />
                    <span>{detailsDistributor.officeAddress || 'India'}</span>
                  </div>
                </div>

                {/* Categories */}
                {Array.isArray(detailsDistributor.categories) && detailsDistributor.categories.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Categories Dealt In</span>
                    <div className="flex flex-wrap gap-1.5">
                      {detailsDistributor.categories.map((c) => (
                        <span
                          key={c}
                          className="px-2.5 py-1 bg-teal-50 text-teal-800 border border-teal-200/80 rounded-lg text-xs font-semibold"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Contact info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                  {detailsDistributor.contactPerson && (
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Contact Person</span>
                      <p className="font-bold text-slate-900 mt-0.5">{detailsDistributor.contactPerson}</p>
                    </div>
                  )}
                  {detailsDistributor.mobile && (
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mobile Number</span>
                      <p className="font-bold text-slate-900 mt-0.5">{detailsDistributor.mobile}</p>
                    </div>
                  )}
                  {detailsDistributor.whatsappNumber && (
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">WhatsApp</span>
                      <p className="font-bold text-slate-900 mt-0.5">{detailsDistributor.whatsappNumber}</p>
                    </div>
                  )}
                  {detailsDistributor.email && (
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email</span>
                      <p className="font-bold text-slate-900 mt-0.5">{detailsDistributor.email}</p>
                    </div>
                  )}
                </div>

                {/* Drug license & GST */}
                {(detailsDistributor.drugLicenseNumber || detailsDistributor.gstNumber) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                    {detailsDistributor.drugLicenseNumber && (
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Drug License</span>
                        <p className="font-bold text-slate-900 mt-0.5">{detailsDistributor.drugLicenseNumber}</p>
                      </div>
                    )}
                    {detailsDistributor.gstNumber && (
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">GST Number</span>
                        <p className="font-bold text-slate-900 mt-0.5">{detailsDistributor.gstNumber}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Notes */}
                {detailsDistributor.notes && (
                  <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Distributor Notes</span>
                    <p className="text-slate-700 leading-relaxed">{detailsDistributor.notes}</p>
                  </div>
                )}

                {/* Product Catalog PDF link if available */}
                {detailsDistributor.catalogDocument?.url && (
                  <div className="pt-2">
                    <div className="p-3 bg-teal-50/60 rounded-2xl border border-teal-200/80 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-teal-900 flex items-center gap-1.5 truncate">
                          <FileText className="w-3.5 h-3.5 text-teal-700 flex-shrink-0" />
                          <span className="truncate">{detailsDistributor.catalogDocument.originalName || 'Product Catalog Document'}</span>
                        </span>
                        {detailsDistributor.catalogDocument.size > 0 && (
                          <span className="text-[10px] text-teal-700 font-semibold bg-teal-100/80 px-2 py-0.5 rounded-full flex-shrink-0">
                            {formatFileSize(detailsDistributor.catalogDocument.size)}
                          </span>
                        )}
                      </div>
                      <a
                        href={resolveDocumentUrl(detailsDistributor.catalogDocument.url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-2.5 px-4 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download Product Catalog</span>
                        <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="flex-shrink-0 px-5 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  {detailsDistributor.entryType === 'pharmacist_entry'
                    ? 'Recommended by Community Pharmacist'
                    : 'Registered by Distributor'}
                </span>
                <div className="flex items-center gap-2">
                  {detailsDistributor.mobile && (
                    <a
                      href={`tel:${detailsDistributor.mobile}`}
                      className="px-3.5 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold rounded-xl border border-teal-200 transition-colors flex items-center gap-1.5"
                    >
                      <Phone className="w-3.5 h-3.5" /> Call
                    </a>
                  )}
                  {(detailsDistributor.whatsappNumber || detailsDistributor.mobile) && (
                    <a
                      href={`https://wa.me/91${detailsDistributor.whatsappNumber || detailsDistributor.mobile}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200 transition-colors flex items-center gap-1.5"
                    >
                      <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Services Auth Modal for login/register */}
      <ServicesAuthModal
        isOpen={authModalOpen}
        onClose={() => {
          setAuthModalOpen(false);
          setPendingAddAfterAuth(false);
        }}
        initialMode={authModalMode}
        context="catalogs"
        onAuthSuccess={(user) => {
          setCurrentUser(user);
          setAuthModalOpen(false);
          showToast(`Welcome back, ${user.name || 'User'}!`);
          if (pendingAddAfterAuth) {
            setPendingAddAfterAuth(false);
            setAddModalStep('select');
            setAddModalOpen(true);
          }
        }}
      />

      {/* Toast Notification */}
      {toastMessage.text && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-teal-400 flex-shrink-0" />
          <span>{toastMessage.text}</span>
        </div>
      )}
    </div>
  );
}
