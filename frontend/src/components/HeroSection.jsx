import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, MapPin, Sparkles, ChevronRight, ChevronLeft } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function HeroSection({ content }) {
  const heroData = content || {
    title: "Krishna Medicose",
    subtitle: "Redefining Pharmaceutical Excellence",
    description: "Experience world-class healthcare solutions where ultra-modern technology meets professional compassion. Your health, our vision.",
    location: "Brij Vihar Road, Bharatpur Raj. 321001",
    images: ['/assets/hero-pharmacy-1.png', '/assets/hero-pharmacy-2.png', '/assets/hero-pharmacy-3.png']
  };

  const images = heroData.images;
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [images.length]);

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center pt-32 section-padding overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 blur-[120px] rounded-full -z-10 animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/20 blur-[120px] rounded-full -z-10 animate-pulse" />

      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-primary/30 text-primary text-xs font-bold uppercase tracking-widest mb-6">
            <Sparkles className="w-4 h-4" />
            {heroData.subtitle}
          </div>
          <h1 className="text-6xl md:text-8xl font-bold font-outfit leading-[1.1] mb-8">
            {heroData.title.includes(' ') ? (
              <>
                {heroData.title.split(' ')[0]} <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary text-glow">
                  {heroData.title.split(' ').slice(1).join(' ')}
                </span>
              </>
            ) : heroData.title}
          </h1>
          <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-xl leading-relaxed">
            {heroData.description}
          </p>

          <div className="flex flex-wrap gap-4 items-center">
            <button className="btn-primary flex items-center gap-2 group">
              Explore Our Vision
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </button>
            <div className="flex items-center gap-3 glass py-3 px-6 rounded-full">
              <MapPin className="text-secondary w-5 h-5" />
              <span className="text-sm font-medium">{heroData.location}</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
          className="relative"
        >
          <div className="relative z-10 rounded-[3rem] overflow-hidden border-8 border-white/5 shadow-2xl bg-dark aspect-[4/3]">
            <AnimatePresence mode="wait">
              <motion.img
                key={currentIndex}
                src={images[currentIndex]}
                alt="Krishna Medicose Vision"
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
                className="w-full h-full object-cover"
              />
            </AnimatePresence>
            
            <div className="absolute inset-0 bg-gradient-to-t from-dark via-transparent to-transparent opacity-60" />

            {/* Carousel Controls */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3 z-30">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${currentIndex === i ? 'w-8 bg-primary shadow-[0_0_8px_#2dd4bf]' : 'w-2 bg-white/20 hover:bg-white/40'}`}
                />
              ))}
            </div>
          </div>
          
          {/* Decorative floating card */}
          <motion.div 
            animate={{ y: [0, -20, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -bottom-10 -left-10 z-20 glass-morphism p-6 rounded-3xl hidden md:block"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center font-bold text-dark shadow-lg shadow-primary/30">
                24/7
              </div>
              <div>
                <p className="text-sm font-bold">Always Open</p>
                <p className="text-xs text-slate-400">Emergency Support</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
