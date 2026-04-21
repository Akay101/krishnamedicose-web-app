import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, UserPlus, Shield, Mail, Phone, Trash2, Power, PowerOff, CheckCircle2, XCircle, Search, Edit3 } from 'lucide-react';
import axios from 'axios';

export default function UsersManager() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    mobile: '',
    permissions: { website: false, leads: false }
  });

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/users`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setUsers(response.data);
    } catch (err) {
      console.error('Failed to fetch users', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/users`, formData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setShowAddModal(false);
      resetForm();
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create user');
    }
  };

  const toggleStatus = async (user) => {
    try {
      await axios.patch(`${import.meta.env.VITE_API_URL}/users/${user._id}`, 
        { isActive: !user.isActive },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      fetchUsers();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const deleteUser = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/users/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '', email: '', password: '', mobile: '',
      permissions: { website: false, leads: false }
    });
  };

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-bold font-outfit mb-2 flex items-center gap-4">
            Team <span className="text-primary italic">Management</span>
          </h1>
          <p className="text-slate-400">Control who can access and manage your digital workspace.</p>
        </div>
        
        <button 
          onClick={() => setShowAddModal(true)}
          className="btn-primary px-8 py-4 flex items-center gap-3 group"
        >
          <UserPlus className="w-5 h-5 group-hover:scale-110 transition-transform" />
          Add Member
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
        <input 
          type="text" 
          placeholder="Search members by name or email..." 
          className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:border-primary transition-all"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <AnimatePresence>
          {filteredUsers.map((user) => (
            <motion.div
              layout
              key={user._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-morphism rounded-[2rem] p-8 relative overflow-hidden"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="flex gap-4">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold ${user.isActive ? 'bg-primary/20 text-primary' : 'bg-slate-800 text-slate-500'}`}>
                    {user.name?.[0] || user.email[0].toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold font-outfit">{user.name || 'Staff Member'}</h3>
                    <div className="flex items-center gap-4 text-sm text-slate-400 mt-1">
                      <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {user.email}</span>
                      {user.mobile && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {user.mobile}</span>}
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button 
                    onClick={() => toggleStatus(user)}
                    className={`p-3 rounded-xl transition-all ${user.isActive ? 'bg-green-400/10 text-green-400 hover:bg-green-400/20' : 'bg-red-400/10 text-red-400 hover:bg-red-400/20'}`}
                    title={user.isActive ? "Deactivate" : "Activate"}
                  >
                    {user.isActive ? <Power className="w-5 h-5" /> : <PowerOff className="w-5 h-5" />}
                  </button>
                  <button 
                    onClick={() => deleteUser(user._id)}
                    className="p-3 rounded-xl bg-white/5 text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-all"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <PermissionCard label="Website Access" granted={user.role === 'admin' || user.permissions?.website} />
                <PermissionCard label="Leads Viewer" granted={user.role === 'admin' || user.permissions?.leads} />
              </div>

              {user.email === 'amanyadavu65@gmail.com' && (
                <div className="absolute top-0 right-0 p-4">
                  <span className="px-3 py-1 bg-primary text-dark text-[10px] font-black uppercase rounded-bl-xl tracking-widest">Root Admin</span>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Add User Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddModal(false)} className="absolute inset-0 bg-dark/80 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative w-full max-w-2xl glass-morphism rounded-[3rem] p-12 overflow-hidden border-white/20 shadow-2xl">
              <h2 className="text-3xl font-bold font-outfit mb-8">Add New <span className="text-primary">Member</span></h2>
              
              <form onSubmit={handleAddUser} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <input required placeholder="Full Name" className="bg-white/5 border border-white/10 rounded-2xl px-6 py-4 w-full focus:outline-none focus:border-primary transition-all" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                  <input required type="tel" placeholder="Mobile Number" className="bg-white/5 border border-white/10 rounded-2xl px-6 py-4 w-full focus:outline-none focus:border-primary transition-all" value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} />
                </div>
                <input required type="email" placeholder="Email Address" className="bg-white/5 border border-white/10 rounded-2xl px-6 py-4 w-full focus:outline-none focus:border-primary transition-all" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                <input required type="password" placeholder="Temporal Password" className="bg-white/5 border border-white/10 rounded-2xl px-6 py-4 w-full focus:outline-none focus:border-primary transition-all" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                
                <div className="space-y-4">
                  <p className="text-sm font-bold text-slate-400 flex items-center gap-2"><Shield className="w-4 h-4" /> Set Access Permissions</p>
                  <div className="grid grid-cols-2 gap-4">
                    <PermissionToggle label="Edit Website" active={formData.permissions.website} onToggle={() => setFormData({...formData, permissions: {...formData.permissions, website: !formData.permissions.website}})} />
                    <PermissionToggle label="Manage Leads" active={formData.permissions.leads} onToggle={() => setFormData({...formData, permissions: {...formData.permissions, leads: !formData.permissions.leads}})} />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button type="submit" className="btn-primary flex-1 py-4 font-bold">Create Member Account</button>
                  <button type="button" onClick={() => setShowAddModal(false)} className="bg-white/5 hover:bg-white/10 px-8 py-4 rounded-2xl font-bold transition-all">Cancel</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PermissionCard({ label, granted }) {
  return (
    <div className={`p-4 rounded-2xl border flex items-center justify-between ${granted ? 'bg-primary/5 border-primary/20 text-white' : 'bg-white/2 border-white/5 text-slate-500'}`}>
      <span className="text-xs font-bold">{label}</span>
      {granted ? <CheckCircle2 className="w-4 h-4 text-primary" /> : <XCircle className="w-4 h-4" />}
    </div>
  );
}

function PermissionToggle({ label, active, onToggle }) {
  return (
    <button type="button" onClick={onToggle} className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${active ? 'bg-primary/10 border-primary text-primary' : 'bg-white/5 border-white/10 text-slate-500 hover:border-white/20'}`}>
      <span className="text-xs font-bold">{label}</span>
      <div className={`w-10 h-6 rounded-full relative transition-colors ${active ? 'bg-primary' : 'bg-slate-700'}`}>
        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${active ? 'left-5' : 'left-1'}`} />
      </div>
    </button>
  );
}
