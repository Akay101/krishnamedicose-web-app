import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, RefreshCw, Eye, CheckCircle2, AlertCircle, ChevronDown, ChevronUp, Image as ImageIcon, Plus, Trash2, ChevronRight } from 'lucide-react';
import AssetPicker from './components/AssetPicker';

export default function ContentEditor() {
  const [content, setContent] = useState(null);
  const [originalContent, setOriginalContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [activeSection, setActiveSection] = useState('hero');

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const resp = await axios.get(`${import.meta.env.VITE_API_URL}/content`);
      setContent(resp.data);
      setOriginalContent(resp.data);
    } catch (err) {
      console.error('Failed to fetch content:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${import.meta.env.VITE_API_URL}/content`, { data: content }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage('Website updated successfully in real-time!');
      setOriginalContent(content);
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('Error updating content. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (section, field, value) => {
    setContent(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleCarouselChange = (index, value) => {
    const newImages = [...content.hero.images];
    newImages[index] = value;
    handleInputChange('hero', 'images', newImages);
  };

  const addCarouselImage = () => {
    handleInputChange('hero', 'images', [...content.hero.images, '']);
  };

  const removeCarouselImage = (index) => {
    if (content.hero.images.length <= 1) return;
    const newImages = content.hero.images.filter((_, i) => i !== index);
    handleInputChange('hero', 'images', newImages);
  };

  if (loading || !content) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <RefreshCw className="w-10 h-10 text-primary animate-spin" />
      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Fetching Content...</p>
    </div>
  );

  const sections = [
    { id: 'hero', label: 'Hero / Introduction' },
    { id: 'about', label: 'About / Vision' },
    { id: 'owner', label: 'Owner Profile' },
    { id: 'footer', label: 'Footer Information' },
  ];

  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold font-outfit mb-2">Website <span className="text-primary italic">Customizer</span></h1>
          <p className="text-slate-400">Modify any text, image, or carousel and publish in real-time.</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => setContent(originalContent)} 
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all font-bold text-sm"
          >
            Reset Changes
          </button>
          <button 
            onClick={handleSave} 
            disabled={saving}
            className="flex items-center gap-2 px-8 py-3 rounded-2xl bg-primary text-dark hover:bg-primary/80 transition-all font-bold text-sm shadow-lg shadow-primary/20 disabled:opacity-50"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Publish to Live Site
          </button>
        </div>
      </header>

      <AnimatePresence>
        {message && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`p-4 rounded-2xl flex items-center gap-3 font-bold border ${
              message.includes('Error') ? 'bg-red-400/10 text-red-400 border-red-400/20' : 'bg-green-400/10 text-green-400 border-green-400/20'
            }`}
          >
            {message.includes('Error') ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
            {message}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid lg:grid-cols-4 gap-8">
        <aside className="lg:col-span-1 space-y-2">
          {sections.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`w-full text-left px-6 py-4 rounded-2xl transition-all font-bold font-outfit flex justify-between items-center ${
                activeSection === s.id ? 'bg-primary/20 text-primary border border-primary/20' : 'hover:bg-white/5 text-slate-400'
              }`}
            >
              {s.label}
              {activeSection === s.id ? <ChevronRight className="w-4 h-4" /> : null}
            </button>
          ))}
        </aside>

        <div className="lg:col-span-3">
          <div className="glass-morphism p-10 rounded-[3rem] border border-white/5 space-y-10">
            {activeSection === 'hero' && (
              <div className="space-y-10">
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Main Heading Title</label>
                      <input 
                        type="text" 
                        value={content.hero.title}
                        onChange={(e) => handleInputChange('hero', 'title', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-6 focus:border-primary/50 transition-all text-white font-bold text-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Pill Subtitle</label>
                      <input 
                        type="text" 
                        value={content.hero.subtitle}
                        onChange={(e) => handleInputChange('hero', 'subtitle', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-6 focus:border-primary/50 transition-all text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Hero Description</label>
                    <textarea 
                      value={content.hero.description}
                      rows={6}
                      onChange={(e) => handleInputChange('hero', 'description', e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-6 focus:border-primary/50 transition-all text-white resize-none h-full"
                    />
                  </div>
                </div>

                <div className="pt-8 border-t border-white/5">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="text-xl font-bold font-outfit">Hero <span className="text-primary italic">Carousel</span></h3>
                      <p className="text-sm text-slate-400">Manage the background images that cycle in the landing page hero section.</p>
                    </div>
                    <button 
                      onClick={addCarouselImage}
                      className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary border border-primary/20 rounded-xl hover:bg-primary/20 transition-all text-xs font-black uppercase"
                    >
                      <Plus className="w-4 h-4" /> Add Slot
                    </button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    {content.hero.images.map((img, idx) => (
                      <div key={idx} className="relative group">
                        <AssetPicker 
                          currentImage={img} 
                          onSelect={(url) => handleCarouselChange(idx, url)}
                          label={`Slide #${idx + 1}`}
                        />
                        <button 
                          onClick={() => removeCarouselImage(idx)}
                          className="absolute top-8 right-2 p-2 bg-red-400 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110 z-10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'about' && (
              <div className="space-y-10">
                <div className="grid md:grid-cols-2 gap-10">
                  <div className="space-y-6">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Vision Heading</label>
                      <input 
                        type="text" 
                        value={content.about.vision_title}
                        onChange={(e) => handleInputChange('about', 'vision_title', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-6 focus:border-primary/50 transition-all text-white font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Vision Description</label>
                      <textarea 
                        value={content.about.vision_description}
                        rows={8}
                        onChange={(e) => handleInputChange('about', 'vision_description', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-6 focus:border-primary/50 transition-all text-white resize-none"
                      />
                    </div>
                  </div>
                  <div className="space-y-6">
                    <AssetPicker 
                      label="Section Visual Image"
                      currentImage={content.about?.image || ''}
                      onSelect={(url) => handleInputChange('about', 'image', url)}
                    />
                    <div className="p-6 rounded-2xl bg-white/2 border border-white/5">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Stats Config</p>
                      <div className="space-y-4">
                        {content.about.stats.map((stat, idx) => (
                          <div key={idx} className="flex gap-4">
                            <input 
                              type="text" 
                              value={stat.value} 
                              onChange={(e) => {
                                const newStats = [...content.about.stats];
                                newStats[idx].value = e.target.value;
                                handleInputChange('about', 'stats', newStats);
                              }}
                              className="w-20 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-center font-bold text-primary"
                            />
                            <input 
                              type="text" 
                              value={stat.label} 
                              onChange={(e) => {
                                const newStats = [...content.about.stats];
                                newStats[idx].label = e.target.value;
                                handleInputChange('about', 'stats', newStats);
                              }}
                              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-1 text-xs text-slate-400"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'owner' && (
              <div className="grid md:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Owner Full Name</label>
                    <input 
                      type="text" 
                      value={content.owner.name}
                      onChange={(e) => handleInputChange('owner', 'name', e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-6 focus:border-primary/50 transition-all text-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Professional Title</label>
                    <input 
                      type="text" 
                      value={content.owner.title}
                      onChange={(e) => handleInputChange('owner', 'title', e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-6 focus:border-primary/50 transition-all text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Professional Bio</label>
                    <textarea 
                      value={content.owner.bio}
                      rows={6}
                      onChange={(e) => handleInputChange('owner', 'bio', e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-6 focus:border-primary/50 transition-all text-white resize-none"
                    />
                  </div>
                </div>
                <div className="space-y-6">
                  <AssetPicker 
                    label="Owner Profile Photo"
                    currentImage={content.owner?.image || ''}
                    onSelect={(url) => handleInputChange('owner', 'image', url)}
                  />
                  <div className="p-6 rounded-2xl bg-white/2 border border-white/5 space-y-4">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Social Handles</p>
                    {content.owner.socials.map((social, idx) => (
                      <div key={idx} className="flex flex-col gap-2">
                        <span className="text-[10px] font-bold text-primary">{social.name}</span>
                        <input 
                          type="text" 
                          value={social.url} 
                          onChange={(e) => {
                            const newSocials = [...content.owner.socials];
                            newSocials[idx].url = e.target.value;
                            handleInputChange('owner', 'socials', newSocials);
                          }}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-xs text-slate-300"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="pt-8 border-t border-white/5 flex items-center justify-between text-slate-500">
              <div className="flex items-center gap-2 text-xs font-bold">
                <AlertCircle className="w-3 h-3" />
                Changes won't be visible to users until you hit Publish.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
