import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ChevronRight, ChevronLeft, Check, MapPin, Ruler, Clock, User } from 'lucide-react';
import { toast } from 'sonner';
import PavingCalculator from './PavingCalculator';
import { api } from '@/api/client';
import { trackLeadSubmission, trackEvent, trackOfflineConversionReady } from '@/lib/analytics';
import { getLeadAttributionFields, inferAttributionConversionSource, persistAttribution } from '@/lib/adsAttribution';

const SURFACE_TYPES = [
  { id: 'driveway', label: 'Driveway', sub: 'Residential · Fine-grain mix', icon: '🏠' },
  { id: 'parking_lot', label: 'Parking Lot', sub: 'Commercial · High-traffic', icon: '🅿️' },
  { id: 'road', label: 'Road / Path', sub: 'Access roads · Walkways', icon: '🛣️' },
  { id: 'commercial', label: 'Commercial Lot', sub: 'Retail · Office · Multi-use', icon: '🏢' },
  { id: 'industrial', label: 'Industrial', sub: 'Heavy-load · Logistics', icon: '🏭' },
  { id: 'other', label: 'Other', sub: 'Custom scope · We\'ll assess', icon: '📋' },
];

const URGENCY_OPTIONS = [
  { id: 'flexible', label: 'Flexible Timeline', description: 'No rush — plan around best pricing' },
  { id: 'standard', label: 'Standard (2–4 weeks)', description: 'Normal project scheduling' },
  { id: 'urgent', label: 'Urgent (ASAP)', description: 'Priority scheduling required' },
];

const STEPS = ['Surface Type', 'Dimensions', 'Material Est.', 'Timeline', 'Your Info'];
const TOTAL_STEPS = STEPS.length - 1; // 0-indexed max

