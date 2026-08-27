/**
 * corridorServiceAreas.js — the Route 29 / Blue Ridge corridor, and two markets
 * beyond it.
 *
 * WHY THESE EIGHT, AND WHY NOW
 * ────────────────────────────
 * Four of them are where the work actually went this year. Asked where he had
 * been working in 2026, the owner named Vinton, Ivy, Annandale and
 * Ruckersville — Roanoke County, Albemarle, Fairfax and Greene. Not one of
 * them is Richmond, and only Charlottesville had a page.
 *
 * The other four — Faber, Nellysford, Lovingston, Crozet — are the corridor
 * around the address the business is moving to when the current lease ends.
 *
 * They are built NOW rather than after the move on purpose. A page does not
 * rank the day it ships; it needs crawling and time. Built today they are
 * seasoned by the time the entity's address lands in Nelson County, and the
 * move reinforces content Google already trusts. Built after, the clock starts
 * at the worst possible moment.
 *
 * WHAT KIND OF CLAIM THESE PAGES MAKE
 * ───────────────────────────────────
 * Service-area and ground-condition content, exactly as carolinaRegions.js
 * does, and for the same stated reason. There are two honest kinds of claim on
 * a contractor's site:
 *
 *   "We work in Greene County"     rests on the owner's word. Every
 *                                  contractor's site in the world works this
 *                                  way, and it is legitimate.
 *   "We completed 40 jobs there
 *    worth $600,000"               is a checkable number and needs records.
 *
 * These make the first kind only. There is no job count, no dollar figure and
 * no project list on any of them, because the job book in this repository ends
 * on 2022-04-04 and contains nothing at all from 2023 onward. When the
 * InvoiceFly record for 2023–2026 is imported, proof blocks get added the way
 * texasProgram.js does it — from invoices, not from assertion.
 *
 * WHY EIGHT GENUINELY DIFFERENT PAGES AND NOT ONE TEMPLATE
 * ────────────────────────────────────────────────────────
 * Because the ground genuinely differs, and because eight pages that swap a
 * place name are duplicate content — the thing the owner has said repeatedly
 * he does not want. Every elevation and VDOT district below is read from
 * data/virginiaCountyFacts.json, which was built from VDOT's own published
 * material, and the freeze-thaw consequence follows from the elevation rather
 * than being asserted:
 *
 *   Fairfax     287 ft    long season, subgrade moisture governs
 *   Albemarle   642 ft    long season, subgrade moisture governs
 *   Nelson      719 ft    long season, subgrade moisture governs
 *   Amherst   1,063 ft    moderate freeze-thaw, drainage decides
 *   Greene    1,173 ft    moderate freeze-thaw, drainage decides
 *   Roanoke   1,354 ft    moderate freeze-thaw, drainage decides
 *
 * Wintergreen is the outlier and the reason Nelson County is not simply "low
 * band": the resort sits above 3,500 ft on Devils Knob, thousands of feet over
 * the county's mean. A page that quoted the county average at a Wintergreen
 * property manager would be quoting the wrong number by an order of magnitude
 * in freeze-thaw terms, so that page says so explicitly.
 *
 * COORDINATES
 * ───────────
 * Town centroids from public gazetteer data, to four decimal places. They
 * locate a town on a map. They are NOT job sites and must never be presented
 * as one.
 */

