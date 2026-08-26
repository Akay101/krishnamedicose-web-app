import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, Search, Sparkles, ShoppingBag, Globe, RefreshCw, ArrowUpRight, Tag } from 'lucide-react';
import Navbar from '../components/Navbar';
import Logo from '../components/Logo';
import InteractiveBackground from '../components/InteractiveBackground';

export default function UsefulLinksPage() {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [categories, setCategories] = useState(['All']);

  useEffect(() => {
    fetchLinks();
  }, []);

  const fetchLinks = async () => {
    setLoading(true);
    try {
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${apiBase}/links`);
      if (response.ok) {
        const data = await response.json();
        setLinks(data);

        // Extract unique categories
        const cats = ['All', ...new Set(data.map((item) => item.category).filter(Boolean))];
        setCategories(cats);
      }
    } catch (err) {
      console.error('Failed to fetch public links:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLinkClick = (link) => {
    try {
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      fetch(`${apiBase}/links/${link._id}/click`, { method: 'POST' }).catch(() => {});
    } catch (e) {
      // Ignore click count errors
    }
    window.open(link.url, '_blank', 'noopener,noreferrer');
  };

  const filteredLinks = links.filter((link) => {
    const matchesCategory = selectedCategory === 'All' || link.category === selectedCategory;
    const matchesSearch =
      link.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      link.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (link.category && link.category.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const getCategoryBadgeStyle = (category) => {
    const cat = (category || '').toLowerCase();
    if (cat.includes('amazon')) {
      return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
    }
    if (cat.includes('flipkart')) {
      return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
    }
    if (cat.includes('product') || cat.includes('medicine')) {
      return 'bg-teal-500/10 text-teal-600 border-teal-500/20';
    }
    return 'bg-slate-500/10 text-slate-600 border-slate-500/20';
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 relative selection:bg-teal-200 selection:text-teal-900 flex flex-col">
      <InteractiveBackground />
      <Navbar />

      <div className="pt-32 pb-16 px-4 sm:px-8 lg:px-16 max-w-7xl mx-auto flex-1 w-full space-y-12">
        {/* Header Banner */}
        <div className="text-center max-w-3xl mx-auto">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-black font-outfit text-slate-900 tracking-tight"
          >
            Useful <span className="text-teal-600 italic">Links & Products</span>
          </motion.h1>
        </div>

        {/* Search & Category Filter */}
        <div className="space-y-6 max-w-4xl mx-auto">
          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search products, Amazon links, Flipkart, health tools..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-14 pr-6 py-4 rounded-2xl bg-white border border-slate-200 shadow-sm text-slate-800 font-bold focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all text-sm sm:text-base"
            />
          </div>

          {/* Categories Horizontal Scroll */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none justify-start sm:justify-center">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap border ${
                  selectedCategory === category
                    ? 'bg-slate-900 text-white border-slate-900 shadow-md scale-105'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Links Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <RefreshCw className="w-10 h-10 text-teal-600 animate-spin" />
            <p className="text-xs font-extrabold uppercase tracking-widest text-slate-400">Loading Useful Links...</p>
          </div>
        ) : (
          <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <AnimatePresence>
              {filteredLinks.map((link) => (
                <motion.div
                  key={link._id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  whileHover={{ y: -5 }}
                  className="bg-white rounded-[2.5rem] border border-slate-200/80 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col group cursor-pointer"
                  onClick={() => handleLinkClick(link)}
                >
                  {/* Card Thumbnail / Header */}
                  <div className="relative h-48 sm:h-52 bg-slate-100 overflow-hidden shrink-0">
                    {link.image ? (
                      <img
                        src={link.image}
                        alt={link.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-400">
                        <ShoppingBag className="w-12 h-12 mb-2 stroke-[1.5]" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Krishna Medicose</span>
                      </div>
                    )}
                    <div className="absolute top-4 left-4">
                      <span
                        className={`px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border backdrop-blur-md ${getCategoryBadgeStyle(
                          link.category
                        )}`}
                      >
                        {link.category || 'General'}
                      </span>
                    </div>
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md p-2.5 rounded-full text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity shadow-md">
                      <ArrowUpRight className="w-4 h-4 text-teal-600" />
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold font-outfit text-slate-900 group-hover:text-teal-700 transition-colors line-clamp-2">
                        {link.title}
                      </h3>
                      <p className="text-slate-600 text-sm font-medium leading-relaxed line-clamp-3">
                        {link.description}
                      </p>
                    </div>

                    {/* Bottom CTA */}
                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                        <Globe className="w-3.5 h-3.5" /> External Link
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLinkClick(link);
                        }}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-teal-50 hover:bg-teal-500 text-teal-700 hover:text-slate-900 font-extrabold text-xs transition-all duration-300"
                      >
                        <span>Open Link</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {filteredLinks.length === 0 && (
              <div className="col-span-full py-20 text-center bg-white border border-slate-200 rounded-[3rem] shadow-sm space-y-4">
                <Tag className="w-12 h-12 text-slate-300 mx-auto" />
                <p className="text-slate-500 font-bold text-sm uppercase tracking-widest">
                  No useful links found matching your criteria
                </p>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Footer */}
      <footer id="footer" className="section-padding bg-slate-900 border-t border-slate-800 text-center mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col items-center gap-8">
          <Logo size="xl" className="mx-auto" theme="dark" />
          <p className="text-slate-400 max-w-md font-medium text-sm">
            Your trusted partner in healthcare. Providing premium pharmaceutical services with a modern touch.
          </p>
          <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-800 to-transparent my-4" />
          <div className="flex flex-col md:flex-row justify-between items-center w-full gap-6 text-[10px] uppercase font-extrabold tracking-widest text-slate-500">
            <p>&copy; 2024 Krishna Medicose. Built for Excellence.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
