import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Eye,
  LayoutTemplate,
  Megaphone,
  Phone,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Sparkles,
  Trash2,
  UserRound,
  FileSpreadsheet,
  Info,
  Grid2x2,
  PanelBottom,
} from "lucide-react";
import api from "../utils/api";
import AssetPicker from "./components/AssetPicker";
import { DEFAULT_CONTENT, mergeContent } from "../content/defaults";

/* ---------- path helpers ---------- */
const getIn = (obj, path) => path.split(".").reduce((acc, key) => (acc == null ? acc : acc[key]), obj);
const setIn = (obj, path, value) => {
  const keys = path.split(".");
  const clone = Array.isArray(obj) ? [...obj] : { ...obj };
  let cursor = clone;
  keys.forEach((key, i) => {
    if (i === keys.length - 1) {
      cursor[key] = value;
    } else {
      cursor[key] = Array.isArray(cursor[key]) ? [...cursor[key]] : { ...(cursor[key] || {}) };
      cursor = cursor[key];
    }
  });
  return clone;
};

/* ---------- field primitives ---------- */
const Field = ({ label, hint, children }) => (
  <label className="block">
    <span className="field-label">{label}</span>
    {children}
    {hint && <span className="mt-1 block text-xs text-ink-400">{hint}</span>}
  </label>
);

const TextInput = ({ value, onChange, ...rest }) => (
  <input className="input" value={value ?? ""} onChange={(e) => onChange(e.target.value)} {...rest} />
);

const TextArea = ({ value, onChange, rows = 4 }) => (
  <textarea className="input resize-y" rows={rows} value={value ?? ""} onChange={(e) => onChange(e.target.value)} />
);

