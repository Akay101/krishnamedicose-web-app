import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Phone, MapPin, Send, CheckCircle2, Inbox, Search, RefreshCw, ChevronRight } from 'lucide-react';

export default function LeadsManager() {
  const [leads, setLeads] = useState([]);
  const [selectedLead, setSelectedLead] = useState(null);
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      const token = localStorage.getItem('token');
      const resp = await axios.get(`${import.meta.env.VITE_API_URL}/enquiry`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLeads(resp.data);
      if (resp.data.length > 0 && !selectedLead) {
        setSelectedLead(resp.data[0]);
      }
    } catch (err) {
      console.error('Failed to fetch leads:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!reply.trim()) return;
    setSending(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${import.meta.env.VITE_API_URL}/enquiry/${selectedLead._id}/reply`, { message: reply }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReply('');
      fetchLeads();
      alert('Reply sent and status updated!');
    } catch (err) {
      alert('Failed to send reply.');
    } finally {
      setSending(false);
    }
  };

  const filteredLeads = leads.filter(lead => 
    lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <RefreshCw className="w-10 h-10 text-primary animate-spin" />
      <p className="text-slate-400 font-bold tracking-widest text-xs">Accessing Secure Lead Database...</p>
    </div>
  );

  return (
    <div className="h-full space-y-8">
      <header>
        <h1 className="text-4xl font-bold font-outfit mb-2">Leads / <span className="text-primary italic">Inbox</span></h1>
        <p className="text-slate-400 font-medium">Manage and respond to your business enquiries.</p>
      </header>

      <div className="grid lg:grid-cols-3 gap-8 h-[75vh]">
        {/* Leads List */}
        <div className="lg:col-span-1 flex flex-col space-y-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder="Search by name or email..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-6 focus:outline-none focus:border-primary/50 transition-all text-sm font-medium"
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
            {filteredLeads.length === 0 ? (
              <div className="text-center py-20 bg-white/5 rounded-[2rem] border border-white/5">
                <Inbox className="w-10 h-10 text-slate-700 mx-auto mb-4" />
                <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">No leads found</p>
              </div>
            ) : filteredLeads.map(lead => (
              <button
                key={lead._id}
                onClick={() => setSelectedLead(lead)}
                className={`w-full text-left p-6 rounded-[2rem] border transition-all duration-300 relative group ${
                  selectedLead?._id === lead._id 
                    ? 'bg-primary/20 border-primary/30' 
                    : 'bg-white/5 border-white/5 hover:bg-white/10'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-bold text-slate-200">{lead.name}</span>
                  <span className={`text-[10px] uppercase font-bold py-1 px-2 rounded-lg ${
                    lead.status === 'new' ? 'bg-primary/20 text-primary' : 'bg-green-400/20 text-green-400'
                  }`}>
                    {lead.status}
                  </span>
                </div>
                <div className="text-xs text-slate-500 truncate mb-4">{lead.description}</div>
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-slate-600">
                  <span>{new Date(lead.createdAt).toLocaleDateString()}</span>
                  <ChevronRight className={`w-4 h-4 transition-transform ${selectedLead?._id === lead._id ? 'rotate-90 text-primary' : 'group-hover:translate-x-1'}`} />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Lead Details & Reply */}
        <div className="lg:col-span-2 flex flex-col h-full">
          <AnimatePresence mode="wait">
            {selectedLead ? (
              <motion.div
                key={selectedLead._id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex-1 flex flex-col glass-morphism rounded-[3rem] border border-white/5 overflow-hidden"
              >
                <div className="p-10 border-b border-white/5 bg-white/5">
                  <h2 className="text-2xl font-bold font-outfit mb-6">{selectedLead.name}</h2>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-primary">
                        <Mail className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[10px] font-bold text-slate-500 uppercase">Email Address</div>
                        <div className="text-sm font-bold truncate">{selectedLead.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-secondary">
                        <Phone className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-slate-500 uppercase">Mobile Number</div>
                        <div className="text-sm font-bold">{selectedLead.mobile}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-slate-500 uppercase">Location</div>
                        <div className="text-sm font-bold">{selectedLead.country}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex-1 p-10 overflow-y-auto space-y-8 custom-scrollbar">
                  <div>
                    <div className="text-[10px] font-bold text-primary uppercase mb-4 tracking-[0.2em]">Enquiry Description</div>
                    <div className="bg-white/5 p-8 rounded-[2rem] text-slate-300 leading-relaxed border border-white/5">
                      {selectedLead.description}
                    </div>
                  </div>

                  {selectedLead.replies && selectedLead.replies.length > 0 && (
                    <div className="space-y-6">
                      <div className="text-[10px] font-bold text-green-400 uppercase tracking-[0.2em]">Our Replies</div>
                      {selectedLead.replies.map((r, i) => (
                        <div key={i} className="bg-green-400/5 p-6 rounded-[2rem] text-slate-300 border border-green-400/10 ml-12 relative">
                          <CheckCircle2 className="absolute -left-8 top-6 w-5 h-5 text-green-400" />
                          <p className="text-sm">{r.message}</p>
                          <p className="text-[10px] font-bold text-slate-600 mt-4 uppercase">{new Date(r.sentAt).toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="p-8 bg-dark-lighter/30 border-t border-white/5">
                  <form onSubmit={handleReply} className="relative group">
                    <textarea 
                      placeholder={`Draft a professional response to ${selectedLead.name.split(' ')[0]}...`}
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      rows={3}
                      className="w-full bg-dark border border-white/10 rounded-[2rem] py-6 pl-8 pr-20 focus:outline-none focus:border-primary/50 transition-all text-sm font-medium resize-none shadow-inner"
                    />
                    <button 
                      type="submit"
                      disabled={sending || !reply.trim()}
                      className="absolute right-4 bottom-4 w-12 h-12 rounded-full bg-primary text-dark flex items-center justify-center hover:scale-110 transition-transform disabled:opacity-50 shadow-lg shadow-primary/20"
                    >
                      {sending ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    </button>
                  </form>
                </div>
              </motion.div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center glass-morphism rounded-[3rem] border border-white/5 text-slate-600">
                <Mail className="w-16 h-16 mb-4 opacity-10" />
                <p className="font-bold text-sm uppercase tracking-widest">Select a lead to view details</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
