import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Building2,
  Pill,
  MapPin,
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
  Navigation,
  Globe,
  ShieldCheck,
  Eye,
  Loader2,
  Sparkles,
  Share2,
  ExternalLink,
  MessageCircle,
  RotateCcw,
  User,
  LogOut
} from 'lucide-react';
import Navbar from '../components/Navbar';
import InteractiveBackground from '../components/InteractiveBackground';
import ServicesAuthModal from '../components/services/ServicesAuthModal';
import LocationPicker from '../components/services/LocationPicker';
import catalogApi from '../utils/catalogApi';
import servicesApi from '../utils/servicesApi';
import { INDIAN_STATES, PHARMACY_CATEGORIES, DOSAGE_FORMS } from '../utils/catalogConstants';

export default function CatalogPage({ embedded = false }) {
  // Authentication state
  const [currentUser, setCurrentUser] = useState(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login');

  // Navigation tabs: 'products', 'distributors', 'my_contributions'
  const [activeTab, setActiveTab] = useState('products');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isDebouncing, setIsDebouncing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDosageForm, setSelectedDosageForm] = useState('All');
  const [selectedState, setSelectedState] = useState('All');
  const [selectedCity, setSelectedCity] = useState('');
  const [locationLabel, setLocationLabel] = useState('');
  const [detectingGps, setDetectingGps] = useState(false);
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [panIndiaOnly, setPanIndiaOnly] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10;

  const [currentDistPage, setCurrentDistPage] = useState(1);
  const [distTotalPages, setDistTotalPages] = useState(1);
  const distPageSize = 10;

  // Data states
  const [products, setProducts] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [initialProductsLoaded, setInitialProductsLoaded] = useState(false);

  const [distributors, setDistributors] = useState([]);
  const [totalDistributors, setTotalDistributors] = useState(0);
  const [loadingDistributors, setLoadingDistributors] = useState(false);
  const [initialDistributorsLoaded, setInitialDistributorsLoaded] = useState(false);

  const [myContributions, setMyContributions] = useState({ products: [], distributors: [] });
  const [loadingContributions, setLoadingContributions] = useState(false);

  // Modals state
  const [selectedProductDetails, setSelectedProductDetails] = useState(null);
  const [selectedDistributorDetails, setSelectedDistributorDetails] = useState(null);
  const [contributeModalOpen, setContributeModalOpen] = useState(false);

  // Toast message
  const [toastMessage, setToastMessage] = useState({ text: '', type: 'success' });

  const showToast = (text, type = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage({ text: '', type: 'success' }), 4500);
  };

  // Check auth on mount
  useEffect(() => {
    checkCurrentUser();
    const handleAuthChange = () => checkCurrentUser();
    window.addEventListener('service_auth_change', handleAuthChange);
    return () => window.removeEventListener('service_auth_change', handleAuthChange);
  }, []);

  const checkCurrentUser = () => {
    try {
      const serviceUserStr = localStorage.getItem('service_user');
      const adminUserStr = localStorage.getItem('user');
      const serviceToken = localStorage.getItem('service_token');
      const adminToken = localStorage.getItem('token');

      if (serviceToken && serviceUserStr) {
        setCurrentUser(JSON.parse(serviceUserStr));
      } else if (adminToken && adminUserStr) {
        const adminUser = JSON.parse(adminUserStr);
        if (adminUser.role === 'admin') {
          setCurrentUser({ ...adminUser, isAdmin: true, name: adminUser.name || 'Administrator' });
        } else {
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
    } catch {
      setCurrentUser(null);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('service_token');
    localStorage.removeItem('service_user');
    setCurrentUser(null);
    window.dispatchEvent(new Event('service_auth_change'));
    showToast('You have signed out successfully.', 'info');
  };

  // Debounce search query changes to prevent layout flicker and request storms
  useEffect(() => {
    if (searchQuery !== debouncedSearch) {
      setIsDebouncing(true);
    }
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setIsDebouncing(false);
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset page when filter criteria change
  useEffect(() => {
    setCurrentPage(1);
    setCurrentDistPage(1);
  }, [debouncedSearch, selectedCategory, selectedDosageForm, selectedState, selectedCity, panIndiaOnly]);

  // Fetch products when signed in
  useEffect(() => {
    if (currentUser && activeTab === 'products') {
      fetchProducts();
    }
  }, [currentUser, activeTab, debouncedSearch, selectedCategory, selectedDosageForm, selectedState, selectedCity, panIndiaOnly, currentPage]);

  // Fetch distributors when activeTab is distributors
  useEffect(() => {
    if (currentUser && activeTab === 'distributors') {
      fetchDistributors();
    }
  }, [currentUser, activeTab, debouncedSearch, selectedState, selectedCity, panIndiaOnly, currentDistPage]);

  // Fetch contributions when activeTab is contributions
  useEffect(() => {
    if (currentUser && activeTab === 'my_contributions') {
      fetchMyContributions();
    }
  }, [currentUser, activeTab]);

  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const res = await catalogApi.get('/products', {
        params: {
          search: debouncedSearch,
          category: selectedCategory,
          dosageForm: selectedDosageForm,
          state: selectedState,
          city: selectedCity,
          panIndiaOnly: panIndiaOnly ? 'true' : 'false',
          page: currentPage,
          limit: pageSize
        }
      });
      setProducts(res.data.products || []);
      setTotalProducts(res.data.total || 0);
      setTotalPages(res.data.pages || 1);
    } catch (err) {
      if (err.response?.status !== 401) {
        showToast(err.response?.data?.message || 'Failed to load products.', 'error');
      }
    } finally {
      setLoadingProducts(false);
      setInitialProductsLoaded(true);
    }
  };

  const fetchDistributors = async () => {
    setLoadingDistributors(true);
    try {
      const res = await catalogApi.get('/distributors', {
        params: {
          search: debouncedSearch,
          state: selectedState,
          city: selectedCity,
          panIndiaOnly: panIndiaOnly ? 'true' : 'false',
          page: currentDistPage,
          limit: distPageSize
        }
      });
      setDistributors(res.data.distributors || []);
      setTotalDistributors(res.data.total || 0);
      setDistributorTotalPages(res.data.pages || 1);
    } catch (err) {
      if (err.response?.status !== 401) {
        showToast(err.response?.data?.message || 'Failed to load distributors.', 'error');
      }
    } finally {
      setLoadingDistributors(false);
      setInitialDistributorsLoaded(true);
    }
  };

  const fetchMyContributions = async () => {
    setLoadingContributions(true);
    try {
      const res = await catalogApi.get('/my-contributions');
      setMyContributions(res.data);
    } catch (err) {
      if (err.response?.status !== 401) {
        showToast(err.response?.data?.message || 'Failed to load your contributions.', 'error');
      }
    } finally {
      setLoadingContributions(false);
    }
  };

  // Detect GPS location using maps API reverse geocoding
  const handleDetectLocation = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      showToast('Geolocation is not supported by your browser.', 'error');
      return;
    }

    setDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          const res = await servicesApi.get('/location/reverse', {
            params: { lat, lon }
          });
          const data = res.data;
          const city =
            data.city ||
            data.address?.city ||
            data.address?.town ||
            data.address?.village ||
            data.address?.district ||
            '';
          const state = data.state || data.address?.state || '';

          if (city || state) {
            setSelectedCity(city);
            if (state) setSelectedState(state);
            setLocationLabel(`${city ? city + ', ' : ''}${state}`);
            showToast(`Location set to: ${city || state}`);
          } else {
            showToast('Unable to detect city name from your coordinates.', 'info');
          }
        } catch (err) {
          showToast('Failed to reverse geocode location. Please search manually.', 'error');
        } finally {
          setDetectingGps(false);
          setLocationModalOpen(false);
        }
      },
      (err) => {
        setDetectingGps(false);
        showToast('Location permission denied or unavailable.', 'error');
      },
      { timeout: 9000, enableHighAccuracy: true }
    );
  };

  // Reset filters
  const resetFilters = () => {
    setSearchQuery('');
    setDebouncedSearch('');
    setIsDebouncing(false);
    setSelectedCategory('All');
    setSelectedDosageForm('All');
    setSelectedState('All');
    setSelectedCity('');
    setLocationLabel('');
    setPanIndiaOnly(false);
    setCurrentPage(1);
    setCurrentDistPage(1);
  };

  return (
    <main className={embedded ? "w-full space-y-8" : "min-h-screen bg-slate-50 text-slate-900 relative selection:bg-teal-200 selection:text-teal-900 flex flex-col font-sans"}>
      {!embedded && <InteractiveBackground />}
      {!embedded && <Navbar />}

      {/* Toast Alert */}
      {toastMessage.text && (
        <div className="fixed bottom-6 right-6 z-[200] max-w-md animate-in fade-in slide-in-from-bottom-4">
          <div
            className={`px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-3 text-xs font-bold ${
              toastMessage.type === 'error'
                ? 'bg-rose-50 text-rose-800 border-rose-200'
                : toastMessage.type === 'info'
                ? 'bg-sky-50 text-sky-800 border-sky-200'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}
          >
            {toastMessage.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className={embedded ? "w-full space-y-8" : "pt-28 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex-1 w-full space-y-8"}>
        {/* Header Hero Banner */}
        <div className="relative rounded-3xl bg-gradient-to-br from-teal-900 via-slate-900 to-teal-950 text-white p-6 sm:p-10 shadow-2xl overflow-hidden border border-teal-800/40">
          <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-300 text-[11px] font-extrabold uppercase tracking-widest">
                <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                <span>Pan-India Healthcare Supply Directory</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black font-outfit tracking-tight text-white">
                Product Catalogs <span className="text-teal-400">& Distributors</span>
              </h1>
              <p className="text-slate-300 text-xs sm:text-sm font-medium leading-relaxed">
                Explore comprehensive pharmaceutical formulations, salt compositions, active ingredients, and verified
                distributors supplying nationwide across all Indian states and Union Territories.
              </p>
            </div>

            {/* User status & CTA */}
            <div className="flex flex-col sm:flex-row lg:flex-col items-stretch lg:items-end gap-3 w-full sm:w-auto">
              {currentUser ? (
                <>
                  <div className="px-4 py-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl bg-teal-500/20 flex items-center justify-center font-black text-teal-300">
                        {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div className="text-left">
                        <span className="font-bold text-white block">{currentUser.name}</span>
                        <span className="text-[10px] text-teal-300 capitalize">
                          {currentUser.isAdmin ? 'Platform Administrator' : currentUser.role?.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="p-1.5 text-slate-300 hover:text-rose-400 hover:bg-white/10 rounded-lg transition-colors"
                      title="Sign Out"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    onClick={() => setContributeModalOpen(true)}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-black transition-all shadow-lg shadow-teal-500/20 active:scale-95"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>Contribute Product & Distributor</span>
                  </button>
                </>
              ) : (
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => {
                      setAuthModalMode('login');
                      setAuthModalOpen(true);
                    }}
                    className="px-5 py-2.5 rounded-2xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-black transition-all shadow-lg shadow-teal-500/20"
                  >
                    Sign In to Search
                  </button>
                  <button
                    onClick={() => {
                      setAuthModalMode('register');
                      setAuthModalOpen(true);
                    }}
                    className="px-5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition-all"
                  >
                    Register Account
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ================= IF NOT SIGNED IN: ACCESS WALL ================= */}
        {!currentUser && (
          <div className="rounded-3xl bg-white border border-slate-200/80 p-8 sm:p-12 shadow-sm text-center max-w-3xl mx-auto space-y-6">
            <div className="w-16 h-16 rounded-3xl bg-teal-50 border border-teal-200 flex items-center justify-center mx-auto text-teal-700 shadow-sm">
              <Lock className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black text-slate-900 font-outfit">
                Registered Healthcare / Pharmacy Access Required
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
                To explore full salt compositions, manufacturer catalogs, drug license numbers, and verified Pan-India
                distributor contacts, please register or sign in to your verified account.
              </p>
            </div>

            {/* Feature highlights grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left pt-2">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-2">
                <div className="w-8 h-8 rounded-xl bg-teal-100/70 text-teal-800 flex items-center justify-center font-bold">
                  <Pill className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-xs text-slate-900">Formulations & Salts</h4>
                <p className="text-[11px] text-slate-500">
                  Search any medicine by salt composition, manufacturer, therapeutic class, or brand.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-2">
                <div className="w-8 h-8 rounded-xl bg-sky-100/70 text-sky-800 flex items-center justify-center font-bold">
                  <Globe className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-xs text-slate-900">Pan-India Suppliers</h4>
                <p className="text-[11px] text-slate-500">
                  Direct contacts, WhatsApp links, drug license numbers, and supply terms of verified stockists.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-100/70 text-indigo-800 flex items-center justify-center font-bold">
                  <Plus className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-xs text-slate-900">Community Contribution</h4>
                <p className="text-[11px] text-slate-500">
                  Add new products and distributors to build an open, trusted national pharmaceutical index.
                </p>
              </div>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => {
                  setAuthModalMode('login');
                  setAuthModalOpen(true);
                }}
                className="w-full sm:w-auto px-8 py-3 rounded-2xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-black shadow-lg shadow-teal-700/20 transition-all"
              >
                Sign In With OTP
              </button>
              <button
                onClick={() => {
                  setAuthModalMode('register');
                  setAuthModalOpen(true);
                }}
                className="w-full sm:w-auto px-8 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all"
              >
                Create New Account
              </button>
            </div>
          </div>
        )}

        {/* ================= IF SIGNED IN: INTERACTIVE DIRECTORY ================= */}
        {currentUser && (
          <div className="space-y-6">
            {/* Top Navigation Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div className="inline-flex p-1 bg-white rounded-2xl border border-slate-200 shadow-sm text-xs font-bold">
                <button
                  onClick={() => setActiveTab('products')}
                  className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
                    activeTab === 'products'
                      ? 'bg-teal-700 text-white shadow'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Pill className="w-3.5 h-3.5" />
                  <span>Product Catalogs</span>
                  {totalProducts > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        activeTab === 'products' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {totalProducts}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setActiveTab('distributors')}
                  className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
                    activeTab === 'distributors'
                      ? 'bg-teal-700 text-white shadow'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Pan-India Distributors</span>
                  {totalDistributors > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        activeTab === 'distributors' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {totalDistributors}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setActiveTab('my_contributions')}
                  className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
                    activeTab === 'my_contributions'
                      ? 'bg-teal-700 text-white shadow'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>My Contributions</span>
                </button>
              </div>

              {/* Reset filter shortcut */}
              {(searchQuery || selectedCategory !== 'All' || selectedDosageForm !== 'All' || selectedState !== 'All' || panIndiaOnly) && (
                <button
                  onClick={resetFilters}
                  className="inline-flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-800 font-bold px-3 py-1.5 rounded-xl hover:bg-rose-50 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset All Filters</span>
                </button>
              )}
            </div>

            {/* Search and Filters Bar (For Products & Distributors) */}
            {activeTab !== 'my_contributions' && (
              <div className="bg-white rounded-3xl border border-slate-200/80 p-4 sm:p-6 shadow-sm space-y-4">
                {/* Search Input */}
                <div className="relative">
                  <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={
                      activeTab === 'products'
                        ? 'Search product name, salt composition, manufacturer, brand...'
                        : 'Search distributor firm name, contact person, drug license, city...'
                    }
                    className="w-full pl-12 pr-12 py-3 rounded-2xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100 transition-all"
                  />
                  <div className="absolute right-3.5 top-3.5 flex items-center gap-1.5">
                    {(isDebouncing || (activeTab === 'products' ? loadingProducts : loadingDistributors)) && (
                      <Loader2 className="w-4 h-4 text-teal-600 animate-spin" />
                    )}
                    {searchQuery && !isDebouncing && !(activeTab === 'products' ? loadingProducts : loadingDistributors) && (
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setDebouncedSearch('');
                        }}
                        className="text-slate-400 hover:text-slate-600 p-0.5 rounded transition-colors"
                        title="Clear search"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Location-wise Delivery Search Banner */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-gradient-to-r from-teal-50/80 to-slate-50 border border-teal-100 rounded-2xl text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-slate-700 flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-teal-600 flex-shrink-0" />
                      <span>Delivery Location:</span>
                    </span>

                    {selectedCity || locationLabel ? (
                      <span className="px-3 py-1 bg-white font-bold text-teal-900 rounded-xl border border-teal-300 shadow-sm flex items-center gap-2 text-xs">
                        <span>{locationLabel || `${selectedCity}${selectedState !== 'All' ? ', ' + selectedState : ''}`}</span>
                        <button
                          onClick={() => {
                            setSelectedCity('');
                            setLocationLabel('');
                          }}
                          className="p-0.5 text-slate-400 hover:text-rose-600 rounded"
                          title="Clear location filter"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ) : (
                      <span className="text-slate-500 font-medium">All India (Nationwide)</span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => setLocationModalOpen(true)}
                      className="flex-1 sm:flex-none px-3.5 py-1.5 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95 text-xs"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{selectedCity ? 'Change City / Location' : 'Search Location via Maps API'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDetectLocation}
                      disabled={detectingGps}
                      className="flex-1 sm:flex-none px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-xl flex items-center justify-center gap-1.5 border border-slate-200 transition-all shadow-sm active:scale-95 text-xs disabled:opacity-50"
                    >
                      {detectingGps ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-600" />
                      ) : (
                        <Navigation className="w-3.5 h-3.5 text-teal-600" />
                      )}
                      <span>{detectingGps ? 'Detecting GPS...' : 'Use My GPS'}</span>
                    </button>
                  </div>
                </div>

                {/* Filter Controls Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  {/* Category Filter (Products Tab) */}
                  {activeTab === 'products' && (
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                        Category
                      </label>
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 font-semibold focus:outline-none focus:border-teal-600"
                      >
                        <option value="All">All Categories</option>
                        {PHARMACY_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Dosage Form Filter (Products Tab) */}
                  {activeTab === 'products' && (
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                        Dosage Form
                      </label>
                      <select
                        value={selectedDosageForm}
                        onChange={(e) => setSelectedDosageForm(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 font-semibold focus:outline-none focus:border-teal-600"
                      >
                        <option value="All">All Dosage Forms</option>
                        {DOSAGE_FORMS.map((form) => (
                          <option key={form} value={form}>
                            {form}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* State / Supply Region Filter */}
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                      Supply Region / State
                    </label>
                    <select
                      value={selectedState}
                      onChange={(e) => setSelectedState(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 font-semibold focus:outline-none focus:border-teal-600"
                    >
                      <option value="All">All States / Pan-India</option>
                      {INDIAN_STATES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Pan-India Only Toggle */}
                  <div className="flex items-end">
                    <label className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 cursor-pointer hover:bg-slate-100 transition-colors">
                      <span className="font-bold text-slate-700">Pan-India Delivery Only</span>
                      <input
                        type="checkbox"
                        checked={panIndiaOnly}
                        onChange={(e) => setPanIndiaOnly(e.target.checked)}
                        className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4 cursor-pointer"
                      />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* ================= TAB 1: PRODUCT CATALOGS (SIMPLISTIC LIST VIEW) ================= */}
            {activeTab === 'products' && (
              <div className="space-y-4 min-h-[380px]">
                {!initialProductsLoaded && loadingProducts ? (
                  <div className="p-16 text-center text-teal-700 space-y-3 bg-white rounded-3xl border border-slate-200 min-h-[380px] flex flex-col items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-teal-600" />
                    <p className="text-xs font-bold text-slate-600">Loading verified product catalogs...</p>
                  </div>
                ) : products.length === 0 && !loadingProducts && !isDebouncing ? (
                  <div className="p-16 text-center text-slate-500 space-y-4 bg-white rounded-3xl border border-slate-200 min-h-[380px] flex flex-col items-center justify-center">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                      <Search className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">No products found matching your search</h4>
                      <p className="text-xs text-slate-500 mt-1">
                        Try clearing filters, searching for a general salt name, or contribute this product to the
                        directory.
                      </p>
                    </div>
                    <button
                      onClick={() => setContributeModalOpen(true)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-700 text-white rounded-xl text-xs font-bold hover:bg-teal-800 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add This Product</span>
                    </button>
                  </div>
                ) : (
                  <div className={`space-y-3 transition-opacity duration-200 ${loadingProducts || isDebouncing ? 'opacity-60 pointer-events-none' : 'opacity-100'}`}>
                    {products.map((item) => {
                      const hasPanIndia =
                        Array.isArray(item.distributors) &&
                        item.distributors.some((d) => d.supplyCoverage?.panIndia);

                      const isDirectAdmin =
                        item.isDirectAdminEntry ||
                        item.submittedByModel === 'User' ||
                        (item.approvedBy && !item.submittedBy);

                      return (
                        <div
                          key={item._id}
                          className="bg-white rounded-2xl border border-slate-200/90 hover:border-teal-400/80 p-4 sm:p-5 shadow-sm hover:shadow-md transition-all flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 group"
                        >
                          {/* Left side: Essential product details */}
                          <div className="flex-1 min-w-0 space-y-2">
                            {/* Badges row with Posted By */}
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200/70">
                                {item.category}
                              </span>

                              {item.prescriptionRequired ? (
                                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200">
                                  Rx Required
                                </span>
                              ) : (
                                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  OTC
                                </span>
                              )}

                              {/* Posted by Badge */}
                              {isDirectAdmin ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-800 border border-purple-200">
                                  <ShieldCheck className="w-3 h-3 text-purple-600" />
                                  <span>Posted by Admin</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                                  <User className="w-3 h-3 text-slate-500" />
                                  <span>Posted by {item.submitterName || 'Registered User'}</span>
                                </span>
                              )}
                            </div>

                            {/* Product Name & Brand */}
                            <div className="flex flex-wrap items-baseline gap-2">
                              <h3 className="font-black text-slate-900 text-base sm:text-lg group-hover:text-teal-700 transition-colors break-words">
                                {item.name}
                              </h3>
                              {item.brandName && (
                                <span className="text-xs font-semibold text-slate-500">
                                  (Brand: {item.brandName})
                                </span>
                              )}
                            </div>

                            {/* Salt Formulation */}
                            <div className="flex items-center gap-1.5 text-xs text-slate-700 bg-slate-50 border border-slate-100 rounded-xl px-3 py-1.5 inline-flex max-w-full">
                              <Pill className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
                              <span className="font-bold text-slate-500 flex-shrink-0">Active Salt:</span>
                              <span className="font-semibold text-slate-900 truncate">{item.saltComposition}</span>
                            </div>

                            {/* Sub details: Manufacturer & Dosage Form */}
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                              <span>
                                <strong className="text-slate-700">Manufacturer:</strong> {item.manufacturer}
                              </span>
                              <span>
                                <strong className="text-slate-700">Form:</strong> {item.dosageForm} ({item.packaging || '1 Unit'})
                              </span>
                              {item.strength && (
                                <span>
                                  <strong className="text-slate-700">Strength:</strong> {item.strength}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Right side: MRP, Distributors count & Action button */}
                          <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-center gap-3 w-full lg:w-auto pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100 flex-shrink-0">
                            <div className="text-left lg:text-right">
                              {item.mrp > 0 ? (
                                <div className="text-base sm:text-lg font-black text-emerald-700 font-mono">
                                  Rs. {item.mrp.toFixed(2)}
                                </div>
                              ) : (
                                <span className="text-xs text-slate-400 font-semibold">MRP on request</span>
                              )}
                              <div className="flex items-center lg:justify-end gap-1.5 text-[11px] text-slate-500 mt-0.5">
                                <Building2 className="w-3 h-3 text-teal-600" />
                                <span className="font-bold text-slate-700">
                                  {item.distributors?.length || 0} Distributors
                                </span>
                                {hasPanIndia && (
                                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                    Pan-India
                                  </span>
                                )}
                              </div>
                            </div>

                            <button
                              onClick={() => setSelectedProductDetails(item)}
                              className="px-4 py-2 rounded-xl bg-teal-50 hover:bg-teal-700 hover:text-white text-teal-800 text-xs font-bold transition-all flex items-center gap-1.5 border border-teal-200 flex-shrink-0 active:scale-95 shadow-sm"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View Details</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Products Pagination Controls */}
                {totalPages > 1 && (
                  <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs border-t border-slate-200">
                    <div className="text-slate-500 font-medium">
                      Showing <strong className="text-slate-800">{(currentPage - 1) * pageSize + 1}</strong> to{' '}
                      <strong className="text-slate-800">{Math.min(currentPage * pageSize, totalProducts)}</strong> of{' '}
                      <strong className="text-slate-800">{totalProducts}</strong> products
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 font-bold bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                        <span>Prev</span>
                      </button>

                      {Array.from({ length: totalPages }, (_, idx) => idx + 1)
                        .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                        .map((p, i, arr) => {
                          const prev = arr[i - 1];
                          return (
                            <React.Fragment key={p}>
                              {prev && p - prev > 1 && <span className="px-1 text-slate-400 font-mono">...</span>}
                              <button
                                onClick={() => setCurrentPage(p)}
                                className={`w-8 h-8 rounded-xl font-bold transition-all ${
                                  currentPage === p
                                    ? 'bg-teal-700 text-white shadow-sm'
                                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                                }`}
                              >
                                {p}
                              </button>
                            </React.Fragment>
                          );
                        })}

                      <button
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 font-bold bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                      >
                        <span>Next</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ================= TAB 2: DISTRIBUTORS DIRECTORY (SIMPLISTIC LIST VIEW) ================= */}
            {activeTab === 'distributors' && (
              <div className="space-y-4 min-h-[380px]">
                {!initialDistributorsLoaded && loadingDistributors ? (
                  <div className="p-16 text-center text-teal-700 space-y-3 bg-white rounded-3xl border border-slate-200 min-h-[380px] flex flex-col items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-teal-600" />
                    <p className="text-xs font-bold text-slate-600">Loading Pan-India distributors...</p>
                  </div>
                ) : distributors.length === 0 && !loadingDistributors && !isDebouncing ? (
                  <div className="p-16 text-center text-slate-500 space-y-4 bg-white rounded-3xl border border-slate-200 min-h-[380px] flex flex-col items-center justify-center">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">No distributors found</h4>
                      <p className="text-xs text-slate-500 mt-1">
                        Try adjusting your state, city, or search terms, or add a distributor agency.
                      </p>
                    </div>
                    <button
                      onClick={() => setContributeModalOpen(true)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-700 text-white rounded-xl text-xs font-bold hover:bg-teal-800 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Distributor</span>
                    </button>
                  </div>
                ) : (
                  <div className={`space-y-3 transition-opacity duration-200 ${loadingDistributors || isDebouncing ? 'opacity-60 pointer-events-none' : 'opacity-100'}`}>
                    {distributors.map((dist) => {
                      const isDirectAdmin =
                        dist.isDirectAdminEntry ||
                        dist.submittedByModel === 'User' ||
                        (dist.approvedBy && !dist.submittedBy);

                      return (
                        <div
                          key={dist._id}
                          className="bg-white rounded-2xl border border-slate-200/90 hover:border-teal-400/80 p-4 sm:p-5 shadow-sm hover:shadow-md transition-all flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 group"
                        >
                          {/* Left details */}
                          <div className="flex-1 min-w-0 space-y-2">
                            {/* Badges row with Posted By */}
                            <div className="flex flex-wrap items-center gap-2">
                              {dist.supplyCoverage?.panIndia ? (
                                <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                                  <Globe className="w-3 h-3" />
                                  <span>Pan-India Supplier</span>
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                                  {dist.state} & Regional
                                </span>
                              )}

                              {dist.drugLicenseNumber && (
                                <span className="text-[10px] font-mono text-slate-400">
                                  DL: {dist.drugLicenseNumber}
                                </span>
                              )}

                              {/* Posted by Badge */}
                              {isDirectAdmin ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-800 border border-purple-200">
                                  <ShieldCheck className="w-3 h-3 text-purple-600" />
                                  <span>Posted by Admin</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                                  <User className="w-3 h-3 text-slate-500" />
                                  <span>Posted by {dist.submitterName || 'Registered User'}</span>
                                </span>
                              )}
                            </div>

                            {/* Firm Name & Contact Person */}
                            <div>
                              <h3 className="font-black text-slate-900 text-base sm:text-lg group-hover:text-teal-700 transition-colors break-words">
                                {dist.firmName}
                              </h3>
                              <p className="text-xs text-slate-500 font-semibold mt-0.5">
                                Contact Person: <strong className="text-slate-800">{dist.contactPerson}</strong>
                              </p>
                            </div>

                            {/* Address with MapPin */}
                            <div className="text-xs text-slate-600 flex items-start gap-1.5 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                              <MapPin className="w-3.5 h-3.5 text-teal-600 mt-0.5 flex-shrink-0" />
                              <span className="font-medium text-slate-700 leading-relaxed break-words">
                                {dist.officeAddress}, {dist.city}, {dist.state} {dist.pincode ? `- ${dist.pincode}` : ''}
                              </span>
                            </div>

                            {/* Commercial Specs */}
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                              {dist.deliveryLeadTime && (
                                <span>
                                  <strong className="text-slate-700">Delivery:</strong> {dist.deliveryLeadTime}
                                </span>
                              )}
                              {dist.minimumOrderValue > 0 && (
                                <span>
                                  <strong className="text-slate-700">Min. Order:</strong>{' '}
                                  <span className="font-bold text-emerald-700">
                                    Rs. {dist.minimumOrderValue.toLocaleString('en-IN')}
                                  </span>
                                </span>
                              )}
                              {dist.paymentTerms && (
                                <span>
                                  <strong className="text-slate-700">Payment:</strong> {dist.paymentTerms}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Right side contact action buttons */}
                          <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-center gap-2.5 w-full lg:w-auto pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100 flex-shrink-0">
                            <div className="flex items-center gap-2">
                              <a
                                href={`tel:${dist.mobile}`}
                                className="py-2 px-3.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold transition-all flex items-center justify-center gap-1.5 border border-teal-200 shadow-sm active:scale-95"
                              >
                                <Phone className="w-3.5 h-3.5" />
                                <span>Call</span>
                              </a>

                              <a
                                href={`https://wa.me/91${dist.whatsappNumber || dist.mobile}?text=${encodeURIComponent(
                                  `Hello ${dist.firmName}, I found your agency on the Krishna Medicose Pharmaceutical Catalog.`
                                )}`}
                                target="_blank"
                                rel="noreferrer"
                                className="py-2 px-3.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition-all flex items-center justify-center gap-1.5 border border-emerald-200 shadow-sm active:scale-95"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                                <span>WhatsApp</span>
                              </a>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Distributors Pagination Controls */}
                {distTotalPages > 1 && (
                  <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs border-t border-slate-200">
                    <div className="text-slate-500 font-medium">
                      Showing <strong className="text-slate-800">{(currentDistPage - 1) * distPageSize + 1}</strong> to{' '}
                      <strong className="text-slate-800">{Math.min(currentDistPage * distPageSize, totalDistributors)}</strong> of{' '}
                      <strong className="text-slate-800">{totalDistributors}</strong> distributors
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setCurrentDistPage((p) => Math.max(1, p - 1))}
                        disabled={currentDistPage === 1}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 font-bold bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                        <span>Prev</span>
                      </button>

                      {Array.from({ length: distTotalPages }, (_, idx) => idx + 1)
                        .filter((p) => p === 1 || p === distTotalPages || Math.abs(p - currentDistPage) <= 1)
                        .map((p, i, arr) => {
                          const prev = arr[i - 1];
                          return (
                            <React.Fragment key={p}>
                              {prev && p - prev > 1 && <span className="px-1 text-slate-400 font-mono">...</span>}
                              <button
                                onClick={() => setCurrentDistPage(p)}
                                className={`w-8 h-8 rounded-xl font-bold transition-all ${
                                  currentDistPage === p
                                    ? 'bg-teal-700 text-white shadow-sm'
                                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                                }`}
                              >
                                {p}
                              </button>
                            </React.Fragment>
                          );
                        })}

                      <button
                        onClick={() => setCurrentDistPage((p) => Math.min(distTotalPages, p + 1))}
                        disabled={currentDistPage === distTotalPages}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 font-bold bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                      >
                        <span>Next</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ================= TAB 3: MY CONTRIBUTIONS ================= */}
            {activeTab === 'my_contributions' && (
              <div className="space-y-6">
                <div className="p-4 bg-teal-50 border border-teal-200 rounded-2xl flex items-center justify-between text-xs text-teal-900">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-teal-700" />
                    <span>
                      User-contributed listings go to draft / pending approval and are published upon admin verification.
                    </span>
                  </div>
                  <button
                    onClick={() => setContributeModalOpen(true)}
                    className="px-3 py-1.5 bg-teal-700 text-white font-bold rounded-xl text-xs hover:bg-teal-800 transition-colors"
                  >
                    Add Contribution
                  </button>
                </div>

                {loadingContributions ? (
                  <div className="p-16 text-center text-teal-700 space-y-3 bg-white rounded-3xl border border-slate-200">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-teal-600" />
                    <p className="text-xs font-bold text-slate-600">Loading your contributions...</p>
                  </div>
                ) : myContributions.products?.length === 0 && myContributions.distributors?.length === 0 ? (
                  <div className="p-16 text-center text-slate-500 space-y-4 bg-white rounded-3xl border border-slate-200">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                      <Plus className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">No contributions submitted yet</h4>
                      <p className="text-xs text-slate-500 mt-1">
                        Help expand the community catalog by submitting medicines or distributors you work with.
                      </p>
                    </div>
                    <button
                      onClick={() => setContributeModalOpen(true)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-700 text-white rounded-xl text-xs font-bold hover:bg-teal-800 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Submit First Contribution</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Submitted Products */}
                    {myContributions.products?.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wider text-xs">
                          Submitted Products ({myContributions.products.length})
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {myContributions.products.map((p) => (
                            <div
                              key={p._id}
                              className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                                  {p.category}
                                </span>
                                <span
                                  className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                                    p.status === 'approved'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : p.status === 'rejected'
                                      ? 'bg-rose-100 text-rose-800'
                                      : 'bg-amber-100 text-amber-800'
                                  }`}
                                >
                                  {p.status === 'pending_approval' ? 'Pending Review' : p.status}
                                </span>
                              </div>

                              <div>
                                <h4 className="font-black text-slate-900 text-sm">{p.name}</h4>
                                <p className="text-xs text-slate-500">{p.manufacturer}</p>
                              </div>

                              <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl font-medium line-clamp-2">
                                Salt: {p.saltComposition}
                              </p>

                              {p.adminNotes && (
                                <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 space-y-0.5">
                                  <span className="font-bold block">Review Feedback:</span>
                                  <span>{p.adminNotes}</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Submitted Distributors */}
                    {myContributions.distributors?.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wider text-xs">
                          Submitted Distributors ({myContributions.distributors.length})
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {myContributions.distributors.map((d) => (
                            <div
                              key={d._id}
                              className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                                  {d.city}, {d.state}
                                </span>
                                <span
                                  className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                                    d.status === 'approved'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : d.status === 'rejected'
                                      ? 'bg-rose-100 text-rose-800'
                                      : 'bg-amber-100 text-amber-800'
                                  }`}
                                >
                                  {d.status === 'pending_approval' ? 'Pending Review' : d.status}
                                </span>
                              </div>

                              <div>
                                <h4 className="font-black text-slate-900 text-sm">{d.firmName}</h4>
                                <p className="text-xs text-slate-500">Contact: {d.contactPerson}</p>
                              </div>

                              {d.adminNotes && (
                                <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 space-y-0.5">
                                  <span className="font-bold block">Review Feedback:</span>
                                  <span>{d.adminNotes}</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ================= MODAL: PRODUCT DETAILS & DISTRIBUTORS ================= */}
      {selectedProductDetails && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-hidden">
          <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Sticky Header Flush with Top (No gap) & Posted By Badge */}
            <div className="sticky top-0 z-20 bg-white px-6 py-4 sm:px-8 border-b border-slate-200 flex items-start justify-between flex-shrink-0">
              <div className="space-y-1.5 pr-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                    {selectedProductDetails.category}
                  </span>
                  {selectedProductDetails.prescriptionRequired ? (
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200">
                      Prescription Required (Rx)
                    </span>
                  ) : (
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Non-Rx / OTC
                    </span>
                  )}

                  {/* Posted By Badge */}
                  {selectedProductDetails.isDirectAdminEntry || selectedProductDetails.submittedByModel === 'AdminUser' ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-teal-100/80 text-teal-900 border border-teal-300">
                      <ShieldCheck className="w-3 h-3 text-teal-700" />
                      <span>Posted by Admin</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200">
                      <User className="w-3 h-3 text-slate-500" />
                      <span>Posted by {selectedProductDetails.submitterName || 'Registered User'}</span>
                    </span>
                  )}
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 font-outfit break-words break-all">
                  {selectedProductDetails.name}
                </h3>
                {selectedProductDetails.brandName && (
                  <p className="text-xs font-semibold text-slate-500 break-words break-all">
                    Trade / Brand: {selectedProductDetails.brandName}
                  </p>
                )}
              </div>
              <button
                onClick={() => setSelectedProductDetails(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 flex-shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 text-xs">
              {/* Salt Composition banner */}
              <div className="p-4 bg-gradient-to-r from-teal-50 to-sky-50 rounded-2xl border border-teal-100 text-xs space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 flex items-center gap-1">
                  <Pill className="w-3.5 h-3.5 text-teal-600" />
                  <span>Active Salt Formulation</span>
                </span>
                <p className="font-bold text-slate-900 text-sm leading-relaxed break-words break-all max-h-40 overflow-y-auto">
                  {selectedProductDetails.saltComposition}
                </p>
              </div>

              {/* Specifications Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl space-y-0.5">
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Manufacturer</span>
                  <p className="font-bold text-slate-900 break-words break-all">{selectedProductDetails.manufacturer}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl space-y-0.5">
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Dosage Form</span>
                  <p className="font-bold text-slate-900">{selectedProductDetails.dosageForm}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl space-y-0.5">
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Packaging</span>
                  <p className="font-bold text-slate-900 break-words break-all">{selectedProductDetails.packaging || 'Standard'}</p>
                </div>
                {selectedProductDetails.strength && (
                  <div className="p-3 bg-slate-50 rounded-xl space-y-0.5">
                    <span className="text-slate-400 font-bold uppercase text-[10px]">Strength</span>
                    <p className="font-bold text-slate-900 break-words break-all">{selectedProductDetails.strength}</p>
                  </div>
                )}
                {selectedProductDetails.mrp > 0 && (
                  <div className="p-3 bg-slate-50 rounded-xl space-y-0.5">
                    <span className="text-slate-400 font-bold uppercase text-[10px]">Max Retail Price</span>
                    <p className="font-bold text-emerald-700">Rs. {selectedProductDetails.mrp.toFixed(2)}</p>
                  </div>
                )}
                {selectedProductDetails.hsnCode && (
                  <div className="p-3 bg-slate-50 rounded-xl space-y-0.5">
                    <span className="text-slate-400 font-bold uppercase text-[10px]">HSN Code</span>
                    <p className="font-bold text-slate-900">{selectedProductDetails.hsnCode}</p>
                  </div>
                )}
              </div>

              {/* Therapeutic class & description */}
              {selectedProductDetails.description && (
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-xs space-y-1">
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    Clinical Usage / Overview
                  </span>
                  <p className="text-slate-700 whitespace-pre-line leading-relaxed break-words break-all max-h-48 overflow-y-auto">
                    {selectedProductDetails.description}
                  </p>
                </div>
              )}

              {/* Verified Distributors Section */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-slate-900 text-sm flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-teal-600" />
                    <span>Verified Distributors & Supply Partners ({selectedProductDetails.distributors?.length || 0})</span>
                  </h4>
                </div>

                {!selectedProductDetails.distributors || selectedProductDetails.distributors.length === 0 ? (
                  <div className="p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center text-xs text-slate-500 space-y-2">
                    <p>No specific distributors currently linked to this listing.</p>
                    <button
                      onClick={() => {
                        setSelectedProductDetails(null);
                        setContributeModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1 text-teal-700 font-bold hover:underline"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Are you a supplier? Add your distributor profile</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedProductDetails.distributors.map((dist) => (
                      <div
                        key={dist._id}
                        className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-teal-200 transition-all space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <h5 className="font-black text-slate-900 text-sm">{dist.firmName}</h5>
                            <p className="text-xs text-slate-500 font-semibold">Contact: {dist.contactPerson}</p>
                          </div>
                          {dist.supplyCoverage?.panIndia ? (
                            <span className="self-start text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                              <Globe className="w-3 h-3" />
                              <span>Pan-India Delivery</span>
                            </span>
                          ) : (
                            <span className="self-start text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                              {dist.state} & Regional
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-slate-600 space-y-1">
                          <div className="flex items-start gap-1">
                            <MapPin className="w-3.5 h-3.5 text-teal-600 mt-0.5 flex-shrink-0" />
                            <span>
                              {dist.officeAddress}, {dist.city}, {dist.state} {dist.pincode ? `- ${dist.pincode}` : ''}
                            </span>
                          </div>
                          {dist.drugLicenseNumber && (
                            <div className="text-[11px] font-mono text-slate-500">
                              Drug License: {dist.drugLicenseNumber}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-xs">
                          <div className="text-[11px] text-slate-500 font-medium">
                            {dist.deliveryLeadTime && <span>Lead Time: {dist.deliveryLeadTime}</span>}
                            {dist.minimumOrderValue > 0 && <span> | Min: Rs. {dist.minimumOrderValue}</span>}
                          </div>

                          <div className="flex items-center gap-2">
                            <a
                              href={`tel:${dist.mobile}`}
                              className="px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold transition-colors flex items-center gap-1 border border-teal-200"
                            >
                              <Phone className="w-3 h-3" />
                              <span>Call</span>
                            </a>

                            <a
                              href={`https://wa.me/91${dist.whatsappNumber || dist.mobile}?text=${encodeURIComponent(
                                `Hello ${dist.firmName}, I am contacting you regarding supply of ${selectedProductDetails.name} listed on Krishna Medicose.`
                              )}`}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition-colors flex items-center gap-1 border border-emerald-200"
                            >
                              <MessageCircle className="w-3 h-3" />
                              <span>WhatsApp</span>
                            </a>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Sticky Footer */}
            <div className="sticky bottom-0 z-20 bg-slate-50 px-6 py-3.5 sm:px-8 border-t border-slate-200 flex items-center justify-end flex-shrink-0">
              <button
                onClick={() => setSelectedProductDetails(null)}
                className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: LOCATION SEARCH VIA MAPS API ================= */}
      {locationModalOpen && (
        <div className="fixed inset-0 z-[170] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-hidden">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-white flex-shrink-0">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-teal-600" />
                <h3 className="text-base font-black text-slate-900 font-outfit">Select Location for Search</h3>
              </div>
              <button
                onClick={() => setLocationModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-500">
                Search your city, locality, or pin code to view available medicines and distributors supplying to your region.
              </p>

              <LocationPicker
                value={{
                  city: selectedCity,
                  state: selectedState,
                  coordinates: [0, 0]
                }}
                onChange={(loc) => {
                  if (loc.city) setSelectedCity(loc.city);
                  if (loc.state) setSelectedState(loc.state);
                  setLocationLabel(loc.city ? `${loc.city}, ${loc.state || 'India'}` : (loc.state || 'Selected Area'));
                  setCurrentPage(1);
                  setCurrentDistPage(1);
                  setLocationModalOpen(false);
                }}
                showMapPreview={false}
              />

              <div className="pt-2 flex items-center justify-between border-t border-slate-100 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCity('');
                    setSelectedState('');
                    setLocationLabel('');
                    setCurrentPage(1);
                    setCurrentDistPage(1);
                    setLocationModalOpen(false);
                  }}
                  className="text-rose-600 font-bold hover:underline"
                >
                  Clear Location Filter
                </button>
                <button
                  type="button"
                  onClick={() => setLocationModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: CONTRIBUTE PRODUCT & DISTRIBUTOR ================= */}
      {contributeModalOpen && (
        <ContributeCatalogModal
          isOpen={contributeModalOpen}
          onClose={() => setContributeModalOpen(false)}
          onSuccess={() => {
            setContributeModalOpen(false);
            showToast('Contribution submitted successfully for administrative review!');
            if (activeTab === 'my_contributions') {
              fetchMyContributions();
            } else {
              setActiveTab('my_contributions');
            }
          }}
        />
      )}

      {/* Auth Modal integration */}
      {authModalOpen && (
        <ServicesAuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          initialMode={authModalMode}
          context="catalogs"
          onAuthSuccess={(user) => {
            setCurrentUser(user);
            setAuthModalOpen(false);
            showToast(`Welcome, ${user.name}! You are now signed in.`);
          }}
        />
      )}
    </main>
  );
}

/**
 * =========================================================================
 * SUB-COMPONENT: CONTRIBUTE CATALOG MODAL
 * =========================================================================
 */
function ContributeCatalogModal({ isOpen, onClose, onSuccess }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [includeDistributor, setIncludeDistributor] = useState(true);

  // Form states
  const [productForm, setProductForm] = useState({
    name: '',
    brandName: '',
    manufacturer: '',
    saltComposition: '',
    category: 'Allopathic',
    dosageForm: 'Tablet',
    packaging: '1 Strip',
    strength: '',
    mrp: '',
    prescriptionRequired: true,
    hsnCode: '',
    storageCondition: 'Store in a cool, dry place away from sunlight',
    therapeuticClass: '',
    description: ''
  });

  const [distributorForm, setDistributorForm] = useState({
    firmName: '',
    contactPerson: '',
    mobile: '',
    alternateMobile: '',
    whatsappNumber: '',
    email: '',
    drugLicenseNumber: '',
    gstNumber: '',
    officeAddress: '',
    city: '',
    state: 'Uttar Pradesh',
    pincode: '',
    coordinates: [0, 0],
    panIndia: false,
    statesCovered: [],
    minimumOrderValue: '',
    deliveryLeadTime: '24-48 Hours',
    paymentTerms: 'Credit / Advance / COD',
    notes: ''
  });

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Form Validations
    if (!productForm.name.trim()) {
      setError('Product name is required.');
      return;
    }
    if (productForm.name.trim().length > 120) {
      setError('Product name cannot exceed 120 characters.');
      return;
    }
    if (!productForm.manufacturer.trim()) {
      setError('Manufacturer name is required.');
      return;
    }
    if (productForm.manufacturer.trim().length > 120) {
      setError('Manufacturer name cannot exceed 120 characters.');
      return;
    }
    if (!productForm.saltComposition.trim()) {
      setError('Salt composition is required.');
      return;
    }
    if (productForm.saltComposition.trim().length > 300) {
      setError('Salt composition cannot exceed 300 characters.');
      return;
    }

    let parsedMrp = 0;
    if (productForm.mrp !== undefined && productForm.mrp !== null && productForm.mrp !== '') {
      parsedMrp = Number(productForm.mrp);
      if (isNaN(parsedMrp) || parsedMrp < 0 || parsedMrp > 500000) {
        setError('MRP must be a valid number between Rs. 0 and Rs. 5,00,000.');
        return;
      }
    }

    if (includeDistributor) {
      if (!distributorForm.firmName.trim()) {
        setError('Distributor firm name is required.');
        return;
      }
      if (distributorForm.firmName.trim().length > 120) {
        setError('Distributor firm name cannot exceed 120 characters.');
        return;
      }
      if (!distributorForm.contactPerson.trim()) {
        setError('Distributor contact person name is required.');
        return;
      }
      if (distributorForm.contactPerson.trim().length > 80) {
        setError('Contact person name cannot exceed 80 characters.');
        return;
      }
      if (!distributorForm.mobile.trim()) {
        setError('Distributor mobile number is required.');
        return;
      }
      if (!/^[6-9]\d{9}$/.test(distributorForm.mobile.trim())) {
        setError('Please enter a valid 10-digit Indian mobile number for distributor.');
        return;
      }
      if (distributorForm.whatsappNumber && !/^[6-9]\d{9}$/.test(distributorForm.whatsappNumber.trim())) {
        setError('WhatsApp number must be a valid 10-digit Indian mobile number.');
        return;
      }
      if (!distributorForm.officeAddress.trim()) {
        setError('Distributor office or warehouse address is required.');
        return;
      }
      if (distributorForm.officeAddress.trim().length > 200) {
        setError('Distributor office address cannot exceed 200 characters.');
        return;
      }
      if (!distributorForm.city.trim()) {
        setError('Distributor city is required.');
        return;
      }
      if (distributorForm.pincode && !/^\d{6}$/.test(distributorForm.pincode.trim())) {
        setError('Pincode must be exactly 6 digits.');
        return;
      }
      if (distributorForm.minimumOrderValue !== undefined && distributorForm.minimumOrderValue !== null && distributorForm.minimumOrderValue !== '') {
        const numMov = Number(distributorForm.minimumOrderValue);
        if (isNaN(numMov) || numMov < 0 || numMov > 10000000) {
          setError('Minimum order value must be between Rs. 0 and Rs. 1,00,00,000.');
          return;
        }
      }
    }

    setSubmitting(true);
    try {
      const payload = {
        ...productForm,
        mrp: parsedMrp,
        newDistributor: includeDistributor ? distributorForm : undefined
      };

      await catalogApi.post('/products', payload);
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit contribution. Please check all fields.');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStateCovered = (stateName) => {
    setDistributorForm((prev) => {
      const exists = prev.statesCovered.includes(stateName);
      if (exists) {
        return { ...prev, statesCovered: prev.statesCovered.filter((s) => s !== stateName) };
      } else {
        return { ...prev, statesCovered: [...prev.statesCovered, stateName] };
      }
    });
  };

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-hidden">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Sticky Header Flush with Top (No gap) */}
        <div className="sticky top-0 z-20 bg-white px-6 py-4 sm:px-8 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
          <div>
            <h3 className="text-xl font-black text-slate-900 font-outfit">Contribute Product & Distributor</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Submissions go to pending review and are immediately published upon administrative verification.
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 flex-shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Scrollable Form Body */}
          <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 text-xs">
            {error && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Section 1: Product Specifications */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <Pill className="w-4 h-4 text-teal-600" />
                <h4 className="font-black text-slate-900 text-sm uppercase tracking-wide">1. Product Information</h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700">
                      Product / Medicine Name <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] text-slate-400 font-mono">{(productForm.name || '').length}/120</span>
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={120}
                    placeholder="e.g. Augmentin 625 Duo Tablet"
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700">Trade / Brand Name (Optional)</label>
                    <span className="text-[10px] text-slate-400 font-mono">{(productForm.brandName || '').length}/80</span>
                  </div>
                  <input
                    type="text"
                    maxLength={80}
                    placeholder="e.g. Augmentin"
                    value={productForm.brandName}
                    onChange={(e) => setProductForm({ ...productForm, brandName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700">
                      Manufacturer / Marketer <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] text-slate-400 font-mono">{(productForm.manufacturer || '').length}/120</span>
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={120}
                    placeholder="e.g. GlaxoSmithKline Pharmaceuticals"
                    value={productForm.manufacturer}
                    onChange={(e) => setProductForm({ ...productForm, manufacturer: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600 font-semibold"
                  >
                    {PHARMACY_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">
                    Active Salt Composition <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">{(productForm.saltComposition || '').length}/300</span>
                </div>
                <textarea
                  required
                  maxLength={300}
                  rows={2}
                  placeholder="e.g. Amoxicillin (500mg) + Clavulanic Acid (125mg)"
                  value={productForm.saltComposition}
                  onChange={(e) => setProductForm({ ...productForm, saltComposition: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Dosage Form</label>
                  <select
                    value={productForm.dosageForm}
                    onChange={(e) => setProductForm({ ...productForm, dosageForm: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600 font-semibold"
                  >
                    {DOSAGE_FORMS.map((form) => (
                      <option key={form} value={form}>
                        {form}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Packaging Unit</label>
                  <input
                    type="text"
                    maxLength={60}
                    placeholder="e.g. 10 Tablets in 1 Strip"
                    value={productForm.packaging}
                    onChange={(e) => setProductForm({ ...productForm, packaging: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Strength (e.g. 625mg)</label>
                  <input
                    type="text"
                    maxLength={50}
                    placeholder="e.g. 625 mg"
                    value={productForm.strength}
                    onChange={(e) => setProductForm({ ...productForm, strength: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">MRP in INR (Max 5,00,000)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="500000"
                    placeholder="e.g. 215.50"
                    value={productForm.mrp}
                    onKeyDown={(e) => {
                      if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault();
                    }}
                    onChange={(e) => setProductForm({ ...productForm, mrp: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800 p-2.5 rounded-xl border border-slate-200 bg-slate-50">
                  <input
                    type="checkbox"
                    checked={productForm.prescriptionRequired}
                    onChange={(e) => setProductForm({ ...productForm, prescriptionRequired: e.target.checked })}
                    className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4 cursor-pointer"
                  />
                  <span>Prescription Required (Schedule H/H1 / Rx Drug)</span>
                </label>

                <div>
                  <input
                    type="text"
                    maxLength={100}
                    placeholder="Therapeutic class (e.g. Antibiotic / Anti-infective)"
                    value={productForm.therapeuticClass}
                    onChange={(e) => setProductForm({ ...productForm, therapeuticClass: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Distributor / Supplier Information */}
            <div className="space-y-4 pt-3 border-t border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-teal-600" />
                  <h4 className="font-black text-slate-900 text-sm uppercase tracking-wide">
                    2. Distributor / Supply Partner
                  </h4>
                </div>

                <label className="flex items-center gap-2 cursor-pointer font-bold text-teal-800">
                  <input
                    type="checkbox"
                    checked={includeDistributor}
                    onChange={(e) => setIncludeDistributor(e.target.checked)}
                    className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
                  />
                  <span>Include Distributor Details</span>
                </label>
              </div>

              {includeDistributor && (
                <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200 space-y-4">
                  {/* Location Search via Maps API */}
                  <div className="p-3.5 bg-white rounded-2xl border border-teal-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-teal-900 flex items-center gap-1.5">
                        <Search className="w-3.5 h-3.5 text-teal-600" />
                        <span>Search Location via Map (Auto-fills Address, City, State & Pincode)</span>
                      </span>
                      {distributorForm.coordinates && distributorForm.coordinates[0] !== 0 && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                          GPS Geocoded
                        </span>
                      )}
                    </div>
                    <LocationPicker
                      value={{
                        address: distributorForm.officeAddress,
                        city: distributorForm.city,
                        state: distributorForm.state,
                        pincode: distributorForm.pincode,
                        coordinates: distributorForm.coordinates || [0, 0]
                      }}
                      onChange={(loc) => {
                        setDistributorForm((prev) => ({
                          ...prev,
                          officeAddress: loc.address || prev.officeAddress,
                          city: loc.city || prev.city,
                          state: loc.state || prev.state,
                          pincode: loc.pincode || prev.pincode,
                          coordinates: loc.coordinates || prev.coordinates
                        }));
                      }}
                      showMapPreview={false}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-bold text-slate-700">
                          Distributor Firm Name <span className="text-rose-500">*</span>
                        </label>
                        <span className="text-[10px] text-slate-400 font-mono">{(distributorForm.firmName || '').length}/120</span>
                      </div>
                      <input
                        type="text"
                        required={includeDistributor}
                        maxLength={120}
                        placeholder="e.g. Apex Pharma Agency"
                        value={distributorForm.firmName}
                        onChange={(e) => setDistributorForm({ ...distributorForm, firmName: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600 bg-white"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-bold text-slate-700">
                          Contact Person <span className="text-rose-500">*</span>
                        </label>
                        <span className="text-[10px] text-slate-400 font-mono">{(distributorForm.contactPerson || '').length}/80</span>
                      </div>
                      <input
                        type="text"
                        required={includeDistributor}
                        maxLength={80}
                        placeholder="e.g. Rajesh Kumar"
                        value={distributorForm.contactPerson}
                        onChange={(e) => setDistributorForm({ ...distributorForm, contactPerson: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600 bg-white"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        Mobile Number (10 digits) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="tel"
                        required={includeDistributor}
                        maxLength={10}
                        placeholder="e.g. 9876543210"
                        value={distributorForm.mobile}
                        onChange={(e) =>
                          setDistributorForm({
                            ...distributorForm,
                            mobile: e.target.value.replace(/\D/g, '').slice(0, 10)
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600 bg-white"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">WhatsApp Number (Optional)</label>
                      <input
                        type="tel"
                        maxLength={10}
                        placeholder="e.g. 9876543210"
                        value={distributorForm.whatsappNumber}
                        onChange={(e) =>
                          setDistributorForm({
                            ...distributorForm,
                            whatsappNumber: e.target.value.replace(/\D/g, '').slice(0, 10)
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600 bg-white"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Drug License (DL) Number</label>
                      <input
                        type="text"
                        maxLength={60}
                        placeholder="e.g. DL-20B/21B-12345"
                        value={distributorForm.drugLicenseNumber}
                        onChange={(e) => setDistributorForm({ ...distributorForm, drugLicenseNumber: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600 bg-white"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">GST Number (Optional)</label>
                      <input
                        type="text"
                        maxLength={15}
                        placeholder="e.g. 07AAAAA0000A1Z5"
                        value={distributorForm.gstNumber}
                        onChange={(e) => setDistributorForm({ ...distributorForm, gstNumber: e.target.value.toUpperCase() })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600 bg-white"
                      />
                    </div>
                  </div>

                  {/* Address & State */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        City <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required={includeDistributor}
                        maxLength={60}
                        placeholder="e.g. Ghaziabad / Delhi"
                        value={distributorForm.city}
                        onChange={(e) => setDistributorForm({ ...distributorForm, city: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600 bg-white"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        Base State <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={distributorForm.state}
                        onChange={(e) => setDistributorForm({ ...distributorForm, state: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600 bg-white font-semibold"
                      >
                        {INDIAN_STATES.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Pincode (6 digits)</label>
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="e.g. 201005"
                        value={distributorForm.pincode}
                        onChange={(e) =>
                          setDistributorForm({
                            ...distributorForm,
                            pincode: e.target.value.replace(/\D/g, '').slice(0, 6)
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600 bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-slate-700">
                        Office / Warehouse Address <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-[10px] text-slate-400 font-mono">{(distributorForm.officeAddress || '').length}/200</span>
                    </div>
                    <input
                      type="text"
                      required={includeDistributor}
                      maxLength={200}
                      placeholder="e.g. Shop No. 14, Commercial Complex, Shalimar Garden"
                      value={distributorForm.officeAddress}
                      onChange={(e) => setDistributorForm({ ...distributorForm, officeAddress: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600 bg-white"
                    />
                  </div>

                  {/* Supply Coverage Pan-India selection */}
                  <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-800 block">Supply Coverage</span>
                        <span className="text-[11px] text-slate-500">
                          Does this distributor supply across all states in India or select regions?
                        </span>
                      </div>

                      <label className="flex items-center gap-2 cursor-pointer font-bold text-teal-800 bg-teal-50 px-3 py-1.5 rounded-xl border border-teal-200">
                        <input
                          type="checkbox"
                          checked={distributorForm.panIndia}
                          onChange={(e) => setDistributorForm({ ...distributorForm, panIndia: e.target.checked })}
                          className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4 cursor-pointer"
                        />
                        <span>Supplies Pan-India</span>
                      </label>
                    </div>

                    {!distributorForm.panIndia && (
                      <div className="pt-2">
                        <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                          Select Specific States Covered:
                        </span>
                        <div className="max-h-32 overflow-y-auto border border-slate-200 rounded-xl p-2 bg-slate-50 flex flex-wrap gap-1.5">
                          {INDIAN_STATES.map((st) => {
                            const isSelected = distributorForm.statesCovered.includes(st);
                            return (
                              <button
                                type="button"
                                key={st}
                                onClick={() => toggleStateCovered(st)}
                                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all ${
                                  isSelected
                                    ? 'bg-teal-700 text-white'
                                    : 'bg-white border border-slate-200 text-slate-700 hover:border-teal-500'
                                }`}
                              >
                                {st} {isSelected && '(Selected)'}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Commercial Terms */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Minimum Order Value (INR)</label>
                      <input
                        type="number"
                        min="0"
                        max="10000000"
                        placeholder="e.g. 5000"
                        value={distributorForm.minimumOrderValue}
                        onKeyDown={(e) => {
                          if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault();
                        }}
                        onChange={(e) => setDistributorForm({ ...distributorForm, minimumOrderValue: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600 bg-white"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Delivery Lead Time</label>
                      <input
                        type="text"
                        maxLength={60}
                        placeholder="e.g. 24-48 Hours"
                        value={distributorForm.deliveryLeadTime}
                        onChange={(e) => setDistributorForm({ ...distributorForm, deliveryLeadTime: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600 bg-white"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Payment Terms</label>
                      <input
                        type="text"
                        maxLength={100}
                        placeholder="e.g. Credit / COD / Advance"
                        value={distributorForm.paymentTerms}
                        onChange={(e) => setDistributorForm({ ...distributorForm, paymentTerms: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600 bg-white"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sticky Footer */}
          <div className="sticky bottom-0 z-20 bg-slate-50 px-6 py-3.5 sm:px-8 border-t border-slate-200 flex items-center justify-end gap-3 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-black transition-all shadow-lg shadow-teal-700/20 disabled:opacity-50 flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Submit for Review</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
