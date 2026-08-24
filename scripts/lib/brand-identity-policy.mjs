/**
 * brand-identity-policy.mjs — how a brand site states who it is.
 *
 * WHY THIS IS A POLICY AND NOT A COPY EDIT
 * ────────────────────────────────────────
 * The site factory builds a site per client. Whatever rule governs how J.
 * Worden presents an out-of-market brand will be applied, unattended, to every
 * customer of the SaaS. Get it wrong in one direction and clients look like
 * they are hiding something; get it wrong in the other and the factory becomes
 * a machine for manufacturing fake local businesses — with the client's name on
 * the penalty and ours on the tool. So the rule lives here, in one file, tested,
 * rather than in seven hand-written paragraphs that drifted.
 *
 * THE DISTINCTION THAT MATTERS
 * ────────────────────────────
 * Three different things get confused with each other:
 *
 *   DECEPTION      Claiming a presence that does not exist — an invented
 *                  address, "our Dallas office", a Business Profile pin on a
 *                  mailbox. Never acceptable. It is also a documented Google
 *                  spam-policy violation, so it is not even effective.
 *
 *   DISCLOSURE     Stating accurately who the legal entity is, somewhere a
 *                  reader can find it. Required.
 *
 *   SELF-HARM      Volunteering an absence nobody asked about, in the position
 *                  of greatest emphasis. Honest, and pure cost.
 *
 * Only the first is dishonest. The third is what all six out-of-market brands
 * were doing, and Google's AI Overview priced it: reading texaspavementgroup.com
 * it concluded the company "may not accept small, standard suburban driveway
 * overlays", listed "Scale Mismatch" as a con, and recommended two competitors
 * by name. Every site opened by saying what it was not.
 *
 * THE RULE
 * ────────
 *   1. LEAD WITH THE MARKET AND THE PROOF. The page is about the customer's
 *      problem and the work done on problems like it.
 *   2. STATE THE ENTITY ONCE, ACCURATELY, WHERE IT IS FINDABLE. Footer or
 *      About. Not hidden, not shouted, never contradicted elsewhere.
 *   3. NEVER CLAIM A PRESENCE YOU DO NOT HAVE. No invented address, no local
 *      branch, no "separate company" that is one LLC wearing two names.
 *   4. DO NOT VOLUNTEER ABSENCES. Omission is not deception.
 *
 * THE CARVE-OUT IN RULE 4, WHICH IS THE WHOLE POINT
 * ─────────────────────────────────────────────────
 * An absence that MATERIALLY AFFECTS THE CUSTOMER'S DECISION must still be
 * stated. The test is whether a reasonable customer would feel misled on
 * discovering it after signing.
 *
 *   "We do not keep a Dallas yard"        -> not material. The work was done,
 *                                            invoiced, and can be checked by
 *                                            store number. Where the trucks
 *                                            sleep changes nothing.
 *
 *   "We have no completed OBX projects"   -> MATERIAL. A customer choosing a
 *                                            contractor with zero local track
 *                                            record is entitled to know that
 *                                            before they choose.
 *
 * So obxpaving.com keeps its disclosure and the other five lose theirs. That is
 * not inconsistency; it is the rule doing its job.
 */

/**
 * Constructions that volunteer an absence. Matched against travelNote.
 *
 * Each of these was live on a real page. They are listed as patterns rather
 * than a vague instruction because a validator that cannot be run is a comment,
 * and comments drift.
 */
const SELF_HARM_PATTERNS = [
  { re: /\bwe do not keep\b/i, note: 'volunteers a missing yard/office' },
  { re: /\bwe do not run\b/i, note: 'volunteers a missing storefront' },
  { re: /\bthere is no \w+ (?:office|yard|branch|shop)\b/i, note: 'volunteers a missing office' },
  { re: /\bno local branch\b/i, note: 'volunteers a missing branch' },
  { re: /\bwe are not a local\b/i, note: 'opens by denying local status' },
  { re: /\bwould rather say so than pretend\b/i, note: 'apologises for its own honesty' },
  { re: /\bwe will say so before you ask\b/i, note: 'pre-empts an objection nobody raised' },
]

/**
 * Absences that are MATERIAL and therefore allowed — indeed required — even
 * though they read as negatives. Checked before SELF_HARM_PATTERNS.
 */
const MATERIAL_DISCLOSURES = [
  { re: /\bno completed .* projects?\b/i, note: 'no local track record — material' },
  { re: /\bfirst .* project\b/i, note: 'first job in the market — material' },
  { re: /\bnot licensed\b/i, note: 'licensing gap — material' },
]

/** A travelNote should not open by naming the home state. Lead with the market. */
const BURIED_LEDE = /^\s*we are a [A-Z][a-z]+ contractor\b/i

export function checkTravelNote(domain, travelNote) {
  const problems = []
  const text = String(travelNote || '')
  if (!text.trim()) return problems

  if (MATERIAL_DISCLOSURES.some((m) => m.re.test(text))) return problems

  if (BURIED_LEDE.test(text)) {
    problems.push({
      domain,
      rule: 1,
      detail: 'opens with the home state instead of the market and the proof',
    })
  }
  for (const { re, note } of SELF_HARM_PATTERNS) {
    if (re.test(text)) problems.push({ domain, rule: 4, detail: note })
  }
  return problems
}

/**
 * Rule 2: the legal entity must be stated. The builder always writes
 * "a brand of J. Worden & Sons Paving LLC" into the footer, so this checks that
 * a profile has not tried to contradict it by claiming separate incorporation.
 */
const FALSE_SEPARATION = /\b(?:a separate company|independently owned|not affiliated)\b/i

export function checkEntityClaims(domain, profile) {
  const problems = []
  const haystack = [profile.basedIn, profile.travelNote, profile.heroBody].filter(Boolean).join(' ')
  if (FALSE_SEPARATION.test(haystack)) {
    problems.push({
      domain,
      rule: 3,
      detail: 'claims separate incorporation; every brand here is one LLC under two names',
    })
  }
  return problems
}

export function auditProfiles(profiles) {
  const problems = []
  for (const [domain, profile] of Object.entries(profiles || {})) {
    problems.push(...checkTravelNote(domain, profile.travelNote))
    problems.push(...checkEntityClaims(domain, profile))
  }
  return problems
}

export const POLICY = { SELF_HARM_PATTERNS, MATERIAL_DISCLOSURES, BURIED_LEDE }
