export default [
  {
    state: 'Alabama',
    abbr: 'AL',
    preliminaryNoticeRequired: false,
    preliminaryNoticeDeadline: null,
    preliminaryNoticeWho: [],
    lienFilingDeadlineDays: 120,
    lienFilingDeadlineNote: '120 days (4 months) from last furnishing of labor or materials',
    lienForeClosureDeadlineDays: 180,
    noticeOfIntentRequired: false,
    noticeOfIntentDeadlineDays: null,
    claimantTypes: ['GC', 'Subcontractor', 'Supplier', 'Equipment'],
    residentialOwnerOccupiedExceptions: true,
    citation: 'Ala. Code § 35-11-210 et seq.',
    notes: 'Homestead exemptions may limit lien rights on owner-occupied residential property.',
    lastVerified: '2026-01-01',
  },
  {
    state: 'Alaska',
    abbr: 'AK',
    preliminaryNoticeRequired: true,
    preliminaryNoticeDeadline: 'Before or within 5 days after first furnishing',
    preliminaryNoticeWho: ['Subcontractor', 'Supplier'],
    lienFilingDeadlineDays: 120,
    lienFilingDeadlineNote:
      '120 days from completion of construction; 15-day written notice of lien rights required for subcontractors before first furnishing',
    lienForeClosureDeadlineDays: 180,
    noticeOfIntentRequired: true,
    noticeOfIntentDeadlineDays: 10,
    claimantTypes: ['GC', 'Subcontractor', 'Supplier', 'Equipment'],
    residentialOwnerOccupiedExceptions: false,
    citation: 'AS § 34.35.050 et seq.',
    notes:
      'Notice of right to lien required within 5 days of first furnishing. 10-day notice of intent to lien required before filing.',
    lastVerified: '2026-01-01',
  },
  {
    state: 'Arizona',
    abbr: 'AZ',
    preliminaryNoticeRequired: true,
    preliminaryNoticeDeadline: 'Within 20 days of first furnishing',
    preliminaryNoticeWho: ['Subcontractor', 'Supplier', 'Equipment rental'],
    lienFilingDeadlineDays: 120,
    // Read against A.R.S. § 33-993 on 2026-08-26. The 120 days was right; the
    // row said nothing about the recorded notice of completion that halves it.
    lienFilingDeadlineNote:
      'One hundred twenty days after completion of the building, structure or improvement; or, ' +
      'if a notice of completion has been recorded, sixty days after that recordation',
    lienFilingShortenedBy: {
      trigger: 'a notice of completion is recorded',
      days: 60,
      note: 'Runs from the recordation of the notice and replaces the 120-day period.',
    },
    lienForeClosureDeadlineDays: 180,
    noticeOfIntentRequired: false,
    noticeOfIntentDeadlineDays: null,
    claimantTypes: ['GC', 'Subcontractor', 'Supplier', 'Equipment'],
    residentialOwnerOccupiedExceptions: false,
    citation: 'A.R.S. § 33-981 et seq.',
    notes:
      'Preliminary 20-day notice required for all parties except GC with direct contract with owner. Residential properties have same rules.',
    lastVerified: '2026-01-01',
  },
  {
    state: 'Arkansas',
    abbr: 'AR',
    preliminaryNoticeRequired: true,
    preliminaryNoticeDeadline: 'Within 10 days of first furnishing for suppliers',
    preliminaryNoticeWho: ['Supplier'],
    lienFilingDeadlineDays: 120,
    lienFilingDeadlineNote: '120 days from last furnishing of labor or materials',
    lienForeClosureDeadlineDays: 15,
    noticeOfIntentRequired: false,
    noticeOfIntentDeadlineDays: null,
    claimantTypes: ['GC', 'Subcontractor', 'Supplier', 'Equipment'],
    residentialOwnerOccupiedExceptions: true,
    citation: 'Ark. Code Ann. § 18-44-101 et seq.',
    notes:
      'Foreclosure suit must be filed within 15 months of last furnishing. Residential property has special notice requirements.',
    lastVerified: '2026-01-01',
  },
  {
    state: 'California',
    abbr: 'CA',
    preliminaryNoticeRequired: true,
    preliminaryNoticeDeadline: 'Within 20 days of first furnishing',
    preliminaryNoticeWho: ['Subcontractor', 'Supplier', 'Equipment rental', 'Design professional'],
    lienFilingDeadlineDays: 90,
    // Read against Cal. Civ. Code §§ 8412 and 8414 on 2026-08-26. The old note
    // had the two periods THE WRONG WAY ROUND: it gave general contractors 30
    // days after a notice of completion and subcontractors 60. The statute is
    // the reverse — § 8412 gives a direct contractor 60 days, § 8414 gives
    // every other claimant 30.
    //
    // The direction matters. As a GC the row understated the time available,
    // which is merely wrong. As a subcontractor it promised sixty days where
    // the statute allows thirty, and a lien filed on day 45 in reliance on it
    // is simply lost. Most of this company's California-pattern work is
    // subcontracted.
    lienFilingDeadlineNote:
      'Ninety days after completion of the work of improvement, or — if the owner records a ' +
      'notice of completion or cessation — sixty days for a direct contractor and thirty days ' +
      'for any other claimant, whichever is earlier',
    lienFilingShortenedBy: {
      trigger: 'owner records a notice of completion or cessation',
      directWithOwner: 60,
      other: 30,
      note: 'Runs from the recording of the notice and replaces the 90-day period.',
    },
    lienForeClosureDeadlineDays: 90,
    noticeOfIntentRequired: false,
    noticeOfIntentDeadlineDays: null,
    claimantTypes: ['GC', 'Subcontractor', 'Supplier', 'Equipment', 'Design professional'],
    residentialOwnerOccupiedExceptions: false,
    citation: 'Cal. Civ. Code § 8100 et seq.',
    notes:
      'Preliminary 20-day notice required for all claimants except direct contractors. If owner records Notice of Completion: GC has 60 days, subs/suppliers have 30 days. Joint check protections available. Most robust lien law in the US.',
    lastVerified: '2026-01-01',
  },
  {
    state: 'Colorado',
    abbr: 'CO',
    preliminaryNoticeRequired: false,
    preliminaryNoticeDeadline: null,
    preliminaryNoticeWho: [],
    lienFilingDeadlineDays: 120,
    lienFilingDeadlineNote: '120 days from last date of furnishing labor or materials',
    lienForeClosureDeadlineDays: 180,
    noticeOfIntentRequired: false,
    noticeOfIntentDeadlineDays: null,
    claimantTypes: ['GC', 'Subcontractor', 'Supplier', 'Equipment'],
    residentialOwnerOccupiedExceptions: false,
    citation: 'Colo. Rev. Stat. § 38-22-101 et seq.',
    notes:
      'No preliminary notice required. Lien statement must be filed within 4 months. Must commence foreclosure within 6 months of last furnishing or date lien filed.',
    lastVerified: '2026-01-01',
  },
  {
    state: 'Connecticut',
    abbr: 'CT',
    preliminaryNoticeRequired: false,
    preliminaryNoticeDeadline: null,
    preliminaryNoticeWho: [],
    lienFilingDeadlineDays: 90,
    lienFilingDeadlineNote: '90 days from last day of furnishing services or materials',
    lienForeClosureDeadlineDays: 365,
    noticeOfIntentRequired: false,
    noticeOfIntentDeadlineDays: null,
    claimantTypes: ['GC', 'Subcontractor', 'Supplier'],
    residentialOwnerOccupiedExceptions: false,
    citation: 'Conn. Gen. Stat. § 49-33 et seq.',
    notes:
      'Certificate of lien must be filed within 90 days. No preliminary notice required. Must serve copy of certificate on property owner within 30 days of filing.',
    lastVerified: '2026-01-01',
  },
  {
    state: 'Delaware',
    abbr: 'DE',
    preliminaryNoticeRequired: false,
    preliminaryNoticeDeadline: null,
    preliminaryNoticeWho: [],
    lienFilingDeadlineDays: 120,
    // Read against 25 Del. C. § 2711 on 2026-08-26. Both figures in the old
    // note were wrong: it said 60 days for original contractors and 90 for
    // subcontractors. The statute gives a contractor dealing directly with the
    // owner 180 days after completion of the structure — three times the
    // figure quoted — and 120 days to every other claimant. This company holds
    // prime contracts as well as subcontracts, so the badly wrong number was
    // the one covering its own direct work.
    lienFilingDeadlineNote:
      'Contractor dealing directly with the owner: 180 days after completion of the structure. ' +
      'All other claimants: 120 days from completion of the labor performed or last delivery of materials',
    lienFilingByClaimant: { directWithOwner: 180, other: 120 },
    lienForeClosureDeadlineDays: 365,
    noticeOfIntentRequired: false,
    noticeOfIntentDeadlineDays: null,
    claimantTypes: ['GC', 'Subcontractor', 'Supplier'],
    residentialOwnerOccupiedExceptions: false,
    citation: 'Del. Code Ann. tit. 25, § 2701 et seq.',
    notes:
      'Suit must commence within 1 year of lien filing. Statement of lien filed with Prothonotary.',
    lastVerified: '2026-01-01',
  },
  {
    state: 'District of Columbia',
    abbr: 'DC',
    preliminaryNoticeRequired: false,
    preliminaryNoticeDeadline: null,
    preliminaryNoticeWho: [],
    // Read against D.C. Code § 40-301.02 on 2026-08-26: "The notice of intent
    // shall be recorded during the construction or within 90 days after the
    // earlier of the completion or termination of the project."
    //
    // The note this replaces read "Advisory baseline: file promptly after last
    // furnishing; verify claimant-specific statutory timing before filing" —
    // which is not a deadline, and the citation beside it was a description of
    // where to look rather than a statute. The row was a placeholder wearing
    // the same shape as the fifty rows that were not.
    lienFilingDeadlineDays: 90,
    lienFilingDeadlineNote:
      'Ninety days after the earlier of completion or termination of the project; may be recorded during construction',
    lienForeClosureDeadlineDays: 365,
    noticeOfIntentRequired: false,
    noticeOfIntentDeadlineDays: null,
    claimantTypes: ['GC', 'Subcontractor', 'Supplier'],
    residentialOwnerOccupiedExceptions: false,
    citation: 'D.C. Code § 40-301.01 et seq. (filing deadline at § 40-301.02)',
    notes:
      'Public property is generally not lienable; verify notice and filing prerequisites against current District statute before action.',
    lastVerified: '2026-01-01',
  },
  {
    state: 'Florida',
    abbr: 'FL',
    preliminaryNoticeRequired: true,
    preliminaryNoticeDeadline: 'Before first furnishing or within 45 days of first furnishing',
    preliminaryNoticeWho: ['Subcontractor', 'Supplier', 'Equipment rental', 'Design professional'],
    lienFilingDeadlineDays: 90,
    lienFilingDeadlineNote: '90 days from last furnishing of labor or materials on the project',
    lienForeClosureDeadlineDays: 365,
    noticeOfIntentRequired: true,
    noticeOfIntentDeadlineDays: null,
    claimantTypes: ['GC', 'Subcontractor', 'Supplier', 'Equipment', 'Design professional'],
    residentialOwnerOccupiedExceptions: false,
    citation: 'Fla. Stat. § 713.001 et seq.',
    notes:
      'Notice to Owner (NTO) required for all lienors except direct contractors. NTO must be served before first furnishing or within 45 days. Claim of lien must be filed within 90 days of last furnishing. Foreclose within 1 year of recording.',
    lastVerified: '2026-01-01',
  },
  {
    state: 'Georgia',
    abbr: 'GA',
    preliminaryNoticeRequired: true,
    preliminaryNoticeDeadline: 'Within 30 days of first furnishing',
    preliminaryNoticeWho: ['Subcontractor', 'Supplier'],
    lienFilingDeadlineDays: 90,
    lienFilingDeadlineNote: 'Within 90 days of completion of the contract or last work performed',
    lienForeClosureDeadlineDays: 365,
    noticeOfIntentRequired: true,
    noticeOfIntentDeadlineDays: 30,
    claimantTypes: ['GC', 'Subcontractor', 'Supplier', 'Equipment'],
    residentialOwnerOccupiedExceptions: false,
    citation: 'O.C.G.A. § 44-14-360 et seq.',
    notes:
      'Preliminary notice (Notice to Contractor) required for subs within 30 days of first furnishing. Claim of lien must be filed within 90 days of completion. Must commence foreclosure within 365 days of lien filing.',
    lastVerified: '2026-01-01',
  },
  {
    state: 'Hawaii',
    abbr: 'HI',
    preliminaryNoticeRequired: true,
    preliminaryNoticeDeadline: 'Before or within 10 days of first furnishing',
    preliminaryNoticeWho: ['Subcontractor', 'Supplier'],
    lienFilingDeadlineDays: 45,
    lienFilingDeadlineNote: '45 days from completion or abandonment of the improvement',
    lienForeClosureDeadlineDays: 365,
    noticeOfIntentRequired: false,
    noticeOfIntentDeadlineDays: null,
    claimantTypes: ['GC', 'Subcontractor', 'Supplier'],
    residentialOwnerOccupiedExceptions: false,
    citation: 'Haw. Rev. Stat. § 507-41 et seq.',
    notes:
      'Notice of lien rights required within 10 days for subcontractors. Claim of lien filed within 45 days. Must commence suit within 1 year of last furnishing.',
    lastVerified: '2026-01-01',
  },
  {
    state: 'Idaho',
    abbr: 'ID',
    preliminaryNoticeRequired: true,
    preliminaryNoticeDeadline: 'Within 5 days of first furnishing for some claimants',
    preliminaryNoticeWho: ['Subcontractor', 'Supplier'],
    lienFilingDeadlineDays: 90,
    lienFilingDeadlineNote: '90 days from completion or cessation of labor',
    lienForeClosureDeadlineDays: 180,
    noticeOfIntentRequired: false,
    noticeOfIntentDeadlineDays: null,
    claimantTypes: ['GC', 'Subcontractor', 'Supplier', 'Equipment'],
    residentialOwnerOccupiedExceptions: false,
    citation: 'Idaho Code § 45-501 et seq.',
    notes:
      'Claim of lien filed within 90 days of completion. Suit must be commenced within 6 months of filing. Residential property: notice to owner required.',
    lastVerified: '2026-01-01',
  },
  {
    state: 'Illinois',
    abbr: 'IL',
    preliminaryNoticeRequired: false,
    preliminaryNoticeDeadline: null,
    preliminaryNoticeWho: [],
    // Read against 770 ILCS 60/7 on 2026-08-26: "within 4 months after
    // completion". Four calendar months, not 120 days, and the period runs
    // from COMPLETION rather than the last date of furnishing.
    lienFilingDeadlineDays: null,
    lienFilingDeadlineMonths: 4,
    lienFilingDeadlineNote:
      'Four months after completion, or four months after completion of any extra or additional work',
    lienForeClosureDeadlineDays: 730,
    noticeOfIntentRequired: false,
    noticeOfIntentDeadlineDays: null,
    claimantTypes: ['GC', 'Subcontractor', 'Supplier', 'Architect/Engineer'],
    residentialOwnerOccupiedExceptions: false,
    citation: '770 ILCS 60/1 et seq. (Illinois Mechanics Lien Act)',
    notes:
      'Subcontractors must send 90-day notice to owner to preserve lien rights. Two-year foreclosure period. Owner-occupied residential under $10,000 exempt.',
    lastVerified: '2026-01-01',
  },
  {
    state: 'Indiana',
    abbr: 'IN',
    preliminaryNoticeRequired: true,
    preliminaryNoticeDeadline:
      'Within 60 days of first furnishing for subs/suppliers to give notice to owner',
    preliminaryNoticeWho: ['Subcontractor', 'Supplier'],
    lienFilingDeadlineDays: 90,
    lienFilingDeadlineNote: '90 days from completion of work or last furnishing',
    lienForeClosureDeadlineDays: 365,
    noticeOfIntentRequired: false,
    noticeOfIntentDeadlineDays: null,
    claimantTypes: ['GC', 'Subcontractor', 'Supplier', 'Equipment'],
    residentialOwnerOccupiedExceptions: false,
    citation: 'Ind. Code § 32-28-3-1 et seq.',
    notes:
      'Prior notice not required to file lien but sub-contractors must notify owner within 60 days of first furnishing to preserve rights against owner. Lien statement filed within 90 days of last work.',
    lastVerified: '2026-01-01',
  },
  {
    state: 'Iowa',
    abbr: 'IA',
    preliminaryNoticeRequired: true,
    preliminaryNoticeDeadline: 'Within 30 days of first furnishing',
    preliminaryNoticeWho: ['Subcontractor', 'Supplier'],
    lienFilingDeadlineDays: 90,
    lienFilingDeadlineNote: '90 days from last date of furnishing labor or materials',
    lienForeClosureDeadlineDays: 730,
    noticeOfIntentRequired: false,
    noticeOfIntentDeadlineDays: null,
    claimantTypes: ['GC', 'Subcontractor', 'Supplier'],
    residentialOwnerOccupiedExceptions: false,
    citation: 'Iowa Code § 572.1 et seq.',
    notes:
      'Subcontractors must serve preliminary notice on owner within 30 days of first furnishing. Lien statement filed within 90 days. Foreclosure within 2 years.',
    lastVerified: '2026-01-01',
  },
  {
    state: 'Kansas',
    abbr: 'KS',
    preliminaryNoticeRequired: true,
    preliminaryNoticeDeadline: 'Within 3 months of first furnishing for suppliers',
    preliminaryNoticeWho: ['Supplier'],
    // Read against K.S.A. § 60-1102 on 2026-08-26: "within four months after
    // the date material, equipment or supplies, used or consumed was last
    // furnished or last labor performed under the contract." Four calendar
    // months, not 120 days — the two differ by up to three days depending on
    // which months the job spans.
    lienFilingDeadlineDays: null,
    lienFilingDeadlineMonths: 4,
    lienFilingDeadlineNote:
      'Four months after material was last furnished or labor last performed under the contract',
    lienForeClosureDeadlineDays: 365,
    noticeOfIntentRequired: false,
    noticeOfIntentDeadlineDays: null,
    claimantTypes: ['GC', 'Subcontractor', 'Supplier', 'Equipment'],
    residentialOwnerOccupiedExceptions: false,
    citation: 'Kan. Stat. Ann. § 60-1101 et seq.',
    notes:
      'Material suppliers must give notice of furnishing within 3 months. Lien statement filed within 4 months of completion. Foreclosure within 1 year of lien filing.',
    lastVerified: '2026-01-01',
  },
  {
    state: 'Kentucky',
    abbr: 'KY',
    preliminaryNoticeRequired: false,
    preliminaryNoticeDeadline: null,
    preliminaryNoticeWho: [],
    // Read against KRS 376.080(1) and 376.090(1) on 2026-08-26.
    //
    // Two things were wrong. Six calendar months was stored as 180 days, which
    // is the fifth state found doing that. And the enforcement period was
    // recorded as null — meaning the calculator reported NO deadline to sue at
    // all. KRS 376.090(1) dissolves the lien unless an action is brought
    // "within twelve (12) months from the day of filing the statement".
    //
    // A null there is worse than a wrong number. A wrong number is something to
    // check; an absent one reads as "this state has no limit", which is the
    // sort of thing nobody goes looking to disprove.
    //
    // Recorded here as a correction to an earlier verification pass in this
    // repository, which took the null at face value and wrote that the source
    // states no foreclosure period. Nobody had opened KRS 376.090.
    lienFilingDeadlineDays: null,
    lienFilingDeadlineMonths: 6,
    lienFilingDeadlineNote:
      'Six months after the claimant ceases to labor or furnish materials',
    lienForeClosureDeadlineDays: 365,
    noticeOfIntentRequired: false,
    noticeOfIntentDeadlineDays: null,
    claimantTypes: ['GC', 'Subcontractor', 'Supplier', 'Equipment'],
    residentialOwnerOccupiedExceptions: false,
    citation: 'Ky. Rev. Stat. § 376.010 et seq.',
    notes:
      'No preliminary notice required. Statement of lien must be filed within 6 months. Foreclosure suit must be filed within 1 year of the debt becoming due.',
    lastVerified: '2026-01-01',
  },
  {
    state: 'Louisiana',
    abbr: 'LA',
    preliminaryNoticeRequired: true,
    preliminaryNoticeDeadline:
      'Notice of contract must be filed within 30 days of contract execution',
    preliminaryNoticeWho: ['GC', 'Subcontractor', 'Supplier'],
    lienFilingDeadlineDays: 60,
    lienFilingDeadlineNote:
      '60 days from filing of Notice of Termination of Work or substantial completion',
    lienForeClosureDeadlineDays: 365,
    noticeOfIntentRequired: false,
    noticeOfIntentDeadlineDays: null,
    claimantTypes: ['GC', 'Subcontractor', 'Supplier', 'Equipment'],
    residentialOwnerOccupiedExceptions: true,
    citation: 'La. Rev. Stat. § 9:4801 et seq. (Louisiana Private Works Act)',
    notes:
      'Owner must file Notice of Termination to trigger 60-day period; without this, claimants have up to 1 year from last work. Statement of claim filed in mortgage records.',
    lastVerified: '2026-01-01',
  },
  {
    state: 'Maine',
    abbr: 'ME',
    preliminaryNoticeRequired: false,
    preliminaryNoticeDeadline: null,
    preliminaryNoticeWho: [],
    lienFilingDeadlineDays: 90,
    lienFilingDeadlineNote: '90 days from last furnishing of labor or materials',
    lienForeClosureDeadlineDays: 365,
    noticeOfIntentRequired: false,
    noticeOfIntentDeadlineDays: null,
    claimantTypes: ['GC', 'Subcontractor', 'Supplier'],
    residentialOwnerOccupiedExceptions: false,
    citation: 'Me. Rev. Stat. tit. 10, § 3251 et seq.',
    notes:
      'No preliminary notice required. Attested statement of lien must be filed within 90 days. Foreclose within 1 year of last furnishing.',
    lastVerified: '2026-01-01',
  },
  {
    state: 'Maryland',
    abbr: 'MD',
    preliminaryNoticeRequired: true,
    preliminaryNoticeDeadline: 'Within 120 days of first furnishing for subcontractors',
    preliminaryNoticeWho: ['Subcontractor', 'Supplier'],
    lienFilingDeadlineDays: 180,
    lienFilingDeadlineNote: 'Within 180 days of last day of furnishing labor or materials',
    lienForeClosureDeadlineDays: 365,
    noticeOfIntentRequired: false,
    noticeOfIntentDeadlineDays: null,
    claimantTypes: ['GC', 'Subcontractor', 'Supplier', 'Equipment'],
    residentialOwnerOccupiedExceptions: false,
    citation: 'Md. Code Ann., Real Prop. § 9-101 et seq.',
    notes:
      'Preliminary notice required from subcontractors and material suppliers within 120 days of first furnishing. Petition for mechanics lien filed in circuit court within 180 days.',
    lastVerified: '2026-01-01',
  },
  {
    state: 'Massachusetts',
    abbr: 'MA',
    preliminaryNoticeRequired: true,
    preliminaryNoticeDeadline:
      'Within 30 days of first furnishing for subcontractors and suppliers',
    preliminaryNoticeWho: ['Subcontractor', 'Supplier'],
    lienFilingDeadlineDays: 90,
    lienFilingDeadlineNote: '90 days from last date of furnishing labor or materials',
    lienForeClosureDeadlineDays: 90,
    noticeOfIntentRequired: false,
    noticeOfIntentDeadlineDays: null,
    claimantTypes: ['GC', 'Subcontractor', 'Supplier', 'Design professional'],
    residentialOwnerOccupiedExceptions: false,
    citation: 'M.G.L. c. 254, § 1 et seq.',
    notes:
      'Subcontractors must give notice to owner within 30 days of first furnishing to preserve lien rights. Statement of lien recorded within 90 days. Commence enforcement within 90 days of recording.',
    lastVerified: '2026-01-01',
  },
  {
    state: 'Michigan',
    abbr: 'MI',
    preliminaryNoticeRequired: true,
    preliminaryNoticeDeadline: 'Within 20 days of first furnishing',
    preliminaryNoticeWho: ['Subcontractor', 'Supplier', 'Equipment rental'],
    lienFilingDeadlineDays: 90,
    lienFilingDeadlineNote: '90 days from last day of furnishing labor or materials',
    lienForeClosureDeadlineDays: 365,
    noticeOfIntentRequired: false,
    noticeOfIntentDeadlineDays: null,
    claimantTypes: ['GC', 'Subcontractor', 'Supplier', 'Equipment', 'Design professional'],
    residentialOwnerOccupiedExceptions: false,
    citation: 'MCL § 570.1101 et seq. (Construction Lien Act)',
    notes:
      'Notice of furnishing required within 20 days for subcontractors and suppliers to preserve lien rights. Claim of lien recorded within 90 days. Residential lien fund available for homeowners.',
    lastVerified: '2026-01-01',
  },
  {
    state: 'Minnesota',
    abbr: 'MN',
    preliminaryNoticeRequired: true,
    preliminaryNoticeDeadline: 'Within 45 days of first furnishing',
    preliminaryNoticeWho: ['Subcontractor', 'Supplier'],
    lienFilingDeadlineDays: 120,
    lienFilingDeadlineNote: '120 days from last furnishing of labor or materials',
    lienForeClosureDeadlineDays: 365,
    noticeOfIntentRequired: false,
    noticeOfIntentDeadlineDays: null,
    claimantTypes: ['GC', 'Subcontractor', 'Supplier', 'Equipment'],
    residentialOwnerOccupiedExceptions: false,
    citation: 'Minn. Stat. § 514.01 et seq.',
    notes:
      'Pre-lien notice required within 45 days of first furnishing for subcontractors. Lien statement filed within 120 days. Foreclosure commenced within 1 year.',
    lastVerified: '2026-01-01',
  },
  {
    state: 'Mississippi',
    abbr: 'MS',
    preliminaryNoticeRequired: false,
    preliminaryNoticeDeadline: null,
    preliminaryNoticeWho: [],
    lienFilingDeadlineDays: 365,
    lienFilingDeadlineNote: '1 year from last furnishing of labor or materials',
    lienForeClosureDeadlineDays: 365,
    noticeOfIntentRequired: false,
    noticeOfIntentDeadlineDays: null,
    claimantTypes: ['GC', 'Subcontractor', 'Supplier', 'Equipment'],
    residentialOwnerOccupiedExceptions: true,
    citation: 'Miss. Code Ann. § 85-7-131 et seq.',
    notes:
      'Mississippi has a relatively long 1-year filing period. No preliminary notice required. Enforcement suit within 1 year of lien filing. Residential homestead exemptions apply.',
    lastVerified: '2026-01-01',
  },
  {
    state: 'Missouri',
    abbr: 'MO',
    preliminaryNoticeRequired: true,
    preliminaryNoticeDeadline: 'Within 10 days of first delivery for suppliers to owners',
    preliminaryNoticeWho: ['Supplier'],
    // Read against Mo. Rev. Stat. § 429.080 on 2026-08-26: "within six months
    // after the indebtedness shall have accrued". Six calendar months, not 180
    // days — and the period runs from when the debt accrued, which is not the
    // same event as last furnishing. Recorded as the statute states it.
    lienFilingDeadlineDays: null,
    lienFilingDeadlineMonths: 6,
    // The clock starts when the debt accrued, which is not last furnishing and
    // is not a date a caller supplies. Named as its own anchor so the
    // calculator reports it as unresolved rather than quietly substituting the
    // last day on site and presenting the result as the statute's answer.
    lienFilingDeadlineAnchor: 'indebtedness_accrued',
    lienFilingDeadlineNote:
      'Six months after the indebtedness accrued (60 days for rental equipment, from its last removal)',
    lienForeClosureDeadlineDays: 365,
    noticeOfIntentRequired: false,
    noticeOfIntentDeadlineDays: null,
    claimantTypes: ['GC', 'Subcontractor', 'Supplier', 'Equipment'],
    residentialOwnerOccupiedExceptions: false,
    citation: 'Mo. Rev. Stat. § 429.010 et seq.',
    notes:
      'Material suppliers must give written notice to owner within 10 days of first delivery. Just and true account filed within 6 months. Suit commenced within 1 year.',
    lastVerified: '2026-01-01',
  },
  {
    state: 'Montana',
    abbr: 'MT',
    preliminaryNoticeRequired: true,
    preliminaryNoticeDeadline: 'Within 20 days of first furnishing',
    preliminaryNoticeWho: ['Subcontractor', 'Supplier'],
    lienFilingDeadlineDays: 90,
    lienFilingDeadlineNote: '90 days from last furnishing of labor or materials',
    lienForeClosureDeadlineDays: 730,
    noticeOfIntentRequired: false,
    noticeOfIntentDeadlineDays: null,
    claimantTypes: ['GC', 'Subcontractor', 'Supplier', 'Equipment'],
    residentialOwnerOccupiedExceptions: false,
    citation: 'Mont. Code Ann. § 71-3-521 et seq.',
    notes:
      'Notice of right to lien must be served on owner within 20 days of first furnishing. Claim filed within 90 days. Suit commenced within 2 years.',
    lastVerified: '2026-01-01',
  },
  {
    state: 'Nebraska',
    abbr: 'NE',
    preliminaryNoticeRequired: true,
    preliminaryNoticeDeadline: 'Within 10 days of first furnishing for suppliers',
    preliminaryNoticeWho: ['Supplier'],
    lienFilingDeadlineDays: 120,
    lienFilingDeadlineNote: '120 days from last furnishing of labor or materials',
    lienForeClosureDeadlineDays: 730,
    noticeOfIntentRequired: false,
    noticeOfIntentDeadlineDays: null,
    claimantTypes: ['GC', 'Subcontractor', 'Supplier', 'Equipment'],
    residentialOwnerOccupiedExceptions: false,
    citation: 'Neb. Rev. Stat. § 52-125 et seq.',
    notes:
      'Material suppliers must give notice within 10 days. Lien filed within 120 days. Foreclosure within 2 years.',
    lastVerified: '2026-01-01',
  },
  {
    state: 'Nevada',
    abbr: 'NV',
    preliminaryNoticeRequired: true,
    preliminaryNoticeDeadline: 'Within 31 days of first furnishing',
    preliminaryNoticeWho: ['Subcontractor', 'Supplier', 'Equipment rental'],
    lienFilingDeadlineDays: 90,
    // Read against NRS 108.226 on 2026-08-26. Ninety days was right but
    // incomplete: a notice of completion recorded and served under NRS 108.228
    // cuts the window to forty days, and the row said nothing about it.
    lienFilingDeadlineNote:
      'Ninety days after the latest of completion of the work of improvement, the claimant\u2019s ' +
      'last delivery of material, or the claimant\u2019s last performance of work; or forty days ' +
      'after a notice of completion is recorded and served under NRS 108.228',
    lienFilingShortenedBy: {
      trigger: 'a notice of completion is recorded and served under NRS 108.228',
      days: 40,
      note: 'Runs from the recording of the notice and replaces the 90-day period.',
    },
    lienForeClosureDeadlineDays: 180,
    noticeOfIntentRequired: false,
    noticeOfIntentDeadlineDays: null,
    claimantTypes: ['GC', 'Subcontractor', 'Supplier', 'Equipment'],
    residentialOwnerOccupiedExceptions: false,
    citation: 'NRS § 108.221 et seq.',
    notes:
      'Preliminary notice (Notice of Right to Lien) required within 31 days of first furnishing for subs/suppliers. Notice of lien must be filed within 90 days. Suit within 6 months.',
    lastVerified: '2026-01-01',
  },
  {
    state: 'New Hampshire',
    abbr: 'NH',
    preliminaryNoticeRequired: false,
    preliminaryNoticeDeadline: null,
    preliminaryNoticeWho: [],
    lienFilingDeadlineDays: 120,
    lienFilingDeadlineNote: '120 days (4 months) from last furnishing of labor or materials',
    lienForeClosureDeadlineDays: 365,
    noticeOfIntentRequired: false,
    noticeOfIntentDeadlineDays: null,
    claimantTypes: ['GC', 'Subcontractor', 'Supplier', 'Equipment'],
    residentialOwnerOccupiedExceptions: false,
    citation: 'RSA 447:1 et seq.',
    notes:
      'No preliminary notice required. Claim must be filed within 120 days. Suit within 1 year.',
    lastVerified: '2026-01-01',
  },
  {
    state: 'New Jersey',
    abbr: 'NJ',
    preliminaryNoticeRequired: false,
    preliminaryNoticeDeadline: null,
    preliminaryNoticeWho: [],
    lienFilingDeadlineDays: 90,
    lienFilingDeadlineNote: '90 days from last date of providing labor or materials',
    lienForeClosureDeadlineDays: 365,
    noticeOfIntentRequired: false,
    noticeOfIntentDeadlineDays: null,
    claimantTypes: ['GC', 'Subcontractor', 'Supplier', 'Equipment', 'Design professional'],
    residentialOwnerOccupiedExceptions: false,
    citation: 'N.J. Stat. Ann. § 2A:44A-1 et seq. (New Jersey Construction Lien Law)',
    notes:
      'No preliminary notice required. Lien claim filed within 90 days of last furnishing. Copy served on owner within 30 days of filing. Suit within 1 year of filing.',
    lastVerified: '2026-01-01',
  },
  {
    state: 'New Mexico',
    abbr: 'NM',
    preliminaryNoticeRequired: true,
    preliminaryNoticeDeadline: 'Within 60 days of first furnishing',
    preliminaryNoticeWho: ['Subcontractor', 'Supplier'],
    lienFilingDeadlineDays: 120,
    lienFilingDeadlineNote:
      '120 days from the date that substantial completion occurs or work is abandoned',
    lienForeClosureDeadlineDays: 730,
    noticeOfIntentRequired: false,
    noticeOfIntentDeadlineDays: null,
    claimantTypes: ['GC', 'Subcontractor', 'Supplier', 'Equipment'],
    residentialOwnerOccupiedExceptions: false,
    citation: 'N.M. Stat. Ann. § 48-2-1 et seq.',
    notes:
      'Notice of right to lien required from subcontractors within 60 days. Claim of lien filed within 120 days. Suit within 2 years.',
    lastVerified: '2026-01-01',
  },
  {
    state: 'New York',
    abbr: 'NY',
    preliminaryNoticeRequired: false,
    preliminaryNoticeDeadline: null,
    preliminaryNoticeWho: [],
    // Read against N.Y. Lien Law § 10 on 2026-08-26. Eight calendar months,
    // not 240 days — and a single family dwelling gets four months, which the
    // row did not mention at all.
    lienFilingDeadlineDays: null,
    lienFilingDeadlineMonths: 8,
    lienFilingDeadlineNote:
      'Eight months after completion of the contract or final performance of the work, dating ' +
      'from the last item of work performed or materials furnished; four months for a single ' +
      'family dwelling. Public projects run 30 days from the final payment date.',
    lienFilingByProjectType: { singleFamilyDwellingMonths: 4, otherMonths: 8 },
    lienForeClosureDeadlineDays: 365,
    noticeOfIntentRequired: false,
    noticeOfIntentDeadlineDays: null,
    claimantTypes: ['GC', 'Subcontractor', 'Supplier', 'Equipment', 'Design professional'],
    residentialOwnerOccupiedExceptions: false,
    citation: 'NY Lien Law § 3 et seq.',
    notes:
      "Notice of lien filed with county clerk within 8 months on private projects. Must be verified. Foreclose or extend within 1 year of filing. Public works use Mechanic's Lien Law Art. 2.",
    lastVerified: '2026-01-01',
  },
  {
    state: 'North Carolina',
    abbr: 'NC',
    preliminaryNoticeRequired: true,
    preliminaryNoticeDeadline: 'Within 15 days of first furnishing for subs/suppliers',
    preliminaryNoticeWho: ['Subcontractor', 'Supplier'],
    lienFilingDeadlineDays: 120,
    lienFilingDeadlineNote: '120 days from last furnishing of labor or materials',
    lienForeClosureDeadlineDays: 180,
    noticeOfIntentRequired: true,
    noticeOfIntentDeadlineDays: null,
    claimantTypes: ['GC', 'Subcontractor', 'Supplier', 'Equipment', 'Design professional'],
    residentialOwnerOccupiedExceptions: false,
    citation: 'N.C. Gen. Stat. § 44A-7 et seq.',
    notes:
      'Notice to lien agent required for projects over $30,000. Subs must serve notice within 15 days of first furnishing. Claim of lien on real property filed within 120 days. Commence action within 180 days of filing.',
    lastVerified: '2026-01-01',
  },
  {
    state: 'North Dakota',
    abbr: 'ND',
    preliminaryNoticeRequired: false,
    preliminaryNoticeDeadline: null,
    preliminaryNoticeWho: [],
    lienFilingDeadlineDays: 90,
    lienFilingDeadlineNote: '90 days from last furnishing of labor or materials',
    lienForeClosureDeadlineDays: 1095,
    noticeOfIntentRequired: false,
    noticeOfIntentDeadlineDays: null,
    claimantTypes: ['GC', 'Subcontractor', 'Supplier', 'Equipment'],
    residentialOwnerOccupiedExceptions: false,
    citation: 'N.D. Cent. Code § 35-27-01 et seq.',
    notes:
      'No preliminary notice required. Verified statement of lien filed within 90 days. Suit within 3 years of filing.',
    lastVerified: '2026-01-01',
  },
  {
    state: 'Ohio',
    abbr: 'OH',
    preliminaryNoticeRequired: true,
    preliminaryNoticeDeadline: 'Within 21 days of first furnishing for subcontractors',
    preliminaryNoticeWho: ['Subcontractor', 'Supplier'],
    lienFilingDeadlineDays: 75,
    lienFilingDeadlineNote:
      "75 days from last furnishing of labor or materials; 60 days from original contractor's last work",
    lienForeClosureDeadlineDays: 730,
    noticeOfIntentRequired: false,
    noticeOfIntentDeadlineDays: null,
    claimantTypes: ['GC', 'Subcontractor', 'Supplier', 'Equipment', 'Design professional'],
    residentialOwnerOccupiedExceptions: false,
    citation: 'Ohio Rev. Code § 1311.01 et seq.',
    notes:
      'Subcontractors must serve Notice of Furnishing within 21 days of first furnishing. Affidavit of mechanics lien filed within 75 days. Suit within 6 years of filing.',
    lastVerified: '2026-01-01',
  },
  {
    state: 'Oklahoma',
    abbr: 'OK',
    preliminaryNoticeRequired: true,
    preliminaryNoticeDeadline: 'Within 75 days of first furnishing',
    preliminaryNoticeWho: ['Subcontractor', 'Supplier'],
    lienFilingDeadlineDays: 90,
    lienFilingDeadlineNote: '90 days from completion of work or last furnishing',
    lienForeClosureDeadlineDays: 365,
    noticeOfIntentRequired: false,
    noticeOfIntentDeadlineDays: null,
    claimantTypes: ['GC', 'Subcontractor', 'Supplier', 'Equipment'],
    residentialOwnerOccupiedExceptions: true,
    citation: 'Okla. Stat. Ann. tit. 42, § 141 et seq.',
    notes:
      'Written notice to owner by subs required within 75 days of first furnishing. Claim filed within 90 days of last work. Suit within 1 year.',
    lastVerified: '2026-01-01',
  },
  {
    state: 'Oregon',
    abbr: 'OR',
    preliminaryNoticeRequired: true,
    preliminaryNoticeDeadline: 'Within 8 days of first furnishing',
    preliminaryNoticeWho: ['Subcontractor', 'Supplier', 'Equipment rental'],
    lienFilingDeadlineDays: 75,
    lienFilingDeadlineNote:
      '75 days from completion of construction for subcontractors; 120 days for original contractors',
    lienForeClosureDeadlineDays: 120,
    noticeOfIntentRequired: false,
    noticeOfIntentDeadlineDays: null,
    claimantTypes: ['GC', 'Subcontractor', 'Supplier', 'Equipment', 'Design professional'],
    residentialOwnerOccupiedExceptions: false,
    citation: 'ORS § 87.001 et seq.',
    notes:
      'Notice of right to lien must be served on owner within 8 days of first furnishing for subs/suppliers. Claim of lien filed within 75 days (subs) or 120 days (GC). Enforcement within 120 days of filing.',
    lastVerified: '2026-01-01',
  },
  {
    state: 'Pennsylvania',
    abbr: 'PA',
    preliminaryNoticeRequired: true,
    preliminaryNoticeDeadline: 'Within 30 days of first furnishing for subs',
    preliminaryNoticeWho: ['Subcontractor', 'Supplier'],
    lienFilingDeadlineDays: 180,
    lienFilingDeadlineNote: '6 months from last furnishing of labor or materials',
    lienForeClosureDeadlineDays: 730,
    noticeOfIntentRequired: false,
    noticeOfIntentDeadlineDays: null,
    claimantTypes: ['GC', 'Subcontractor', 'Supplier', 'Equipment', 'Design professional'],
    residentialOwnerOccupiedExceptions: false,
    citation: "49 Pa. Stat. Ann. § 1101 et seq. (Pennsylvania Mechanics' Lien Law)",
    notes:
      'Subcontractors must file a preliminary notice with the prothonotary within 30 days of first furnishing. Claim of lien filed within 6 months. Suit within 2 years.',
    lastVerified: '2026-01-01',
  },
  {
    state: 'Rhode Island',
    abbr: 'RI',
    preliminaryNoticeRequired: false,
    preliminaryNoticeDeadline: null,
    preliminaryNoticeWho: [],
    lienFilingDeadlineDays: 200,
    lienFilingDeadlineNote:
      '200 days from last furnishing of labor or materials; if completion posted, 100 days from posting',
    lienForeClosureDeadlineDays: 365,
    noticeOfIntentRequired: false,
    noticeOfIntentDeadlineDays: null,
    claimantTypes: ['GC', 'Subcontractor', 'Supplier', 'Equipment'],
    residentialOwnerOccupiedExceptions: false,
    citation: 'R.I. Gen. Laws § 34-28-1 et seq.',
    notes:
      'No preliminary notice required. Notice of intention to claim lien filed within 200 days. Suit within 1 year of filing.',
    lastVerified: '2026-01-01',
  },
  {
    state: 'South Carolina',
    abbr: 'SC',
    preliminaryNoticeRequired: true,
    preliminaryNoticeDeadline: 'Within 30 days of first furnishing for subs',
    preliminaryNoticeWho: ['Subcontractor', 'Supplier'],
    lienFilingDeadlineDays: 90,
    lienFilingDeadlineNote: '90 days from last furnishing of labor or materials',
    // Read against S.C. Code § 29-5-90 and § 29-5-120 on 2026-08-26.
    //
    // Filing was right. Enforcement was not, and it was wrong in the dangerous
    // direction. § 29-5-120(A): the lien "must be dissolved" unless suit is
    // commenced within SIX MONTHS after the claimant "ceases to labor" — six
    // months from the work, not a year from the filing. This row said 365 days
    // from filing, which lands roughly fifteen months after work ends and
    // would have reported nine months of time that does not exist.
    lienForeClosureDeadlineDays: 180,
    lienForeClosureFrom: 'last_furnishing',
    noticeOfIntentRequired: false,
    noticeOfIntentDeadlineDays: null,
    claimantTypes: ['GC', 'Subcontractor', 'Supplier', 'Equipment'],
    residentialOwnerOccupiedExceptions: false,
    citation: 'S.C. Code Ann. § 29-5-10 et seq.',
    notes:
      "Subcontractors must serve notice within 30 days of first furnishing. Mechanic's lien filed within 90 days. Enforcement within 1 year.",
    lastVerified: '2026-01-01',
  },
  {
    state: 'South Dakota',
    abbr: 'SD',
    preliminaryNoticeRequired: false,
    preliminaryNoticeDeadline: null,
    preliminaryNoticeWho: [],
    lienFilingDeadlineDays: 120,
    lienFilingDeadlineNote: '120 days from last furnishing of labor or materials',
    lienForeClosureDeadlineDays: 2190,
    noticeOfIntentRequired: false,
    noticeOfIntentDeadlineDays: null,
    claimantTypes: ['GC', 'Subcontractor', 'Supplier', 'Equipment'],
    residentialOwnerOccupiedExceptions: false,
    citation: 'S.D. Codified Laws § 44-9-1 et seq.',
    notes:
      'No preliminary notice required. Statement of lien filed within 120 days. Suit within 6 years.',
    lastVerified: '2026-01-01',
  },
  {
    state: 'Tennessee',
    abbr: 'TN',
    preliminaryNoticeRequired: true,
    preliminaryNoticeDeadline:
      'Within 90 days of first furnishing (remote contractors notice to prime)',
    preliminaryNoticeWho: ['Subcontractor', 'Supplier'],
    lienFilingDeadlineDays: 90,
    lienFilingDeadlineNote: '90 days from last furnishing of labor or materials',
    lienForeClosureDeadlineDays: 365,
    noticeOfIntentRequired: true,
    noticeOfIntentDeadlineDays: 10,
    claimantTypes: ['GC', 'Subcontractor', 'Supplier', 'Equipment', 'Design professional'],
    residentialOwnerOccupiedExceptions: false,
    citation: 'Tenn. Code Ann. § 66-11-101 et seq.',
    notes:
      'Notice of nonpayment required from remote contractors. Lien notice filed within 90 days. 10-day notice of intent to lien required. Suit within 1 year.',
    lastVerified: '2026-01-01',
  },
  {
    state: 'Texas',
    abbr: 'TX',
    preliminaryNoticeRequired: true,
    preliminaryNoticeDeadline: 'Monthly notice by 15th of 2nd month following furnishing',
    preliminaryNoticeWho: ['Subcontractor', 'Supplier'],
    lienFilingDeadlineDays: 15,
    lienFilingDeadlineNote:
      'Affidavit filed by 15th day of 4th calendar month after day work completed (residential: 3rd month); constitutional lien attaches automatically',
    lienForeClosureDeadlineDays: 730,
    noticeOfIntentRequired: true,
    noticeOfIntentDeadlineDays: null,
    claimantTypes: ['GC', 'Subcontractor', 'Supplier', 'Equipment', 'Design professional'],
    residentialOwnerOccupiedExceptions: true,
    citation: 'Tex. Prop. Code Ch. 53',
    notes:
      'Texas has dual lien system: constitutional (auto-attaches) and statutory. Statutory lien requires monthly notices by 15th of 2nd month following furnishing for each unpaid month. Residential projects have different rules under Ch. 53. Deadline calculated from last work month. Highly technical - errors forfeit rights.',
    lastVerified: '2026-01-01',
  },
  {
    state: 'Utah',
    abbr: 'UT',
    preliminaryNoticeRequired: true,
    preliminaryNoticeDeadline: 'Within 20 days of first furnishing',
    preliminaryNoticeWho: ['Subcontractor', 'Supplier', 'Equipment rental'],
    // Read against Utah Code § 38-1a-502(1) on 2026-08-26. The row had the
    // EXCEPTION recorded as the rule. The statute:
    //
    //   (i)  180 days after final completion of the original contract, if no
    //        notice of completion is filed under § 38-1a-507; or
    //   (ii) 90 days after a notice of completion is filed, but not later than
    //        180 days after final completion.
    //
    // Ninety days is what a claimant gets only once the owner files a notice.
    // With no notice filed the period is twice that, and the row was telling
    // every Utah job it had half the time it has.
    lienFilingDeadlineDays: 180,
    lienFilingShortenedBy: {
      trigger: 'a notice of completion is filed under Utah Code § 38-1a-507',
      days: 90,
      note:
        'Runs from the filing of the notice, and in no case extends beyond 180 days after final ' +
        'completion of the original contract.',
    },
    lienFilingDeadlineNote:
      'One hundred eighty days after final completion of the original contract where no notice of ' +
      'completion is filed; ninety days after a notice of completion is filed, and never later ' +
      'than 180 days after final completion',
    lienForeClosureDeadlineDays: 365,
    noticeOfIntentRequired: false,
    noticeOfIntentDeadlineDays: null,
    claimantTypes: ['GC', 'Subcontractor', 'Supplier', 'Equipment', 'Design professional'],
    residentialOwnerOccupiedExceptions: false,
    citation: 'Utah Code Ann. § 38-1a-101 et seq.',
    notes:
      'Preliminary notice required within 20 days of first furnishing for all lienors except direct contractors. Lien filed within 90 days of completion. Suit within 12 months.',
    lastVerified: '2026-01-01',
  },
  {
    state: 'Vermont',
    abbr: 'VT',
    preliminaryNoticeRequired: false,
    preliminaryNoticeDeadline: null,
    preliminaryNoticeWho: [],
    lienFilingDeadlineDays: 180,
    lienFilingDeadlineNote: '180 days from last furnishing of labor or materials',
    lienForeClosureDeadlineDays: 365,
    noticeOfIntentRequired: false,
    noticeOfIntentDeadlineDays: null,
    claimantTypes: ['GC', 'Subcontractor', 'Supplier'],
    residentialOwnerOccupiedExceptions: false,
    citation: '9 V.S.A. § 1921 et seq.',
    notes:
      'No preliminary notice required. Statement of lien recorded within 180 days. Suit within 1 year.',
    lastVerified: '2026-01-01',
  },
  {
    state: 'Virginia',
    abbr: 'VA',
    preliminaryNoticeRequired: true,
    preliminaryNoticeDeadline: 'Within 150 days of last furnishing',
    preliminaryNoticeWho: ['Subcontractor', 'Supplier'],
    lienFilingDeadlineDays: 90,
    // Read against Va. Code § 43-4 on 2026-08-26 — see citationVerification.js.
    // This note said "90 days from last furnishing", which is wrong twice. The
    // 90 days runs from the last day of the MONTH in which work ended, not the
    // day it ended; and there is a second, independent cap at 90 days from
    // completion, whichever expires first.
    lienFilingDeadlineNote:
      '90 days from the last day of the month in which labor or materials were last furnished, ' +
      'and in no event later than 90 days from completion — whichever comes first',
    lienFilingDeadlineAnchor: 'month_end_of_last_furnishing',
    lienFilingAlsoCappedBy: { days: 90, from: 'completion' },
    lienForeClosureDeadlineDays: 180,
    noticeOfIntentRequired: false,
    noticeOfIntentDeadlineDays: null,
    claimantTypes: ['GC', 'Subcontractor', 'Supplier', 'Equipment', 'Design professional'],
    residentialOwnerOccupiedExceptions: false,
    citation: 'Va. Code Ann. § 43-1 et seq.',
    notes:
      "Subcontractors must give notice to owner of intent to file lien within 150 days of last furnishing. Memorandum of mechanic's lien filed within 90 days. Action to enforce within 6 months.",
    lastVerified: '2026-01-01',
  },
  {
    state: 'Washington',
    abbr: 'WA',
    preliminaryNoticeRequired: true,
    preliminaryNoticeDeadline: 'Within 60 days of first furnishing',
    preliminaryNoticeWho: ['Subcontractor', 'Supplier', 'Equipment rental'],
    lienFilingDeadlineDays: 90,
    lienFilingDeadlineNote: '90 days from last furnishing of labor or materials',
    lienForeClosureDeadlineDays: 240,
    noticeOfIntentRequired: false,
    noticeOfIntentDeadlineDays: null,
    claimantTypes: ['GC', 'Subcontractor', 'Supplier', 'Equipment', 'Design professional'],
    residentialOwnerOccupiedExceptions: false,
    citation: 'RCW § 60.04.011 et seq.',
    notes:
      'Notice to owner/prime required within 60 days of first furnishing for subs/suppliers. Claim of lien filed within 90 days. Suit within 8 months.',
    lastVerified: '2026-01-01',
  },
  {
    state: 'West Virginia',
    abbr: 'WV',
    preliminaryNoticeRequired: false,
    preliminaryNoticeDeadline: null,
    preliminaryNoticeWho: [],
    lienFilingDeadlineDays: 100,
    // Read against W. Va. Code § 38-2-8 on 2026-08-26: "within one hundred days
    // after the completion of his work provided for in such contract". The
    // count was right, the anchor was not — completion of the contract work,
    // not the last day materials happened to be furnished.
    lienFilingDeadlineNote:
      'One hundred days after completion of the work provided for in the contract',
    lienForeClosureDeadlineDays: 365,
    noticeOfIntentRequired: false,
    noticeOfIntentDeadlineDays: null,
    claimantTypes: ['GC', 'Subcontractor', 'Supplier', 'Equipment'],
    residentialOwnerOccupiedExceptions: false,
    citation: 'W. Va. Code § 38-2-1 et seq.',
    notes:
      'No preliminary notice required. Verified notice of lien filed within 100 days. Suit within 1 year.',
    lastVerified: '2026-01-01',
  },
  {
    state: 'Wisconsin',
    abbr: 'WI',
    preliminaryNoticeRequired: true,
    preliminaryNoticeDeadline: 'Within 60 days of first furnishing for subs/suppliers',
    preliminaryNoticeWho: ['Subcontractor', 'Supplier'],
    // Read against Wis. Stat. § 779.06(1) on 2026-08-26: "within 6 months from
    // the date the lien claimant performed, furnished, or procured the last
    // labor, services, materials, plans, or specifications". Six calendar
    // months, not 180 days.
    lienFilingDeadlineDays: null,
    lienFilingDeadlineMonths: 6,
    lienFilingDeadlineNote:
      'Six months from the date the claimant last performed, furnished or procured labor, ' +
      'services, materials, plans or specifications',
    lienForeClosureDeadlineDays: 730,
    noticeOfIntentRequired: false,
    noticeOfIntentDeadlineDays: null,
    claimantTypes: ['GC', 'Subcontractor', 'Supplier', 'Equipment'],
    residentialOwnerOccupiedExceptions: false,
    citation: 'Wis. Stat. § 779.01 et seq.',
    notes:
      'Subcontractors and suppliers must serve owner/prime with notice within 60 days of first furnishing. Claim for lien filed within 6 months. Suit within 2 years.',
    lastVerified: '2026-01-01',
  },
  {
    state: 'Wyoming',
    abbr: 'WY',
    preliminaryNoticeRequired: false,
    preliminaryNoticeDeadline: null,
    preliminaryNoticeWho: [],
    lienFilingDeadlineDays: 150,
    lienFilingDeadlineNote: '150 days from last furnishing of labor or materials',
    lienForeClosureDeadlineDays: 180,
    noticeOfIntentRequired: false,
    noticeOfIntentDeadlineDays: null,
    claimantTypes: ['GC', 'Subcontractor', 'Supplier', 'Equipment'],
    residentialOwnerOccupiedExceptions: false,
    citation: 'Wyo. Stat. Ann. § 29-1-101 et seq.',
    notes:
      'No preliminary notice required. Lien filed within 150 days. Suit within 180 days of lien filing.',
    lastVerified: '2026-01-01',
  },
]
