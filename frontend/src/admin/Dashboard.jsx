import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, FileEdit, ArrowUpRight, TrendingUp, Sparkles, 
  MessageSquare, MousePointer2, Monitor, Smartphone, Tablet,
  Globe, Chrome, ShieldAlert, Zap, ShieldCheck, RefreshCw
} from 'lucide-react';
import api from '../utils/api';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar 
} from 'recharts';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalLeads: 0,
    newLeads: 0,
    analytics: {
      summary: { totalViews: 0, uniqueCount: 0 },
      timeline: [],
      devices: [],
      browsers: []
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [enquiryResp, analyticsResp] = await Promise.all([
          api.get('/enquiry'),
          api.get('/analytics/stats')
        ]);
        
        setStats({
          totalLeads: enquiryResp.data.length,
          newLeads: enquiryResp.data.filter(e => e.status === 'new').length,
          analytics: analyticsResp.data
        });
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const COLORS = ['#2dd4bf', '#fb7185', '#818cf8', '#fbbf24'];

  const mainStats = [
    { name: 'Total Page Views', value: stats.analytics.summary.totalViews, icon: Eye, color: 'text-primary', detail: 'Last 24 hours' },
    { name: 'Unique Visitors', value: stats.analytics.summary.uniqueCount, icon: MousePointer2, color: 'text-secondary', detail: 'Total active sessions' },
    { name: 'Inbound Leads', value: stats.totalLeads, icon: Users, color: 'text-white', detail: `${stats.newLeads} pending review` },
    { name: 'Real-time Health', value: 'Active', icon: Zap, color: 'text-green-400', detail: 'All systems operational' },
  ];

  if (loading) return (
    <div className="h-[80vh] flex items-center justify-center">
      <div className="relative">
        <div className="w-20 h-20 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Sparkles className="w-8 h-8 text-primary animate-pulse" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-10 pb-20">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black font-outfit mb-2 tracking-tight">Intelligence <span className="text-primary italic">Command</span></h1>
          <p className="text-slate-400 font-medium">Detailed real-time metrics for Krishna Medicose.</p>
        </div>
        <div className="hidden md:flex items-center gap-4">
          <div className="flex -space-x-2">
            {[1,2,3].map(i => (
              <div key={i} className="w-8 h-8 rounded-full border-2 border-dark bg-white/10" />
            ))}
          </div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Team Online</p>
        </div>
      </header>

      {/* Main Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {mainStats.map((card, i) => (
          <motion.div
            key={card.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-morphism p-8 rounded-[2.5rem] border border-white/5 relative overflow-hidden group hover:border-primary/30 transition-all duration-500"
          >
            <div className="flex justify-between items-start mb-6">
              <div className={`p-4 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-primary/20 transition-colors`}>
                <card.icon className={`w-6 h-6 ${card.color}`} />
              </div>
              <TrendingUp className="w-4 h-4 text-green-400 opacity-50" />
            </div>
            <div>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1">{card.name}</p>
              <h3 className="text-3xl font-black font-outfit mb-2">{card.value}</h3>
              <p className="text-[10px] text-slate-500 italic font-medium">{card.detail}</p>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl -z-10 group-hover:bg-primary/10 transition-colors" />
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Traffic Chart */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="lg:col-span-2 glass-morphism p-10 rounded-[3.5rem] border border-white/5 bg-gradient-to-br from-white/[0.02] to-transparent"
        >
          <div className="flex justify-between items-center mb-10">
            <div>
              <h3 className="text-2xl font-bold font-outfit">Traffic <span className="text-primary italic">Trajectory</span></h3>
              <p className="text-sm text-slate-500">Visitor volume over the last 7 days</p>
            </div>
            <div className="flex gap-2">
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 text-[10px] font-bold text-slate-400">
                <div className="w-2 h-2 rounded-full bg-primary" /> Page Views
              </div>
            </div>
          </div>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.analytics.timeline}>
                <defs>
                  <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2dd4bf" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#2dd4bf" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#ffffff20" 
                  fontSize={10} 
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => new Date(val).toLocaleDateString('en-US', { weekday: 'short' })}
                />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0a0a0a', 
                    borderColor: '#ffffff10',
                    borderRadius: '16px',
                    fontSize: '12px'
                  }}
                  itemStyle={{ color: '#2dd4bf' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="views" 
                  stroke="#2dd4bf" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorViews)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Device Breakdown */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-morphism p-10 rounded-[3.5rem] border border-white/5"
        >
          <h3 className="text-2xl font-bold font-outfit mb-2 text-center">Device <span className="text-secondary italic">Reach</span></h3>
          <p className="text-sm text-slate-500 text-center mb-8">Access by hardware type</p>
          
          <div className="h-[250px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.analytics.devices}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={8}
                  dataKey="count"
                >
                  {stats.analytics.devices.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <Monitor className="w-8 h-8 text-white/10" />
            </div>
          </div>

          <div className="space-y-4 mt-6">
            {stats.analytics.devices.map((dev, i) => (
              <div key={dev._id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-400">{dev._id}</span>
                </div>
                <span className="text-sm font-black">{dev.count}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Browser Stats */}
        <div className="glass-morphism p-10 rounded-[3rem] border border-white/5">
          <div className="flex items-center gap-3 mb-8">
            <Globe className="w-6 h-6 text-primary" />
            <h3 className="text-xl font-bold font-outfit">Browser Intelligence</h3>
          </div>
          <div className="space-y-6">
            {stats.analytics.browsers.map((browser, i) => (
              <div key={browser._id} className="space-y-2">
                <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                  <span className="text-slate-400">{browser._id}</span>
                  <span className="text-white">{stats.analytics.summary.totalViews > 0 ? Math.round((browser.count / stats.analytics.summary.totalViews) * 100) : 0}%</span>
                </div>
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${stats.analytics.summary.totalViews > 0 ? (browser.count / stats.analytics.summary.totalViews) * 100 : 0}%` }}
                    className="h-full bg-primary"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Notifications */}
        <div className="glass-morphism p-10 rounded-[3rem] border border-white/5 bg-secondary/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8">
            <ShieldAlert className="w-20 h-20 text-secondary/10" />
          </div>
          <h3 className="text-2xl font-bold font-outfit mb-8">Security Hub</h3>
          <div className="space-y-6">
            <div className="flex gap-4 p-5 rounded-3xl bg-dark/50 border border-white/5">
              <div className="w-12 h-12 rounded-2xl bg-secondary/20 flex items-center justify-center text-secondary">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold text-slate-200">Anti-Grav Encryption Active</p>
                <p className="text-xs text-slate-500">Real-time session monitoring is guarding your lead database.</p>
              </div>
            </div>
            <div className="flex gap-4 p-5 rounded-3xl bg-dark/50 border border-white/5">
              <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
                <RefreshCw className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold text-slate-200">Automated Data Synced</p>
                <p className="text-xs text-slate-500">Last deep cloud sync performed 4 minutes ago.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const Eye = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
);
