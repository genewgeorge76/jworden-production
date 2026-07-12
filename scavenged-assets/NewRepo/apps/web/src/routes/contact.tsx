import React from 'react';
import { Phone, Clock, MapPin, Mail } from 'lucide-react';
import { LeadCaptureForm } from '../components/LeadCaptureForm';
import { BUSINESS_PHONE } from '@jworden/core';

export function ContactPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="mb-12">
        <h1 className="text-4xl font-black text-white mb-4">Contact Us</h1>
        <p className="text-zinc-400 max-w-xl">Get a free estimate or ask a question. We respond within 1 business hour.</p>
      </div>

      <div className="grid lg:grid-cols-5 gap-12">
        {/* Form */}
        <div className="lg:col-span-3">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8">
            <h2 className="text-xl font-bold text-white mb-6">Request a Free Estimate</h2>
            <LeadCaptureForm />
          </div>
        </div>

        {/* Contact info */}
        <div className="lg:col-span-2 space-y-6">
          {[
            { icon: Phone, label: 'Phone', value: BUSINESS_PHONE, href: `tel:+1${BUSINESS_PHONE.replace(/\D/g, '')}` },
            { icon: Mail, label: 'Email', value: 'info@jwordenasphaltpaving.com', href: 'mailto:info@jwordenasphaltpaving.com' },
            { icon: MapPin, label: 'Headquarters', value: 'Chester, VA 23836\n150-mile service radius' },
            { icon: Clock, label: 'Hours', value: 'Mon–Fri: 7 AM – 6 PM\nSat: 8 AM – 2 PM' },
          ].map((c) => (
            <div key={c.label} className="flex gap-4">
              <div className="w-10 h-10 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <c.icon size={16} className="text-yellow-400" />
              </div>
              <div>
                <div className="text-zinc-500 text-xs font-semibold uppercase tracking-wide mb-1">{c.label}</div>
                {c.href
                  ? <a href={c.href} className="text-yellow-400 hover:text-yellow-300 font-semibold no-underline">{c.value}</a>
                  : <div className="text-zinc-300 text-sm whitespace-pre-line">{c.value}</div>
                }
              </div>
            </div>
          ))}

          <div className="pt-4 border-t border-zinc-800">
            <div className="text-zinc-500 text-xs uppercase tracking-wide font-semibold mb-3">Service Areas</div>
            <div className="text-zinc-400 text-sm leading-relaxed">
              Richmond metro · Chesterfield · Henrico · Mechanicsville · Midlothian · Chester · Colonial Heights · Petersburg · Hopewell · Fredericksburg · Charlottesville · Hampton Roads
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