export default function QuoteEngine() {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({
    surfaceType: '',
    // dimensions (calculator step)
    width: '',
    length: '',
    sqft: 0,
    materialId: '',
    // urgency
    urgency: '',
    // contact
    name: '',
    email: '',
    phone: '',
    address: '',
    notes: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sanitizePhone = (value) => value.replace(/[^0-9+()\-\s]/g, '').slice(0, 22);
  const isPhoneValid = (value) => value.replace(/\D/g, '').length >= 10;

  const nextStep = () => setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  const prevStep = () => setStep((s) => Math.max(s - 1, 0));

  const canProceed = () => {
    if (step === 0) return !!formData.surfaceType;
    if (step === 1) return formData.sqft > 0 || (parseFloat(formData.width) > 0 && parseFloat(formData.length) > 0);
    if (step === 2) return !!formData.materialId;
    if (step === 3) return !!formData.urgency;
    if (step === 4) return formData.name.trim().length > 1 && isPhoneValid(formData.phone);
    return false;
  };

  const handleSubmit = async () => {
    if (isSubmitting || !canProceed()) return;

    setIsSubmitting(true);
    persistAttribution();
    const attribution = getLeadAttributionFields();
    const leadData = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      address: formData.address.trim(),
      surface_type: formData.surfaceType,
      sqft: formData.sqft,
      material: formData.materialId,
      urgency: formData.urgency,
      notes: formData.notes.trim(),
      status: 'new',
      conversion_source: inferAttributionConversionSource(attribution, typeof document !== 'undefined' ? document.referrer : ''),
      ...attribution,
    };
    try {
      const createdLead = await api.entities.Lead.create(leadData);

      // Fire GA4 + Google Ads conversion
      trackLeadSubmission({ ...leadData, id: createdLead?.id });
      trackOfflineConversionReady({ ...leadData, id: createdLead?.id });

      // TRIGGER AUTOMATION TRACKS
      if (createdLead?.id) {
        // 1. Score lead and enrich with local property data
        api.functions.invoke('scoreNewLead', { leadId: createdLead.id }).catch(() => {});
        // 2. Immediate PDF Proposal Generation
        api.functions.invoke('generateInstantQuotePdf', { leadId: createdLead.id }).catch(() => {});
        // 3. Dispatch Sales Alert (Slack + Email)
        api.functions.invoke('notifyNewLeadSlack', { leadId: createdLead.id }).catch(() => {});
        api.functions.invoke('notifyNewLeadEmail', { leadId: createdLead.id }).catch(() => {});
        // 4. Send Welcome SMS (Conversion Hardening)
        api.functions.invoke('sendLeadWelcomeEmail', { leadId: createdLead.id }).catch(() => {});
        api.functions.invoke('sendSmsFollowup', { leadId: createdLead.id, type: 'welcome' }).catch(() => {});
      }

      setSubmitted(true);
      toast.success("Estimate request submitted! We'll be in touch within 24 hours.");
    } catch (error) {
      trackEvent('quote_submit_error', { message: error?.message || 'unknown_error' });
      toast.error('Submission failed. Please call (804) 446-1296 and we will take your details now.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Track funnel progression for analytics
  const handleNextStep = () => {
    trackEvent('quote_step_completed', { step, step_name: STEPS[step] });
    nextStep();
  };

  return (
    <section id="quote" className="border-t border-border py-16 md:py-24">
      <div className="max-w-4xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="font-display text-primary text-sm tracking-[0.3em] uppercase mb-3">Free · No Obligation</p>
          <h2 className="font-display font-black text-foreground text-4xl md:text-6xl uppercase tracking-tight">
            Your Estimate in 60 Seconds
          </h2>
          <p className="font-body text-muted-foreground text-lg mt-4 max-w-md mx-auto leading-relaxed">
            Answer 5 quick questions. See a live ballpark price as you go. A real person calls you back within 24 hours — not a call center.
          </p>
        </div>

        {/* Progress bar */}
        {!submitted && (
          <div className="flex items-start gap-1 mb-12">
            {STEPS.map((label, i) => (
              <div key={label} className="flex-1">
                <div className={`h-1 transition-colors duration-500 ${i <= step ? 'bg-primary' : 'bg-border'}`} />
                <p className={`font-display text-xs tracking-wider uppercase mt-2 transition-colors duration-300 hidden sm:block ${
                  i <= step ? 'text-primary' : 'text-muted-foreground'
                }`}>
                  {label}
                </p>
              </div>
            ))}
          </div>
        )}

        <AnimatePresence mode="wait">
          {submitted ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-16 border border-primary/30 bg-muted/30"
            >
              <div className="w-16 h-16 bg-primary flex items-center justify-center mx-auto mb-6">
                <Check className="w-8 h-8 text-primary-foreground" />
              </div>
              <h3 className="font-display font-bold text-foreground text-2xl uppercase tracking-wider">
                You're All Set
              </h3>
              <p className="font-body text-muted-foreground text-lg mt-3 max-w-md mx-auto leading-relaxed">
                We got it. Expect a call from J. Worden & Sons — usually within a few hours, always within 24. If you'd rather talk now, ring us at <a href="tel:+18044461296" className="text-primary font-bold">(804) 446-1296</a>.
              </p>
            </motion.div>
          ) : (
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="min-h-[300px]"
            >
              {/* ── Step 0: Surface Type ── */}
              {step === 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-6">
                    <MapPin className="w-5 h-5 text-primary" />
                    <h3 className="font-display font-bold text-foreground text-lg tracking-wider uppercase">
                      Select Surface Type
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {SURFACE_TYPES.map((type) => (
                      <button
                        key={type.id}
                        onClick={() => setFormData({ ...formData, surfaceType: type.id, materialId: '' })}
                        className={`group relative p-6 border text-left transition-all duration-300 min-h-[48px] overflow-hidden ${
                          formData.surfaceType === type.id
                            ? 'border-primary bg-primary/10 text-foreground'
                            : 'border-border hover:border-primary/40 hover:bg-muted/30'
                        }`}
                      >
                        <span className="text-3xl block mb-3 transition-transform duration-300 group-hover:scale-110 origin-left">{type.icon}</span>
                        <span className="font-display font-black text-foreground text-lg md:text-xl tracking-tight leading-none block">
                          {type.label}
                        </span>
                        <span className="font-display text-muted-foreground text-[10px] md:text-xs tracking-[0.2em] uppercase mt-2 block leading-snug">
                          {type.sub}
                        </span>
                        {formData.surfaceType === type.id && (
                          <span className="absolute top-0 left-0 w-full h-0.5 bg-primary" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Step 1: Dimensions (width × length) ── */}
              {step === 1 && (
                <div>
                  <div className="flex items-center gap-2 mb-6">
                    <Ruler className="w-5 h-5 text-primary" />
                    <h3 className="font-display font-bold text-foreground text-lg tracking-wider uppercase">
                      Project Dimensions
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto text-center">
                    {[
                      { field: 'width', label: 'Width (ft)' },
                      { field: 'length', label: 'Length (ft)' },
                    ].map(({ field, label }) => (
                      <div key={field}>
                        <label className="font-display text-muted-foreground text-xs tracking-wider uppercase block mb-2">
                          {label}
                        </label>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={formData[field] ?? ''}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9.]/g, '');
                            const updated = { ...formData, [field]: val };
                            const w = parseFloat(field === 'width' ? val : formData.width) || 0;
                            const l = parseFloat(field === 'length' ? val : formData.length) || 0;
                            updated.sqft = w * l;
                            setFormData(updated);
                          }}
                          placeholder="0"
                          className="w-full h-20 bg-muted border border-border text-foreground text-center font-display font-bold text-4xl placeholder:text-muted-foreground/40 focus:border-primary focus:outline-none transition-colors"
                        />
                      </div>
                    ))}
                  </div>

                  {parseFloat(formData.width) > 0 && parseFloat(formData.length) > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-6 flex items-center justify-center gap-4 border border-primary/30 bg-primary/5 px-6 py-4 max-w-sm mx-auto"
                    >
                      <div className="text-center">
                        <p className="font-body text-muted-foreground text-sm">Total Area</p>
                        <p className="font-display font-black text-primary text-3xl mt-0.5">
                          {Math.round(parseFloat(formData.width) * parseFloat(formData.length)).toLocaleString()} sq ft
                        </p>
                      </div>
                    </motion.div>
                  )}

                  <p className="font-body text-muted-foreground text-sm text-center mt-6">
                    For irregular shapes, enter the approximate bounding area. We'll refine on-site.
                  </p>
                </div>
              )}

              {/* ── Step 2: Paving Calculator ── */}
              {step === 2 && (
                <PavingCalculator formData={formData} setFormData={setFormData} />
              )}

              {/* ── Step 3: Urgency ── */}
              {step === 3 && (
                <div>
                  <div className="flex items-center gap-2 mb-6">
                    <Clock className="w-5 h-5 text-primary" />
                    <h3 className="font-display font-bold text-foreground text-lg tracking-wider uppercase">
                      Project Timeline
                    </h3>
                  </div>
                  <div className="space-y-3">
                    {URGENCY_OPTIONS.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => setFormData({ ...formData, urgency: option.id })}
                        className={`w-full p-5 border text-left transition-all duration-300 flex items-center justify-between min-h-[48px] ${
                          formData.urgency === option.id
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/40'
                        }`}
                      >
                        <div>
                          <p className="font-display font-bold text-foreground text-sm tracking-wider uppercase">
                            {option.label}
                          </p>
                          <p className="font-body text-muted-foreground text-sm mt-1">{option.description}</p>
                        </div>
                        {formData.urgency === option.id && (
                          <div className="w-6 h-6 bg-primary flex items-center justify-center flex-shrink-0 ml-4">
                            <Check className="w-4 h-4 text-primary-foreground" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Step 4: Contact Info ── */}
              {step === 4 && (
                <div>
                  <div className="flex items-center gap-2 mb-6">
                    <User className="w-5 h-5 text-primary" />
                    <h3 className="font-display font-bold text-foreground text-lg tracking-wider uppercase">
                      Your Information
                    </h3>
                  </div>

                  {/* Summary banner */}
                  {formData.sqft > 0 && (
                    <div className="border border-primary/30 bg-primary/5 px-5 py-4 mb-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {[
                        { label: 'Surface', value: SURFACE_TYPES.find(s => s.id === formData.surfaceType)?.label ?? '—' },
                        { label: 'Area', value: `${Math.round(formData.sqft).toLocaleString()} sq ft` },
                        { label: 'Material', value: formData.materialId ? formData.materialId.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : '—' },
                        { label: 'Timeline', value: formData.urgency ? formData.urgency.charAt(0).toUpperCase() + formData.urgency.slice(1) : '—' },
                      ].map(({ label, value }) => (
                        <div key={label}>
                          <p className="font-display text-muted-foreground text-xs tracking-wider uppercase">{label}</p>
                          <p className="font-display font-bold text-foreground text-sm mt-0.5">{value}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="space-y-4">
                    <Input
                      placeholder="Full Name *"
                      autoComplete="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="bg-muted border-border text-foreground placeholder:text-muted-foreground h-12 font-body"
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        placeholder="Email"
                        type="email"
                        autoComplete="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="bg-muted border-border text-foreground placeholder:text-muted-foreground h-12 font-body"
                      />
                      <Input
                        placeholder="Phone *"
                        type="tel"
                        autoComplete="tel"
                        inputMode="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: sanitizePhone(e.target.value) })}
                        className="bg-muted border-border text-foreground placeholder:text-muted-foreground h-12 font-body"
                      />
                    </div>
                    <Input
                      placeholder="Project Address"
                      autoComplete="street-address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="bg-muted border-border text-foreground placeholder:text-muted-foreground h-12 font-body"
                    />
                    <Textarea
                      placeholder="Additional notes about your project..."
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="bg-muted border-border text-foreground placeholder:text-muted-foreground min-h-[100px] font-body"
                    />
                  </div>
                  <p className="font-body text-muted-foreground text-xs mt-3">
                    Phone is required so a project specialist can confirm scope and scheduling.
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation */}
        {!submitted && (
          <div className="flex justify-between mt-10">
            <button
              onClick={prevStep}
              disabled={step === 0}
              className={`flex items-center gap-2 font-display font-bold text-sm tracking-wider uppercase min-h-[48px] px-6 py-3 border border-border transition-colors ${
                step === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:border-foreground text-foreground'
              }`}
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>

            {step < TOTAL_STEPS ? (
              <button
                onClick={handleNextStep}
                disabled={!canProceed()}
                className={`flex items-center gap-2 font-display font-bold text-sm tracking-wider uppercase min-h-[48px] px-8 py-3 transition-colors ${
                  canProceed()
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'bg-muted text-muted-foreground cursor-not-allowed'
                }`}
              >
                Next Step <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!canProceed() || isSubmitting}
                className={`flex items-center gap-2 font-display font-bold text-sm tracking-wider uppercase min-h-[48px] px-8 py-3 transition-colors ${
                  canProceed() && !isSubmitting
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'bg-muted text-muted-foreground cursor-not-allowed'
                }`}
              >
                {isSubmitting ? 'Submitting...' : 'Get My Free Estimate'} <Check className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
