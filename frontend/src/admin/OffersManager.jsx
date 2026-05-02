import { useState, useEffect } from 'react';
import api from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Trash2, Edit2, Search, Gift, Users, Eye, 
  CheckCircle2, XCircle, PlusCircle, MinusCircle, 
  Settings, Mail, FileText, ChevronRight, ArrowLeft, HelpCircle
} from 'lucide-react';
import AssetPicker from './components/AssetPicker';
import { useModal } from '../context/ModalContext';

export default function OffersManager() {
  const [offers, setOffers] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('list'); // 'list', 'create', 'leads'
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [showFormBuilder, setShowFormBuilder] = useState(false);
  const { showModal } = useModal();

  useEffect(() => {
    fetchOffers();
    fetchLeads();
  }, []);

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
      const resp = await api.get(url);
      setLeads(resp.data);
    } catch (err) { console.error(err); }
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
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold font-outfit">Offers & <span className="text-primary italic">Promotions</span></h1>
          <p className="text-slate-400">Manage launch offers, services, and lead generation forms.</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => { setActiveTab('leads'); fetchLeads(); }}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all ${activeTab === 'leads' ? 'bg-primary text-dark' : 'bg-white/5 hover:bg-white/10'}`}
          >
            <Users className="w-4 h-4" /> View All Leads
          </button>
          <button 
            onClick={() => { setSelectedOffer(null); setActiveTab('create'); }}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-primary text-dark font-bold hover:scale-105 transition-all shadow-lg shadow-primary/20"
          >
            <Plus className="w-4 h-4" /> Create New Offer
          </button>
        </div>
      </header>

      {activeTab === 'list' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
        <LeadsViewer leads={leads} onBack={() => setActiveTab('list')} />
      )}
    </div>
  );
}

function OfferCard({ offer, onToggle, onDelete, onEdit, onViewLeads }) {
  return (
    <motion.div layout className="glass-morphism rounded-[2.5rem] overflow-hidden border border-white/5 p-6 space-y-4">
      <div className="relative h-40 rounded-3xl overflow-hidden bg-dark">
        <img src={offer.image || '/placeholder-offer.png'} className="w-full h-full object-cover opacity-60" />
        <div className="absolute top-4 right-4">
          <button 
            onClick={onToggle}
            className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${
              offer.isActive ? 'bg-green-400/20 text-green-400 border-green-400/30' : 'bg-red-400/20 text-red-400 border-red-400/30'
            }`}
          >
            {offer.isActive ? 'Active' : 'Paused'}
          </button>
        </div>
      </div>
      <div>
        <h3 className="text-xl font-bold font-outfit mb-2 line-clamp-1">{offer.title}</h3>
        <p className="text-slate-400 text-sm line-clamp-2 h-10">{offer.description}</p>
      </div>
      <div className="flex gap-2 pt-4 border-t border-white/5">
        <button onClick={onEdit} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all" title="Edit Offer"><Edit2 className="w-4 h-4" /></button>
        <button onClick={onViewLeads} className="flex-1 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 rounded-2xl font-bold text-sm transition-all text-primary"><Users className="w-4 h-4" /> Leads</button>
        <button onClick={onDelete} className="p-3 bg-red-400/10 hover:bg-red-400/20 text-red-400 rounded-2xl transition-all" title="Delete"><Trash2 className="w-4 h-4" /></button>
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
    <div className="space-y-8 max-w-4xl">
      <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-white transition-all font-bold">
        <ArrowLeft className="w-4 h-4" /> Back to List
      </button>

      <div className="glass-morphism p-10 rounded-[3rem] border border-white/5 space-y-8">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Offer Title</label>
              <input 
                value={formData.title} 
                onChange={e => setFormData({...formData, title: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 focus:border-primary outline-none transition-all"
                placeholder="e.g. 50-50 Launch Offer"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Offer Description</label>
              <textarea 
                value={formData.description} 
                onChange={e => setFormData({...formData, description: e.target.value})}
                rows={5}
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 focus:border-primary outline-none transition-all resize-none"
                placeholder="Details of the offer..."
              />
            </div>
          </div>
          <div className="space-y-6">
            <AssetPicker 
              label="Banner Image" 
              currentImage={formData.image} 
              onSelect={url => setFormData({...formData, image: url})} 
            />
            <div className="flex gap-4">
              <ToggleSection 
                label="Enable Form" 
                enabled={formData.formEnabled} 
                onChange={v => setFormData({...formData, formEnabled: v})} 
              />
              <ToggleSection 
                label="Email Conf." 
                enabled={formData.emailConfirmation} 
                onChange={v => setFormData({...formData, emailConfirmation: v})} 
              />
            </div>
          </div>
        </div>

        {formData.formEnabled && (
          <div className="pt-8 border-t border-white/5 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold font-outfit">Form <span className="text-primary italic">Builder</span></h3>
              <button 
                onClick={handleAddField}
                className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary border border-primary/20 rounded-xl text-xs font-bold"
              >
                <PlusCircle className="w-4 h-4" /> Add Field
              </button>
            </div>

            <div className="space-y-4">
              {formData.formFields.map((field, idx) => (
                <div key={idx} className="flex gap-4 items-end bg-white/2 p-4 rounded-2xl border border-white/5">
                  <div className="flex-1">
                    <label className="text-[10px] uppercase font-bold text-slate-500">Label</label>
                    <input 
                      value={field.label} 
                      onChange={e => updateField(idx, 'label', e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none"
                    />
                  </div>
                  <div className="w-32">
                    <label className="text-[10px] uppercase font-bold text-slate-500">Type</label>
                    <select 
                      value={field.type} 
                      onChange={e => updateField(idx, 'type', e.target.value)}
                      className="w-full bg-dark border border-white/10 rounded-xl px-4 py-2 text-sm outline-none"
                    >
                      <option value="text">Text</option>
                      <option value="number">Number</option>
                      <option value="email">Email</option>
                      <option value="textarea">Long Text</option>
                      <option value="file">File/Document</option>
                    </select>
                  </div>
                  <div className="w-24 group relative">
                    <div className="flex items-center gap-1 mb-1">
                      <label className="text-[10px] uppercase font-bold text-slate-500">Unique</label>
                      <HelpCircle className="w-3 h-3 text-slate-600 cursor-help" />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-dark border border-white/10 rounded-lg text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
                        This field will be marked unique, so no duplicate entries will be allowed for this specific offer.
                      </div>
                    </div>
                    <button 
                      onClick={() => updateField(idx, 'isUnique', !field.isUnique)}
                      className={`w-full py-2 rounded-xl border transition-all flex items-center justify-center ${field.isUnique ? 'bg-primary/20 border-primary/40 text-primary' : 'bg-white/5 border-white/10 text-slate-600'}`}
                    >
                      {field.isUnique ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4 opacity-30" />}
                    </button>
                  </div>
                  <button onClick={() => removeField(idx)} className="p-2 text-red-400 hover:bg-red-400/10 rounded-xl mb-1"><MinusCircle className="w-5 h-5" /></button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end pt-8">
          <button 
            onClick={handleSave}
            className="px-10 py-4 bg-primary text-dark font-black uppercase tracking-widest rounded-2xl hover:bg-primary/80 transition-all shadow-lg shadow-primary/20"
          >
            Save Offer
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
      className={`flex-1 p-4 rounded-2xl border flex items-center justify-between transition-all ${enabled ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-white/5 border-white/10 text-slate-500'}`}
    >
      <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
      {enabled ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4 opacity-50" />}
    </button>
  );
}

function LeadsViewer({ leads, onBack }) {
  return (
    <div className="space-y-8">
      <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-white transition-all font-bold">
        <ArrowLeft className="w-4 h-4" /> Back to Offers
      </button>

      <div className="glass-morphism rounded-[3rem] border border-white/5 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-white/5 text-slate-500 uppercase text-[10px] font-black tracking-widest border-b border-white/5">
              <th className="px-8 py-6">Reg ID</th>
              <th className="px-8 py-6">Offer</th>
              <th className="px-8 py-6">Details</th>
              <th className="px-8 py-6">Submitted</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {leads.map(lead => (
              <tr key={lead._id} className="hover:bg-white/2 transition-colors">
                <td className="px-8 py-6 font-mono font-bold text-primary">{lead.registrationId}</td>
                <td className="px-8 py-6 font-bold">{lead.offerId?.title}</td>
                <td className="px-8 py-6">
                  <div className="text-xs space-y-1">
                    {Object.entries(lead.formData).map(([k, v]) => {
                      const isUrl = typeof v === 'string' && v.startsWith('http');
                      return (
                        <div key={k} className="flex items-center gap-2">
                          <span className="text-slate-500 capitalize">{k.replace('_', ' ')}:</span> 
                          {isUrl ? (
                            <a href={v} target="_blank" rel="noreferrer" className="text-primary hover:underline flex items-center gap-1 font-bold">
                              <FileText className="w-3 h-3" /> View Doc
                            </a>
                          ) : (
                            <span className="truncate max-w-[150px]">{v}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </td>
                <td className="px-8 py-6 text-sm text-slate-400">{new Date(lead.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
