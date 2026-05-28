/**
 * TaxComplianceAdvisory — Federal + Virginia State + County Tax Reference
 *
 * Covers:
 *   • Federal: payroll taxes, FICA, FUTA, 941 deposit schedule, 1099-NEC,
 *     Section 179 / bonus depreciation, mileage rates, quarterly calendar
 *   • Virginia State: income tax withholding, SUI (SUTA), SCC registration,
 *     sales & use tax on materials, VA Form VA-4, Form ST-9, annual filings
 *   • Virginia Counties: BPOL (Business, Professional & Occupational License),
 *     machinery & tools tax, real estate assessment schedule, personal property
 *     tax on equipment, county-specific notes for Chesterfield, Henrico,
 *     Spotsylvania, Stafford, Prince William, Fairfax, Richmond City, etc.
 *   • Interactive payroll estimator (gross → net breakdown)
 *   • Key deadline calendar
 *   • Printable quick-reference card
 *
 * Route: /advisory/tax-compliance
 */
import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import SchemaMarkup from '../../components/SchemaMarkup'
import DisclaimerBanner from '../../components/advisory/DisclaimerBanner'

// ─── Data ─────────────────────────────────────────────────────────────────────

const FEDERAL_SECTIONS = [
  {
    id: 'payroll',
    icon: '🏛️',
    title: 'Federal Payroll Taxes (Form 941)',
    color: 'border-blue-300',
    accent: 'text-blue-700',
    bg: 'bg-blue-50',
    items: [
      { label: 'Federal Income Tax Withholding', value: 'Graduated — per IRS Publication 15-T tables (2026). Must match W-4 elections.' },
      { label: 'Social Security (OASDI)', value: '6.2% employee + 6.2% employer = 12.4% total · Wage base: $176,100 (2026)' },
      { label: 'Medicare (HI)', value: '1.45% employee + 1.45% employer = 2.9% total · No wage cap' },
      { label: 'Additional Medicare Surtax', value: '0.9% on employee wages > $200,000 (single) / $250,000 (MFJ) — employer does NOT match' },
      { label: 'Total FICA on first $176,100', value: '7.65% employee / 7.65% employer' },
      { label: 'Form 941 Filing', value: 'Quarterly — due April 30, July 31, Oct 31, Jan 31' },
      { label: 'Monthly Depositor Rule', value: 'Lookback period tax liability < $50,000 → deposit by 15th of following month' },
      { label: 'Semi-Weekly Depositor Rule', value: 'Lookback period tax liability ≥ $50,000 → paydays Wed–Fri deposit by following Wed; paydays Sat–Tue deposit by following Fri' },
      { label: 'Next-Day Rule', value: 'Single payroll tax deposit ≥ $100,000 must be deposited next banking day' },
      { label: 'EFTPS Requirement', value: 'All federal tax deposits must be made via EFTPS (eftps.gov) — no paper checks to IRS' },
    ],
  },
  {
    id: 'futa',
    icon: '📊',
    title: 'FUTA — Federal Unemployment Tax',
    color: 'border-indigo-300',
    accent: 'text-indigo-700',
    bg: 'bg-indigo-50',
    items: [
      { label: 'FUTA Rate', value: '6.0% on first $7,000 of each employee\'s wages per year' },
      { label: 'VA SUTA Credit', value: 'Up to 5.4% credit if Virginia SUI contributions are current → effective net FUTA = 0.6%' },
      { label: 'Max FUTA per Employee', value: '$42.00/year (at 0.6% net after credit) / $420.00 if credit lost' },
      { label: 'FUTA Deposit Trigger', value: 'Deposit quarterly when cumulative FUTA liability > $500' },
      { label: 'Annual Reconciliation', value: 'Form 940 due January 31 following the calendar year' },
      { label: 'Credit Reduction Risk', value: 'If Virginia borrows from federal unemployment trust fund, the 5.4% credit is reduced — check IRS annually' },
    ],
  },
  {
    id: '1099',
    icon: '📄',
    title: '1099-NEC — Independent Contractors',
    color: 'border-orange-300',
    accent: 'text-orange-700',
    bg: 'bg-orange-50',
    items: [
      { label: 'Reporting Threshold', value: '$600 or more paid to any individual or single-member LLC for services in a calendar year' },
      { label: 'Due to Recipient', value: 'January 31 of the following year' },
      { label: 'Due to IRS (paper)', value: 'February 28 of the following year' },
      { label: 'Due to IRS (e-file)', value: 'March 31 of the following year · E-file required if filing 10+ forms (2024+ threshold)' },
      { label: 'No 1099 Required For', value: 'Corporations (C-Corp or S-Corp) — but required for attorneys regardless of entity type' },
      { label: 'Backup Withholding', value: '24% if contractor does not provide a valid TIN/W-9 or is flagged by IRS' },
      { label: 'Virginia Copy', value: 'Virginia requires 1099-NEC copies when Virginia income tax is withheld — file via W2/1099 portal' },
      { label: 'SE Tax for Contractors', value: 'Contractors pay 15.3% self-employment tax on net earnings (both halves of FICA)' },
    ],
  },
  {
    id: 'depreciation',
    icon: '🏗️',
    title: 'Section 179 & Bonus Depreciation — Equipment & Vehicles',
    color: 'border-green-300',
    accent: 'text-green-700',
    bg: 'bg-green-50',
    items: [
      { label: 'Section 179 Deduction Limit (2026)', value: '$1,220,000 (indexed for inflation — verify IRS Rev. Proc. for final 2026 amount)' },
      { label: 'Section 179 Phase-Out Threshold', value: 'Begins at $3,050,000 of qualifying property placed in service' },
      { label: 'Bonus Depreciation (2026)', value: '40% first-year bonus depreciation on new and used qualifying property' },
      { label: 'Bonus Depreciation Schedule', value: '60% (2024) → 40% (2025) → 20% (2026) → 0% (2027+) unless Congress extends' },
      { label: 'MACRS — Asphalt Equipment', value: '5-year MACRS (200% DB) for most construction equipment, rollers, pavers, trucks < 14,000 lb GVW' },
      { label: 'MACRS — Heavy Trucks & Trailers', value: '5-year or 3-year; tractors and semi-trailers 3-year MACRS' },
      { label: 'Listed Property (Vehicles ≤ 6,000 lb GVW)', value: 'SUV/pickup annual Sec 179 cap: $12,400 (2026 est.) · Must use > 50% for business' },
      { label: 'Heavy SUV Limit (> 6,000 lb, ≤ 14,000 lb)', value: 'Sec 179 SUV limit: $30,500 (2026 est.) — regular Sec 179 rules above apply to trucks/dump trucks' },
      { label: 'IRS Form', value: 'Form 4562 — Depreciation and Amortization (attach to Form 1040 Schedule C or 1120-S)' },
    ],
  },
  {
    id: 'mileage',
    icon: '🚗',
    title: 'Standard Mileage Rates & Vehicle Deductions',
    color: 'border-teal-300',
    accent: 'text-teal-700',
    bg: 'bg-teal-50',
    items: [
      { label: 'Business Mileage Rate (2026)', value: '70¢ per mile (67¢ in 2024, 70¢ in 2025 — confirm IRS Notice for 2026)' },
      { label: 'Medical / Moving Rate (2026)', value: '21¢ per mile' },
      { label: 'Charitable Rate', value: '14¢ per mile (set by statute, rarely changes)' },
      { label: 'Actual Expense Method', value: 'Gas, oil, insurance, repairs, registration, depreciation — can often beat standard rate for heavy trucks' },
      { label: 'Commuting', value: 'Home to first job site = personal (non-deductible) · Job site to job site = business' },
      { label: 'Mileage Log Requirement', value: 'Date, destination, business purpose, odometer start/end — required for any deduction' },
    ],
  },
  {
    id: 'federal-calendar',
    icon: '📅',
    title: 'Federal Tax Calendar — Key Deadlines',
    color: 'border-red-300',
    accent: 'text-red-700',
    bg: 'bg-red-50',
    items: [
      { label: 'Jan 15', value: 'Q4 estimated tax (Form 1040-ES) due' },
      { label: 'Jan 31', value: 'W-2 to employees · 1099-NEC to recipients · 940 annual FUTA · 941 Q4' },
      { label: 'Feb 28 / Mar 31', value: '1099 paper / e-file to IRS' },
      { label: 'Mar 15', value: 'S-Corp (1120-S) and Partnership (1065) returns due (or extend)' },
      { label: 'Apr 15', value: 'C-Corp (1120) and individual (1040) returns due · Q1 estimated tax due' },
      { label: 'Apr 30', value: '941 Q1 due' },
      { label: 'Jun 16', value: 'Q2 estimated tax due' },
      { label: 'Jul 31', value: '941 Q2 due' },
      { label: 'Sep 15', value: 'Q3 estimated tax due · Extended S-Corp / Partnership due' },
      { label: 'Oct 15', value: 'Extended individual returns (1040) due' },
      { label: 'Oct 31', value: '941 Q3 due' },
      { label: 'Dec 15', value: 'Q4 estimated tax — corporations' },
    ],
  },
]

