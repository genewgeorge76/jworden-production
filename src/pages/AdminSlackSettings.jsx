import React from 'react';
import { ShieldOff, Slack } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SEO from '../components/SEO';
import SlackSettingsForm from '../components/admin/SlackSettingsForm';

export default function AdminSlackSettings() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background font-body">
        <Navbar />
        <div className="pt-32 pb-20 max-w-2xl mx-auto px-6 text-center">
          <div className="w-16 h-16 bg-destructive/10 border border-destructive/40 flex items-center justify-center mx-auto mb-6">
            <ShieldOff className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="font-display font-black text-foreground text-3xl uppercase tracking-tight mb-3">
            Admin Access Required
          </h1>
          <p className="font-body text-muted-foreground text-base">
            This page is restricted to administrators only.
          </p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-body">
      <SEO
        title="Admin · Slack Settings | J. Worden & Sons"
        description="Configure Slack lead alerts for the J. Worden & Sons paving team."
        canonicalPath="/admin/slack"
      />
      <Navbar />

      <section className="pt-32 pb-10 border-b border-border">
        <div className="max-w-3xl mx-auto px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-3">
            <Slack className="w-5 h-5 text-primary" />
            <p className="font-display text-primary text-xs tracking-[0.3em] uppercase">
              // Admin Tools
            </p>
          </div>
          <h1 className="font-display font-black text-foreground text-4xl md:text-5xl uppercase tracking-tight">
            Slack Alerts
          </h1>
          <p className="font-body text-muted-foreground text-base mt-3">
            Every new lead submission is automatically posted to Slack with full project details so your team can respond within seconds.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-3xl mx-auto px-6 lg:px-8">
          <div className="border border-border bg-card p-6 md:p-8">
            <SlackSettingsForm />
          </div>

          {/* Help card */}
          <div className="mt-6 border border-primary/30 bg-primary/5 p-6">
            <p className="font-display text-primary text-xs tracking-[0.3em] uppercase mb-3">Setup Guide</p>
            <ol className="space-y-2 font-body text-foreground text-sm leading-relaxed list-decimal list-inside">
              <li>Enter your Slack channel (e.g. <code>#leads</code>) above.</li>
              <li>For <strong>public channels</strong>: works immediately — the bot posts without an invite.</li>
              <li>For <strong>private channels</strong>: invite <code>@J. Worden Lead Bot</code> to the channel first, then paste the channel ID (not the name).</li>
              <li>Click <strong>Save</strong>, then <strong>Send Test Message</strong> to verify.</li>
              <li>From now on, every lead submitted through the website automatically posts to Slack.</li>
            </ol>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
