import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Trash2, Edit2, Search, Gift, Users, Eye, 
  CheckCircle2, XCircle, PlusCircle, MinusCircle, 
  Settings, Mail, FileText, ChevronRight, ArrowLeft
} from 'lucide-react';
import AssetPicker from './components/AssetPicker';

export default function OffersManager() {
  const [offers, setOffers] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('list'); // 'list', 'create', 'leads'
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [showFormBuilder, setShowFormBuilder] = useState(false);

  useEffect(() => {
    fetchOffers();
    fetchLeads();
  }, []);

  const fetchOffers = async () => {
    try {
      const resp = await axios.get(`${import.meta.env.VITE_API_URL}/offers`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setOffers(resp.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchLeads = async (offerId = '') => {
    try {
      const url = offerId 
        ? `${import.meta.env.VITE_API_URL}/offers/leads/${offerId}`
        : `${import.meta.env.VITE_API_URL}/offers/leads`;
      const resp = await axios.get(url, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setLeads(resp.data);
    } catch (err) { console.error(err); }
  };

  const toggleStatus = async (offer) => {
    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/offers/${offer._id}`, 
        { isActive: !offer.isActive },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      fetchOffers();
    } catch (err) { alert('Failed to update status'); }
  };

  const deleteOffer = async (id) => {
    if (!window.confirm('Delete this offer and all associated registration data?')) return;
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/offers/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      fetchOffers();
    } catch (err) { alert('Delete failed'); }
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
      formFields: [...formData.formFields, { name: '', label: '', type: 'text', required: true }]
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
      const url = offer ? `${import.meta.env.VITE_API_URL}/offers/${offer._id}` : `${import.meta.env.VITE_API_URL}/offers`;
      const method = offer ? 'put' : 'post';
      await axios[method](url, formData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      onSaved();
    } catch (err) { alert('Save failed'); }
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
                    </select>
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
                    {Object.entries(lead.formData).slice(0, 3).map(([k, v]) => (
                      <div key={k}><span className="text-slate-500 capitalize">{k}:</span> {v}</div>
                    ))}
                    {Object.keys(lead.formData).length > 3 && <div className="text-primary font-bold italic">+ more</div>}
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
