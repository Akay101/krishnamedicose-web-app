/**
 * Default website content. Everything here can be overridden from
 * Admin → Website Customizer; missing keys always fall back to these values.
 */
export const DEFAULT_CONTENT = {
  brand: {
    name: "Krishna Medicose",
    tagline: "Pharmacy · Healthcare Services · Medicine Intelligence",
  },
  announcement: {
    enabled: true,
    text: "New: one account now unlocks jobs, doctor collaborations, distributor catalogs and medicine data.",
    linkLabel: "Explore services",
    linkUrl: "/services",
  },
  hero: {
    title: "Krishna Medicose",
    subtitle: "Trusted pharmacy · Modern healthcare network",
    description:
      "Genuine medicines, expert pharmacist guidance and a digital network that connects pharmacies, pharmacists, doctors and distributors — built by Krishna Pandit.",
    location: "S-29, Shalimar Garden Ext-2, Ghaziabad, UP 201005",
    images: ["/assets/hero-pharmacy-1.png", "/assets/hero-pharmacy-2.png", "/assets/hero-pharmacy-3.png"],
    primaryCta: { label: "Explore services", url: "/services" },
    secondaryCta: { label: "Talk to us", url: "#contact" },
    highlights: ["Licensed pharmacist-led", "Genuine, verified stock", "Secure member account"],
  },
  about: {
    vision_title: "Our Vision & Commitment",
    vision_description:
      "At Krishna Medicose, our vision stretches beyond providing pharmaceuticals. We strive to create a holistic wellness ecosystem where every customer feels valued and every medical need is met with precision and care.",
    image: "/assets/happy-customers.png",
    stats: [
      { label: "Happy Customers", value: "10K+" },
      { label: "Medicines Available", value: "15K+" },
      { label: "Years of Trust", value: "25+" },
    ],
    pillars: [
      { title: "Modern pharmacy", description: "Technology-driven inventory and dispensing for faster, more accurate service." },
      { title: "Customer first", description: "Trusted by thousands of families for genuine medicines and honest advice." },
      { title: "Education at heart", description: "Health knowledge shared with a growing digital family every week." },
    ],
  },
  services: {
    title: "One account. Every pharmacy service.",
    subtitle:
      "Sign in once with your Krishna Medicose account to hire, get hired, collaborate, source products and grow your pharmacy.",
  },
  owner: {
    name: "Krishna Pandit",
    title: "Pharmacist | Content Creator",
    bio: "With a passion for health education, Krishna Pandit has built a digital family of 75,000+ members. At Krishna Medicose, he ensures that every person receives not just medicines, but the right knowledge for their wellbeing.",
    image: "/assets/owner-krishna.png",
    socials: [
      { name: "YouTube", handle: "@krishnamedicos12", url: "https://www.youtube.com/@krishnamedicos12" },
      { name: "Instagram", handle: "@krishna1211pandit", url: "https://www.instagram.com/krishna1211pandit/" },
    ],
    social_family: "75K+",
  },
  medicineData: {
    title: "Top-selling items for pharmacies",
    subtitle: "Instant, analytical access to the best-selling medicine dataset used by growing pharmacies.",
    features: [
      "1000+ top-selling items in pharmacies",
      "300+ medicines with categories, plus OTC, cosmetics and more",
      "Frequent dataset updates so you always have the latest information",
      "One-time 1:1 consultation with Krishna on Google Meet",
      "Secure, account-linked access on one device at a time",
    ],
  },
  contact: {
    phone: "+91 8882948667",
    whatsapp: "918882948667",
    email: "",
    address: "S-29, Shalimar Garden Ext-2, Ghaziabad, UP 201005",
    hours: "Mon – Sun · 9:00 AM – 10:00 PM",
  },
  footer: {
    companyName: "Krishna Medicose",
    description: "Your trusted partner in healthcare. Premium pharmaceutical services with a modern touch.",
  },
  sections: {
    announcement: true,
    services: true,
    about: true,
    owner: true,
    offers: true,
    medicineData: true,
    contact: true,
  },
};

const isPlainObject = (v) => v && typeof v === "object" && !Array.isArray(v);

/** Deep-merge CMS content over defaults (arrays from the CMS replace defaults when non-empty). */
export const mergeContent = (base, override) => {
  if (!isPlainObject(override)) return base;
  const out = { ...base };
  for (const [key, value] of Object.entries(override)) {
    if (value === undefined || value === null || value === "") continue;
    if (Array.isArray(value)) {
      out[key] = value.length ? value : base[key];
    } else if (isPlainObject(value) && isPlainObject(base[key])) {
      out[key] = mergeContent(base[key], value);
    } else {
      out[key] = value;
    }
  }
  return out;
};

/** Only follow http(s), mailto, tel, in-page and site-relative links. */
export const safeHref = (url, fallback = "#") => {
  if (typeof url !== "string" || !url.trim()) return fallback;
  const value = url.trim();
  if (value.startsWith("/") && !value.startsWith("//")) return value;
  if (value.startsWith("#")) return value;
  try {
    const parsed = new URL(value);
    return ["http:", "https:", "mailto:", "tel:"].includes(parsed.protocol) ? value : fallback;
  } catch {
    return fallback;
  }
};

export const telHref = (phone) => `tel:${String(phone || "").replace(/[^\d+]/g, "")}`;
export const whatsappHref = (number, text) =>
  `https://wa.me/${String(number || "").replace(/\D/g, "")}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