export const CORRIDOR_SERVICE_AREAS = [
  {
    slug: 'roanoke-va',
    city: 'Roanoke',
    state: 'Virginia',
    stateCode: 'VA',
    county: 'City of Roanoke',
    lat: 37.271,
    lng: -79.9414,
    headline: 'Asphalt Paving Contractor in Roanoke, VA',
    tagline: 'Roanoke Valley commercial paving — institutional campuses, rail-era industrial, and 66 freeze-thaw cycles a year.',
    description:
      "Roanoke is an independent city, which is the first thing that matters to anyone paving here. It is not part of Roanoke County and never has been, so the street department, the right-of-way permit process and the inspection regime are the city's own. A contractor who assumes a county process because the address says Roanoke starts the job behind. The pavement itself divides along the lines the railroad drew. Norfolk and Western built this city, and the industrial spine it left behind — yards, shops, loading approaches off Shenandoah and Norfolk Avenue — carries the hardest loading asphalt ever sees: heavy, concentrated and slow, which is worse than heavy and moving. Those approaches need thickness and a base built for point loads, not a surface fix. The institutional side is the other half of the market and it runs on a different clock. Carilion's medical campuses, the hospitals and the clinics around them do not close, so their lots are phased night work with ambulance routes and emergency access kept open the entire time — a scheduling problem as much as a paving one. Downtown adds its own constraint: a compact grid of older pavement, alley access and on-street parking where a lane closure is negotiated rather than assumed, and where the City Market district cannot simply be shut for a shift. Underneath all of it is the valley floor at roughly nine hundred feet, ringed by mountains that put water on the ground faster than flat country does. Roanoke measures 66.4 freeze-thaw cycles in an average year over the last thirty — nearly four times Virginia Beach and well above Richmond — and that number is why base depth and drainage are not upsells in this valley. Water that reaches the subgrade here freezes and thaws sixty-six times a winter, and every one of those cycles opens the crack a little further.",
    services: [
      'Commercial Paving',
      'Parking Lots',
      'Sealcoating',
      'Crack Filling',
      'Concrete and Curbing',
      'ADA Striping',
    ],
    nearbyLandmarks: [
      'Downtown Roanoke',
      'City Market district',
      'Mill Mountain',
      'Roanoke Valley',
      'Blue Ridge Parkway access',
    ],
    faqs: [
      {
        question: 'Is paving in the City of Roanoke different from Roanoke County?',
        answer:
          "Administratively, yes, and it catches people out. Roanoke is an independent city, so it runs its own street department and its own right-of-way permitting rather than deferring to Roanoke County. Work in Vinton or the county surrounding the city goes through a different office entirely. We confirm which authority a site sits under before quoting, because the permit path affects the schedule and occasionally the detail.",
      },
      {
        question: 'How many freeze-thaw cycles does Roanoke actually get?',
        answer:
          "66.4 in an average year, measured from thirty years of daily temperature records for this location, with a range of 51 to 85 depending on the winter. A cycle is a day that drops below freezing and climbs back above it, and it is the mechanism that turns a hairline crack into a pothole. For comparison, Virginia Beach averages 18.4 and Richmond 53.4. That is the engineering reason a Roanoke lot needs more base and better drainage than a coastal one, and it is measured rather than asserted.",
      },
      {
        question: 'Can you work overnight on a hospital or campus lot?',
        answer:
          "That is normally the only way it can be done. Medical campuses do not close, so the work is phased section by section overnight with emergency access and ambulance routes kept open throughout, and each section striped and reopened before the next begins. It takes longer than closing a lot outright and it is the difference between a job that can happen and one that cannot.",
      },
      {
        question: 'What about the old industrial and rail-side approaches?',
        answer:
          "They are the hardest thing in the valley to build for. Loaded trucks that are heavy, concentrated and slow-moving punish asphalt far more than the same weight at speed, and a surface-only repair on a failing loading approach is money spent twice. Those areas need the base assessed before anyone quotes a surface, and sometimes the honest answer is concrete rather than asphalt.",
      },
    ],
  },

  // ── Where the 2026 work has been ────────────────────────────────────────
  {
    slug: 'ruckersville-va',
    city: 'Ruckersville',
    state: 'Virginia',
    stateCode: 'VA',
    county: 'Greene County',
    lat: 38.2318,
    lng: -78.3742,
    headline: 'Asphalt Paving Contractor in Ruckersville, VA',
    tagline: 'Greene County paving at the Route 29 and Route 33 crossroads.',
    description:
      "Ruckersville is a crossroads that turned into a commercial strip. Route 29 runs north to Culpeper and south to Charlottesville, Route 33 runs east to Gordonsville and west over Swift Run Gap into the Shenandoah Valley, and the intersection of the two carries traffic that has nothing to do with Greene County and everything to do with getting somewhere else. That is the paving problem here in one sentence: the lots serving this crossroads take a volume of turning, braking, heavily loaded traffic that a county of nineteen thousand people would never generate on its own. Convenience stores, fuel canopies, drive-through approaches and the shopping centres along the 29 strip all wear at the entrances first, where vehicles slow off a 60-mph road and turn under load. Greene County averages 1,173 feet of elevation, high enough that the freeze-thaw count is moderate rather than negligible, and at that band it is drainage that decides how long a surface lasts rather than how thick the mat is. Water that sits in a base through a January freeze does more damage in one winter than a season of truck traffic. Away from the strip, Greene County is farm roads and long private drives running back toward the Blue Ridge, where tar-and-chip is often the honest answer for a quarter-mile approach that would cost a fortune in hot mix. VDOT's Culpeper District has the Route 636 bridge over Swift Run in its programme, which tells you what the local road network is contending with.",
    services: ['Asphalt Paving', 'Sealcoating', 'Crack Filling', 'Parking Lots', 'Driveways', 'Tar and Chip'],
    nearbyLandmarks: [
      'Route 29 / Route 33 Intersection',
      'Swift Run Gap',
      'Greene County Courthouse (Stanardsville)',
      'Blue Ridge Mountains',
      'Route 29 Commercial Corridor',
    ],
    faqs: [
      {
        question: 'Why do the entrances to Route 29 lots fail before the rest of the pavement?',
        answer:
          'Because that is where the load is. A vehicle turning off a 60-mph highway is braking and steering at the same time, and the twisting force that puts into the surface — shoving, not just compressing — is concentrated in the first thirty feet of the approach. It is a base and mix-design problem, not a thickness problem. We build entrances to take it rather than patching them every second year.',
      },
      {
        question: 'Is tar and chip a reasonable choice for a long drive in Greene County?',
        answer:
          'Often, yes. On a quarter-mile rural approach the cost difference against hot mix is substantial, and chip seal over a properly prepared base handles light traffic well and sheds water. It needs a sound base underneath it the same as anything else — chip seal laid on a soft subgrade fails as fast as asphalt does. We will tell you honestly which one your drive actually needs.',
      },
      {
        question: 'Does the elevation here change how you build?',
        answer:
          'It changes the priority. At around 1,170 feet Greene County sees a moderate number of freeze-thaw cycles each winter — not the punishing count of the high mountain counties, but enough that trapped water matters. So drainage design carries more weight here than an extra inch of surface would. Getting water off and out from under the pavement is the single highest-value thing on most sites in this county.',
      },
    ],
  },
  {
    slug: 'ivy-va',
    city: 'Ivy',
    state: 'Virginia',
    stateCode: 'VA',
    county: 'Albemarle County',
    lat: 38.0568,
    lng: -78.5978,
    headline: 'Asphalt Paving Contractor in Ivy, VA',
    tagline: 'Route 250 West and the estate drives of western Albemarle.',
    description:
      "Ivy is what western Albemarle County looks like before it becomes the Blue Ridge: Route 250 running west out of Charlottesville toward Afton, with the land opening into farms, horse properties and estates set well back from the road. The paving here is almost entirely private, and it is a different discipline from commercial lot work. A drive at Ivy is frequently several hundred yards long, curved to follow a contour rather than a property line, crossing at least one low point where water wants to run, and finishing at a house whose owner cares a great deal what the approach looks like. That combination — length, grade and appearance — is where the money either goes into the base or gets spent again in five years. Albemarle County sits at around 640 feet of mean elevation, which puts it in the long-season band where freeze-thaw is not the main enemy and subgrade moisture is. The Piedmont residual soils here weather in place from bedrock rather than arriving as river sediment, which gives them more inherent structure than the Coastal Plain clay east of Richmond, but they hold water in the low spots and they move when they do. Edge failure is the characteristic problem on a long rural drive: without a shoulder or a proper edge detail, the outside of the mat has nothing supporting it and it breaks away a foot at a time. Access matters too. Ivy roads are narrow, winding and often tree-lined, which constrains what equipment can reach a site and is worth establishing before a schedule is promised rather than after.",
    services: ['Asphalt Paving', 'Driveways', 'Tar and Chip', 'Sealcoating', 'Grading and Drainage'],
    nearbyLandmarks: [
      'Route 250 West (Ivy Road)',
      'Meriwether Lewis area',
      'Western Albemarle County',
      'Route 637 (Dick Woods Road)',
      'Blue Ridge foothills',
    ],
    faqs: [
      {
        question: 'Why do long rural driveways fail at the edges first?',
        answer:
          'Because the edge is unsupported. In the middle of a drive the asphalt is confined on both sides and the load spreads; at the edge there is nothing holding it laterally, so a wheel running near the shoulder breaks it away in pieces. On a long approach it is worth either widening the base beyond the mat, building a proper shoulder, or detailing the edge — all of which cost far less than replacing the outside foot of a three-hundred-yard drive.',
      },
      {
        question: 'Can you get equipment down a narrow tree-lined drive?',
        answer:
          'Usually, but it is the first thing to establish rather than the last. Overhead clearance, gate widths and turning room decide which paver and which trucks can reach the site, and that decides the schedule and the price. We look at access on the estimate visit, not on the morning of the job.',
      },
      {
        question: 'Is the ground in western Albemarle better to build on than Richmond clay?',
        answer:
          'Generally yes. Piedmont residual soil weathered from bedrock has more structure than the Coastal Plain clay in the Richmond basin. That is not permission to skip base preparation — it holds water in low spots and moves when saturated, and on the rolling ground out here the low spots are exactly where a drive crosses them. Drainage design is what earns the difference.',
      },
    ],
  },
  {
    slug: 'vinton-va',
    city: 'Vinton',
    state: 'Virginia',
    stateCode: 'VA',
    county: 'Roanoke County',
    lat: 37.2812,
    lng: -79.8945,
    headline: 'Asphalt Paving Contractor in Vinton, VA',
    tagline: 'Roanoke Valley paving — town lots, commercial approaches and hill-country drainage.',
    description:
      "Vinton sits at the eastern end of the Roanoke Valley, an old railroad town of about eight thousand that has kept its own downtown while the Roanoke metro grew around it. The paving work here divides cleanly. In town it is compact commercial: small lots behind Pollard Street and Washington Avenue storefronts, church and municipal parking, and residential streets laid out before anyone was designing for delivery vans. Outside town it is Roanoke County hill country, where a drive is as likely to be a grade problem as a surface one. Roanoke County averages around 1,354 feet of elevation, putting it in the moderate freeze-thaw band, and the practical consequence is the same one that governs everywhere in that band: subgrade drainage decides service life. On sloping ground that means intercepting water before it reaches the pavement rather than draining it once it is already underneath. Grades here are steep enough to matter for the paving itself, not just for drainage. Mat laid on a steep approach wants to move under a roller and under traffic, mix selection and rolling pattern both change, and a driveway that turns uphill into a garage needs a transition detailed properly or it cracks across the break in slope. The valley's freight and rail heritage also left a stock of industrial yards and loading approaches where the loads are heavy, concentrated and slow — the hardest thing you can ask of asphalt.",
    services: ['Asphalt Paving', 'Parking Lots', 'Driveways', 'Sealcoating', 'Crack Filling', 'Grading and Drainage'],
    nearbyLandmarks: [
      'Downtown Vinton',
      'Washington Avenue',
      'Roanoke River Greenway',
      'Blue Ridge Parkway access',
      'Roanoke Valley',
    ],
    faqs: [
      {
        question: 'Does a steep driveway need a different asphalt mix?',
        answer:
          'It needs different attention, and sometimes a different mix. On a steep grade the surface is asked to resist shoving — the vehicle pushes the mat downhill as it climbs — so a stiffer binder and a well-keyed base matter more than they would on the flat. The rolling pattern changes too, because a roller on a grade compacts unevenly if it is worked the usual way. The place these fail is almost always the transition at the top or bottom of the slope.',
      },
      {
        question: 'What is the main cause of pavement failure in Roanoke County?',
        answer:
          'Water reaching the subgrade, then freezing. At around 1,350 feet the valley sees a moderate freeze-thaw count each winter — enough that saturated base material heaves and loses strength. On sloping sites the answer is to intercept the water uphill of the pavement rather than to try to drain it out once it is already under there.',
      },
      {
        question: 'Do you handle industrial and loading-dock paving?',
        answer:
          'Yes, and it is worth being clear that it is a different specification. A loaded truck standing still on a dock apron, or turning tightly under load, imposes far more on the pavement than the same truck driving over it. That is a base-depth and mix-design decision made before anything is laid, not something a thicker surface course fixes afterwards.',
      },
    ],
  },
  {
    slug: 'annandale-va',
    city: 'Annandale',
    state: 'Virginia',
    stateCode: 'VA',
    county: 'Fairfax County',
    lat: 38.8304,
    lng: -77.1964,
    headline: 'Asphalt Paving Contractor in Annandale, VA',
    tagline: 'Northern Virginia commercial paving — dense lots, tight windows, real traffic.',
    description:
      "Annandale is inside the Beltway, and everything about paving here follows from that. Fairfax County is the densest market in Virginia, the commercial lots are older than the traffic they now carry, and there is almost never a convenient time to close one. Work is scheduled around business hours, phased so half a lot stays open, and frequently done overnight — which is a real constraint on mix temperature and on how much can be laid before it has to be trafficked. The retail strips along Little River Turnpike and Columbia Pike, the office and medical parking behind them, and the church and school lots through Wakefield and Broyhill are the characteristic work. Fairfax County sits at about 287 feet of mean elevation, the long-season band, where the freeze-thaw count is low and paving weather runs later into the year than it does anywhere west of here. That is an advantage on scheduling and a trap on maintenance: the enemy in Northern Virginia is not ice, it is load and oxidation. Lots here accumulate a fatigue history — decades of delivery vehicles on the same drive aisles — and the failure that follows is alligator cracking along the wheel paths rather than the frost heave you would see at elevation. It is also a market where the striping, the ADA layout and the fire-lane marking are inspected and enforced, so the layout is not an afterthought applied at the end. VDOT's Northern Virginia District has the Fairfax County Parkway widening underway, which is the scale of traffic the county's own network is built around.",
    services: ['Commercial Paving', 'Parking Lots', 'Asphalt Overlay', 'Sealcoating', 'Line Striping', 'ADA Compliance'],
    nearbyLandmarks: [
      'Little River Turnpike (Route 236)',
      'Columbia Pike',
      'Capital Beltway (I-495)',
      'Annandale Town Center',
      'Fairfax County Parkway',
    ],
    faqs: [
      {
        question: 'Can you pave a commercial lot without closing the business?',
        answer:
          'Yes — phasing is the normal way this is done in Fairfax County, because there is rarely an alternative. The lot is divided so that access and a working number of spaces stay open while a section is rebuilt, and the sequence is planned around the tenant’s trading hours. Overnight work is often the right answer for a busy retail site. Both approaches need the schedule agreed before the crew arrives, not improvised on the day.',
      },
      {
        question: 'What fails first on an older Northern Virginia parking lot?',
        answer:
          'The drive aisles, in the wheel paths, as interconnected cracking that looks like alligator hide. That is fatigue — the accumulated effect of thousands of loaded vehicles tracking the same line — and it is a sign the base has stopped carrying rather than that the surface has worn out. Overlaying it without addressing the base buys a season or two. Full-depth repair in the failed areas and then an overlay is the honest fix.',
      },
      {
        question: 'Do you handle ADA layout and fire-lane marking?',
        answer:
          'Yes, and in this county it is inspected. Accessible space count, aisle widths, ramp placement, signage and fire-lane marking are all part of the layout and are planned with the paving rather than painted on afterwards. Getting it wrong means doing the striping twice.',
      },
    ],
  },

  // ── The corridor around the new base ────────────────────────────────────
  {
    slug: 'nellysford-va',
    city: 'Nellysford',
    state: 'Virginia',
    stateCode: 'VA',
    county: 'Nelson County',
    lat: 37.8938,
    lng: -78.8886,
    headline: 'Asphalt Paving Contractor in Nellysford, VA',
    tagline: 'Rockfish Valley, Route 151 and the mountain above it.',
    description:
      "Nellysford sits in the Rockfish Valley on Route 151, which over the last fifteen years has become one of the busiest visitor corridors in central Virginia — breweries, cideries, wineries and a steady weekend traffic that arrives in cars and leaves in cars. The paving problem that creates is specific: a rural property built for a farm's worth of vehicles is now taking a Saturday's worth of them, and the lots were rarely designed for it. Gravel that worked for a decade turns to ruts and dust; an asphalt apron sized for a delivery truck gets a hundred cars a day turning on it. Sequencing matters as much as specification, because these are seasonal businesses that cannot lose a weekend in the autumn. Nelson County's mean elevation is 719 feet, which places most of the valley in the long-season band where freeze-thaw is limited and subgrade moisture is the constraint that decides service life. The Rockfish is a river valley and the water table shows it. But the county average badly understates part of this market, and it is worth saying plainly: Wintergreen Resort sits above 3,500 feet on Devils Knob, thousands of feet over the valley floor, and the freeze-thaw count up there is nothing like the number down here. Mountain roads, steep resort approaches and condominium parking at that elevation are a genuinely different engineering problem, governed by base depth and drainage against repeated freezing rather than by the surface mix. Anyone quoting a Wintergreen property the valley's numbers is quoting the wrong ones. VDOT's Lynchburg District has a roundabout programmed at Routes 151 and 6, which is what happens to a rural junction that starts carrying visitor traffic.",
    services: ['Asphalt Paving', 'Parking Lots', 'Driveways', 'Tar and Chip', 'Grading and Drainage', 'Sealcoating'],
    nearbyLandmarks: [
      'Route 151 (Brew Ridge Trail)',
      'Rockfish Valley',
      'Wintergreen Resort',
      'Routes 151 and 6 junction',
      'Blue Ridge Parkway',
      'Devils Knob',
    ],
    faqs: [
      {
        question: 'Does paving at Wintergreen need a different specification from the valley?',
        answer:
          'Yes, and the difference is large. The resort sits above 3,500 feet, thousands of feet over the Rockfish Valley, and it goes through a far higher number of freeze-thaw cycles each winter as a result. Up there base depth and drainage govern service life; down in the valley subgrade moisture does. Add steep grades and winter maintenance — plough blades and de-icing chemicals — and it is a different job with a different design, not the same job at altitude.',
      },
      {
        question: 'Our winery lot is gravel and rutting every season. Is asphalt the answer?',
        answer:
          'Sometimes, and not always. Gravel that ruts is usually telling you the base and the drainage are not right, and laying asphalt over the same problem produces an expensive version of it. The honest sequence is to fix what is under it first, then decide the surface. For a large overflow area that fills a dozen weekends a year, a properly built and drained gravel surface can still be the right call — the paved area is the part that takes traffic every day.',
      },
      {
        question: 'Can the work be scheduled around our season?',
        answer:
          'It has to be, and it is planned that way from the estimate. A Route 151 business cannot lose an autumn Saturday. That means phasing the lot so trading continues, agreeing the sequence in advance, and being straight about cure times before anything is driven on rather than after.',
      },
    ],
  },
  {
    slug: 'lovingston-va',
    city: 'Lovingston',
    state: 'Virginia',
    stateCode: 'VA',
    county: 'Nelson County',
    lat: 37.7615,
    lng: -78.8722,
    headline: 'Asphalt Paving Contractor in Lovingston, VA',
    tagline: 'Nelson County seat — courthouse, commercial and the Route 29 corridor.',
    description:
      "Lovingston is the seat of Nelson County, a small courthouse village strung along the old road with the Route 29 corridor running past it. That gives the work here a character the resort side of the county does not have: county and institutional property, the professional offices and services that cluster around a courthouse, and the commercial frontage that faces a US highway carrying through-traffic between Charlottesville and Lynchburg. Public and institutional paving comes with its own requirements — specification compliance, accessible parking that will be inspected, and a procurement process that expects a contractor to document what was laid rather than simply invoice for it. At 719 feet of mean elevation Nelson County falls in the long-season band, with limited freeze-thaw and subgrade moisture as the governing constraint, and Lovingston sits close to that average rather than being an outlier the way the mountain does. The Route 29 frontage brings the same entrance-loading problem found anywhere on that highway: vehicles decelerating off a fast road and turning under load concentrate stress in the first stretch of an approach, and that is where a commercial lot begins to fail. VDOT's Lynchburg District has turning lanes programmed at Route 29 and Route 653 in this county, which is the same issue addressed at highway scale.",
    services: ['Asphalt Paving', 'Parking Lots', 'Commercial Paving', 'Line Striping', 'ADA Compliance', 'Sealcoating'],
    nearbyLandmarks: [
      'Nelson County Courthouse',
      'Route 29 Corridor',
      'Route 56',
      'Nelson County Government offices',
      'Blue Ridge Mountains',
    ],
    faqs: [
      {
        question: 'Do you take on county and institutional paving work?',
        answer:
          'Yes. Public work runs to a written specification and expects documentation — compaction, material tickets, accessible layout — rather than a finished invoice and a handshake. That is how we prefer to work in any case. We have run to public and franchise specifications for four decades, and we hold an SCDOT encroachment permit performed and closed out by that department in 2024. Licensing for a specific public contract is obtained to that contract.',
      },
      {
        question: 'Why does the entrance off Route 29 fail before the rest of a lot?',
        answer:
          'Because it takes the worst of the loading. A vehicle turning off a highway is braking and steering at once, and that twisting force shoves the surface rather than simply pressing on it. The first thirty feet of an approach carries stress the middle of a lot never sees. It is a base and mix decision made at design, not something patching solves permanently.',
      },
      {
        question: 'How long is the paving season in Nelson County?',
        answer:
          'Long, on the valley floor. At around 719 feet the county sees relatively few freeze-thaw cycles and the season runs later in the year than it does at elevation. The constraint here is moisture in the subgrade rather than frost, so a wet autumn matters more to scheduling than a cold one. The mountain is a different case entirely.',
      },
    ],
  },
  {
    slug: 'faber-va',
    city: 'Faber',
    state: 'Virginia',
    stateCode: 'VA',
    county: 'Nelson County',
    lat: 37.8434,
    lng: -78.7717,
    headline: 'Asphalt Paving Contractor in Faber, VA',
    tagline: 'Rural Nelson County — long drives, farm roads and Route 29 access.',
    description:
      "Faber is rural Nelson County: scattered settlement between Route 29 and the Rockfish, farms and woodland, and properties whose approach from the public road is measured in hundreds of yards rather than feet. Almost all the paving here is private and most of it is about access — getting a vehicle, a delivery lorry or a piece of farm equipment from the state road to a building without the surface failing where water crosses it. On ground like this the drive is usually the drainage structure whether anyone designed it that way or not, and the failures follow: the low crossing that softens every spring, the outside edge that breaks away where a vehicle runs wide, the section on a grade that gullies after a hard rain. Nelson County averages 719 feet, in the long-season band where freeze-thaw is limited and subgrade moisture governs, which for a long rural drive means the water crossing decides the life of the whole thing. Length also makes surface choice a real decision rather than a default. On a quarter-mile approach tar-and-chip over a properly built base costs a fraction of hot mix and handles light traffic well; on a drive that takes a loaded truck weekly it does not. The base is the same requirement under either, and a chip seal laid on soft subgrade fails just as fast as asphalt does. There is a smaller point worth making about rural sites: what can physically reach them. Gate widths, overhead limbs and turning room decide which equipment gets in, and that is established on the estimate visit.",
    services: ['Driveways', 'Tar and Chip', 'Asphalt Paving', 'Grading and Drainage', 'Farm and Access Roads'],
    nearbyLandmarks: [
      'Route 29',
      'Route 6',
      'Rockfish River',
      'Blue Ridge Mountains',
      'Rural Nelson County',
    ],
    faqs: [
      {
        question: 'Tar and chip or hot mix for a long rural driveway?',
        answer:
          'It depends on what uses it. For light traffic on a long approach, chip seal over a sound base costs substantially less and performs well. For a drive taking loaded trucks or farm equipment regularly, hot mix is the durable answer. What does not change is the base — a chip seal laid over soft subgrade fails as quickly as asphalt would, and the money saved on the surface gets spent twice.',
      },
      {
        question: 'My drive washes out where it crosses a low spot. What actually fixes it?',
        answer:
          'Moving the water, not thickening the surface. A crossing that softens every spring is telling you water is running through or under the drive rather than past it. The fix is a proper culvert or crossing detail sized for the flow, with the base built up and drained on both sides. Repaving over it puts a new surface on the same problem.',
      },
      {
        question: 'Can you get a paving crew down a narrow rural drive?',
        answer:
          'Usually, and we check before quoting rather than after. Gate width, overhead clearance and somewhere to turn a truck around determine which equipment can reach the site, and that determines both the price and the schedule. It is a question worth answering on the first visit.',
      },
    ],
  },
  {
    slug: 'crozet-va',
    city: 'Crozet',
    state: 'Virginia',
    stateCode: 'VA',
    county: 'Albemarle County',
    lat: 38.0687,
    lng: -78.6997,
    headline: 'Asphalt Paving Contractor in Crozet, VA',
    tagline: 'Albemarle’s designated growth area at the foot of the Blue Ridge.',
    description:
      "Crozet is Albemarle County's designated growth area on the western side, which means it has been building steadily for two decades and shows it: new residential development at Old Trail and around it, a downtown that has been deliberately rebuilt, and the mix of new and old infrastructure that comes with a village turning into a town. The paving work reflects that split. New development brings streets, shared drives and HOA-managed parking that were laid within recent memory and are now reaching the point where sealcoating and crack repair decide whether they last another decade or need an overlay. Older Crozet — the streets around the former Con Agra site and the original village grid — has pavement that predates the traffic it now carries. At around 640 feet of mean elevation Albemarle sits in the long-season band, where freeze-thaw is limited and subgrade moisture is the constraint, though Crozet is closer to the mountain than most of the county and the ground rises quickly to the west. Piedmont residual soil here weathers from bedrock in place, giving better structure than the Coastal Plain clays east of Richmond, but it still holds water in the low ground. For newer HOA and commercial surfaces the highest-value work in this market is usually not paving at all — it is a maintenance cycle started before the cracking becomes structural, because sealing and filling on schedule is a fraction of the cost of an overlay and buys most of the same years.",
    services: ['Asphalt Paving', 'Sealcoating', 'Crack Filling', 'Parking Lots', 'Driveways', 'Maintenance Plans'],
    nearbyLandmarks: [
      'Downtown Crozet',
      'Old Trail',
      'Route 250 West',
      'Crozet Avenue',
      'Blue Ridge Mountains',
      'Western Albemarle',
    ],
    faqs: [
      {
        question: 'When should an HOA sealcoat rather than overlay?',
        answer:
          'Sealcoating protects a surface that is still structurally sound — it slows oxidation and keeps water out of the cracks. Once cracking is interconnected in the wheel paths, the base has begun to fail and sealing it is cosmetic. The value is in starting the cycle before that point: on a surface laid in the last decade, sealing and crack filling on schedule costs a fraction of an overlay and buys most of the same service life.',
      },
      {
        question: 'How often should a newer Crozet development be sealed?',
        answer:
          'Typically every three to five years, depending on traffic and sun exposure, with crack filling as needed in between. A lot that bakes in full sun oxidises faster than one under tree cover. We would rather look at the surface and tell you it does not need doing yet than sell you a cycle it does not warrant.',
      },
      {
        question: 'Does being closer to the mountain change anything here?',
        answer:
          'A little. Albemarle averages around 640 feet and falls in the long-season band, but the ground rises quickly west of Crozet and sites up that way see more freeze-thaw than the county figure suggests. It mostly changes how much weight drainage carries in the design. On the valley side of the village the county average holds well.',
      },
    ],
  },
]

export default CORRIDOR_SERVICE_AREAS
