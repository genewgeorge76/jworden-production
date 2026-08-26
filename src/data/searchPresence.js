/**
 * searchPresence.js — what Google actually measured, recovered from the inbox.
 *
 * WHY THIS FILE EXISTS
 * ────────────────────
 * The question was "is any of this enough to rank?" and until now the honest
 * answer was a shrug dressed up as analysis: the sites are indexable, the
 * sitemaps resolve, nothing is blocked, therefore ranking is *possible*.
 * Possible is not a measurement.
 *
 * It turns out a measurement existed the whole time. Google emailed monthly
 * Business Profile performance reports through late 2019, and those emails
 * name the exact queries this company appeared for and how many people used
 * them. That is first-party data from the only party whose opinion counts, and
 * it was sitting unread in the archive alongside everything else.
 *
 * It changes the question. Not "can this business rank?" — it did, on the
 * money terms, and the profile produced quote requests. The question is what
 * stopped, and what has to be switched back on.
 *
 * THIS IS OPERATOR INTELLIGENCE AND NOT PAGE CONTENT
 * ─────────────────────────────────────────────────
 * Nothing here belongs on a website. Query volumes are not a credential,
 * review complaints are not marketing copy, and a competitor reading our
 * measured impressions is a gift to them. Page code must not import this file;
 * a test enforces that, the same way it does for publicRecordsWithheld.js.
 *
 * SOURCE FOR EVERY FIGURE
 * ───────────────────────
 * Google Business Profile performance emails from googlemybusiness-noreply,
 * review notifications from the same sender, and Search Console messages from
 * sc-noreply, all read out of the archive on 2026-08-26. Where a number is
 * Google's own, it is quoted as Google stated it.
 */

/** The monthly performance reports, as Google sent them. */
export const GBP_QUERY_PERFORMANCE = [
  {
    month: '2019-09',
    profile: 'J Worden & Sons Paving LLC',
    topQueries: [
      { query: 'asphalt driveway', people: 12 },
      { query: 'asphalt paving richmond va', people: 11 },
    ],
  },
  {
    month: '2019-10',
    profile: 'J Worden & Sons Paving LLC',
    topQueries: [
      { query: 'patio pavers', people: 14 },
      { query: 'paving companies', people: 14 },
      { query: 'asphalt driveway', people: null },
    ],
  },
  {
    // The best month on record.
    month: '2019-11',
    profile: 'J Worden & Sons Paving LLC',
    topQueries: [
      { query: 'asphalt paving richmond va', people: 19 },
      { query: 'paving companies', people: 14 },
    ],
  },
  {
    month: '2019-12',
    profile: 'J Worden & Sons Paving LLC',
    topQueries: [
      { query: 'asphalt companies', people: 12 },
      { query: 'asphalt driveway', people: 12 },
    ],
  },
  {
    month: '2020-01',
    profile: 'J Worden & Sons Paving LLC',
    topQueries: [
      { query: 'asphalt companies near me', people: null, note: 'Google reported "less than 10 people"' },
      { query: 'asphalt company near me', people: null },
    ],
  },
]

/**
 * WHY THESE QUERIES MATTER MORE THAN THE NUMBERS ATTACHED TO THEM
 *
 * Nineteen people is not traffic. But "asphalt paving richmond va" and
 * "asphalt companies near me" are not vanity terms — they are what somebody
 * types immediately before spending money, and appearing for them at all is
 * the hard part. Volume follows position; position on the wrong query never
 * turns into work.
 *
 * Note also what is absent. Every recovered query is RESIDENTIAL and LOCAL:
 * driveways, "near me", Richmond. Not one is commercial or multi-site. That is
 * the same split the customer archive shows — Virginia sells volume,
 * everywhere else sells scale — arriving independently from Google's side.
 */
export const QUERY_CHARACTER = {
  allResidentialAndLocal: true,
  noCommercialQueriesRecorded: true,
  note:
    'Every query Google reported is residential and local. Commercial and multi-site intent never appears, which matches the customer archive rather than contradicting it.',
}

/** The profile was not merely visible. It produced work. */
export const GBP_CONVERSION = {
  quoteRequestsThroughProfile: [
    { date: '2019-11-29', via: 'Business Profile quote request' },
    { date: '2020-01-30', via: 'Business Profile quote request' },
  ],
  photoPerformance: {
    month: '2019-12',
    photos: 29,
    views: 649,
    note: 'Google reported 649 views across 29 photos in one month, with a single photo at 70 views.',
  },
}

/**
 * REVIEWS ARE THE REAL CONSTRAINT, AND THEY ARE NOT A RANKING PROBLEM
 * ──────────────────────────────────────────────────────────────────
 * Five five-star reviews arrived between 12 and 29 November 2019. Two one-star
 * reviews followed on 6 December 2019 and 23 January 2020.
 *
 * In the local pack that ratio does more damage than any technical fault on
 * the site, because it is what a person reads before choosing. And unlike
 * rankings it cannot be fixed by publishing pages — only by asking satisfied
 * customers to say so.
 *
 * Reviewer names are deliberately absent. The reviews are public on Google and
 * naming an unhappy customer in a repository serves nothing; the substance of
 * the complaint is the part worth keeping, because it is operational.
 */
export const GBP_REVIEWS_2019_2020 = {
  fiveStar: { count: 5, from: '2019-11-12', to: '2019-11-29' },
  oneStar: { count: 2, dates: ['2019-12-06', '2020-01-23'] },
  complaintSubstance: [
    'Scheduling and communication — lateness, and a job taking longer than promised.',
    'Base material — the aggregate used under a residential driveway described as too coarse.',
  ],
  whyItMatters:
    'Two one-star reviews against five five-star ones is heavy drag in the local pack, which is where residential work is won. This is the highest-leverage thing on the list and it is a phone call, not a page.',
  actionable:
    '920 customers in the Kickserv archive have a completed job on file. That is the review-request list.',
}

