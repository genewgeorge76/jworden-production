/**
 * businessInfo.js — Single canonical source of truth for J. Worden & Sons NAP
 * SpaceX/Linear Foundation — ONE FILE. ONE TRUTH. No drift tolerated.
 * Verified address: 1601 Ware Bottom Spring Rd (NO trailing S)
 * Last verified: 2026-05-10
 */

export const SITE_URL = import.meta.env?.VITE_SITE_URL || 'https://www.jwordenasphaltpaving.com'

export const SCHEMA_IDS = {
  organization:  `${SITE_URL}/#organization`,
  localBusiness: `${SITE_URL}/#localbusiness`,
  website:       `${SITE_URL}/#website`,
  founder:       `${SITE_URL}/about#founder`,
}

export const BUSINESS_NAME         = 'J. Worden & Sons Paving LLC'
export const BUSINESS_LEGAL_NAME   = 'J. Worden & Sons Paving LLC'
export const BUSINESS_DESCRIPTION  =
  '4th-generation family asphalt paving contractor est. 1984. ' +
  'Paved 100+ KFC locations across Georgia and the Southeast. ' +
  'Pavement Magazine Top Contractor (Paving 75). ' +
  'Best of Houzz Service Award 2014, 2015, 2016, 2023. ' +
  'Virginia Class A Contractor. A+ BBB since 1994. ' +
  'Serving Virginia, Minnesota, the Carolinas, Georgia, and Florida.'
export const BUSINESS_FOUNDING_YEAR = '1984'

export const PHONE_E164    = '+18044461296'
export const PHONE_DISPLAY = '(804) 446-1296'
export const PHONE_SCHEMA  = '+1-804-446-1296'
export const SMS_E164      = '+18044461296'
export const SMS_PREFILL   = 'Hi, I saw your website and want a free quote.'
export const EMAIL         = 'j.wordenandsonspaving@gmail.com'

export const SOCIAL_PROFILES = {
  facebook:  'https://www.facebook.com/jwordenpaving',
  linkedin:  'https://www.linkedin.com/company/j-worden-sons-asphalt-paving-inc/',
  instagram: 'https://www.instagram.com/j.worden_paving/',
  houzz:     'https://www.houzz.com/professionals/paving-contractors/j-worden-sons-paving-pfvwus-pf~174057',
}

// VERIFIED: "Ware Bottom Spring Rd" — NO trailing S
export const ADDRESS = {
  streetAddress:   '1601 Ware Bottom Spring Rd, Suite 214',
  addressLocality: 'Chester',
  addressRegion:   'VA',
  postalCode:      '23836',
  addressCountry:  'US',
}

export const ADDRESS_DISPLAY = `${ADDRESS.streetAddress}, ${ADDRESS.addressLocality}, ${ADDRESS.addressRegion} ${ADDRESS.postalCode}`

export const GEO = { latitude: 37.3529, longitude: -77.4326 }

export const PRICE_RANGE = '$$$'

export const OPENING_HOURS = [
  { dayOfWeek: ['Monday','Tuesday','Wednesday','Thursday','Friday'], opens: '07:00', closes: '18:00' },
  { dayOfWeek: ['Saturday'], opens: '07:00', closes: '14:00' },
]
export const HOURS_DISPLAY     = 'Mon–Fri 7am–6pm · Sat 7am–2pm'
export const HOURS_DISPLAY_ALT = '24/7 Emergency Response Available'

export const AGGREGATE_RATING = {
  ratingValue: '4.9',
  bestRating:  '5',
  worstRating: '1',
  reviewCount: '87',
}

export const CREDENTIALS = {
  vaLicense:    'Virginia Class A Contractor',
  bbbRating:    'A+',
  bbbSince:     '1994',
  pavementAward:'Pavement Magazine Top 75 Contractor (2018)',
  houzzAwards:  ['Best of Houzz Service 2014','Best of Houzz Service 2015','Best of Houzz Service 2016','Best of Houzz Service 2023'],
}

