import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  Briefcase,
  Stethoscope,
  MapPin,
  Search,
  Filter,
  Plus,
  Users,
  CheckCircle2,
  Clock,
  DollarSign,
  Phone,
  Mail,
  ShieldCheck,
  Award,
  ChevronRight,
  LogOut,
  Navigation,
  FileText,
  AlertCircle,
  Loader2,
  Check,
  ArrowRight,
  Trash2,
  Edit,
  Eye,
  Sliders,
  Bell,
  Globe,
  Lock,
  X,
} from "lucide-react";
import servicesApi from "../utils/servicesApi";
import { translations } from "../utils/servicesTranslations";
import ServicesAuthModal from "../components/services/ServicesAuthModal";
import CreateJobModal from "../components/services/CreateJobModal";
import CreateCollabModal from "../components/services/CreateCollabModal";
import ApplyJobModal from "../components/services/ApplyJobModal";
import InquireCollabModal from "../components/services/InquireCollabModal";
import ViewApplicantsModal from "../components/services/ViewApplicantsModal";
import ViewInquiriesModal from "../components/services/ViewInquiriesModal";
import ChangeLocationModal from "../components/services/ChangeLocationModal";
import ScrollableFeedContainer from "../components/services/ScrollableFeedContainer";
import ListingDetailsModal from "../components/services/ListingDetailsModal";