const VIRGINIA_SECTIONS = [
  {
    id: 'va-income',
    icon: '🏛️',
    title: 'Virginia Income Tax Withholding',
    color: 'border-blue-400',
    accent: 'text-blue-800',
    bg: 'bg-blue-50',
    items: [
      { label: 'VA Withholding Account', value: 'Register at tax.virginia.gov — Business Registration (Form R-1) before first payroll' },
      { label: 'VA Form VA-4', value: 'Employee withholding exemption certificate — collect from every employee at hire' },
      { label: 'VA Income Tax Rates (2026)', value: '2% on first $3,000 · 3% $3,001–$5,000 · 5% $5,001–$17,000 · 5.75% over $17,000' },
      { label: 'Withholding Filing Frequency', value: 'Monthly if annual withholding ≥ $1,000 · Quarterly if < $1,000 · Annual if < $100' },
      { label: 'Monthly Deposits', value: 'Due by the 25th of the following month (VA Form VA-5)' },
      { label: 'Quarterly Returns', value: 'Due the last day of the month following the quarter (VA Form VA-5)' },
      { label: 'Annual Reconciliation', value: 'VA Form VA-6 due January 31 · W-2s submitted to VA electronically via Web Upload or SFTP' },
      { label: 'VA W-2 E-file Threshold', value: '25+ W-2 forms → electronic submission required' },
      { label: 'Standard Deduction (2026)', value: '$8,000 single / $16,000 married (increased by legislature — verify for TY2026)' },
    ],
  },
  {
    id: 'va-sui',
    icon: '📊',
    title: 'Virginia State Unemployment Insurance (SUI / SUTA)',
    color: 'border-purple-300',
    accent: 'text-purple-700',
    bg: 'bg-purple-50',
    items: [
      { label: 'Taxable Wage Base (2026)', value: '$8,000 per employee per year' },
      { label: 'New Employer Rate', value: '2.53% for construction industry (higher than default 2.51% for new employers generally)' },
      { label: 'Experienced Rate Range', value: '0.1% – 6.2% based on claims history and reserve ratio' },
      { label: 'Rate Notice', value: 'Issued annually by Virginia VEC — check your mailed Rate Notice each December / January' },
      { label: 'Quarterly Filing', value: 'Form FC-20 (payroll report) + FC-21 (tax payment) — due Apr 30, Jul 31, Oct 31, Jan 31' },
      { label: 'Electronic Filing', value: 'Required for employers with 25+ employees; optional for smaller employers via vec.virginia.gov' },
      { label: 'Joint VEC / DOLI Registration', value: 'Form R-1 at tax.virginia.gov registers with both TAX and VEC simultaneously' },
      { label: 'New Hire Reporting', value: 'Report within 20 days of hire at dss.virginia.gov/newhire — required for all new employees' },
    ],
  },
  {
    id: 'va-sales',
    icon: '🛒',
    title: 'Virginia Sales & Use Tax — Construction Materials',
    color: 'border-green-400',
    accent: 'text-green-800',
    bg: 'bg-green-50',
    items: [
      { label: 'VA Sales Tax Rate', value: '5.3% statewide (4.3% state + 1.0% local) · Some localities add additional: Northern VA & Hampton Roads = 6.0%' },
      { label: 'Construction Contractor Rule', value: 'Contractors are consumers of materials → pay sales/use tax at purchase; do NOT charge sales tax to customer on labor or materials' },
      { label: 'Lump-Sum Contracts', value: 'All materials must have VA sales/use tax paid at purchase — no exemption' },
      { label: 'Time & Materials Contracts', value: 'Contractor still pays tax on materials; may charge separately for materials on invoice but not required to collect sales tax' },
      { label: 'Resale Exemption', value: 'Only available if contractor has a VA Retail Merchant License and separately states material price — rarely applies to paving/asphalt contractors' },
      { label: 'Use Tax', value: 'If supplier did not charge VA sales tax (e.g. out-of-state purchase), contractor owes VA use tax · File on Form ST-7' },
      { label: 'Asphalt / HMA', value: 'Hot mix asphalt is taxable as tangible personal property at time of sale from plant to contractor' },
      { label: 'Subcontractor Purchases', value: 'Each subcontractor is responsible for their own sales/use tax — prime cannot pass tax-free' },
      { label: 'Filing Form', value: 'Form ST-9 (monthly or quarterly) at tax.virginia.gov · Monthly if annual liability > $100; quarterly if less' },
    ],
  },
  {
    id: 'va-corp',
    icon: '🏢',
    title: 'Virginia Corporate / Pass-Through Tax & SCC',
    color: 'border-orange-400',
    accent: 'text-orange-800',
    bg: 'bg-orange-50',
    items: [
      { label: 'VA Corporate Income Tax Rate', value: '6.0% flat on Virginia taxable income (Form 500)' },
      { label: 'S-Corp / LLC Pass-Through', value: 'No entity-level income tax for S-Corps or single-member LLCs — income flows to individual VA-760 returns' },
      { label: 'Composite Return', value: 'Multi-member partnerships and S-Corps may file composite return for non-resident owners (Form 765 / 502)' },
      { label: 'VA SCC Annual Registration Fee', value: 'LLC: $50/year · Corporation: $100/year · Due by last day of month 12 months after formation anniversary' },
      { label: 'SCC Registered Agent', value: 'Required — must have a VA registered agent with physical address (not PO Box)' },
      { label: 'Corporate Extension', value: '7-month automatic extension (Form 500CP) · Tax must still be paid by original due date to avoid penalty' },
      { label: 'VA Estimated Tax (Corps)', value: 'Required if VA tax liability > $1,000 · Quarterly on 15th of May, Jun, Sep, Dec' },
      { label: 'Workers\' Comp Insurance', value: 'Required for any employer with 3+ regular employees — file Certificate of Insurance with VWCC' },
    ],
  },
  {
    id: 'va-calendar',
    icon: '📅',
    title: 'Virginia Tax Calendar — Key Deadlines',
    color: 'border-red-400',
    accent: 'text-red-800',
    bg: 'bg-red-50',
    items: [
      { label: 'Jan 31', value: 'VA-6 annual reconciliation + W-2s to VA · VEC Q4 (FC-20/21) due' },
      { label: 'Feb 1', value: 'SCC annual registration renewal (check your LLC/Corp anniversary date)' },
      { label: 'Mar 1', value: 'VA Form 762 (Business Personal Property — varies by locality)' },
      { label: 'Apr 30', value: 'VEC Q1 due · VA-5 monthly withholding (March) due' },
      { label: 'May 1', value: 'BPOL filings due in most localities (based on prior year gross receipts)' },
      { label: 'May 15', value: 'VA Corp (Form 500) due — or request extension · VA estimated Q1 corps' },
      { label: 'Jun 15', value: 'VA estimated Q2 — individuals and corps' },
      { label: 'Jul 31', value: 'VEC Q2 due' },
      { label: 'Sep 15', value: 'VA estimated Q3' },
      { label: 'Oct 31', value: 'VEC Q3 due' },
      { label: 'Nov 1', value: 'Machinery & Tools tax returns due in some localities' },
    ],
  },
]

