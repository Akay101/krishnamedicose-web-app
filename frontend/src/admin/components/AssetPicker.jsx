import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image as ImageIcon, Upload, X, Check, Search, Trash2, Plus, RefreshCw } from 'lucide-react';
import api from '../../utils/api';

import { useModal } from '../../context/ModalContext';

export default function AssetPicker({ currentImage, onSelect, label }) {
  const { showModal } = useModal();
  const [isOpen, setIsOpen] = useState(false);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const response = await api.get('/assets');
      setAssets(response.data);
    } catch (err) {
      console.error('Failed to fetch assets', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) fetchAssets();
  }, [isOpen]);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/assets/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setAssets([response.data, ...assets]);
      onSelect(response.data.url);
      setIsOpen(false);
    } catch (err) {
      showModal({ title: 'Upload Failed', message: 'Failed to upload asset. Please try again.', type: 'error' });
    } finally {
      setUploading(false);
    }
  };

  const filteredAssets = assets.filter(a => a.filename.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-2">
      {label && <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">{label}</label>}
      
      <div 
        onClick={() => setIsOpen(true)}
        className="group relative h-48 rounded-2xl border-2 border-dashed border-white/10 hover:border-primary/50 bg-white/5 overflow-hidden cursor-pointer transition-all"
      >
        {currentImage ? (
          <>
            <img src={currentImage} alt="Selected" className="w-full h-full object-cover opacity-50 group-hover:opacity-30 transition-opacity" />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <RefreshCw className="w-8 h-8 text-white" />
              <span className="text-sm font-bold">Change Image</span>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-500 group-hover:text-primary transition-colors">
            <ImageIcon className="w-10 h-10" />
            <span className="text-sm font-bold">Select or Upload Image</span>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-dark/90 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-5xl bg-dark-lighter border border-white/10 rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              {/* Header */}
              <div className="p-8 border-b border-white/5 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold font-outfit">Asset <span className="text-primary italic">Library</span></h2>
                  <p className="text-sm text-slate-400">Choose from existing media or upload new files.</p>
                </div>
                <div className="flex items-center gap-4">
                  <label className="btn-primary flex items-center gap-2 px-6 py-3 cursor-pointer">
                    <Upload className="w-4 h-4" />
                    <span>{uploading ? 'Uploading...' : 'Upload New'}</span>
                    <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
                  </label>
                  <button onClick={() => setIsOpen(false)} className="p-3 rounded-full hover:bg-white/5 transition-colors">
                    <X className="w-6 h-6 text-slate-500" />
                  </button>
                </div>
              </div>

              {/* Toolbar */}
              <div className="px-8 py-4 bg-white/2 border-b border-white/5">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input 
                    type="text" 
                    placeholder="Search images..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-primary transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {/* Grid */}
              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <RefreshCw className="w-10 h-10 text-primary animate-spin" />
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Loading Library...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {filteredAssets.map(asset => (
                      <motion.div 
                        key={asset._id}
                        layout
                        whileHover={{ scale: 1.02 }}
                        className={`group relative rounded-2xl overflow-hidden aspect-square border-2 transition-all cursor-pointer ${
                          currentImage === asset.url ? 'border-primary' : 'border-transparent'
                        }`}
                        onClick={() => {
                          onSelect(asset.url);
                          setIsOpen(false);
                        }}
                      >
                        <img src={asset.url} alt={asset.filename} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-dark/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          {currentImage === asset.url ? (
                            <div className="bg-primary text-dark p-2 rounded-full"><Check className="w-5 h-5" /></div>
                          ) : (
                            <span className="text-xs font-bold text-white uppercase tracking-widest">Select</span>
                          )}
                        </div>
                        <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-dark to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                          <p className="text-[10px] text-white truncate">{asset.filename}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
