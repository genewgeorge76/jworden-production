/**
 * programScope.js — what the owner says the KBP programme covered, set against
 * what the documents actually carry.
 *
 * WHY BOTH NUMBERS BELONG IN ONE FILE
 * ───────────────────────────────────
 * stateEvidence.js grades each state by what a document supports, and that
 * grading stands. But it was never meant to be read as a measure of how much
 * work happened — only of how much of it can be shown. Where those two are
 * far apart, the record quietly understates the company, and nobody looking at
 * the grades alone can see by how much.
 *
 * This file makes the distance visible and countable. The left column is the
 * owner's account of scope. The right is what the archive holds. Neither is
 * adjusted to fit the other, and the owner's column is never publishable.
 *
 * THE POINT IS NOT TO SETTLE THE GAP BUT TO AIM AT IT
 * ──────────────────────────────────────────────────
 * A vague sense of "we did more than that" cannot be acted on. A specific gap
 * can: Michigan is 2 documented against a market the archive itself says ran
 * to 31 stores, and Iowa is graded `surveyed` — the grade meaning a state
 * appears only on a bid list — against an owner who says four were built.
 *
 * Iowa is the cheapest win in the whole record. `surveyed` is the floor, and
 * ONE photograph or ONE invoice moves that state two full grades.
 *
 * TEXAS IS THE TEMPLATE, AND IT EXPLAINS EVERY OTHER ROW
 * ─────────────────────────────────────────────────────
 * Texas is not the best-documented state because more work happened there. It
 * is the best-documented state because a CLIENT'S tracker survived, and 23
 * sites across 19 cities reconcile to the cent against it — $670,039.00.
 *
 * Every thin row below is thin for the opposite reason: no equivalent document
 * was recovered. That is an archival accident, not a record of a quiet market,
 * and it is the single strongest argument for asking KBP directly. They hold
 * the tracker for every market, the way Project Red's survived for Texas.
 */

/** Owner-stated scope. Never publishable, and never merged into a grade. */
export const SCOPE_CLAIMS = [
  {
    market: 'Kansas City',
    states: ['KS', 'MO'],
    claim: 'every store',
    documented: '1 store in Kansas (Overland Park, invoiced $8,777.50) and 13 in the Missouri Midwest market',
    note:
      'The market straddles the state line, so it is split across two rows in stateEvidence.js and reads smaller in each. It is also KBP’s home market — their headquarters is in Overland Park. A franchisee handing a contractor every store in the market its own executives drive past is a statement about trust that no single invoice conveys.',
    basis: 'owner-stated',
  },
  {
    market: 'Iowa',
    states: ['IA'],
    claim: '4 stores',
    documented: '3 stores, and only on the 2015 bid survey',
    note:
      'Iowa is graded `surveyed`, which is the floor — it means the state appears on the list of stores this company was asked to BID and nothing else. 246 of that survey’s 262 rows read "Not Started". The owner says four were built. One photograph or one invoice moves Iowa from the bottom grade to the top, and no other state is one document from that far a jump.',
    basis: 'owner-stated',
    cheapestWin: true,
  },
  {
    market: 'Florida',
    states: ['FL'],
    claim: 'a lot of KFCs',
    documented: '2 KBP sites with executed contracts — Ft Pierce and Port St. Lucie — plus Coral Springs in permitting',
    note:
      'Florida is graded `pipeline` because nothing in hand shows a finished job, and stateEvidence.js records that it is one completion document away from `work`. The owner also lived and worked in the state for years, which is why 39 Florida customer records sit in the Kickserv export across Tampa Bay and the Treasure Coast. See ownedProperties.js — the mid-Florida Google profile holds photographs and two customer reviews, and those may be the missing document.',
    basis: 'owner-stated',
  },
  {
    market: 'Overland Park — the 3-in-1',
    states: ['KS'],
    claim: 'the full remodel: all the concrete and all the asphalt paving',
    documented: 'one invoice, $8,777.50, 7100 W 119th Street (G135020), reported November 2018 as "all work is completed"',
    note:
      'A 3-in-1 is a multibrand unit — KFC, Taco Bell and Pizza Hut in one building. Three brands share a kitchen, a drive-through and a lot, which makes the sitework larger and the sequencing harder than any single-brand store. Taking all the concrete AND all the asphalt on a remodel of one is the largest single scope the owner has described anywhere in this programme.\n\nAnd $8,777.50 does not buy it. That figure is almost certainly one line of a much bigger job rather than the job itself, which means the documented Kansas total understates this site specifically — not only the market around it. Worth checking against the full invoice run before any Kansas figure is quoted.',
    basis: 'owner-stated',
    documentedFigureLikelyPartial: true,
  },
  {
    market: 'Detroit',
    states: ['MI'],
    claim: 'every KFC KBP owned',
    documented: '2 sites with photographs — W Seven Mile Road and Michigan Avenue, Dearborn',
    note:
      'The archive already states the denominator: KBP’s Detroit market ran to 31 stores. So this is not a vague shortfall — the record names the number it is 29 short of, and it named it before the owner said anything.',
    basis: 'owner-stated',
  },
]

/**
 * The one market where the gap is closed, and why. Kept here rather than in
 * stateEvidence.js because its value is as a template for the rows above.
 */
export const RECONCILED_TEMPLATE = {
  market: 'Texas',
  documented: '23 invoiced sites across 19 cities, $670,039.00',
  reconciledAgainst: 'the client’s own Project Red invoice tracker',
  toTheCent: true,
  lesson:
    'A client tracker turned an owner’s account into a reconciled figure. The same document exists for every other KBP market; it simply was not recovered. Asking KBP for a vendor work history is the move that turns the rows above into rows like this one.',
}

/** Nothing in this file may be published. It is scope, not evidence. */
export const PUBLISHABLE = false
