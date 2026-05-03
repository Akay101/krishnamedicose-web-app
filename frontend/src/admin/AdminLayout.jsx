import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileEdit, Users, LogOut, Sparkles, Image as ImageIcon, Gift } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../utils/api';
import Logo from '../components/Logo';

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isRootAdmin = user.email === 'amanyadavu65@gmail.com';

  const menuItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard, show: true },
    { 
      name: 'Edit Website', 
      path: '/admin/content', 
      icon: FileEdit, 
      show: isRootAdmin || user.permissions?.website 
    },
    { 
      name: 'Offers & Services', 
      path: '/admin/offers', 
      icon: Gift, 
      show: isRootAdmin || user.permissions?.website 
    },
    { 
      name: 'Asset Library', 
      path: '/admin/assets', 
      icon: ImageIcon, 
      show: isRootAdmin || user.permissions?.website 
    },
    { 
      name: 'Leads / Inbox', 
      path: '/admin/leads', 
      icon: Users, 
      show: isRootAdmin || user.permissions?.leads 
    },
    { 
      name: 'Team Members', 
      path: '/admin/users', 
      icon: Sparkles, 
      show: isRootAdmin 
    },
  ].filter(item => item.show);

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Logout failed:', err);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/admin/login');
    }
  };

  return (
    <div className="min-h-screen bg-dark text-white flex">
      <aside className="w-72 border-r border-white/5 bg-dark-lighter/50 backdrop-blur-xl p-8 flex flex-col fixed h-full z-50">
        <div className="mb-12">
          <Logo size="sm" />
          <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mt-2 px-1">Admin Command Hub</p>
        </div>

        <nav className="flex-1 space-y-2">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 group ${
                  isActive 
                    ? 'bg-primary/10 text-primary border border-primary/20' 
                    : 'hover:bg-white/5 text-slate-400 hover:text-white'
                }`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? 'text-primary' : 'group-hover:text-white'}`} />
                <span className="font-bold font-outfit">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <button 
          onClick={handleLogout}
          className="flex items-center gap-4 px-6 py-4 rounded-2xl text-slate-500 hover:text-red-400 hover:bg-red-400/5 transition-all duration-300 mt-auto"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-bold font-outfit">Logout</span>
        </button>
      </aside>

      <main className="flex-1 ml-72 p-12 relative">
        <div className="max-w-6xl mx-auto">
          <Outlet />
        </div>
        
        <div className="fixed top-0 right-0 w-[800px] h-[800px] bg-primary/5 blur-[150px] rounded-full -z-10" />
        <div className="fixed bottom-0 left-72 w-[600px] h-[600px] bg-secondary/5 blur-[150px] rounded-full -z-10" />
      </main>
    </div>
  );
}
