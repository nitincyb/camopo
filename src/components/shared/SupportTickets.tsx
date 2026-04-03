import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { SupportTicket } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Plus, MessageSquare, AlertTriangle, CheckCircle, Clock, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function SupportTickets() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newTicket, setNewTicket] = useState({
    type: 'complaint' as 'complaint' | 'review' | 'sos',
    subject: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'critical'
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'support_tickets'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ticketData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SupportTicket[];
      setTickets(ticketData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching tickets:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newTicket.subject || !newTicket.description) return;

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'support_tickets'), {
        ...newTicket,
        userId: user.uid,
        status: 'open',
        createdAt: serverTimestamp()
      });
      setIsCreating(false);
      setNewTicket({ type: 'complaint', subject: '', description: '', priority: 'medium' });
    } catch (error) {
      console.error("Error creating ticket:", error);
      alert("Failed to submit ticket. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      case 'in_progress': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      case 'investigating': return 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20';
      case 'resolved': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      case 'closed': return 'text-zinc-500 bg-zinc-500/10 border-zinc-500/20';
      default: return 'text-zinc-500 bg-zinc-500/10 border-zinc-500/20';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'complaint': return <AlertTriangle size={16} />;
      case 'review': return <MessageSquare size={16} />;
      case 'sos': return <AlertTriangle size={16} className="text-red-500" />;
      default: return <MessageSquare size={16} />;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 flex flex-col">
      {/* Header */}
      <div className="bg-zinc-900 border-b border-zinc-800 p-4 sticky top-0 z-30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 bg-zinc-800 rounded-full hover:bg-zinc-700 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold">Support & Help</h1>
        </div>
        <button 
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-full text-sm font-bold hover:bg-emerald-700 transition-colors"
        >
          <Plus size={16} /> New Ticket
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
          </div>
        ) : tickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-zinc-500 space-y-4">
            <MessageSquare size={48} className="opacity-50" />
            <p>No support tickets found.</p>
            <button 
              onClick={() => setIsCreating(true)}
              className="text-emerald-500 font-semibold hover:underline"
            >
              Create your first ticket
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {tickets.map(ticket => (
              <motion.div 
                key={ticket.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-400">{getTypeIcon(ticket.type)}</span>
                    <h3 className="font-bold text-lg">{ticket.subject}</h3>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-md border uppercase tracking-wider ${getStatusColor(ticket.status)}`}>
                    {ticket.status.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-zinc-400 text-sm line-clamp-2">{ticket.description}</p>
                <div className="flex items-center gap-4 text-xs text-zinc-500 pt-2 border-t border-zinc-800/50">
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    {ticket.createdAt?.toDate ? new Date(ticket.createdAt.toDate()).toLocaleDateString() : 'Just now'}
                  </span>
                  <span className="uppercase tracking-wider">Priority: {ticket.priority}</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Create Ticket Modal */}
      <AnimatePresence>
        {isCreating && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="bg-zinc-900 w-full max-w-md rounded-t-3xl sm:rounded-3xl border border-zinc-800 flex flex-col max-h-[90vh]"
            >
              <div className="flex justify-between items-center p-6 border-b border-zinc-800">
                <h2 className="text-xl font-bold">New Support Ticket</h2>
                <button 
                  onClick={() => setIsCreating(false)}
                  className="p-2 text-zinc-400 hover:text-white bg-zinc-800/50 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Issue Type</label>
                  <select 
                    value={newTicket.type}
                    onChange={(e) => setNewTicket({...newTicket, type: e.target.value as any})}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="complaint">Complaint</option>
                    <option value="review">General Inquiry / Review</option>
                    <option value="sos">Safety Concern (SOS)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Priority</label>
                  <select 
                    value={newTicket.priority}
                    onChange={(e) => setNewTicket({...newTicket, priority: e.target.value as any})}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Subject</label>
                  <input 
                    type="text"
                    required
                    placeholder="Brief description of the issue"
                    value={newTicket.subject}
                    onChange={(e) => setNewTicket({...newTicket, subject: e.target.value})}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Details</label>
                  <textarea 
                    required
                    placeholder="Please provide as much detail as possible..."
                    rows={4}
                    value={newTicket.description}
                    onChange={(e) => setNewTicket({...newTicket, description: e.target.value})}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 resize-none"
                  />
                </div>

                <button 
                  type="submit"
                  disabled={submitting || !newTicket.subject || !newTicket.description}
                  className="w-full py-4 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                >
                  {submitting ? 'Submitting...' : 'Submit Ticket'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
