import { useState, useEffect } from 'react';
import api from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Phone, MapPin, Send, CheckCircle2, Inbox, Search, RefreshCw, ChevronRight, ArrowLeft } from 'lucide-react';
import FollowUpModal from './components/FollowUpModal';
import { useModal } from '../context/ModalContext';

export default function LeadsManager() {
  const { showModal } = useModal();
  const [leads, setLeads] = useState([]);
  const [selectedLead, setSelectedLead] = useState(null);
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [counts, setCounts] = useState({ total: 0, pending: 0, completed: 0 });
  const [isUpdatingFollowUp, setIsUpdatingFollowUp] = useState(false);
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);

  useEffect(() => {
    fetchLeads();
  }, [page, statusFilter]);

  const fetchLeads = async () => {
    try {
      const resp = await api.get('/enquiry', {
        params: { page, limit: 10, status: statusFilter }
      });
      setLeads(resp.data.data);
      setTotalPages(resp.data.totalPages);
      setCounts({
        total: resp.data.total,
        pending: resp.data.pendingCount,
        completed: resp.data.completedCount
      });
      if (resp.data.data.length > 0 && !selectedLead) {
        setSelectedLead(resp.data.data[0]);
      }
    } catch (err) {
      console.error('Failed to fetch leads:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateFollowUp = async (id, status, notes) => {
    setIsUpdatingFollowUp(true);
    try {
      const resp = await api.patch(`/enquiry/${id}/followup`, {
        followUpStatus: status,
        followUpNotes: notes
      });
      setSelectedLead(resp.data);
      setLeads(prev => prev.map(l => l._id === id ? resp.data : l));
      // Refresh counts
      const countsResp = await api.get('/enquiry', { params: { page: 1, limit: 1 } });
      setCounts({
        total: countsResp.data.total,
        pending: countsResp.data.pendingCount,
        completed: countsResp.data.completedCount
      });
    } catch (err) {
      showModal({ title: 'Update Error', message: 'Failed to update follow-up status.', type: 'error' });
    } finally {
      setIsUpdatingFollowUp(false);
    }
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!reply.trim()) return;
    setSending(true);
    try {
      await api.post(`/enquiry/${selectedLead._id}/reply`, { message: reply });
      setReply('');
      fetchLeads();
      showModal({ title: 'Reply Sent', message: 'Your professional response has been sent and the status updated.', type: 'success' });
    } catch (err) {
      showModal({ title: 'Send Error', message: 'Failed to send the reply. Please try again.', type: 'error' });
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
    <div className="h-full space-y-6 lg:space-y-8">
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold font-outfit mb-2">Leads / <span className="text-primary italic">Inbox</span></h1>
          <p className="text-sm lg:text-base text-slate-400 font-medium">Manage and respond to your business enquiries.</p>
        </div>
        <div className="flex flex-wrap gap-2 lg:gap-3">
          <button 
            onClick={() => { setStatusFilter(''); setPage(1); }}
            className={`flex-1 lg:flex-none px-4 lg:px-6 py-2.5 lg:py-3 rounded-xl lg:rounded-2xl font-bold text-[9px] lg:text-xs uppercase tracking-widest transition-all border whitespace-nowrap ${!statusFilter ? 'bg-primary text-dark border-primary' : 'bg-white/5 text-slate-500 border-white/5 hover:border-white/20'}`}
          >
            All ({counts.total})
          </button>
          <button 
            onClick={() => { setStatusFilter('pending'); setPage(1); }}
            className={`flex-1 lg:flex-none px-4 lg:px-6 py-2.5 lg:py-3 rounded-xl lg:rounded-2xl font-bold text-[9px] lg:text-xs uppercase tracking-widest transition-all border whitespace-nowrap ${statusFilter === 'pending' ? 'bg-yellow-400/20 text-yellow-400 border-yellow-400/30' : 'bg-white/5 text-slate-500 border-white/5 hover:border-white/20'}`}
          >
            Pending ({counts.pending})
          </button>
          <button 
            onClick={() => { setStatusFilter('completed'); setPage(1); }}
            className={`flex-1 lg:flex-none px-4 lg:px-6 py-2.5 lg:py-3 rounded-xl lg:rounded-2xl font-bold text-[9px] lg:text-xs uppercase tracking-widest transition-all border whitespace-nowrap ${statusFilter === 'completed' ? 'bg-green-400/20 text-green-400 border-green-400/30' : 'bg-white/5 text-slate-500 border-white/5 hover:border-white/20'}`}
          >
            Followed ({counts.completed})
          </button>
        </div>
      </header>

      <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6 lg:gap-8 min-h-[60vh] lg:h-[75vh]">
        {/* Leads List */}
        <div className={`lg:col-span-1 flex flex-col space-y-4 ${selectedLead && 'hidden lg:flex'}`}>
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder="Search by name or email..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 lg:py-3 pl-12 pr-6 focus:outline-none focus:border-primary/50 transition-all text-sm font-medium"
            />
          </div>

          <div className="flex-1 lg:overflow-y-auto space-y-3 pr-0 lg:pr-2 custom-scrollbar">
            {filteredLeads.length === 0 ? (
              <div className="text-center py-20 bg-white/5 rounded-[2rem] border border-white/5">
                <Inbox className="w-10 h-10 text-slate-700 mx-auto mb-4" />
                <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">No leads found</p>
              </div>
            ) : filteredLeads.map(lead => (
              <button
                key={lead._id}
                onClick={() => setSelectedLead(lead)}
                className={`w-full text-left p-5 lg:p-6 rounded-[2rem] border transition-all duration-300 relative group ${
                  selectedLead?._id === lead._id 
                    ? 'bg-primary/20 border-primary/30' 
                    : 'bg-white/5 border-white/5 hover:bg-white/10'
                }`}
              >
                <div className="flex justify-between items-start mb-2 gap-2">
                  <span className="font-bold text-slate-200 truncate">{lead.name}</span>
                  <div className="flex gap-1.5 shrink-0">
                    <span className={`text-[7px] lg:text-[8px] uppercase font-black py-0.5 lg:py-1 px-1.5 lg:px-2 rounded-md ${
                      lead.followUpStatus === 'completed' ? 'bg-green-400/20 text-green-400' : 'bg-yellow-400/20 text-yellow-400'
                    }`}>
                      {lead.followUpStatus || 'pending'}
                    </span>
                  </div>
                </div>
                <div className="text-[11px] lg:text-xs text-slate-500 truncate mb-4">{lead.description}</div>
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-slate-600">
                  <span>{new Date(lead.createdAt).toLocaleDateString()}</span>
                  <ChevronRight className={`w-4 h-4 transition-transform ${selectedLead?._id === lead._id ? 'rotate-90 text-primary' : 'group-hover:translate-x-1'}`} />
                </div>
              </button>
            ))}

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 pt-4 pb-6">
                <button 
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                  className="p-3 bg-white/5 rounded-xl disabled:opacity-30 hover:bg-white/10 transition-all"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{page} / {totalPages}</span>
                <button 
                  disabled={page === totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="p-3 bg-white/5 rounded-xl disabled:opacity-30 hover:bg-white/10 transition-all"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Lead Details & Reply */}
        <div className={`lg:col-span-2 flex flex-col h-full ${!selectedLead && 'hidden lg:flex'}`}>
          <AnimatePresence mode="wait">
            {selectedLead ? (
              <motion.div
                key={selectedLead._id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex-1 flex flex-col glass-morphism rounded-[2.5rem] lg:rounded-[3rem] border border-white/5 overflow-hidden bg-dark-lighter/30"
              >
                <div className="p-6 lg:p-10 border-b border-white/5 bg-white/5">
                  <div className="flex items-center gap-4 mb-6">
                    <button 
                      onClick={() => setSelectedLead(null)}
                      className="lg:hidden p-2.5 bg-white/5 rounded-xl text-slate-400"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h2 className="text-xl lg:text-2xl font-bold font-outfit truncate">{selectedLead.name}</h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-primary shrink-0">
                        <Mail className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[9px] lg:text-[10px] font-bold text-slate-500 uppercase">Email</div>
                        <div className="text-xs lg:text-sm font-bold truncate">{selectedLead.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-secondary shrink-0">
                        <Phone className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[9px] lg:text-[10px] font-bold text-slate-500 uppercase">Mobile</div>
                        <div className="text-xs lg:text-sm font-bold truncate">{selectedLead.mobile}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white shrink-0">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[9px] lg:text-[10px] font-bold text-slate-500 uppercase">Location</div>
                        <div className="text-xs lg:text-sm font-bold truncate">{selectedLead.country}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex-1 p-6 lg:p-10 lg:overflow-y-auto space-y-6 lg:space-y-8 custom-scrollbar">
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
                    <div className="space-y-4">
                      <div className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">Enquiry Description</div>
                      <div className="bg-white/5 p-6 lg:p-8 rounded-[2rem] text-sm lg:text-base text-slate-300 leading-relaxed border border-white/5">
                        {selectedLead.description}
                      </div>
                    </div>

                    <div className="flex flex-col space-y-4">
                      <div className="text-[10px] font-bold text-secondary uppercase tracking-[0.2em]">Follow-up Management</div>
                      <div className="bg-secondary/5 p-6 lg:p-8 rounded-[2rem] border border-secondary/10 flex-1 flex flex-col space-y-4 lg:space-y-6">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${selectedLead.followUpStatus === 'completed' ? 'bg-green-400' : 'bg-yellow-400'}`} />
                            <span className="text-xs lg:text-sm font-bold capitalize text-slate-200">
                              {selectedLead.followUpStatus || 'pending'}
                            </span>
                          </div>
                          <button 
                            onClick={() => {
                              if (selectedLead.followUpStatus === 'completed') {
                                handleUpdateFollowUp(selectedLead._id, 'pending', selectedLead.followUpNotes);
                              } else {
                                setShowFollowUpModal(true);
                              }
                            }}
                            className={`px-3 lg:px-4 py-2 rounded-xl text-[9px] lg:text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap shrink-0 ${
                              selectedLead.followUpStatus === 'completed' 
                                ? 'bg-yellow-400/20 text-yellow-400 hover:bg-yellow-400/30' 
                                : 'bg-green-400/20 text-green-400 hover:bg-green-400/30'
                            }`}
                          >
                            {selectedLead.followUpStatus === 'completed' ? 'Reset' : 'Done'}
                          </button>
                        </div>
                        
                        <div 
                          onClick={() => setShowFollowUpModal(true)}
                          className="flex-1 bg-dark/50 border border-white/5 rounded-2xl p-4 text-xs lg:text-sm text-slate-400 cursor-pointer hover:bg-dark/70 transition-all min-h-[80px]"
                        >
                          <label className="text-[8px] lg:text-[9px] font-black text-slate-600 uppercase block mb-1">Follow-up Notes</label>
                          {selectedLead.followUpNotes || 'Click to add internal notes...'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {selectedLead.replies && selectedLead.replies.length > 0 && (
                    <div className="space-y-4 lg:space-y-6">
                      <div className="text-[10px] font-bold text-green-400 uppercase tracking-[0.2em]">Our Replies</div>
                      {selectedLead.replies.map((r, i) => (
                        <div key={i} className="bg-green-400/5 p-5 lg:p-6 rounded-[1.5rem] lg:rounded-[2rem] text-slate-300 border border-green-400/10 ml-4 lg:ml-12 relative">
                          <CheckCircle2 className="absolute -left-4 lg:-left-8 top-5 lg:top-6 w-4 lg:w-5 h-4 lg:h-5 text-green-400" />
                          <p className="text-xs lg:text-sm">{r.message}</p>
                          <p className="text-[9px] lg:text-[10px] font-bold text-slate-600 mt-3 lg:mt-4 uppercase">{new Date(r.sentAt).toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="p-6 lg:p-8 bg-dark-lighter/30 border-t border-white/5">
                  <form onSubmit={handleReply} className="relative group">
                    <textarea 
                      placeholder={`Draft a reply to ${selectedLead.name.split(' ')[0]}...`}
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      rows={2}
                      className="w-full bg-dark border border-white/10 rounded-2xl lg:rounded-[2rem] py-4 lg:py-6 pl-6 lg:pl-8 pr-16 focus:outline-none focus:border-primary/50 transition-all text-sm font-medium resize-none shadow-inner"
                    />
                    <button 
                      type="submit"
                      disabled={sending || !reply.trim()}
                      className="absolute right-3 lg:right-4 bottom-3 lg:bottom-4 w-10 lg:w-12 h-10 lg:h-12 rounded-full bg-primary text-dark flex items-center justify-center hover:scale-110 transition-transform disabled:opacity-50 shadow-lg shadow-primary/20"
                    >
                      {sending ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Send className="w-4 h-4 lg:w-5 lg:h-5" />}
                    </button>
                  </form>
                </div>

                <FollowUpModal 
                  isOpen={showFollowUpModal}
                  onClose={() => setShowFollowUpModal(false)}
                  initialNotes={selectedLead.followUpNotes}
                  onSave={(notes) => handleUpdateFollowUp(selectedLead._id, 'completed', notes)}
                  title={`Follow-up: ${selectedLead.name}`}
                />
              </motion.div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center glass-morphism rounded-[3rem] border border-white/5 text-slate-700 p-10 text-center">
                <Mail className="w-16 h-16 mb-6 opacity-10" />
                <p className="font-bold text-sm lg:text-base uppercase tracking-widest leading-relaxed">Select an enquiry to<br/>view full mission details</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
