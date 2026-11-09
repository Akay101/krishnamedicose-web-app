import { Briefcase, FileSpreadsheet, Link2, Stethoscope, Truck } from "lucide-react";

/** Member services unlocked by one Krishna Medicose account. */
export const MEMBER_SERVICES = [
  {
    key: "staffing",
    tab: "staffing",
    icon: Briefcase,
    title: "Pharmacist jobs & hiring",
    description: "Post vacancies for your pharmacy or discover verified jobs near you — matched by distance and qualification.",
    audience: "Pharmacy owners · Pharmacists",
    accent: "from-brand-500 to-brand-700",
  },
  {
    key: "doctors",
    tab: "staffing",
    icon: Stethoscope,
    title: "Doctor collaborations",
    description: "List consultation chambers or clinic tie-ups, and connect with doctors open to collaborate in your area.",
    audience: "Pharmacies · Doctors",
    accent: "from-sky-500 to-sky-700",
  },
  {
    key: "catalogs",
    tab: "catalogs",
    icon: Truck,
    title: "Distributor catalogs",
    description: "Browse verified distributors and product catalogs, or register your own distribution business.",
    audience: "Pharmacies · Distributors",
    accent: "from-violet-500 to-violet-700",
  },
  {
    key: "medicine-data",
    tab: "medicine-data",
    icon: FileSpreadsheet,
    title: "Medicine data bundle",
    description: "The top 1000+ selling pharmacy items with salts, categories and usage — curated by Krishna.",
    audience: "New & growing pharmacies · Students",
    accent: "from-saffron-400 to-saffron-600",
    badge: "Popular",
  },
  {
    key: "links",
    tab: "links",
    icon: Link2,
    title: "Useful pharmacy links",
    description: "Regulatory portals, licensing resources and handy tools — organised in one trusted directory.",
    audience: "Everyone in pharmacy",
    accent: "from-emerald-500 to-emerald-700",
  },
];

export const serviceHref = (service) => `/services?service=${service.tab}`;
