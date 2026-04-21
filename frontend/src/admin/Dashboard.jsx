import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, FileEdit, ArrowUpRight, TrendingUp, Sparkles, MessageSquare } from 'lucide-react';
import axios from 'axios';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalLeads: 0,
    newLeads: 0,
    publishedVersion: '1.0.4',
    contentHealth: 'Excellent'
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const resp = await axios.get(`${import.meta.env.VITE_API_URL}/enquiry`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const enquiries = resp.data;
        setStats(prev => ({
          ...prev,
          totalLeads: enquiries.length,
          newLeads: enquiries.filter(e => e.status === 'new').length
        }));
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      }
    };
    fetchStats();
  }, []);

  const cards = [
    { name: 'Total Leads Collected', value: stats.totalLeads, icon: Users, color: 'text-primary' },
    { name: 'New Enquiries', value: stats.newLeads, icon: MessageSquare, color: 'text-secondary' },
    { name: 'Content Version', value: stats.publishedVersion, icon: FileEdit, color: 'text-white' },
    { name: 'System Status', value: stats.contentHealth, icon: TrendingUp, color: 'text-green-400' },
  ];

  return (
    <div className="space-y-12">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-bold font-outfit mb-2">Operations <span className="text-primary italic">Overview</span></h1>
          <p className="text-slate-400">Track your business growth and website performance.</p>
        </div>
        <div className="flex items-center gap-2 px-6 py-3 rounded-2xl glass border border-primary/20 text-primary font-bold text-sm">
          <Sparkles className="w-4 h-4" />
          Live Management Mode
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, i) => (
          <motion.div
            key={card.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-morphism p-8 rounded-[2.5rem] border border-white/5 group hover:border-primary/30 transition-all duration-500"
          >
            <div className={`w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
              <card.icon className={`w-7 h-7 ${card.color}`} />
            </div>
            <div className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">{card.name}</div>
            <div className="text-3xl font-black font-outfit mb-4">{card.value}</div>
            <div className="flex items-center gap-2 text-xs font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
              View Detailed Metrics <ArrowUpRight className="w-3 h-3" />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Quick Actions or Recent Lead Preview */}
        <div className="glass-morphism p-10 rounded-[3rem] border border-white/5">
          <h3 className="text-2xl font-bold font-outfit mb-8">System Notifications</h3>
          <div className="space-y-6">
            {[1, 2].map((_, i) => (
              <div key={i} className="flex gap-4 p-4 rounded-2xl hover:bg-white/5 transition-colors group cursor-pointer border border-transparent hover:border-white/10">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">!</div>
                <div>
                  <p className="font-bold text-slate-200">Daily Website Backup Successful</p>
                  <p className="text-sm text-slate-500">System completed a full content snapshot at 04:00 AM.</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-morphism p-10 rounded-[3rem] border border-white/5 bg-primary/5">
          <h3 className="text-2xl font-bold font-outfit mb-4 text-primary">Need Support?</h3>
          <p className="text-slate-400 mb-8 leading-relaxed">Your dashboard is connected to the ultra-modern medical framework. If you need assistance with API integrations or mailing templates, contact your developer.</p>
          <button className="btn-primary w-full py-4 rounded-2xl flex items-center justify-center gap-3 font-bold">
            Contact Technical Team
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