const Toggle = ({ checked, onChange, label, description }) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className="flex w-full items-center justify-between gap-4 rounded-2xl border border-ink-200/80 bg-white px-4 py-3 text-left transition hover:border-brand-300"
    role="switch"
    aria-checked={checked}
  >
    <span>
      <span className="block text-sm font-semibold text-ink-900">{label}</span>
      {description && <span className="block text-xs text-ink-500">{description}</span>}
    </span>
    <span className={`relative h-6 w-11 shrink-0 rounded-full transition ${checked ? "bg-brand-600" : "bg-ink-200"}`}>
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? "left-[22px]" : "left-0.5"}`} />
    </span>
  </button>
);

const StringList = ({ items = [], onChange, placeholder, addLabel = "Add item" }) => (
  <div className="space-y-2">
    {items.map((item, i) => (
      <div key={i} className="flex gap-2">
        <input
          className="input"
          value={item}
          placeholder={placeholder}
          onChange={(e) => onChange(items.map((v, idx) => (idx === i ? e.target.value : v)))}
        />
        <button
          type="button"
          onClick={() => onChange(items.filter((_, idx) => idx !== i))}
          className="rounded-xl border border-ink-200 px-3 text-ink-400 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
          aria-label="Remove"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    ))}
    <button type="button" onClick={() => onChange([...items, ""])} className="btn-ghost px-3 py-2 text-xs">
      <Plus className="h-3.5 w-3.5" /> {addLabel}
    </button>
  </div>
);

const ObjectList = ({ items = [], onChange, fields, addLabel = "Add item", blank }) => (
  <div className="space-y-3">
    {items.map((item, i) => (
      <div key={i} className="rounded-2xl border border-ink-200/80 bg-ink-50/50 p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs font-semibold text-ink-500">#{i + 1}</span>
          <button
            type="button"
            onClick={() => onChange(items.filter((_, idx) => idx !== i))}
            className="rounded-lg p-1.5 text-ink-400 hover:bg-rose-50 hover:text-rose-600"
            aria-label="Remove"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
        <div className={`grid gap-3 ${fields.length > 1 ? "sm:grid-cols-2" : ""}`}>
          {fields.map((f) => (
            <Field key={f.key} label={f.label}>
              {f.multiline ? (
                <TextArea rows={2} value={item[f.key]} onChange={(v) => onChange(items.map((it, idx) => (idx === i ? { ...it, [f.key]: v } : it)))} />
              ) : (
                <TextInput value={item[f.key]} placeholder={f.placeholder} onChange={(v) => onChange(items.map((it, idx) => (idx === i ? { ...it, [f.key]: v } : it)))} />
              )}
            </Field>
          ))}
        </div>
      </div>
    ))}
    <button type="button" onClick={() => onChange([...items, { ...blank }])} className="btn-ghost px-3 py-2 text-xs">
      <Plus className="h-3.5 w-3.5" /> {addLabel}
    </button>
  </div>
);

const Card = ({ title, description, children }) => (
  <div className="card p-5 sm:p-6">
    <div className="mb-5">
      <h3 className="text-base font-bold text-ink-900">{title}</h3>
      {description && <p className="mt-0.5 text-xs text-ink-500">{description}</p>}
    </div>
    <div className="space-y-4">{children}</div>
  </div>
);

/* ---------- sections ---------- */
const SECTIONS = [
  { id: "layout", label: "Layout & visibility", icon: LayoutTemplate },
  { id: "announcement", label: "Announcement bar", icon: Megaphone },
  { id: "hero", label: "Hero", icon: Sparkles },
  { id: "services", label: "Services intro", icon: Grid2x2 },
  { id: "about", label: "About & vision", icon: Info },
  { id: "owner", label: "Founder profile", icon: UserRound },
  { id: "medicineData", label: "Medicine data", icon: FileSpreadsheet },
  { id: "contact", label: "Contact details", icon: Phone },
  { id: "footer", label: "Footer", icon: PanelBottom },
];

const SECTION_TOGGLES = [
  ["announcement", "Announcement bar", "Thin banner above the navigation"],
  ["services", "Member services", "Cards for jobs, collaborations, catalogs, data & links"],
  ["about", "About & vision", "Story, pillars and key numbers"],
  ["owner", "Founder", "Krishna Pandit's profile and socials"],
  ["offers", "Products & offers", "Pharmacy software and registration offers"],
  ["medicineData", "Medicine data pricing", "Bundle features and plans"],
  ["contact", "Contact band", "Call, WhatsApp and enquiry actions"],
];

export default function ContentEditor() {
  const [content, setContent] = useState(null);
  const [original, setOriginal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [active, setActive] = useState("layout");

  useEffect(() => {
    api
      .get("/content")
      .then((resp) => resp.data)
      .catch(() => ({}))
      .then((data) => {
        const merged = mergeContent(DEFAULT_CONTENT, data);
        setContent(merged);
        setOriginal(merged);
      })
      .finally(() => setLoading(false));
  }, []);

  const dirty = useMemo(() => JSON.stringify(content) !== JSON.stringify(original), [content, original]);

  // Warn before leaving with unpublished changes
  useEffect(() => {
    const onBeforeUnload = (e) => {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  const update = (path) => (value) => setContent((prev) => setIn(prev, path, value));
  const val = (path) => getIn(content, path);

  const showToast = (type, text) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3500);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const resp = await api.put("/content", { data: content });
      const saved = mergeContent(DEFAULT_CONTENT, resp.data?.data);
      setContent(saved);
      setOriginal(saved);
      showToast("success", "Published — the live website is updated.");
    } catch (err) {
      showToast("error", err.response?.data?.message || "Could not publish changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !content) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-3 text-ink-500">
        <RefreshCw className="h-6 w-6 animate-spin text-brand-600" />
        <p className="text-sm">Loading website content…</p>
      </div>
    );
  }

  const renderSection = () => {
    switch (active) {
      case "layout":
        return (
          <Card title="Homepage sections" description="Show or hide whole sections of the public homepage.">
            <div className="grid gap-3">
              {SECTION_TOGGLES.map(([key, label, description]) => (
                <Toggle
                  key={key}
                  label={label}
                  description={description}
                  checked={val(`sections.${key}`) !== false}
                  onChange={update(`sections.${key}`)}
                />
              ))}
            </div>
          </Card>
        );
      case "announcement":
        return (
          <Card title="Announcement bar" description="A short message shown above the navigation on every public page.">
            <Toggle label="Show announcement" checked={Boolean(val("announcement.enabled"))} onChange={update("announcement.enabled")} />
            <Field label="Message">
              <TextInput value={val("announcement.text")} onChange={update("announcement.text")} maxLength={180} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Link label">
                <TextInput value={val("announcement.linkLabel")} onChange={update("announcement.linkLabel")} />
              </Field>
              <Field label="Link URL" hint="e.g. /services or https://…">
                <TextInput value={val("announcement.linkUrl")} onChange={update("announcement.linkUrl")} />
              </Field>
            </div>
          </Card>
        );
      case "hero":
        return (
          <>
            <Card title="Headline" description="The first thing every visitor reads.">
              <Field label="Title" hint="Words after the first one are highlighted in the brand gradient.">
                <TextInput value={val("hero.title")} onChange={update("hero.title")} />
              </Field>
              <Field label="Eyebrow label">
                <TextInput value={val("hero.subtitle")} onChange={update("hero.subtitle")} />
              </Field>
              <Field label="Description">
                <TextArea value={val("hero.description")} onChange={update("hero.description")} />
              </Field>
              <Field label="Store location">
                <TextInput value={val("hero.location")} onChange={update("hero.location")} />
              </Field>
            </Card>
            <Card title="Call-to-action buttons">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Primary button label"><TextInput value={val("hero.primaryCta.label")} onChange={update("hero.primaryCta.label")} /></Field>
                <Field label="Primary button URL"><TextInput value={val("hero.primaryCta.url")} onChange={update("hero.primaryCta.url")} /></Field>
                <Field label="Secondary button label"><TextInput value={val("hero.secondaryCta.label")} onChange={update("hero.secondaryCta.label")} /></Field>
                <Field label="Secondary button URL"><TextInput value={val("hero.secondaryCta.url")} onChange={update("hero.secondaryCta.url")} /></Field>
              </div>
              <Field label="Trust highlights">
                <StringList items={val("hero.highlights")} onChange={update("hero.highlights")} placeholder="e.g. Licensed pharmacist-led" addLabel="Add highlight" />
              </Field>
            </Card>
            <Card title="Image carousel" description="Images rotate every few seconds. Use landscape photos (4:3).">
              <div className="grid gap-4 sm:grid-cols-2">
                {(val("hero.images") || []).map((img, i) => (
                  <div key={i} className="relative">
                    <AssetPicker
                      currentImage={img}
                      label={`Slide ${i + 1}`}
                      onSelect={(url) => update("hero.images")((val("hero.images") || []).map((v, idx) => (idx === i ? url : v)))}
                    />
                    {(val("hero.images") || []).length > 1 && (
                      <button
                        type="button"
                        onClick={() => update("hero.images")((val("hero.images") || []).filter((_, idx) => idx !== i))}
                        className="absolute right-2 top-2 rounded-lg bg-white/90 p-1.5 text-rose-600 shadow-soft"
                        aria-label="Remove slide"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => update("hero.images")([...(val("hero.images") || []), ""])} className="btn-ghost px-3 py-2 text-xs">
                <Plus className="h-3.5 w-3.5" /> Add slide
              </button>
            </Card>
          </>
        );
      case "services":
        return (
          <Card title="Member services intro" description="Heading above the services cards on the homepage.">
            <Field label="Title"><TextInput value={val("services.title")} onChange={update("services.title")} /></Field>
            <Field label="Subtitle"><TextArea rows={3} value={val("services.subtitle")} onChange={update("services.subtitle")} /></Field>
          </Card>
        );
      case "about":
        return (
          <>
            <Card title="Vision">
              <Field label="Heading" hint='Use " & " to highlight the second part, e.g. "Our Vision & Commitment".'>
                <TextInput value={val("about.vision_title")} onChange={update("about.vision_title")} />
              </Field>
              <Field label="Description"><TextArea value={val("about.vision_description")} onChange={update("about.vision_description")} /></Field>
              <AssetPicker label="Section image" currentImage={val("about.image")} onSelect={update("about.image")} />
            </Card>
            <Card title="Key numbers" description="Shown on the about image (and the first one in the hero).">
              <ObjectList
                items={val("about.stats")}
                onChange={update("about.stats")}
                blank={{ value: "", label: "" }}
                addLabel="Add number"
                fields={[
                  { key: "value", label: "Value", placeholder: "10K+" },
                  { key: "label", label: "Label", placeholder: "Happy customers" },
                ]}
              />
            </Card>
            <Card title="Pillars">
              <ObjectList
                items={val("about.pillars")}
                onChange={update("about.pillars")}
                blank={{ title: "", description: "" }}
                addLabel="Add pillar"
                fields={[
                  { key: "title", label: "Title" },
                  { key: "description", label: "Description", multiline: true },
                ]}
              />
            </Card>
          </>
        );
      case "owner":
        return (
          <>
            <Card title="Founder profile">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Full name"><TextInput value={val("owner.name")} onChange={update("owner.name")} /></Field>
                <Field label="Professional title"><TextInput value={val("owner.title")} onChange={update("owner.title")} /></Field>
              </div>
              <Field label="Bio"><TextArea value={val("owner.bio")} onChange={update("owner.bio")} /></Field>
              <Field label="Social family size" hint="e.g. 75K+"><TextInput value={val("owner.social_family")} onChange={update("owner.social_family")} /></Field>
              <AssetPicker label="Profile photo" currentImage={val("owner.image")} onSelect={update("owner.image")} />
            </Card>
            <Card title="Social profiles" description="Name YouTube or Instagram to get the matching icon.">
              <ObjectList
                items={val("owner.socials")}
                onChange={update("owner.socials")}
                blank={{ name: "", handle: "", url: "" }}
                addLabel="Add profile"
                fields={[
                  { key: "name", label: "Platform" },
                  { key: "handle", label: "Handle" },
                  { key: "url", label: "Profile URL", placeholder: "https://…" },
                ]}
              />
            </Card>
          </>
        );
      case "medicineData":
        return (
          <Card title="Medicine data section" description="Prices come from the server configuration; edit the copy here.">
            <Field label="Title"><TextInput value={val("medicineData.title")} onChange={update("medicineData.title")} /></Field>
            <Field label="Subtitle"><TextArea rows={3} value={val("medicineData.subtitle")} onChange={update("medicineData.subtitle")} /></Field>
            <Field label="Features">
              <StringList items={val("medicineData.features")} onChange={update("medicineData.features")} addLabel="Add feature" />
            </Field>
          </Card>
        );
      case "contact":
        return (
          <Card title="Contact details" description="Used in the header, contact band, footer and WhatsApp buttons.">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Phone"><TextInput value={val("contact.phone")} onChange={update("contact.phone")} placeholder="+91 …" /></Field>
              <Field label="WhatsApp number" hint="Country code + number, digits only">
                <TextInput value={val("contact.whatsapp")} onChange={update("contact.whatsapp")} placeholder="91XXXXXXXXXX" />
              </Field>
              <Field label="Email"><TextInput type="email" value={val("contact.email")} onChange={update("contact.email")} /></Field>
              <Field label="Opening hours"><TextInput value={val("contact.hours")} onChange={update("contact.hours")} /></Field>
            </div>
            <Field label="Address"><TextArea rows={2} value={val("contact.address")} onChange={update("contact.address")} /></Field>
          </Card>
        );
      case "footer":
        return (
          <Card title="Footer">
            <Field label="Company name"><TextInput value={val("footer.companyName")} onChange={update("footer.companyName")} /></Field>
            <Field label="Short description"><TextArea rows={3} value={val("footer.description")} onChange={update("footer.description")} /></Field>
          </Card>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 pb-24">
      <header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink-900 sm:text-3xl">Website customizer</h1>
          <p className="mt-1 text-sm text-ink-500">Edit every section of the public website and publish instantly.</p>
        </div>
        <a href="/" target="_blank" rel="noopener noreferrer" className="btn-secondary self-start px-4 py-2.5 lg:self-auto">
          <Eye className="h-4 w-4" /> Preview site <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </header>

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <nav className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0" aria-label="Content sections">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setActive(s.id)}
              className={`flex shrink-0 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-left text-sm font-medium transition ${
                active === s.id ? "bg-white text-ink-900 shadow-soft ring-1 ring-ink-200/80" : "text-ink-500 hover:bg-white/60 hover:text-ink-900"
              }`}
            >
              <s.icon className={`h-4 w-4 ${active === s.id ? "text-brand-600" : "text-ink-400"}`} />
              {s.label}
            </button>
          ))}
        </nav>

        <motion.div key={active} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="min-w-0 space-y-6">
          {renderSection()}
        </motion.div>
      </div>

      {/* Sticky publish bar */}
      <AnimatePresence>
        {(dirty || toast) && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            className="fixed inset-x-4 bottom-4 z-40 mx-auto flex max-w-3xl flex-col items-stretch gap-3 rounded-2xl border border-ink-200/80 bg-white/95 p-3 shadow-lift backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:pl-5 lg:left-[calc(18rem+1rem)]"
          >
            {toast ? (
              <p className={`flex items-center gap-2 text-sm font-medium ${toast.type === "error" ? "text-rose-600" : "text-emerald-700"}`}>
                {toast.type === "error" ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                {toast.text}
              </p>
            ) : (
              <p className="flex items-center gap-2 text-sm font-medium text-ink-700">
                <span className="h-2 w-2 rounded-full bg-saffron-500" /> You have unpublished changes
              </p>
            )}
            {dirty && (
              <div className="flex gap-2">
                <button type="button" onClick={() => setContent(original)} className="btn-ghost flex-1 px-4 py-2.5 sm:flex-none">
                  <RotateCcw className="h-4 w-4" /> Discard
                </button>
                <button type="button" onClick={handleSave} disabled={saving} className="btn-primary flex-1 px-5 py-2.5 sm:flex-none">
                  {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Publish
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
