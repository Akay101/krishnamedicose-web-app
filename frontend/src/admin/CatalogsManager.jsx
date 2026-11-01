import React, { useState, useEffect } from 'react';
import {
  Pill,
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
  ChevronRight
} from 'lucide-react';
import catalogApi from '../utils/catalogApi';
import LocationPicker from '../components/services/LocationPicker';
import { INDIAN_STATES, PHARMACY_CATEGORIES, DOSAGE_FORMS } from '../utils/catalogConstants';
import { useModal } from '../context/ModalContext';

export default function CatalogsManager() {
  const { showModal } = useModal();
  const [activeTab, setActiveTab] = useState('products'); // 'products', 'distributors'

  // Stats
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Products state & pagination
  const [products, setProducts] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [productPage, setProductPage] = useState(1);
  const [totalProductPages, setTotalProductPages] = useState(1);
  const productPageSize = 10;
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [productStatusFilter, setProductStatusFilter] = useState('All');
  const [productCategoryFilter, setProductCategoryFilter] = useState('All');

  // Distributors state & pagination
  const [distributors, setDistributors] = useState([]);
  const [totalDistributors, setTotalDistributors] = useState(0);
  const [distributorPage, setDistributorPage] = useState(1);
  const [totalDistributorPages, setTotalDistributorPages] = useState(1);
  const distributorPageSize = 10;
  const [loadingDistributors, setLoadingDistributors] = useState(false);
  const [distributorSearch, setDistributorSearch] = useState('');
  const [distributorStatusFilter, setDistributorStatusFilter] = useState('All');

  // Modals state
  const [selectedProductForDetails, setSelectedProductForDetails] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedDistributorForDetails, setSelectedDistributorForDetails] = useState(null);
  const [editingDistributor, setEditingDistributor] = useState(null);

  // Rejection modal
  const [rejectingItem, setRejectingItem] = useState(null); // { type: 'product'|'distributor', id, title }
  const [rejectReason, setRejectReason] = useState('');

  // Direct Creation modals
  const [createProductOpen, setCreateProductOpen] = useState(false);
  const [createDistributorOpen, setCreateDistributorOpen] = useState(false);

  const initialNewProductForm = {
    name: '',
    brandName: '',
    manufacturer: '',
    saltComposition: '',
    category: 'Allopathic',
    dosageForm: 'Tablet',
    packaging: '1 Strip',
    strength: '',
    mrp: '',
    prescriptionRequired: true
  };
  const [newProductForm, setNewProductForm] = useState(initialNewProductForm);

  const initialNewDistributorForm = {
    firmName: '',
    contactPerson: '',
    mobile: '',
    whatsappNumber: '',
    drugLicenseNumber: '',
    gstNumber: '',
    officeAddress: '',
    city: '',
    state: 'Uttar Pradesh',
    pincode: '',
    coordinates: [0, 0],
    panIndia: false
  };
  const [newDistributorForm, setNewDistributorForm] = useState(initialNewDistributorForm);

  // Notifications
  const [actionMessage, setActionMessage] = useState('');

  const showNotification = (msg) => {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(''), 4000);
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const [debouncedProductSearch, setDebouncedProductSearch] = useState('');
  const [debouncedDistributorSearch, setDebouncedDistributorSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedProductSearch(productSearch);
    }, 350);
    return () => clearTimeout(timer);
  }, [productSearch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedDistributorSearch(distributorSearch);
    }, 350);
    return () => clearTimeout(timer);
  }, [distributorSearch]);

  // Reset page when search or filters change
  useEffect(() => {
    setProductPage(1);
  }, [debouncedProductSearch, productStatusFilter, productCategoryFilter]);

  useEffect(() => {
    setDistributorPage(1);
  }, [debouncedDistributorSearch, distributorStatusFilter]);

  useEffect(() => {
    if (activeTab === 'products') {
      fetchAdminProducts();
    }
  }, [activeTab, debouncedProductSearch, productStatusFilter, productCategoryFilter, productPage]);

  useEffect(() => {
    if (activeTab === 'distributors') {
      fetchAdminDistributors();
    }
  }, [activeTab, debouncedDistributorSearch, distributorStatusFilter, distributorPage]);

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const res = await catalogApi.get('/admin/stats');
      setStats(res.data.stats);
    } catch (err) {
      console.error('Failed to load catalog stats:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchAdminProducts = async () => {
    setLoadingProducts(true);
    try {
      const res = await catalogApi.get('/admin/products', {
        params: {
          search: debouncedProductSearch,
          status: productStatusFilter,
          category: productCategoryFilter,
          page: productPage,
          limit: productPageSize
        }
      });
      setProducts(res.data.products || []);
      setTotalProducts(res.data.total || 0);
      setTotalProductPages(res.data.pages || 1);
    } catch (err) {
      console.error('Failed to load admin products:', err);
    } finally {
      setLoadingProducts(false);
    }
  };

  const fetchAdminDistributors = async () => {
    setLoadingDistributors(true);
    try {
      const res = await catalogApi.get('/admin/distributors', {
        params: {
          search: debouncedDistributorSearch,
          status: distributorStatusFilter,
          page: distributorPage,
          limit: distributorPageSize
        }
      });
      setDistributors(res.data.distributors || []);
      setTotalDistributors(res.data.total || 0);
      setTotalDistributorPages(res.data.pages || 1);
    } catch (err) {
      console.error('Failed to load admin distributors:', err);
    } finally {
      setLoadingDistributors(false);
    }
  };

  // Status Handlers
  const handleApproveProduct = async (product) => {
    try {
      await catalogApi.patch(`/admin/products/${product._id}/status`, {
        status: 'approved',
        adminNotes: 'Approved by administrator'
      });
      showNotification(`Product "${product.name}" approved and published to catalog.`);
      fetchAdminProducts();
      fetchStats();
      if (selectedProductForDetails?._id === product._id) {
        setSelectedProductForDetails((prev) => ({ ...prev, status: 'approved' }));
      }
    } catch (err) {
      showModal({
        title: 'Approval Failed',
        message: err.response?.data?.message || 'Failed to approve product.',
        type: 'error'
      });
    }
  };

  const handleApproveDistributor = async (distributor) => {
    try {
      await catalogApi.patch(`/admin/distributors/${distributor._id}/status`, {
        status: 'approved',
        adminNotes: 'Approved by administrator'
      });
      showNotification(`Distributor "${distributor.firmName}" approved and verified.`);
      fetchAdminDistributors();
      fetchStats();
      if (selectedDistributorForDetails?._id === distributor._id) {
        setSelectedDistributorForDetails((prev) => ({ ...prev, status: 'approved' }));
      }
    } catch (err) {
      showModal({
        title: 'Approval Failed',
        message: err.response?.data?.message || 'Failed to approve distributor.',
        type: 'error'
      });
    }
  };

  const handleConfirmReject = async (e) => {
    e.preventDefault();
    if (!rejectingItem) return;

    try {
      if (rejectingItem.type === 'product') {
        await catalogApi.patch(`/admin/products/${rejectingItem.id}/status`, {
          status: 'rejected',
          adminNotes: rejectReason || 'Administrative rejection'
        });
        showNotification('Product marked as rejected.');
        fetchAdminProducts();
      } else {
        await catalogApi.patch(`/admin/distributors/${rejectingItem.id}/status`, {
          status: 'rejected',
          adminNotes: rejectReason || 'Administrative rejection'
        });
        showNotification('Distributor marked as rejected.');
        fetchAdminDistributors();
      }
      fetchStats();
      setRejectingItem(null);
      setRejectReason('');
    } catch (err) {
      showModal({
        title: 'Rejection Failed',
        message: err.response?.data?.message || 'Failed to reject listing.',
        type: 'error'
      });
    }
  };

  // Delete Handlers with Custom Modal Confirmation
  const handleDeleteProduct = (id) => {
    showModal({
      title: 'Confirm Deletion',
      message: 'Are you sure you want to PERMANENTLY delete this product catalog entry?',
      type: 'confirm',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          await catalogApi.delete(`/admin/products/${id}`);
          showNotification('Product catalog entry deleted.');
          fetchAdminProducts();
          fetchStats();
          if (selectedProductForDetails?._id === id) setSelectedProductForDetails(null);
        } catch (err) {
          showModal({
            title: 'Delete Failed',
            message: err.response?.data?.message || 'Failed to delete product.',
            type: 'error'
          });
        }
      }
    });
  };

  const handleDeleteDistributor = (id) => {
    showModal({
      title: 'Confirm Deletion',
      message: 'Are you sure you want to PERMANENTLY delete this distributor and unlink from products?',
      type: 'confirm',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          await catalogApi.delete(`/admin/distributors/${id}`);
          showNotification('Distributor profile deleted.');
          fetchAdminDistributors();
          fetchStats();
          if (selectedDistributorForDetails?._id === id) setSelectedDistributorForDetails(null);
        } catch (err) {
          showModal({
            title: 'Delete Failed',
            message: err.response?.data?.message || 'Failed to delete distributor.',
            type: 'error'
          });
        }
      }
    });
  };

  return (
    <div className="space-y-8 pb-12 font-sans">
      {/* Toast Notification */}
      {actionMessage && (
        <div className="fixed bottom-6 right-6 z-[200] max-w-md bg-emerald-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-emerald-700 flex items-center gap-2 text-xs font-bold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Header and Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 font-outfit">Product Catalogs & Distributors</h1>
          <p className="text-xs text-slate-500 mt-1">
            Review user contributions, approve products & Pan-India distributors, or add verified entries directly.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setCreateProductOpen(true)}
            className="flex-1 sm:flex-none px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>Add Product</span>
          </button>
          <button
            onClick={() => setCreateDistributorOpen(true)}
            className="flex-1 sm:flex-none px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>Add Distributor</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Products</span>
          <p className="text-2xl font-black text-slate-900">{stats?.totalProducts ?? 0}</p>
          <span className="text-[11px] text-emerald-700 font-semibold">{stats?.approvedProducts ?? 0} Approved</span>
        </div>

        <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200 shadow-sm space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>Pending Review</span>
          </span>
          <p className="text-2xl font-black text-amber-900">
            {(stats?.pendingProducts ?? 0) + (stats?.pendingDistributors ?? 0)}
          </p>
          <span className="text-[11px] text-amber-800 font-semibold">
            {stats?.pendingProducts ?? 0} Products | {stats?.pendingDistributors ?? 0} Distributors
          </span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Distributors</span>
          <p className="text-2xl font-black text-slate-900">{stats?.totalDistributors ?? 0}</p>
          <span className="text-[11px] text-teal-700 font-semibold">{stats?.approvedDistributors ?? 0} Verified</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pan-India Suppliers</span>
          <p className="text-2xl font-black text-slate-900">{stats?.panIndiaDistributors ?? 0}</p>
          <span className="text-[11px] text-sky-700 font-semibold">Supplying Nationwide</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-4 sm:gap-6 text-xs font-bold overflow-x-auto no-scrollbar whitespace-nowrap">
        <button
          onClick={() => setActiveTab('products')}
          className={`pb-3 transition-colors relative flex items-center gap-2 flex-shrink-0 ${
            activeTab === 'products' ? 'text-teal-700 border-b-2 border-teal-700' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Pill className="w-4 h-4" />
          <span>Product Catalogs</span>
          {stats?.pendingProducts > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-800 font-extrabold">
              {stats.pendingProducts} Pending
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('distributors')}
          className={`pb-3 transition-colors relative flex items-center gap-2 flex-shrink-0 ${
            activeTab === 'distributors' ? 'text-teal-700 border-b-2 border-teal-700' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Distributors Directory</span>
          {stats?.pendingDistributors > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-800 font-extrabold">
              {stats.pendingDistributors} Pending
            </span>
          )}
        </button>
      </div>

      {/* ================= TAB 1: PRODUCTS ================= */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          {/* Search & Filters */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Search product name, salt, manufacturer, submitter..."
                className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600"
              />
            </div>

            <select
              value={productStatusFilter}
              onChange={(e) => setProductStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-semibold focus:outline-none focus:border-teal-600"
            >
              <option value="All">All Statuses</option>
              <option value="pending_approval">Pending Approval</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>

            <select
              value={productCategoryFilter}
              onChange={(e) => setProductCategoryFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-semibold focus:outline-none focus:border-teal-600"
            >
              <option value="All">All Categories</option>
              {PHARMACY_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Table */}
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4">Product Name & Category</th>
                    <th className="px-6 py-4">Salt Composition</th>
                    <th className="px-6 py-4">Manufacturer</th>
                    <th className="px-6 py-4">Distributors</th>
                    <th className="px-6 py-4">Submitter</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingProducts ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-teal-700">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                        <span>Loading product catalogs...</span>
                      </td>
                    </tr>
                  ) : products.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                        No product catalogs found.
                      </td>
                    </tr>
                  ) : (
                    products.map((p) => (
                      <tr key={p._id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-6 py-4 max-w-[220px]">
                          <div className="font-bold text-slate-900 text-sm break-words break-all line-clamp-2" title={p.name}>
                            {p.name}
                          </div>
                          <div className="text-[11px] text-teal-700 font-semibold break-words">{p.category}</div>
                        </td>

                        <td className="px-6 py-4 max-w-xs">
                          <div className="font-semibold text-slate-800 break-words break-all line-clamp-2" title={p.saltComposition}>
                            {p.saltComposition}
                          </div>
                          <div className="text-[11px] text-slate-500 break-words">{p.dosageForm} ({p.packaging || '1 Unit'})</div>
                        </td>

                        <td className="px-6 py-4 font-semibold text-slate-700 max-w-[180px] break-words break-all">
                          {p.manufacturer}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-bold text-slate-800">
                            {p.distributors?.length || 0} Suppliers
                          </span>
                        </td>

                        <td className="px-6 py-4 max-w-[160px]">
                          {p.isDirectAdminEntry || p.submittedByModel === 'AdminUser' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-teal-50 text-teal-800 border border-teal-200">
                              <ShieldCheck className="w-3 h-3 text-teal-700" />
                              <span>Admin</span>
                            </span>
                          ) : (
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200">
                                <User className="w-3 h-3 text-slate-500" />
                                <span className="truncate max-w-[90px]">{p.submitterName || 'User'}</span>
                              </span>
                              {p.submitterContact && (
                                <div className="text-[10px] text-slate-500 truncate max-w-[140px]">{p.submitterContact}</div>
                              )}
                            </div>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full ${
                              p.status === 'approved'
                                ? 'bg-emerald-100 text-emerald-800'
                                : p.status === 'rejected'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {p.status === 'pending_approval' ? 'Pending' : p.status}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            {/* Approve Button */}
                            {p.status !== 'approved' && (
                              <button
                                onClick={() => handleApproveProduct(p)}
                                className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                                title="Approve & Publish"
                              >
                                <Check className="w-4 h-4 stroke-[3]" />
                              </button>
                            )}

                            {/* Reject Button */}
                            {p.status !== 'rejected' && (
                              <button
                                onClick={() =>
                                  setRejectingItem({
                                    type: 'product',
                                    id: p._id,
                                    title: p.name
                                  })
                                }
                                className="p-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
                                title="Reject / Send Feedback"
                              >
                                <X className="w-4 h-4 stroke-[3]" />
                              </button>
                            )}

                            {/* View Full Details */}
                            <button
                              onClick={() => setSelectedProductForDetails(p)}
                              className="p-1.5 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 transition-colors"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {/* Edit */}
                            <button
                              onClick={() => setEditingProduct({ ...p })}
                              className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
                              title="Edit Product"
                            >
                              <Edit className="w-4 h-4" />
                            </button>

                            {/* Delete */}
                            <button
                              onClick={() => handleDeleteProduct(p._id)}
                              className="p-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors"
                              title="Delete Permanently"
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

          {/* Products Pagination Controls */}
          {totalProductPages > 1 && (
            <div className="p-4 bg-white rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shadow-sm">
              <div className="text-slate-500 font-medium">
                Showing <strong className="text-slate-800">{totalProducts === 0 ? 0 : (productPage - 1) * productPageSize + 1}</strong> to{' '}
                <strong className="text-slate-800">{Math.min(productPage * productPageSize, totalProducts)}</strong> of{' '}
                <strong className="text-slate-800">{totalProducts}</strong> products
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setProductPage((p) => Math.max(1, p - 1))}
                  disabled={productPage === 1}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 font-bold bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Prev</span>
                </button>

                {Array.from({ length: totalProductPages }, (_, idx) => idx + 1)
                  .filter((p) => p === 1 || p === totalProductPages || Math.abs(p - productPage) <= 1)
                  .map((p, i, arr) => {
                    const prev = arr[i - 1];
                    return (
                      <React.Fragment key={p}>
                        {prev && p - prev > 1 && <span className="px-1 text-slate-400 font-mono">...</span>}
                        <button
                          onClick={() => setProductPage(p)}
                          className={`w-8 h-8 rounded-xl font-bold transition-all ${
                            productPage === p
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
                  onClick={() => setProductPage((p) => Math.min(totalProductPages, p + 1))}
                  disabled={productPage === totalProductPages}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 font-bold bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 2: DISTRIBUTORS ================= */}
      {activeTab === 'distributors' && (
        <div className="space-y-4">
          <div className="p-4 bg-white rounded-2xl border border-slate-200 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={distributorSearch}
                onChange={(e) => setDistributorSearch(e.target.value)}
                placeholder="Search firm name, contact person, mobile, DL, city..."
                className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600"
              />
            </div>

            <select
              value={distributorStatusFilter}
              onChange={(e) => setDistributorStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-semibold focus:outline-none focus:border-teal-600"
            >
              <option value="All">All Statuses</option>
              <option value="pending_approval">Pending Approval</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4">Firm & Contact</th>
                    <th className="px-6 py-4">Location</th>
                    <th className="px-6 py-4">Supply Coverage</th>
                    <th className="px-6 py-4">Drug License & GST</th>
                    <th className="px-6 py-4">Submitter</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingDistributors ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-teal-700">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                        <span>Loading distributors directory...</span>
                      </td>
                    </tr>
                  ) : distributors.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                        No distributors found.
                      </td>
                    </tr>
                  ) : (
                    distributors.map((d) => (
                      <tr key={d._id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-6 py-4 max-w-[220px]">
                          <div className="font-bold text-slate-900 text-sm break-words break-all line-clamp-2" title={d.firmName}>
                            {d.firmName}
                          </div>
                          <div className="text-xs text-slate-500 break-words break-all">
                            {d.contactPerson} ({d.mobile})
                          </div>
                        </td>

                        <td className="px-6 py-4 max-w-[200px]">
                          <div className="font-semibold text-slate-800 break-words break-all">
                            {d.city}, {d.state}
                          </div>
                          <div className="text-[11px] text-slate-500 break-words break-all line-clamp-2" title={d.officeAddress}>
                            {d.officeAddress}
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          {d.supplyCoverage?.panIndia ? (
                            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                              Pan-India
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                              {d.supplyCoverage?.statesCovered?.length || 1} States
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-4 text-[11px] font-mono text-slate-600 max-w-[140px] break-words break-all">
                          <div>DL: {d.drugLicenseNumber || 'N/A'}</div>
                          <div>GST: {d.gstNumber || 'N/A'}</div>
                        </td>

                        <td className="px-6 py-4 max-w-[150px]">
                          {d.isDirectAdminEntry || d.submittedByModel === 'AdminUser' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-teal-50 text-teal-800 border border-teal-200">
                              <ShieldCheck className="w-3 h-3 text-teal-700" />
                              <span>Admin</span>
                            </span>
                          ) : (
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200">
                                <User className="w-3 h-3 text-slate-500" />
                                <span className="truncate max-w-[90px]">{d.submitterName || 'User'}</span>
                              </span>
                              {d.submitterContact && (
                                <div className="text-[10px] text-slate-500 truncate max-w-[130px]">{d.submitterContact}</div>
                              )}
                            </div>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full ${
                              d.status === 'approved'
                                ? 'bg-emerald-100 text-emerald-800'
                                : d.status === 'rejected'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {d.status === 'pending_approval' ? 'Pending' : d.status}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            {d.status !== 'approved' && (
                              <button
                                onClick={() => handleApproveDistributor(d)}
                                className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                                title="Approve & Verify"
                              >
                                <Check className="w-4 h-4 stroke-[3]" />
                              </button>
                            )}

                            {d.status !== 'rejected' && (
                              <button
                                onClick={() =>
                                  setRejectingItem({
                                    type: 'distributor',
                                    id: d._id,
                                    title: d.firmName
                                  })
                                }
                                className="p-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
                                title="Reject"
                              >
                                <X className="w-4 h-4 stroke-[3]" />
                              </button>
                            )}

                            <button
                              onClick={() => setSelectedDistributorForDetails(d)}
                              className="p-1.5 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 transition-colors"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => setEditingDistributor({ ...d })}
                              className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
                              title="Edit Distributor"
                            >
                              <Edit className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleDeleteDistributor(d._id)}
                              className="p-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors"
                              title="Delete"
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

          {/* Distributors Pagination Controls */}
          {totalDistributorPages > 1 && (
            <div className="p-4 bg-white rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shadow-sm">
              <div className="text-slate-500 font-medium">
                Showing <strong className="text-slate-800">{totalDistributors === 0 ? 0 : (distributorPage - 1) * distributorPageSize + 1}</strong> to{' '}
                <strong className="text-slate-800">{Math.min(distributorPage * distributorPageSize, totalDistributors)}</strong> of{' '}
                <strong className="text-slate-800">{totalDistributors}</strong> distributors
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setDistributorPage((p) => Math.max(1, p - 1))}
                  disabled={distributorPage === 1}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 font-bold bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Prev</span>
                </button>

                {Array.from({ length: totalDistributorPages }, (_, idx) => idx + 1)
                  .filter((p) => p === 1 || p === totalDistributorPages || Math.abs(p - distributorPage) <= 1)
                  .map((p, i, arr) => {
                    const prev = arr[i - 1];
                    return (
                      <React.Fragment key={p}>
                        {prev && p - prev > 1 && <span className="px-1 text-slate-400 font-mono">...</span>}
                        <button
                          onClick={() => setDistributorPage(p)}
                          className={`w-8 h-8 rounded-xl font-bold transition-all ${
                            distributorPage === p
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
                  onClick={() => setDistributorPage((p) => Math.min(totalDistributorPages, p + 1))}
                  disabled={distributorPage === totalDistributorPages}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 font-bold bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= MODAL: REJECT ITEM ================= */}
      {rejectingItem && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-white rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-start justify-between pb-3 border-b border-slate-200">
              <h4 className="font-bold text-slate-900 text-sm">
                Reject Listing: {rejectingItem.title}
              </h4>
              <button
                onClick={() => setRejectingItem(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmReject} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Rejection Reason / Guidance for User:
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Please provide accurate salt composition or valid drug license."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-rose-600"
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectingItem(null)}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-700 shadow-sm transition-colors"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: EDIT PRODUCT (ADMIN) ================= */}
      {editingProduct && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl p-6 sm:p-8 space-y-4 my-8 max-h-[90vh] overflow-y-auto shadow-2xl text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-black text-slate-900 text-base">Edit Product Catalog Entry</h3>
              <button onClick={() => setEditingProduct(null)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const numMrp = Number(editingProduct.mrp);
                if (isNaN(numMrp) || numMrp < 0 || numMrp > 500000) {
                  showModal({
                    title: 'Invalid MRP',
                    message: 'MRP must be a valid number between Rs. 0 and Rs. 5,00,000.',
                    type: 'error'
                  });
                  return;
                }
                try {
                  await catalogApi.put(`/admin/products/${editingProduct._id}`, {
                    ...editingProduct,
                    mrp: numMrp
                  });
                  showNotification('Product details updated successfully.');
                  setEditingProduct(null);
                  fetchAdminProducts();
                } catch (err) {
                  showModal({
                    title: 'Update Failed',
                    message: err.response?.data?.message || 'Failed to update product.',
                    type: 'error'
                  });
                }
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700">Product Name *</label>
                    <span className="text-[10px] text-slate-400 font-mono">{(editingProduct.name || '').length}/120</span>
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={120}
                    value={editingProduct.name || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700">Brand Name</label>
                    <span className="text-[10px] text-slate-400 font-mono">{(editingProduct.brandName || '').length}/80</span>
                  </div>
                  <input
                    type="text"
                    maxLength={80}
                    value={editingProduct.brandName || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, brandName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700">Manufacturer *</label>
                    <span className="text-[10px] text-slate-400 font-mono">{(editingProduct.manufacturer || '').length}/120</span>
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={120}
                    value={editingProduct.manufacturer || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, manufacturer: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Category</label>
                  <select
                    value={editingProduct.category || 'Allopathic'}
                    onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold"
                  >
                    {PHARMACY_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">Salt Composition *</label>
                  <span className="text-[10px] text-slate-400 font-mono">{(editingProduct.saltComposition || '').length}/300</span>
                </div>
                <textarea
                  rows={2}
                  required
                  maxLength={300}
                  value={editingProduct.saltComposition || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, saltComposition: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Dosage Form</label>
                  <select
                    value={editingProduct.dosageForm || 'Tablet'}
                    onChange={(e) => setEditingProduct({ ...editingProduct, dosageForm: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold"
                  >
                    {DOSAGE_FORMS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Packaging</label>
                  <input
                    type="text"
                    maxLength={60}
                    value={editingProduct.packaging || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, packaging: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">MRP (INR)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="500000"
                    value={editingProduct.mrp ?? 0}
                    onKeyDown={(e) => {
                      if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault();
                    }}
                    onChange={(e) => setEditingProduct({ ...editingProduct, mrp: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                <label className="flex items-center gap-2 font-bold cursor-pointer p-2 rounded-xl bg-slate-50 border border-slate-200">
                  <input
                    type="checkbox"
                    checked={Boolean(editingProduct.prescriptionRequired)}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, prescriptionRequired: e.target.checked })
                    }
                    className="rounded text-teal-600 w-4 h-4"
                  />
                  <span>Prescription Required (Rx)</span>
                </label>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Status</label>
                  <select
                    value={editingProduct.status || 'approved'}
                    onChange={(e) => setEditingProduct({ ...editingProduct, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold"
                  >
                    <option value="approved">Approved</option>
                    <option value="pending_approval">Pending Approval</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Admin Notes / Feedback</label>
                <input
                  type="text"
                  maxLength={500}
                  value={editingProduct.adminNotes || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, adminNotes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button type="submit" className="w-full sm:w-auto px-5 py-2 rounded-xl bg-teal-700 text-white font-bold hover:bg-teal-800 transition-colors">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: EDIT DISTRIBUTOR (ADMIN) ================= */}
      {editingDistributor && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl p-6 sm:p-8 space-y-4 my-8 max-h-[90vh] overflow-y-auto shadow-2xl text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-black text-slate-900 text-base">Edit Distributor Profile</h3>
              <button onClick={() => setEditingDistributor(null)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!/^[6-9]\d{9}$/.test(editingDistributor.mobile || '')) {
                  showModal({
                    title: 'Invalid Mobile Number',
                    message: 'Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.',
                    type: 'error'
                  });
                  return;
                }
                if (editingDistributor.whatsappNumber && !/^[6-9]\d{9}$/.test(editingDistributor.whatsappNumber)) {
                  showModal({
                    title: 'Invalid WhatsApp Number',
                    message: 'WhatsApp number must be a valid 10-digit Indian mobile number.',
                    type: 'error'
                  });
                  return;
                }
                if (editingDistributor.pincode && !/^\d{6}$/.test(editingDistributor.pincode)) {
                  showModal({
                    title: 'Invalid Pincode',
                    message: 'Pincode must be exactly 6 digits.',
                    type: 'error'
                  });
                  return;
                }
                try {
                  await catalogApi.put(`/admin/distributors/${editingDistributor._id}`, editingDistributor);
                  showNotification('Distributor profile updated.');
                  setEditingDistributor(null);
                  fetchAdminDistributors();
                } catch (err) {
                  showModal({
                    title: 'Update Failed',
                    message: err.response?.data?.message || 'Failed to update distributor.',
                    type: 'error'
                  });
                }
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700">Firm Name *</label>
                    <span className="text-[10px] text-slate-400 font-mono">{(editingDistributor.firmName || '').length}/120</span>
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={120}
                    value={editingDistributor.firmName || ''}
                    onChange={(e) => setEditingDistributor({ ...editingDistributor, firmName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700">Contact Person *</label>
                    <span className="text-[10px] text-slate-400 font-mono">{(editingDistributor.contactPerson || '').length}/80</span>
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={80}
                    value={editingDistributor.contactPerson || ''}
                    onChange={(e) => setEditingDistributor({ ...editingDistributor, contactPerson: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Mobile (10 digits) *</label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="10-digit Indian number"
                    value={editingDistributor.mobile || ''}
                    onChange={(e) =>
                      setEditingDistributor({
                        ...editingDistributor,
                        mobile: e.target.value.replace(/\D/g, '').slice(0, 10)
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">WhatsApp</label>
                  <input
                    type="tel"
                    maxLength={10}
                    placeholder="10-digit number"
                    value={editingDistributor.whatsappNumber || ''}
                    onChange={(e) =>
                      setEditingDistributor({
                        ...editingDistributor,
                        whatsappNumber: e.target.value.replace(/\D/g, '').slice(0, 10)
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">City *</label>
                  <input
                    type="text"
                    required
                    maxLength={60}
                    value={editingDistributor.city || ''}
                    onChange={(e) => setEditingDistributor({ ...editingDistributor, city: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">State *</label>
                  <select
                    value={editingDistributor.state || 'Uttar Pradesh'}
                    onChange={(e) => setEditingDistributor({ ...editingDistributor, state: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold"
                  >
                    {INDIAN_STATES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Pincode (6 digits)</label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="6 digits"
                    value={editingDistributor.pincode || ''}
                    onChange={(e) =>
                      setEditingDistributor({
                        ...editingDistributor,
                        pincode: e.target.value.replace(/\D/g, '').slice(0, 6)
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">Office Address *</label>
                  <span className="text-[10px] text-slate-400 font-mono">{(editingDistributor.officeAddress || '').length}/200</span>
                </div>
                <input
                  type="text"
                  required
                  maxLength={200}
                  value={editingDistributor.officeAddress || ''}
                  onChange={(e) => setEditingDistributor({ ...editingDistributor, officeAddress: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Drug License (DL)</label>
                  <input
                    type="text"
                    maxLength={60}
                    value={editingDistributor.drugLicenseNumber || ''}
                    onChange={(e) => setEditingDistributor({ ...editingDistributor, drugLicenseNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">GST Number</label>
                  <input
                    type="text"
                    maxLength={15}
                    value={editingDistributor.gstNumber || ''}
                    onChange={(e) =>
                      setEditingDistributor({ ...editingDistributor, gstNumber: e.target.value.toUpperCase() })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 block">Pan-India Coverage</span>
                  <span className="text-[11px] text-slate-500">Supplies nationwide across India</span>
                </div>
                <input
                  type="checkbox"
                  checked={Boolean(editingDistributor.supplyCoverage?.panIndia)}
                  onChange={(e) =>
                    setEditingDistributor({
                      ...editingDistributor,
                      supplyCoverage: {
                        ...editingDistributor.supplyCoverage,
                        panIndia: e.target.checked
                      }
                    })
                  }
                  className="rounded text-teal-600 w-4 h-4 cursor-pointer"
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingDistributor(null)}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button type="submit" className="w-full sm:w-auto px-5 py-2 rounded-xl bg-teal-700 text-white font-bold hover:bg-teal-800 transition-colors">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: CREATE PRODUCT DIRECTLY (ADMIN) ================= */}
      {createProductOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl p-6 sm:p-8 space-y-4 my-8 max-h-[90vh] overflow-y-auto shadow-2xl text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="font-black text-slate-900 text-base">Add Product (Direct Admin Entry)</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Entries added by admin are immediately approved and published to the public catalog.</p>
              </div>
              <button
                onClick={() => {
                  setCreateProductOpen(false);
                  setNewProductForm(initialNewProductForm);
                }}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                let parsedMrp = 0;
                if (newProductForm.mrp !== undefined && newProductForm.mrp !== null && newProductForm.mrp !== '') {
                  parsedMrp = Number(newProductForm.mrp);
                  if (isNaN(parsedMrp) || parsedMrp < 0 || parsedMrp > 500000) {
                    showModal({
                      title: 'Invalid MRP',
                      message: 'MRP must be a valid number between Rs. 0 and Rs. 5,00,000.',
                      type: 'error'
                    });
                    return;
                  }
                }

                try {
                  await catalogApi.post('/admin/products', {
                    ...newProductForm,
                    mrp: parsedMrp
                  });
                  showNotification('Product created and published directly.');
                  setCreateProductOpen(false);
                  setNewProductForm(initialNewProductForm);
                  fetchAdminProducts();
                  fetchStats();
                } catch (err) {
                  showModal({
                    title: 'Creation Failed',
                    message: err.response?.data?.message || 'Failed to create product.',
                    type: 'error'
                  });
                }
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700">Product Name *</label>
                    <span className="text-[10px] text-slate-400 font-mono">{(newProductForm.name || '').length}/120</span>
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={120}
                    placeholder="e.g. Augmentin 625 Duo"
                    value={newProductForm.name}
                    onChange={(e) => setNewProductForm({ ...newProductForm, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700">Brand Name</label>
                    <span className="text-[10px] text-slate-400 font-mono">{(newProductForm.brandName || '').length}/80</span>
                  </div>
                  <input
                    type="text"
                    maxLength={80}
                    placeholder="e.g. Augmentin"
                    value={newProductForm.brandName}
                    onChange={(e) => setNewProductForm({ ...newProductForm, brandName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700">Manufacturer *</label>
                    <span className="text-[10px] text-slate-400 font-mono">{(newProductForm.manufacturer || '').length}/120</span>
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={120}
                    placeholder="e.g. GlaxoSmithKline"
                    value={newProductForm.manufacturer}
                    onChange={(e) => setNewProductForm({ ...newProductForm, manufacturer: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Category *</label>
                  <select
                    value={newProductForm.category}
                    onChange={(e) => setNewProductForm({ ...newProductForm, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold focus:outline-none focus:border-teal-600"
                  >
                    {PHARMACY_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">Active Salt Composition *</label>
                  <span className="text-[10px] text-slate-400 font-mono">{(newProductForm.saltComposition || '').length}/300</span>
                </div>
                <textarea
                  rows={2}
                  required
                  maxLength={300}
                  placeholder="e.g. Amoxicillin (500mg) + Clavulanic Acid (125mg)"
                  value={newProductForm.saltComposition}
                  onChange={(e) => setNewProductForm({ ...newProductForm, saltComposition: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Dosage Form</label>
                  <select
                    value={newProductForm.dosageForm}
                    onChange={(e) => setNewProductForm({ ...newProductForm, dosageForm: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold focus:outline-none focus:border-teal-600"
                  >
                    {DOSAGE_FORMS.map((d) => (
                      <option key={d} value={d}>
                        {d}
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
                    value={newProductForm.packaging}
                    onChange={(e) => setNewProductForm({ ...newProductForm, packaging: e.target.value })}
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
                    value={newProductForm.mrp}
                    onKeyDown={(e) => {
                      if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault();
                    }}
                    onChange={(e) => setNewProductForm({ ...newProductForm, mrp: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 font-bold cursor-pointer p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <input
                  type="checkbox"
                  checked={newProductForm.prescriptionRequired}
                  onChange={(e) => setNewProductForm({ ...newProductForm, prescriptionRequired: e.target.checked })}
                  className="rounded text-teal-600 w-4 h-4 cursor-pointer"
                />
                <span>Prescription Required (Rx Drug)</span>
              </label>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setCreateProductOpen(false);
                    setNewProductForm(initialNewProductForm);
                  }}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button type="submit" className="w-full sm:w-auto px-5 py-2 rounded-xl bg-teal-700 text-white font-bold hover:bg-teal-800 transition-colors">
                  Publish Directly
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: CREATE DISTRIBUTOR DIRECTLY (ADMIN) ================= */}
      {createDistributorOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-hidden">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-xs animate-in fade-in zoom-in-95 duration-200">
            {/* Sticky Header Flush with Top (No gap) */}
            <div className="sticky top-0 z-20 bg-white px-6 py-4 sm:px-8 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="font-black text-slate-900 text-base">Add Distributor (Direct Admin Entry)</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Direct entries are immediately marked as approved and verified in the directory.</p>
              </div>
              <button
                onClick={() => {
                  setCreateDistributorOpen(false);
                  setNewDistributorForm(initialNewDistributorForm);
                }}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 flex-shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!/^[6-9]\d{9}$/.test(newDistributorForm.mobile)) {
                  showModal({
                    title: 'Invalid Mobile Number',
                    message: 'Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.',
                    type: 'error'
                  });
                  return;
                }
                if (newDistributorForm.whatsappNumber && !/^[6-9]\d{9}$/.test(newDistributorForm.whatsappNumber)) {
                  showModal({
                    title: 'Invalid WhatsApp Number',
                    message: 'WhatsApp number must be a valid 10-digit Indian mobile number.',
                    type: 'error'
                  });
                  return;
                }

                try {
                  await catalogApi.post('/admin/distributors', newDistributorForm);
                  showNotification('Distributor created and verified directly.');
                  setCreateDistributorOpen(false);
                  setNewDistributorForm(initialNewDistributorForm);
                  fetchAdminDistributors();
                  fetchStats();
                } catch (err) {
                  showModal({
                    title: 'Creation Failed',
                    message: err.response?.data?.message || 'Failed to create distributor.',
                    type: 'error'
                  });
                }
              }}
              className="flex-1 flex flex-col min-h-0 overflow-hidden"
            >
              {/* Scrollable Body */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-4 text-xs">
                {/* Location Search via Maps API */}
                <div className="p-3.5 bg-teal-50/60 rounded-2xl border border-teal-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-teal-900 flex items-center gap-1.5">
                      <Search className="w-3.5 h-3.5 text-teal-600" />
                      <span>Search Location via Map (Auto-fills Address, City, State & Pincode)</span>
                    </span>
                    {newDistributorForm.coordinates && newDistributorForm.coordinates[0] !== 0 && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        GPS Geocoded
                      </span>
                    )}
                  </div>
                  <LocationPicker
                    value={{
                      address: newDistributorForm.officeAddress,
                      city: newDistributorForm.city,
                      state: newDistributorForm.state,
                      pincode: newDistributorForm.pincode,
                      coordinates: newDistributorForm.coordinates || [0, 0]
                    }}
                    onChange={(loc) => {
                      setNewDistributorForm((prev) => ({
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
                      <label className="font-bold text-slate-700">Firm Name *</label>
                      <span className="text-[10px] text-slate-400 font-mono">{(newDistributorForm.firmName || '').length}/120</span>
                    </div>
                    <input
                      type="text"
                      required
                      maxLength={120}
                      placeholder="e.g. Apex Pharma Agency"
                      value={newDistributorForm.firmName}
                      onChange={(e) => setNewDistributorForm({ ...newDistributorForm, firmName: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-slate-700">Contact Person *</label>
                      <span className="text-[10px] text-slate-400 font-mono">{(newDistributorForm.contactPerson || '').length}/80</span>
                    </div>
                    <input
                      type="text"
                      required
                      maxLength={80}
                      placeholder="e.g. Rajesh Kumar"
                      value={newDistributorForm.contactPerson}
                      onChange={(e) => setNewDistributorForm({ ...newDistributorForm, contactPerson: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Mobile (10 digits) *</label>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      placeholder="10-digit Indian number"
                      value={newDistributorForm.mobile}
                      onChange={(e) =>
                        setNewDistributorForm({
                          ...newDistributorForm,
                          mobile: e.target.value.replace(/\D/g, '').slice(0, 10)
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">WhatsApp</label>
                    <input
                      type="tel"
                      maxLength={10}
                      placeholder="10-digit WhatsApp number"
                      value={newDistributorForm.whatsappNumber}
                      onChange={(e) =>
                        setNewDistributorForm({
                          ...newDistributorForm,
                          whatsappNumber: e.target.value.replace(/\D/g, '').slice(0, 10)
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">City *</label>
                    <input
                      type="text"
                      required
                      maxLength={60}
                      placeholder="e.g. Ghaziabad / Delhi"
                      value={newDistributorForm.city}
                      onChange={(e) => setNewDistributorForm({ ...newDistributorForm, city: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">State *</label>
                    <select
                      value={newDistributorForm.state}
                      onChange={(e) => setNewDistributorForm({ ...newDistributorForm, state: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold focus:outline-none focus:border-teal-600"
                    >
                      {INDIAN_STATES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Pincode</label>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="e.g. 201005"
                      value={newDistributorForm.pincode}
                      onChange={(e) =>
                        setNewDistributorForm({
                          ...newDistributorForm,
                          pincode: e.target.value.replace(/\D/g, '').slice(0, 6)
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700">Office / Warehouse Address *</label>
                    <span className="text-[10px] text-slate-400 font-mono">{(newDistributorForm.officeAddress || '').length}/200</span>
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={200}
                    placeholder="e.g. Shop No. 14, Commercial Complex, Shalimar Garden"
                    value={newDistributorForm.officeAddress}
                    onChange={(e) => setNewDistributorForm({ ...newDistributorForm, officeAddress: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Drug License (DL)</label>
                    <input
                      type="text"
                      maxLength={60}
                      placeholder="e.g. DL-20B/21B-12345"
                      value={newDistributorForm.drugLicenseNumber}
                      onChange={(e) =>
                        setNewDistributorForm({ ...newDistributorForm, drugLicenseNumber: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">GST Number</label>
                    <input
                      type="text"
                      maxLength={15}
                      placeholder="15-digit GSTIN"
                      value={newDistributorForm.gstNumber}
                      onChange={(e) =>
                        setNewDistributorForm({ ...newDistributorForm, gstNumber: e.target.value.toUpperCase() })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2 font-bold cursor-pointer p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <input
                    type="checkbox"
                    checked={newDistributorForm.panIndia}
                    onChange={(e) => setNewDistributorForm({ ...newDistributorForm, panIndia: e.target.checked })}
                    className="rounded text-teal-600 w-4 h-4 cursor-pointer"
                  />
                  <span>Supplies Pan-India (All States)</span>
                </label>
              </div>

              {/* Sticky Footer */}
              <div className="sticky bottom-0 z-20 bg-slate-50 px-6 py-3.5 sm:px-8 border-t border-slate-200 flex flex-col-reverse sm:flex-row items-center justify-end gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setCreateDistributorOpen(false);
                    setNewDistributorForm(initialNewDistributorForm);
                  }}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-5 py-2 rounded-xl bg-teal-700 text-white font-bold hover:bg-teal-800 transition-all shadow-md shadow-teal-700/20"
                >
                  Save & Verify Directly
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: VIEW PRODUCT DETAILS (ADMIN) ================= */}
      {selectedProductForDetails && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-hidden">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-xs animate-in fade-in zoom-in-95 duration-200">
            {/* Sticky Header Flush with Top (No gap) & Posted By Badge */}
            <div className="sticky top-0 z-20 bg-white px-6 py-4 sm:px-8 border-b border-slate-200 flex items-start justify-between flex-shrink-0">
              <div className="space-y-1.5 pr-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                    {selectedProductForDetails.category}
                  </span>
                  <span
                    className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                      selectedProductForDetails.status === 'approved'
                        ? 'bg-emerald-100 text-emerald-800'
                        : selectedProductForDetails.status === 'rejected'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {selectedProductForDetails.status}
                  </span>

                  {/* Posted By Badge */}
                  {selectedProductForDetails.isDirectAdminEntry || selectedProductForDetails.submittedByModel === 'AdminUser' ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-teal-100/80 text-teal-900 border border-teal-300">
                      <ShieldCheck className="w-3 h-3 text-teal-700" />
                      <span>Posted by Admin</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200">
                      <User className="w-3 h-3 text-slate-500" />
                      <span>Posted by {selectedProductForDetails.submitterName || 'Registered User'}</span>
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-black text-slate-900 font-outfit break-words break-all">
                  {selectedProductForDetails.name}
                </h3>
                {selectedProductForDetails.brandName && (
                  <p className="text-xs text-slate-500 font-semibold break-words break-all">
                    Brand: {selectedProductForDetails.brandName}
                  </p>
                )}
              </div>
              <button
                onClick={() => setSelectedProductForDetails(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 flex-shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-5 text-xs">
              {/* Salt Formulation */}
              <div className="p-3.5 bg-teal-50 rounded-2xl border border-teal-100 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 block">
                  Active Salt Composition
                </span>
                <p className="font-bold text-slate-900 break-words break-all leading-relaxed">
                  {selectedProductForDetails.saltComposition}
                </p>
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl space-y-0.5">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Manufacturer</span>
                  <p className="font-bold text-slate-900 break-words break-all">{selectedProductForDetails.manufacturer}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl space-y-0.5">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Dosage Form</span>
                  <p className="font-bold text-slate-900">{selectedProductForDetails.dosageForm}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl space-y-0.5">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Packaging</span>
                  <p className="font-bold text-slate-900 break-words break-all">{selectedProductForDetails.packaging || 'Standard'}</p>
                </div>
                {selectedProductForDetails.mrp > 0 && (
                  <div className="p-3 bg-slate-50 rounded-xl space-y-0.5">
                    <span className="text-[10px] font-bold uppercase text-slate-400">MRP</span>
                    <p className="font-bold text-emerald-700">Rs. {Number(selectedProductForDetails.mrp).toFixed(2)}</p>
                  </div>
                )}
                {selectedProductForDetails.strength && (
                  <div className="p-3 bg-slate-50 rounded-xl space-y-0.5">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Strength</span>
                    <p className="font-bold text-slate-900 break-words break-all">{selectedProductForDetails.strength}</p>
                  </div>
                )}
                <div className="p-3 bg-slate-50 rounded-xl space-y-0.5">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Prescription Rx</span>
                  <p className="font-bold text-slate-900">
                    {selectedProductForDetails.prescriptionRequired ? 'Required (Rx)' : 'Non-Rx / OTC'}
                  </p>
                </div>
              </div>

              {/* Submitter Details */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-slate-700 space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Submitted By</span>
                <p className="font-bold text-slate-900 break-words break-all">
                  {selectedProductForDetails.isDirectAdminEntry ? 'Admin (Direct Entry)' : selectedProductForDetails.submitterName || 'User Contribution'}
                </p>
                {selectedProductForDetails.submitterContact && (
                  <p className="text-[11px] text-slate-500 break-words break-all">
                    Contact: {selectedProductForDetails.submitterContact}
                  </p>
                )}
              </div>
            </div>

            {/* Sticky Footer */}
            <div className="sticky bottom-0 z-20 bg-slate-50 px-6 py-3.5 sm:px-8 border-t border-slate-200 flex justify-end gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => setSelectedProductForDetails(null)}
                className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: VIEW DISTRIBUTOR DETAILS (ADMIN) ================= */}
      {selectedDistributorForDetails && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-hidden">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-xs animate-in fade-in zoom-in-95 duration-200">
            {/* Sticky Header Flush with Top (No gap) & Posted By Badge */}
            <div className="sticky top-0 z-20 bg-white px-6 py-4 sm:px-8 border-b border-slate-200 flex items-start justify-between flex-shrink-0">
              <div className="space-y-1.5 pr-4">
                <div className="flex flex-wrap items-center gap-2">
                  {selectedDistributorForDetails.supplyCoverage?.panIndia ? (
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Pan-India Supplier
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      Regional ({selectedDistributorForDetails.state})
                    </span>
                  )}
                  <span
                    className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                      selectedDistributorForDetails.status === 'approved'
                        ? 'bg-emerald-100 text-emerald-800'
                        : selectedDistributorForDetails.status === 'rejected'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {selectedDistributorForDetails.status}
                  </span>

                  {/* Posted By Badge */}
                  {selectedDistributorForDetails.isDirectAdminEntry || selectedDistributorForDetails.submittedByModel === 'AdminUser' ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-teal-100/80 text-teal-900 border border-teal-300">
                      <ShieldCheck className="w-3 h-3 text-teal-700" />
                      <span>Posted by Admin</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200">
                      <User className="w-3 h-3 text-slate-500" />
                      <span>Posted by {selectedDistributorForDetails.submitterName || 'User Contribution'}</span>
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-black text-slate-900 font-outfit break-words break-all">
                  {selectedDistributorForDetails.firmName}
                </h3>
                <p className="text-xs text-slate-500 font-semibold break-words break-all">
                  Contact Person: {selectedDistributorForDetails.contactPerson}
                </p>
              </div>
              <button
                onClick={() => setSelectedDistributorForDetails(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 flex-shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-5 text-xs">
              {/* Address banner */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Office / Warehouse Location
                </span>
                <p className="font-semibold text-slate-800 break-words break-all leading-relaxed">
                  {selectedDistributorForDetails.officeAddress}, {selectedDistributorForDetails.city},{' '}
                  {selectedDistributorForDetails.state}{' '}
                  {selectedDistributorForDetails.pincode ? `- ${selectedDistributorForDetails.pincode}` : ''}
                </p>
              </div>

              {/* Contact details */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl space-y-0.5">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Mobile Number</span>
                  <p className="font-bold text-slate-900 font-mono">{selectedDistributorForDetails.mobile}</p>
                </div>
                {selectedDistributorForDetails.whatsappNumber && (
                  <div className="p-3 bg-slate-50 rounded-xl space-y-0.5">
                    <span className="text-[10px] font-bold uppercase text-slate-400">WhatsApp</span>
                    <p className="font-bold text-slate-900 font-mono">{selectedDistributorForDetails.whatsappNumber}</p>
                  </div>
                )}
                {selectedDistributorForDetails.drugLicenseNumber && (
                  <div className="p-3 bg-slate-50 rounded-xl space-y-0.5">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Drug License</span>
                    <p className="font-bold text-slate-900 font-mono break-words break-all">
                      {selectedDistributorForDetails.drugLicenseNumber}
                    </p>
                  </div>
                )}
                {selectedDistributorForDetails.gstNumber && (
                  <div className="p-3 bg-slate-50 rounded-xl space-y-0.5">
                    <span className="text-[10px] font-bold uppercase text-slate-400">GSTIN</span>
                    <p className="font-bold text-slate-900 font-mono break-words break-all">
                      {selectedDistributorForDetails.gstNumber}
                    </p>
                  </div>
                )}
                {selectedDistributorForDetails.minimumOrderValue > 0 && (
                  <div className="p-3 bg-slate-50 rounded-xl space-y-0.5">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Min Order Value</span>
                    <p className="font-bold text-emerald-700">
                      Rs. {Number(selectedDistributorForDetails.minimumOrderValue).toLocaleString('en-IN')}
                    </p>
                  </div>
                )}
                {selectedDistributorForDetails.deliveryLeadTime && (
                  <div className="p-3 bg-slate-50 rounded-xl space-y-0.5">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Lead Time</span>
                    <p className="font-bold text-slate-900">{selectedDistributorForDetails.deliveryLeadTime}</p>
                  </div>
                )}
              </div>

              {/* Submitter */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-slate-700 space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Submitted By</span>
                <p className="font-bold text-slate-900 break-words break-all">
                  {selectedDistributorForDetails.isDirectAdminEntry ? 'Admin (Direct Entry)' : selectedDistributorForDetails.submitterName || 'User Contribution'}
                </p>
              </div>
            </div>

            {/* Sticky Footer */}
            <div className="sticky bottom-0 z-20 bg-slate-50 px-6 py-3.5 sm:px-8 border-t border-slate-200 flex justify-end gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => setSelectedDistributorForDetails(null)}
                className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