export const SERVICES_OFFERED = [
  { name: 'Asphalt Paving' },
  { name: 'Commercial Paving' },
  { name: 'Parking Lot Paving' },
  { name: 'Driveway Paving' },
  { name: 'Asphalt Sealcoating' },
  { name: 'Asphalt Repair & Crack Filling' },
  { name: 'Tar and Chip Paving' },
  { name: 'Asphalt Milling' },
  { name: 'Pavement Maintenance' },
  { name: 'Industrial Paving' },
  { name: 'QSR / Restaurant Parking Lots' },
  { name: 'Brick Pavers & Natural Stone' },
  { name: 'Hardscape Design' },
  { name: 'Concrete Flatwork' },
]

export const SERVICE_AREAS = [
  { type: 'State', name: 'Virginia' },
  { type: 'City',  name: 'Richmond' },
  { type: 'City',  name: 'Chester' },
  { type: 'City',  name: 'Midlothian' },
  { type: 'City',  name: 'Chesterfield' },
  { type: 'City',  name: 'Henrico' },
  { type: 'City',  name: 'Glen Allen' },
  { type: 'City',  name: 'Short Pump' },
  { type: 'City',  name: 'Mechanicsville' },
  { type: 'City',  name: 'Petersburg' },
  { type: 'City',  name: 'Colonial Heights' },
  { type: 'City',  name: 'Hopewell' },
  { type: 'City',  name: 'Fredericksburg' },
  { type: 'City',  name: 'Williamsburg' },
  { type: 'City',  name: 'Virginia Beach' },
  { type: 'City',  name: 'Chesapeake' },
  { type: 'City',  name: 'Norfolk' },
  { type: 'City',  name: 'Charlottesville' },
  { type: 'City',  name: 'Lynchburg' },
  { type: 'City',  name: 'Roanoke' },
  { type: 'City',  name: 'Harrisonburg' },
  { type: 'State', name: 'Minnesota' },
  { type: 'City',  name: 'Minneapolis' },
  { type: 'City',  name: 'St. Paul' },
  { type: 'City',  name: 'Brainerd' },
  { type: 'City',  name: 'Bemidji' },
  { type: 'State', name: 'Georgia' },
  { type: 'City',  name: 'Atlanta' },
  { type: 'City',  name: 'Savannah' },
  { type: 'State', name: 'North Carolina' },
  { type: 'State', name: 'South Carolina' },
  { type: 'City',  name: 'Charlotte' },
  { type: 'City',  name: 'Raleigh' },
  { type: 'City',  name: 'Wilmington' },
  { type: 'City',  name: 'Myrtle Beach' },
  { type: 'State', name: 'Florida' },
  { type: 'City',  name: 'Orlando' },
]

export const FOUNDER = {
  name:            'Gene W. George',
  brandName:       'Mr. Worden',
  jobTitle:        'Owner-Operator & 4th-Generation Master Paver',
  description:     'Started in the trade as a teenager working alongside family, carrying on a paving legacy established in 1984. Has personally managed residential, commercial, QSR (100+ KFC locations across Georgia and the Southeast), REIT, and municipal paving projects across more than a dozen states. Virginia Class A Contractor. Pavement Magazine Top 75. Best of Houzz 4x.',
  yearsExperience: Math.max(0, new Date().getFullYear() - 1984),
  states:          ['VA','MN','NC','SC','GA','FL'],
}

export const QSR_HISTORY = {
  kfc: {
    count:       100,
    regions:     ['Atlanta Metro','Georgia Statewide','Southeast'],
    description: '100+ KFC parking lot paving and resurfacing projects under KBP Foods franchise program.',
  },
  brands:          ['KFC',"Arby's",'Taco Bell'],
  notableProject:  '2017 Marietta, GA Big Chicken parking lot — landmark KFC location.',
}
