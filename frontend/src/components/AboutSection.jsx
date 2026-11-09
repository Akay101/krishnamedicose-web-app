import { HeartHandshake, MonitorSmartphone, GraduationCap } from "lucide-react";
import { CountUp, Reveal } from "./home/Reveal";

const PILLAR_ICONS = [MonitorSmartphone, HeartHandshake, GraduationCap];

export default function AboutSection({ content }) {
  const [lead, accent] = String(content.vision_title || "").split(" & ");

  return (
    <section id="about" className="section border-t border-ink-200/60 bg-white">
      <div className="container-page grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
        <Reveal className="relative order-last lg:order-first">
          <div className="relative overflow-hidden rounded-[2rem] shadow-lift ring-1 ring-ink-900/5">
            <img
              src={content.image || "/assets/happy-customers.png"}
              alt="Families served by Krishna Medicose"
              loading="lazy"
              className="aspect-[4/3.4] w-full object-cover transition-transform duration-[1.5s] hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-brand-900/30 via-transparent to-transparent" />
          </div>
          <div className="glass absolute -bottom-8 left-6 right-6 grid grid-cols-3 divide-x divide-ink-200/70 rounded-2xl py-4 sm:left-10 sm:right-10">
            {(content.stats || []).slice(0, 3).map((stat) => (
              <div key={stat.label} className="px-2 text-center">
                <CountUp value={stat.value} className="block font-display text-xl font-extrabold text-ink-900 sm:text-2xl" />
                <span className="mt-0.5 block text-[11px] font-medium leading-tight text-ink-500 sm:text-xs">{stat.label}</span>
              </div>
            ))}
          </div>
        </Reveal>

        <div>
          <Reveal>
            <span className="eyebrow">About Krishna Medicose</span>
          </Reveal>
          <Reveal delay={0.05}>
            <h2 className="display-lg mt-4">
              {lead}
              {accent && (
                <>
                  {" "}& <span className="text-gradient">{accent}</span>
                </>
              )}
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="lead mt-5">{content.vision_description}</p>
          </Reveal>

          <div className="mt-10 space-y-4">
            {(content.pillars || []).map((pillar, i) => {
              const Icon = PILLAR_ICONS[i % PILLAR_ICONS.length];
              return (
                <Reveal key={pillar.title} delay={0.12 + i * 0.05}>
                  <div className="flex gap-4 rounded-2xl border border-transparent p-3 transition hover:border-ink-200/70 hover:bg-ink-50/60">
                    <span className="icon-tile">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <h3 className="text-base font-semibold text-ink-900">{pillar.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-ink-600">{pillar.description}</p>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
