import assert from 'node:assert/strict'
import { test } from 'node:test'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Three fabricated datasets were being served from public/ — reachable at
 * https://<any domain>/<filename>.json and returning 200 on the live sites.
 *
 *   kfc_projects_database.json            6 invented KFC jobs, with
 *                                         completion_year values of 2023 and
 *                                         2024, which is not even when the KBP
 *                                         programme ran, plus SEO keyword
 *                                         arrays
 *   national_brands_database.json        12 invented locations including a Des
 *                                         Moines KFC, while four REAL Iowa
 *                                         stores sit in the client's tracker
 *   commercial_retail_paving_database    6 named third-party brands — Wendy's,
 *                                         Hobby Lobby, Firestone, Tractor
 *                                         Supply, Arby's — at specific street
 *                                         addresses
 *
 * trackRecord.js already recorded that a fourth,
 * kfc_individual_stores_database.json, had been deleted after being served on
 * every domain. These three survived that clean-up because nothing in the code
 * imports them: they are orphaned static files, invisible to a grep for usage
 * and perfectly visible to anyone who requests the URL.
 *
 * The last one is the worst of the three. Inventing your own jobs is a claim
 * about yourself. Naming Wendy's and Hobby Lobby and Firestone at real
 * addresses is a claim about somebody else's property.
 */
const BANNED = [
  'kfc_projects_database.json',
  'national_brands_database.json',
  'commercial_retail_paving_database.json',
  'kfc_individual_stores_database.json',
]

test('no fabricated dataset is served from public/', () => {
  for (const name of BANNED) {
    assert.equal(existsSync(join('public', name)), false, `public/${name} is being served again`)
  }
})

/**
 * The tells, so a NEW fabrication is caught rather than only the four known
 * ones. Every served JSON array of records is checked: uniformly round square
 * footages and SEO keyword arrays are what invented portfolios look like.
 */
test('no served JSON has the shape of an invented portfolio', () => {
  for (const file of readdirSync('public').filter((f) => f.endsWith('.json'))) {
    let data
    try {
      data = JSON.parse(readFileSync(join('public', file), 'utf8'))
    } catch {
      continue
    }
    if (!Array.isArray(data) || data.length < 3) continue
    if (!data.every((x) => x && typeof x === 'object')) continue

    const sqfts = data.map((x) => x.sqft).filter((n) => typeof n === 'number')
    const allRound = sqfts.length === data.length && sqfts.every((n) => n % 100 === 0)
    assert.equal(allRound, false, `public/${file}: every sqft is round, which real measurements are not`)
    assert.equal(
      data.some((x) => Array.isArray(x.keywords)),
      false,
      `public/${file}: carries SEO keyword arrays, which a job record has no reason to have`,
    )
  }
})
