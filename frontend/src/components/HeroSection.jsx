import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, BadgeCheck, CheckCircle2, MapPin, ShieldCheck, Star } from "lucide-react";
import { safeHref } from "../content/defaults";

const CtaLink = ({ cta, className, children }) => {
  const href = safeHref(cta?.url, "/services");
  return href.startsWith("/") && !href.startsWith("/#") ? (
    <Link to={href} className={className}>
      {children}
    </Link>
  ) : (
    <a href={href} className={className}>
      {children}
    </a>
  );
};

export default function HeroSection({ content, stats = [] }) {
  const reduce = useReducedMotion();
  const images = (content.images || []).filter(Boolean);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (images.length < 2 || reduce) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % images.length), 5500);
    return () => clearInterval(timer);
  }, [images.length, reduce]);

  const [first, ...rest] = String(content.title || "Krishna Medicose").split(" ");

  return (
    <section className="relative overflow-hidden pb-16 pt-8 sm:pb-24 sm:pt-12 lg:pt-16">
      {/* Atmosphere */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-grid mask-fade-b opacity-60" />
        <div className="absolute -left-32 top-10 h-[420px] w-[420px] rounded-full bg-brand-200/50 blur-[110px]" />
        <div className="absolute -right-24 top-40 h-[380px] w-[380px] rounded-full bg-saffron-200/40 blur-[120px]" />
      </div>

      <div className="container-page grid items-center gap-14 lg:grid-cols-[1.05fr_1fr] lg:gap-10">
        {/* Copy */}
        <div>
          <motion.span
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="eyebrow"
          >
            <BadgeCheck className="h-3.5 w-3.5" />
            {content.subtitle}
          </motion.span>

          <motion.h1
            initial={reduce ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.05, ease: [0.2, 0.7, 0.2, 1] }}
            className="display-xl mt-6"
          >
            {first}{" "}
            {rest.length > 0 && <span className="text-gradient">{rest.join(" ")}</span>}
          </motion.h1>

          <motion.p
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="lead mt-6 max-w-xl"
          >
            {content.description}
          </motion.p>

          <motion.div
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="mt-9 flex flex-col gap-3 sm:flex-row"
          >
            <CtaLink cta={content.primaryCta} className="btn-primary px-6 py-3.5 text-[15px]">
              {content.primaryCta?.label || "Explore services"}
              <ArrowRight className="h-4 w-4" />
            </CtaLink>
            <CtaLink cta={content.secondaryCta} className="btn-secondary px-6 py-3.5 text-[15px]">
              {content.secondaryCta?.label || "Talk to us"}
            </CtaLink>
          </motion.div>

          <motion.ul
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.35 }}
            className="mt-8 flex flex-wrap gap-x-6 gap-y-3"
          >
            {(content.highlights || []).map((h) => (
              <li key={h} className="flex items-center gap-2 text-sm font-medium text-ink-700">
                <CheckCircle2 className="h-4 w-4 text-brand-600" /> {h}
              </li>
            ))}
          </motion.ul>

          {content.location && (
            <motion.p
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45 }}
              className="mt-8 inline-flex items-start gap-2 rounded-2xl border border-ink-200/80 bg-white/70 px-4 py-2.5 text-sm text-ink-600 backdrop-blur"
            >
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
              {content.location}
            </motion.p>
          )}
        </div>

        {/* Visual */}
        <motion.div
          initial={reduce ? false : { opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.1, ease: [0.2, 0.7, 0.2, 1] }}
          className="relative mx-auto w-full max-w-xl lg:max-w-none"
        >
          <div className="absolute -inset-4 -z-10 rounded-[2.75rem] bg-gradient-to-br from-brand-300/40 via-white/0 to-saffron-300/40 blur-2xl" />
          <div className="relative aspect-[4/3.6] overflow-hidden rounded-[2rem] border border-white bg-ink-100 shadow-lift ring-1 ring-ink-900/5 sm:aspect-[4/3.3]">
            <AnimatePresence mode="popLayout">
              {images[index] && (
                <motion.img
                  key={images[index]}
                  src={images[index]}
                  alt="Inside Krishna Medicose pharmacy"
                  initial={{ opacity: 0, scale: 1.06 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.1, ease: "easeOut" }}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              )}
            </AnimatePresence>
            <div className="absolute inset-0 bg-gradient-to-t from-ink-950/55 via-ink-950/0 to-transparent" />

            {images.length > 1 && (
              <div className="absolute bottom-5 left-5 flex gap-1.5">
                {images.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    aria-label={`Show image ${i + 1}`}
                    onClick={() => setIndex(i)}
                    className={`h-1.5 rounded-full transition-all ${index === i ? "w-7 bg-white" : "w-1.5 bg-white/50 hover:bg-white/80"}`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Floating proof cards */}
          <motion.div
            animate={reduce ? undefined : { y: [0, -10, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="glass absolute -left-3 top-8 hidden rounded-2xl p-3.5 sm:flex sm:items-center sm:gap-3 lg:-left-10"
          >
            <span className="icon-tile h-10 w-10 rounded-xl">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-ink-900">Pharmacist-led care</p>
              <p className="text-xs text-ink-500">Licensed & verified</p>
            </div>
          </motion.div>

          {stats[0] && (
            <motion.div
              animate={reduce ? undefined : { y: [0, 10, 0] }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="glass absolute -bottom-6 right-4 flex items-center gap-3 rounded-2xl p-3.5 sm:right-8 lg:-right-6"
            >
              <div className="flex -space-x-2">
                {["bg-brand-500", "bg-saffron-400", "bg-ink-700"].map((c) => (
                  <span key={c} className={`h-8 w-8 rounded-full border-2 border-white ${c}`} />
                ))}
              </div>
              <div>
                <p className="flex items-center gap-1 text-sm font-bold text-ink-900">
                  {stats[0].value}
                  <span className="flex text-saffron-400">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <Star key={i} className="h-3 w-3 fill-current" />
                    ))}
                  </span>
                </p>
                <p className="text-xs text-ink-500">{stats[0].label}</p>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
