import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileSpreadsheet, CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';

export default function MedicineDataSection() {
  const [price, setPrice] = useState(999);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/medicine-bundle/config`);
        if (response.ok) {
          const data = await response.json();
          setPrice(data.amount);
        }
      } catch (error) {
        console.error("Failed to fetch medicine bundle config:", error);
      }
    };
    fetchConfig();
  }, []);

  const features = [
    "500+ most sold medicines in Indian pharmacies",
    "Detailed pricing structures (MRP, PTS, PTR) & profit margins",
    "Therapeutic classification and chemical salt mappings",
    "Downloadable instant Excel (.xlsx) file format"
  ];

  return (
    <section id="medicine-data" className="section-padding bg-slate-100/50 border-t border-slate-200/85 relative overflow-hidden">
      {/* Background radial glows */}
      <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-teal-500/5 blur-[120px] rounded-full -z-10" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-sky-500/5 blur-[100px] rounded-full -z-10" />

      <div className="max-w-5xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-teal-50 border border-teal-200/60 rounded-full mb-6">
            <Sparkles className="w-4 h-4 text-teal-650 animate-pulse" />
            <span className="text-xs font-extrabold uppercase tracking-widest text-teal-700 font-outfit">Pharmacy Insights</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-black font-outfit mb-4 text-slate-900">
            Popular Medicine <span className="text-teal-650 italic">Market Intel</span>
          </h2>
          <p className="text-sm md:text-base text-slate-500 font-bold leading-relaxed">
            Instant analytical access to the best-selling medicine datasets in Indian pharmacies.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-[2.5rem] lg:rounded-[3.5rem] p-8 lg:p-12 shadow-xl grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Details */}
          <div className="md:col-span-7 space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-teal-50 rounded-xl text-teal-650 shrink-0">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-900 font-outfit">Excel Database Bundle</h3>
                <p className="text-xs text-slate-400 font-medium">Updated for current financial quarter</p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              {features.map((feat, idx) => (
                <div key={idx} className="flex gap-2.5 items-start">
                  <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                  <span className="text-xs md:text-sm font-bold text-slate-700 leading-relaxed">{feat}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing & CTA */}
          <div className="md:col-span-5 border-t md:border-t-0 md:border-l border-slate-100 pt-8 md:pt-0 md:pl-8 lg:pl-12 flex flex-col items-center md:items-start text-center md:text-left space-y-6">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">One-Time Download Fee</p>
              <div className="flex items-baseline gap-1.5 justify-center md:justify-start">
                <span className="text-4xl lg:text-5xl font-black text-slate-900 font-outfit">₹{price}</span>
                <span className="text-xs font-bold text-slate-450 uppercase">INR</span>
              </div>
            </div>

            <Link
              to="/medicine-data"
              className="w-full btn-primary py-4 flex items-center justify-center gap-2 group rounded-xl lg:rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-md shadow-teal-500/10 hover:scale-105 active:scale-95 transition-transform"
            >
              <span>Get Access Now</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