const COUNTY_DATA = [
  {
    name: 'Chesterfield County',
    bpol: '$0.19 per $100 gross receipts (contractors)',
    personalProp: '3.6% assessed value — equipment assessed at 60% of OC Year 1, declining schedule',
    machineryTools: '$3.50 per $100 of assessed value',
    realEstate: '$0.96 per $100 assessed value',
    notes: 'BPOL due May 1. Form available at chesterfield.gov/finance. Equipment > $25,000 must be itemized.',
    link: 'https://www.chesterfield.gov/272/Business-License',
  },
  {
    name: 'Henrico County',
    bpol: '$0.19 per $100 gross receipts (contractors)',
    personalProp: '3.5% — equipment assessed at 90%/80%/70%/60%/50% of OC over 5 years',
    machineryTools: '$3.50 per $100',
    realEstate: '$0.87 per $100 assessed value',
    notes: 'BPOL due March 1. Online portal available. License required before operating in county.',
    link: 'https://henrico.gov/services/business-license/',
  },
  {
    name: 'Spotsylvania County',
    bpol: '$0.16 per $100 gross receipts (contractors)',
    personalProp: '4.0% tax rate on assessed value',
    machineryTools: '$1.20 per $100',
    realEstate: '$0.77 per $100 assessed value',
    notes: 'Business tangible personal property return due May 1. BPOL due May 1.',
    link: 'https://www.spotsylvania.va.us/193/Commissioner-of-the-Revenue',
  },
  {
    name: 'Stafford County',
    bpol: '$0.16 per $100 gross receipts (contractors)',
    personalProp: '5.0% tax rate on assessed value',
    machineryTools: '$4.50 per $100',
    realEstate: '$0.91 per $100 assessed value',
    notes: 'Business personal property due May 1. Heavy equipment separately assessed.',
    link: 'https://www.staffordcountyva.gov/283/Business-License',
  },
  {
    name: 'Prince William County',
    bpol: '$0.19 per $100 gross receipts (contractors)',
    personalProp: '$3.70 per $100 assessed',
    machineryTools: '$3.70 per $100',
    realEstate: '$1.125 per $100 assessed value',
    notes: 'BPOL due March 1. One of higher M&T rates in NoVA corridor. Verify heavy equipment situs rules.',
    link: 'https://www.pwcgov.org/government/dept/finance/Pages/Business-Licenses.aspx',
  },
  {
    name: 'Fairfax County',
    bpol: '$0.19 per $100 gross receipts (contractors — Class III)',
    personalProp: '$4.57 per $100 assessed',
    machineryTools: '$4.57 per $100',
    realEstate: '$1.135 per $100 assessed value',
    notes: 'Highest rates in region. BPOL due Mar 1. Fairfax City and Falls Church are separate jurisdictions.',
    link: 'https://www.fairfaxcounty.gov/taxes/business-license',
  },
  {
    name: 'Richmond City',
    bpol: '$0.19 per $100 gross receipts (contractors)',
    personalProp: '$3.70 per $100',
    machineryTools: '$2.30 per $100',
    realEstate: '$1.20 per $100 assessed value',
    notes: 'City separate from Henrico/Chesterfield. BPOL due March 1. Richmond has a Business One Stop portal.',
    link: 'https://www.rva.gov/finance/business-taxes',
  },
  {
    name: 'Virginia Beach City',
    bpol: '$0.19 per $100 gross receipts (contractors)',
    personalProp: '$4.00 per $100',
    machineryTools: '$3.50 per $100',
    realEstate: '$0.99 per $100 assessed value',
    notes: 'Hampton Roads 1% additional sales tax applies (6% total). BPOL due March 1.',
    link: 'https://www.vbgov.com/government/departments/commissioner-of-revenue/Pages/business-license-tax.aspx',
  },
  {
    name: 'Loudoun County',
    bpol: '$0.19 per $100 gross receipts (contractors)',
    personalProp: '$4.20 per $100',
    machineryTools: '$4.20 per $100',
    realEstate: '$1.045 per $100 assessed value',
    notes: 'Fast-growth county — many new business registrations. NoVA 0.7% additional sales tax applies (6% total).',
    link: 'https://www.loudoun.gov/1428/Business-License',
  },
  {
    name: 'Frederick County',
    bpol: '$0.12 per $100 gross receipts (contractors)',
    personalProp: '$4.86 per $100',
    machineryTools: '$0.60 per $100',
    realEstate: '$0.61 per $100 assessed value',
    notes: 'Lower M&T rate — favorable for equipment-heavy operations in Shenandoah corridor.',
    link: 'https://www.fcva.us/government/departments/commissioner-of-the-revenue',
  },
]

