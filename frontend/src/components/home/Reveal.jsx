import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";

/** Fade-and-rise on first scroll into view. */
export function Reveal({ children, delay = 0, y = 18, className = "", as = "div" }) {
  const reduce = useReducedMotion();
  const Component = motion[as] || motion.div;
  return (
    <Component
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay, ease: [0.2, 0.7, 0.2, 1] }}
    >
      {children}
    </Component>
  );
}

/** Counts up the numeric part of values such as "10K+", "99%" or "25+". */
export function CountUp({ value, duration = 1.4, className = "" }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduce = useReducedMotion();
  const match = String(value ?? "").match(/^([^\d]*)([\d.,]+)(.*)$/);
  const [display, setDisplay] = useState(match ? `${match[1]}0${match[3]}` : value);

  useEffect(() => {
    if (!match || !inView) return;
    const target = parseFloat(match[2].replace(/,/g, ""));
    const decimals = (match[2].split(".")[1] || "").length;
    if (reduce) {
      setDisplay(value);
      return;
    }
    let raf;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - start) / (duration * 1000));
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(`${match[1]}${(target * eased).toFixed(decimals)}${match[3]}`);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, value]);

  return (
    <span ref={ref} className={className}>
      {match ? display : value}
    </span>
  );
}

export function SectionHeading({ eyebrow, title, description, align = "center", dark = false, className = "" }) {
  return (
    <div className={`${align === "center" ? "mx-auto text-center" : ""} max-w-3xl ${className}`}>
      {eyebrow && (
        <Reveal>
          <span className={dark ? "eyebrow-dark" : "eyebrow"}>{eyebrow}</span>
        </Reveal>
      )}
      <Reveal delay={0.05}>
        <h2 className={`display-lg mt-4 ${dark ? "text-white" : ""}`}>{title}</h2>
      </Reveal>
      {description && (
        <Reveal delay={0.1}>
          <p className={`mt-4 text-base leading-relaxed sm:text-lg ${dark ? "text-ink-300" : "text-ink-600"} ${align === "center" ? "mx-auto" : ""} max-w-2xl`}>
            {description}
          </p>
        </Reveal>
      )}
    </div>
  );
}
