import { Link } from "react-router-dom";
import { ArrowUpRight, KeyRound, ShieldCheck, Sparkles } from "lucide-react";
import { MEMBER_SERVICES, serviceHref } from "../../content/services";
import { Reveal, SectionHeading } from "./Reveal";
import { useAccount } from "../../context/AccountContext";

const STEPS = [
  { icon: Sparkles, title: "Create one free account", text: "Tell us who you are — pharmacy owner, pharmacist, doctor or member." },
  { icon: ShieldCheck, title: "Verify with a secure code", text: "Every sign-in is protected by your password and an e-mail OTP." },
  { icon: KeyRound, title: "Unlock every service", text: "Jobs, collaborations, catalogs, links and medicine data — one login." },
];

export default function ServicesShowcase({ content }) {
  const { user, openAuth } = useAccount();

  return (
    <section id="services" className="section">
      <div className="container-page">
        <SectionHeading eyebrow="Member services" title={content.title} description={content.subtitle} />

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-6">
          {MEMBER_SERVICES.map((service, i) => {
            const Icon = service.icon;
            // 3 cards on the first row, 2 wider cards on the second (desktop)
            const span = i < 3 ? "lg:col-span-2" : "lg:col-span-3";
            return (
              <Reveal key={service.key} delay={i * 0.05} className={span}>
                <Link
                  to={serviceHref(service)}
                  className="card card-hover group relative flex h-full flex-col overflow-hidden p-6 sm:p-7"
                >
                  <div className={`pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-gradient-to-br ${service.accent} opacity-[0.08] blur-2xl transition-opacity duration-500 group-hover:opacity-20`} />
                  <div className="flex items-start justify-between">
                    <span className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${service.accent} text-white shadow-soft`}>
                      <Icon className="h-5 w-5" />
                    </span>
                    {service.badge ? (
                      <span className="rounded-full bg-saffron-100 px-2.5 py-1 text-[11px] font-bold text-saffron-600">{service.badge}</span>
                    ) : (
                      <ArrowUpRight className="h-5 w-5 text-ink-300 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-brand-600" />
                    )}
                  </div>
                  <h3 className="mt-6 text-lg font-bold text-ink-900">{service.title}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-600">{service.description}</p>
                  <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-ink-400">{service.audience}</p>
                </Link>
              </Reveal>
            );
          })}
        </div>

        {/* One account panel */}
        <Reveal className="mt-8">
          <div className="relative overflow-hidden rounded-[2rem] bg-ink-950 p-7 text-white sm:p-10">
            <div className="pointer-events-none absolute inset-0 bg-grid-light opacity-50" />
            <div className="pointer-events-none absolute -bottom-24 -left-10 h-64 w-64 rounded-full bg-brand-500/30 blur-3xl" />
            <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
              <ol className="grid gap-6 sm:grid-cols-3">
                {STEPS.map((step, i) => (
                  <li key={step.title} className="flex gap-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-brand-300 ring-1 ring-inset ring-white/10">
                      <step.icon className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-brand-300">Step {i + 1}</p>
                      <p className="mt-0.5 font-semibold">{step.title}</p>
                      <p className="mt-1 text-sm text-ink-400">{step.text}</p>
                    </div>
                  </li>
                ))}
              </ol>
              {user ? (
                <Link to="/services" className="btn-light px-6 py-3.5">
                  Go to my services <ArrowUpRight className="h-4 w-4" />
                </Link>
              ) : (
                <button type="button" onClick={() => openAuth({ mode: "register" })} className="btn-light px-6 py-3.5">
                  Create free account <ArrowUpRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
