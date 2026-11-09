import { motion } from "framer-motion";
import { Check, Lock, ShieldCheck } from "lucide-react";
import { MEMBER_SERVICES } from "../../content/services";

const GATE_COPY = {
  catalogs: ["Search verified distributors by product & area", "Register your distribution business", "View contacts and download catalogs"],
  "medicine-data": ["Top 1000+ selling pharmacy items", "Salts, categories & usage notes", "Secure access linked to your account"],
  links: ["Licensing & regulatory portals", "Drug information resources", "Curated, regularly updated"],
};

/** Sign-in wall shown on member-only services. One account unlocks all of them. */
export default function MemberGate({ service, onSignIn }) {
  const meta = MEMBER_SERVICES.find((s) => s.tab === service) || MEMBER_SERVICES[0];
  const Icon = meta.icon;
  const bullets = GATE_COPY[service] || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-[2rem] border border-ink-200/70 bg-white shadow-soft"
    >
      <div className="grid lg:grid-cols-[1.1fr_1fr]">
        <div className="p-7 sm:p-10">
          <span className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${meta.accent} text-white shadow-soft`}>
            <Icon className="h-5 w-5" />
          </span>
          <h2 className="mt-6 font-display text-2xl font-extrabold text-ink-900 sm:text-3xl">{meta.title}</h2>
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-ink-600 sm:text-base">{meta.description}</p>
          <ul className="mt-6 space-y-3">
            {bullets.map((b) => (
              <li key={b} className="flex items-center gap-3 text-sm text-ink-700">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
                {b}
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button type="button" onClick={() => onSignIn("login")} className="btn-primary px-6 py-3.5">
              Sign in to continue
            </button>
            <button type="button" onClick={() => onSignIn("register")} className="btn-secondary px-6 py-3.5">
              Create free account
            </button>
          </div>
        </div>

        <div className="relative hidden overflow-hidden bg-ink-950 p-10 text-white lg:block">
          <div className="pointer-events-none absolute inset-0 bg-grid-light opacity-50" />
          <div className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-brand-500/30 blur-3xl" />
          <div className="relative flex h-full flex-col justify-between">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-inset ring-white/15">
              <Lock className="h-6 w-6 text-brand-300" />
            </div>
            <div>
              <p className="font-display text-xl font-bold">One account for every service</p>
              <p className="mt-2 text-sm text-ink-400">
                Your Krishna Medicose account works across jobs, doctor collaborations, distributor catalogs, useful links and the medicine data bundle.
              </p>
              <p className="mt-6 flex items-center gap-2 text-xs text-brand-200">
                <ShieldCheck className="h-4 w-4" /> Password + e-mail OTP protected sign-in
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
