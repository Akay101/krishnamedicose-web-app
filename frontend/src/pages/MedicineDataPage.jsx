import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  Mail,
  Phone,
  User,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  FileSpreadsheet,
  Loader2,
  Search,
  Lock,
  Key,
  LogOut,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import Navbar from "../components/Navbar";
import InteractiveBackground from "../components/InteractiveBackground";
import api from "../utils/api";
import { useModal } from "../context/ModalContext";

export default function MedicineDataPage() {
  // Tabs: 'purchase' or 'login'
  const [activeTab, setActiveTab] = useState("purchase");
  const { showModal } = useModal();

  // Checkout States
  const [checkoutForm, setCheckoutForm] = useState({
    name: "",
    email: "",
    mobile: "",
  });
  const [price, setPrice] = useState(999);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");

  // Login & Verification States
  const [loginEmail, setLoginEmail] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [verificationError, setVerificationError] = useState("");

  // Secure Session & Data States
  const [token, setToken] = useState(
    localStorage.getItem("bundle_token") || "",
  );
  const [currentUser, setCurrentUser] = useState(
    JSON.parse(localStorage.getItem("bundle_user")) || null,
  );
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 1,
  });
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState("");
  const [isBlurred, setIsBlurred] = useState(false);

  // Fetch dynamic bundle price from backend config
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const resp = await api.get("/medicine-bundle/config");
        setPrice(resp.data.amount);
      } catch (err) {
        console.error(
          "Failed to fetch medicine bundle configuration amount:",
          err,
        );
      }
    };
    fetchConfig();
  }, []);

  // Dynamically load Cashfree SDK on mount
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  // Fetch secure dataset (runs when token changes or page/search changes)
  useEffect(() => {
    if (!token) return;

    const fetchDataset = async () => {
      setDataLoading(true);
      setDataError("");
      try {
        const resp = await api.get("/medicine-bundle/data", {
          headers: { Authorization: `Bearer ${token}` },
          params: { search, page, limit },
        });
        setData(resp.data.data);
        setPagination(resp.data.pagination);
      } catch (err) {
        console.error("Failed to fetch dataset:", err);
        const errCode = err.response?.data?.code;
        const errMsg =
          err.response?.data?.message || "Access denied or session expired.";

        if (errCode === "SESSION_EXPIRED" || err.response?.status === 401) {
          handleLogout();
          showModal({
            title: "Session Expired",
            message: errMsg,
            type: "error",
          });
        } else {
          setDataError(errMsg);
        }
      } finally {
        setDataLoading(false);
      }
    };

    const delayDebounce = setTimeout(
      () => {
        fetchDataset();
      },
      search ? 400 : 0,
    ); // Debounce search requests

    return () => clearTimeout(delayDebounce);
  }, [token, search, page]);

  // Anti-Theft Event Handlers (Focus Loss, Keydown, Right-click)
  useEffect(() => {
    if (!token) return;

    // 1. Blur table when window loses focus or user switches tab
    const handleBlur = () => setIsBlurred(true);
    const handleFocus = () => setIsBlurred(false);
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsBlurred(true);
      }
    };

    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // 2. Block right-click / context menu
    const handleContextMenu = (e) => {
      e.preventDefault();
    };
    document.addEventListener("contextmenu", handleContextMenu);

    // 3. Block keyboard shortcuts (Ctrl+C, Ctrl+S, Ctrl+P, F12, inspect tool)
    const handleKeyDown = (e) => {
      const isCtrl = e.ctrlKey || e.metaKey;
      const isShift = e.shiftKey;

      // Ctrl+C (Copy), Ctrl+S (Save), Ctrl+P (Print)
      if (
        isCtrl &&
        (e.key === "c" ||
          e.key === "C" ||
          e.key === "s" ||
          e.key === "S" ||
          e.key === "p" ||
          e.key === "P")
      ) {
        e.preventDefault();
        showModal({
          title: "Action Blocked",
          message:
            "Printing, copying, and saving dataset content is strictly prohibited for security compliance.",
          type: "warning",
        });
        return false;
      }

      // F12 (Inspect Element)
      if (e.key === "F12") {
        e.preventDefault();
        return false;
      }

      // Ctrl+Shift+I / J / C (Dev Tools)
      if (
        isCtrl &&
        isShift &&
        (e.key === "i" ||
          e.key === "I" ||
          e.key === "j" ||
          e.key === "J" ||
          e.key === "c" ||
          e.key === "C")
      ) {
        e.preventDefault();
        return false;
      }
    };
    document.addEventListener("keydown", handleKeyDown);

    // 4. Block copy, cut, and dragstart events
    const blockClipboard = (e) => e.preventDefault();
    document.addEventListener("copy", blockClipboard);
    document.addEventListener("cut", blockClipboard);
    document.addEventListener("dragstart", blockClipboard);

    return () => {
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("copy", blockClipboard);
      document.removeEventListener("cut", blockClipboard);
      document.removeEventListener("dragstart", blockClipboard);
    };
  }, [token]);

  // Checkout Initiation (Pay and Register)
  const handleCheckout = async (e) => {
    e.preventDefault();
    setCheckoutLoading(true);
    setCheckoutError("");

    try {
      const resp = await api.post(
        "/medicine-bundle/create-order",
        checkoutForm,
      );
      const { gateway, paymentSessionId, orderId, paymentUrl, isProduction } = resp.data;

      if (gateway === 'INSTAMOJO' || paymentUrl) {
        // Redirect directly to Instamojo payment request url
        window.location.href = paymentUrl;
        return;
      }

      if (!window.Cashfree) {
        throw new Error(
          "Cashfree SDK failed to load. Please refresh the page and try again.",
        );
      }

      const cashfree = window.Cashfree({
        mode: isProduction ? "production" : "sandbox",
      });

      let clientReturnUrl = `${window.location.origin}/medicine-data/verify-payment?order_id=${orderId}`;
      if (isProduction && clientReturnUrl.startsWith("http://")) {
        clientReturnUrl = clientReturnUrl.replace(/^http:\/\//, "https://");
      }

      cashfree.checkout({
        paymentSessionId,
        returnUrl: clientReturnUrl,
      });
    } catch (err) {
      console.error(err);
      setCheckoutError(
        err.response?.data?.message ||
          err.message ||
          "Payment initiation failed. Please try again.",
      );
      setCheckoutLoading(false);
    }
  };

  // Secure Login - Request Email OTP
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError("");
    try {
      const resp = await api.post("/medicine-bundle/login", {
        email: loginEmail,
      });
      setOtpSent(true);
    } catch (err) {
      console.error(err);
      setLoginError(err.response?.data?.message || "Access request failed.");
    } finally {
      setLoginLoading(false);
    }
  };

  // OTP Verification & Establish Secure Session
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setVerificationLoading(true);
    setVerificationError("");
    try {
      const resp = await api.post("/medicine-bundle/verify-otp", {
        email: loginEmail,
        otp,
      });
      const { token: sessionToken, user } = resp.data;

      localStorage.setItem("bundle_token", sessionToken);
      localStorage.setItem("bundle_user", JSON.stringify(user));

      setToken(sessionToken);
      setCurrentUser(user);
      setPage(1);
    } catch (err) {
      console.error(err);
      setVerificationError(
        err.response?.data?.message || "Verification failed.",
      );
    } finally {
      setVerificationLoading(false);
    }
  };

  // Logout Session
  const handleLogout = () => {
    localStorage.removeItem("bundle_token");
    localStorage.removeItem("bundle_user");
    setToken("");
    setCurrentUser(null);
    setOtpSent(false);
    setOtp("");
    setLoginEmail("");
    setData([]);
  };

  const bundleHighlights = [
    "500+ most sold medicines in Indian pharmacies with salt profiles.",
    "Comprehensive pricing structures (MRP, PTS, PTR) & profit margin details.",
    "Manufacturer, therapeutic class, and market share statistics.",
    "Fully structured dataset with indications and drug salt mappings.",
    "Verified data matching active retail and wholesale order books.",
  ];

  return (
    <main className="relative min-h-screen bg-slate-50 text-slate-900 selection:bg-teal-200 selection:text-teal-900 pb-20 select-none">
      {/* Block printing */}
      <style>{`
        @media print {
          body {
            display: none !important;
          }
        }
      `}</style>

      <InteractiveBackground />
      <Navbar />

      <div className="max-w-7xl mx-auto pt-40 px-6 lg:px-8">
        {/* SECURE VIEWER - AUTHENTICATED STATE */}
        {token && currentUser ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            {/* Control Dashboard */}
            <div className="bg-white border border-slate-200 rounded-[2rem] p-6 lg:p-8 shadow-lg flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-teal-50 rounded-2xl flex items-center justify-center text-teal-600 shrink-0">
                  <ShieldCheck className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h2 className="font-black text-xl font-outfit text-slate-900 flex items-center gap-2">
                    Secure Viewer
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 font-bold uppercase tracking-wider">
                      Active Session
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 font-bold">
                    Authenticated User:{" "}
                    <span className="text-slate-800 font-extrabold">
                      {currentUser.email}
                    </span>
                  </p>
                </div>
              </div>

              {/* Search & Actions */}
              <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                <div className="relative w-full sm:w-80 group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-teal-600 transition-colors" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                    placeholder="Search medicines or composition..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-11 pr-4 focus:outline-none focus:border-teal-500 focus:bg-white transition-all font-bold text-slate-800 text-sm"
                  />
                </div>

                <button
                  onClick={handleLogout}
                  className="w-full sm:w-auto px-6 py-3 rounded-2xl border border-red-200 text-red-600 hover:bg-red-50 font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Exit Session</span>
                </button>
              </div>
            </div>

            {/* Secure Data Grid Container */}
            <div className="relative bg-white border border-slate-200 rounded-[2.5rem] p-6 lg:p-10 shadow-xl overflow-hidden min-h-[500px]">
              {/* Repeating Watermark Grid */}
              <div className="absolute inset-0 pointer-events-none z-30 opacity-[0.05] grid grid-cols-2 md:grid-cols-4 gap-y-24 gap-x-12 select-none overflow-hidden origin-center rotate-[-15deg] scale-110">
                {Array.from({ length: 48 }).map((_, i) => (
                  <div
                    key={i}
                    className="text-[10px] md:text-xs font-black tracking-[0.25em] text-slate-800 uppercase whitespace-nowrap text-center select-none"
                  >
                    {currentUser.email} &bull; SECURE READ ONLY
                  </div>
                ))}
              </div>

              {/* Blur Shield when tab/focus lost */}
              <AnimatePresence>
                {isBlurred && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl z-40 flex flex-col items-center justify-center text-center p-8 select-none"
                  >
                    <div className="w-16 h-16 bg-white/10 rounded-full border border-white/20 flex items-center justify-center text-white mb-4">
                      <Lock className="w-8 h-8 animate-bounce" />
                    </div>
                    <h3 className="text-white text-2xl font-black font-outfit uppercase tracking-widest">
                      Viewer Locked
                    </h3>
                    <p className="text-slate-250 font-bold text-sm max-w-sm mt-2">
                      Viewer auto-locked for security because window focus was
                      lost. Return focus to resume viewing.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Data Table */}
              <div className="overflow-x-auto relative rounded-2xl border border-slate-100">
                {dataLoading ? (
                  <div className="flex flex-col items-center justify-center py-32 space-y-4">
                    <Loader2 className="w-12 h-12 text-teal-600 animate-spin" />
                    <p className="text-sm font-bold text-slate-500">
                      Decrypting secure dataset...
                    </p>
                  </div>
                ) : dataError ? (
                  <div className="flex flex-col items-center justify-center py-32 text-center p-6 space-y-4">
                    <AlertTriangle className="w-12 h-12 text-red-500" />
                    <p className="text-sm font-black text-slate-700">
                      {dataError}
                    </p>
                    <button
                      onClick={() => setPage(1)}
                      className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-slate-800"
                    >
                      <RefreshCw className="w-4 h-4" /> Try Reloading
                    </button>
                  </div>
                ) : data.length === 0 ? (
                  <div className="text-center py-32 text-slate-400 font-bold text-sm">
                    No matching medicine records found.
                  </div>
                ) : (
                  <table className="min-w-full divide-y divide-slate-100 text-left text-sm select-none">
                    <thead>
                      <tr className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-100">
                        <th className="px-6 py-4">Category</th>
                        <th className="px-6 py-4">Brand Name</th>
                        <th className="px-6 py-4">Salt / Composition</th>
                        <th className="px-6 py-4">Indications / Usage</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {data.map((row, idx) => (
                        <tr
                          key={idx}
                          className="hover:bg-slate-50/50 transition-colors border-b border-slate-50"
                        >
                          <td className="px-6 py-4 font-bold text-xs uppercase tracking-wider text-teal-700 shrink-0">
                            <span className="bg-teal-50 border border-teal-100 px-2 py-1 rounded-md">
                              {row["CATEGORY"] || "N/A"}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-extrabold text-slate-900 font-outfit">
                            {row["BRAND NAME"] || "N/A"}
                          </td>
                          <td className="px-6 py-4 text-xs font-bold font-mono text-slate-600 max-w-xs truncate">
                            {row["SALT / COMPOSITION"] || "N/A"}
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-500 font-bold max-w-sm leading-relaxed font-sans">
                            {row["DETAILS / USAGE"] || "N/A"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Pagination Controls */}
              {!dataLoading && !dataError && pagination.pages > 1 && (
                <div className="flex items-center justify-between border-t border-slate-100 pt-8 mt-6">
                  <p className="text-xs text-slate-500 font-bold">
                    Showing{" "}
                    <span className="text-slate-800 font-black">
                      {(pagination.page - 1) * pagination.limit + 1}
                    </span>{" "}
                    to{" "}
                    <span className="text-slate-800 font-black">
                      {Math.min(
                        pagination.page * pagination.limit,
                        pagination.total,
                      )}
                    </span>{" "}
                    of{" "}
                    <span className="text-slate-800 font-black">
                      {pagination.total}
                    </span>{" "}
                    items
                  </p>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setPage((p) => Math.max(p - 1, 1))}
                      disabled={page === 1}
                      className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-650 hover:bg-slate-50 disabled:opacity-50 disabled:pointer-events-none active:scale-95 transition-all"
                    >
                      Previous
                    </button>

                    <span className="text-xs font-extrabold text-slate-700">
                      Page {page} of {pagination.pages}
                    </span>

                    <button
                      onClick={() =>
                        setPage((p) => Math.min(p + 1, pagination.pages))
                      }
                      disabled={page === pagination.pages}
                      className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-650 hover:bg-slate-50 disabled:opacity-50 disabled:pointer-events-none active:scale-95 transition-all"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          /* AUTHENTICATION PORTAL (PURCHASE & OTP LOGIN) - UNAUTHENTICATED STATE */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            {/* Highlights Section */}
            <div className="lg:col-span-7 space-y-8">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-teal-50 border border-teal-200/60 rounded-full mb-6">
                  <Sparkles className="w-4 h-4 text-teal-600 animate-pulse" />
                  <span className="text-xs font-extrabold uppercase tracking-widest text-teal-700 font-outfit">
                    Premium Dataset
                  </span>
                </div>
                <h1 className="text-4xl lg:text-5xl font-black font-outfit leading-tight tracking-tight text-slate-900">
                  Popular Medicine <br />
                  <span className="text-gradient bg-gradient-to-r from-teal-600 to-sky-600 italic">
                    Market Intel Bundle
                  </span>
                </h1>
                <p className="text-base lg:text-lg text-slate-650 mt-4 leading-relaxed font-medium">
                  Gain competitive intelligence on pharmaceuticals sold most in
                  Indian pharmacies. Build models, optimize stock, and check
                  distributor wholesale rates.
                </p>
              </div>

              <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-md space-y-6">
                <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                  <div className="w-12 h-12 bg-teal-50 rounded-2xl flex items-center justify-center text-teal-600 shrink-0">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-900 font-outfit">
                      Structured Intel Database
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Instant secure access via email OTP login
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {bundleHighlights.map((item, idx) => (
                    <div key={idx} className="flex gap-3 items-start">
                      <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                      <span className="text-sm font-bold text-slate-700 leading-relaxed">
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-4 bg-sky-50/50 border border-sky-100/60 p-6 rounded-2xl">
                <ShieldCheck className="w-6 h-6 text-sky-600 shrink-0" />
                <p className="text-xs font-bold text-slate-600 leading-relaxed">
                  Secured Checkout & Authenticated DRM Viewer. Anti-theft
                  watermarks prevent unauthorized screenshots and recordings.
                </p>
              </div>
            </div>

            {/* Portal Tab Card */}
            <div className="lg:col-span-5">
              <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 lg:p-10 shadow-xl space-y-8">
                {/* Tab selectors */}
                <div className="grid grid-cols-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200/50">
                  <button
                    onClick={() => {
                      setActiveTab("purchase");
                      setLoginError("");
                      setVerificationError("");
                    }}
                    className={`py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                      activeTab === "purchase"
                        ? "bg-white text-slate-900 shadow-md"
                        : "text-slate-550 hover:text-slate-900"
                    }`}
                  >
                    Purchase
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab("login");
                      setCheckoutError("");
                    }}
                    className={`py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                      activeTab === "login"
                        ? "bg-white text-slate-900 shadow-md"
                        : "text-slate-550 hover:text-slate-900"
                    }`}
                  >
                    Secure Login
                  </button>
                </div>

                {/* TAB 1: PURCHASE / CHECKOUT */}
                {activeTab === "purchase" && (
                  <div className="space-y-6">
                    <div className="text-center pb-6 border-b border-slate-100">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">
                        Lifetime Access
                      </p>
                      <div className="flex items-baseline justify-center gap-2">
                        <span className="text-5xl font-black text-slate-900 font-outfit">
                          ₹{price}
                        </span>
                        <span className="text-sm font-bold text-slate-400">
                          one-time payment
                        </span>
                      </div>
                    </div>

                    <form onSubmit={handleCheckout} className="space-y-5">
                      <div>
                        <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-600 mb-2 ml-2">
                          Your Name
                        </label>
                        <div className="relative group">
                          <User className="absolute left-5 top-1/2 -translate-y-1/2 w-4 lg:w-5 h-4 lg:h-5 text-slate-400 group-focus-within:text-teal-650 transition-colors" />
                          <input
                            type="text"
                            required
                            placeholder="John Doe"
                            value={checkoutForm.name}
                            onChange={(e) =>
                              setCheckoutForm({
                                ...checkoutForm,
                                name: e.target.value,
                              })
                            }
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl lg:rounded-2xl py-3.5 pl-12 pr-6 focus:outline-none focus:border-teal-500 focus:bg-white transition-all font-bold text-slate-800 text-sm"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-600 mb-2 ml-2">
                          Email Address
                        </label>
                        <div className="relative group">
                          <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 lg:w-5 h-4 lg:h-5 text-slate-400 group-focus-within:text-teal-650 transition-colors" />
                          <input
                            type="email"
                            required
                            placeholder="john@example.com"
                            value={checkoutForm.email}
                            onChange={(e) =>
                              setCheckoutForm({
                                ...checkoutForm,
                                email: e.target.value,
                              })
                            }
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl lg:rounded-2xl py-3.5 pl-12 pr-6 focus:outline-none focus:border-teal-500 focus:bg-white transition-all font-bold text-slate-800 text-sm"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-600 mb-2 ml-2">
                          Mobile Number
                        </label>
                        <div className="relative group">
                          <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-4 lg:w-5 h-4 lg:h-5 text-slate-400 group-focus-within:text-teal-650 transition-colors" />
                          <input
                            type="tel"
                            required
                            placeholder="9999999999"
                            value={checkoutForm.mobile}
                            onChange={(e) =>
                              setCheckoutForm({
                                ...checkoutForm,
                                mobile: e.target.value,
                              })
                            }
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl lg:rounded-2xl py-3.5 pl-12 pr-6 focus:outline-none focus:border-teal-500 focus:bg-white transition-all font-bold text-slate-800 text-sm"
                          />
                        </div>
                      </div>

                      {checkoutError && (
                        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl text-center">
                          {checkoutError}
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={checkoutLoading}
                        className="w-full btn-primary py-4 mt-2 flex items-center justify-center gap-2 group relative overflow-hidden rounded-xl lg:rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-md transition-transform active:scale-95 disabled:opacity-50"
                      >
                        {checkoutLoading ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <>
                            <span>Pay & Unlock Bundle</span>
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                )}

                {/* TAB 2: SECURE OTP LOGIN */}
                {activeTab === "login" && (
                  <div className="space-y-6">
                    <div className="pb-4 border-b border-slate-100 text-center">
                      <Lock className="w-8 h-8 text-teal-600 mx-auto mb-2 animate-bounce" />
                      <h3 className="font-black font-outfit text-slate-900 text-lg">
                        Secure Access Login
                      </h3>
                      <p className="text-[11px] text-slate-500 font-bold mt-1 max-w-[240px] mx-auto">
                        Verification OTP will be sent to the email registered
                        during purchase.
                      </p>
                    </div>

                    {!otpSent ? (
                      /* Step 1: Send OTP Form */
                      <form onSubmit={handleRequestOtp} className="space-y-5">
                        <div>
                          <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-600 mb-2 ml-2">
                            Registered Email
                          </label>
                          <div className="relative group">
                            <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-teal-650 transition-colors" />
                            <input
                              type="email"
                              required
                              placeholder="john@example.com"
                              value={loginEmail}
                              onChange={(e) => setLoginEmail(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl lg:rounded-2xl py-3.5 pl-12 pr-6 focus:outline-none focus:border-teal-500 focus:bg-white transition-all font-bold text-slate-800 text-sm"
                            />
                          </div>
                        </div>

                        {loginError && (
                          <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl text-center">
                            {loginError}
                          </div>
                        )}

                        <button
                          type="submit"
                          disabled={loginLoading}
                          className="w-full btn-primary py-4 flex items-center justify-center gap-2 group relative overflow-hidden rounded-xl lg:rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-md transition-transform active:scale-95 disabled:opacity-50"
                        >
                          {loginLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <>
                              <span>Send Verification OTP</span>
                              <Key className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                            </>
                          )}
                        </button>
                      </form>
                    ) : (
                      /* Step 2: Verify OTP Form */
                      <form onSubmit={handleVerifyOtp} className="space-y-5">
                        <div className="p-3 bg-teal-50/50 border border-teal-100 rounded-xl text-center">
                          <p className="text-xs font-bold text-teal-850 leading-relaxed">
                            Verification OTP sent to{" "}
                            <span className="font-extrabold text-teal-900">
                              {loginEmail}
                            </span>
                            .
                          </p>
                          <button
                            type="button"
                            onClick={() => setOtpSent(false)}
                            className="text-[10px] text-teal-650 font-extrabold uppercase tracking-wider underline mt-1.5 hover:text-teal-700"
                          >
                            Change Email
                          </button>
                        </div>

                        <div>
                          <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-600 mb-2 ml-2">
                            Enter 6-Digit OTP
                          </label>
                          <div className="relative group">
                            <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-teal-650 transition-colors" />
                            <input
                              type="text"
                              required
                              maxLength={6}
                              placeholder="123456"
                              value={otp}
                              onChange={(e) => setOtp(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl lg:rounded-2xl py-3.5 pl-12 pr-6 focus:outline-none focus:border-teal-500 focus:bg-white transition-all font-bold tracking-[0.5em] text-center text-slate-800 text-sm animate-pulse"
                            />
                          </div>
                        </div>

                        {verificationError && (
                          <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl text-center">
                            {verificationError}
                          </div>
                        )}

                        <button
                          type="submit"
                          disabled={verificationLoading}
                          className="w-full btn-primary py-4 flex items-center justify-center gap-2 group relative overflow-hidden rounded-xl lg:rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-md transition-transform active:scale-95 disabled:opacity-50"
                        >
                          {verificationLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <>
                              <span>Verify & Access Dataset</span>
                              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </>
                          )}
                        </button>
                      </form>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
