import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Trash2, Edit2, Search, ExternalLink, Globe, 
  CheckCircle2, XCircle, ArrowLeft, RefreshCw, Eye, Tag
} from 'lucide-react';
import api from '../utils/api';
import AssetPicker from './components/AssetPicker';
import { useModal } from '../context/ModalContext';

export default function LinksManager() {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('list'); // 'list' | 'editor'
  const [selectedLink, setSelectedLink] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const { showModal } = useModal();

  useEffect(() => {
    fetchLinks();
  }, []);

  const fetchLinks = async () => {
    setLoading(true);
    try {
      const resp = await api.get('/links/admin/all');
      setLinks(resp.data);
    } catch (err) {
      console.error('Failed to fetch admin links:', err);
      showModal({ title: 'Error', message: 'Failed to load links', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (link) => {
    try {
      const updated = await api.put(`/links/${link._id}`, { isActive: !link.isActive });
      setLinks((prev) => prev.map((l) => (l._id === link._id ? updated.data : l)));
    } catch (err) {
      showModal({ title: 'Error', message: 'Failed to toggle status', type: 'error' });
    }
  };

  const handleDeleteLink = (id) => {
    showModal({
      title: 'Confirm Delete',
      message: 'Are you sure you want to delete this link? It will be removed from the public website.',
      type: 'confirm',
      onConfirm: async () => {
        try {
          await api.delete(`/links/${id}`);
          setLinks((prev) => prev.filter((l) => l._id !== id));
        } catch (err) {
          showModal({ title: 'Error', message: 'Failed to delete link', type: 'error' });
        }
      },
    });
  };

  const categories = ['All', ...new Set(links.map((l) => l.category).filter(Boolean))];

  const filteredLinks = links.filter((link) => {
    const matchesCategory = selectedCategory === 'All' || link.category === selectedCategory;
    const matchesSearch =
      link.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      link.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      link.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (link.category && link.category.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <RefreshCw className="w-10 h-10 text-teal-600 animate-spin" />
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Loading Links Hub...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold font-outfit mb-1 lg:mb-2">
            Manage <span className="text-teal-600 italic">Links & Products</span>
          </h1>
          <p className="text-sm lg:text-base text-slate-500 font-medium">
            Create, update, and organize external product links (Amazon, Flipkart, etc.) for visitors.
          </p>
        </div>

        {activeTab === 'list' && (
          <button
            onClick={() => {
              setSelectedLink(null);
              setActiveTab('editor');
            }}
            className="flex items-center justify-center gap-2 px-6 py-3.5 lg:py-3 rounded-2xl bg-teal-500 text-slate-900 font-black uppercase text-[10px] tracking-widest hover:scale-105 transition-all shadow-lg shadow-teal-500/20"
          >
            <Plus className="w-4 h-4" /> Add New Link
          </button>
        )}
      </header>

      {/* Main Content */}
      {activeTab === 'list' ? (
        <div className="space-y-6">
          {/* Controls: Search & Category */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search links, URLs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:border-teal-500 transition-all"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border whitespace-nowrap ${
                    selectedCategory === cat
                      ? 'bg-teal-50 text-teal-700 border-teal-200/80'
                      : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Links Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredLinks.map((link) => (
                <motion.div
                  key={link._id}
                  layout
                  className="bg-white rounded-[2.5rem] overflow-hidden border border-slate-200 shadow-sm p-6 space-y-4 flex flex-col h-full hover:border-teal-500/30 transition-all duration-300 group"
                >
                  {/* Image & Status Badge */}
                  <div className="relative h-44 rounded-[2rem] overflow-hidden bg-slate-100 shrink-0">
                    {link.image ? (
                      <img src={link.image} alt={link.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-400">
                        <Globe className="w-10 h-10 mb-1 opacity-40" />
                        <span className="text-[9px] font-black uppercase tracking-widest opacity-60">No Image</span>
                      </div>
                    )}

                    <div className="absolute top-4 right-4">
                      <button
                        onClick={() => handleToggleStatus(link)}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                          link.isActive
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : 'bg-red-50 text-red-700 border-red-200'
                        }`}
                      >
                        {link.isActive ? 'Active' : 'Paused'}
                      </button>
                    </div>

                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white/90 border border-slate-200 text-slate-700 shadow-sm backdrop-blur-md">
                        {link.category || 'General'}
                      </span>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 space-y-2">
                    <h3 className="text-xl font-bold font-outfit text-slate-900 line-clamp-1">{link.title}</h3>
                    <p className="text-slate-500 text-sm line-clamp-2 leading-relaxed font-medium">
                      {link.description}
                    </p>
                    <div className="pt-2 flex items-center justify-between text-xs text-slate-400 font-bold">
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-teal-600 hover:underline truncate max-w-[200px] flex items-center gap-1 font-mono"
                      >
                        <ExternalLink className="w-3 h-3 shrink-0" />
                        <span className="truncate">{link.url}</span>
                      </a>
                      <span className="shrink-0 flex items-center gap-1 text-[10px] uppercase font-black tracking-widest text-slate-400">
                        <Eye className="w-3.5 h-3.5 text-teal-600" /> {link.clickCount || 0} clicks
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-4 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setSelectedLink(link);
                        setActiveTab('editor');
                      }}
                      className="flex-1 flex items-center justify-center gap-2 p-3.5 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-200 transition-all text-slate-700 font-bold text-sm"
                      title="Edit Link"
                    >
                      <Edit2 className="w-4 h-4 text-slate-500" /> <span>Edit</span>
                    </button>

                    <a
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-3.5 bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 rounded-2xl transition-all"
                      title="Visit Link"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>

                    <button
                      onClick={() => handleDeleteLink(link._id)}
                      className="p-3.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-2xl transition-all"
                      title="Delete Link"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {filteredLinks.length === 0 && (
              <div className="col-span-full py-20 text-center bg-white border border-slate-200 rounded-[2.5rem] shadow-sm">
                <Globe className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No links created yet</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <LinkEditor
          link={selectedLink}
          onBack={() => setActiveTab('list')}
          onSaved={() => {
            fetchLinks();
            setActiveTab('list');
          }}
        />
      )}
    </div>
  );
}

function LinkEditor({ link, onBack, onSaved }) {
  const { showModal } = useModal();
  const [formData, setFormData] = useState(
    link || {
      title: '',
      description: '',
      url: '',
      image: '',
      category: 'Amazon',
      isActive: true,
    }
  );
  const [saving, setSaving] = useState(false);

  const presetCategories = ['Amazon', 'Flipkart', 'Medicines', 'Medical Equipment', 'Partners', 'General'];

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.description || !formData.url) {
      showModal({ title: 'Validation Error', message: 'Title, description, and target URL are required.', type: 'error' });
      return;
    }

    setSaving(true);
    try {
      if (link) {
        await api.put(`/links/${link._id}`, formData);
      } else {
        await api.post('/links', formData);
      }
      onSaved();
    } catch (err) {
      console.error(err);
      showModal({ title: 'Error', message: 'Failed to save link details.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 lg:space-y-8 max-w-4xl mx-auto">
      <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-all font-bold">
        <ArrowLeft className="w-4 h-4" /> Back to Links List
      </button>

      <form onSubmit={handleSave} className="bg-white border border-slate-200 p-6 lg:p-12 rounded-[2.5rem] lg:rounded-[3.5rem] shadow-md space-y-8">
        <div className="border-b border-slate-100 pb-6">
          <h2 className="text-2xl font-bold font-outfit text-slate-900">
            {link ? 'Edit' : 'Create New'} <span className="text-teal-600 italic">Link</span>
          </h2>
          <p className="text-sm text-slate-500 font-medium">Fill in the details for your public shared link.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Title, URL, Category */}
          <div className="space-y-6">
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest ml-2">Link Title / Heading *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 focus:outline-none focus:bg-white focus:border-teal-500 transition-all text-slate-800 text-sm font-bold"
                placeholder="e.g. Oxithion Tablets - Amazon Product"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest ml-2">Destination URL *</label>
              <input
                type="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 focus:outline-none focus:bg-white focus:border-teal-500 transition-all text-slate-800 text-sm font-bold font-mono"
                placeholder="https://www.amazon.in/dp/example"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest ml-2">Category Tag</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {presetCategories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setFormData({ ...formData, category: cat })}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                      formData.category === cat
                        ? 'bg-teal-50 text-teal-700 border-teal-200'
                        : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 focus:outline-none focus:bg-white focus:border-teal-500 transition-all text-slate-800 text-sm font-bold"
                placeholder="Or type custom category..."
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest ml-2">Status</label>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                className={`w-full p-4 rounded-2xl border flex items-center justify-between transition-all ${
                  formData.isActive
                    ? 'bg-teal-50 border-teal-200 text-teal-700 font-bold'
                    : 'bg-slate-50 border-slate-200 text-slate-500 font-bold'
                }`}
              >
                <span>{formData.isActive ? 'Active (Visible on public page)' : 'Paused (Hidden)'}</span>
                {formData.isActive ? <CheckCircle2 className="w-5 h-5 text-teal-600" /> : <XCircle className="w-5 h-5 opacity-40" />}
              </button>
            </div>
          </div>

          {/* Right Column: Description & Image */}
          <div className="space-y-6">
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest ml-2">Description *</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 focus:outline-none focus:bg-white focus:border-teal-500 transition-all resize-none text-slate-800 text-sm font-bold leading-relaxed"
                placeholder="Describe what this link is about, product details, discounts, etc..."
                required
              />
            </div>

            <div>
              <AssetPicker
                label="Thumbnail Image (Upload or Pick from Library)"
                currentImage={formData.image}
                onSelect={(url) => setFormData({ ...formData, image: url })}
              />

              <div className="mt-3">
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-2">Or Direct Image URL</label>
                <input
                  type="text"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-mono text-slate-700 focus:outline-none focus:border-teal-500"
                  placeholder="https://..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-6 border-t border-slate-100">
          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto px-10 py-4 bg-teal-500 text-slate-900 font-black uppercase tracking-[0.2em] text-xs rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-teal-500/20 disabled:opacity-50"
          >
            {saving ? 'Saving Link...' : link ? 'Update Link' : 'Create Link'}
          </button>
        </div>
      </form>
    </div>
  );
}
