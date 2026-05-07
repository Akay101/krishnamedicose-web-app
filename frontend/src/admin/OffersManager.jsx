import { useState, useEffect } from 'react';
import api from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Trash2, Edit2, Search, Gift, Users, Eye, 
  CheckCircle2, XCircle, PlusCircle, MinusCircle, 
  Settings, Mail, FileText, ChevronRight, ArrowLeft, HelpCircle
} from 'lucide-react';
import AssetPicker from './components/AssetPicker';
import FollowUpModal from './components/FollowUpModal';
import { useModal } from '../context/ModalContext';

export default function OffersManager() {
  const [offers, setOffers] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('list'); // 'list', 'create', 'leads'
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [showFormBuilder, setShowFormBuilder] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [statusFilter, setStatusFilter] = useState('');
  const [counts, setCounts] = useState({ total: 0, pending: 0, completed: 0 });
  const [activeFollowUp, setActiveFollowUp] = useState(null);
  const { showModal } = useModal();

  useEffect(() => {
    fetchOffers();
    if (activeTab === 'leads') fetchLeads();
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

  const handleUpdateFollowUp = async (id, status, notes) => {
    try {
      const resp = await api.patch(`/offers/leads/${id}/followup`, {
        followUpStatus: status,
        followUpNotes: notes
      });
      setLeads(prev => prev.map(l => l._id === id ? resp.data : l));
      // Refresh counts by calling a lightweight fetch
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

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-8">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold font-outfit mb-1 lg:mb-2">Offers & <span className="text-primary italic">Promotions</span></h1>
          <p className="text-sm lg:text-base text-slate-400">Manage launch offers, services, and lead generation forms.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 lg:gap-4">
          <button 
            onClick={() => { setActiveTab('leads'); fetchLeads(); }}
            className={`flex items-center justify-center gap-2 px-6 py-3.5 lg:py-3 rounded-2xl font-bold transition-all border ${activeTab === 'leads' ? 'bg-primary text-dark border-primary' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
          >
            <Users className="w-4 h-4" /> <span>View All Leads</span>
          </button>
          <button 
            onClick={() => { setSelectedOffer(null); setActiveTab('create'); }}
            className="flex items-center justify-center gap-2 px-6 py-3.5 lg:py-3 rounded-2xl bg-primary text-dark font-black uppercase text-[10px] tracking-widest hover:scale-105 transition-all shadow-lg shadow-primary/20"
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
    </div>
  );
}

function OfferCard({ offer, onToggle, onDelete, onEdit, onViewLeads }) {
  return (
    <motion.div layout className="glass-morphism rounded-[2.5rem] overflow-hidden border border-white/5 p-6 space-y-4 flex flex-col h-full">
      <div className="relative h-44 rounded-[2rem] overflow-hidden bg-dark shrink-0">
        <img src={offer.image || '/placeholder-offer.png'} className="w-full h-full object-cover opacity-60" />
        <div className="absolute top-4 right-4">
          <button 
            onClick={onToggle}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border backdrop-blur-md transition-all ${
              offer.isActive ? 'bg-green-400/20 text-green-400 border-green-400/30' : 'bg-red-400/20 text-red-400 border-red-400/30'
            }`}
          >
            {offer.isActive ? 'Active' : 'Paused'}
          </button>
        </div>
      </div>
      <div className="flex-1">
        <h3 className="text-xl font-bold font-outfit mb-2 line-clamp-1">{offer.title}</h3>
        <p className="text-slate-400 text-sm line-clamp-3 leading-relaxed">{offer.description}</p>
      </div>
      <div className="flex gap-2 pt-4 border-t border-white/5">
        <button onClick={onEdit} className="p-3.5 bg-white/5 hover:bg-white/10 rounded-2xl transition-all" title="Edit Offer"><Edit2 className="w-4 h-4" /></button>
        <button onClick={onViewLeads} className="flex-1 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 rounded-2xl font-bold text-sm transition-all text-primary border border-transparent hover:border-primary/20"><Users className="w-4 h-4" /> Leads</button>
        <button onClick={onDelete} className="p-3.5 bg-red-400/10 hover:bg-red-400/20 text-red-400 rounded-2xl transition-all" title="Delete"><Trash2 className="w-4 h-4" /></button>
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
      <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-white transition-all font-bold">
        <ArrowLeft className="w-4 h-4" /> Back to List
      </button>

      <div className="glass-morphism p-6 lg:p-12 rounded-[2.5rem] lg:rounded-[3.5rem] border border-white/5 space-y-8 lg:space-y-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          <div className="space-y-6 lg:space-y-8">
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-3 tracking-widest">Offer Title</label>
              <input 
                value={formData.title} 
                onChange={e => setFormData({...formData, title: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 lg:p-5 focus:border-primary outline-none transition-all text-sm lg:text-base font-medium"
                placeholder="e.g. 50-50 Launch Offer"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-3 tracking-widest">Offer Description</label>
              <textarea 
                value={formData.description} 
                onChange={e => setFormData({...formData, description: e.target.value})}
                rows={6}
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 lg:p-5 focus:border-primary outline-none transition-all resize-none text-sm lg:text-base font-medium"
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
          <div className="pt-8 lg:pt-12 border-t border-white/5 space-y-6 lg:space-y-10">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-xl lg:text-2xl font-bold font-outfit">Lead Data <span className="text-primary italic">Capture</span></h3>
                <p className="text-xs lg:text-sm text-slate-500 mt-1">Define fields for your registration form.</p>
              </div>
              <button 
                onClick={handleAddField}
                className="flex items-center gap-2 px-5 py-3 bg-primary/10 text-primary border border-primary/20 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-primary/20 transition-all"
              >
                <PlusCircle className="w-4 h-4" /> Add Data Point
              </button>
            </div>

            <div className="space-y-4 lg:space-y-6">
              {formData.formFields.map((field, idx) => (
                <div key={idx} className="flex flex-col lg:flex-row gap-4 lg:items-end bg-white/2 p-5 lg:p-6 rounded-[2rem] border border-white/5 relative group">
                  <div className="flex-1">
                    <label className="text-[9px] uppercase font-black text-slate-600 mb-2 block tracking-widest">Field Label</label>
                    <input 
                      value={field.label} 
                      onChange={e => updateField(idx, 'label', e.target.value)}
                      className="w-full bg-dark/50 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-primary/50 transition-all"
                      placeholder="e.g. Phone Number"
                    />
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1 lg:w-40">
                      <label className="text-[9px] uppercase font-black text-slate-600 mb-2 block tracking-widest">Type</label>
                      <select 
                        value={field.type} 
                        onChange={e => updateField(idx, 'type', e.target.value)}
                        className="w-full bg-dark border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-primary/50 transition-all appearance-none"
                      >
                        <option value="text">Text</option>
                        <option value="number">Number</option>
                        <option value="email">Email</option>
                        <option value="textarea">Long Text</option>
                        <option value="file">Document/Image</option>
                      </select>
                    </div>
                    <div className="w-20 shrink-0">
                      <label className="text-[9px] uppercase font-black text-slate-600 mb-2 block tracking-widest">Unique</label>
                      <button 
                        onClick={() => updateField(idx, 'isUnique', !field.isUnique)}
                        className={`w-full py-3 rounded-xl border transition-all flex items-center justify-center ${field.isUnique ? 'bg-primary/20 border-primary/40 text-primary' : 'bg-white/5 border-white/10 text-slate-700'}`}
                      >
                        {field.isUnique ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4 opacity-30" />}
                      </button>
                    </div>
                  </div>
                  <button 
                    onClick={() => removeField(idx)} 
                    className="absolute -top-2 -right-2 lg:static lg:mb-1.5 p-2 bg-red-400/10 lg:bg-transparent text-red-400 hover:bg-red-400/20 rounded-full lg:rounded-xl transition-all"
                  >
                    <MinusCircle className="w-5 h-5" />
                  </button>
                </div>
              ))}
              {formData.formFields.length === 0 && (
                <div className="text-center py-10 lg:py-16 bg-white/2 rounded-[2rem] border border-dashed border-white/10">
                  <p className="text-slate-600 font-bold text-xs lg:text-sm uppercase tracking-widest">No custom fields added yet</p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex justify-end lg:pt-8">
          <button 
            onClick={handleSave}
            className="w-full sm:w-auto px-10 py-5 lg:py-4 bg-primary text-dark font-black uppercase tracking-[0.2em] text-[11px] lg:text-xs rounded-2xl lg:rounded-[1.5rem] hover:bg-primary/80 transition-all shadow-lg shadow-primary/20 hover:scale-[1.02]"
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
      className={`flex-1 p-4 lg:p-5 rounded-2xl lg:rounded-[1.5rem] border flex items-center justify-between transition-all ${enabled ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-white/5 border-white/10 text-slate-500'}`}
    >
      <span className="text-[10px] lg:text-[11px] font-black uppercase tracking-widest">{label}</span>
      {enabled ? <CheckCircle2 className="w-4 h-4 lg:w-5 lg:h-5" /> : <XCircle className="w-4 h-4 lg:w-5 lg:h-5 opacity-40" />}
    </button>
  );
}

function LeadsViewer({ leads, counts, statusFilter, setStatusFilter, pagination, setPagination, onOpenFollowUp, onUpdateFollowUp, onBack }) {
  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-white transition-all font-bold">
          <ArrowLeft className="w-4 h-4" /> Back to Offers
        </button>

        <div className="flex flex-wrap gap-2 lg:gap-3">
          <button 
            onClick={() => { setStatusFilter(''); setPagination(p => ({...p, page: 1})); }}
            className={`flex-1 lg:flex-none px-5 py-3 lg:py-3.5 rounded-xl lg:rounded-2xl font-bold text-[9px] lg:text-[10px] uppercase tracking-widest transition-all border whitespace-nowrap ${!statusFilter ? 'bg-primary text-dark border-primary' : 'bg-white/5 text-slate-500 border-white/5 hover:border-white/20'}`}
          >
            All ({counts.total})
          </button>
          <button 
            onClick={() => { setStatusFilter('pending'); setPagination(p => ({...p, page: 1})); }}
            className={`flex-1 lg:flex-none px-5 py-3 lg:py-3.5 rounded-xl lg:rounded-2xl font-bold text-[9px] lg:text-[10px] uppercase tracking-widest transition-all border whitespace-nowrap ${statusFilter === 'pending' ? 'bg-yellow-400/20 text-yellow-400 border-yellow-400/30' : 'bg-white/5 text-slate-500 border-white/5 hover:border-white/20'}`}
          >
            Pending ({counts.pending})
          </button>
          <button 
            onClick={() => { setStatusFilter('completed'); setPagination(p => ({...p, page: 1})); }}
            className={`flex-1 lg:flex-none px-5 py-3 lg:py-3.5 rounded-xl lg:rounded-2xl font-bold text-[9px] lg:text-[10px] uppercase tracking-widest transition-all border whitespace-nowrap ${statusFilter === 'completed' ? 'bg-green-400/20 text-green-400 border-green-400/30' : 'bg-white/5 text-slate-500 border-white/5 hover:border-white/20'}`}
          >
            Followed ({counts.completed})
          </button>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block glass-morphism rounded-[3rem] border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 text-slate-500 uppercase text-[10px] font-black tracking-widest border-b border-white/5">
                <th className="px-8 py-6">Reg ID / Status</th>
                <th className="px-8 py-6">Offer Details</th>
                <th className="px-8 py-6">Lead Data</th>
                <th className="px-8 py-6">Follow-up Notes</th>
                <th className="px-8 py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {leads.map(lead => (
                <tr key={lead._id} className="hover:bg-white/2 transition-colors group">
                  <td className="px-8 py-6 align-top">
                    <div className="font-mono font-bold text-primary mb-2">{lead.registrationId}</div>
                    <div className="flex flex-col gap-2">
                      <span className={`w-fit text-[8px] uppercase font-black py-1 px-2 rounded-lg ${
                        lead.followUpStatus === 'completed' ? 'bg-green-400/20 text-green-400' : 'bg-yellow-400/20 text-yellow-400'
                      }`}>
                        {lead.followUpStatus || 'pending'}
                      </span>
                      <span className="text-[10px] text-slate-500 font-bold">{new Date(lead.createdAt).toLocaleDateString()}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 align-top font-bold max-w-[200px]">
                    <div className="truncate">{lead.offerId?.title}</div>
                    <div className="text-[10px] text-slate-500 font-normal mt-1 italic">Exclusive Offer Lead</div>
                  </td>
                  <td className="px-8 py-6 align-top">
                    <div className="text-xs space-y-2">
                      {Object.entries(lead.formData).map(([k, v]) => {
                        const isUrl = typeof v === 'string' && v.startsWith('http');
                        return (
                          <div key={k} className="flex flex-col">
                            <span className="text-[10px] font-black uppercase text-slate-600 mb-0.5">{k.replace('_', ' ')}</span> 
                            {isUrl ? (
                              <a href={v} target="_blank" rel="noreferrer" className="text-primary hover:underline flex items-center gap-1 font-bold">
                                <FileText className="w-3 h-3" /> View Document
                              </a>
                            ) : (
                              <span className="text-slate-300 font-medium">{v}</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </td>
                  <td className="px-8 py-6 align-top min-w-[300px]">
                    <div 
                      onClick={() => onOpenFollowUp(lead)}
                      className="w-full bg-dark/20 border border-white/5 hover:border-primary/30 rounded-xl p-4 text-xs text-slate-400 cursor-pointer min-h-[100px] transition-all"
                    >
                      {lead.followUpNotes ? (
                        <p className="line-clamp-4 leading-relaxed">{lead.followUpNotes}</p>
                      ) : (
                        <span className="opacity-30 italic">No notes... Click to add.</span>
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
                          ? 'bg-yellow-400/20 text-yellow-400 hover:bg-yellow-400/30' 
                          : 'bg-green-400/20 text-green-400 hover:bg-green-400/30'
                      }`}
                    >
                      {lead.followUpStatus === 'completed' ? 'Reset' : 'Mark Done'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-4">
        {leads.map(lead => (
          <div key={lead._id} className="glass-morphism p-6 rounded-[2.5rem] border border-white/5 space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-mono font-bold text-primary mb-1">{lead.registrationId}</div>
                <div className="text-[10px] text-slate-500 font-bold uppercase">{new Date(lead.createdAt).toLocaleDateString()}</div>
              </div>
              <span className={`text-[8px] uppercase font-black py-1 px-2 rounded-md ${
                lead.followUpStatus === 'completed' ? 'bg-green-400/20 text-green-400' : 'bg-yellow-400/20 text-yellow-400'
              }`}>
                {lead.followUpStatus || 'pending'}
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-[9px] font-black uppercase text-slate-600 block mb-1">Offer Applied</span>
                <p className="font-bold text-sm text-slate-200">{lead.offerId?.title}</p>
              </div>
              
              <div className="bg-white/2 rounded-2xl p-4 space-y-4">
                {Object.entries(lead.formData).map(([k, v]) => (
                  <div key={k}>
                    <span className="text-[9px] font-black uppercase text-slate-600 block mb-1">{k.replace('_', ' ')}</span>
                    {typeof v === 'string' && v.startsWith('http') ? (
                      <a href={v} target="_blank" rel="noreferrer" className="text-primary text-xs font-bold underline">View Document</a>
                    ) : (
                      <p className="text-xs text-slate-300 font-medium">{v}</p>
                    )}
                  </div>
                ))}
              </div>

              <div 
                onClick={() => onOpenFollowUp(lead)}
                className="bg-dark/50 border border-white/5 rounded-2xl p-4 space-y-2 cursor-pointer active:bg-dark/70 transition-all"
              >
                <span className="text-[9px] font-black uppercase text-slate-600 block">Follow-up Notes</span>
                {lead.followUpNotes ? (
                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">{lead.followUpNotes}</p>
                ) : (
                  <p className="text-xs text-slate-600 italic">No notes yet... Tap to add.</p>
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
                  ? 'bg-yellow-400/20 text-yellow-400 hover:bg-yellow-400/30' 
                  : 'bg-green-400/20 text-green-400 hover:bg-green-400/30 shadow-lg shadow-green-400/5'
              }`}
            >
              {lead.followUpStatus === 'completed' ? 'Reset to Pending' : 'Mark as Followed Up'}
            </button>
          </div>
        ))}
      </div>

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 py-8 lg:bg-white/2 lg:rounded-[2rem] lg:border border-white/5">
          <button 
            disabled={pagination.page === 1}
            onClick={() => setPagination(p => ({...p, page: p.page - 1}))}
            className="p-3.5 lg:p-3 bg-white/5 rounded-2xl disabled:opacity-30 hover:bg-white/10 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="text-[10px] lg:text-xs font-black text-slate-500 uppercase tracking-widest">{pagination.page} / {pagination.totalPages}</span>
          <button 
            disabled={pagination.page === pagination.totalPages}
            onClick={() => setPagination(p => ({...p, page: p.page + 1}))}
            className="p-3.5 lg:p-3 bg-white/5 rounded-2xl disabled:opacity-30 hover:bg-white/10 transition-all"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
