import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Trash2, Search, RefreshCw, CheckCircle2, AlertCircle, Image as ImageIcon } from 'lucide-react';

export default function AssetLibraryPage() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  const fetchAssets = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/assets`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setAssets(response.data);
    } catch (err) {
      console.error('Failed to fetch assets', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/assets/upload`, formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${localStorage.getItem('token')}` 
        }
      });
      setAssets([response.data, ...assets]);
      setMessage('Asset uploaded successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this asset? It will be removed from Cloudflare R2.')) return;

    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/assets/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setAssets(assets.filter(a => a._id !== id));
      setMessage('Asset deleted.');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      alert('Delete failed');
    }
  };

  const filteredAssets = assets.filter(a => a.filename.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold font-outfit mb-2">Media <span className="text-primary italic">Library</span></h1>
          <p className="text-slate-400">Manage all your Cloudflare R2 assets in one place.</p>
        </div>
        <label className="btn-primary flex items-center gap-2 px-8 py-3 cursor-pointer rounded-2xl shadow-lg shadow-primary/20">
          <Upload className="w-4 h-4" />
          <span className="font-bold">{uploading ? 'Uploading...' : 'Upload Asset'}</span>
          <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
        </label>
      </header>

      <AnimatePresence>
        {message && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-4 rounded-2xl bg-primary/10 text-primary border border-primary/20 font-bold flex items-center gap-2"
          >
            <CheckCircle2 className="w-5 h-5" />
            {message}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="glass-morphism p-8 rounded-[3rem] border border-white/5 space-y-6">
        <div className="relative">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input 
            type="text" 
            placeholder="Search assets by filename..."
            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-16 pr-6 py-4 focus:outline-none focus:border-primary transition-all font-medium text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <RefreshCw className="w-10 h-10 text-primary animate-spin" />
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest text-glow">Connecting to R2 Cloud...</p>
          </div>
        ) : filteredAssets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 border-2 border-dashed border-white/5 rounded-[2rem]">
            <ImageIcon className="w-16 h-16 text-slate-700" />
            <p className="text-slate-500 font-bold">No assets found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {filteredAssets.map(asset => (
              <motion.div 
                key={asset._id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="group relative rounded-[2rem] overflow-hidden aspect-square border border-white/10 hover:border-primary/50 transition-all bg-dark shadow-xl"
              >
                <img src={asset.url} alt={asset.filename} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-80 group-hover:opacity-100" />
                <div className="absolute inset-0 bg-gradient-to-t from-dark to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-4">
                  <p className="text-[10px] text-white font-bold truncate mb-3">{asset.filename}</p>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(asset.url);
                        setMessage('URL copied to clipboard!');
                        setTimeout(() => setMessage(''), 2000);
                      }}
                      className="flex-1 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-black uppercase tracking-tighter backdrop-blur-md transition-colors"
                    >
                      Copy URL
                    </button>
                    <button 
                      onClick={() => handleDelete(asset._id)}
                      className="p-2 bg-red-400/20 hover:bg-red-400 text-red-400 hover:text-white rounded-xl transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
