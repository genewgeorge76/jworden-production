import React, { useState, useEffect } from 'react';
import { getOwnerToken } from '@/lib/ownerToken'
import { Mail, CheckCircle, AlertTriangle, Briefcase, Zap, Trash2 } from 'lucide-react';

export default function InboxTriagePanel() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTriageSummary();
  }, []);

  const fetchTriageSummary = async () => {
    try {
      setLoading(true);
      // SECURITY: never hardcode a fallback credential here. Anything in this
      // file is compiled into the public JS bundle and is readable by anyone
      // who views source on the live site. A literal master token previously
      // sat on this line and shipped publicly; if there is no owner session,
      // make no request rather than authenticating with a baked-in secret.
      const token = getOwnerToken();
      if (!token) {
        setMessages([]);
        return;
      }
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://jworden-api.fly.dev';
      const res = await fetch(`${baseUrl}/api/v1/email/triage`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error("Failed to fetch triage summary", err);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category) => {
    switch(category) {
      case 'Urgent': return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'Lead': return <Zap className="w-5 h-5 text-yellow-500" />;
      case 'Vendor': return <Briefcase className="w-5 h-5 text-blue-400" />;
      case 'Junk': return <Trash2 className="w-5 h-5 text-gray-600" />;
      default: return <Mail className="w-5 h-5 text-gray-400" />;
    }
  };

  if (loading) {
    return <div className="p-8 text-white">Loading inbox triage...</div>;
  }

  return (
    <div className="p-6 bg-[#050810] min-h-screen text-white">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-mono text-white mb-2">INBOX TRIAGE</h2>
          <p className="text-slate-400 font-mono text-sm">Last 24 Hours • Processed by Jarvis</p>
        </div>
        <button 
          onClick={fetchTriageSummary}
          className="px-4 py-2 bg-slate-800 text-white rounded hover:bg-slate-700 font-mono text-sm transition"
        >
          REFRESH
        </button>
      </div>

      <div className="space-y-4 max-w-4xl">
        {messages.length === 0 ? (
          <div className="text-center p-12 bg-slate-900/50 rounded border border-slate-800">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4 opacity-50" />
            <p className="font-mono text-slate-400">Inbox Zero. No emails in the last 24 hours.</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`p-4 rounded border ${msg.importance_score >= 8 ? 'bg-amber-900/10 border-amber-500/30' : 'bg-slate-900/50 border-slate-800'} flex gap-4 items-start`}
            >
              <div className="mt-1">
                {getCategoryIcon(msg.category)}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-medium text-white">{msg.subject || "(No Subject)"}</h3>
                  <span className="text-xs font-mono px-2 py-1 bg-slate-800 rounded text-slate-300">
                    Score: {msg.importance_score}/10
                  </span>
                </div>
                <p className="text-sm text-slate-300 mb-2">{msg.sender_name} ({msg.sender_email})</p>
                
                <div className="p-3 bg-black/40 rounded border border-slate-800/50 mb-2">
                  <p className="text-sm text-slate-400 italic">Jarvis Summary:</p>
                  <p className="text-sm text-slate-200">{msg.body_summary}</p>
                </div>
                
                <div className="flex gap-2">
                  <span className={`text-xs px-2 py-1 rounded ${msg.category === 'Lead' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-400'}`}>
                    {msg.category}
                  </span>
                  {msg.is_lead && (
                    <span className="text-xs px-2 py-1 rounded bg-green-500/20 text-green-400">
                      CRM Lead Created
                    </span>
                  )}
                  <span className="text-xs text-slate-500 mt-1 ml-auto">
                    Account: {msg.email_account}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
