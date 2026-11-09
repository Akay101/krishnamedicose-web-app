import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  Briefcase,
  Eye,
  FileEdit,
  FileSpreadsheet,
  Inbox,
  IndianRupee,
  MousePointer2,
  RefreshCw,
  ShieldCheck,
  Stethoscope,
  UsersRound,
} from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import api from "../utils/api";
import servicesApi from "../utils/servicesApi";

const CHART_COLORS = ["#0D8576", "#38C2AC", "#F5920B", "#4A586D", "#70DBC7"];

const readUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
};

const fmt = (n) => (typeof n === "number" ? n.toLocaleString("en-IN") : n ?? "—");

function StatCard({ icon: Icon, label, value, detail, tone = "brand", delay = 0 }) {
  const tones = {
    brand: "bg-brand-50 text-brand-700 ring-brand-100",
    sky: "bg-sky-50 text-sky-700 ring-sky-100",
    saffron: "bg-saffron-50 text-saffron-600 ring-saffron-100",
    ink: "bg-ink-100 text-ink-700 ring-ink-200",
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="card p-5"
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-ink-500">{label}</p>
        <span className={`flex h-9 w-9 items-center justify-center rounded-xl ring-1 ring-inset ${tones[tone]}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-3 font-display text-3xl font-extrabold tracking-tight text-ink-900">{fmt(value)}</p>
      {detail && <p className="mt-1 text-xs text-ink-500">{detail}</p>}
    </motion.div>
  );
}

function Panel({ title, subtitle, children, className = "" }) {
  return (
    <div className={`card p-5 sm:p-6 ${className}`}>
      <div className="mb-5">
        <h2 className="text-base font-bold text-ink-900">{title}</h2>
        {subtitle && <p className="text-xs text-ink-500">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

const Empty = ({ text = "No data yet" }) => (
  <div className="flex h-56 items-center justify-center rounded-2xl border border-dashed border-ink-200 text-sm text-ink-400">{text}</div>
);

export default function Dashboard() {
  const user = readUser();
  const isRoot = user.role === "admin";
  const can = (perm) => isRoot || Boolean(user.permissions?.[perm]);

  const [data, setData] = useState({ analytics: null, leads: null, services: null, bundle: null });
  const [loading, setLoading] = useState(true);
  const [refreshedAt, setRefreshedAt] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    // Each widget only loads what this team member is allowed to see
    const [analytics, leads, services, bundle] = await Promise.allSettled([
      can("website") ? api.get("/analytics/stats") : Promise.reject(),
      can("leads") ? api.get("/enquiry", { params: { limit: 1 } }) : Promise.reject(),
      isRoot || can("services") ? servicesApi.get("/admin/stats") : Promise.reject(),
      can("bundles") ? api.get("/medicine-bundle/analytics") : Promise.reject(),
    ]);
    const val = (r) => (r.status === "fulfilled" ? r.value.data : null);
    setData({ analytics: val(analytics), leads: val(leads), services: val(services), bundle: val(bundle) });
    setRefreshedAt(new Date());
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const { analytics, leads, services, bundle } = data;
  const timeline = (analytics?.timeline || []).map((d) => ({
    ...d,
    day: new Date(d.date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric" }),
  }));
  const devices = (analytics?.devices || []).map((d) => ({ name: d._id || "Unknown", value: d.count }));
  const browsers = (analytics?.browsers || [])
    .map((b) => ({ name: b._id || "Other", value: b.count }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  const quickLinks = [
    { label: "Edit website content", to: "/admin/content", icon: FileEdit, show: can("website") },
    { label: "Review new leads", to: "/admin/leads", icon: Inbox, show: can("leads") },
    { label: "Review pending listings", to: "/admin/services", icon: ShieldCheck, show: isRoot || can("services") },
    { label: "Medicine data purchases", to: "/admin/medicine-data", icon: FileSpreadsheet, show: can("bundles") },
  ].filter((l) => l.show);

  const greeting = (() => {
    const h = new Date().getHours();
    return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  })();

  return (
    <div className="space-y-8 pb-12">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink-900 sm:text-3xl">
            {greeting}, {user.name?.split(" ")[0] || "Admin"}
          </h1>
          <p className="mt-1 text-sm text-ink-500">Here's how Krishna Medicose is performing.</p>
        </div>
        <button type="button" onClick={load} disabled={loading} className="btn-secondary self-start px-4 py-2.5 sm:self-auto">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          {refreshedAt ? `Updated ${refreshedAt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}` : "Refresh"}
        </button>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {can("website") && (
          <>
            <StatCard icon={Eye} label="Page views" value={analytics?.lifetime?.totalViews ?? 0} detail={`${fmt(analytics?.summary?.totalViews ?? 0)} in the last 24h`} />
            <StatCard icon={MousePointer2} label="Unique visitors" value={analytics?.lifetime?.uniqueCount ?? 0} detail={`${fmt(analytics?.summary?.uniqueCount ?? 0)} in the last 24h`} tone="sky" delay={0.05} />
          </>
        )}
        {can("leads") && (
          <StatCard icon={Inbox} label="Enquiries" value={leads?.total ?? 0} detail={`${fmt(leads?.pendingCount ?? 0)} awaiting follow-up`} tone="saffron" delay={0.1} />
        )}
        {(isRoot || can("services")) && (
          <StatCard icon={UsersRound} label="Members" value={services?.totalUsers ?? 0} detail={`${fmt(services?.totalOwners ?? 0)} pharmacies · ${fmt(services?.totalPharmacists ?? 0)} pharmacists`} tone="ink" delay={0.15} />
        )}
        {(isRoot || can("services")) && (
          <StatCard icon={ShieldCheck} label="Awaiting verification" value={(services?.pendingJobs ?? 0) + (services?.pendingCollabs ?? 0)} detail={`${fmt(services?.pendingJobs ?? 0)} jobs · ${fmt(services?.pendingCollabs ?? 0)} chambers`} tone="saffron" delay={0.18} />
        )}
        {(isRoot || can("services")) && (
          <StatCard icon={Briefcase} label="Active job posts" value={services?.totalActiveJobs ?? 0} detail={`${fmt(services?.totalApplications ?? 0)} applications received`} delay={0.2} />
        )}
        {(isRoot || can("services")) && (
          <StatCard icon={Stethoscope} label="Doctor collaborations" value={services?.totalActiveCollabs ?? 0} detail={`${fmt(services?.totalDoctors ?? 0)} doctors · ${fmt(services?.totalInquiries ?? 0)} inquiries`} tone="sky" delay={0.25} />
        )}
        {can("bundles") && (
          <>
            <StatCard icon={FileSpreadsheet} label="Bundle purchases" value={bundle?.totalPurchases ?? 0} detail={`${fmt(bundle?.activeSessions ?? 0)} active sessions now`} tone="saffron" delay={0.3} />
            <StatCard icon={IndianRupee} label="Bundle revenue" value={`₹${fmt(bundle?.totalRevenue ?? 0)}`} detail="Lifetime, verified payments" delay={0.35} />
          </>
        )}
      </div>

      {can("website") && (
        <div className="grid gap-4 lg:grid-cols-3">
          <Panel title="Traffic" subtitle="Page views and unique visitors · last 7 days" className="lg:col-span-2">
            {timeline.length ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timeline} margin={{ left: -18, right: 8, top: 4 }}>
                    <defs>
                      <linearGradient id="kmViews" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#16A692" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#16A692" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#EBEFF4" vertical={false} />
                    <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#66758B" }} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#66758B" }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #D8DFE8", fontSize: 12 }} />
                    <Area type="monotone" dataKey="views" name="Views" stroke="#0D8576" strokeWidth={2.5} fill="url(#kmViews)" />
                    <Area type="monotone" dataKey="uniques" name="Unique" stroke="#F5920B" strokeWidth={2} fill="transparent" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <Empty text="Traffic will appear once visitors arrive" />
            )}
          </Panel>

          <Panel title="Devices" subtitle="Last 7 days">
            {devices.length ? (
              <>
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={devices} dataKey="value" nameKey="name" innerRadius={48} outerRadius={72} paddingAngle={3} stroke="none">
                        {devices.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #D8DFE8", fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <ul className="mt-3 space-y-2">
                  {devices.map((d, i) => (
                    <li key={d.name} className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 capitalize text-ink-700">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                        {d.name}
                      </span>
                      <span className="font-semibold text-ink-900">{fmt(d.value)}</span>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <Empty />
            )}
          </Panel>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        {can("website") && (
          <Panel title="Browsers" subtitle="Top browsers · last 7 days" className="lg:col-span-2">
            {browsers.length ? (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={browsers} layout="vertical" margin={{ left: 10, right: 16 }}>
                    <CartesianGrid stroke="#EBEFF4" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: "#66758B" }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 12, fill: "#354255" }} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: "#F5F7FA" }} contentStyle={{ borderRadius: 12, border: "1px solid #D8DFE8", fontSize: 12 }} />
                    <Bar dataKey="value" name="Visits" fill="#16A692" radius={[0, 8, 8, 0]} barSize={18} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <Empty />
            )}
          </Panel>
        )}

        <Panel title="Quick actions" subtitle="Jump to common tasks" className={can("website") ? "" : "lg:col-span-3"}>
          <div className="space-y-2">
            {quickLinks.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="group flex items-center justify-between rounded-2xl border border-ink-200/70 px-4 py-3 text-sm font-medium text-ink-800 transition hover:border-brand-300 hover:bg-brand-50/50"
              >
                <span className="flex items-center gap-3">
                  <l.icon className="h-4 w-4 text-brand-600" />
                  {l.label}
                </span>
                <ArrowUpRight className="h-4 w-4 text-ink-300 transition group-hover:text-brand-600" />
              </Link>
            ))}
            {quickLinks.length === 0 && <p className="text-sm text-ink-500">Ask the root admin to grant you a permission.</p>}
          </div>
        </Panel>
      </div>
    </div>
  );
}