// ─── BPOL Rate Estimator ───────────────────────────────────────────────────────

function BpolEstimator() {
  const [receipts, setReceipts] = useState('')
  const [county, setCounty] = useState('Chesterfield County')

  const selectedCounty = COUNTY_DATA.find(c => c.name === county)
  const rateMatch = selectedCounty?.bpol.match(/\$([\d.]+)/)
  const rate = rateMatch ? parseFloat(rateMatch[1]) : 0.19
  const grossNum = parseFloat((receipts || '0').replace(/,/g, '')) || 0
  const bpolTax = (grossNum / 100) * rate

  return (
    <div className="bg-white rounded-2xl border border-orange-200 shadow-sm p-6">
      <h3 className="font-bold text-brand-navy text-lg mb-1 flex items-center gap-2">
        <span>🧮</span> BPOL Quick Estimator
      </h3>
      <p className="text-sm text-brand-navy/60 mb-5">
        Estimate your Business, Professional & Occupational License (BPOL) tax based on prior-year gross receipts.
        This is informational only — confirm with your locality.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
        <div>
          <label className="block text-xs font-semibold text-brand-navy/70 mb-1">Locality</label>
          <select
            value={county}
            onChange={e => setCounty(e.target.value)}
            className="w-full border border-brand-navy/20 rounded-lg px-3 py-2.5 text-sm text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-amber"
          >
            {COUNTY_DATA.map(c => (
              <option key={c.name} value={c.name}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-brand-navy/70 mb-1">Prior-Year Gross Receipts ($)</label>
          <input
            type="number"
            min="0"
            placeholder="e.g. 850000"
            value={receipts}
            onChange={e => setReceipts(e.target.value)}
            className="w-full border border-brand-navy/20 rounded-lg px-3 py-2.5 text-sm text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-amber"
          />
        </div>
      </div>

      {grossNum > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-brand-navy/60 font-medium">{county} · Contractor BPOL Rate</div>
            <div className="text-2xl font-extrabold text-brand-navy mt-1">
              ${bpolTax.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-brand-navy/50 mt-0.5">
              ${(grossNum / 100).toLocaleString()} × ${rate}/100
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs font-semibold text-brand-navy/60">Gross Receipts</div>
            <div className="text-lg font-bold text-brand-navy">
              ${grossNum.toLocaleString('en-US', { minimumFractionDigits: 0 })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Payroll Estimator ────────────────────────────────────────────────────────

function PayrollEstimator() {
  const [gross, setGross] = useState('')
  const [payType, setPayType] = useState('w2')
  const [frequency, setFrequency] = useState('biweekly')
  const [state, setState] = useState('VA')

  const freqLabel = { weekly: 52, biweekly: 26, semimonthly: 24, monthly: 12 }
  const paymentsPerYear = freqLabel[frequency] || 26

  const result = useMemo(() => {
    const g = parseFloat((gross || '0').replace(/,/g, '')) || 0
    if (g <= 0) return null

    if (payType === '1099') {
      const seTax = g * 0.9235 * 0.153
      const deductibleSE = seTax / 2
      const federalEst = g * 0.22 // rough 22% bracket estimate
      const vaEst = g * 0.0575
      return {
        type: '1099',
        gross: g,
        seTax,
        deductibleSE,
        federalEst,
        vaEst,
        totalTaxBurden: seTax + federalEst + vaEst - deductibleSE * 0.22,
        netEst: g - seTax - federalEst - vaEst + deductibleSE * 0.22,
      }
    }

    // W-2 Employee (per-paycheck)
    const annualGross = g * paymentsPerYear
    const ss = Math.min(g, (176100 / paymentsPerYear)) * 0.062
    const medicare = g * 0.0145
    const additionalMedicare = annualGross > 200000 ? Math.max(0, g - (200000 / paymentsPerYear)) * 0.009 : 0
    const vaWithholding = g * 0.0575
    const federalWithholding = g * 0.22 // simplified single-bracket estimate
    const employerSS = Math.min(g, (176100 / paymentsPerYear)) * 0.062
    const employerMedicare = g * 0.0145
    const totalDeductions = ss + medicare + additionalMedicare + vaWithholding + federalWithholding
    const employerCost = g + employerSS + employerMedicare + (g * 0.006) // FUTA at 0.6%

    return {
      type: 'w2',
      gross: g,
      ss,
      medicare,
      additionalMedicare,
      vaWithholding,
      federalWithholding,
      totalDeductions,
      employeeTakeHome: g - totalDeductions,
      employerCost,
      employerSS,
      employerMedicare,
    }
  }, [gross, payType, frequency, paymentsPerYear, state])

  const fmt = (n) => '$' + (n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  return (
    <div className="bg-white rounded-2xl border border-brand-navy/20 shadow-sm p-6">
      <h3 className="font-bold text-brand-navy text-lg mb-1 flex items-center gap-2">
        <span>💵</span> Payroll Tax Estimator
      </h3>
      <p className="text-sm text-brand-navy/60 mb-5">
        Rough estimate only. Federal withholding uses a flat 22% proxy — actual withholding depends on W-4 elections and IRS tables.
        Virginia withholding uses 5.75% top marginal rate proxy.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        <div>
          <label className="block text-xs font-semibold text-brand-navy/70 mb-1">Worker Type</label>
          <select
            value={payType}
            onChange={e => setPayType(e.target.value)}
            className="w-full border border-brand-navy/20 rounded-lg px-3 py-2.5 text-sm text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-amber"
          >
            <option value="w2">W-2 Employee</option>
            <option value="1099">1099 Contractor (annual net)</option>
          </select>
        </div>
        {payType === 'w2' && (
          <div>
            <label className="block text-xs font-semibold text-brand-navy/70 mb-1">Pay Frequency</label>
            <select
              value={frequency}
              onChange={e => setFrequency(e.target.value)}
              className="w-full border border-brand-navy/20 rounded-lg px-3 py-2.5 text-sm text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-amber"
            >
              <option value="weekly">Weekly (52×)</option>
              <option value="biweekly">Bi-Weekly (26×)</option>
              <option value="semimonthly">Semi-Monthly (24×)</option>
              <option value="monthly">Monthly (12×)</option>
            </select>
          </div>
        )}
        <div>
          <label className="block text-xs font-semibold text-brand-navy/70 mb-1">
            {payType === 'w2' ? 'Gross Pay This Period ($)' : 'Annual Net Profit ($)'}
          </label>
          <input
            type="number"
            min="0"
            placeholder={payType === 'w2' ? 'e.g. 1500' : 'e.g. 75000'}
            value={gross}
            onChange={e => setGross(e.target.value)}
            className="w-full border border-brand-navy/20 rounded-lg px-3 py-2.5 text-sm text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-amber"
          />
        </div>
      </div>

      {result && result.type === 'w2' && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-brand-navy/5 rounded-xl p-4">
              <div className="text-xs font-semibold text-brand-navy/60 mb-2 uppercase tracking-wide">Employee Deductions</div>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between"><span className="text-brand-navy/70">Social Security (6.2%)</span><span className="font-semibold text-brand-navy">{fmt(result.ss)}</span></div>
                <div className="flex justify-between"><span className="text-brand-navy/70">Medicare (1.45%)</span><span className="font-semibold text-brand-navy">{fmt(result.medicare)}</span></div>
                {result.additionalMedicare > 0 && <div className="flex justify-between"><span className="text-brand-navy/70">Add'l Medicare (0.9%)</span><span className="font-semibold text-brand-navy">{fmt(result.additionalMedicare)}</span></div>}
                <div className="flex justify-between"><span className="text-brand-navy/70">Federal W/H (≈22%)</span><span className="font-semibold text-brand-navy">{fmt(result.federalWithholding)}</span></div>
                <div className="flex justify-between"><span className="text-brand-navy/70">Virginia W/H (≈5.75%)</span><span className="font-semibold text-brand-navy">{fmt(result.vaWithholding)}</span></div>
                <div className="flex justify-between border-t border-brand-navy/10 pt-1.5 mt-1"><span className="font-bold text-brand-navy">Total Deducted</span><span className="font-extrabold text-red-600">{fmt(result.totalDeductions)}</span></div>
                <div className="flex justify-between"><span className="font-bold text-brand-navy">Est. Take-Home</span><span className="font-extrabold text-green-700">{fmt(result.employeeTakeHome)}</span></div>
              </div>
            </div>
            <div className="bg-orange-50 rounded-xl p-4">
              <div className="text-xs font-semibold text-orange-700 mb-2 uppercase tracking-wide">Employer Cost</div>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between"><span className="text-brand-navy/70">Gross Pay</span><span className="font-semibold text-brand-navy">{fmt(result.gross)}</span></div>
                <div className="flex justify-between"><span className="text-brand-navy/70">Employer SS (6.2%)</span><span className="font-semibold text-brand-navy">{fmt(result.employerSS)}</span></div>
                <div className="flex justify-between"><span className="text-brand-navy/70">Employer Medicare (1.45%)</span><span className="font-semibold text-brand-navy">{fmt(result.employerMedicare)}</span></div>
                <div className="flex justify-between"><span className="text-brand-navy/70">FUTA (≈0.6%)</span><span className="font-semibold text-brand-navy">{fmt(result.gross * 0.006)}</span></div>
                <div className="flex justify-between border-t border-brand-navy/10 pt-1.5 mt-1"><span className="font-bold text-brand-navy">Total Employer Cost</span><span className="font-extrabold text-orange-700">{fmt(result.employerCost)}</span></div>
              </div>
            </div>
          </div>
          <p className="text-xs text-brand-navy/40 italic">Does not include workers' comp premium, health insurance, 401(k) match, or VA SUI. Use IRS Pub 15 tables for precise withholding.</p>
        </div>
      )}

      {result && result.type === '1099' && (
        <div className="bg-brand-navy/5 rounded-xl p-4 space-y-2 text-sm">
          <div className="text-xs font-semibold text-brand-navy/60 mb-2 uppercase tracking-wide">Annual 1099 Tax Burden Estimate</div>
          <div className="flex justify-between"><span className="text-brand-navy/70">Net Profit</span><span className="font-semibold text-brand-navy">{fmt(result.gross)}</span></div>
          <div className="flex justify-between"><span className="text-brand-navy/70">Self-Employment Tax (15.3%)</span><span className="font-semibold text-brand-navy">{fmt(result.seTax)}</span></div>
          <div className="flex justify-between"><span className="text-brand-navy/70">Deductible SE (50%)</span><span className="font-semibold text-green-700">-{fmt(result.deductibleSE)}</span></div>
          <div className="flex justify-between"><span className="text-brand-navy/70">Federal Income Tax (≈22%)</span><span className="font-semibold text-brand-navy">{fmt(result.federalEst)}</span></div>
          <div className="flex justify-between"><span className="text-brand-navy/70">Virginia Income Tax (≈5.75%)</span><span className="font-semibold text-brand-navy">{fmt(result.vaEst)}</span></div>
          <div className="flex justify-between border-t border-brand-navy/10 pt-1.5 mt-1"><span className="font-bold text-brand-navy">Est. Total Tax</span><span className="font-extrabold text-red-600">{fmt(result.totalTaxBurden)}</span></div>
          <div className="flex justify-between"><span className="font-bold text-brand-navy">Est. After-Tax Net</span><span className="font-extrabold text-green-700">{fmt(result.netEst)}</span></div>
          <p className="text-xs text-brand-navy/40 italic pt-1">Simplified estimate. Actual liability depends on deductions, filing status, and QBI deduction eligibility. Consult a CPA.</p>
        </div>
      )}
    </div>
  )
}

// ─── Section Accordion ────────────────────────────────────────────────────────

function TaxSection({ section }) {
  return (
    <details className={`rounded-2xl border-2 ${section.color} overflow-hidden shadow-sm group`}>
      <summary className={`${section.bg} px-6 py-4 cursor-pointer list-none flex items-center justify-between gap-3 hover:brightness-95 transition-all`}>
        <div className="flex items-center gap-3">
          <span className="text-2xl" aria-hidden="true">{section.icon}</span>
          <span className={`font-bold text-base ${section.accent}`}>{section.title}</span>
        </div>
        <svg className="w-5 h-5 text-brand-navy/40 shrink-0 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </summary>
      <div className="bg-white divide-y divide-brand-navy/5">
        {section.items.map((item, i) => (
          <div key={i} className="px-6 py-3.5 grid grid-cols-1 sm:grid-cols-5 gap-1 sm:gap-4">
            <dt className="text-xs font-bold text-brand-navy/60 uppercase tracking-wide sm:col-span-2 pt-0.5">{item.label}</dt>
            <dd className="text-sm text-brand-navy sm:col-span-3 leading-relaxed">{item.value}</dd>
          </div>
        ))}
      </div>
    </details>
  )
}

// ─── County Table ─────────────────────────────────────────────────────────────

function CountyTable() {
  const [expanded, setExpanded] = useState(null)
  return (
    <div className="space-y-3">
      {COUNTY_DATA.map(c => (
        <div
          key={c.name}
          className="bg-white rounded-2xl border border-brand-navy/15 shadow-sm overflow-hidden"
        >
          <button
            className="w-full text-left px-6 py-4 flex items-center justify-between gap-3 hover:bg-brand-navy/3 transition-colors"
            onClick={() => setExpanded(expanded === c.name ? null : c.name)}
          >
            <span className="font-bold text-brand-navy text-sm">{c.name}</span>
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline text-xs font-medium text-orange-600 bg-orange-50 border border-orange-200 rounded-full px-2 py-0.5">
                BPOL {c.bpol.split(' ')[0]}
              </span>
              <svg className={`w-4 h-4 text-brand-navy/40 shrink-0 transition-transform ${expanded === c.name ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>

          {expanded === c.name && (
            <div className="border-t border-brand-navy/10 bg-brand-navy/2 px-6 py-4 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
              <Row label="BPOL Rate (Contractors)" val={c.bpol} />
              <Row label="Personal Property Tax" val={c.personalProp} />
              <Row label="Machinery & Tools Tax" val={c.machineryTools} />
              <Row label="Real Estate Tax Rate" val={c.realEstate} />
              <div className="sm:col-span-2">
                <Row label="Notes" val={c.notes} />
              </div>
              <div className="sm:col-span-2">
                <a href={c.link} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 underline hover:text-blue-800 mt-1">
                  Official County Commissioner of Revenue →
                </a>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function Row({ label, val }) {
  return (
    <div>
      <dt className="text-xs font-bold text-brand-navy/50 uppercase tracking-wide mb-0.5">{label}</dt>
      <dd className="text-brand-navy leading-snug">{val}</dd>
    </div>
  )
}

// ─── Quick Reference Card ─────────────────────────────────────────────────────

function QuickRefCard() {
  return (
    <div className="bg-brand-navy rounded-2xl p-6 text-white">
      <h3 className="font-extrabold text-lg mb-4 flex items-center gap-2">
        <span>📌</span> Quick-Reference Cheat Sheet
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        {[
          { title: 'FICA (Employee)', items: ['SS: 6.2% up to $176,100', 'Medicare: 1.45%', 'Add\'l Medicare: 0.9% > $200k', 'Employer matches SS + Med'] },
          { title: 'FUTA / SUTA', items: ['FUTA: 6.0% on $7k', 'VA credit: 5.4% → net 0.6%', 'VA SUTA base: $8,000/employee', 'New constr. rate: 2.53%'] },
          { title: 'Virginia Tax', items: ['Income: 2%–5.75%', 'Sales/Use: 5.3% (NoVA 6%)', 'Corp rate: 6.0%', 'SCC LLC fee: $50/yr'] },
          { title: 'Key Dates', items: ['Jan 31: W-2, 1099, 940, VA-6', 'Apr/Jul/Oct/Jan 31: 941, VEC', 'May 1: BPOL most localities', 'Quarterly: 1040-ES estimates'] },
        ].map(card => (
          <div key={card.title} className="bg-white/10 rounded-xl p-4">
            <div className="font-bold text-white/90 mb-2 text-sm">{card.title}</div>
            <ul className="space-y-1">
              {card.items.map(item => (
                <li key={item} className="text-white/70 flex gap-1.5">
                  <span className="text-brand-amber shrink-0">·</span>{item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TaxComplianceAdvisory() {
  const [activeTab, setActiveTab] = useState('federal')

  const tabs = [
    { id: 'federal', label: '🏛️ Federal', short: 'Federal' },
    { id: 'virginia', label: '🗺️ Virginia State', short: 'Virginia' },
    { id: 'county', label: '📍 County / Locality', short: 'County' },
    { id: 'tools', label: '🧮 Calculators', short: 'Calc' },
  ]

  return (
    <>
      <SchemaMarkup
        title="Tax Compliance Advisory — Federal, Virginia & County"
        description="Comprehensive tax compliance reference for Virginia contractors and construction businesses. Federal payroll, FICA, FUTA, 1099-NEC, Section 179, Virginia withholding, SUTA, BPOL, and county-level rates for Chesterfield, Henrico, Fairfax, Prince William, and more."
        canonical="/advisory/tax-compliance"
        breadcrumb={[
          { name: 'Home', path: '/' },
          { name: 'Advisory Board', path: '/advisory' },
          { name: 'Tax Compliance', path: '/advisory/tax-compliance' },
        ]}
      />

      {/* Hero */}
      <div className="bg-brand-navy pt-32 pb-20 text-white text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 pointer-events-none select-none" aria-hidden="true">
          <div className="text-[20rem] font-black leading-none tracking-tighter text-white text-center mt-8 opacity-30">
            TAX
          </div>
        </div>
        <div className="relative max-w-4xl mx-auto px-4">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm text-white/80 mb-6">
            <span>📋</span> Advisory Board · Tax Compliance
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 leading-tight">
            Tax Compliance<br />
            <span className="text-brand-amber">Advisory Reference</span>
          </h1>
          <p className="text-white/70 text-lg max-w-2xl mx-auto leading-relaxed">
            Federal payroll obligations, Virginia state tax requirements, and
            county-level BPOL, machinery & tools, and personal property tax
            rates — all in one place for Virginia construction contractors.
          </p>
          <div className="mt-8 flex flex-wrap gap-3 justify-center">
            {['FICA & Payroll', 'FUTA / SUTA', '1099-NEC', 'Section 179', 'BPOL', 'Sales & Use Tax'].map(tag => (
              <span key={tag} className="bg-white/10 border border-white/20 text-white/80 text-xs font-semibold px-3 py-1.5 rounded-full">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Sticky Tabs */}
      <div className="sticky top-0 z-30 bg-white border-b border-brand-navy/10 shadow-sm">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex overflow-x-auto gap-0">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`shrink-0 px-5 py-4 text-sm font-semibold border-b-2 transition-all ${
                  activeTab === tab.id
                    ? 'border-brand-amber text-brand-navy'
                    : 'border-transparent text-brand-navy/50 hover:text-brand-navy hover:border-brand-navy/20'
                }`}
              >
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.short}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-10 space-y-6">
        <DisclaimerBanner />

        {/* Federal Tab */}
        {activeTab === 'federal' && (
          <div className="space-y-4">
            <SectionHeader
              title="Federal Tax Obligations"
              sub="IRS payroll, FICA, FUTA, 1099-NEC, depreciation, and mileage — current 2026 figures."
            />
            {FEDERAL_SECTIONS.map(s => <TaxSection key={s.id} section={s} />)}
          </div>
        )}

        {/* Virginia Tab */}
        {activeTab === 'virginia' && (
          <div className="space-y-4">
            <SectionHeader
              title="Virginia State Tax Obligations"
              sub="Withholding, SUI/SUTA, sales & use tax, corporate registration, and Virginia filing calendar."
            />
            {VIRGINIA_SECTIONS.map(s => <TaxSection key={s.id} section={s} />)}
          </div>
        )}

        {/* County Tab */}
        {activeTab === 'county' && (
          <div className="space-y-6">
            <SectionHeader
              title="County & Locality Tax Rates"
              sub="BPOL, personal property, machinery & tools, and real estate rates for major Virginia localities."
            />
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 text-sm text-amber-800 flex gap-3">
              <span className="text-lg shrink-0">💡</span>
              <div>
                <strong>BPOL Tax:</strong> Business, Professional & Occupational License tax is charged on <em>gross receipts</em> from the prior year.
                Most localities require you to file where the work was <em>performed</em>, not where your office is located.
                If you work in multiple localities, you may owe BPOL in each one. Thresholds and minimum fees vary.
              </div>
            </div>
            <CountyTable />
          </div>
        )}

        {/* Calculators Tab */}
        {activeTab === 'tools' && (
          <div className="space-y-6">
            <SectionHeader
              title="Tax Calculators & Estimators"
              sub="Quick estimates for payroll taxes and BPOL. For final figures, consult your CPA or payroll provider."
            />
            <PayrollEstimator />
            <BpolEstimator />
          </div>
        )}

        {/* Quick Reference always visible */}
        <QuickRefCard />

        {/* Back link */}
        <div className="pt-4 border-t border-brand-navy/10">
          <Link to="/advisory" className="inline-flex items-center gap-2 text-sm text-brand-navy/60 hover:text-brand-navy transition-colors">
            ← Back to Advisory Board
          </Link>
        </div>
      </div>
    </>
  )
}

function SectionHeader({ title, sub }) {
  return (
    <div className="mb-2">
      <h2 className="text-2xl font-extrabold text-brand-navy">{title}</h2>
      {sub && <p className="text-sm text-brand-navy/60 mt-1">{sub}</p>}
    </div>
  )
}
