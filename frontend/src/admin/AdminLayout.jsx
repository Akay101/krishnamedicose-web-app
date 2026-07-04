import { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileEdit, Users, LogOut, Sparkles, Image as ImageIcon, Gift, Menu, X, FileSpreadsheet } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';
import Logo from '../components/Logo';

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isRootAdmin = user.email === 'amanyadavu65@gmail.com';

  // Close sidebar on navigation (mobile)
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

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
      name: 'Medicine Dataset', 
      path: '/admin/medicine-data', 
      icon: FileSpreadsheet, 
      show: isRootAdmin 
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
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col lg:flex-row">
      {/* Mobile Navbar */}
      <div className="lg:hidden flex items-center justify-between p-6 border-b border-slate-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-[60]">
        <Logo size="sm" />
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-3 bg-slate-100 rounded-2xl text-teal-600"
        >
          {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar */}
      <AnimatePresence>
        {(isSidebarOpen || window.innerWidth >= 1024) && (
          <motion.aside 
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={`w-72 border-r border-slate-200 bg-white p-8 flex flex-col fixed lg:sticky top-0 h-[100dvh] z-50 overflow-y-auto ${
              isSidebarOpen ? 'left-0' : '-left-full lg:left-0'
            }`}
          >
            <div className="mb-12 hidden lg:block">
              <Logo size="sm" />
              <p className="text-[10px] font-extrabold uppercase text-slate-400 tracking-widest mt-2 px-1">Admin Command Hub</p>
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
                        ? 'bg-teal-50 text-teal-700 border border-teal-200/60' 
                        : 'hover:bg-slate-50 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <item.icon className={`w-5 h-5 ${isActive ? 'text-teal-600' : 'text-slate-400 group-hover:text-slate-800'}`} />
                    <span className="font-extrabold font-outfit">{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            <button 
              onClick={handleLogout}
              className="flex items-center gap-4 px-6 py-4 rounded-2xl text-slate-500 hover:text-red-600 hover:bg-red-50 transition-all duration-300 mt-8 lg:mt-auto"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-extrabold font-outfit">Logout</span>
            </button>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/30 z-40 lg:hidden animate-fade-in" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <main className="flex-1 p-6 lg:p-12 relative min-w-0">
        <div className="max-w-6xl mx-auto">
          <Outlet />
        </div>
        
        <div className="fixed top-0 right-0 w-[400px] lg:w-[800px] h-[400px] lg:h-[800px] bg-teal-500/5 blur-[100px] lg:blur-[150px] rounded-full -z-10" />
        <div className="fixed bottom-0 right-0 w-[300px] lg:w-[600px] h-[300px] lg:h-[600px] bg-sky-500/5 blur-[100px] lg:blur-[150px] rounded-full -z-10" />
      </main>
    </div>
  );
}
