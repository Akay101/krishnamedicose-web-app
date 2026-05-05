import Navbar from "../components/Navbar";
import HeroSection from "../components/HeroSection";
import AboutSection from "../components/AboutSection";
import OwnerSection from "../components/OwnerSection";
import OffersSection from "../components/OffersSection";
import InteractiveBackground from "../components/InteractiveBackground";
import { motion, useScroll, useSpring } from "framer-motion";
import { useState, useEffect } from "react";
import Logo from "../components/Logo";
import { Sparkles, Zap, ArrowRight } from "lucide-react";

function LandingPage() {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
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
        console.error("Failed to fetch content:", error);
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
      {/* Floating Pill Launch Offer */}
      <motion.div
        initial={{ y: -100, x: "-50%", opacity: 0 }}
        animate={{ y: 0, x: "-50%", opacity: 1 }}
        transition={{ type: "spring", stiffness: 120, damping: 20, delay: 1 }}
        className="fixed top-6 left-1/2 z-[101] w-max"
      >
        <motion.div
          animate={{
            scale: [1, 1.03, 1],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="relative px-5 py-2.5 rounded-full bg-primary text-dark font-black text-[10px] md:text-xs uppercase tracking-[0.2em] flex items-center gap-4 shadow-2xl shadow-primary/30 group cursor-pointer border border-white/30 overflow-hidden"
          onClick={() =>
            document
              .getElementById("offers")
              ?.scrollIntoView({ behavior: "smooth" })
          }
        >
          {/* Shimmer Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

          <div className="flex items-center gap-2.5">
            <Sparkles className="w-3.5 h-3.5 animate-pulse text-dark" />
            <span className="hidden sm:inline">
              Exclusive 50-50 Launch Offer Active!
            </span>
            <span className="sm:hidden">Launch Offer Active!</span>
          </div>

          <div className="h-4 w-px bg-dark/20" />

          <div className="flex items-center gap-2 group/btn">
            <span className="font-black">Claim Now</span>
            <motion.div
              animate={{
                x: [0, 4, 0],
                scale: [1, 1.2, 1],
              }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <Zap className="w-3.5 h-3.5 fill-dark" />
            </motion.div>
          </div>
        </motion.div>
      </motion.div>

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
        <footer
          id="footer"
          className="section-padding bg-dark border-t border-white/5 text-center"
        >
          <div className="max-w-7xl mx-auto flex flex-col items-center gap-8">
            <Logo size="xl" className="mx-auto" />

            <p className="text-slate-500 max-w-md">
              {content?.footer?.description ||
                "Your trusted partner in healthcare. Providing premium pharmaceutical services with a modern touch."}
            </p>

            <div className="flex flex-col items-center gap-4">
              <div className="text-[10px] uppercase font-black tracking-[0.3em] text-primary">
                Get in Touch
              </div>
              <a
                href="tel:+918882948667"
                className="text-2xl md:text-3xl font-black font-outfit text-white hover:text-primary transition-colors"
              >
                +91 8882948667
              </a>
              <p className="text-xs text-slate-500 font-medium">
                Available for Professional Inquiries
              </p>
            </div>

            <div className="w-full h-px bg-gradient-to-r from-transparent via-white/5 to-transparent my-8" />

            <div className="flex flex-col md:flex-row justify-between items-center w-full gap-6 text-[10px] uppercase font-black tracking-widest text-slate-600">
              <p>&copy; 2024 Krishna Medicose. Built for Excellence.</p>
              <div className="flex gap-12">
                <a href="#" className="hover:text-primary transition-all">
                  Privacy
                </a>
                <a href="#" className="hover:text-primary transition-all">
                  Terms
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}

export default LandingPage;
