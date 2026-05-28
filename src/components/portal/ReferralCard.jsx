import React, { useEffect, useState } from 'react';
import { Gift, Send, Check, Loader2, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/api/client';
import { toast } from 'sonner';

export default function ReferralCard({ userEmail }) {
  const [form, setForm] = useState({
    referred_name: '',
    referred_phone: '',
    referred_email: '',
    referred_address: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [myReferrals, setMyReferrals] = useState([]);

  useEffect(() => {
    if (!userEmail) return;
    api.entities.Referral.filter({ referrer_email: userEmail }, '-created_date', 20)
      .then((d) => setMyReferrals(Array.isArray(d) ? d : []))
      .catch(() => setMyReferrals([]));
  }, [userEmail, submitted]);

  const earned = myReferrals
    .filter((r) => r.status === 'credit_issued')
    .reduce((s, r) => s + (r.credit_amount || 0), 0);
  const pending = myReferrals.filter((r) => !['credit_issued', 'closed_lost'].includes(r.status)).length;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.referred_name || !form.referred_phone) {
      toast.error('Name and phone are required');
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.functions.invoke('submitReferral', form);
      if (res?.data?.success) {
        setSubmitted(true);
        setForm({ referred_name: '', referred_phone: '', referred_email: '', referred_address: '', notes: '' });
        toast.success('Referral submitted! We will contact them shortly.');
        setTimeout(() => setSubmitted(false), 4000);
      } else {
        toast.error(res?.data?.error || 'Something went wrong');
      }
    } catch (err) {
      toast.error('Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="border border-primary/40 bg-primary/5 p-6">
      <div className="flex items-start justify-between gap-4 mb-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-primary flex items-center justify-center shrink-0">
            <Gift className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <p className="font-display text-primary text-[10px] tracking-[0.3em] uppercase mb-1">
              Referral Program
            </p>
            <h3 className="font-display font-black text-foreground text-xl uppercase tracking-tight leading-tight">
              Earn $100 Per Referral
            </h3>
            <p className="font-body text-muted-foreground text-sm mt-1">
              Refer a friend or neighbor. When their project closes, you get $100 credit toward maintenance, sealcoating, or your next job.
            </p>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-6 pt-5 border-t border-primary/30">
        <Stat label="Earned" value={`$${earned}`} highlight />
        <Stat label="Pending" value={pending} />
        <Stat label="Total Referrals" value={myReferrals.length} />
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            placeholder="Friend's name *"
            value={form.referred_name}
            onChange={(e) => setForm({ ...form, referred_name: e.target.value })}
            className="bg-background h-11"
            required
          />
          <Input
            placeholder="Friend's phone *"
            type="tel"
            value={form.referred_phone}
            onChange={(e) => setForm({ ...form, referred_phone: e.target.value })}
            className="bg-background h-11"
            required
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            placeholder="Friend's email"
            type="email"
            value={form.referred_email}
            onChange={(e) => setForm({ ...form, referred_email: e.target.value })}
            className="bg-background h-11"
          />
          <Input
            placeholder="Project address"
            value={form.referred_address}
            onChange={(e) => setForm({ ...form, referred_address: e.target.value })}
            className="bg-background h-11"
          />
        </div>
        <Textarea
          placeholder="Anything we should know about the project? (optional)"
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          className="bg-background min-h-[70px]"
        />
        <button
          type="submit"
          disabled={submitting || submitted}
          className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-display font-bold text-sm tracking-wider uppercase py-3.5 hover:bg-primary/90 transition-colors disabled:opacity-60"
        >
          {submitting ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
          ) : submitted ? (
            <><Check className="w-4 h-4" /> Submitted!</>
          ) : (
            <><Send className="w-4 h-4" /> Submit Referral</>
          )}
        </button>
      </form>

      {/* Recent referrals */}
      {myReferrals.length > 0 && (
        <div className="mt-6 pt-5 border-t border-primary/30">
          <p className="font-display text-muted-foreground text-[10px] tracking-[0.3em] uppercase mb-3 flex items-center gap-2">
            <Users className="w-3.5 h-3.5" /> Your Referrals
          </p>
          <div className="space-y-2">
            {myReferrals.slice(0, 5).map((r) => (
              <div key={r.id} className="flex items-center justify-between text-sm py-2 border-b border-border last:border-b-0">
                <p className="font-display text-foreground">{r.referred_name}</p>
                <span className={`font-display text-[10px] tracking-wider uppercase px-2 py-0.5 ${
                  r.status === 'credit_issued' ? 'bg-primary text-primary-foreground' :
                  r.status === 'closed_lost' ? 'bg-muted text-muted-foreground' :
                  'border border-primary/40 text-primary'
                }`}>
                  {r.status.replace(/_/g, ' ')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, highlight }) {
  return (
    <div className="text-center">
      <p className={`font-display font-black text-2xl leading-none ${highlight ? 'text-primary' : 'text-foreground'}`}>
        {value}
      </p>
      <p className="font-display text-muted-foreground text-[9px] tracking-[0.2em] uppercase mt-1.5">
        {label}
      </p>
    </div>
  );
}
