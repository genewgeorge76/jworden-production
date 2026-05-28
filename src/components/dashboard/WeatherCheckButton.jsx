import React, { useState } from 'react';
import { api } from '@/api/client';
import { CloudRain, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function WeatherCheckButton() {
  const [checking, setChecking] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  const runCheck = async () => {
    setChecking(true);
    try {
      const res = await api.functions.invoke('checkWeatherForJobs', {});
      const data = res?.data || {};
      setLastResult(data);
      if (data.at_risk > 0) {
        toast.warning(`${data.at_risk} job${data.at_risk > 1 ? 's' : ''} flagged for weather risk`);
      } else if (data.checked > 0) {
        toast.success(`${data.checked} job${data.checked > 1 ? 's' : ''} checked — all clear`);
      } else {
        toast.info(data.message || 'No upcoming jobs to check');
      }
    } catch (err) {
      toast.error('Weather check failed');
      console.error(err);
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="border border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-2">
        <CloudRain className="w-4 h-4 text-primary" />
        <p className="font-display font-bold text-foreground text-xs tracking-wider uppercase">
          Weather Monitor
        </p>
      </div>
      <p className="text-muted-foreground text-xs mb-3 leading-relaxed">
        Auto-checks every morning at 6am. Flags jobs with &gt;60% rain probability and alerts Slack.
      </p>
      <button
        onClick={runCheck}
        disabled={checking}
        className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-display font-bold text-xs tracking-wider uppercase py-2.5 hover:bg-primary/90 transition-colors disabled:opacity-50"
      >
        {checking ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Checking...
          </>
        ) : (
          <>
            <CloudRain className="w-3.5 h-3.5" /> Run Weather Check Now
          </>
        )}
      </button>
      {lastResult && !checking && (
        <div className="mt-3 pt-3 border-t border-border flex items-center gap-2 text-xs">
          <CheckCircle2 className="w-3.5 h-3.5 text-primary flex-shrink-0" />
          <span className="text-muted-foreground">
            {lastResult.checked || 0} checked · {lastResult.at_risk || 0} at risk
          </span>
        </div>
      )}
    </div>
  );
}
