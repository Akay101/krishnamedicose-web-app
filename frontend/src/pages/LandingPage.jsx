import { motion, useScroll, useSpring } from "framer-motion";
import SiteHeader from "../components/layout/SiteHeader";
import SiteFooter from "../components/layout/SiteFooter";
import HeroSection from "../components/HeroSection";
import TrustMarquee from "../components/home/TrustMarquee";
import ServicesShowcase from "../components/home/ServicesShowcase";
import AboutSection from "../components/AboutSection";
import OwnerSection from "../components/OwnerSection";
import OffersSection from "../components/OffersSection";
import MedicineDataSection from "../components/MedicineDataSection";
import ContactSection from "../components/home/ContactSection";
import { useSiteContent } from "../context/SiteContentContext";

function LandingPage() {
  const { content } = useSiteContent();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30, restDelta: 0.001 });
  const show = (key) => content.sections?.[key] !== false;

  return (
    <div className="relative min-h-screen bg-canvas">
      {/* Reading progress */}
      <motion.div className="fixed inset-x-0 top-0 z-[60] h-[3px] origin-left bg-gradient-to-r from-brand-500 to-saffron-400" style={{ scaleX }} />

      <SiteHeader />

      <main>
        <HeroSection content={content.hero} stats={content.about?.stats} />
        <TrustMarquee />
        {show("services") && <ServicesShowcase content={content.services} />}
        {show("about") && <AboutSection content={content.about} />}
        {show("owner") && <OwnerSection content={content.owner} />}
        {show("offers") && <OffersSection />}
        {show("medicineData") && <MedicineDataSection content={content.medicineData} />}
        {show("contact") && <ContactSection contact={content.contact} />}
      </main>

      <SiteFooter />
    </div>
  );
}

export default LandingPage;
