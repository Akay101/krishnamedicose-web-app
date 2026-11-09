import { useEffect, useMemo, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Briefcase,
  ExternalLink,
  FileEdit,
  FileSpreadsheet,
  Gift,
  Image as ImageIcon,
  Inbox,
  LayoutDashboard,
  Link2,
  LogOut,
  Menu,
  ShieldCheck,
  Truck,
  UsersRound,
  X,
} from "lucide-react";
import api from "../utils/api";
import { FullLogo } from "../components/BrandLogos";

const readUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
};

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const user = readUser();
  const isRootAdmin = user.role === "admin";
  const can = (perm) => isRootAdmin || Boolean(user.permissions?.[perm]);

  useEffect(() => setIsSidebarOpen(false), [location.pathname]);

  const groups = useMemo(
    () =>
      [
        {
          label: "Overview",
          items: [{ name: "Dashboard", path: "/admin", icon: LayoutDashboard, show: true }],
        },
        {
          label: "Website",
          items: [
            { name: "Website Customizer", path: "/admin/content", icon: FileEdit, show: can("website") },
            { name: "Offers & Registrations", path: "/admin/offers", icon: Gift, show: can("website") },
            { name: "Useful Links", path: "/admin/links", icon: Link2, show: can("website") },
            { name: "Asset Library", path: "/admin/assets", icon: ImageIcon, show: can("website") },
          ],
        },
        {
          label: "Members & services",
          items: [
            { name: "Members & Listings", path: "/admin/services", icon: Briefcase, show: can("services") },
            { name: "Distributors Directory", path: "/admin/catalogs", icon: Truck, show: can("services") },
            { name: "Medicine Data Bundle", path: "/admin/medicine-data", icon: FileSpreadsheet, show: can("bundles") },
          ],
        },
        {
          label: "Engagement",
          items: [{ name: "Leads Inbox", path: "/admin/leads", icon: Inbox, show: can("leads") }],
        },
        {
          label: "Administration",
          items: [{ name: "Team & Permissions", path: "/admin/users", icon: UsersRound, show: isRootAdmin }],
        },
      ]
        .map((g) => ({ ...g, items: g.items.filter((i) => i.show) }))
        .filter((g) => g.items.length > 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isRootAdmin, JSON.stringify(user.permissions)]
  );

  const current = groups.flatMap((g) => g.items).find((i) => i.path === location.pathname);

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      /* session already gone */
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/admin/login");
    }
  };

  const Sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-[72px] items-center justify-between px-5">
        <Link to="/admin">
          <FullLogo size="sm" theme="dark" />
        </Link>
        <button
          type="button"
          onClick={() => setIsSidebarOpen(false)}
          className="rounded-lg p-2 text-ink-400 hover:bg-white/10 hover:text-white lg:hidden"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 pb-6 pt-2">
        {groups.map((group) => (
          <div key={group.label}>
            <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-500">{group.label}</p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                      active ? "bg-white/10 text-white" : "text-ink-300 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    {active && <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-brand-400" />}
                    <item.icon className={`h-[18px] w-[18px] ${active ? "text-brand-300" : "text-ink-500 group-hover:text-ink-300"}`} />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-3 rounded-xl p-2">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-700 text-xs font-bold text-white">
            {(user.name || user.email || "A").slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{user.name || "Administrator"}</p>
            <p className="flex items-center gap-1 truncate text-xs text-ink-400">
              {isRootAdmin && <ShieldCheck className="h-3 w-3 text-brand-300" />}
              {isRootAdmin ? "Root admin" : "Team member"}
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg p-2 text-ink-400 transition hover:bg-rose-500/15 hover:text-rose-300"
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-ink-50 text-ink-900 lg:flex">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-[100dvh] w-72 shrink-0 bg-ink-950 lg:block">{Sidebar}</aside>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-ink-950/50 backdrop-blur-sm lg:hidden"
              onClick={() => setIsSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 left-0 z-50 w-[85%] max-w-xs bg-ink-950 lg:hidden"
            >
              {Sidebar}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="min-w-0 flex-1">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-ink-200/70 bg-white/85 px-4 backdrop-blur-xl sm:px-6 lg:px-10">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-ink-200 bg-white text-ink-700 lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <p className="text-xs font-medium text-ink-400">Admin</p>
              <p className="truncate font-display text-sm font-bold text-ink-900">{current?.name || "Dashboard"}</p>
            </div>
          </div>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-ink-200 bg-white px-3 py-2 text-xs font-semibold text-ink-700 shadow-soft transition hover:border-brand-300 hover:text-brand-700"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">View live site</span>
          </a>
        </header>

        <main className="px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">
          <div className="mx-auto max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
