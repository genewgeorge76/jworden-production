import React, { useState, useEffect } from 'react';
import { Loader2, Save, Send, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/api/client';

const SETTINGS_KEY = 'slack_config';
const DEFAULTS = {
  key: SETTINGS_KEY,
  slack_channel: '',
  slack_bot_name: 'J. Worden Lead Bot',
  slack_bot_emoji: ':rotating_light:',
  slack_enabled: true,
};

export default function SlackSettingsForm() {
  const [settings, setSettings] = useState(DEFAULTS);
  const [recordId, setRecordId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    (async () => {
      const list = await api.entities.AppSettings.filter({ key: SETTINGS_KEY });
      if (list?.[0]) {
        setRecordId(list[0].id);
        setSettings({ ...DEFAULTS, ...list[0] });
      }
      setLoading(false);
    })();
  }, []);

  const handleSave = async () => {
    if (!settings.slack_channel.trim()) {
      toast.error('Channel is required.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        key: SETTINGS_KEY,
        slack_channel: settings.slack_channel.trim(),
        slack_bot_name: settings.slack_bot_name.trim() || 'J. Worden Lead Bot',
        slack_bot_emoji: settings.slack_bot_emoji.trim() || ':rotating_light:',
        slack_enabled: settings.slack_enabled,
      };
      if (recordId) {
        await api.entities.AppSettings.update(recordId, payload);
      } else {
        const created = await api.entities.AppSettings.create(payload);
        setRecordId(created.id);
      }
      toast.success('Slack settings saved.');
    } catch (error) {
      toast.error(error.message || 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!recordId) {
      toast.error('Save settings first, then test.');
      return;
    }
    setTesting(true);
    try {
      const response = await api.functions.invoke('notifyNewLeadSlack', {
        data: {
          name: 'TEST — Jane Homeowner',
          phone: '(804) 555-0123',
          email: 'test@example.com',
          address: '123 Main St, Richmond, VA',
          surface_type: 'driveway',
          sqft: 850,
          material: 'type_ii_fine',
          urgency: 'standard',
          notes: 'This is a test message from the admin Slack settings page.',
          created_date: new Date().toISOString(),
        },
      });

      if (response.data?.success) {
        toast.success('Test message sent! Check your Slack channel.');
      } else {
        toast.error(`Slack error: ${response.data?.hint || response.data?.error || 'unknown'}`);
      }
    } catch (error) {
      toast.error(error.message || 'Test failed.');
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Channel */}
      <div>
        <label className="font-display text-muted-foreground text-xs tracking-wider uppercase block mb-2">
          Slack Channel *
        </label>
        <input
          type="text"
          value={settings.slack_channel}
          onChange={(e) => setSettings({ ...settings, slack_channel: e.target.value })}
          placeholder="#leads or C0123ABC456"
          className="w-full h-11 bg-muted border border-border text-foreground placeholder:text-muted-foreground/60 px-3 font-body focus:border-primary focus:outline-none transition-colors"
        />
        <p className="font-body text-muted-foreground text-xs mt-2">
          Use <code>#channel-name</code> for public channels, or the channel ID for private channels (invite the bot first).
        </p>
      </div>

      {/* Bot identity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="font-display text-muted-foreground text-xs tracking-wider uppercase block mb-2">
            Bot Display Name
          </label>
          <input
            type="text"
            value={settings.slack_bot_name}
            onChange={(e) => setSettings({ ...settings, slack_bot_name: e.target.value })}
            placeholder="J. Worden Lead Bot"
            className="w-full h-11 bg-muted border border-border text-foreground placeholder:text-muted-foreground/60 px-3 font-body focus:border-primary focus:outline-none transition-colors"
          />
        </div>
        <div>
          <label className="font-display text-muted-foreground text-xs tracking-wider uppercase block mb-2">
            Bot Emoji
          </label>
          <input
            type="text"
            value={settings.slack_bot_emoji}
            onChange={(e) => setSettings({ ...settings, slack_bot_emoji: e.target.value })}
            placeholder=":rotating_light:"
            className="w-full h-11 bg-muted border border-border text-foreground placeholder:text-muted-foreground/60 px-3 font-body focus:border-primary focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Enable toggle */}
      <label className="flex items-center gap-3 cursor-pointer select-none p-4 border border-border bg-card">
        <input
          type="checkbox"
          checked={settings.slack_enabled}
          onChange={(e) => setSettings({ ...settings, slack_enabled: e.target.checked })}
          className="w-4 h-4 accent-primary"
        />
        <div className="flex-1">
          <span className="font-display font-bold text-foreground text-sm uppercase tracking-wider">
            Slack Alerts Enabled
          </span>
          <p className="font-body text-muted-foreground text-xs mt-0.5">
            Master switch — turn off to pause Slack notifications without losing your config.
          </p>
        </div>
        {settings.slack_enabled && <CheckCircle2 className="w-5 h-5 text-primary" />}
      </label>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground font-display font-bold text-sm tracking-wider uppercase min-h-[48px] py-3 hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Settings
        </button>
        <button
          onClick={handleTest}
          disabled={testing || !recordId}
          className="flex-1 flex items-center justify-center gap-2 border border-border text-foreground font-display font-bold text-sm tracking-wider uppercase min-h-[48px] py-3 hover:border-primary hover:text-primary transition-colors disabled:opacity-50"
        >
          {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Send Test Message
        </button>
      </div>
    </div>
  );
}
