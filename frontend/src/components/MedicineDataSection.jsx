import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FileSpreadsheet,
  CheckCircle2,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export default function MedicineDataSection() {
  const [price, setPrice] = useState(999);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/medicine-bundle/config`,
        );
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
    "1000+ top-selling items in pharmacies",
    "Detailed categories includes 300+ Medicines, rest are OTC cosmetics and other products",
    "Frequent updates to the dataset to ensure you have the latest information",
    "You get 1 time consultation with krishna on G-Meet to understand the data and how to use it for your business and other queries",
    "Secure OTP based access to your dataset",
  ];

  return (
    <section
      id="medicine-data"
      className="section-padding bg-slate-100/50 border-t border-slate-200/85 relative overflow-hidden"
    >
      {/* Background radial glows */}
      <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-teal-500/5 blur-[120px] rounded-full -z-10" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-sky-500/5 blur-[100px] rounded-full -z-10" />

      <div className="max-w-5xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          {/* <div className="inline-flex items-center gap-2 px-4 py-2 bg-teal-50 border border-teal-200/60 rounded-full mb-6">
            <Sparkles className="w-4 h-4 text-teal-650 animate-pulse" />
            <span className="text-xs font-extrabold uppercase tracking-widest text-teal-700 font-outfit">
              Pharmacy Insights
            </span>
          </div> */}
          <h2 className="text-3xl md:text-4xl font-black font-outfit mb-4 text-slate-900">
            Top Selling Items{" "}
            <span className="text-teal-650 italic">For Pharmacies</span>
          </h2>
          <p className="text-sm md:text-base text-slate-500 font-bold leading-relaxed">
            Instant analytical access to the best-selling medicine datasets in
            pharmacies.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-[2.5rem] lg:rounded-[3.5rem] p-8 lg:p-12 shadow-xl grid grid-cols-1 md:grid-cols-12 gap-10">
          {/* Details */}
          <div className="md:col-span-7">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                <FileSpreadsheet className="w-6 h-6" />
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                      Perfect Fit For
                    </span>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="inline-flex items-center px-3.5 py-1.5 rounded-xl text-xs font-extrabold bg-teal-50 border border-teal-100 text-teal-700 select-none shadow-sm transition-all hover:scale-[1.03]">
                        New Pharmacy Owners
                      </span>
                      <span className="inline-flex items-center px-3.5 py-1.5 rounded-xl text-xs font-extrabold bg-indigo-50 border border-indigo-100 text-indigo-700 select-none shadow-sm transition-all hover:scale-[1.03]">
                        Low-Performing Pharmacies
                      </span>
                      <span className="inline-flex items-center px-3.5 py-1.5 rounded-xl text-xs font-extrabold bg-sky-50 border border-sky-100 text-sky-700 select-none shadow-sm transition-all hover:scale-[1.03]">
                        Students & Learners
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {features.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-teal-600" />
                      <span className="text-sm font-medium leading-relaxed text-slate-700">
                        {feat}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Pricing & CTA */}
          <div className="md:col-span-5 md:border-l border-slate-200 md:pl-12 pt-8 md:pt-0 flex flex-col justify-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                One-Time Download Fee
              </p>

              <div className="mt-2 flex items-end gap-2">
                <span className="text-5xl font-black text-slate-900 font-outfit">
                  ₹{price}
                </span>
                <span className="mb-1 text-sm font-semibold uppercase text-slate-500">
                  INR
                </span>
              </div>
            </div>

            <Link
              to="/medicine-data"
              className="mt-8 w-full btn-primary py-4 rounded-2xl flex items-center justify-center gap-2 group font-bold uppercase tracking-wider shadow-md transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Get Access Now</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
