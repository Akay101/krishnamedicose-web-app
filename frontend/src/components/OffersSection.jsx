import { useState, useEffect, useRef } from "react";
import {
  motion,
  AnimatePresence,
  useInView,
  useScroll,
  useTransform,
} from "framer-motion";
import {
  Sparkles,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Zap,
  Target,
  Cpu,
  BarChart3,
  Wallet,
  AlertCircle,
  ShieldCheck,
  Globe,
  FileText,
  Mail,
} from "lucide-react";
import axios from "axios";
import {
  InventoryVisual,
  AIScanningVisual,
  AgentVisual,
  FinancialVisual,
  CashflowVisual,
  AIInsightsVisual,
  ReportingVisual,
} from "./StorylineGraphics";
import { useModal } from "../context/ModalContext";

export default function OffersSection() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationId, setRegistrationId] = useState(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [usingSoftware, setUsingSoftware] = useState(null); // null, true, false
  const { showModal } = useModal();

  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { amount: 0.1, once: true });

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const resp = await axios.get(
          `${import.meta.env.VITE_API_URL}/offers?activeOnly=true`
        );
        setOffers(resp.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchOffers();
  }, []);

  const TERMS_AND_CONDITIONS = `
"50-50 Pre-Launch Registration Offer"
Terms & Conditions

By registering for the upcoming "50-50 Pre-Launch Offer" (50 Days Free for 50 Pharmacists) for our proprietary pharmacy billing and inventory software ("The Software"), you agree to the following terms and conditions:

1. Data Privacy & Confidentiality
All inventory and billing data entered into the Software will be securely stored and encrypted. The Company strictly prohibits the sharing, selling, or distribution of your business or customer data to any third parties. Data remains confidential and will only be disclosed if mandated by valid legal or governmental authorities.

2. 7-Day Inactivity Cancellation (Post-Launch)
This is an exclusive offer intended for active users. Upon the official launch of the Software and activation of your account, if the account registers zero activity (no login or billing entry) for seven (7) consecutive days, the free offer will be automatically revoked. The account will be blacklisted from this promotion, and subsequent access will require a standard paid subscription.

3. "As-Is" Service & Liability Disclaimer
As an early-access version, the Software is provided on an "as-is" basis and may undergo periodic maintenance or updates. The Company shall not be held legally or financially liable for any direct or indirect business loss, revenue loss, or data discrepancies resulting from temporary technical downtime or system errors.

4. Account Verification & Fair Usage
Registration and subsequent access require the submission of valid business credentials (e.g., GST or Drug License Number). The offer is strictly limited to one device/license per pharmacy. Any use of fraudulent details or misuse of the platform will result in immediate account termination.

5. Offer Expiration & Data Retention
The free access will automatically expire upon the completion of the 50-day period from the date of your account activation. Post-expiration, your business data will be securely retained for a grace period of thirty (30) days to facilitate a smooth transition to a paid plan. If the account is not upgraded within this timeframe, the data may be permanently deleted.

6. Right to Modify or Terminate
The Company reserves the right to amend, suspend, or terminate this offer, its terms, or its duration at any time, at its sole discretion, without prior notice.

7. Dynamic Limits on AI Features & Data Liability
The Software integrates various artificial intelligence (AI) tools and automated functionalities. The Company reserves the right to alter, restrict, suspend, or modify the usage limits of all AI features and general software fields at any time. These adjustments will be made at the Company’s sole discretion based on server load and infrastructure capacity. The Company shall not be liable for any temporary downtime or loss of data that may inadvertently occur due to system updates or modifications to these modules.

8. Device Permissions & System Access
To utilize the full functionality of the Software, you may be prompted to grant access to various device features and system permissions (including, but not limited to, the camera, local storage, file manager, and other necessary system sensors). By granting these permissions, you authorize their use strictly for the operational purposes of the Software. The Company does not conduct unauthorized background scans, nor do we monitor, extract, or misuse your personal files, private media, or any unrelated device data.

9. Intellectual Property Rights (IPR) & Restrictions
All rights, title, and interest in the Software, including its code, design, UI/UX, and AI algorithms, are the exclusive property of the Company. Users are granted a limited, non-transferable license to use the Software. You strictly agree not to copy, modify, distribute, sell, or reverse-engineer any part of the Software.

10. Complete Service Shutdown & Force Majeure
The Company strives for maximum uptime; however, we do not guarantee uninterrupted service. The Company shall not be liable for any total or partial software downtime, data loss, or business interruption caused by unforeseen circumstances, including but not limited to server crashes, cyber-attacks, natural disasters, internet outages, or a permanent discontinuation of the Software.

11. User Indemnification & Legal Compliance
The Software is strictly a digital tool for inventory and billing management. The Company is not responsible for the legality of the products you sell, your tax filings, or valid prescription handling. You agree to indemnify and hold the Company harmless against any lawsuits, penalties, or claims arising from your business operations, illegal sales, or misuse of the Software.

12. Third-Party Integrations & External Links
The Software may utilize third-party services (e.g., SMS gateways, cloud APIs). The Company holds no responsibility for the failures, downtime, or policy changes of these external service providers.

13. Age, Eligibility & Communication Consent
By registering, you confirm that you are at least 18 years of age and a legally authorized representative of the pharmacy. Furthermore, you grant explicit consent to the Company to send you transactional, promotional, and operational updates regarding the Software launch via SMS, WhatsApp, Email, or phone calls.

14. Governing Law & Severability
These Terms shall be governed by the laws of the Company’s registered jurisdiction. If any single provision is found to be unenforceable under applicable law, it shall not render the entire agreement void, and the remaining provisions will continue in full force.
  `;

  const handleShowTerms = () => {
    showModal({
      title: "Terms & Conditions",
      message: TERMS_AND_CONDITIONS,
      type: "info",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    const offer = offers[0];
    if (!offer) return;

    let firstErrorField = null;
    const newErrors = {};

    // 1. Validate Software Selection
    if (usingSoftware === null) {
      newErrors['software_usage'] = 'Please select your software usage status';
      if (!firstErrorField) firstErrorField = 'software_usage';
    }

    // 2. Validate Dynamic Fields
    offer.formFields.forEach(field => {
      // Check if field is visible based on conditional logic
      const isSoftwareField = field.label.toUpperCase().includes('CURRENT SOFTWARE') || field.label.toUpperCase().includes('PROBLEMS');
      const isGlobalField = field.name === "name" || field.name === "mobile" || field.name === "email" || field.name === "pharmacy_name" || field.name === "location" || field.type === "file";
      
      let isVisible = isGlobalField;
      if (!isGlobalField && usingSoftware !== null) {
        isVisible = usingSoftware ? isSoftwareField : !isSoftwareField;
      }

      if (isVisible) {
        // Special mandatory overrides
        const isPhoto = field.label.toLowerCase().includes('photo') || field.label.toLowerCase().includes('document');
        const isDrugLicense = field.label.toLowerCase().includes('drug license');
        const isRequired = isPhoto ? true : (isDrugLicense ? false : field.required);

        if (isRequired && !formData[field.name]) {
          newErrors[field.name] = `${field.label} is required`;
          if (!firstErrorField) firstErrorField = field.name;
        } else if (field.validation && formData[field.name] && field.type !== 'file') {
          const regex = new RegExp(field.validation);
          if (!regex.test(formData[field.name])) {
            newErrors[field.name] = `Invalid format for ${field.label}`;
            if (!firstErrorField) firstErrorField = field.name;
          }
        }
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      // Focus the first error field
      const element = document.getElementsByName(firstErrorField)[0] || document.getElementById(firstErrorField);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.focus();
      }
      return;
    }

    setIsSubmitting(true);
    try {
      const data = new FormData();
      data.append("offerId", offer._id);
      Object.entries(formData).forEach(([key, value]) =>
        data.append(key, value)
      );

      const resp = await axios.post(
        `${import.meta.env.VITE_API_URL}/offers/register`,
        data,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      setRegistrationId(resp.data.registrationId);
    } catch (err) {
      showModal({
        title: "Submission Failed",
        message: err.response?.data?.message || "Registration failed.",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const features = [
    {
      id: "inventory",
      tag: "AI Intelligence",
      icon: Cpu,
      title: "Smart Inventory & Scanning",
      description:
        "Auto-add products with AI image recognition. Bill scanning integrated.",
      graphic: <AIScanningVisual />,
      color: "from-primary/20 to-transparent",
      borderColor: "border-primary/20",
    },
    {
      id: "insights",
      tag: "AI Insights",
      icon: Zap,
      title: "Predictive Analytics",
      description:
        "AI-driven sales predictions and stock optimization suggestions.",
      graphic: <AIInsightsVisual />,
      color: "from-secondary/20 to-transparent",
      borderColor: "border-secondary/20",
    },
    {
      id: "billing",
      tag: "Financials",
      icon: BarChart3,
      title: "Synchronized Billing",
      description:
        "Real-time Profit & Loss trackers with detailed net revenue stats.",
      graphic: <FinancialVisual />,
      color: "from-green-400/20 to-transparent",
      borderColor: "border-green-400/20",
    },
    {
      id: "cashflow",
      tag: "Cashflow",
      icon: Wallet,
      title: "Smart Debts & Receivables",
      description: "Automated supplier and customer dues management system.",
      graphic: <CashflowVisual />,
      color: "from-primary/20 to-transparent",
      borderColor: "border-primary/20",
    },
    {
      id: "reporting",
      tag: "Compliance",
      icon: Target,
      title: "Automated GST Reports",
      description:
        "One-click compliance reports and audit-ready documentation.",
      graphic: <ReportingVisual />,
      color: "from-secondary/20 to-transparent",
      borderColor: "border-secondary/20",
    },
    {
      id: "access",
      tag: "Secure",
      icon: ShieldCheck,
      title: "Cloud Security",
      description:
        "Enterprise-grade encryption for all your pharmaceutical data.",
      graphic: <InventoryVisual />,
      color: "from-blue-400/20 to-transparent",
      borderColor: "border-blue-400/20",
    },
  ];

  if (loading) return null;
  const mainOffer = offers[0];

  return (
    <section
      ref={containerRef}
      id="offers"
      className="relative min-h-screen bg-white overflow-hidden py-32 border-t border-slate-200/80"
    >
      {/* Immersive Environment Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-teal-100/15 blur-[120px] rounded-full" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-sky-100/15 blur-[120px] rounded-full" />
        <div 
          className="absolute inset-0 opacity-[0.08] mix-blend-overlay" 
          style={{ 
            backgroundImage: `url("data:image/svg+xml;utf8,<svg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'><filter id='noiseFilter'><feTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23noiseFilter)'/></svg>")` 
          }} 
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Header Section */}
        <div className="mb-24 text-center max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-teal-50 border border-teal-200/80 text-teal-800 text-[10px] font-black uppercase tracking-[0.4em] mb-12 shadow-sm"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-600"></span>
            </span>
            Built by Krishna Medicose
          </motion.div>

          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-4xl sm:text-7xl md:text-9xl font-black font-outfit text-slate-900 leading-[1.1] mb-10 tracking-tighter"
          >
            Our Pharmacy <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 via-sky-600 to-teal-600 bg-300% animate-gradient italic">Software</span>
          </motion.h2>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="relative inline-block"
          >
            <p className="text-2xl md:text-4xl font-black text-slate-700 font-outfit tracking-tight mb-8">
              "Redefining Pharmacy Management through Intelligence"
            </p>
            <div className="absolute -bottom-2 left-0 w-full h-px bg-gradient-to-r from-transparent via-teal-500/20 to-transparent" />
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="text-lg text-slate-600 max-w-2xl mx-auto mt-8 font-bold leading-relaxed"
          >
            We've combined decades of pharmaceutical expertise with
            state-of-the-art AI to build the only ecosystem your pharmacy will
            ever need.
          </motion.p>
        </div>

        {/* Feature Universe Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-32">
          {features.map((feature, idx) => (
            <motion.div
              key={feature.id}
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: "0px" }}
              transition={{ delay: idx * 0.05, duration: 0.4 }}
              whileHover={{ y: -6 }}
              className="group relative aspect-[4/5] overflow-hidden rounded-[3rem] border border-slate-200/80 bg-white p-8 flex flex-col justify-between transition-all duration-500 hover:border-slate-350 hover:shadow-lg"
            >
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-teal-600"
                  >
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                    {feature.tag}
                  </span>
                </div>
                <h3 className="text-2xl font-extrabold text-slate-900 mb-2 font-outfit">
                  {feature.title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed font-bold">
                  {feature.description}
                </p>
              </div>

              {/* Graphic Container */}
              <div className="absolute inset-0 top-1/3 opacity-65 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none scale-90 group-hover:scale-100 transform transition-transform">
                {feature.graphic}
              </div>

              {/* Subtle Gradient Overlay */}
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none" />
            </motion.div>
          ))}
        </div>

        {/* The 50-50 Master Offer */}
        <div className="relative">
          <div className="absolute inset-0 bg-teal-100/20 blur-[120px] rounded-full" />

          <motion.div
            initial={{ opacity: 0, y: 100 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative bg-white rounded-2xl sm:rounded-[4rem] border border-slate-200 shadow-xl mx-auto w-full overflow-hidden"
          >
            <div className="grid lg:grid-cols-2">
              {/* Left Side: Offer Info */}
              <div className="px-4 py-10 sm:p-12 lg:p-20 flex flex-col space-y-8 sm:space-y-12 bg-gradient-to-br from-teal-50/40 to-transparent overflow-hidden">
                <div>
                  <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-teal-50 border border-teal-200/80 text-teal-800 text-[10px] font-black uppercase tracking-[0.4em] mb-8">
                    Exclusive Launch Offer
                  </div>

                  <h2 className="text-4xl sm:text-7xl md:text-9xl font-black font-outfit text-slate-900 leading-none tracking-tighter">
                    50-50 <br />
                    <span className="text-teal-600 italic">Access</span>
                  </h2>
                </div>

                <div className="grid gap-6">
                  {[
                    "Prioritized early access to the platform for pharmacy owners.",
                    "50 days of full premium access to all AI features completely free at launch.",
                    "Direct priority connect with our dedicated support team for any enquiries or issues.",
                    "Limited-slot fair usage: Access will be revoked if the account remains inactive for 7 consecutive days.",
                    "Permanent priority status in our queue for all upcoming offers and future launches.",
                    "Program exclusively for genuine pharmacy owners committed to modernizing their management.",
                  ].map((text, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-start gap-4 group"
                    >
                      <div className="mt-1.5 w-5 h-5 rounded-full border border-teal-300 flex items-center justify-center shrink-0 group-hover:bg-teal-50 transition-colors">
                        <div className="w-1.5 h-1.5 rounded-full bg-teal-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-700 text-sm font-bold leading-relaxed break-words">
                          {text}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  className="p-5 sm:p-8 bg-red-50 border border-red-200 rounded-2xl sm:rounded-[2.5rem] flex flex-col sm:flex-row gap-4 sm:gap-5"
                >
                  <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-650 shrink-0 mt-0.5" />
                  <div className="space-y-1 flex-1 min-w-0">
                    <p className="text-[10px] sm:text-xs font-extrabold text-red-700 uppercase tracking-widest">
                      Important Disclaimer
                    </p>
                    <p className="text-[10px] sm:text-xs text-red-800/80 font-bold leading-relaxed break-words">
                      Registration requires a valid Drug License. Submission of
                      incorrect details or invalid documents will lead to
                      immediate disqualification from the early access queue.
                    </p>
                  </div>
                </motion.div>
              </div>

              {/* Right Side: Registration Form */}
              <div className="px-4 py-10 sm:p-12 lg:p-20 bg-slate-50 border-l border-slate-200/80 relative overflow-hidden">
                {/* Decorative glow for form */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-teal-600/5 blur-[100px] -z-10" />

                {registrationId ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="h-full flex flex-col items-center justify-center text-center space-y-8"
                  >
                    <motion.div
                      animate={{
                        scale: [1, 1.05, 1],
                      }}
                      transition={{ duration: 4, repeat: Infinity }}
                      className="w-32 h-32 bg-teal-50 rounded-full flex items-center justify-center border border-teal-200 shadow-md shadow-teal-500/5"
                    >
                      <CheckCircle2 className="w-16 h-16 text-teal-600" />
                    </motion.div>

                    <div className="space-y-2">
                      <h3 className="text-4xl font-black text-slate-900 font-outfit">
                        Spot Reserved!
                      </h3>
                      <p className="text-slate-600 font-bold">
                        Welcome to the future of pharmacy management.
                      </p>
                    </div>

                    <div className="bg-white p-8 rounded-[3rem] border border-slate-200 w-full relative overflow-hidden group shadow-sm">
                      <div className="absolute inset-0 bg-gradient-to-r from-teal-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-[0.3em] mb-3">
                        Your Priority Access ID
                      </p>
                      <p className="text-4xl font-mono text-teal-600 tracking-tighter font-black">
                        {registrationId}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 text-slate-650">
                      <Mail className="w-4 h-4 text-teal-600" />
                      <p className="text-sm font-bold italic">
                        Check your inbox for onboarding details.
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-6">
                        {mainOffer?.formFields
                           ? mainOffer.formFields
                               .filter(
                                 (f) => f.name === "name" || f.name === "mobile" || f.name === "email" || f.name === "pharmacy_name" || f.name === "location"
                               )
                               .map((field) => (
                                 <FormField
                                   key={field.name}
                                   field={field}
                                   formData={formData}
                                   setFormData={setFormData}
                                   error={errors[field.name]}
                                 />
                               ))
                           : null}
                      </div>

                      {/* Software Usage Radio Buttons */}
                      <div 
                        id="software_usage"
                        className={`space-y-4 p-6 bg-white rounded-[2rem] border transition-colors ${errors['software_usage'] ? 'border-red-400/50 bg-red-400/5 animate-shake' : 'border-slate-200'}`}
                      >
                        <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-[0.4em] ml-2 flex items-center gap-2">
                          Are you using any current software? *
                          {errors['software_usage'] && <span className="text-red-500 normal-case tracking-normal">({errors['software_usage']})</span>}
                        </label>
                        <div className="grid grid-cols-2 gap-3 sm:gap-6">
                          {[
                            { label: 'Yes, I am', value: true },
                            { label: 'No, I am not', value: false }
                          ].map((opt) => (
                            <button
                              key={opt.label}
                              type="button"
                              onClick={() => {
                                setUsingSoftware(opt.value);
                                setErrors(prev => {
                                  const n = {...prev};
                                  delete n.software_usage;
                                  return n;
                                });
                              }}
                              className={`py-4 px-3 sm:px-6 rounded-xl sm:rounded-2xl border transition-all text-xs sm:text-sm font-bold flex items-center justify-center gap-2 sm:gap-3 ${
                                usingSoftware === opt.value 
                                  ? 'bg-teal-50 border-teal-500 text-teal-800' 
                                  : 'bg-white border-slate-200 text-slate-650 hover:border-slate-350'
                              }`}
                            >
                              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${usingSoftware === opt.value ? 'border-teal-500' : 'border-slate-400'}`}>
                                {usingSoftware === opt.value && <div className="w-2 h-2 rounded-full bg-teal-500" />}
                              </div>
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Conditional Fields */}
                      {usingSoftware !== null && (
                        <>
                          {mainOffer?.formFields
                            ? mainOffer.formFields
                               .filter((f) => {
                                 const isSoftwareField = f.label.toUpperCase().includes('CURRENT SOFTWARE') || f.label.toUpperCase().includes('PROBLEMS');
                                 const isGlobalField = 
                                   f.name === "name" || 
                                   f.name === "mobile" || 
                                   f.name === "email" ||
                                   f.name === "pharmacy_name" || 
                                   f.name === "location" ||
                                   f.type === "file";
                                 
                                 if (isGlobalField) return false; 
                                 
                                 if (usingSoftware) {
                                     return isSoftwareField;
                                 } else {
                                     return !isSoftwareField;
                                 }
                               })
                               .map((field) => {
                                 const isDrugLicense = field.label.toLowerCase().includes('drug license');
                                 const fieldOverride = isDrugLicense ? { ...field, required: false } : field;

                                 return (
                                   <FormField
                                     key={field.name}
                                     field={fieldOverride}
                                     formData={formData}
                                     setFormData={setFormData}
                                     error={errors[field.name]}
                                   />
                                 );
                               })
                            : null}
                        </>
                      )}

                      {/* Photo/File Field */}
                      {mainOffer?.formFields
                        ? mainOffer.formFields
                           .filter((f) => f.type === "file")
                           .map((field) => (
                             <div 
                               key={field.name} 
                               id={field.name}
                               className={`space-y-3 transition-colors ${errors[field.name] ? 'animate-shake' : ''}`}
                             >
                               <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-[0.4em] ml-2 flex items-center gap-2">
                                 {field.label} *
                                 {errors[field.name] && <span className="text-red-500 normal-case tracking-normal">(Required)</span>}
                               </label>
                               <div className={`relative group h-20 rounded-[2rem] border transition-all ${errors[field.name] ? 'border-red-400/50 bg-red-400/5' : 'border-slate-200 bg-white'}`}>
                                 <input
                                   type="file"
                                   name={field.name}
                                   accept="image/*,application/pdf"
                                   onChange={(e) => {
                                     setFormData({
                                       ...formData,
                                       [field.name]: e.target.files[0],
                                     });
                                     setErrors(prev => {
                                       const n = {...prev};
                                       delete n[field.name];
                                       return n;
                                     });
                                   }}
                                   className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                 />
                                 <div className="absolute inset-0 rounded-[2rem] flex items-center justify-between px-8 group-hover:border-teal-500/50 group-hover:bg-slate-50/50 transition-all duration-300">
                                   <div className="flex items-center gap-4 min-w-0">
                                     <div
                                       className={`p-2 rounded-lg ${formData[field.name] ? "bg-teal-50 text-teal-600" : "bg-slate-100 text-slate-550"}`}
                                     >
                                       <FileText className="w-5 h-5" />
                                     </div>
                                     <span className="text-sm text-slate-700 truncate font-bold">
                                       {formData[field.name]?.name ||
                                         field.placeholder ||
                                         "Upload Document / Photo"}
                                     </span>
                                   </div>
                                   <CheckCircle2
                                     className={`w-5 h-5 transition-colors ${formData[field.name] ? "text-teal-600" : "text-slate-300"}`}
                                   />
                                 </div>
                               </div>
                             </div>
                           ))
                        : null}
                    </div>

                    <div className="space-y-6">
                      <div className="flex items-start gap-3 p-4 bg-white rounded-2xl border border-slate-200 group hover:border-teal-300 transition-colors">
                        <div className="relative flex items-center h-5">
                          <input
                            id="terms"
                            type="checkbox"
                            checked={termsAccepted}
                            onChange={(e) => setTermsAccepted(e.target.checked)}
                            className="w-5 h-5 rounded border-slate-300 bg-white text-teal-650 focus:ring-teal-500/20 cursor-pointer"
                          />
                        </div>
                        <div className="flex flex-col">
                          <label
                            htmlFor="terms"
                            className="text-xs text-slate-500 cursor-pointer select-none font-bold"
                          >
                            I agree to the{" "}
                            <span className="text-slate-900 font-extrabold">
                              50-50 Pre-Launch Registration Offer
                            </span>{" "}
                            terms.
                          </label>
                          <button
                            type="button"
                            onClick={handleShowTerms}
                            className="text-[10px] text-teal-600 font-extrabold uppercase tracking-widest mt-2 flex items-center gap-1 hover:gap-2 transition-all"
                          >
                            View Full Terms <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      <div className="pt-4">
                        <button
                          type="submit"
                          disabled={isSubmitting || !termsAccepted}
                          className={`w-full py-6 rounded-[2rem] flex items-center justify-center gap-4 font-black uppercase tracking-[0.2em] transition-all shadow-md group relative overflow-hidden ${
                            termsAccepted
                              ? "bg-teal-600 text-white hover:bg-teal-700 hover:scale-[1.02] active:scale-[0.98] shadow-teal-600/10"
                              : "bg-slate-200 text-slate-400 cursor-not-allowed opacity-60"
                          }`}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                          {isSubmitting ? (
                            <Loader2 className="w-6 h-6 animate-spin" />
                          ) : (
                            <>
                              Secure My Priority Access
                              <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                            </>
                          )}
                        </button>

                        <div className="mt-8 flex items-center justify-center gap-6 opacity-40">
                          <div className="h-px w-12 bg-slate-300" />
                          <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.3em] whitespace-nowrap">
                            Powered by Krishna Medicose
                          </p>
                          <div className="h-px w-12 bg-slate-300" />
                        </div>
                      </div>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function FormField({ field, formData, setFormData, error }) {
  return (
    <motion.div 
      animate={error ? { x: [-10, 10, -10, 10, 0] } : {}}
      transition={{ duration: 0.4 }}
      className="space-y-3"
    >
      <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-[0.4em] ml-2 flex items-center gap-2">
        {field.label} {field.required && '*'}
        {error && <span className="text-red-500 normal-case tracking-normal">({error})</span>}
      </label>
      
      {field.type === 'textarea' ? (
        <textarea
          name={field.name}
          required={field.required}
          placeholder={field.placeholder}
          onChange={e => setFormData({...formData, [field.name]: e.target.value})}
          className={`w-full bg-white border rounded-[2rem] p-6 focus:border-teal-500/50 focus:bg-slate-50 outline-none transition-all text-sm resize-none font-bold text-slate-800 placeholder:text-slate-400 ${error ? 'border-red-400/50 bg-red-400/5' : 'border-slate-200'}`}
          rows={3}
        />
      ) : (
        <input
          name={field.name}
          type={field.type}
          required={field.required}
          placeholder={field.placeholder}
          onChange={e => setFormData({...formData, [field.name]: e.target.value})}
          className={`w-full bg-white border rounded-2xl sm:rounded-[2rem] px-5 py-4 sm:p-6 focus:border-teal-500/50 focus:bg-slate-50 outline-none transition-all text-sm font-bold text-slate-800 placeholder:text-slate-400 ${error ? 'border-red-400/50 bg-red-400/5' : 'border-slate-200'}`}
        />
      )}
    </motion.div>
  );
}
