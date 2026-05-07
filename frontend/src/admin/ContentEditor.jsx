import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, RefreshCw, Eye, CheckCircle2, AlertCircle, ChevronDown, ChevronUp, Image as ImageIcon, Plus, Trash2, ChevronRight } from 'lucide-react';
import api from '../utils/api';
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
      const resp = await api.get('/content');
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
      await api.put('/content', { data: content });
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
    <div className="space-y-6 lg:space-y-8 pb-20">
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold font-outfit mb-2">Website <span className="text-primary italic">Customizer</span></h1>
          <p className="text-sm lg:text-base text-slate-400">Modify any text, image, or carousel and publish in real-time.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <button 
            onClick={() => setContent(originalContent)} 
            className="flex items-center justify-center gap-2 px-6 py-3.5 lg:py-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all font-bold text-sm"
          >
            Reset Changes
          </button>
          <button 
            onClick={handleSave} 
            disabled={saving}
            className="flex items-center justify-center gap-2 px-8 py-3.5 lg:py-3 rounded-2xl bg-primary text-dark hover:bg-primary/80 transition-all font-black uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20 disabled:opacity-50"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Publish to Live
          </button>
        </div>
      </header>

      <AnimatePresence>
        {message && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`p-4 rounded-2xl flex items-center gap-3 font-bold border text-xs lg:text-sm ${
              message.includes('Error') ? 'bg-red-400/10 text-red-400 border-red-400/20' : 'bg-green-400/10 text-green-400 border-green-400/20'
            }`}
          >
            {message.includes('Error') ? <AlertCircle className="w-4 h-4 lg:w-5 lg:h-5" /> : <CheckCircle2 className="w-4 h-4 lg:w-5 lg:h-5" />}
            {message}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
        <aside className="lg:col-span-1">
          <div className="flex lg:flex-col overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 gap-2 lg:gap-2 no-scrollbar">
            {sections.map(s => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`whitespace-nowrap lg:whitespace-normal text-left px-5 lg:px-6 py-3 lg:py-4 rounded-xl lg:rounded-2xl transition-all font-bold font-outfit flex justify-between items-center text-xs lg:text-base border ${
                  activeSection === s.id 
                    ? 'bg-primary/20 text-primary border-primary/20 shadow-lg shadow-primary/5' 
                    : 'bg-white/2 hover:bg-white/5 text-slate-500 border-transparent'
                }`}
              >
                {s.label}
                {activeSection === s.id ? <ChevronRight className="hidden lg:block w-4 h-4" /> : null}
              </button>
            ))}
          </div>
        </aside>

        <div className="lg:col-span-3">
          <div className="glass-morphism p-6 lg:p-12 rounded-[2.5rem] lg:rounded-[3.5rem] border border-white/5 space-y-8 lg:space-y-12">
            {activeSection === 'hero' && (
              <div className="space-y-8 lg:space-y-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-10">
                  <div className="space-y-6">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">Main Heading Title</label>
                      <input 
                        type="text" 
                        value={content.hero.title}
                        onChange={(e) => handleInputChange('hero', 'title', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl lg:rounded-2xl py-3.5 lg:py-4 px-5 lg:px-6 focus:border-primary/50 transition-all text-white font-bold text-base lg:text-xl"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">Pill Subtitle</label>
                      <input 
                        type="text" 
                        value={content.hero.subtitle}
                        onChange={(e) => handleInputChange('hero', 'subtitle', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl lg:rounded-2xl py-3.5 lg:py-4 px-5 lg:px-6 focus:border-primary/50 transition-all text-white text-sm lg:text-base"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">Hero Description</label>
                    <textarea 
                      value={content.hero.description}
                      rows={6}
                      onChange={(e) => handleInputChange('hero', 'description', e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl lg:rounded-2xl py-3.5 lg:py-4 px-5 lg:px-6 focus:border-primary/50 transition-all text-white resize-none h-full text-sm lg:text-base leading-relaxed"
                    />
                  </div>
                </div>

                <div className="pt-8 lg:pt-12 border-t border-white/5">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <div>
                      <h3 className="text-xl lg:text-2xl font-bold font-outfit">Hero <span className="text-primary italic">Carousel</span></h3>
                      <p className="text-xs lg:text-sm text-slate-500 mt-1">Manage background images that cycle on your home screen.</p>
                    </div>
                    <button 
                      onClick={addCarouselImage}
                      className="flex items-center gap-2 px-5 py-2.5 bg-primary/10 text-primary border border-primary/20 rounded-xl hover:bg-primary/20 transition-all text-[10px] font-black uppercase tracking-widest"
                    >
                      <Plus className="w-4 h-4" /> Add Slide
                    </button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 lg:gap-8">
                    {content.hero.images.map((img, idx) => (
                      <div key={idx} className="relative group">
                        <AssetPicker 
                          currentImage={img} 
                          onSelect={(url) => handleCarouselChange(idx, url)}
                          label={`Slide #${idx + 1}`}
                        />
                        <button 
                          onClick={() => removeCarouselImage(idx)}
                          className="absolute top-8 right-2 p-2 bg-red-400 text-white rounded-lg lg:opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110 z-10 shadow-lg"
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
              <div className="space-y-8 lg:space-y-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
                  <div className="space-y-6">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">Vision Heading</label>
                      <input 
                        type="text" 
                        value={content.about.vision_title}
                        onChange={(e) => handleInputChange('about', 'vision_title', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl lg:rounded-2xl py-3.5 lg:py-4 px-5 lg:px-6 focus:border-primary/50 transition-all text-white font-bold text-sm lg:text-base"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">Vision Description</label>
                      <textarea 
                        value={content.about.vision_description}
                        rows={8}
                        onChange={(e) => handleInputChange('about', 'vision_description', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl lg:rounded-2xl py-3.5 lg:py-4 px-5 lg:px-6 focus:border-primary/50 transition-all text-white resize-none text-sm lg:text-base leading-relaxed"
                      />
                    </div>
                  </div>
                  <div className="space-y-8">
                    <AssetPicker 
                      label="Section Visual Image"
                      currentImage={content.about?.image || ''}
                      onSelect={(url) => handleInputChange('about', 'image', url)}
                    />
                    <div className="p-6 lg:p-8 rounded-[2rem] bg-white/2 border border-white/5">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">Stats Configuration</p>
                      <div className="space-y-4">
                        {content.about.stats.map((stat, idx) => (
                          <div key={idx} className="flex gap-3 lg:gap-4 items-center">
                            <input 
                              type="text" 
                              value={stat.value} 
                              onChange={(e) => {
                                const newStats = [...content.about.stats];
                                newStats[idx].value = e.target.value;
                                handleInputChange('about', 'stats', newStats);
                              }}
                              className="w-16 lg:w-20 bg-dark/50 border border-white/10 rounded-lg px-2 py-2 text-center font-bold text-primary text-xs lg:text-sm"
                            />
                            <input 
                              type="text" 
                              value={stat.label} 
                              onChange={(e) => {
                                const newStats = [...content.about.stats];
                                newStats[idx].label = e.target.value;
                                handleInputChange('about', 'stats', newStats);
                              }}
                              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-[10px] lg:text-xs text-slate-400"
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">Owner Full Name</label>
                    <input 
                      type="text" 
                      value={content.owner.name}
                      onChange={(e) => handleInputChange('owner', 'name', e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl lg:rounded-2xl py-3.5 lg:py-4 px-5 lg:px-6 focus:border-primary/50 transition-all text-white font-bold text-sm lg:text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">Professional Title</label>
                    <input 
                      type="text" 
                      value={content.owner.title}
                      onChange={(e) => handleInputChange('owner', 'title', e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl lg:rounded-2xl py-3.5 lg:py-4 px-5 lg:px-6 focus:border-primary/50 transition-all text-white text-sm lg:text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">Professional Bio</label>
                    <textarea 
                      value={content.owner.bio}
                      rows={6}
                      onChange={(e) => handleInputChange('owner', 'bio', e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl lg:rounded-2xl py-3.5 lg:py-4 px-5 lg:px-6 focus:border-primary/50 transition-all text-white resize-none text-sm lg:text-base leading-relaxed"
                    />
                  </div>
                </div>
                <div className="space-y-8">
                  <AssetPicker 
                    label="Profile Photo"
                    currentImage={content.owner?.image || ''}
                    onSelect={(url) => handleInputChange('owner', 'image', url)}
                  />
                  <div className="p-6 lg:p-8 rounded-[2rem] bg-white/2 border border-white/5 space-y-6">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Social Accounts</p>
                    {content.owner.socials.map((social, idx) => (
                      <div key={idx} className="flex flex-col gap-2">
                        <span className="text-[9px] font-black text-primary uppercase tracking-wider">{social.name}</span>
                        <input 
                          type="text" 
                          value={social.url} 
                          onChange={(e) => {
                            const newSocials = [...content.owner.socials];
                            newSocials[idx].url = e.target.value;
                            handleInputChange('owner', 'socials', newSocials);
                          }}
                          className="w-full bg-dark/50 border border-white/10 rounded-lg px-4 py-2.5 text-[10px] text-slate-400 focus:border-primary/30 transition-all"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'footer' && (
              <div className="space-y-8">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
                   <div className="space-y-6">
                     <div>
                       <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">Company Name</label>
                       <input 
                         type="text" 
                         value={content.footer?.companyName || ''}
                         onChange={(e) => handleInputChange('footer', 'companyName', e.target.value)}
                         className="w-full bg-white/5 border border-white/10 rounded-xl lg:rounded-2xl py-3.5 lg:py-4 px-5 lg:px-6 focus:border-primary/50 transition-all text-white font-bold"
                       />
                     </div>
                     <div>
                       <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">Address</label>
                       <textarea 
                         value={content.footer?.address || ''}
                         rows={3}
                         onChange={(e) => handleInputChange('footer', 'address', e.target.value)}
                         className="w-full bg-white/5 border border-white/10 rounded-xl lg:rounded-2xl py-3.5 lg:py-4 px-5 lg:px-6 focus:border-primary/50 transition-all text-white resize-none"
                       />
                     </div>
                   </div>
                   <div className="space-y-6">
                     <div>
                       <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">Contact Email</label>
                       <input 
                         type="email" 
                         value={content.footer?.email || ''}
                         onChange={(e) => handleInputChange('footer', 'email', e.target.value)}
                         className="w-full bg-white/5 border border-white/10 rounded-xl lg:rounded-2xl py-3.5 lg:py-4 px-5 lg:px-6 focus:border-primary/50 transition-all text-white"
                       />
                     </div>
                     <div>
                       <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">Contact Phone</label>
                       <input 
                         type="text" 
                         value={content.footer?.phone || ''}
                         onChange={(e) => handleInputChange('footer', 'phone', e.target.value)}
                         className="w-full bg-white/5 border border-white/10 rounded-xl lg:rounded-2xl py-3.5 lg:py-4 px-5 lg:px-6 focus:border-primary/50 transition-all text-white"
                       />
                     </div>
                   </div>
                 </div>
              </div>
            )}

            <div className="pt-8 border-t border-white/5 flex items-center justify-between text-slate-600">
              <div className="flex items-center gap-2 text-[10px] lg:text-xs font-bold">
                <AlertCircle className="w-3 h-3 lg:w-4 lg:h-4" />
                Changes won't be visible to users until you hit Publish.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
