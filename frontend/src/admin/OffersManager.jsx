import { useState, useEffect } from 'react';
import api from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Trash2, Edit2, Search, Gift, Users, Eye, 
  CheckCircle2, XCircle, PlusCircle, MinusCircle, 
  Settings, Mail, FileText, ChevronRight, ArrowLeft, HelpCircle,
  FileSpreadsheet, Sparkles, RefreshCw
} from 'lucide-react';
import AssetPicker from './components/AssetPicker';
import FollowUpModal from './components/FollowUpModal';
import { useModal } from '../context/ModalContext';

export default function OffersManager() {
  const [offers, setOffers] = useState([]);
  const [leads, setLeads] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingPurchases, setLoadingPurchases] = useState(false);
  const [activeTab, setActiveTab] = useState('list'); // 'list', 'create', 'leads', 'purchases'
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [statusFilter, setStatusFilter] = useState('');
  const [counts, setCounts] = useState({ total: 0, pending: 0, completed: 0 });
  const [activeFollowUp, setActiveFollowUp] = useState(null);
  const { showModal } = useModal();

  useEffect(() => {
    fetchOffers();
    if (activeTab === 'leads') fetchLeads();
    if (activeTab === 'purchases') fetchPurchases();
  }, [activeTab, pagination.page, statusFilter]);

  const fetchOffers = async () => {
    try {
      const resp = await api.get('/offers');
      setOffers(resp.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchLeads = async (offerId = '') => {
    try {
      const url = offerId 
        ? `/offers/leads/${offerId}`
        : '/offers/leads';
      const resp = await api.get(url, {
        params: { page: pagination.page, limit: 10, status: statusFilter }
      });
      setLeads(resp.data.data);
      setPagination({ page: resp.data.page, totalPages: resp.data.totalPages });
      setCounts({
        total: resp.data.total,
        pending: resp.data.pendingCount,
        completed: resp.data.completedCount
      });
    } catch (err) { console.error(err); }
  };

  const fetchPurchases = async () => {
    setLoadingPurchases(true);
    try {
      const resp = await api.get('/medicine-bundle/purchases');
      setPurchases(resp.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPurchases(false);
    }
  };

  const handleUpdateFollowUp = async (id, status, notes) => {
    try {
      const resp = await api.patch(`/offers/leads/${id}/followup`, {
        followUpStatus: status,
        followUpNotes: notes
      });
      setLeads(prev => prev.map(l => l._id === id ? resp.data : l));
      fetchLeads();
    } catch (err) {
      showModal({ title: 'Error', message: 'Failed to update follow-up', type: 'error' });
    }
  };

  const toggleStatus = async (offer) => {
    try {
      await api.put(`/offers/${offer._id}`, 
        { isActive: !offer.isActive }
      );
      fetchOffers();
    } catch (err) { showModal({ title: 'Error', message: 'Failed to update status', type: 'error' }); }
  };

  const deleteOffer = async (id) => {
    showModal({
      title: 'Confirm Delete', 
      message: 'Are you sure you want to delete this offer and all associated registration data? This action cannot be undone.', 
      type: 'confirm',
      onConfirm: async () => {
        try {
          await api.delete(`/offers/${id}`);
          fetchOffers();
        } catch (err) { showModal({ title: 'Error', message: 'Delete failed', type: 'error' }); }
      }
    });
  };

  const saveOffer = async (offerData) => {
    try {
      if (selectedOffer) {
        await api.put(`/offers/${selectedOffer._id}`, offerData);
      } else {
        await api.post('/offers', offerData);
      }
      fetchOffers();
      setActiveTab('list');
      setSelectedOffer(null);
    } catch (err) { showModal({ title: 'Error', message: 'Save failed', type: 'error' }); }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <RefreshCw className="w-10 h-10 text-teal-600 animate-spin" />
      <p className="text-xs font-bold text-slate-550 uppercase tracking-widest">Loading Offers...</p>
    </div>
  );

  return (
    <div className="space-y-8">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold font-outfit mb-1 lg:mb-2">Offers & <span className="text-teal-600 italic">Promotions</span></h1>
          <p className="text-sm lg:text-base text-slate-500 font-medium">Manage launch offers, services, and lead generation forms.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 lg:gap-4">
          <button 
            onClick={() => { setActiveTab('leads'); fetchLeads(); }}
            className={`flex items-center justify-center gap-2 px-6 py-3.5 lg:py-3 rounded-2xl font-bold transition-all border ${activeTab === 'leads' ? 'bg-teal-50 text-teal-700 border-teal-200/60 shadow-sm' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900'}`}
          >
            <Users className="w-4 h-4 text-slate-400" /> <span>View Leads</span>
          </button>
          <button 
            onClick={() => { setActiveTab('purchases'); fetchPurchases(); }}
            className={`flex items-center justify-center gap-2 px-6 py-3.5 lg:py-3 rounded-2xl font-bold transition-all border ${activeTab === 'purchases' ? 'bg-teal-50 text-teal-700 border-teal-200/60 shadow-sm' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900'}`}
          >
            <FileSpreadsheet className="w-4 h-4 text-slate-400" /> <span>Bundle Sales</span>
          </button>
          <button 
            onClick={() => { setSelectedOffer(null); setActiveTab('create'); }}
            className="flex items-center justify-center gap-2 px-6 py-3.5 lg:py-3 rounded-2xl bg-teal-500 text-slate-900 font-black uppercase text-[10px] tracking-widest hover:scale-105 transition-all shadow-lg shadow-teal-500/20"
          >
            <Plus className="w-4 h-4" /> Create New Offer
          </button>
        </div>
      </header>

      {activeTab === 'list' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {offers.map(offer => (
            <OfferCard 
              key={offer._id} 
              offer={offer} 
              onToggle={() => toggleStatus(offer)}
              onDelete={() => deleteOffer(offer._id)}
              onEdit={() => { setSelectedOffer(offer); setActiveTab('create'); }}
              onViewLeads={() => { fetchLeads(offer._id); setActiveTab('leads'); }}
            />
          ))}
          {offers.length === 0 && (
            <div className="col-span-full py-20 text-center bg-white border border-slate-200 rounded-[2.5rem] shadow-sm">
              <Gift className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No active promotions found</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'create' && (
        <OfferEditor 
          offer={selectedOffer} 
          onBack={() => setActiveTab('list')} 
          onSaved={() => { fetchOffers(); setActiveTab('list'); }}
        />
      )}

      {activeTab === 'leads' && (
        <>
          <LeadsViewer 
            leads={leads} 
            counts={counts}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            pagination={pagination}
            setPagination={setPagination}
            onOpenFollowUp={(lead) => setActiveFollowUp(lead)}
            onUpdateFollowUp={handleUpdateFollowUp}
            onBack={() => { setActiveTab('list'); setStatusFilter(''); setPagination({page: 1, totalPages: 1}); }} 
          />
          <FollowUpModal 
            isOpen={!!activeFollowUp}
            onClose={() => setActiveFollowUp(null)}
            initialNotes={activeFollowUp?.followUpNotes}
            onSave={(notes) => handleUpdateFollowUp(activeFollowUp._id, 'completed', notes)}
            title={`Follow-up: ${activeFollowUp?.registrationId}`}
          />
        </>
      )}

      {activeTab === 'purchases' && (
        <PurchasesViewer 
          purchases={purchases}
          loading={loadingPurchases}
          onBack={() => setActiveTab('list')}
        />
      )}
    </div>
  );
}

function OfferCard({ offer, onToggle, onDelete, onEdit, onViewLeads }) {
  return (
    <motion.div layout className="bg-white rounded-[2.5rem] overflow-hidden border border-slate-200 shadow-sm p-6 space-y-4 flex flex-col h-full hover:border-teal-500/30 transition-all duration-300">
      <div className="relative h-44 rounded-[2rem] overflow-hidden bg-slate-100 shrink-0">
        <img src={offer.image || '/placeholder-offer.png'} className="w-full h-full object-cover" />
        <div className="absolute top-4 right-4">
          <button 
            onClick={onToggle}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
              offer.isActive ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
            }`}
          >
            {offer.isActive ? 'Active' : 'Paused'}
          </button>
        </div>
      </div>
      <div className="flex-1">
        <h3 className="text-xl font-bold font-outfit mb-2 line-clamp-1 text-slate-900">{offer.title}</h3>
        <p className="text-slate-500 text-sm line-clamp-3 leading-relaxed font-bold">{offer.description}</p>
      </div>
      <div className="flex gap-2 pt-4 border-t border-slate-100">
        <button onClick={onEdit} className="p-3.5 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-200 transition-all text-slate-500 hover:text-slate-800" title="Edit Offer"><Edit2 className="w-4 h-4" /></button>
        <button onClick={onViewLeads} className="flex-1 flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-2xl font-bold text-sm transition-all"><Users className="w-4 h-4 text-slate-400" /> Leads</button>
        <button onClick={onDelete} className="p-3.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-2xl transition-all" title="Delete"><Trash2 className="w-4 h-4" /></button>
      </div>
    </motion.div>
  );
}

function OfferEditor({ offer, onBack, onSaved }) {
  const [formData, setFormData] = useState(offer || {
    title: '',
    description: '',
    image: '',
    isActive: true,
    formEnabled: false,
    emailConfirmation: false,
    formFields: []
  });

  const handleAddField = () => {
    setFormData({
      ...formData,
      formFields: [...formData.formFields, { name: '', label: '', type: 'text', required: true, isUnique: false }]
    });
  };

  const removeField = (index) => {
    const newFields = formData.formFields.filter((_, i) => i !== index);
    setFormData({ ...formData, formFields: newFields });
  };

  const updateField = (index, key, value) => {
    const newFields = [...formData.formFields];
    newFields[index][key] = value;
    if (key === 'label') newFields[index].name = value.toLowerCase().replace(/\s+/g, '_');
    setFormData({ ...formData, formFields: newFields });
  };

  const handleSave = async () => {
    try {
      const method = offer ? 'put' : 'post';
      const url = offer ? `/offers/${offer._id}` : '/offers';
      await api[method](url, formData);
      onSaved();
    } catch (err) { console.error(err); }
  };

  return (
    <div className="space-y-6 lg:space-y-8 max-w-5xl mx-auto">
      <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-all font-bold">
        <ArrowLeft className="w-4 h-4" /> Back to List
      </button>

      <div className="bg-white border border-slate-200 p-6 lg:p-12 rounded-[2.5rem] lg:rounded-[3.5rem] shadow-md space-y-8 lg:space-y-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          <div className="space-y-6 lg:space-y-8">
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-3 tracking-widest ml-2">Offer Title</label>
              <input 
                value={formData.title} 
                onChange={e => setFormData({...formData, title: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 lg:p-5 focus:outline-none focus:bg-white focus:border-teal-500 transition-all text-slate-800 text-sm lg:text-base font-bold"
                placeholder="e.g. 50-50 Launch Offer"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-3 tracking-widest ml-2">Offer Description</label>
              <textarea 
                value={formData.description} 
                onChange={e => setFormData({...formData, description: e.target.value})}
                rows={6}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 lg:p-5 focus:outline-none focus:bg-white focus:border-teal-500 transition-all resize-none text-slate-800 text-sm lg:text-base font-bold leading-relaxed"
                placeholder="Describe the value proposition..."
              />
            </div>
          </div>
          <div className="space-y-8">
            <AssetPicker 
              label="Banner Image" 
              currentImage={formData.image} 
              onSelect={url => setFormData({...formData, image: url})} 
            />
            <div className="grid grid-cols-2 gap-4 lg:gap-6">
              <ToggleSection 
                label="Lead Form" 
                enabled={formData.formEnabled} 
                onChange={v => setFormData({...formData, formEnabled: v})} 
              />
              <ToggleSection 
                label="Auto Email" 
                enabled={formData.emailConfirmation} 
                onChange={v => setFormData({...formData, emailConfirmation: v})} 
              />
            </div>
          </div>
        </div>

        {formData.formEnabled && (
          <div className="pt-8 lg:pt-12 border-t border-slate-100 space-y-6 lg:space-y-10">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-xl lg:text-2xl font-bold font-outfit text-slate-900">Lead Data <span className="text-teal-650 italic">Capture</span></h3>
                <p className="text-xs lg:text-sm text-slate-500 font-bold mt-1">Define fields for your registration form.</p>
              </div>
              <button 
                onClick={handleAddField}
                className="flex items-center gap-2 px-5 py-3 bg-teal-50 text-teal-700 border border-teal-200/60 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-teal-100 transition-all"
              >
                <PlusCircle className="w-4 h-4" /> Add Data Point
              </button>
            </div>

            <div className="space-y-4 lg:space-y-6">
              {formData.formFields.map((field, idx) => (
                <div key={idx} className="flex flex-col lg:flex-row gap-4 lg:items-end bg-slate-50 border border-slate-200/60 p-5 lg:p-6 rounded-[2rem] relative group">
                  <div className="flex-1">
                    <label className="text-[9px] uppercase font-black text-slate-500 mb-2 block tracking-widest ml-2">Field Label</label>
                    <input 
                      value={field.label} 
                      onChange={e => updateField(idx, 'label', e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-500 font-bold text-slate-800 transition-all"
                      placeholder="e.g. Phone Number"
                    />
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1 lg:w-40">
                      <label className="text-[9px] uppercase font-black text-slate-500 mb-2 block tracking-widest ml-2">Type</label>
                      <select 
                        value={field.type} 
                        onChange={e => updateField(idx, 'type', e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-500 font-bold text-slate-800 transition-all"
                      >
                        <option value="text">Text</option>
                        <option value="number">Number</option>
                        <option value="email">Email</option>
                        <option value="textarea">Long Text</option>
                        <option value="file">Document/Image</option>
                      </select>
                    </div>
                    <div className="w-20 shrink-0">
                      <label className="text-[9px] uppercase font-black text-slate-500 mb-2 block tracking-widest text-center">Unique</label>
                      <button 
                        onClick={() => updateField(idx, 'isUnique', !field.isUnique)}
                        className={`w-full py-3 rounded-xl border transition-all flex items-center justify-center ${field.isUnique ? 'bg-teal-50 border-teal-200 text-teal-700' : 'bg-white border-slate-200 text-slate-400'}`}
                      >
                        {field.isUnique ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4 opacity-30" />}
                      </button>
                    </div>
                  </div>
                  <button 
                    onClick={() => removeField(idx)} 
                    className="absolute -top-2 -right-2 lg:static lg:mb-1.5 p-2 bg-red-50 lg:bg-transparent text-red-650 hover:bg-red-100 rounded-full lg:rounded-xl transition-all"
                  >
                    <MinusCircle className="w-5 h-5" />
                  </button>
                </div>
              ))}
              {formData.formFields.length === 0 && (
                <div className="text-center py-10 lg:py-16 border-2 border-dashed border-slate-200 rounded-[2rem] bg-slate-50/50">
                  <p className="text-slate-500 font-bold text-xs lg:text-sm uppercase tracking-widest">No custom fields added yet</p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex justify-end lg:pt-8">
          <button 
            onClick={handleSave}
            className="w-full sm:w-auto px-10 py-5 lg:py-4 bg-teal-500 text-slate-900 font-black uppercase tracking-[0.2em] text-[11px] lg:text-xs rounded-2xl lg:rounded-[1.5rem] hover:scale-105 active:scale-95 transition-all shadow-lg shadow-teal-500/20"
          >
            Confirm & Save Offer
          </button>
        </div>
      </div>
    </div>
  );
}

function ToggleSection({ label, enabled, onChange }) {
  return (
    <button 
      onClick={() => onChange(!enabled)}
      className={`flex-1 p-4 lg:p-5 rounded-2xl lg:rounded-[1.5rem] border flex items-center justify-between transition-all ${enabled ? 'bg-teal-50 border-teal-200 text-teal-700 shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
    >
      <span className="text-[10px] lg:text-[11px] font-black uppercase tracking-widest">{label}</span>
      {enabled ? <CheckCircle2 className="w-4 h-4 lg:w-5 lg:h-5 text-teal-650" /> : <XCircle className="w-4 h-4 lg:w-5 lg:h-5 opacity-35" />}
    </button>
  );
}

function LeadsViewer({ leads, counts, statusFilter, setStatusFilter, pagination, setPagination, onOpenFollowUp, onUpdateFollowUp, onBack }) {
  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-all font-bold">
          <ArrowLeft className="w-4 h-4" /> Back to Offers
        </button>

        <div className="flex flex-wrap gap-2 lg:gap-3">
          <button 
            onClick={() => { setStatusFilter(''); setPagination(p => ({...p, page: 1})); }}
            className={`flex-1 lg:flex-none px-5 py-3 lg:py-3.5 rounded-xl lg:rounded-2xl font-bold text-[9px] lg:text-[10px] uppercase tracking-widest transition-all border whitespace-nowrap ${!statusFilter ? 'bg-teal-500 text-slate-900 border-teal-500' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
          >
            All ({counts.total})
          </button>
          <button 
            onClick={() => { setStatusFilter('pending'); setPagination(p => ({...p, page: 1})); }}
            className={`flex-1 lg:flex-none px-5 py-3 lg:py-3.5 rounded-xl lg:rounded-2xl font-bold text-[9px] lg:text-[10px] uppercase tracking-widest transition-all border whitespace-nowrap ${statusFilter === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
          >
            Pending ({counts.pending})
          </button>
          <button 
            onClick={() => { setStatusFilter('completed'); setPagination(p => ({...p, page: 1})); }}
            className={`flex-1 lg:flex-none px-5 py-3 lg:py-3.5 rounded-xl lg:rounded-2xl font-bold text-[9px] lg:text-[10px] uppercase tracking-widest transition-all border whitespace-nowrap ${statusFilter === 'completed' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
          >
            Followed ({counts.completed})
          </button>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 uppercase text-[10px] font-black tracking-widest border-b border-slate-200/85">
                <th className="px-8 py-6">Reg ID / Status</th>
                <th className="px-8 py-6">Offer Details</th>
                <th className="px-8 py-6">Lead Data</th>
                <th className="px-8 py-6">Follow-up Notes</th>
                <th className="px-8 py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {leads.map(lead => (
                <tr key={lead._id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-6 align-top">
                    <div className="font-mono font-bold text-teal-650 mb-2">{lead.registrationId}</div>
                    <div className="flex flex-col gap-2">
                      <span className={`w-fit text-[8px] uppercase font-black py-1 px-2 rounded-lg ${
                        lead.followUpStatus === 'completed' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-yellow-50 text-yellow-700 border border-yellow-250/60'
                      }`}>
                        {lead.followUpStatus || 'pending'}
                      </span>
                      <span className="text-[10px] text-slate-500 font-bold">{new Date(lead.createdAt).toLocaleDateString()}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 align-top font-bold max-w-[200px] text-slate-850">
                    <div className="truncate">{lead.offerId?.title}</div>
                    <div className="text-[10px] text-slate-500 font-normal mt-1 italic">Exclusive Offer Lead</div>
                  </td>
                  <td className="px-8 py-6 align-top">
                    <div className="text-xs space-y-2">
                      {Object.entries(lead.formData).map(([k, v]) => {
                        const isUrl = typeof v === 'string' && v.startsWith('http');
                        return (
                          <div key={k} className="flex flex-col">
                            <span className="text-[10px] font-black uppercase text-slate-550 mb-0.5">{k.replace('_', ' ')}</span> 
                            {isUrl ? (
                              <a href={v} target="_blank" rel="noreferrer" className="text-teal-600 hover:underline flex items-center gap-1 font-bold">
                                <FileText className="w-3 h-3" /> View Document
                              </a>
                            ) : (
                              <span className="text-slate-800 font-medium">{v}</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </td>
                  <td className="px-8 py-6 align-top min-w-[300px]">
                    <div 
                      onClick={() => onOpenFollowUp(lead)}
                      className="w-full bg-slate-50 border border-slate-200 hover:border-teal-500/50 rounded-xl p-4 text-xs text-slate-700 cursor-pointer min-h-[100px] transition-all font-medium leading-relaxed"
                    >
                      {lead.followUpNotes ? (
                        <p className="line-clamp-4">{lead.followUpNotes}</p>
                      ) : (
                        <span className="opacity-40 italic">No notes... Click to add.</span>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-6 align-top text-right">
                    <button 
                      onClick={() => {
                        if (lead.followUpStatus === 'completed') {
                          onUpdateFollowUp(lead._id, 'pending', lead.followUpNotes);
                        } else {
                          onOpenFollowUp(lead);
                        }
                      }}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                        lead.followUpStatus === 'completed' 
                          ? 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100/80 border border-yellow-200' 
                          : 'bg-green-50 text-green-700 hover:bg-green-100/80 border border-green-200'
                      }`}
                    >
                      {lead.followUpStatus === 'completed' ? 'Reset' : 'Mark Done'}
                    </button>
                  </td>
                </tr>
              ))}
              {leads.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-20 text-slate-500 font-bold uppercase tracking-widest">No promotion leads found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-4">
        {leads.map(lead => (
          <div key={lead._id} className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-mono font-bold text-teal-650 mb-1">{lead.registrationId}</div>
                <div className="text-[10px] text-slate-500 font-bold uppercase">{new Date(lead.createdAt).toLocaleDateString()}</div>
              </div>
              <span className={`text-[8px] uppercase font-black py-1 px-2 rounded-md ${
                lead.followUpStatus === 'completed' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'
              }`}>
                {lead.followUpStatus || 'pending'}
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-[9px] font-black uppercase text-slate-500 block mb-1">Offer Applied</span>
                <p className="font-bold text-sm text-slate-800">{lead.offerId?.title}</p>
              </div>
              
              <div className="bg-slate-50 border border-slate-200/50 rounded-2xl p-4 space-y-4">
                {Object.entries(lead.formData).map(([k, v]) => (
                  <div key={k}>
                    <span className="text-[9px] font-black uppercase text-slate-500 block mb-1">{k.replace('_', ' ')}</span>
                    {typeof v === 'string' && v.startsWith('http') ? (
                      <a href={v} target="_blank" rel="noreferrer" className="text-teal-655 text-xs font-bold underline">View Document</a>
                    ) : (
                      <p className="text-xs text-slate-800 font-medium">{v}</p>
                    )}
                  </div>
                ))}
              </div>

              <div 
                onClick={() => onOpenFollowUp(lead)}
                className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 cursor-pointer active:bg-slate-100 transition-all"
              >
                <span className="text-[9px] font-black uppercase text-slate-500 block">Follow-up Notes</span>
                {lead.followUpNotes ? (
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-3 font-medium">{lead.followUpNotes}</p>
                ) : (
                  <p className="text-xs text-slate-400 italic">No notes yet... Tap to add.</p>
                )}
              </div>
            </div>

            <button 
              onClick={() => {
                if (lead.followUpStatus === 'completed') {
                  onUpdateFollowUp(lead._id, 'pending', lead.followUpNotes);
                } else {
                  onOpenFollowUp(lead);
                }
              }}
              className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                lead.followUpStatus === 'completed' 
                  ? 'bg-yellow-50 text-yellow-750 border border-yellow-200 hover:bg-yellow-100' 
                  : 'bg-green-50 text-green-750 border border-green-200 hover:bg-green-100'
              }`}
            >
              {lead.followUpStatus === 'completed' ? 'Reset to Pending' : 'Mark as Followed Up'}
            </button>
          </div>
        ))}
      </div>

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 py-8 bg-white border border-slate-200 rounded-[2rem] shadow-sm">
          <button 
            disabled={pagination.page === 1}
            onClick={() => setPagination(p => ({...p, page: p.page - 1}))}
            className="p-3.5 lg:p-3 bg-slate-50 border border-slate-200 rounded-2xl disabled:opacity-30 hover:bg-slate-100 transition-all text-slate-600"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="text-[10px] lg:text-xs font-black text-slate-550 uppercase tracking-widest">{pagination.page} / {pagination.totalPages}</span>
          <button 
            disabled={pagination.page === pagination.totalPages}
            onClick={() => setPagination(p => ({...p, page: p.page + 1}))}
            className="p-3.5 lg:p-3 bg-slate-50 border border-slate-200 rounded-2xl disabled:opacity-30 hover:bg-slate-100 transition-all text-slate-600"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}

function PurchasesViewer({ purchases, loading, onBack }) {
  const totalSales = purchases.length;
  const totalRevenue = purchases.reduce((sum, p) => sum + p.amount, 0);

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[40vh] gap-4">
      <RefreshCw className="w-10 h-10 text-teal-650 animate-spin" />
      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Loading Purchases Ledger...</p>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-all font-bold">
          <ArrowLeft className="w-4 h-4" /> Back to Offers
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 shadow-sm p-6 lg:p-8 rounded-[2rem] relative overflow-hidden">
          <p className="text-slate-500 text-[10px] font-extrabold uppercase tracking-widest mb-1">Total Bundle Sales</p>
          <h3 className="text-3xl font-black font-outfit text-slate-900">{totalSales} Units</h3>
        </div>
        <div className="bg-white border border-slate-200 shadow-sm p-6 lg:p-8 rounded-[2rem] relative overflow-hidden">
          <p className="text-slate-500 text-[10px] font-extrabold uppercase tracking-widest mb-1">Total Revenue</p>
          <h3 className="text-3xl font-black font-outfit text-teal-600">₹{totalRevenue}</h3>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-655 uppercase text-[10px] font-black tracking-widest border-b border-slate-200/80">
                <th className="px-8 py-6">Order ID / Date</th>
                <th className="px-8 py-6">Customer Details</th>
                <th className="px-8 py-6">Mobile Number</th>
                <th className="px-8 py-6">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {purchases.map(p => (
                <tr key={p._id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-6 font-mono font-bold text-teal-600">
                    <div>{p.orderId}</div>
                    <div className="text-[10px] text-slate-500 font-bold font-outfit mt-1">{new Date(p.paidAt || p.createdAt).toLocaleString()}</div>
                  </td>
                  <td className="px-8 py-6 align-middle font-bold text-slate-800">
                    <div>{p.name}</div>
                    <div className="text-[10px] text-slate-500 font-normal mt-0.5">{p.email}</div>
                  </td>
                  <td className="px-8 py-6 align-middle text-slate-700 font-medium">{p.mobile}</td>
                  <td className="px-8 py-6 align-middle text-slate-900 font-bold">₹{p.amount}</td>
                </tr>
              ))}
              {purchases.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-20 text-slate-500 font-bold uppercase tracking-widest">No bundle sales verified yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile View */}
      <div className="lg:hidden space-y-4">
        {purchases.map(p => (
          <div key={p._id} className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-mono font-bold text-teal-600">{p.orderId}</div>
                <div className="text-[10px] text-slate-500 font-bold mt-1">{new Date(p.paidAt || p.createdAt).toLocaleString()}</div>
              </div>
              <span className="text-xs font-black text-slate-850">₹{p.amount}</span>
            </div>
            <div className="space-y-2 border-t border-slate-100 pt-3 text-xs">
              <div>
                <span className="text-slate-400 font-bold uppercase text-[9px] block">Name</span>
                <span className="text-slate-800 font-bold">{p.name}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold uppercase text-[9px] block">Email</span>
                <span className="text-slate-750 font-medium">{p.email}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold uppercase text-[9px] block">Mobile</span>
                <span className="text-slate-750 font-medium">{p.mobile}</span>
              </div>
            </div>
          </div>
        ))}
        {purchases.length === 0 && (
          <div className="text-center py-10 bg-white border border-slate-200 rounded-[2.5rem] text-slate-500 font-bold uppercase tracking-widest">No bundle sales logged.</div>
        )}
      </div>
    </div>
  );
}
