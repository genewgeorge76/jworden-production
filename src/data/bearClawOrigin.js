/**
 * bearClawOrigin.js — where the restaurant work actually started.
 *
 * THE OWNER'S ACCOUNT, AND THE DOCUMENT THAT MATCHES IT
 * ────────────────────────────────────────────────────
 * Asked about Virginia, the owner said: "we also did all the kfcs in virginia
 * for bear claw contruction — they were the fistones." The first ones.
 *
 * That is checkable, and it checks out. The archive holds the whole sequence,
 * in order, in June 2013 — two years before the KBP programme documented
 * everywhere else in this repository, and sixteen months before the first
 * invoice in the Kickserv book (2014-10-08):
 *
 *   Jun 6   Bear Claw Construction Management LLC sends a vendor packet
 *   Jun 7   "I'm sending the vender package to you along with having my
 *            insurance info... I plan to start as soon as the other
 *            contractors are out of the way."
 *   Jun 10  "please see attached contract. review, sign and return"
 *            — subcontract 13-076, "J Worden & Sons paving subcontract.pdf"
 *   Jun 15  "K.F.C. Job on azalea ave. in Richmond va completed. I will send
 *            the contract for the next one on Monday"
 *
 * WHY THE LAST LINE IS THE STRONGEST ONE
 * ──────────────────────────────────────
 * It is in the SENT folder. The company wrote it, about its own work, at the
 * time, with no reason to be writing for the record. "Completed" is the
 * company's own word on the day, which is exactly what this system's evidence
 * ladder means by `completed` — and it names the street.
 *
 * "the contract for the next one" is the same evidence about a different
 * thing: it establishes that this was a programme rather than one job. It does
 * NOT establish how many followed, and no number is stated here. The owner's
 * account is "all the KFCs in Virginia"; the archive shows the first one
 * finished and a second contract coming. Those are different claims and they
 * are kept apart.
 *
 * WHY IT MATTERS BEYOND VIRGINIA
 * ──────────────────────────────
 * Bear Claw Construction Management LLC is at 100 E 7th St, Kansas City, MO.
 * KBP Foods is headquartered in Overland Park, in the same metro. The Kansas
 * City connection that produced eight years of KFC work across a dozen states
 * starts here, in 2013, on Azalea Avenue in Richmond.
 */

/** The general contractor. Named because it is a company, not a person. */
export const CLIENT = {
  name: 'Bear Claw Construction Management LLC',
  city: 'Kansas City',
  state: 'MO',
  role: 'General contractor / construction manager',
}

export const BRAND = 'KFC'

/**
 * The first restaurant, and the only one this file states as fact.
 *
 * No street number: the email says "azalea ave." and nothing more. Producing
 * one would file the job against an address the company never wrote down.
 */
export const FIRST_JOB = {
  brand: 'KFC',
  street: 'Azalea Avenue',
  city: 'Richmond',
  state: 'VA',
  completedOn: '2013-06-15',
  evidence: 'completed',
  source:
    'Company email, sent 2013-06-15: "K.F.C. Job on azalea ave. in Richmond va completed."',
}

/** The paperwork behind it, in the order it happened. */
export const ONBOARDING = [
  { date: '2013-06-06', event: 'Vendor application packet issued by the general contractor' },
  { date: '2013-06-07', event: 'Vendor package and certificate of insurance returned' },
  { date: '2013-06-10', event: 'Subcontract 13-076 issued for signature' },
  { date: '2013-06-15', event: 'First restaurant reported complete; next contract requested' },
]

/**
 * What may be said, and what may not.
 *
 * The distinction this repository runs on: a service-area or experience
 * statement rests on the owner's word, which is how every contractor's site
 * works. A count is checkable and needs records. "The first ones" is the
 * former; "all the KFCs in Virginia" is a claim the archive supports in kind
 * but not in number.
 */
export const PUBLISHABLE_LINE =
  'Restaurant work for this company began in June 2013, under subcontract to a Kansas City construction manager — starting with the KFC on Azalea Avenue in Richmond.'

export const NOT_PUBLISHABLE = [
  'Any count of Virginia KFC locations. The archive evidences one completed and a second contracted.',
  'Any dollar figure. Subcontract 13-076 is named in the correspondence; its value is not.',
]
