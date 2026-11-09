import { Link } from "react-router-dom";
import { ArrowUpRight, Clock, Mail, MapPin, Phone } from "lucide-react";
import { FullLogo } from "../BrandLogos";
import { useSiteContent } from "../../context/SiteContentContext";
import { safeHref, telHref, whatsappHref } from "../../content/defaults";

const SERVICE_LINKS = [
  { label: "Pharmacist jobs & hiring", to: "/services?service=staffing" },
  { label: "Doctor collaborations", to: "/services?service=staffing" },
  { label: "Distributor catalogs", to: "/services?service=catalogs" },
  { label: "Medicine data bundle", to: "/services?service=medicine-data" },
  { label: "Useful pharmacy links", to: "/services?service=links" },
];

export default function SiteFooter() {
  const { content } = useSiteContent();
  const { contact = {}, footer = {}, owner = {} } = content;
  const year = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden bg-ink-950 text-ink-300">
      <div className="pointer-events-none absolute inset-0 bg-grid-light opacity-40 mask-fade-b" />
      <div className="pointer-events-none absolute -top-40 right-0 h-80 w-80 rounded-full bg-brand-500/20 blur-3xl" />

      <div className="container-page relative grid gap-12 py-16 sm:py-20 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <FullLogo size="md" theme="dark" />
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-ink-400">{footer.description}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            {(owner.socials || []).map((s) => (
              <a
                key={s.name}
                href={safeHref(s.url)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-ink-200 transition hover:border-brand-400/50 hover:text-white"
              >
                {s.name} <ArrowUpRight className="h-3 w-3" />
              </a>
            ))}
          </div>
        </div>

        <div className="lg:col-span-3">
          <h3 className="text-sm font-semibold text-white">Member services</h3>
          <ul className="mt-4 space-y-3 text-sm">
            {SERVICE_LINKS.map((l) => (
              <li key={l.label}>
                <Link to={l.to} className="transition hover:text-white">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-2">
          <h3 className="text-sm font-semibold text-white">Company</h3>
          <ul className="mt-4 space-y-3 text-sm">
            <li><a href="/#about" className="transition hover:text-white">About us</a></li>
            <li><a href="/#founder" className="transition hover:text-white">Our founder</a></li>
            <li><a href="/#offers" className="transition hover:text-white">Products & offers</a></li>
            <li><a href="/#contact" className="transition hover:text-white">Contact</a></li>
          </ul>
        </div>

        <div className="lg:col-span-3">
          <h3 className="text-sm font-semibold text-white">Get in touch</h3>
          <ul className="mt-4 space-y-3.5 text-sm">
            {contact.phone && (
              <li>
                <a href={telHref(contact.phone)} className="flex items-start gap-3 transition hover:text-white">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" /> {contact.phone}
                </a>
              </li>
            )}
            {contact.whatsapp && (
              <li>
                <a
                  href={whatsappHref(contact.whatsapp, "Hello Krishna Medicose!")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3 transition hover:text-white"
                >
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-emerald-400" /> WhatsApp us
                </a>
              </li>
            )}
            {contact.email && (
              <li>
                <a href={`mailto:${contact.email}`} className="flex items-start gap-3 break-all transition hover:text-white">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" /> {contact.email}
                </a>
              </li>
            )}
            {contact.address && (
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" /> {contact.address}
              </li>
            )}
            {contact.hours && (
              <li className="flex items-start gap-3">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" /> {contact.hours}
              </li>
            )}
          </ul>
        </div>
      </div>

      <div className="relative border-t border-white/10">
        <div className="container-page flex flex-col items-center justify-between gap-3 py-6 text-xs text-ink-500 sm:flex-row">
          <p>
            © {year} {footer.companyName || "Krishna Medicose"}. All rights reserved.
          </p>
          <p>Medicines are dispensed only against a valid prescription where required.</p>
        </div>
      </div>
    </footer>
  );
}
