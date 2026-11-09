import { useState } from "react";
import { ArrowUpRight, Briefcase, Quote } from "lucide-react";
import CollaborationModal from "./CollaborationModal";
import { Reveal } from "./home/Reveal";
import { safeHref } from "../content/defaults";

const SocialIcon = ({ name }) => {
  if (name === "YouTube")
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="#FF0000" aria-hidden="true">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    );
  if (name === "Instagram")
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
        <defs>
          <linearGradient id="ig-grad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f09433" />
            <stop offset="50%" stopColor="#dc2743" />
            <stop offset="100%" stopColor="#bc1888" />
          </linearGradient>
        </defs>
        <path fill="url(#ig-grad)" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
      </svg>
    );
  return <ArrowUpRight className="h-5 w-5 text-brand-600" />;
};

export default function OwnerSection({ content }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <section id="founder" className="section overflow-hidden bg-canvas">
      <div className="pointer-events-none absolute right-0 top-20 h-96 w-96 rounded-full bg-brand-200/40 blur-[120px]" />
      <div className="container-page relative grid items-center gap-14 lg:grid-cols-[1fr_1.05fr] lg:gap-20">
        <Reveal className="relative mx-auto w-full max-w-md lg:max-w-none">
          <div className="absolute inset-0 translate-x-4 translate-y-4 rounded-[2rem] bg-gradient-to-br from-brand-500 to-saffron-400 opacity-90" />
          <div className="relative overflow-hidden rounded-[2rem] bg-ink-100 shadow-lift">
            <img
              src={content.image || "/assets/owner-krishna.png"}
              alt={content.name}
              loading="lazy"
              className="aspect-[4/4.6] w-full object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-950/80 to-transparent p-6 pt-20">
              <div className="flex items-center gap-3 text-white">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
                </span>
                <p className="text-sm font-semibold">{content.social_family} social family · always growing</p>
              </div>
            </div>
          </div>
        </Reveal>

        <div>
          <Reveal>
            <span className="eyebrow">Meet the founder</span>
          </Reveal>
          <Reveal delay={0.05}>
            <h2 className="display-lg mt-4">{content.name}</h2>
            <p className="mt-2 font-display text-base font-semibold text-brand-700">{content.title}</p>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="relative mt-7 rounded-3xl border border-ink-200/70 bg-white p-6 shadow-soft sm:p-8">
              <Quote className="absolute -top-4 left-6 h-8 w-8 rounded-xl bg-brand-600 p-1.5 text-white" />
              <p className="text-base leading-relaxed text-ink-700 sm:text-lg">{content.bio}</p>
            </div>
          </Reveal>

          <Reveal delay={0.15}>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {(content.socials || []).map((social) => (
                <a
                  key={social.name}
                  href={safeHref(social.url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="card card-hover group flex items-center gap-3 p-4"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-ink-50 ring-1 ring-inset ring-ink-100">
                    <SocialIcon name={social.name} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-ink-500">{social.name}</p>
                    <p className="truncate text-sm font-semibold text-ink-900">{social.handle}</p>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-ink-300 transition group-hover:text-brand-600" />
                </a>
              ))}
            </div>
          </Reveal>

          <Reveal delay={0.2}>
            <button type="button" onClick={() => setIsModalOpen(true)} className="btn-primary mt-6 w-full py-4 sm:w-auto sm:px-7">
              <Briefcase className="h-4 w-4" />
              Collaborate / business enquiry
            </button>
          </Reveal>
        </div>
      </div>

      <CollaborationModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </section>
  );
}
