import React from 'react';

export default function PrintableOnboardingPacket() {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto p-8 bg-white min-h-screen text-black">
      {/* Hide this controls bar when printing */}
      <div className="print:hidden flex justify-between items-center mb-8 p-4 bg-slate-100 border border-slate-300 rounded-lg">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Printable Onboarding Packet</h2>
          <p className="text-sm text-slate-600">Please load paper into your HP Smart Tank 7602 printer before proceeding.</p>
        </div>
        <button
          onClick={handlePrint}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded shadow transition-colors"
        >
          🖨️ Print Packet Now
        </button>
      </div>

      {/* --- START OF PRINTABLE PAGES --- */}
      <div className="print:block">
        
        {/* PAGE 1: Handbook Acknowledgment */}
        <div className="print:page-break-after-always mb-16">
          <div className="text-center mb-10 border-b-2 border-black pb-4">
            <h1 className="text-3xl font-black uppercase tracking-widest">The Worden Standard</h1>
            <h2 className="text-xl font-semibold mt-2">Employee Handbook & Safety Acknowledgment</h2>
          </div>
          
          <div className="space-y-6 text-justify leading-relaxed">
            <p>
              I acknowledge that I have received, read, and understand the terms outlined in "The Worden Standard Employee Handbook." 
              I understand that J. Worden Asphalt Paving operates under strict adherence to safety, quality, and regulatory compliance.
            </p>
            <p>
              I certify that I have watched the required safety modules (including OSHA 10/30, Silica Dust, and Heavy equipment operations) 
              in their entirety without skipping or fast-forwarding, and I understand my obligations regarding PPE, zero-tolerance drug policies, 
              and Miss Utility 811 protocols.
            </p>
            <p>
              I understand that failure to adhere to the Federal Motor Carrier Safety Administration (FMCSA) and internal safety policies 
              may result in immediate disciplinary action up to and including termination.
            </p>
          </div>

          <div className="mt-20 flex justify-between items-end">
            <div className="w-1/2 pr-4">
              <div className="border-b border-black mb-2 h-8"></div>
              <p className="text-sm font-bold uppercase">Employee Print Name</p>
            </div>
            <div className="w-1/4 px-2">
              <div className="border-b border-black mb-2 h-8"></div>
              <p className="text-sm font-bold uppercase">Date</p>
            </div>
          </div>

          <div className="mt-12 flex justify-between items-end">
            <div className="w-3/4 pr-4">
              <div className="border-b border-black mb-2 h-8"></div>
              <p className="text-sm font-bold uppercase">Employee Signature (Wet Ink Required)</p>
            </div>
          </div>
        </div>

        {/* PAGE 2: FMCSA & DMV Consent Placeholder */}
        <div className="print:page-break-after-always mb-16">
          <div className="text-center mb-10 border-b-2 border-black pb-4">
            <h1 className="text-2xl font-black uppercase">FMCSA Clearinghouse & MVR Consent</h1>
            <h2 className="text-lg font-semibold mt-2">Motor Vehicle Record & Background Pull Authorization</h2>
          </div>
          
          <div className="space-y-6 text-justify leading-relaxed">
            <p>
              I hereby authorize J. Worden Asphalt Paving to procure my Motor Vehicle Record (MVR) and conduct full background 
              verifications through the FMCSA Drug and Alcohol Clearinghouse prior to employment and annually thereafter.
            </p>
            {/* Standard legal boilerplate would continue here */}
            <div className="h-48 bg-gray-50 border border-dashed border-gray-300 flex items-center justify-center text-gray-500">
              [ Official FMCSA Federal Legal Boilerplate Injected Here ]
            </div>
          </div>

          <div className="mt-20 flex justify-between items-end">
            <div className="w-3/4 pr-4">
              <div className="border-b border-black mb-2 h-8"></div>
              <p className="text-sm font-bold uppercase">Candidate Signature (Wet Ink Required)</p>
            </div>
            <div className="w-1/4 px-2">
              <div className="border-b border-black mb-2 h-8"></div>
              <p className="text-sm font-bold uppercase">Date</p>
            </div>
          </div>
        </div>

        {/* PAGE 3: Emergency Contact & Medical Alert Form */}
        <div className="print:page-break-after-always mb-16">
          <div className="text-center mb-10 border-b-2 border-black pb-4">
            <h1 className="text-2xl font-black uppercase">Emergency Contact & Medical Alert Form</h1>
            <h2 className="text-lg font-semibold mt-2">Confidential HR Record</h2>
          </div>
          <div className="space-y-6">
            <div>
              <h3 className="font-bold text-lg border-b border-gray-400 mb-4">Primary Emergency Contact</h3>
              <div className="flex gap-4 mb-4">
                <div className="w-1/2"><div className="border-b border-black mb-2 h-6"></div><p className="text-xs font-bold uppercase">Name</p></div>
                <div className="w-1/4"><div className="border-b border-black mb-2 h-6"></div><p className="text-xs font-bold uppercase">Relationship</p></div>
                <div className="w-1/4"><div className="border-b border-black mb-2 h-6"></div><p className="text-xs font-bold uppercase">Phone Number</p></div>
              </div>
            </div>
            <div>
              <h3 className="font-bold text-lg border-b border-gray-400 mb-4">Secondary Emergency Contact</h3>
              <div className="flex gap-4 mb-4">
                <div className="w-1/2"><div className="border-b border-black mb-2 h-6"></div><p className="text-xs font-bold uppercase">Name</p></div>
                <div className="w-1/4"><div className="border-b border-black mb-2 h-6"></div><p className="text-xs font-bold uppercase">Relationship</p></div>
                <div className="w-1/4"><div className="border-b border-black mb-2 h-6"></div><p className="text-xs font-bold uppercase">Phone Number</p></div>
              </div>
            </div>
            <div>
              <h3 className="font-bold text-lg border-b border-gray-400 mb-4">Critical Medical Alerts (Allergies, Asthma, Diabetes, etc.)</h3>
              <div className="border border-black h-32 w-full p-2 text-gray-400 italic">Please list any life-threatening allergies (e.g., bee stings requiring an EpiPen) or medical conditions the Foreman should be aware of in an emergency. If none, write "NONE".</div>
            </div>
          </div>
        </div>

        {/* PAGE 4: Direct Deposit Authorization */}
        <div className="print:page-break-after-always mb-16">
          <div className="text-center mb-10 border-b-2 border-black pb-4">
            <h1 className="text-2xl font-black uppercase">Direct Deposit Authorization</h1>
            <h2 className="text-lg font-semibold mt-2">Payroll Processing Form</h2>
          </div>
          <div className="space-y-6 text-justify leading-relaxed">
            <p>I authorize J. Worden Asphalt Paving to initiate credit entries (and, if necessary, debit entries and adjustments for any credit entries made in error) to my account indicated below.</p>
            
            <div className="flex gap-4 mb-4 mt-8">
              <div className="w-1/2"><div className="border-b border-black mb-2 h-6"></div><p className="text-xs font-bold uppercase">Bank / Institution Name</p></div>
              <div className="w-1/4 flex items-end gap-2"><input type="checkbox" className="w-5 h-5 border-black border-2 flex-shrink-0" /> <span className="font-bold">Checking</span></div>
              <div className="w-1/4 flex items-end gap-2"><input type="checkbox" className="w-5 h-5 border-black border-2 flex-shrink-0" /> <span className="font-bold">Savings</span></div>
            </div>
            <div className="flex gap-4 mb-4">
              <div className="w-1/2"><div className="border-b border-black mb-2 h-6"></div><p className="text-xs font-bold uppercase">Routing Number (9 digits)</p></div>
              <div className="w-1/2"><div className="border-b border-black mb-2 h-6"></div><p className="text-xs font-bold uppercase">Account Number</p></div>
            </div>

            <div className="mt-8 p-4 border-2 border-dashed border-gray-400 flex items-center justify-center h-32 bg-gray-50">
              <p className="text-gray-500 font-bold tracking-widest uppercase">Attach Voided Check Here</p>
            </div>
            
            <div className="mt-12 flex justify-between items-end">
              <div className="w-3/4 pr-4">
                <div className="border-b border-black mb-2 h-8"></div>
                <p className="text-sm font-bold uppercase">Employee Signature (Wet Ink Required)</p>
              </div>
              <div className="w-1/4 px-2">
                <div className="border-b border-black mb-2 h-8"></div>
                <p className="text-sm font-bold uppercase">Date</p>
              </div>
            </div>
          </div>
        </div>

        {/* PAGE 5: Zero-Tolerance Drug & Alcohol Policy Consent */}
        <div className="print:page-break-after-always mb-16">
          <div className="text-center mb-10 border-b-2 border-black pb-4">
            <h1 className="text-2xl font-black uppercase">Zero-Tolerance Drug & Alcohol Policy</h1>
            <h2 className="text-lg font-semibold mt-2">Pre-Employment & Random Screening Consent</h2>
          </div>
          
          <div className="space-y-6 text-justify leading-relaxed">
            <p>
              J. Worden Asphalt Paving maintains a strict zero-tolerance policy regarding the use of illegal drugs and alcohol on company time or premises. Heavy civil construction is inherently dangerous, and impairment puts the entire crew at risk.
            </p>
            <p>
              By signing below, I consent to submit to pre-employment, random, and post-accident drug and/or alcohol screening as a condition of my employment. I understand that a positive test result or refusal to submit to testing will result in immediate termination of employment.
            </p>
          </div>

          <div className="mt-32 flex justify-between items-end">
            <div className="w-3/4 pr-4">
              <div className="border-b border-black mb-2 h-8"></div>
              <p className="text-sm font-bold uppercase">Employee Signature (Wet Ink Required)</p>
            </div>
            <div className="w-1/4 px-2">
              <div className="border-b border-black mb-2 h-8"></div>
              <p className="text-sm font-bold uppercase">Date</p>
            </div>
          </div>
        </div>

        {/* PAGE 6: Federal / State Tax routing placeholder */}
        <div className="mb-16">
          <div className="text-center mb-10 border-b border-black pb-4">
            <h1 className="text-xl font-bold uppercase">Federal I-9 / W-4 / VA-4 Checksheet</h1>
          </div>
          <p className="mb-4">
            <strong>HR Administrator Action Required:</strong> Attach official Federal I-9, IRS W-4, and Virginia VA-4 printouts behind this sheet.
          </p>
          <ul className="list-square pl-8 space-y-4 font-medium text-lg">
            <li>☐ Form I-9 (Employment Eligibility Verification)</li>
            <li>☐ Form W-4 (Employee's Withholding Certificate)</li>
            <li>☐ Form VA-4 (Virginia Personal Exemption)</li>
            <li>☐ Photocopy of Valid Driver's License / CDL</li>
            <li>☐ Photocopy of Social Security Card or Passport</li>
          </ul>
        </div>

      </div>
    </div>
  );
}
