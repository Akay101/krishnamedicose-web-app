import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, MapPin, Sparkles, ChevronRight, ChevronLeft } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function HeroSection({ content }) {
  const heroData = content || {
    title: "Krishna Medicose",
    subtitle: "Redefining Pharmaceutical Excellence",
    description: "Experience world-class healthcare solutions where ultra-modern technology meets professional compassion. Your health, our vision.",
    location: "S-29, Shalimar Garden Ext-2, Ghaziabad, UP, 201005",
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
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-200/25 blur-[100px] rounded-full -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-sky-200/25 blur-[100px] rounded-full -z-10" />

      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-50 border border-teal-200/80 text-teal-800 text-xs font-extrabold uppercase tracking-widest mb-6">
            <Sparkles className="w-4 h-4 text-teal-600" />
            {heroData.subtitle}
          </div>
          <h1 className="text-4xl sm:text-6xl md:text-8xl font-black font-outfit leading-[1.1] mb-8 tracking-tighter text-slate-900">
            {heroData.title.includes(' ') ? (
              <>
                {heroData.title.split(' ')[0]} <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-sky-600">
                  {heroData.title.split(' ').slice(1).join(' ')}
                </span>
              </>
            ) : heroData.title}
          </h1>
          <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-xl leading-relaxed font-bold">
            {heroData.description}
          </p>

          <div className="flex flex-wrap gap-4 items-center">
            <button className="btn-primary flex items-center gap-2 group">
              Explore Our Vision
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </button>
            <div className="flex items-center gap-3 bg-white border border-slate-200 shadow-sm py-3 px-6 rounded-full">
              <MapPin className="text-teal-600 w-5 h-5" />
              <span className="text-sm font-extrabold text-slate-700">{heroData.location}</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
          className="relative"
        >
          <div className="relative z-10 rounded-[3rem] overflow-hidden border-8 border-white shadow-xl bg-slate-100 aspect-[4/3]">
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
            
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent" />

            {/* Carousel Controls */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3 z-30">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${currentIndex === i ? 'w-8 bg-teal-600 shadow-sm' : 'w-2 bg-white/50 hover:bg-white/80'}`}
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
              <div className="w-12 h-12 rounded-2xl bg-teal-600 flex items-center justify-center font-black text-white shadow-md shadow-teal-600/20">
                24/7
              </div>
              <div>
                <p className="text-sm font-extrabold text-slate-900">Building something</p>
                <p className="text-xs font-bold text-slate-500">New & Modern</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
