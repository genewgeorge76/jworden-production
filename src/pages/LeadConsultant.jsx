import React, { useState, useEffect, useRef } from 'react';
import { api } from '@/api/client';
import { MessageBubble } from '@/components/consultant/MessageBubble';
import { LeadSelector } from '@/components/consultant/LeadSelector';
import EmailTimeline from '@/components/consultant/EmailTimeline';
import GenerateProposalButton from '@/components/consultant/GenerateProposalButton';
import { Send, Loader2, Bot } from 'lucide-react';

export default function LeadConsultant() {
  const [leads, setLeads] = useState([]);
  const [selectedLead, setSelectedLead] = useState(null);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingConv, setLoadingConv] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    api.entities.Lead.list()
      .then((data) => setLeads(Array.isArray(data) ? data : []))
      .catch(() => setLeads([]));
  }, []);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const openConversation = async (lead) => {
    setSelectedLead(lead);
    setLoadingConv(true);
    setMessages([]);
    setConversation(null);

    // Build a context-rich opening message for the agent
    const intro = [
      `Lead: ${lead.name}`,
      lead.phone ? `Phone: ${lead.phone}` : null,
      lead.email ? `Email: ${lead.email}` : null,
      lead.address ? `Project Address: ${lead.address}` : null,
      lead.surface_type ? `Surface Type: ${lead.surface_type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}` : null,
      lead.sqft ? `Estimated Area: ${Math.round(lead.sqft).toLocaleString()} sq ft` : null,
      lead.material ? `Material Interest: ${lead.material.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}` : null,
      lead.urgency ? `Timeline: ${lead.urgency.charAt(0).toUpperCase() + lead.urgency.slice(1)}` : null,
      lead.notes ? `Notes: ${lead.notes}` : null,
      `Current Status: ${lead.status}`,
    ].filter(Boolean).join('\n');

    const conv = await api.agents.createConversation({
      agent_name: 'paving_consultant',
      metadata: { name: `${lead.name} — ${lead.surface_type || 'Project'}` },
    });

    setConversation(conv);

    // Subscribe to live updates
    api.agents.subscribeToConversation(conv.id, (data) => {
      setMessages([...data.messages]);
    });

    // Seed the conversation with lead context
    await api.agents.addMessage(conv, {
      role: 'user',
      content: `Please greet this lead and open with a proactive, personalized message based on their project details:\n\n${intro}`,
    });

    setLoadingConv(false);
  };

  const sendMessage = async () => {
    if (!input.trim() || !conversation || sending) return;
    const text = input.trim();
    setInput('');
    setSending(true);
    await api.agents.addMessage(conversation, { role: 'user', content: text });
    setSending(false);
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const visibleMessages = messages.filter(
    (m) => !(m.role === 'user' && m.content?.startsWith('Please greet this lead'))
  );

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row font-body">
      {/* Sidebar */}
      <aside className="w-full md:w-80 border-b md:border-b-0 md:border-r border-border flex-shrink-0">
        <div className="p-5 border-b border-border flex items-center gap-3">
          <div className="w-9 h-9 bg-primary flex items-center justify-center">
            <Bot className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <p className="font-display font-bold text-foreground text-sm tracking-wider uppercase">
              Paving Consultant
            </p>
            <p className="text-muted-foreground text-xs">AI Lead Engagement</p>
          </div>
        </div>
        <LeadSelector leads={leads} selectedLead={selectedLead} onSelect={openConversation} />
      </aside>

      {/* Chat area */}
      <main className="flex-1 flex flex-col">
        {!selectedLead ? (
          <div className="flex-1 flex items-center justify-center text-center px-6">
            <div>
              <Bot className="w-12 h-12 text-border mx-auto mb-4" />
              <p className="font-display font-bold text-muted-foreground text-sm tracking-wider uppercase">
                Select a Lead to Begin
              </p>
              <p className="font-body text-muted-foreground text-sm mt-2 max-w-xs">
                Choose a lead from the sidebar to start an AI-powered consultation.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <div>
                <p className="font-display font-bold text-foreground text-sm tracking-wider uppercase">
                  {selectedLead.name}
                </p>
                <p className="text-muted-foreground text-xs mt-0.5">
                  {selectedLead.surface_type
                    ? selectedLead.surface_type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
                    : 'Project'}{' '}
                  {selectedLead.sqft ? `· ${Math.round(selectedLead.sqft).toLocaleString()} sq ft` : ''}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <GenerateProposalButton lead={selectedLead} onGenerated={() => setSelectedLead({ ...selectedLead, status: 'quoted' })} />
                <span className={`px-3 py-1 border font-display text-xs tracking-wider uppercase ${
                  selectedLead.status === 'won'
                    ? 'border-primary/40 bg-primary/10 text-primary'
                    : selectedLead.status === 'lost'
                    ? 'border-destructive/40 bg-destructive/10 text-destructive'
                    : 'border-border text-muted-foreground'
                }`}>
                  {selectedLead.status}
                </span>
              </div>
            </div>

            {/* Email timeline */}
            <EmailTimeline lead={selectedLead} />

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
              {loadingConv ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                </div>
              ) : (
                visibleMessages.map((msg, i) => (
                  <MessageBubble key={i} message={msg} />
                ))
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="border-t border-border px-6 py-4 flex gap-3 items-end">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Type a message on behalf of the team..."
                rows={1}
                className="flex-1 bg-muted border border-border text-foreground placeholder:text-muted-foreground text-sm px-4 py-3 resize-none focus:border-primary focus:outline-none transition-colors font-body"
                style={{ maxHeight: 120, overflowY: 'auto' }}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || sending}
                className={`flex items-center justify-center w-11 h-11 flex-shrink-0 transition-colors ${
                  input.trim() && !sending
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'bg-muted text-muted-foreground cursor-not-allowed'
                }`}
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