/**
 * WHAT STOPPED, AND WHEN
 * ──────────────────────
 * The last performance email is February 2020. Then nothing — and in February
 * 2022 Google sent "Verify your Business Profile on Google", which is what
 * they send when a profile has lapsed out of verified status.
 *
 * The dates line up with the pandemic and with the owner's account of the
 * business getting smaller. Recorded as a sequence, not a diagnosis: an unread
 * inbox cannot say whether the profile was abandoned, suspended, or simply
 * stopped being fed.
 */
export const GBP_TIMELINE = [
  { date: '2019-09', event: 'Monthly performance reports running, residential queries measured.' },
  { date: '2019-11-29', event: 'Five five-star reviews inside eighteen days; a quote request the same day.' },
  { date: '2019-12-06', event: 'First one-star review.' },
  { date: '2020-01-23', event: 'Second one-star review.' },
  { date: '2020-01-30', event: 'Last recorded quote request through the profile.' },
  { date: '2020-02-13', event: 'Last monthly performance report in the archive.' },
  { date: '2020-08-21', event: 'Verification PIN requested for a second profile, "Chip-Tar Paving".' },
  { date: '2022-02-14', event: '"Verify your Business Profile on Google" — the prompt sent when a profile is unverified.' },
  { date: '2025-02-25', event: 'Policy reminder — the most recent Business Profile contact in the archive.' },
]

/**
 * MORE THAN ONE PROFILE EXISTS, WHICH IS ITS OWN PROBLEM
 * ─────────────────────────────────────────────────────
 * Three distinct business names appear in Google's own emails to this address.
 * Multiple profiles for one operation split the local signal between them and
 * can draw a duplicate-listing suspension. Which of these are live, merged or
 * abandoned cannot be told from the inbox.
 */
export const GBP_PROFILES_SEEN = [
  { name: 'J Worden & Sons Paving LLC', evidence: 'Monthly performance reports and review notifications, 2019–2020.' },
  { name: 'Chip-Tar Paving', evidence: 'Verification PIN requested 2020-08-21.' },
  { name: 'Chip & Tar Paving', evidence: 'Addressed by name in Business Profile emails, 2022.' },
]

/**
 * A SEARCH CONSOLE PROPERTY NOBODY WAS WATCHING
 * ─────────────────────────────────────────────
 * atlantaasphaltpavingpros.com has been verified in Search Console since
 * 5 July 2024, in both its www and non-www forms — and Google has twice
 * emailed that pages on it cannot be indexed.
 *
 * Two things make this worth acting on before anything else in this file.
 *
 * First, it is already collecting. Search Console does not backfill, so a
 * property verified two years ago holds two years of query and coverage data
 * that no other property here has.
 *
 * Second, the domain does not appear in docs/DOMAINS_INVENTORY.md and is not
 * one of the four live sites audited on 2026-08-26. It is a property of this
 * business that the repository did not know existed.
 */
export const SEARCH_CONSOLE_PROPERTIES = [
  {
    property: 'atlantaasphaltpavingpros.com',
    alsoVerified: 'https://www.atlantaasphaltpavingpros.com/',
    verified: '2024-07-05',
    inDomainsInventory: false,
    auditedAsLiveSite: false,
    messages: [
      { date: '2024-07-05', type: 'Get started using Search Console', note: 'Verification confirmed.' },
      { date: '2024-07-07', type: 'Monitor the Google Search traffic', note: 'Google confirmed detection on 2024-07-05.' },
      { date: '2024-07-07', type: 'New reasons prevent pages from being indexed', code: 'WNC-20237597' },
      { date: '2024-11-13', type: 'New reasons prevent pages from being indexed', code: 'WNC-20237597', note: 'Sent for both www and non-www forms.' },
    ],
    whyItMatters:
      'An already-verified property holding two years of data, reporting an unresolved indexing fault, on a domain absent from the repository’s own inventory.',
    resolvedBy:
      'Open the Pages report in Search Console for this property and read the exclusion reason behind WNC-20237597. Then reconcile the domain against docs/DOMAINS_INVENTORY.md.',
  },
]

/**
 * THE HONEST SUMMARY, FOR WHOEVER ASKS THE RANKING QUESTION NEXT
 * ─────────────────────────────────────────────────────────────
 * This business ranked for the queries that produce residential paving work,
 * and the profile that did it converted them into quote requests. That is
 * settled by Google's own reporting and needs no further argument.
 *
 * What is unsettled is everything since February 2020. Nothing in the archive
 * measures the present.
 */
export const SUMMARY = {
  rankedPreviously: true,
  rankedFor: 'Residential, local: asphalt driveway, paving companies, asphalt paving richmond va, asphalt companies near me.',
  convertedPreviously: true,
  measurementEndsAt: '2020-02-13',
  presentPerformanceUnknown: true,
  presentPerformanceNote:
    'No measurement of current performance exists in this archive. Search Console for atlantaasphaltpavingpros.com is the only live source already collecting, and it has not been read.',
  blockersInOrder: [
    'The flagship jwordenasphaltpaving.com resolves to Sedo parking, so nothing on that name can rank.',
    'Business Profile verification state is unknown and three separate profile names appear.',
    'Two one-star reviews against five five-star ones, unaddressed since January 2020.',
    'atlantaasphaltpavingpros.com has an unresolved indexing fault Google has reported twice.',
  ],
  sourcesRead: '2026-08-26, from googlemybusiness-noreply, businessprofile-noreply and sc-noreply messages in the archive.',
}