export default function ServicesPage() {
  // Language state (en or hi)
  const [lang, setLang] = useState(() => {
    return localStorage.getItem("services_lang") || "en";
  });

  const t = translations[lang] || translations.en;

  const toggleLanguage = () => {
    const newLang = lang === "en" ? "hi" : "en";
    setLang(newLang);
    localStorage.setItem("services_lang", newLang);
  };

  // Current authenticated user state
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem("service_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Modals state
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState("register"); // 'register' or 'login'
  const [authInitialRole, setAuthInitialRole] = useState(null);
  const [authInitialSubRole, setAuthInitialSubRole] = useState(null);
  const [createJobModalOpen, setCreateJobModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [createCollabModalOpen, setCreateCollabModalOpen] = useState(false);
  const [editingCollab, setEditingCollab] = useState(null);
  const [applyModalJob, setApplyModalJob] = useState(null);
  const [inquireModalCollab, setInquireModalCollab] = useState(null);
  const [applicantsModalJob, setApplicantsModalJob] = useState(null);
  const [inquiriesModalCollab, setInquiriesModalCollab] = useState(null);
  const [changeLocationModalOpen, setChangeLocationModalOpen] = useState(false);
  const [detailsModalItem, setDetailsModalItem] = useState(null);
  const [detailsModalType, setDetailsModalType] = useState("job"); // 'job' | 'collab' | 'pharmacist' | 'doctor'

  // Centralized action gate: require sign in for ANY action (apply, inquire, see details, contact)
  const requireAuthAction = (
    actionCallback,
    intendedRole = null,
    intendedSubRole = null
  ) => {
    if (!currentUser) {
      setAuthInitialMode("login");
      if (intendedRole) setAuthInitialRole(intendedRole);
      if (intendedSubRole) setAuthInitialSubRole(intendedSubRole);
      setAuthModalOpen(true);
      return false;
    }
    if (typeof actionCallback === "function") {
      actionCallback();
    }
    return true;
  };

  // 2 Primary Tabs: 'pharmacists' or 'doctors'
  const [mainTab, setMainTab] = useState(() => {
    try {
      const savedUser = localStorage.getItem("service_user");
      if (savedUser) {
        const u = JSON.parse(savedUser);
        if (u.role === "doctor") return "doctors";
      }
    } catch {}
    return "pharmacists";
  });

  // Notifications state
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotificationsDropdown, setShowNotificationsDropdown] =
    useState(false);
  const notifRef = useRef(null);

  // Active view tab (sub-tabs within role dashboards)
  const [activeTab, setActiveTab] = useState("main");

  // Data states
  const [myJobs, setMyJobs] = useState([]);
  const [myCollabs, setMyCollabs] = useState([]);
  const [jobFeed, setJobFeed] = useState([]);
  const [collabFeed, setCollabFeed] = useState([]);
  const [openPharmacists, setOpenPharmacists] = useState([]);
  const [openDoctors, setOpenDoctors] = useState([]);
  const [myApplications, setMyApplications] = useState([]);
  const [myInquiries, setMyInquiries] = useState([]);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRadius, setSelectedRadius] = useState("50");

  // Loading & action states
  const [loadingData, setLoadingData] = useState(false);
  const [togglingAvailability, setTogglingAvailability] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  // Close notifications dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotificationsDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sync auth state
  useEffect(() => {
    const handleAuthChange = () => {
      try {
        const saved = localStorage.getItem("service_user");
        setCurrentUser(saved ? JSON.parse(saved) : null);
      } catch {
        setCurrentUser(null);
      }
    };

    window.addEventListener("service_auth_change", handleAuthChange);
    return () =>
      window.removeEventListener("service_auth_change", handleAuthChange);
  }, []);

  // Fetch initial profile & notifications with 24h expiry verification
  useEffect(() => {
    const token = localStorage.getItem("service_token");
    if (!token) return;

    // Check if 24-hour token session has expired
    let isExpired = false;
    try {
      const parts = token.split(".");
      if (parts.length === 3) {
        const payload = JSON.parse(
          atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"))
        );
        if (payload.exp && payload.exp * 1000 <= Date.now()) {
          isExpired = true;
        }
      } else {
        isExpired = true;
      }
    } catch {
      isExpired = true;
    }

    if (isExpired) {
      localStorage.removeItem("service_token");
      localStorage.removeItem("service_user");
      setCurrentUser(null);
      return;
    }

    servicesApi
      .get("/auth/me")
      .then((res) => {
        setCurrentUser(res.data);
        localStorage.setItem("service_user", JSON.stringify(res.data));
      })
      .catch(() => {
        localStorage.removeItem("service_token");
        localStorage.removeItem("service_user");
        setCurrentUser(null);
      });

    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await servicesApi.get("/notifications");
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch (e) {
      console.warn("Could not fetch notifications:", e.message);
    }
  };

  const markAllNotificationsRead = async () => {
    try {
      await servicesApi.patch("/notifications/read-all");
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch view data depending on user role and active main tab
  useEffect(() => {
    loadViewData();
  }, [currentUser, activeTab, mainTab, selectedRadius, searchQuery]);

  const loadViewData = async () => {
    setLoadingData(true);
    try {
      const userCoords = currentUser?.location?.coordinates || [
        77.1025, 28.7041,
      ];
      const params = {
        lng: userCoords[0],
        lat: userCoords[1],
        radiusKm: selectedRadius === "All" ? "" : selectedRadius,
        search: searchQuery,
      };

      if (!currentUser) {
        const [jobsRes, collabsRes, talentPharmRes, talentDocRes] =
          await Promise.all([
            servicesApi.get("/jobs/feed", { params }),
            servicesApi.get("/collab-posts/feed", { params }),
            servicesApi
              .get("/talent/pharmacists", { params })
              .catch(() => ({ data: [] })),
            servicesApi
              .get("/talent/doctors", { params })
              .catch(() => ({ data: [] })),
          ]);
        setJobFeed(jobsRes.data || []);
        setCollabFeed(collabsRes.data || []);
        setOpenPharmacists(talentPharmRes.data || []);
        setOpenDoctors(talentDocRes.data || []);
      } else if (currentUser.role === "pharmacy_owner") {
        const [jobsRes, collabsRes, talentPharmRes, talentDocRes] =
          await Promise.all([
            servicesApi.get("/jobs/my-jobs"),
            servicesApi.get("/collab-posts/my-posts"),
            servicesApi.get("/talent/pharmacists", { params }),
            servicesApi.get("/talent/doctors", { params }),
          ]);
        setMyJobs(jobsRes.data || []);
        setMyCollabs(collabsRes.data || []);
        setOpenPharmacists(talentPharmRes.data || []);
        setOpenDoctors(talentDocRes.data || []);
      } else if (currentUser.role === "job_seeker_pharmacist") {
        const [jobsRes, myAppsRes, collabsRes, talentDocRes] =
          await Promise.all([
            servicesApi.get("/jobs/feed", { params }),
            servicesApi.get("/jobs/my-applications"),
            servicesApi
              .get("/collab-posts/feed", { params })
              .catch(() => ({ data: [] })),
            servicesApi
              .get("/talent/doctors", { params })
              .catch(() => ({ data: [] })),
          ]);
        setJobFeed(jobsRes.data || []);
        setMyApplications(myAppsRes.data || []);
        setCollabFeed(collabsRes.data || []);
        setOpenDoctors(talentDocRes.data || []);
      } else if (currentUser.role === "doctor") {
        const [collabsRes, myInqsRes, jobsRes, talentPharmRes] =
          await Promise.all([
            servicesApi.get("/collab-posts/feed", { params }),
            servicesApi.get("/collab-posts/my-inquiries"),
            servicesApi
              .get("/jobs/feed", { params })
              .catch(() => ({ data: [] })),
            servicesApi
              .get("/talent/pharmacists", { params })
              .catch(() => ({ data: [] })),
          ]);
        setCollabFeed(collabsRes.data || []);
        setMyInquiries(myInqsRes.data || []);
        setJobFeed(jobsRes.data || []);
        setOpenPharmacists(talentPharmRes.data || []);
      }
    } catch (err) {
      console.error("Error loading services data:", err);
    } finally {
      setLoadingData(false);
    }
  };

  // Toggle availability
  const handleToggleAvailability = async () => {
    setTogglingAvailability(true);
    try {
      const res = await servicesApi.patch("/auth/toggle-availability");
      setCurrentUser((prev) => {
        const updated = {
          ...prev,
          isOpenToWork:
            res.data.isOpenToWork !== undefined
              ? res.data.isOpenToWork
              : prev.isOpenToWork,
          isOpenToCollaborate:
            res.data.isOpenToCollaborate !== undefined
              ? res.data.isOpenToCollaborate
              : prev.isOpenToCollaborate,
        };
        localStorage.setItem("service_user", JSON.stringify(updated));
        return updated;
      });
      setStatusMessage(res.data.message);
      setTimeout(() => setStatusMessage(""), 3000);
    } catch (err) {
      alert(err.response?.data?.message || "Could not update status.");
    } finally {
      setTogglingAvailability(false);
    }
  };

  // Sign out
  const handleSignOut = () => {
    localStorage.removeItem("service_token");
    localStorage.removeItem("service_user");
    setCurrentUser(null);
    window.dispatchEvent(new Event("service_auth_change"));
  };

  // Delete Job
  const handleDeleteJob = async (jobId) => {
    if (!window.confirm("Delete this job vacancy?")) return;
    try {
      await servicesApi.delete(`/jobs/${jobId}`);
      setMyJobs((prev) => prev.filter((j) => j._id !== jobId));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete job post.");
    }
  };

  // Delete Collab
  const handleDeleteCollab = async (collabId) => {
    if (!window.confirm("Delete this collaboration listing?")) return;
    try {
      await servicesApi.delete(`/collab-posts/${collabId}`);
      setMyCollabs((prev) => prev.filter((c) => c._id !== collabId));
    } catch (err) {
      alert(
        err.response?.data?.message || "Failed to delete collaboration listing."
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-teal-500 selection:text-white">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="text-xs font-bold text-slate-500 hover:text-teal-700 transition-colors flex items-center gap-1 border border-slate-200 rounded-xl px-3 py-1.5 flex-shrink-0"
            >
              {t.backToMain || "Back"}
            </Link>
            <div className="h-6 w-[1px] bg-slate-200 hidden sm:block" />
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-600 animate-pulse flex-shrink-0" />
                <h1 className="text-base sm:text-lg font-extrabold text-slate-900 font-outfit tracking-tight truncate">
                  {t.siteTitle || "Find Jobs & Doctors"}
                </h1>
              </div>
              <p className="text-[11px] text-slate-500 hidden md:block truncate">
                {t.siteSubtitle || "Pharmacy Hiring & Doctor Network"}
              </p>
            </div>
          </div>

          {/* Right Controls: Language Toggle, Notifications, User */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {/* Hindi / English Toggle Button */}
            <button
              onClick={toggleLanguage}
              className="px-3 py-1.5 rounded-xl border border-teal-200 bg-teal-50/70 hover:bg-teal-100 text-teal-800 text-xs font-extrabold transition-all flex items-center gap-1.5"
              title="Toggle Hindi / English"
            >
              <Globe className="w-3.5 h-3.5 text-teal-700" />
              <span>{lang === "en" ? "हिन्दी" : "English"}</span>
            </button>

            {/* Notifications Bell (if logged in) */}
            {currentUser && (
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => {
                    setShowNotificationsDropdown(!showNotificationsDropdown);
                    if (unreadCount > 0) markAllNotificationsRead();
                  }}
                  className="p-2 rounded-xl text-slate-600 hover:text-teal-700 hover:bg-slate-100 transition-colors relative"
                  title={t.notifications || "Notifications"}
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-rose-600" />
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotificationsDropdown && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 z-50 animate-fade-in">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-teal-700" />
                        <h4 className="text-xs font-bold text-slate-900">
                          {t.notifications || "Notifications"}
                        </h4>
                      </div>
                      <span className="text-[10px] text-slate-400 font-semibold">
                        {notifications.length} Total
                      </span>
                    </div>

                    <div className="max-h-72 overflow-y-auto space-y-2">
                      {notifications.length === 0 ? (
                        <p className="text-xs text-slate-400 text-center py-6">
                          {t.noNotifications || "No notifications yet"}
                        </p>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n._id}
                            className={`p-3 rounded-xl border text-xs transition-colors ${
                              n.isRead
                                ? "bg-slate-50/50 border-slate-100 text-slate-600"
                                : "bg-teal-50/40 border-teal-200 text-slate-800"
                            }`}
                          >
                            <p className="font-bold text-slate-900">
                              {n.title}
                            </p>
                            <p className="text-[11px] text-slate-600 mt-0.5">
                              {n.message}
                            </p>
                            <span className="text-[10px] text-slate-400 mt-1 block">
                              {new Date(n.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* User Account / Auth Buttons */}
            {currentUser ? (
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Location with Change Modal trigger */}
                {currentUser.location?.city && (
                  <button
                    onClick={() => setChangeLocationModalOpen(true)}
                    className="hidden lg:flex items-center gap-1.5 text-[11px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl transition-colors"
                    title="Click to update location"
                  >
                    <MapPin className="w-3.5 h-3.5 text-teal-600" />
                    <span className="truncate max-w-[120px]">
                      {currentUser.location.city}
                    </span>
                    <span className="text-[10px] text-teal-700 underline">
                      Change
                    </span>
                  </button>
                )}

                {/* Availability Toggle */}
                {(currentUser.role === "job_seeker_pharmacist" ||
                  currentUser.role === "doctor") && (
                  <button
                    onClick={handleToggleAvailability}
                    disabled={togglingAvailability}
                    className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                      (
                        currentUser.role === "job_seeker_pharmacist"
                          ? currentUser.isOpenToWork
                          : currentUser.isOpenToCollaborate
                      )
                        ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                        : "bg-slate-100 text-slate-600 border-slate-300"
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        (
                          currentUser.role === "job_seeker_pharmacist"
                            ? currentUser.isOpenToWork
                            : currentUser.isOpenToCollaborate
                        )
                          ? "bg-emerald-600"
                          : "bg-slate-400"
                      }`}
                    />
                    <span>
                      {currentUser.role === "job_seeker_pharmacist"
                        ? currentUser.isOpenToWork
                          ? t.openToWork
                          : t.notSeekingWork
                        : currentUser.isOpenToCollaborate
                          ? t.openToCollab
                          : t.unavailable}
                    </span>
                  </button>
                )}

                <button
                  onClick={handleSignOut}
                  className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                  title={t.signOut || "Sign Out"}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {/* Clean distinct triggers: Login opens Login, Register opens Register */}
                <button
                  onClick={() => {
                    setAuthInitialMode("login");
                    setAuthModalOpen(true);
                  }}
                  className="px-3.5 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 rounded-xl border border-slate-200 hover:bg-slate-100 transition-all"
                >
                  {t.signInBtn || "Sign In"}
                </button>
                <button
                  onClick={() => {
                    setAuthInitialMode("register");
                    setAuthModalOpen(true);
                  }}
                  className="px-3.5 py-2 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-xl shadow-md transition-all flex items-center gap-1.5"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>{t.registerTitle || "Register"}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10 sm:space-y-14">
        {/* ================= PRIMARY 2-TAB CONTROLLER ================= */}
        <div className="flex flex-col items-center justify-center text-center space-y-3">
          <div className="inline-flex p-1.5 sm:p-2 bg-slate-200/90 rounded-3xl gap-2 shadow-inner border border-slate-300/60 max-w-lg w-full">
            <button
              onClick={() => {
                setMainTab("pharmacists");
                setActiveTab("main");
                setSearchQuery("");
              }}
              className={`flex-1 flex items-center justify-center gap-2 sm:gap-3 py-3 sm:py-3.5 px-4 sm:px-6 rounded-2xl font-extrabold text-xs sm:text-sm md:text-base transition-all ${
                mainTab === "pharmacists"
                  ? "bg-teal-700 text-white shadow-md"
                  : "text-slate-700 hover:text-slate-900 hover:bg-white/60"
              }`}
            >
              <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 text-teal-200" />
              <span>{t.tabPharmacists || "Pharmacists"}</span>
              <span
                className={`text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-bold ${
                  mainTab === "pharmacists"
                    ? "bg-white/20 text-white"
                    : "bg-slate-300/80 text-slate-700"
                }`}
              >
                {currentUser?.role === "pharmacy_owner"
                  ? myJobs.length
                  : jobFeed.length}
              </span>
            </button>
            {/* <button
              onClick={() => {
                setMainTab('doctors');
                setActiveTab('main');
                setSearchQuery('');
              }}
              className={`flex-1 flex items-center justify-center gap-2 sm:gap-3 py-3 sm:py-3.5 px-4 sm:px-6 rounded-2xl font-extrabold text-xs sm:text-sm md:text-base transition-all ${
                mainTab === 'doctors'
                  ? 'bg-emerald-700 text-white shadow-md'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Stethoscope className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-200" />
              <span>{t.tabDoctors || 'Doctors'}</span>
              <span className={`text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-bold ${
                mainTab === 'doctors' ? 'bg-white/20 text-white' : 'bg-slate-300/80 text-slate-700'
              }`}>
                {currentUser?.role === 'pharmacy_owner' ? myCollabs.length : collabFeed.length}
              </span>
            </button> */}
          </div>

          <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-md">
            {mainTab === "pharmacists"
              ? t.pharmacistsTabSubtitle ||
                "Pharmacy hiring, job vacancies, and pharmacists looking for work"
              : t.doctorsTabSubtitle ||
                "Doctor consultation chambers, clinic tie-ups, and specialist doctors"}
          </p>
        </div>

        {/* ================= TAB 1: PHARMACISTS ================= */}
        {mainTab === "pharmacists" && (
          <div className="space-y-10 sm:space-y-12">
            {/* PUBLIC VISITOR VIEW - PHARMACISTS */}
            {!currentUser && (
              <div className="space-y-10 sm:space-y-12">
                {/* Hero Banner for Pharmacists */}
                <div className="rounded-3xl bg-gradient-to-br from-teal-900 via-slate-900 to-teal-950 text-white p-8 sm:p-12 overflow-hidden shadow-xl space-y-4">
                  <span className="inline-block px-3.5 py-1.5 rounded-full bg-teal-500/20 text-teal-300 text-xs font-bold uppercase tracking-wider">
                    Krishna Medicose Services
                  </span>
                  <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold font-outfit max-w-3xl leading-tight">
                    {t.pharmacistsTabSubtitle ||
                      "Pharmacy Staff Hiring & Pharmacist Job Search"}
                  </h2>
                  <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
                    Hire licensed pharmacists for your pharmacy with verified
                    credentials, or search and apply to top pharmacy vacancies
                    in your local area.
                  </p>
                  <div className="pt-2 flex flex-wrap gap-4">
                    <button
                      onClick={() => {
                        setAuthInitialMode("register");
                        setAuthInitialRole(null);
                        setAuthModalOpen(true);
                      }}
                      className="px-6 py-3.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center gap-2"
                    >
                      <span>{t.registerTitle || "Create Free Account"}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setAuthInitialMode("login");
                        setAuthModalOpen(true);
                      }}
                      className="px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm rounded-xl border border-white/20 transition-all"
                    >
                      {t.signInBtn || "Sign In"}
                    </button>
                  </div>
                </div>

                {/* Pharmacist Options Gateway */}
                <div className="space-y-6">
                  <div className="text-center max-w-xl mx-auto space-y-1.5">
                    <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-outfit">
                      {t.whoAreYou || "Who are you?"}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500">
                      {t.chooseGoal ||
                        "Please select what describes you best to continue:"}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                    {/* Option 1: Pharmacy Owner - Hire Pharmacist */}
                    <div className="rounded-3xl border-2 border-slate-200 bg-white p-7 sm:p-8 shadow-sm hover:shadow-xl hover:border-teal-600 transition-all flex flex-col justify-between space-y-6">
                      <div className="space-y-4">
                        <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center">
                          <Building2 className="w-7 h-7" />
                        </div>
                        <h4 className="text-lg sm:text-xl font-extrabold text-slate-900">
                          {t.opt1Title}
                        </h4>
                        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                          {t.opt1Desc}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setAuthInitialMode("register");
                          setAuthInitialRole("pharmacy_owner");
                          setAuthInitialSubRole("hire_pharmacist");
                          setAuthModalOpen(true);
                        }}
                        className="w-full py-3 sm:py-3.5 bg-teal-50 hover:bg-teal-700 text-teal-800 hover:text-white font-bold text-xs sm:text-sm rounded-xl transition-colors border border-teal-200 mt-2 flex items-center justify-center gap-2"
                      >
                        <span>{t.hirePharmacistBtn || "Hire Pharmacist"}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Option 2: Pharmacist Job Seeker */}
                    <div className="rounded-3xl border-2 border-slate-200 bg-white p-7 sm:p-8 shadow-sm hover:shadow-xl hover:border-sky-600 transition-all flex flex-col justify-between space-y-6">
                      <div className="space-y-4">
                        <div className="w-14 h-14 rounded-2xl bg-sky-50 text-sky-700 flex items-center justify-center">
                          <Briefcase className="w-7 h-7" />
                        </div>
                        <h4 className="text-lg sm:text-xl font-extrabold text-slate-900">
                          {t.opt2Title}
                        </h4>
                        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                          {t.opt2Desc}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setAuthInitialMode("register");
                          setAuthInitialRole("job_seeker_pharmacist");
                          setAuthInitialSubRole("work_in_pharmacy");
                          setAuthModalOpen(true);
                        }}
                        className="w-full py-3 sm:py-3.5 bg-sky-50 hover:bg-sky-700 text-sky-800 hover:text-white font-bold text-xs sm:text-sm rounded-xl transition-colors border border-sky-200 mt-2 flex items-center justify-center gap-2"
                      >
                        <span>{t.findJobsBtn || "Find Jobs"}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Available Jobs & Distance Filter */}
                <div className="space-y-6 pt-6 border-t border-slate-200">
                  <div className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs shadow-sm">
                    <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
                      <span className="font-bold text-slate-600">
                        {t.filterRadius}
                      </span>
                      {["10", "25", "50", "All"].map((rad) => (
                        <button
                          key={rad}
                          onClick={() => setSelectedRadius(rad)}
                          className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors ${
                            selectedRadius === rad
                              ? "bg-teal-700 text-white"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }`}
                        >
                          {rad === "All" ? t.allDistance : `${rad} km`}
                        </button>
                      ))}
                    </div>
                    <div className="relative min-w-[240px] flex-1 sm:flex-initial">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={
                          t.searchPlaceholder ||
                          "Search jobs by title or area..."
                        }
                        className="w-full h-11 pl-10 pr-4 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Available Jobs with Infinite Scroll Container */}
                  <ScrollableFeedContainer
                    items={jobFeed}
                    pageSize={6}
                    title={t.availablePharmacyJobs || "Available Pharmacy Jobs"}
                    badgeText={`${jobFeed.length} Openings`}
                    lang={lang}
                    t={t}
                    emptyState={{
                      icon: (
                        <Briefcase className="w-10 h-10 text-slate-300 mx-auto" />
                      ),
                      message:
                        "No pharmacy jobs found within selected distance",
                      actionText: "Show All Distance",
                      onAction: () => {
                        setSelectedRadius("All");
                        setSearchQuery("");
                      },
                    }}
                    renderItem={(job) => (
                      <div
                        key={job._id}
                        className="p-5 sm:p-6 rounded-2xl border border-slate-200/90 bg-white hover:border-teal-500/80 hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        <div className="space-y-2 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h5 className="font-bold text-slate-900 text-base truncate">
                              {job.title}
                            </h5>
                            <span className="text-[10px] font-bold px-2.5 py-0.5 bg-teal-50 text-teal-800 rounded-lg border border-teal-200/60">
                              {job.jobType}
                            </span>
                            {job.distanceKm !== null &&
                              job.distanceKm !== undefined && (
                                <span className="text-[10px] font-bold text-teal-700 bg-teal-50/70 px-2 py-0.5 rounded-full border border-teal-200/50">
                                  {job.distanceKm} {t.distanceAway}
                                </span>
                              )}
                          </div>
                          <p className="text-xs sm:text-sm text-slate-500 truncate font-medium">
                            {job.pharmacyName} -{" "}
                            {job.location?.city || "Local Area"}
                          </p>
                          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-700 font-semibold">
                            <span>
                              Salary:{" "}
                              <strong className="text-slate-900">
                                {job.salaryRange}
                              </strong>
                            </span>
                            <span>
                              Qualification:{" "}
                              <strong className="text-slate-900">
                                {job.requiredQualification}
                              </strong>
                            </span>
                            <span>
                              Exp:{" "}
                              <strong className="text-slate-900">
                                {job.requiredExperience}
                              </strong>
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                            {job.description}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                          <button
                            onClick={() => {
                              requireAuthAction(() => {
                                setDetailsModalItem(job);
                                setDetailsModalType("job");
                              }, "job_seeker_pharmacist");
                            }}
                            className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 hover:text-teal-700 hover:border-teal-300 hover:bg-slate-50 font-bold text-xs transition-all flex items-center gap-1.5"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>{t.seeDetails || "See Details"}</span>
                          </button>

                          <button
                            onClick={() => {
                              requireAuthAction(() => {
                                setApplyModalJob(job);
                              }, "job_seeker_pharmacist");
                            }}
                            className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
                          >
                            {job.hasApplied ? (
                              <span>{t.applied || "Applied"}</span>
                            ) : (
                              <span>{t.applyNow || "Apply Now"}</span>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  />

                  {/* Pharmacists Looking for Work with Infinite Scroll Container */}
                  {openPharmacists.length > 0 && (
                    <ScrollableFeedContainer
                      items={openPharmacists}
                      pageSize={6}
                      title={
                        t.pharmacistsLookingForWork ||
                        "Pharmacists Looking for Work"
                      }
                      badgeText={`${openPharmacists.length} Available`}
                      lang={lang}
                      t={t}
                      renderItem={(p) => (
                        <div
                          key={p._id}
                          className="p-5 sm:p-6 rounded-2xl border border-slate-200/90 bg-white hover:border-teal-500/80 hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                        >
                          <div className="space-y-1.5 flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h5 className="font-bold text-slate-900 text-base truncate">
                                {p.name}
                              </h5>
                              <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded-full border border-emerald-200">
                                Open to Work
                              </span>
                              {p.distanceKm !== null &&
                                p.distanceKm !== undefined && (
                                  <span className="text-[10px] font-bold text-teal-700 bg-teal-50/70 px-2 py-0.5 rounded-full border border-teal-200/50">
                                    {p.distanceKm} {t.distanceAway}
                                  </span>
                                )}
                            </div>
                            <p className="text-xs sm:text-sm text-slate-500 truncate">
                              {p.location?.city || "Local Area"} -{" "}
                              {p.pharmacistDetails?.qualification || "B.Pharm"}
                            </p>
                            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                              <span>
                                Degree:{" "}
                                <strong>
                                  {p.pharmacistDetails?.qualification ||
                                    "B.Pharm"}
                                </strong>
                              </span>
                              <span>
                                Exp:{" "}
                                <strong>
                                  {p.pharmacistDetails?.experienceYears || 0}{" "}
                                  Years
                                </strong>
                              </span>
                              <span>
                                Reg:{" "}
                                <strong>
                                  {p.pharmacistDetails?.registrationNumber ||
                                    "Verified"}
                                </strong>
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                            <button
                              onClick={() => {
                                requireAuthAction(() => {
                                  setDetailsModalItem(p);
                                  setDetailsModalType("pharmacist");
                                }, "pharmacy_owner");
                              }}
                              className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 hover:text-teal-700 hover:border-teal-300 hover:bg-slate-50 font-bold text-xs transition-all flex items-center gap-1.5"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>{t.seeDetails || "See Details"}</span>
                            </button>

                            <button
                              onClick={() => {
                                requireAuthAction(() => {
                                  setDetailsModalItem(p);
                                  setDetailsModalType("pharmacist");
                                }, "pharmacy_owner");
                              }}
                              className="px-4 py-2 bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors border border-teal-200"
                            >
                              <Phone className="w-3.5 h-3.5" />
                              <span>
                                {t.contactPharmacist || "Contact Pharmacist"}
                              </span>
                            </button>
                          </div>
                        </div>
                      )}
                    />
                  )}
                </div>
              </div>
            )}

            {/* LOGGED IN: PHARMACY OWNER (PHARMACISTS TAB) */}
            {currentUser && currentUser.role === "pharmacy_owner" && (
              <div className="space-y-6">
                <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-teal-800 to-slate-900 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-5 shadow-lg">
                  <div>
                    <span className="px-3 py-1 bg-white/10 text-teal-200 text-xs font-bold rounded-full">
                      {t.pharmacyOwner} - Hiring Staff
                    </span>
                    <h2 className="text-xl sm:text-2xl font-extrabold font-outfit mt-2">
                      {currentUser.pharmacyDetails?.pharmacyName ||
                        currentUser.name}
                    </h2>
                    <div className="flex items-center gap-2 text-xs text-teal-100 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-teal-300" />
                      <span>
                        {currentUser.location?.address},{" "}
                        {currentUser.location?.city}
                      </span>
                      <button
                        onClick={() => setChangeLocationModalOpen(true)}
                        className="underline text-teal-200 hover:text-white font-bold"
                      >
                        ({t.changeLocation})
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setEditingJob(null);
                      setCreateJobModalOpen(true);
                    }}
                    className="px-5 py-3 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{t.postNewJob}</span>
                  </button>
                </div>

                {/* Subtabs for Owner in Pharmacists tab */}
                <div className="flex border-b border-slate-200 gap-6 overflow-x-auto">
                  <button
                    onClick={() => setActiveTab("main")}
                    className={`pb-3.5 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 flex-shrink-0 ${
                      activeTab === "main"
                        ? "border-teal-600 text-teal-700"
                        : "border-transparent text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <Briefcase className="w-4 h-4" />
                    <span>
                      {t.myJobs} ({myJobs.length})
                    </span>
                  </button>
                  <button
                    onClick={() => setActiveTab("talent")}
                    className={`pb-3.5 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 flex-shrink-0 ${
                      activeTab === "talent"
                        ? "border-teal-600 text-teal-700"
                        : "border-transparent text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    <span>
                      {t.openPharmacists} ({openPharmacists.length})
                    </span>
                  </button>
                </div>

                {/* Tab Content: My Jobs */}
                {activeTab === "main" && (
                  <ScrollableFeedContainer
                    items={myJobs}
                    pageSize={6}
                    title={t.myJobs || "My Job Posts"}
                    badgeText={`${myJobs.length} Posts`}
                    lang={lang}
                    t={t}
                    emptyState={{
                      icon: (
                        <Briefcase className="w-10 h-10 text-slate-300 mx-auto" />
                      ),
                      message: "No job vacancies posted yet",
                      actionText: t.postNewJob || "Post a Job",
                      onAction: () => setCreateJobModalOpen(true),
                    }}
                    renderItem={(job) => (
                      <div
                        key={job._id}
                        className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        <div className="space-y-2 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-bold text-slate-900 text-base truncate">
                              {job.title}
                            </h4>
                            <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200/60">
                              {job.status}
                            </span>
                            <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg">
                              {job.jobType}
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm font-semibold text-slate-500">
                            {job.requiredQualification} | Salary:{" "}
                            {job.salaryRange} | Exp: {job.requiredExperience}
                          </p>
                          <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 leading-relaxed">
                            {job.description}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 flex-shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                          <button
                            onClick={() => {
                              setDetailsModalItem(job);
                              setDetailsModalType("job");
                            }}
                            className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 hover:text-teal-700 hover:border-teal-300 hover:bg-slate-50 font-bold text-xs transition-all flex items-center gap-1.5"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>{t.seeDetails || "See Details"}</span>
                          </button>

                          <button
                            onClick={() => setApplicantsModalJob(job)}
                            className="px-3.5 py-2 bg-teal-50 text-teal-800 hover:bg-teal-100 text-xs font-bold rounded-xl border border-teal-200 transition-colors"
                          >
                            {t.viewApplicants || "Applicants"} (
                            {job.applicationsCount || 0})
                          </button>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                setEditingJob(job);
                                setCreateJobModalOpen(true);
                              }}
                              className="p-2 text-slate-500 hover:text-teal-700 hover:bg-teal-50 rounded-xl transition-colors"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteJob(job._id)}
                              className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  />
                )}

                {/* Tab Content: Open-to-work Pharmacists */}
                {activeTab === "talent" && (
                  <div className="space-y-4">
                    <div className="p-4 bg-white rounded-2xl border border-slate-200 flex flex-wrap items-center gap-3 text-xs">
                      <span className="font-bold text-slate-600">
                        {t.filterRadius}
                      </span>
                      {["10", "25", "50", "All"].map((rad) => (
                        <button
                          key={rad}
                          onClick={() => setSelectedRadius(rad)}
                          className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors ${
                            selectedRadius === rad
                              ? "bg-teal-700 text-white"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }`}
                        >
                          {rad === "All" ? t.allDistance : `${rad} km`}
                        </button>
                      ))}
                    </div>

                    <ScrollableFeedContainer
                      items={openPharmacists}
                      pageSize={6}
                      title={
                        t.openPharmacists || "Pharmacists Looking for Work"
                      }
                      badgeText={`${openPharmacists.length} Candidates`}
                      lang={lang}
                      t={t}
                      emptyState={{
                        icon: (
                          <Users className="w-10 h-10 text-slate-300 mx-auto" />
                        ),
                        message:
                          "No pharmacists looking for work in this distance range.",
                        actionText: "Show All Distance",
                        onAction: () => setSelectedRadius("All"),
                      }}
                      renderItem={(p) => (
                        <div
                          key={p._id}
                          className="p-5 sm:p-6 rounded-2xl border border-slate-200/90 bg-white hover:border-teal-500/80 hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                        >
                          <div className="space-y-1.5 flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="font-bold text-slate-900 text-base truncate">
                                {p.name}
                              </h4>
                              <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded-full border border-emerald-200">
                                Open to Work
                              </span>
                              {p.distanceKm !== null &&
                                p.distanceKm !== undefined && (
                                  <span className="text-[10px] font-bold text-teal-700 bg-teal-50/70 px-2 py-0.5 rounded-full border border-teal-200/50">
                                    {p.distanceKm} {t.distanceAway}
                                  </span>
                                )}
                            </div>
                            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                              {p.location?.city || "Local Area"} -{" "}
                              {p.pharmacistDetails?.qualification || "B.Pharm"}
                            </p>
                            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                              <span>
                                Degree:{" "}
                                <strong>
                                  {p.pharmacistDetails?.qualification ||
                                    "B.Pharm"}
                                </strong>
                              </span>
                              <span>
                                Exp:{" "}
                                <strong>
                                  {p.pharmacistDetails?.experienceYears || 0}{" "}
                                  Years
                                </strong>
                              </span>
                              <span>
                                Reg:{" "}
                                <strong>
                                  {p.pharmacistDetails?.registrationNumber ||
                                    "Verified"}
                                </strong>
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                            <button
                              onClick={() => {
                                setDetailsModalItem(p);
                                setDetailsModalType("pharmacist");
                              }}
                              className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 hover:text-teal-700 hover:border-teal-300 hover:bg-slate-50 font-bold text-xs transition-all flex items-center gap-1.5"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>{t.seeDetails || "See Details"}</span>
                            </button>

                            {p.mobile && (
                              <a
                                href={`tel:${p.mobile}`}
                                className="px-3.5 py-2 bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors border border-teal-200"
                              >
                                <Phone className="w-3.5 h-3.5" /> Call
                              </a>
                            )}
                            {p.email && (
                              <a
                                href={`mailto:${p.email}`}
                                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
                              >
                                <Mail className="w-3.5 h-3.5" /> Email
                              </a>
                            )}
                          </div>
                        </div>
                      )}
                    />
                  </div>
                )}
              </div>
            )}

            {/* LOGGED IN: PHARMACIST JOB SEEKER */}
            {currentUser && currentUser.role === "job_seeker_pharmacist" && (
              <div className="space-y-6">
                <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-sky-900 to-slate-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 shadow-lg">
                  <div>
                    <span className="px-3 py-1 bg-white/10 text-sky-200 text-xs font-bold rounded-full">
                      {t.pharmacist}
                    </span>
                    <h2 className="text-xl sm:text-2xl font-extrabold font-outfit mt-2">
                      {currentUser.name}
                    </h2>
                    <div className="flex items-center gap-2 text-xs text-sky-100 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-sky-300" />
                      <span>
                        {currentUser.location?.address},{" "}
                        {currentUser.location?.city}
                      </span>
                      <button
                        onClick={() => setChangeLocationModalOpen(true)}
                        className="underline text-sky-200 hover:text-white font-bold"
                      >
                        ({t.changeLocation})
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={handleToggleAvailability}
                    disabled={togglingAvailability}
                    className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 ${
                      currentUser.isOpenToWork
                        ? "bg-emerald-500 text-white"
                        : "bg-slate-700 text-slate-300"
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${currentUser.isOpenToWork ? "bg-white" : "bg-slate-400"}`}
                    />
                    <span>
                      {currentUser.isOpenToWork
                        ? t.openToWork
                        : t.notSeekingWork}
                    </span>
                  </button>
                </div>

                <div className="flex border-b border-slate-200 gap-6">
                  <button
                    onClick={() => setActiveTab("main")}
                    className={`pb-3 text-xs sm:text-sm font-bold border-b-2 ${
                      activeTab === "main"
                        ? "border-sky-600 text-sky-700"
                        : "border-transparent text-slate-500"
                    }`}
                  >
                    {t.availableJobs} ({jobFeed.length})
                  </button>
                  <button
                    onClick={() => setActiveTab("secondary")}
                    className={`pb-3 text-xs sm:text-sm font-bold border-b-2 ${
                      activeTab === "secondary"
                        ? "border-sky-600 text-sky-700"
                        : "border-transparent text-slate-500"
                    }`}
                  >
                    {t.myApplications} ({myApplications.length})
                  </button>
                </div>

                {activeTab === "main" && (
                  <div className="space-y-6">
                    <div className="p-4 bg-white rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="font-bold text-slate-600">
                          {t.filterRadius}
                        </span>
                        {["10", "25", "50", "All"].map((rad) => (
                          <button
                            key={rad}
                            onClick={() => setSelectedRadius(rad)}
                            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors ${
                              selectedRadius === rad
                                ? "bg-sky-700 text-white"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                          >
                            {rad === "All" ? t.allDistance : `${rad} km`}
                          </button>
                        ))}
                      </div>

                      <div className="relative min-w-[220px]">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder={t.searchPlaceholder}
                          className="w-full h-11 pl-10 pr-4 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-sky-600 transition-colors"
                        />
                      </div>
                    </div>

                    <ScrollableFeedContainer
                      items={jobFeed}
                      pageSize={6}
                      title={t.availableJobs || "Available Jobs"}
                      badgeText={`${jobFeed.length} Openings`}
                      lang={lang}
                      t={t}
                      emptyState={{
                        icon: (
                          <Briefcase className="w-10 h-10 text-slate-300 mx-auto" />
                        ),
                        message:
                          "No pharmacy jobs found within selected distance",
                        actionText: "Show All Distance",
                        onAction: () => {
                          setSelectedRadius("All");
                          setSearchQuery("");
                        },
                      }}
                      renderItem={(job) => (
                        <div
                          key={job._id}
                          className="p-5 sm:p-6 rounded-2xl border border-slate-200/90 bg-white hover:border-sky-500/80 hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                        >
                          <div className="space-y-2 flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="font-bold text-slate-900 text-base truncate">
                                {job.title}
                              </h4>
                              <span className="text-[10px] font-bold px-2.5 py-0.5 bg-sky-50 text-sky-800 rounded-lg border border-sky-200/60">
                                {job.jobType}
                              </span>
                              {job.distanceKm !== null &&
                                job.distanceKm !== undefined && (
                                  <span className="text-[10px] font-bold text-teal-700 bg-teal-50/70 px-2 py-0.5 rounded-full border border-teal-200/50">
                                    {job.distanceKm} {t.distanceAway}
                                  </span>
                                )}
                            </div>
                            <p className="text-xs sm:text-sm text-slate-500 truncate font-medium">
                              {job.pharmacyName} -{" "}
                              {job.location?.city || "Local Area"}
                            </p>
                            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-700 font-semibold">
                              <span>
                                Salary:{" "}
                                <strong className="text-slate-900">
                                  {job.salaryRange}
                                </strong>
                              </span>
                              <span>
                                Qualification:{" "}
                                <strong className="text-slate-900">
                                  {job.requiredQualification}
                                </strong>
                              </span>
                              <span>
                                Exp:{" "}
                                <strong className="text-slate-900">
                                  {job.requiredExperience}
                                </strong>
                              </span>
                            </div>
                            <p className="text-xs sm:text-slate-600 line-clamp-2 leading-relaxed">
                              {job.description}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                            <button
                              onClick={() => {
                                setDetailsModalItem(job);
                                setDetailsModalType("job");
                              }}
                              className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 hover:text-sky-700 hover:border-sky-300 hover:bg-slate-50 font-bold text-xs transition-all flex items-center gap-1.5"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>{t.seeDetails || "See Details"}</span>
                            </button>

                            {job.hasApplied ? (
                              <span className="px-4 py-2 bg-slate-100 text-slate-600 font-bold text-xs rounded-xl border border-slate-200">
                                {t.applied || "Applied"}
                              </span>
                            ) : (
                              <button
                                onClick={() => setApplyModalJob(job)}
                                className="px-4 py-2 bg-sky-700 hover:bg-sky-800 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
                              >
                                {t.applyNow || "Apply Now"}
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    />
                  </div>
                )}

                {activeTab === "secondary" && (
                  <ScrollableFeedContainer
                    items={myApplications}
                    pageSize={6}
                    title={t.myApplications || "My Applications"}
                    badgeText={`${myApplications.length} Applied`}
                    lang={lang}
                    t={t}
                    emptyState={{
                      icon: (
                        <Briefcase className="w-10 h-10 text-slate-300 mx-auto" />
                      ),
                      message: "You have not applied to any pharmacy jobs yet.",
                      actionText: "Browse Available Jobs",
                      onAction: () => setActiveTab("main"),
                    }}
                    renderItem={(app) => (
                      <div
                        key={app._id}
                        className="p-5 sm:p-6 rounded-2xl border border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm shadow-sm hover:shadow-md transition-all"
                      >
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                            {app.jobId?.title || "Pharmacist"}
                          </h4>
                          <p className="text-slate-500 mt-0.5">
                            {app.jobId?.pharmacyName} - Applied on{" "}
                            {new Date(app.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <span className="font-bold uppercase px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 text-xs self-start sm:self-auto border border-slate-200">
                          {app.status}
                        </span>
                      </div>
                    )}
                  />
                )}
              </div>
            )}

            {/* LOGGED IN: DOCTOR VIEWING PHARMACISTS TAB */}
            {currentUser && currentUser.role === "doctor" && (
              <div className="space-y-6">
                <div className="p-4 bg-teal-50 border border-teal-200 rounded-2xl text-xs text-teal-800">
                  You are viewing the Pharmacists directory and open job
                  listings in this region.
                </div>
                <ScrollableFeedContainer
                  items={jobFeed}
                  pageSize={6}
                  title="Regional Pharmacy Job Listings"
                  badgeText={`${jobFeed.length} Openings`}
                  lang={lang}
                  t={t}
                  renderItem={(job) => (
                    <div
                      key={job._id}
                      className="p-5 sm:p-6 rounded-2xl border border-slate-200 bg-white space-y-2 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div>
                        <h4 className="font-bold text-slate-900 text-base">
                          {job.title}
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {job.pharmacyName} - {job.location?.city}
                        </p>
                        <p className="text-xs text-slate-700 font-medium mt-1">
                          {job.salaryRange} | {job.jobType}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setDetailsModalItem(job);
                          setDetailsModalType("job");
                        }}
                        className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 hover:text-teal-700 hover:bg-slate-50 font-bold text-xs transition-all flex items-center gap-1.5 self-start sm:self-auto"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{t.seeDetails || "See Details"}</span>
                      </button>
                    </div>
                  )}
                />
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 2: DOCTORS ================= */}
        {mainTab === "doctors" && (
          <div className="space-y-10 sm:space-y-12">
            {/* PUBLIC VISITOR VIEW - DOCTORS */}
            {!currentUser && (
              <div className="space-y-10 sm:space-y-12">
                {/* Hero Banner for Doctors */}
                <div className="rounded-3xl bg-gradient-to-br from-emerald-950 via-slate-900 to-teal-950 text-white p-8 sm:p-12 overflow-hidden shadow-xl space-y-4">
                  <span className="inline-block px-3.5 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold uppercase tracking-wider">
                    Krishna Medicose Services
                  </span>
                  <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold font-outfit max-w-3xl leading-tight">
                    {t.doctorsTabSubtitle ||
                      "Clinic Chambers, Consultations & Doctor Collaborations"}
                  </h2>
                  <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
                    Connect specialist doctors with local clinics and pharmacies
                    equipped for outpatient patient consultations.
                  </p>
                  <div className="pt-2 flex flex-wrap gap-4">
                    <button
                      onClick={() => {
                        setAuthInitialMode("register");
                        setAuthInitialRole("doctor");
                        setAuthModalOpen(true);
                      }}
                      className="px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center gap-2"
                    >
                      <span>Join as Doctor</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setAuthInitialMode("login");
                        setAuthModalOpen(true);
                      }}
                      className="px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm rounded-xl border border-white/20 transition-all"
                    >
                      {t.signInBtn || "Sign In"}
                    </button>
                  </div>
                </div>

                {/* Doctor Options Gateway */}
                <div className="space-y-6">
                  <div className="text-center max-w-xl mx-auto space-y-1.5">
                    <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-outfit">
                      {t.whoAreYou || "Who are you?"}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500">
                      {t.chooseGoal ||
                        "Please select what describes you best to continue:"}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                    {/* Option 1: Doctor Looking for Clinic / Pharmacy */}
                    <div className="rounded-3xl border-2 border-slate-200 bg-white p-7 sm:p-8 shadow-sm hover:shadow-xl hover:border-emerald-600 transition-all flex flex-col justify-between space-y-6">
                      <div className="space-y-4">
                        <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                          <Stethoscope className="w-7 h-7" />
                        </div>
                        <h4 className="text-lg sm:text-xl font-extrabold text-slate-900">
                          {t.opt3Title}
                        </h4>
                        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                          {t.opt3Desc}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setAuthInitialMode("register");
                          setAuthInitialRole("doctor");
                          setAuthInitialSubRole("doctor_collab");
                          setAuthModalOpen(true);
                        }}
                        className="w-full py-3 sm:py-3.5 bg-emerald-50 hover:bg-emerald-700 text-emerald-800 hover:text-white font-bold text-xs sm:text-sm rounded-xl transition-colors border border-emerald-200 mt-2 flex items-center justify-center gap-2"
                      >
                        <span>{t.connectDoctorBtn || "Connect as Doctor"}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Option 2: Pharmacy/Clinic Owner Connecting with Doctor */}
                    <div className="rounded-3xl border-2 border-slate-200 bg-white p-7 sm:p-8 shadow-sm hover:shadow-xl hover:border-teal-600 transition-all flex flex-col justify-between space-y-6">
                      <div className="space-y-4">
                        <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center">
                          <Building2 className="w-7 h-7" />
                        </div>
                        <h4 className="text-lg sm:text-xl font-extrabold text-slate-900">
                          {t.optDoctorConnectOwner ||
                            "2. I own a pharmacy/clinic & want to connect with a doctor"}
                        </h4>
                        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                          {t.optDoctorConnectOwnerDesc ||
                            "List your clinic chamber, consultation timings, and connect with specialist doctors."}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setAuthInitialMode("register");
                          setAuthInitialRole("pharmacy_owner");
                          setAuthInitialSubRole("collab_doctor");
                          setAuthModalOpen(true);
                        }}
                        className="w-full py-3 sm:py-3.5 bg-teal-50 hover:bg-teal-700 text-teal-800 hover:text-white font-bold text-xs sm:text-sm rounded-xl transition-colors border border-teal-200 mt-2 flex items-center justify-center gap-2"
                      >
                        <span>{t.listChamberBtn || "List Clinic Chamber"}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Available Chambers & Distance Filter */}
                <div className="space-y-6 pt-6 border-t border-slate-200">
                  <div className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs shadow-sm">
                    <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
                      <span className="font-bold text-slate-600">
                        {t.filterRadius}
                      </span>
                      {["10", "25", "50", "All"].map((rad) => (
                        <button
                          key={rad}
                          onClick={() => setSelectedRadius(rad)}
                          className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors ${
                            selectedRadius === rad
                              ? "bg-emerald-700 text-white"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }`}
                        >
                          {rad === "All" ? t.allDistance : `${rad} km`}
                        </button>
                      ))}
                    </div>
                    <div className="relative min-w-[240px] flex-1 sm:flex-initial">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search chambers by specialization or clinic..."
                        className="w-full h-11 pl-10 pr-4 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-600 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Available Chambers with Infinite Scroll Container */}
                  <ScrollableFeedContainer
                    items={collabFeed}
                    pageSize={6}
                    title={
                      t.availableClinicChambers ||
                      "Available Clinic Chambers for Doctors"
                    }
                    badgeText={`${collabFeed.length} Chambers`}
                    lang={lang}
                    t={t}
                    emptyState={{
                      icon: (
                        <Stethoscope className="w-10 h-10 text-slate-300 mx-auto" />
                      ),
                      message:
                        "No clinic chambers found within selected distance",
                      actionText: "Show All Distance",
                      onAction: () => {
                        setSelectedRadius("All");
                        setSearchQuery("");
                      },
                    }}
                    renderItem={(collab) => (
                      <div
                        key={collab._id}
                        className="p-5 sm:p-6 rounded-2xl border border-slate-200/90 bg-white hover:border-emerald-500/80 hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        <div className="space-y-2 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h5 className="font-bold text-slate-900 text-base truncate">
                              {collab.specializationNeeded}
                            </h5>
                            <span className="text-[10px] font-bold px-2.5 py-0.5 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200/60">
                              {collab.preferredTimings}
                            </span>
                            {collab.distanceKm !== null &&
                              collab.distanceKm !== undefined && (
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50/70 px-2 py-0.5 rounded-full border border-emerald-200/50">
                                  {collab.distanceKm} {t.distanceAway}
                                </span>
                              )}
                          </div>
                          <p className="text-xs sm:text-sm text-slate-500 truncate font-medium">
                            {collab.clinicOrChamberName || collab.pharmacyName}{" "}
                            - {collab.location?.city || "Local Area"}
                          </p>
                          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-700 font-semibold">
                            <span>
                              Terms:{" "}
                              <strong className="text-slate-900">
                                {collab.collaborationTerms}
                              </strong>
                            </span>
                            <span>
                              Days:{" "}
                              <strong className="text-slate-900">
                                {collab.consultationDays || "Regular"}
                              </strong>
                            </span>
                          </div>
                          <p className="text-xs sm:text-slate-600 line-clamp-2 leading-relaxed">
                            {collab.description}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                          <button
                            onClick={() => {
                              requireAuthAction(() => {
                                setDetailsModalItem(collab);
                                setDetailsModalType("collab");
                              }, "doctor");
                            }}
                            className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 hover:text-emerald-700 hover:border-emerald-300 hover:bg-slate-50 font-bold text-xs transition-all flex items-center gap-1.5"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>{t.seeDetails || "See Details"}</span>
                          </button>

                          <button
                            onClick={() => {
                              requireAuthAction(() => {
                                setInquireModalCollab(collab);
                              }, "doctor");
                            }}
                            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
                          >
                            {collab.hasInquired ? (
                              <span>{t.proposalSent || "Proposal Sent"}</span>
                            ) : (
                              <span>{t.sendProposal || "Send Proposal"}</span>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  />

                  {/* Doctors Available for Consultation with Infinite Scroll Container */}
                  {openDoctors.length > 0 && (
                    <ScrollableFeedContainer
                      items={openDoctors}
                      pageSize={6}
                      title={
                        t.doctorsLookingForClinic ||
                        "Doctors Available for Consultation"
                      }
                      badgeText={`${openDoctors.length} Registered`}
                      lang={lang}
                      t={t}
                      renderItem={(doc) => (
                        <div
                          key={doc._id}
                          className="p-5 sm:p-6 rounded-2xl border border-slate-200/90 bg-white hover:border-emerald-500/80 hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                        >
                          <div className="space-y-1.5 flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h5 className="font-bold text-slate-900 text-base truncate">
                                Dr. {doc.name}
                              </h5>
                              <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded-full border border-emerald-200">
                                Open to Consult
                              </span>
                              {doc.distanceKm !== null &&
                                doc.distanceKm !== undefined && (
                                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50/70 px-2 py-0.5 rounded-full border border-emerald-200/50">
                                    {doc.distanceKm} {t.distanceAway}
                                  </span>
                                )}
                            </div>
                            <p className="text-xs sm:text-sm text-slate-500 truncate">
                              {doc.location?.city || "Local Area"} -{" "}
                              {doc.doctorDetails?.specialization ||
                                "General Physician"}
                            </p>
                            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                              <span>
                                Degree:{" "}
                                <strong>
                                  {doc.doctorDetails?.qualification || "MBBS"}
                                </strong>
                              </span>
                              <span>
                                Exp:{" "}
                                <strong>
                                  {doc.doctorDetails?.experienceYears || 0}{" "}
                                  Years
                                </strong>
                              </span>
                              <span>
                                Reg:{" "}
                                <strong>
                                  {doc.doctorDetails?.registrationNumber ||
                                    "Verified"}
                                </strong>
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                            <button
                              onClick={() => {
                                requireAuthAction(() => {
                                  setDetailsModalItem(doc);
                                  setDetailsModalType("doctor");
                                }, "pharmacy_owner");
                              }}
                              className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 hover:text-emerald-700 hover:border-emerald-300 hover:bg-slate-50 font-bold text-xs transition-all flex items-center gap-1.5"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>{t.seeDetails || "See Details"}</span>
                            </button>

                            <button
                              onClick={() => {
                                requireAuthAction(() => {
                                  setDetailsModalItem(doc);
                                  setDetailsModalType("doctor");
                                }, "pharmacy_owner");
                              }}
                              className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors border border-emerald-200"
                            >
                              <Phone className="w-3.5 h-3.5" />
                              <span>{t.inviteDoctor || "Invite Doctor"}</span>
                            </button>
                          </div>
                        </div>
                      )}
                    />
                  )}
                </div>
              </div>
            )}

            {/* LOGGED IN: PHARMACY OWNER (DOCTORS TAB) */}
            {currentUser && currentUser.role === "pharmacy_owner" && (
              <div className="space-y-6">
                <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-emerald-900 to-slate-900 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-5 shadow-lg">
                  <div>
                    <span className="px-3 py-1 bg-white/10 text-emerald-200 text-xs font-bold rounded-full">
                      {t.pharmacyOwner} - Doctor Chambers
                    </span>
                    <h2 className="text-xl sm:text-2xl font-extrabold font-outfit mt-2">
                      {currentUser.pharmacyDetails?.pharmacyName ||
                        currentUser.name}
                    </h2>
                    <div className="flex items-center gap-2 text-xs text-emerald-100 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-emerald-300" />
                      <span>
                        {currentUser.location?.address},{" "}
                        {currentUser.location?.city}
                      </span>
                      <button
                        onClick={() => setChangeLocationModalOpen(true)}
                        className="underline text-emerald-200 hover:text-white font-bold"
                      >
                        ({t.changeLocation})
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setEditingCollab(null);
                      setCreateCollabModalOpen(true);
                    }}
                    className="px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{t.newChamberListing}</span>
                  </button>
                </div>

                {/* Subtabs for Owner in Doctors tab */}
                <div className="flex border-b border-slate-200 gap-6 overflow-x-auto">
                  <button
                    onClick={() => setActiveTab("main")}
                    className={`pb-3.5 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 flex-shrink-0 ${
                      activeTab === "main"
                        ? "border-emerald-600 text-emerald-700"
                        : "border-transparent text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <Stethoscope className="w-4 h-4" />
                    <span>
                      {t.doctorCollabs} ({myCollabs.length})
                    </span>
                  </button>
                  <button
                    onClick={() => setActiveTab("talent")}
                    className={`pb-3.5 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 flex-shrink-0 ${
                      activeTab === "talent"
                        ? "border-emerald-600 text-emerald-700"
                        : "border-transparent text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    <span>
                      {t.doctorsLookingForClinic || "Available Doctors"} (
                      {openDoctors.length})
                    </span>
                  </button>
                </div>

                {/* Tab Content: My Chambers */}
                {activeTab === "main" && (
                  <ScrollableFeedContainer
                    items={myCollabs}
                    pageSize={6}
                    title={t.doctorCollabs || "Doctor Chambers"}
                    badgeText={`${myCollabs.length} Chambers`}
                    lang={lang}
                    t={t}
                    emptyState={{
                      icon: (
                        <Stethoscope className="w-10 h-10 text-slate-300 mx-auto" />
                      ),
                      message: "No clinic chambers listed yet",
                      actionText: t.newChamberListing || "Add Chamber Listing",
                      onAction: () => setCreateCollabModalOpen(true),
                    }}
                    renderItem={(collab) => (
                      <div
                        key={collab._id}
                        className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        <div className="space-y-2 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-bold text-slate-900 text-base truncate">
                              {collab.specializationNeeded}
                            </h4>
                            <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                              {collab.status}
                            </span>
                            <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg">
                              {collab.preferredTimings}
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm font-semibold text-slate-600">
                            Terms: {collab.collaborationTerms} | Days:{" "}
                            {collab.consultationDays || "Regular"}
                          </p>
                          <p className="text-xs sm:text-sm text-slate-500 line-clamp-2 leading-relaxed">
                            {collab.description}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 flex-shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                          <button
                            onClick={() => {
                              setDetailsModalItem(collab);
                              setDetailsModalType("collab");
                            }}
                            className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 hover:text-emerald-700 hover:border-emerald-300 hover:bg-slate-50 font-bold text-xs transition-all flex items-center gap-1.5"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>{t.seeDetails || "See Details"}</span>
                          </button>

                          <button
                            onClick={() => setInquiriesModalCollab(collab)}
                            className="px-3.5 py-2 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 text-xs font-bold rounded-xl border border-emerald-200 transition-colors"
                          >
                            Inquiries ({collab.inquiriesCount || 0})
                          </button>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                setEditingCollab(collab);
                                setCreateCollabModalOpen(true);
                              }}
                              className="p-2 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition-colors"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteCollab(collab._id)}
                              className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  />
                )}

                {/* Tab Content: Doctors Available */}
                {activeTab === "talent" && (
                  <div className="space-y-4">
                    <ScrollableFeedContainer
                      items={openDoctors}
                      pageSize={6}
                      title={t.doctorsLookingForClinic || "Available Doctors"}
                      badgeText={`${openDoctors.length} Specialists`}
                      lang={lang}
                      t={t}
                      emptyState={{
                        icon: (
                          <Stethoscope className="w-10 h-10 text-slate-300 mx-auto" />
                        ),
                        message:
                          "No doctors registered in this distance range.",
                        actionText: "Show All Distance",
                        onAction: () => setSelectedRadius("All"),
                      }}
                      renderItem={(doc) => (
                        <div
                          key={doc._id}
                          className="p-5 sm:p-6 rounded-2xl border border-slate-200/90 bg-white hover:border-emerald-500/80 hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                        >
                          <div className="space-y-1.5 flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="font-bold text-slate-900 text-base truncate">
                                Dr. {doc.name}
                              </h4>
                              <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded-full border border-emerald-200">
                                Open to Consult
                              </span>
                              {doc.distanceKm !== null &&
                                doc.distanceKm !== undefined && (
                                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50/70 px-2 py-0.5 rounded-full border border-emerald-200/50">
                                    {doc.distanceKm} {t.distanceAway}
                                  </span>
                                )}
                            </div>
                            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                              {doc.location?.city || "Local Area"} -{" "}
                              {doc.doctorDetails?.specialization ||
                                "General Physician"}
                            </p>
                            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                              <span>
                                Degree:{" "}
                                <strong>
                                  {doc.doctorDetails?.qualification || "MBBS"}
                                </strong>
                              </span>
                              <span>
                                Exp:{" "}
                                <strong>
                                  {doc.doctorDetails?.experienceYears || 0}{" "}
                                  Years
                                </strong>
                              </span>
                              <span>
                                Reg:{" "}
                                <strong>
                                  {doc.doctorDetails?.registrationNumber ||
                                    "Verified"}
                                </strong>
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                            <button
                              onClick={() => {
                                setDetailsModalItem(doc);
                                setDetailsModalType("doctor");
                              }}
                              className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 hover:text-emerald-700 hover:border-emerald-300 hover:bg-slate-50 font-bold text-xs transition-all flex items-center gap-1.5"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>{t.seeDetails || "See Details"}</span>
                            </button>

                            {doc.mobile && (
                              <a
                                href={`tel:${doc.mobile}`}
                                className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors border border-emerald-200"
                              >
                                <Phone className="w-3.5 h-3.5" /> Call
                              </a>
                            )}
                            {doc.email && (
                              <a
                                href={`mailto:${doc.email}`}
                                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
                              >
                                <Mail className="w-3.5 h-3.5" /> Email
                              </a>
                            )}
                          </div>
                        </div>
                      )}
                    />
                  </div>
                )}
              </div>
            )}

            {/* LOGGED IN: DOCTOR DASHBOARD */}
            {currentUser && currentUser.role === "doctor" && (
              <div className="space-y-6">
                <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-emerald-900 to-slate-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 shadow-lg">
                  <div>
                    <span className="px-3 py-1 bg-white/10 text-emerald-200 text-xs font-bold rounded-full">
                      {t.doctor}
                    </span>
                    <h2 className="text-xl sm:text-2xl font-extrabold font-outfit mt-2">
                      Dr. {currentUser.name}
                    </h2>
                    <div className="flex items-center gap-2 text-xs text-emerald-100 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-emerald-300" />
                      <span>
                        {currentUser.location?.address},{" "}
                        {currentUser.location?.city}
                      </span>
                      <button
                        onClick={() => setChangeLocationModalOpen(true)}
                        className="underline text-emerald-200 hover:text-white font-bold"
                      >
                        ({t.changeLocation})
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={handleToggleAvailability}
                    disabled={togglingAvailability}
                    className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 ${
                      currentUser.isOpenToCollaborate
                        ? "bg-emerald-500 text-white"
                        : "bg-slate-700 text-slate-300"
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${currentUser.isOpenToCollaborate ? "bg-white" : "bg-slate-400"}`}
                    />
                    <span>
                      {currentUser.isOpenToCollaborate
                        ? t.openToCollab
                        : t.unavailable}
                    </span>
                  </button>
                </div>

                <div className="flex border-b border-slate-200 gap-6">
                  <button
                    onClick={() => setActiveTab("main")}
                    className={`pb-3 text-xs sm:text-sm font-bold border-b-2 ${
                      activeTab === "main"
                        ? "border-emerald-600 text-emerald-700"
                        : "border-transparent text-slate-500"
                    }`}
                  >
                    {t.availableChambers} ({collabFeed.length})
                  </button>
                  <button
                    onClick={() => setActiveTab("secondary")}
                    className={`pb-3 text-xs sm:text-sm font-bold border-b-2 ${
                      activeTab === "secondary"
                        ? "border-emerald-600 text-emerald-700"
                        : "border-transparent text-slate-500"
                    }`}
                  >
                    {t.myProposals} ({myInquiries.length})
                  </button>
                </div>

                {activeTab === "main" && (
                  <ScrollableFeedContainer
                    items={collabFeed}
                    pageSize={6}
                    title={t.availableChambers || "Available Clinic Chambers"}
                    badgeText={`${collabFeed.length} Chambers`}
                    lang={lang}
                    t={t}
                    emptyState={{
                      icon: (
                        <Stethoscope className="w-10 h-10 text-slate-300 mx-auto" />
                      ),
                      message:
                        "No clinic chambers available in this distance range.",
                      actionText: "Show All Distance",
                      onAction: () => setSelectedRadius("All"),
                    }}
                    renderItem={(post) => (
                      <div
                        key={post._id}
                        className="p-5 sm:p-6 rounded-2xl border border-slate-200/90 bg-white hover:border-emerald-500/80 hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        <div className="space-y-2 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-bold text-slate-900 text-base truncate">
                              {post.pharmacyName}
                            </h4>
                            <span className="text-[10px] font-bold px-2.5 py-0.5 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200/60">
                              {post.preferredTimings}
                            </span>
                            {post.distanceKm !== null &&
                              post.distanceKm !== undefined && (
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50/70 px-2 py-0.5 rounded-full border border-emerald-200/50">
                                  {post.distanceKm} {t.distanceAway}
                                </span>
                              )}
                          </div>
                          <p className="text-xs sm:text-sm font-bold text-emerald-800">
                            Needs: {post.specializationNeeded}
                          </p>
                          <p className="text-xs sm:text-sm text-slate-600">
                            {post.consultationDays || "Regular"} |{" "}
                            {post.collaborationTerms}
                          </p>
                          <p className="text-xs sm:text-slate-500 line-clamp-2 leading-relaxed">
                            {post.description}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                          <button
                            onClick={() => {
                              setDetailsModalItem(post);
                              setDetailsModalType("collab");
                            }}
                            className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 hover:text-emerald-700 hover:border-emerald-300 hover:bg-slate-50 font-bold text-xs transition-all flex items-center gap-1.5"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>{t.seeDetails || "See Details"}</span>
                          </button>

                          {post.hasInquired ? (
                            <span className="px-4 py-2 bg-slate-100 text-slate-600 font-bold text-xs rounded-xl border border-slate-200">
                              {t.proposalSent || "Proposal Sent"}
                            </span>
                          ) : (
                            <button
                              onClick={() => setInquireModalCollab(post)}
                              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
                            >
                              {t.sendProposal || "Send Proposal"}
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  />
                )}

                {activeTab === "secondary" && (
                  <ScrollableFeedContainer
                    items={myInquiries}
                    pageSize={6}
                    title={t.myProposals || "My Inquiries"}
                    badgeText={`${myInquiries.length} Proposals`}
                    lang={lang}
                    t={t}
                    emptyState={{
                      icon: (
                        <Stethoscope className="w-10 h-10 text-slate-300 mx-auto" />
                      ),
                      message:
                        "You have not sent proposals to any clinics yet.",
                      actionText: "Browse Available Chambers",
                      onAction: () => setActiveTab("main"),
                    }}
                    renderItem={(inq) => (
                      <div
                        key={inq._id}
                        className="p-5 sm:p-6 rounded-2xl border border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm shadow-sm hover:shadow-md transition-all"
                      >
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                            {inq.collabPostId?.pharmacyName}
                          </h4>
                          <p className="text-slate-500 mt-0.5">
                            {inq.proposedTimings} - Proposed on{" "}
                            {new Date(inq.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <span className="font-bold uppercase px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 text-xs self-start sm:self-auto border border-slate-200">
                          {inq.status}
                        </span>
                      </div>
                    )}
                  />
                )}
              </div>
            )}

            {/* LOGGED IN: PHARMACIST VIEWING DOCTORS TAB */}
            {currentUser && currentUser.role === "job_seeker_pharmacist" && (
              <div className="space-y-6">
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800">
                  You are viewing the Doctor Collaboration Chambers and clinics
                  network in this region.
                </div>
                <ScrollableFeedContainer
                  items={collabFeed}
                  pageSize={6}
                  title="Regional Clinic Consultation Chambers"
                  badgeText={`${collabFeed.length} Chambers`}
                  lang={lang}
                  t={t}
                  renderItem={(collab) => (
                    <div
                      key={collab._id}
                      className="p-5 sm:p-6 rounded-2xl border border-slate-200 bg-white space-y-2 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div>
                        <h4 className="font-bold text-slate-900 text-base">
                          {collab.specializationNeeded}
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {collab.pharmacyName} - {collab.location?.city}
                        </p>
                        <p className="text-xs text-slate-700 font-medium mt-1">
                          {collab.preferredTimings} |{" "}
                          {collab.collaborationTerms}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setDetailsModalItem(collab);
                          setDetailsModalType("collab");
                        }}
                        className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 hover:text-emerald-700 hover:bg-slate-50 font-bold text-xs transition-all flex items-center gap-1.5 self-start sm:self-auto"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{t.seeDetails || "See Details"}</span>
                      </button>
                    </div>
                  )}
                />
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modals */}
      <ServicesAuthModal
        isOpen={authModalOpen}
        onClose={() => {
          setAuthModalOpen(false);
          setAuthInitialRole(null);
          setAuthInitialSubRole(null);
        }}
        initialMode={authInitialMode}
        initialRole={authInitialRole}
        initialSubRole={authInitialSubRole}
        t={t}
        lang={lang}
        onAuthSuccess={(user) => {
          setCurrentUser(user);
          if (user.role === "doctor") {
            setMainTab("doctors");
          } else {
            setMainTab("pharmacists");
          }
          loadViewData();
        }}
      />

      <CreateJobModal
        isOpen={createJobModalOpen}
        onClose={() => {
          setCreateJobModalOpen(false);
          setEditingJob(null);
        }}
        initialJob={editingJob}
        userLocation={currentUser?.location}
        t={t}
        lang={lang}
        onJobCreated={() => loadViewData()}
      />

      <CreateCollabModal
        isOpen={createCollabModalOpen}
        onClose={() => {
          setCreateCollabModalOpen(false);
          setEditingCollab(null);
        }}
        initialCollab={editingCollab}
        userLocation={currentUser?.location}
        t={t}
        lang={lang}
        onCollabCreated={() => loadViewData()}
      />

      <ApplyJobModal
        isOpen={Boolean(applyModalJob)}
        job={applyModalJob}
        user={currentUser}
        onClose={() => setApplyModalJob(null)}
        onApplicationSuccess={() => loadViewData()}
      />

      <InquireCollabModal
        isOpen={Boolean(inquireModalCollab)}
        collabPost={inquireModalCollab}
        user={currentUser}
        onClose={() => setInquireModalCollab(null)}
        onInquirySuccess={() => loadViewData()}
      />

      <ViewApplicantsModal
        isOpen={Boolean(applicantsModalJob)}
        job={applicantsModalJob}
        onClose={() => setApplicantsModalJob(null)}
      />

      <ViewInquiriesModal
        isOpen={Boolean(inquiriesModalCollab)}
        collabPost={inquiriesModalCollab}
        onClose={() => setInquiriesModalCollab(null)}
      />

      <ChangeLocationModal
        isOpen={changeLocationModalOpen}
        onClose={() => setChangeLocationModalOpen(false)}
        currentLocation={currentUser?.location}
        t={t}
        lang={lang}
        onLocationUpdated={(newLoc) => {
          setCurrentUser((prev) => {
            const updated = { ...prev, location: newLoc };
            localStorage.setItem("service_user", JSON.stringify(updated));
            return updated;
          });
          loadViewData();
        }}
      />

      <ListingDetailsModal
        isOpen={Boolean(detailsModalItem)}
        onClose={() => setDetailsModalItem(null)}
        item={detailsModalItem}
        type={detailsModalType}
        currentUser={currentUser}
        t={t}
        lang={lang}
        onPrimaryAction={(item) => {
          if (detailsModalType === "job") {
            setApplyModalJob(item);
          } else if (detailsModalType === "collab") {
            setInquireModalCollab(item);
          }
        }}
      />
    </div>
  );
}
