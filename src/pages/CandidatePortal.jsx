import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

export default function CandidatePortal() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    applyingFor: '',
    cdlClass: 'None',
    cdlNumber: '',
    cdlState: '',
    dotMedicalCard: null,
    fmcsaConsent: false,
    mvrConsent: false,
    experienceYears: '',
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileChange = (e) => {
    setFormData(prev => ({
      ...prev,
      dotMedicalCard: e.target.files[0]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Tenstreet integration payload stub
    const tenstreetPayload = {
      SubjectInfo: {
        PersonName: {
          GivenName: formData.firstName,
          FamilyName: formData.lastName
        },
        ContactData: {
          InternetEmailAddress: formData.email,
          PrimaryPhone: formData.phone
        },
        DriverData: {
          Licenses: {
            License: {
              LicenseNumber: formData.cdlNumber,
              State: formData.cdlState,
              Class: formData.cdlClass
            }
          },
          ExperienceYears: formData.experienceYears
        }
      },
      Consents: {
        FMCSAClearinghouse: formData.fmcsaConsent,
        MVR: formData.mvrConsent
      }
    };

    console.log("Transmitting to Tenstreet Intake API...", tenstreetPayload);
    
    // Simulate API Call delay to Tenstreet Provider
    await new Promise(resolve => setTimeout(resolve, 1500));

    toast("Tenstreet Application Dispatched", {
      description: "Your file has been routed seamlessly to Tenstreet for MVR & FMCSA compliance reviews.",
    });
    setStep(4);
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-xl overflow-hidden border border-slate-200"
        >
          <div className="bg-slate-900 px-8 py-6 text-white">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-black uppercase tracking-tight">CDL & Candidate Application</h1>
              <div className="text-right">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Powered By</span>
                <span className="text-lg font-black text-green-400 tracking-tight">TENSTREET</span>
              </div>
            </div>
            <p className="text-slate-300 mt-2">The Worden Standard requires strict adherence to Federal & State DOT regulations.</p>
            <div className="flex items-center gap-2 mt-4 text-sm font-medium text-blue-400">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              Secure FMCSA Portal • US DOT #2568168
            </div>
          </div>

          <div className="p-8">
            <div className="flex mb-8 border-b pb-4">
              <div className={`flex-1 text-center font-bold ${step >= 1 ? 'text-blue-600' : 'text-slate-400'}`}>1. Basic Info</div>
              <div className={`flex-1 text-center font-bold ${step >= 2 ? 'text-blue-600' : 'text-slate-400'}`}>2. DOT Compliance</div>
              <div className={`flex-1 text-center font-bold ${step >= 3 ? 'text-blue-600' : 'text-slate-400'}`}>3. Legal Consents</div>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); if (step === 3) handleSubmit(e); else setStep(step + 1); }}>
              
              {/* STEP 1: Basic Info */}
              {step === 1 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">First Name</label>
                      <Input name="firstName" value={formData.firstName} onChange={handleChange} required />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Last Name</label>
                      <Input name="lastName" value={formData.lastName} onChange={handleChange} required />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Phone</label>
                      <Input name="phone" type="tel" value={formData.phone} onChange={handleChange} required />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Email</label>
                      <Input name="email" type="email" value={formData.email} onChange={handleChange} required />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Position Applying For</label>
                    <select name="applyingFor" value={formData.applyingFor} onChange={handleChange} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background" required>
                      <option value="">Select Position...</option>
                      <option value="CDL Driver (Class A)">CDL Equipment Transport (Class A)</option>
                      <option value="CDL Driver (Class B)">CDL Dump Truck (Class B)</option>
                      <option value="Heavy Equipment Operator">Heavy Equipment Operator</option>
                      <option value="Paving Crew/Laborer">Paving Crew / Laborer</option>
                    </select>
                  </div>
                </motion.div>
              )}

              {/* STEP 2: DOT / CDL */}
              {step === 2 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6 text-sm text-blue-800">
                    <strong>Federal Motor Carrier Safety Administration (FMCSA) Mandate:</strong> All commercial driving applicants operating under US DOT #2568168 must provide valid licensing details for automated clearinghouse verification.
                  </div>
                  
                  <div className="grid grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">CDL Class</label>
                      <select name="cdlClass" value={formData.cdlClass} onChange={handleChange} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background">
                        <option value="Class A">Class A</option>
                        <option value="Class B">Class B</option>
                        <option value="Class C">Class C</option>
                        <option value="None">None / N/A</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">CDL Number</label>
                      <Input name="cdlNumber" value={formData.cdlNumber} onChange={handleChange} disabled={formData.cdlClass === 'None'} />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">State of Issue</label>
                      <Input name="cdlState" value={formData.cdlState} onChange={handleChange} disabled={formData.cdlClass === 'None'} maxLength="2" placeholder="VA" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Upload Valid DOT Medical Card (PDF/JPG)</label>
                    <Input type="file" onChange={handleFileChange} accept=".pdf,.jpg,.jpeg,.png" />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Years of Commercial Driving Experience</label>
                    <Input name="experienceYears" type="number" value={formData.experienceYears} onChange={handleChange} />
                  </div>
                </motion.div>
              )}

              {/* STEP 3: Consents */}
              {step === 3 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  <div className="flex items-start space-x-3 p-4 bg-slate-50 border rounded-lg">
                    <Checkbox id="fmcsaConsent" name="fmcsaConsent" checked={formData.fmcsaConsent} onCheckedChange={(checked) => setFormData(prev => ({...prev, fmcsaConsent: checked}))} />
                    <div className="grid gap-1.5 leading-none">
                      <label htmlFor="fmcsaConsent" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        FMCSA Clearinghouse Query Consent
                      </label>
                      <p className="text-xs text-muted-foreground">
                        I hereby authorize J. Worden & Sons (US DOT #2568168) to conduct a full query of the FMCSA Commercial Driver's License Drug and Alcohol Clearinghouse to determine whether drug or alcohol violation information about me exists in the Clearinghouse.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-4 bg-slate-50 border rounded-lg">
                    <Checkbox id="mvrConsent" name="mvrConsent" checked={formData.mvrConsent} onCheckedChange={(checked) => setFormData(prev => ({...prev, mvrConsent: checked}))} />
                    <div className="grid gap-1.5 leading-none">
                      <label htmlFor="mvrConsent" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        State DMV / Motor Vehicle Record Consent
                      </label>
                      <p className="text-xs text-muted-foreground">
                        I authorize the procurement of my Motor Vehicle Record (MVR) by the company for the purpose of evaluating my insurability and employment suitability.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 4 && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-12">
                  <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                  </div>
                  <h2 className="text-2xl font-bold text-slate-800">Application Transmitted</h2>
                  <p className="text-slate-600 mt-2">Your data is securely lodged with our HR & Compliance department under US DOT #2568168 policies.</p>
                </motion.div>
              )}

              {step < 4 && (
                <div className="mt-8 flex justify-between pt-6 border-t">
                  {step > 1 ? (
                    <Button type="button" variant="outline" onClick={() => setStep(step - 1)}>Back</Button>
                  ) : <div></div>}
                  
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8">
                    {step === 3 ? 'Submit Application' : 'Next Step'}
                  </Button>
                </div>
              )}
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
