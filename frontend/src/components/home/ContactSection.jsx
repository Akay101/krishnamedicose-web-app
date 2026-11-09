import { useState } from "react";
import { Clock, MapPin, MessageCircle, Phone, Send } from "lucide-react";
import CollaborationModal from "../CollaborationModal";
import { Reveal } from "./Reveal";
import { telHref, whatsappHref } from "../../content/defaults";

export default function ContactSection({ contact = {} }) {
  const [open, setOpen] = useState(false);
  const mapQuery = encodeURIComponent(contact.address || "Krishna Medicose");

  return (
    <section id="contact" className="section">
      <div className="container-page">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2.25rem] bg-gradient-to-br from-brand-700 via-brand-800 to-ink-950 p-7 text-white sm:p-12">
            <div className="pointer-events-none absolute inset-0 bg-grid-light opacity-40" />
            <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-saffron-400/25 blur-3xl" />

            <div className="relative grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-center">
              <div>
                <span className="eyebrow-dark">Contact</span>
                <h2 className="display-lg mt-4 text-white">Have a question or a prescription? We're here to help.</h2>
                <p className="mt-4 max-w-xl text-base text-brand-100/80">
                  Call, WhatsApp or send an enquiry — our pharmacist team responds quickly during working hours.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  {contact.phone && (
                    <a href={telHref(contact.phone)} className="btn-light px-6 py-3.5">
                      <Phone className="h-4 w-4" /> Call {contact.phone}
                    </a>
                  )}
                  {contact.whatsapp && (
                    <a
                      href={whatsappHref(contact.whatsapp, "Hello Krishna Medicose! I have a query.")}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-outline-light px-6 py-3.5"
                    >
                      <MessageCircle className="h-4 w-4" /> WhatsApp
                    </a>
                  )}
                  <button type="button" onClick={() => setOpen(true)} className="btn-outline-light px-6 py-3.5">
                    <Send className="h-4 w-4" /> Send enquiry
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {contact.address && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur transition hover:bg-white/10"
                  >
                    <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-brand-300" />
                    <div>
                      <p className="text-sm font-semibold">Visit the pharmacy</p>
                      <p className="mt-1 text-sm text-brand-100/80">{contact.address}</p>
                    </div>
                  </a>
                )}
                {contact.hours && (
                  <div className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
                    <Clock className="mt-0.5 h-5 w-5 shrink-0 text-brand-300" />
                    <div>
                      <p className="text-sm font-semibold">Opening hours</p>
                      <p className="mt-1 text-sm text-brand-100/80">{contact.hours}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
      <CollaborationModal isOpen={open} onClose={() => setOpen(false)} />
    </section>
  );
}
