import React, { useState } from 'react';
import { CreditCard, Loader2, AlertTriangle } from 'lucide-react';

interface CheckoutButtonProps {
  leadId: string;
  estimatedValue: number;
  depositPct?: number;
  label?: string;
  masterKey?: string;
}

export function CheckoutButton({
  leadId,
  estimatedValue,
  depositPct = 0.2,
  label = 'Pay Deposit',
  masterKey,
}: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const depositAmount = (estimatedValue * depositPct).toFixed(2);

  const startCheckout = async () => {
    setLoading(true);
    setError(null);

    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || '';
      const successUrl = `${window.location.origin}/estimator?payment=success`;
      const cancelUrl = `${window.location.origin}/estimator?payment=cancelled`;

      const res = await fetch(`${apiBase}/api/v1/payments/checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(masterKey ? { 'X-Master-Key': masterKey } : {}),
        },
        body: JSON.stringify({
          lead_id: leadId,
          success_url: successUrl,
          cancel_url: cancelUrl,
          deposit_pct: depositPct,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { detail?: string }).detail || `Error ${res.status}`);
      }

      const data = await res.json() as { checkout_url: string };
      window.location.href = data.checkout_url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment setup failed');
      setLoading(false);
    }
  };

  return (
    <div>
      {error && (
        <div className="flex items-center gap-2 text-red-400 text-xs mb-3 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          <AlertTriangle size={12} />
          {error}
        </div>
      )}
      <button
        onClick={startCheckout}
        disabled={loading}
        className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-60 text-black font-bold px-5 py-2.5 rounded-lg text-sm transition-colors"
      >
        {loading ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <CreditCard size={14} />
        )}
        {label} — ${depositAmount} ({Math.round(depositPct * 100)}% deposit)
      </button>
      <p className="text-zinc-600 text-xs mt-1.5">
        Secure checkout via Stripe · Balance due at completion
      </p>
    </div>
  );
}
