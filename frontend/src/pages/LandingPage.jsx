import Navbar from '../components/Navbar';
import HeroSection from '../components/HeroSection';
import AboutSection from '../components/AboutSection';
import OwnerSection from '../components/OwnerSection';
import OffersSection from '../components/OffersSection';
import InteractiveBackground from '../components/InteractiveBackground';
import { motion, useScroll, useSpring } from 'framer-motion';
import { useState, useEffect } from 'react';

function LandingPage() {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/content`);
        if (response.ok) {
          const data = await response.json();
          setContent(data);
        }
      } catch (error) {
        console.error('Failed to fetch content:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchContent();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <main className="relative selection:bg-primary/30 selection:text-primary">
      {/* Top Banner Offer Highlight */}
      <div className="fixed top-0 left-0 right-0 z-[101] bg-primary text-dark py-1 text-center font-bold text-[10px] md:text-xs uppercase tracking-widest flex items-center justify-center gap-4">
        <span>Exclusive Launch Offer Active!</span>
        <a href="#offers" className="bg-dark/10 hover:bg-dark/20 px-3 py-0.5 rounded-full border border-dark/20 transition-all">Claim Now ↓</a>
      </div>

      {/* Custom Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1.5 bg-primary z-[100] origin-left"
        style={{ scaleX }}
      />

      <InteractiveBackground />
      <Navbar />
      
      <div className="flex flex-col gap-0">
        <HeroSection content={content?.hero} />
        
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 1 }}
        >
          <AboutSection content={content?.about} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 1 }}
        >
          <OwnerSection content={content?.owner} />
        </motion.div>

        <OffersSection />
        
        {/* Footer */}
        <footer className="section-padding bg-dark border-t border-white/5 text-center">
          <div className="max-w-7xl mx-auto flex flex-col items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                <div className="w-6 h-6 bg-primary rounded-full" />
              </div>
              <span className="font-bold text-2xl font-outfit tracking-tight">Krishna <span className="text-primary">Medicose</span></span>
            </div>
            
            <p className="text-slate-500 max-w-md">
              {content?.footer?.description || "Your trusted partner in healthcare. Providing premium pharmaceutical services with a modern touch."}
            </p>
            
            <div className="w-full h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />
            
            <div className="flex flex-col md:flex-row justify-between items-center w-full gap-4 text-sm text-slate-600 font-medium">
              <p>&copy; 2024 Krishna Medicose. All rights reserved.</p>
              <div className="flex gap-8">
                <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
                <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
                <a href="#" className="hover:text-primary transition-colors">Sitemap</a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}

export default LandingPage;
