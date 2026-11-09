import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ChevronDown, LayoutGrid, LogOut, Menu, Phone, UserRound, X } from "lucide-react";
import { FullLogo } from "../BrandLogos";
import { useAccount } from "../../context/AccountContext";
import { useSiteContent } from "../../context/SiteContentContext";
import { safeHref, telHref } from "../../content/defaults";

const ROLE_LABELS = {
  pharmacy_owner: "Pharmacy owner",
  job_seeker_pharmacist: "Pharmacist",
  doctor: "Doctor",
  general_user: "Member",
};

const initials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("") || "KM";

function AccountMenu({ user, onSignOut }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const close = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full border border-ink-200 bg-white py-1 pl-1 pr-3 text-sm font-semibold text-ink-800 shadow-soft transition hover:border-brand-300"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-xs font-bold text-white">
          {initials(user.name)}
        </span>
        <span className="hidden max-w-[120px] truncate lg:block">{user.name?.split(" ")[0]}</span>
        <ChevronDown className={`h-4 w-4 text-ink-400 transition ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-64 overflow-hidden rounded-2xl border border-ink-200/80 bg-white shadow-lift"
            role="menu"
          >
            <div className="border-b border-ink-100 bg-ink-50/60 p-4">
              <p className="truncate text-sm font-semibold text-ink-900">{user.name}</p>
              <p className="truncate text-xs text-ink-500">{user.email}</p>
              <span className="mt-2 inline-flex rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-700 ring-1 ring-inset ring-brand-100">
                {ROLE_LABELS[user.role] || "Member"}
              </span>
            </div>
            <div className="p-1.5">
              <Link
                to="/services"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-700 hover:bg-ink-50"
              >
                <LayoutGrid className="h-4 w-4 text-brand-600" /> My services
              </Link>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  onSignOut();
                }}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50"
              >
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function SiteHeader({ variant = "default" }) {
  const { content } = useSiteContent();
  const { user, openAuth, signOut } = useAccount();
  const location = useLocation();
  const isHome = location.pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [bannerOpen, setBannerOpen] = useState(true);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setMobileOpen(false), [location.pathname, location.search]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const anchor = (id) => (isHome ? `#${id}` : `/#${id}`);
  const links = [
    { label: "About", href: anchor("about") },
    { label: "Services", to: "/services", badge: "New" },
    { label: "Products", href: anchor("offers"), hidden: content.sections?.offers === false },
    { label: "Medicine Data", to: "/services?service=medicine-data" },
    { label: "Founder", href: anchor("founder"), hidden: content.sections?.owner === false },
    { label: "Contact", href: anchor("contact") },
  ].filter((l) => !l.hidden);

  const showBanner =
    bannerOpen && variant !== "compact" && content.sections?.announcement !== false && content.announcement?.enabled && content.announcement?.text;
  const solid = scrolled || !isHome || mobileOpen;

  const NavItem = ({ link, className, onClick }) => {
    const inner = (
      <>
        <span>{link.label}</span>
        {link.badge && (
          <span className="rounded-full bg-saffron-100 px-1.5 py-px text-[10px] font-bold uppercase tracking-wide text-saffron-600">
            {link.badge}
          </span>
        )}
      </>
    );
    return link.to ? (
      <Link to={link.to} className={className} onClick={onClick}>
        {inner}
      </Link>
    ) : (
      <a href={link.href} className={className} onClick={onClick}>
        {inner}
      </a>
    );
  };

  return (
    <>
      {showBanner && !mobileOpen && (
        <div className="relative z-50 bg-ink-950 text-white">
          <div className="container-page flex items-center justify-center gap-3 py-2 pr-10 text-center text-xs sm:text-[13px]">
            <span className="hidden h-1.5 w-1.5 shrink-0 rounded-full bg-saffron-400 sm:block" />
            <span className="text-ink-200">{content.announcement.text}</span>
            {content.announcement.linkLabel && (
              <a
                href={safeHref(content.announcement.linkUrl, "/services")}
                className="hidden shrink-0 items-center gap-1 font-semibold text-brand-300 hover:text-brand-200 sm:inline-flex"
              >
                {content.announcement.linkLabel} <ArrowRight className="h-3.5 w-3.5" />
              </a>
            )}
            <button
              type="button"
              aria-label="Dismiss announcement"
              onClick={() => setBannerOpen(false)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-ink-400 hover:bg-white/10 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      <header
        className={`sticky top-0 z-40 transition-all duration-300 ${
          solid ? "border-b border-ink-200/70 bg-white/85 shadow-[0_1px_0_rgba(16,24,40,0.02)] backdrop-blur-xl" : "border-b border-transparent bg-transparent"
        }`}
      >
        <div className="container-page flex h-[72px] items-center justify-between gap-4">
          <Link to="/" aria-label="Krishna Medicose home" className="shrink-0">
            <FullLogo size="sm" />
          </Link>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
            {links.map((link) => (
              <NavItem
                key={link.label}
                link={link}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-ink-600 transition hover:bg-ink-100/70 hover:text-ink-900"
              />
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {content.contact?.phone && (
              <a
                href={telHref(content.contact.phone)}
                className="hidden items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-ink-700 hover:text-brand-700 xl:inline-flex"
              >
                <Phone className="h-4 w-4 text-brand-600" />
                {content.contact.phone}
              </a>
            )}

            {user ? (
              <AccountMenu user={user} onSignOut={signOut} />
            ) : (
              <div className="hidden items-center gap-2 sm:flex">
                <button type="button" onClick={() => openAuth({ mode: "login" })} className="btn-ghost px-3.5 py-2.5">
                  Sign in
                </button>
                <button type="button" onClick={() => openAuth({ mode: "register" })} className="btn-primary px-4 py-2.5">
                  Join free
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-ink-200 bg-white text-ink-800 lg:hidden"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "calc(100dvh - 72px)" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: [0.2, 0.7, 0.2, 1] }}
              className="overflow-y-auto border-t border-ink-100 bg-white lg:hidden"
            >
              <div className="container-page flex min-h-full flex-col py-6">
                <nav className="flex flex-col" aria-label="Mobile">
                  {links.map((link, i) => (
                    <motion.div
                      key={link.label}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.04 * i }}
                    >
                      <NavItem
                        link={link}
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center justify-between gap-2 border-b border-ink-100 py-4 font-display text-lg font-semibold text-ink-900"
                      />
                    </motion.div>
                  ))}
                </nav>

                <div className="mt-auto space-y-3 pt-8">
                  {user ? (
                    <>
                      <div className="flex items-center gap-3 rounded-2xl bg-ink-50 p-4">
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
                          {initials(user.name)}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-ink-900">{user.name}</p>
                          <p className="truncate text-xs text-ink-500">{user.email}</p>
                        </div>
                      </div>
                      <button type="button" onClick={signOut} className="btn-secondary w-full">
                        <LogOut className="h-4 w-4" /> Sign out
                      </button>
                    </>
                  ) : (
                    <>
                      <button type="button" onClick={() => openAuth({ mode: "register" })} className="btn-primary w-full py-3.5">
                        <UserRound className="h-4 w-4" /> Create free account
                      </button>
                      <button type="button" onClick={() => openAuth({ mode: "login" })} className="btn-secondary w-full py-3.5">
                        Sign in
                      </button>
                    </>
                  )}
                  {content.contact?.phone && (
                    <a href={telHref(content.contact.phone)} className="btn-ghost w-full">
                      <Phone className="h-4 w-4 text-brand-600" /> {content.contact.phone}
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}
