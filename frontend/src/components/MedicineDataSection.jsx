import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check, FileSpreadsheet, GraduationCap, Lock, Store } from "lucide-react";
import { Reveal, SectionHeading } from "./home/Reveal";

export default function MedicineDataSection({ content }) {
  const [price, setPrice] = useState(999);
  const [studentPrice, setStudentPrice] = useState(199);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/medicine-bundle/config`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.amount) setPrice(data.amount);
        if (data?.studentAmount) setStudentPrice(data.studentAmount);
      })
      .catch(() => {});
  }, []);

  const plans = [
    {
      key: "student",
      icon: GraduationCap,
      name: "Students & learners",
      price: studentPrice,
      note: "For pharmacy students and beginners",
      highlight: false,
    },
    {
      key: "regular",
      icon: Store,
      name: "Pharmacy Pro",
      price,
      note: "For new & growing pharmacies",
      highlight: true,
    },
  ];

  return (
    <section id="medicine-data" className="section border-t border-ink-200/60 bg-white">
      <div className="container-page">
        <SectionHeading eyebrow="Medicine intelligence" title={content.title} description={content.subtitle} />

        <div className="mt-14 grid gap-6 lg:grid-cols-[1.1fr_1fr]">
          <Reveal>
            <div className="card h-full p-7 sm:p-9">
              <span className="icon-tile">
                <FileSpreadsheet className="h-5 w-5" />
              </span>
              <h3 className="mt-6 text-xl font-bold">What's inside the bundle</h3>
              <ul className="mt-6 space-y-4">
                {(content.features || []).map((feature) => (
                  <li key={feature} className="flex gap-3 text-sm leading-relaxed text-ink-700 sm:text-[15px]">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>
              <p className="mt-8 flex items-center gap-2 rounded-2xl bg-ink-50 px-4 py-3 text-xs text-ink-600">
                <Lock className="h-4 w-4 text-brand-600" /> Access is linked to your Krishna Medicose account and protected on one device at a time.
              </p>
            </div>
          </Reveal>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-1">
            {plans.map((plan, i) => (
              <Reveal key={plan.key} delay={0.08 * (i + 1)}>
                <div
                  className={`relative flex h-full flex-col overflow-hidden rounded-3xl p-7 ${
                    plan.highlight ? "bg-ink-950 text-white shadow-lift" : "card"
                  }`}
                >
                  {plan.highlight && (
                    <>
                      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-brand-500/40 blur-3xl" />
                      <span className="absolute right-5 top-5 rounded-full bg-saffron-400 px-2.5 py-1 text-[11px] font-bold text-ink-950">
                        Most popular
                      </span>
                    </>
                  )}
                  <plan.icon className={`h-6 w-6 ${plan.highlight ? "text-brand-300" : "text-brand-600"}`} />
                  <p className={`mt-4 font-semibold ${plan.highlight ? "text-white" : "text-ink-900"}`}>{plan.name}</p>
                  <p className={`text-sm ${plan.highlight ? "text-ink-400" : "text-ink-500"}`}>{plan.note}</p>
                  <p className="mt-5 flex items-end gap-1.5">
                    <span className={`font-display text-4xl font-extrabold ${plan.highlight ? "text-white" : "text-ink-900"}`}>₹{plan.price}</span>
                    <span className={`mb-1 text-sm ${plan.highlight ? "text-ink-400" : "text-ink-500"}`}>one-time</span>
                  </p>
                  <Link
                    to="/services?service=medicine-data"
                    className={`mt-6 w-full ${plan.highlight ? "btn-light" : "btn-primary"}`}
                  >
                    Get access <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
