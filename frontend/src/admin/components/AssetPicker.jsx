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
      {label && <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 ml-2">{label}</label>}
      
      <div 
        onClick={() => setIsOpen(true)}
        className="group relative h-48 rounded-2xl border-2 border-dashed border-slate-200 hover:border-teal-500 bg-slate-50 overflow-hidden cursor-pointer transition-all flex flex-col justify-center items-center"
      >
        {currentImage ? (
          <>
            <img src={currentImage} alt="Selected" className="w-full h-full object-cover opacity-80 group-hover:opacity-60 transition-opacity" />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100 bg-slate-900/20 transition-opacity">
              <div className="bg-white/95 px-4 py-2 rounded-full shadow-sm text-slate-800 text-xs font-bold flex items-center gap-2 hover:bg-white">
                <RefreshCw className="w-4 h-4 text-teal-650" />
                <span>Change Image</span>
              </div>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-400 group-hover:text-teal-600 transition-colors">
            <ImageIcon className="w-10 h-10" />
            <span className="text-xs font-black uppercase tracking-wider">Select or Upload Image</span>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-5xl bg-white border border-slate-200 rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] text-slate-900"
            >
              {/* Header */}
              <div className="p-8 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <div>
                  <h2 className="text-2xl font-bold font-outfit text-slate-900">Asset <span className="text-teal-600 italic">Library</span></h2>
                  <p className="text-sm text-slate-500 font-bold">Choose from existing media or upload new files.</p>
                </div>
                <div className="flex items-center gap-4">
                  <label className="btn-primary flex items-center gap-2 px-6 py-3 cursor-pointer text-xs font-bold shadow-md uppercase tracking-wider">
                    <Upload className="w-4 h-4" />
                    <span>{uploading ? 'Uploading...' : 'Upload New'}</span>
                    <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
                  </label>
                  <button onClick={() => setIsOpen(false)} className="p-3 rounded-full hover:bg-slate-100 transition-colors">
                    <X className="w-6 h-6 text-slate-500" />
                  </button>
                </div>
              </div>

              {/* Toolbar */}
              <div className="px-8 py-4 bg-slate-50/50 border-b border-slate-200">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-450" />
                  <input 
                    type="text" 
                    placeholder="Search images..."
                    className="w-full bg-white border border-slate-200 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-teal-500 transition-all font-bold text-slate-800 text-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {/* Grid */}
              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-white">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <RefreshCw className="w-10 h-10 text-teal-600 animate-spin" />
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Loading Library...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {filteredAssets.map(asset => (
                      <motion.div 
                        key={asset._id}
                        layout
                        whileHover={{ scale: 1.02 }}
                        className={`group relative rounded-2xl overflow-hidden aspect-square border-2 transition-all cursor-pointer bg-slate-50 ${
                          currentImage === asset.url ? 'border-teal-500' : 'border-slate-200/60'
                        }`}
                        onClick={() => {
                          onSelect(asset.url);
                          setIsOpen(false);
                        }}
                      >
                        <img src={asset.url} alt={asset.filename} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          {currentImage === asset.url ? (
                            <div className="bg-teal-500 text-dark p-2 rounded-full"><Check className="w-5 h-5" /></div>
                          ) : (
                            <span className="text-xs font-bold text-white uppercase tracking-widest">Select</span>
                          )}
                        </div>
                        <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-slate-900/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                          <p className="text-[10px] text-white font-bold truncate">{asset.filename}</p>
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
