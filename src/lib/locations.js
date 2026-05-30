// Master location dataset — single source of truth for all market pages,
// sitemap, navigation, and schema generation.
// Each entry produces /locations/[slug]

export const PRIMARY_DOMAIN = 'https://www.jwordenasphaltpaving.com';
export const RICHMOND_CENTER = { lat: 37.5407, lng: -77.4360 };
export const RICHMOND_RADIUS_MILES = 90;

export const LOCATIONS = [
  // ──────── VIRGINIA ────────
  {
    slug: 'chester-va',
    city: 'Chester',
    state: 'Virginia',
    stateAbbr: 'VA',
    region: 'Central Virginia',
    geo: { lat: 37.3563, lng: -77.4411 },
    isHeadquarters: true,
    headline: 'Asphalt Paving in Chester, VA — Our Hometown for 40+ Years',
    intro:
      'J. Worden & Sons was founded in Chester, Virginia, and we still run every job from our Ware Bottom Spring Road headquarters. From River\'s Bend driveways to Route 10 commercial lots, this is the community that built us — and the streets we know inch by inch.',
    neighborhoods: [
      'River\'s Bend', 'Bermuda Hundred', 'Enon', 'Curtis', 'Rivers Bend',
      'Meadowville', 'Old Centralia', 'Indian Hill', 'Point of Rocks',
    ],
    landmarks: ['Henricus Historical Park', 'Chesterfield County Airport', 'Route 10 corridor', 'Old Bermuda Hundred Rd'],
    climate: {
      title: 'Chester\'s Tidewater Freeze-Thaw',
      body: 'Chester sits in USDA Zone 7b — winters dip to 15°F and summers crest 95°F. We use a PG 64-22 binder rated for that exact temperature swing, and we mill 2.5″ deep on driveways to outrun the James River basin clay heave.',
    },
    faqs: [
      {
        q: 'Do I need a Chesterfield County permit for a new driveway in Chester?',
        a: 'For new construction or a culvert tie-in to a county road, yes — through Chesterfield Building Inspection. For straight overlay of an existing driveway on private property, typically no. We handle the application paperwork as part of our scope.',
      },
      {
        q: 'My driveway sits on river-bottom clay. Will it heave?',
        a: 'Only if the base prep is wrong. We dig 8–10″ below grade on Bermuda Hundred and River\'s Bend properties, lay a #57 stone subbase with geotextile fabric, then compact in 4″ lifts. Done right, it doesn\'t heave for 25 years.',
      },
      {
        q: 'How fast can you start a Chester project?',
        a: 'We\'re local — most Chester driveways start within 7–10 days of contract signing. HQ trucks are 4 minutes from your house.',
      },
    ],
    reviews: 142,
    rating: 4.9,
  },
  {
    slug: 'richmond-va',
    city: 'Richmond',
    state: 'Virginia',
    stateAbbr: 'VA',
    region: 'Central Virginia',
    geo: { lat: 37.5407, lng: -77.4360 },
    headline: 'Asphalt Paving in Richmond, VA — Local Driveways, Lots, Sealcoating, and Repair',
    intro:
      'Richmond is home-market asphalt for J. Worden & Sons: residential driveways, rural lanes just outside the city, HOA roads, church lots, commercial parking lots, sealcoating, crack repair, pothole patching, milling, and overlays. From The Fan, Church Hill, Scott\'s Addition, and Manchester to Chester, Henrico, Midlothian, Short Pump, and the county-road residential corridors around Richmond, the work starts with local diagnosis and a written scope.',
    neighborhoods: [
      'The Fan', 'Church Hill', 'Shockoe Bottom', 'Scott\'s Addition',
      'Museum District', 'Carytown', 'Manchester', 'Forest Hill',
      'Westover Hills', 'Bellevue', 'Northside',
    ],
    landmarks: ['VCU campus', 'Capital One West Creek', 'Richmond International Raceway', 'Diamond District redevelopment', 'Scott\'s Addition breweries'],
    climate: {
      title: 'James River Freeze-Thaw + Clay Subsoil',
      body: 'Richmond cycles through freeze-thaw 30–40 times each winter, and the city\'s expansive Triassic clay subsoil swells with every wet spell. Standard mixes crack within 3 years. We spec polymer-modified PG 70-22 on commercial work and run 12″ of compacted aggregate base under every parking lot.',
    },
    faqs: [
      {
        q: 'Do you handle Richmond historic district overlay restrictions?',
        a: 'Yes. The Fan, Church Hill, and Jackson Ward have specific surface and edging requirements. We coordinate with Richmond Planning & Development Review and use brick-edged borders or stamped transitions where required.',
      },
      {
        q: 'Can you pave around mature oaks without killing the root system?',
        a: 'We do this constantly in the West End and Bellevue. We use root-bridge construction — a perforated geogrid suspended above the critical root zone — so the oxygen exchange continues. Costs about 20% more than standard but the trees survive.',
      },
      {
        q: 'How do you handle Richmond\'s stormwater runoff requirements?',
        a: 'Lots over 2,500 sq ft trigger Richmond DPU stormwater review. We design with permeable asphalt options or integrate bioswale tie-ins. We submit the SWPPP plan for you.',
      },
      {
        q: 'Do you handle sealcoating and asphalt repair around Richmond?',
        a: 'Yes. Richmond metro sealcoating, crack repair, pothole patching, milling, overlays, and pavement preservation are core services for residential driveways, HOAs, church lots, retail lots, and industrial yards.',
      },
      {
        q: 'What areas around Richmond are priority service markets?',
        a: 'Richmond, Chester, Chesterfield, Henrico, Glen Allen, Short Pump, Midlothian, Bon Air, Tuckahoe, Mechanicsville, Ashland, Petersburg, Hopewell, and nearby rural residential corridors are core local markets.',
      },
    ],
    reviews: 287,
    rating: 4.9,
  },
  {
    slug: 'midlothian-va',
    city: 'Midlothian',
    state: 'Virginia',
    stateAbbr: 'VA',
    region: 'Central Virginia',
    geo: { lat: 37.5068, lng: -77.6488 },
    headline: 'Midlothian, VA Asphalt Paving — Long Driveways Done Right',
    intro:
      'Midlothian properties run long. We\'ve laid 800-foot curved driveways through Brandermill, paved cul-de-sacs in Salisbury, and replaced the asphalt at Westchester Commons. The Midlothian Turnpike corridor has unique sub-grade challenges — and we\'ve solved them since the \'80s.',
    neighborhoods: [
      'Brandermill', 'Woodlake', 'Salisbury', 'Sycamore Square',
      'Hallsley', 'Foxcroft', 'Robious', 'Bon Air', 'Old Buckingham',
    ],
    landmarks: ['Westchester Commons', 'Midlothian Mines Park', 'Robious Landing Park', 'Powhite Parkway terminus'],
    climate: {
      title: 'Midlothian\'s Mica-Schist Geology',
      body: 'The old Midlothian coal seams left a mica-schist subsoil that drains poorly and shifts under load. Standard 2″ overlays fail in 5 years here. We base-prep with crushed bluestone (not gravel) and pour 3″ of binder course before the surface lift.',
    },
    faqs: [
      {
        q: 'My HOA in Brandermill requires written paving specs. Do you provide them?',
        a: 'Yes — we deliver a full submittal packet: mix design, compaction specs, surface drainage plan, and a typical section drawing. Brandermill ARB usually approves within 14 days.',
      },
      {
        q: 'Can you grade a 600-foot driveway with a switchback?',
        a: 'Standard work for us in Hallsley and Salisbury. We laser-grade for a 2% cross-fall and use heated screed equipment to keep mat temperature consistent across the whole run.',
      },
      {
        q: 'Do you do circular driveways with center medians?',
        a: 'Yes. We pave the loop, then frame the center median with 6″ extruded concrete curb and let your landscaper handle the planting bed.',
      },
    ],
    reviews: 96,
    rating: 5.0,
  },
  {
    slug: 'short-pump-va',
    city: 'Short Pump',
    state: 'Virginia',
    stateAbbr: 'VA',
    region: 'Central Virginia',
    geo: { lat: 37.6512, lng: -77.6155 },
    headline: 'Short Pump, VA Paving — Commercial-Grade for Premium Properties',
    intro:
      'Short Pump\'s explosive growth — Town Center, Innsbrook, GreenGate — means high-traffic commercial lots and high-end residential developments. We\'ve done both. Our Innsbrook crew specializes in nighttime parking lot resurfacing so businesses never close.',
    neighborhoods: [
      'Wyndham', 'Hickory Hill', 'GreenGate', 'Twin Hickory',
      'Glen Allen', 'Wellesley', 'Gayton', 'Nuckols Crossing',
    ],
    landmarks: ['Short Pump Town Center', 'Innsbrook corporate campus', 'GreenGate development', 'West Broad Marketplace'],
    climate: {
      title: 'High-Traffic Wear in Suburban Henrico',
      body: 'Short Pump commercial lots see 3,000+ vehicle counts daily — punishing for standard SM-9.5A mixes. We spec SM-12.5D heavy-duty surface course rated for that exact load class, so your lot doesn\'t need re-striping every spring.',
    },
    faqs: [
      {
        q: 'Can you pave a commercial parking lot without closing the business?',
        a: 'Yes — we run nighttime crews for Short Pump retail and Innsbrook offices. Mill at 10 PM, base course by midnight, surface lift by 4 AM, striping by 6. Open at 8.',
      },
      {
        q: 'How long do Short Pump Town Center-grade parking lots last?',
        a: 'A properly built Short Pump commercial lot — 4″ base course + 2.5″ surface, sealed every 3 years — runs 18–22 years before full replacement. We warranty 5 years on workmanship.',
      },
      {
        q: 'Do you stripe to ADA spec?',
        a: 'Every job. We use methyl methacrylate (MMA) striping paint — 8× the lifespan of latex — and certify each ADA stall to current Henrico code.',
      },
    ],
    reviews: 124,
    rating: 4.9,
  },
  {
    slug: 'henrico-va',
    city: 'Henrico',
    state: 'Virginia',
    stateAbbr: 'VA',
    region: 'Central Virginia',
    geo: { lat: 37.5907, lng: -77.4360 },
    headline: 'Henrico County, VA Asphalt Paving — From West End to Eastern Henrico',
    intro:
      'Henrico is two counties in one — the affluent West End around Glen Allen and the industrial corridor along Laburnum and Williamsburg Road. We work both. Whether it\'s a Wyndham driveway or a Sandston warehouse yard, we know the soil, the codes, and the inspectors.',
    neighborhoods: [
      'Glen Allen', 'Tuckahoe', 'Lakeside', 'Highland Springs',
      'Sandston', 'Varina', 'Fair Oaks', 'Brookland',
    ],
    landmarks: ['Richmond International Airport', 'Innsbrook', 'Lewis Ginter Botanical Garden', 'Deep Run Park'],
    climate: {
      title: 'Eastern Henrico\'s Sand-Loam vs. West End Clay',
      body: 'Soil composition flips dramatically across Henrico — West End is plastic Cecil clay, Eastern Henrico runs sandy loam from the old Chickahominy floodplain. Same county, two completely different base prep specs. We test before we dig.',
    },
    faqs: [
      {
        q: 'Do I need a Henrico County permit?',
        a: 'Driveway aprons connecting to county roads require a Henrico DPW permit. Private driveways behind the right-of-way usually do not. Commercial work always does. We pull all permits as part of the scope.',
      },
      {
        q: 'Can you handle the airport-area industrial yards?',
        a: 'Yes — we\'ve paved truck staging yards in Sandston rated for FAA crash-truck loads. That requires 6″ of asphalt over 12″ of crushed concrete base. Heavy work, and we\'re built for it.',
      },
      {
        q: 'How does Henrico stormwater code affect my parking lot?',
        a: 'Anything over 2,500 sq ft of new impervious surface triggers Henrico stormwater review. We design with on-site detention or permeable sections to keep your project under threshold when possible.',
      },
    ],
    reviews: 178,
    rating: 4.9,
  },
  {
    slug: 'chesapeake-va',
    city: 'Chesapeake',
    state: 'Virginia',
    stateAbbr: 'VA',
    region: 'Hampton Roads',
    geo: { lat: 36.7682, lng: -76.2875 },
    headline: 'Chesapeake, VA Paving — Built for Hampton Roads Salt & Storms',
    intro:
      'Chesapeake\'s coastal proximity changes everything about asphalt. Salt-laden air corrodes binders, hurricane drainage demands precision grading, and the high water table eats unprepared base courses. We\'ve paved Greenbrier driveways and Western Branch industrial lots that have survived Isabel, Irene, and Florence.',
    neighborhoods: [
      'Greenbrier', 'Western Branch', 'Great Bridge', 'Deep Creek',
      'South Norfolk', 'Hickory', 'Bells Mill', 'Dominion Boulevard',
    ],
    landmarks: ['Chesapeake Square', 'Greenbrier Mall', 'Dismal Swamp Canal', 'Jordan Bridge'],
    climate: {
      title: 'Salt Air, High Water Table, Hurricane Drainage',
      body: 'Hampton Roads asphalt fails three ways: salt oxidation, undermined base from a 4-foot water table, and stormwater channeling during named storms. We use anti-strip additives in every Chesapeake mix, install French drains at low points, and slope every surface 1.5%–2% for hurricane runoff.',
    },
    faqs: [
      {
        q: 'How does the high water table affect my driveway?',
        a: 'Most of Chesapeake sits 4–6 feet above the water table. Untreated, your base course wicks moisture and pumps fines under load. We install woven geotextile and pour 6″ of #57 stone — non-negotiable on every Chesapeake job.',
      },
      {
        q: 'Will salt air really degrade asphalt?',
        a: 'Within 3–4 miles of the Chesapeake Bay, yes. Coastal asphalt loses 30% of its binder to oxidation in half the time of inland surfaces. We seal-coat every 2.5 years instead of the standard 3–5.',
      },
      {
        q: 'Can you pave during hurricane season?',
        a: 'June through November, yes — we just plan around named storms. We won\'t lay a surface course within 48 hours of forecast tropical weather, and we always finish drainage before the surface lift.',
      },
    ],
    reviews: 89,
    rating: 4.8,
  },
  {
    slug: 'williamsburg-va',
    city: 'Williamsburg',
    state: 'Virginia',
    stateAbbr: 'VA',
    region: 'Historic Triangle',
    geo: { lat: 37.2707, lng: -76.7075 },
    headline: 'Williamsburg, VA Paving — Modern Asphalt, Historic Sensibility',
    intro:
      'Williamsburg properties — from Kingsmill to Ford\'s Colony to historic district homes — demand paving that looks restrained, ages gracefully, and respects 300-year-old surroundings. We\'ve done driveways in Colonial Williamsburg overlay zones and parking lots at William & Mary. Discretion is part of the spec.',
    neighborhoods: [
      'Kingsmill', 'Ford\'s Colony', 'Governor\'s Land', 'Powhatan Plantation',
      'Stonehouse', 'Greensprings', 'New Town', 'Norge',
    ],
    landmarks: ['Colonial Williamsburg Historic Area', 'College of William & Mary', 'Busch Gardens', 'Jamestown Settlement'],
    climate: {
      title: 'Tidewater Humidity + Historic Overlay Constraints',
      body: 'James City County has one of the strictest historic preservation overlays in Virginia — surface color, edge treatment, and even the matte vs. semi-matte finish are regulated near the Historic Area. We have a charcoal-finish recipe that meets the overlay and still drains like standard asphalt.',
    },
    faqs: [
      {
        q: 'Do you handle Colonial Williamsburg overlay district paving?',
        a: 'Yes — we\'ve done multiple driveways within 1,000 feet of the Historic Area. The CW Foundation reviews the surface treatment, and we deliver the matte charcoal finish they specify.',
      },
      {
        q: 'How do you protect mature trees in Ford\'s Colony?',
        a: 'Same root-bridge geogrid system we use in Richmond\'s West End. Critical for Ford\'s Colony and Governor\'s Land where the mature canopy is the property\'s defining feature.',
      },
      {
        q: 'Can you match an existing colonial-era brick edging?',
        a: 'We frame the asphalt with a 6″ stretcher-bond brick border in your existing brick — sourced from the original lot if you have a stash, or matched as closely as possible.',
      },
    ],
    reviews: 67,
    rating: 5.0,
  },

  {
    slug: 'new-kent-va',
    city: 'New Kent County',
    state: 'Virginia',
    stateAbbr: 'VA',
    region: 'Williamsburg / New Kent Growth Corridor',
    geo: { lat: 37.5176, lng: -76.9789 },
    headline: 'New Kent County, VA Asphalt Paving — New Construction Driveways and Commercial Access',
    intro:
      'New Kent County is one of the fastest-growing construction corridors between Richmond and Williamsburg, and the rural areas between bigger cities are where many residential asphalt jobs happen. New subdivisions, rural estates, county-road homes, commercial pads, and access roads need asphalt scopes that account for fresh grading, builder fill, drainage movement, and long driveway runs before the final surface goes down.',
    neighborhoods: [
      'New Kent', 'Quinton', 'Providence Forge', 'Barhamsville',
      'Lanexa', 'Bottoms Bridge', 'Talleysville', 'Eltham',
      'Brickshire', 'Viniterra', 'I-64 corridor', 'Route 60 corridor',
    ],
    landmarks: ['I-64 corridor', 'New Kent Winery', 'Viniterra', 'Brickshire', 'Colonial Downs', 'Route 60'],
    climate: {
      title: 'Fresh Builder Fill, Long Driveways, and Growth-Corridor Drainage',
      body: 'New Kent paving often happens on recently disturbed soils, new subdivision pads, rural estate entrances, and commercial access roads. We check compaction, water movement, stone depth, and edge support before paving so new asphalt does not rut, settle, or crack early as the site continues to stabilize.',
    },
    faqs: [
      {
        q: 'Do you pave new-construction driveways in New Kent County?',
        a: 'Yes. We handle new-construction driveways, rural estate lanes, subdivision driveways, and commercial access roads across New Kent County with grading, stone base prep, drainage review, and asphalt installation.',
      },
      {
        q: 'Why do new-construction driveways fail early in New Kent?',
        a: 'Early failure usually comes from unsettled builder fill, weak compaction, thin stone base, poor drainage, or paving before the site is ready. We look at the base and water movement before recommending the final pavement scope.',
      },
      {
        q: 'Do you serve the Williamsburg to Richmond growth corridor?',
        a: 'Yes. New Kent, Providence Forge, Quinton, Lanexa, Williamsburg, and the I-64 corridor are practical service areas when the project scope and scheduling align.',
      },
    ],
    reviews: 28,
    rating: 4.9,
  },

  // ──────── I-81 CORRIDOR (Mountain Virginia) ────────
  {
    slug: 'roanoke-va',
    city: 'Roanoke',
    state: 'Virginia',
    stateAbbr: 'VA',
    region: 'I-81 Corridor / Blue Ridge',
    geo: { lat: 37.2710, lng: -79.9414 },
    headline: 'Roanoke, VA Asphalt Paving — Mountain-Grade Driveways Built for the Blue Ridge',
    intro:
      'Roanoke driveways face what flatland pavement never sees — sustained grades, freeze-thaw cycles in the 40s per winter, and Blue Ridge rain events that scour undersized base courses. We engineer every Roanoke Valley job with a 6-inch structural stone base and a polymer-modified binder rated for mountain conditions. Family-owned, 4th-generation, and honest about what your property actually needs. Competitors like Whittaker Paving Pros and James R. Carter Paving do good work — we bring the same craft with larger equipment, legacy depth, and a written warranty.',
    neighborhoods: [
      'South Roanoke', 'Raleigh Court', 'Grandin Village', 'Wasena',
      'Hunting Hills', 'Cave Spring', 'Hollins', 'Vinton',
      'Salem', 'Bonsack', 'Smith Mountain Lake', 'Daleville',
    ],
    landmarks: ['Mill Mountain Star', 'Roanoke Valley', 'Carilion Clinic', 'Virginia Tech Carilion', 'Appalachian Trail crossings', 'I-81 corridor'],
    climate: {
      title: 'Blue Ridge Freeze-Thaw + Steep-Grade Drainage',
      body: 'Roanoke sits at 900–1,800 feet with 40+ freeze-thaw cycles per winter and Blue Ridge rain events that drop 2″ in an hour. Cheap 4″ stone bases saturate and pump within 3 winters. Our 6-inch structural stone base — woven geotextile, #57 crushed stone, compacted in 3-inch lifts — is built specifically for Virginia mountain driveways. Paired with PG 70-22 polymer-modified binder, it holds up to sloped driveway scour and freeze-cycle fatigue.',
    },
    faqs: [
      {
        q: 'My Roanoke driveway has a 14% grade — can you pave it safely?',
        a: 'Yes — we do steep-grade work throughout Cave Spring, Hunting Hills, and the Blue Ridge Parkway access roads. Anything over 10% gets a broom-finish surface for traction, and we cut cross-drainage swales at transition points so stormwater can\'t sheet down the driveway.',
      },
      {
        q: 'Why do my Roanoke driveway cracks come back every spring?',
        a: 'Almost always inadequate base. Standard 4-inch stone base is not enough for Blue Ridge freeze-thaw. Our 6-inch structural base over geotextile stops the saturation-pumping cycle that causes mountain driveway fatigue cracking.',
      },
      {
        q: 'How do you compare to Whittaker Paving Pros or James R. Carter Paving?',
        a: 'They\'re respected local firms and we\'ve worked alongside both on commercial bids. Our differentiation: 4th-generation family ownership, larger equipment fleet for big jobs (long driveways, commercial lots, subdivisions), a written 5-year workmanship warranty, and transparent line-item estimates. Get two bids and compare.',
      },
      {
        q: 'Do you serve Smith Mountain Lake and Franklin County?',
        a: 'Yes — we\'re one of the few Central Virginia pavers who regularly run crews to SML and the Franklin County side of the lake. Lakefront driveways get our coastal-spec drainage treatment because the seasonal water table matters there too.',
      },
    ],
    reviews: 47,
    rating: 4.9,
  },
  {
    slug: 'harrisonburg-va',
    city: 'Harrisonburg',
    state: 'Virginia',
    stateAbbr: 'VA',
    region: 'I-81 Corridor / Shenandoah Valley',
    geo: { lat: 38.4496, lng: -78.8689 },
    headline: 'Harrisonburg, VA Paving — Shenandoah Valley Asphalt Done Right the First Time',
    intro:
      'Harrisonburg and Rockingham County sit at the heart of the Shenandoah Valley, where karst geology, heavy agricultural equipment, and I-81 freight traffic all punish sub-par pavement. We\'ve paved JMU-area rental properties, farm-lane driveways in Bridgewater, and commercial lots along Route 33. While the VDOT crews are milling Pleasant Hill Road and other local corridors, we\'re the residential alternative — same mountain-grade spec, family-owned accountability.',
    neighborhoods: [
      'Old Town', 'Northend', 'Park View', 'Pleasant Hill',
      'Bridgewater', 'Dayton', 'Elkton', 'McGaheysville',
      'Linville', 'Mount Crawford', 'Broadway', 'Timberville',
    ],
    landmarks: ['James Madison University', 'Massanutten Resort', 'Shenandoah National Park gateway', 'Route 33 corridor', 'I-81 exits 243–251'],
    climate: {
      title: 'Shenandoah Valley Karst + Agricultural Load',
      body: 'The Valley\'s karst limestone bedrock creates unpredictable sinkhole risk and uneven bearing capacity — something no pre-paving test from out-of-area contractors catches. We probe subgrade on every Harrisonburg job and lime-stabilize where plasticity runs high. For farm and commercial properties that see tractor and freight-truck traffic, we spec 3-inch binder course + 2-inch surface + 6-inch stone base — mountain-grade for mountain loads.',
    },
    faqs: [
      {
        q: 'I saw VDOT milling on Pleasant Hill Road — can you pave my driveway while your crews are nearby?',
        a: 'That\'s exactly when we schedule Harrisonburg residential work — crew mobilization is already efficient, materials are moving through the Valley, and we can often shave 5–8% off standard quotes. Call us the week you see VDOT out.',
      },
      {
        q: 'My Bridgewater farm driveway carries tractor and grain truck traffic — standard asphalt?',
        a: 'No — standard residential spec will rut in one harvest season. We build agricultural driveways with 3″ binder + 2″ surface over 6″ of crushed stone, and we often recommend a turnaround apron in concrete for the heaviest point loads.',
      },
      {
        q: 'Does the Valley karst soil really affect driveway paving?',
        a: 'On roughly 20% of Harrisonburg-area properties, yes. Karst subsoil can settle unpredictably, creating low spots within 2–3 years. We test subgrade bearing capacity before we quote, and where indicated we lime-stabilize or install additional geotextile reinforcement.',
      },
      {
        q: 'Can you coordinate JMU-area rental property work between school sessions?',
        a: 'Yes — May and August are our prime windows for JMU-area landlords. We schedule the full overlay plus line striping during the quietest weeks.',
      },
    ],
    reviews: 34,
    rating: 4.9,
  },
  {
    slug: 'winchester-va',
    city: 'Winchester',
    state: 'Virginia',
    stateAbbr: 'VA',
    region: 'I-81 Corridor / Northern Shenandoah',
    geo: { lat: 39.1857, lng: -78.1633 },
    headline: 'Winchester, VA Asphalt Paving — Northern Shenandoah Durability',
    intro:
      'Winchester and Frederick County sit where the Shenandoah Valley meets Northern Virginia\'s commuter sprawl. The result: freeze-thaw cycles from the mountain side, 30,000-vehicle-per-day commuter traffic on Route 7 and Route 37, and a regional infrastructure buildout that has strained every local paver. We bring Central Virginia family-owned accountability to the Northern Valley — same structural stone base, same written warranty, same phone that gets answered.',
    neighborhoods: [
      'Old Town', 'Senseny Road corridor', 'Amherst Street',
      'Stephens City', 'Middletown', 'Berryville', 'Boyce',
      'Clear Brook', 'Gainesboro', 'Front Royal', 'Strasburg',
    ],
    landmarks: ['Shenandoah University', 'Old Town Walking Mall', 'Route 7 corridor', 'Winchester Medical Center', 'I-81 Exits 310–317'],
    climate: {
      title: 'Northern Valley Freeze-Thaw + Commuter Traffic Load',
      body: 'Winchester averages 45+ freeze-thaw cycles per winter (more than Richmond) and Route 7 commuter properties see traffic volumes that rival suburban DC. The combination eats cheap residential driveways in 5–7 years. Our spec: PG 70-22 polymer-modified binder, 6-inch structural stone base on every driveway over 100 linear feet, and a compaction protocol engineered for repeat freeze-cycle loading.',
    },
    faqs: [
      {
        q: 'My Winchester driveway is 15 years old and failing — overlay or full replacement?',
        a: 'Depends on the base. If the failure is surface cracking with a solid base, a 2-inch overlay buys you 10–12 years. If the base is pumping or we see alligator cracking at high-load points, full replacement is the right call. We\'ll bring a core probe and tell you straight.',
      },
      {
        q: 'Do you serve Front Royal and Strasburg?',
        a: 'Yes — Warren and Shenandoah County properties are regular work for our Northern Valley crew. Same pricing, same spec.',
      },
      {
        q: 'Route 7 commuter property — how long will a new driveway last?',
        a: 'Built right — PG 70-22 binder, 6-inch structural base, proper crown — Northern Valley driveways last 22–28 years before full reconstruction. We warranty 5 years on workmanship and include a seal-coat schedule.',
      },
      {
        q: 'Can you handle Winchester\'s historic district paving restrictions?',
        a: 'Yes — Old Town\'s historic overlay has surface treatment rules similar to Williamsburg and Charleston. We\'ve done several carriage-house driveways in the walking mall area using matte charcoal finish with brick edge framing.',
      },
    ],
    reviews: 28,
    rating: 4.9,
  },

  // ──────── VIRGINIA BEACH / HAMPTON ROADS ────────
  {
    slug: 'virginia-beach-va',
    city: 'Virginia Beach',
    state: 'Virginia',
    stateAbbr: 'VA',
    region: 'Hampton Roads / Atlantic Coast',
    geo: { lat: 36.8529, lng: -75.9780 },
    headline: 'Virginia Beach Asphalt Paving — The Cure for Sloppy Coastal Repairs',
    intro:
      'Virginia Beach driveways fail for three reasons competitors won\'t tell you: sandy subgrade pumping under load, salt aerosol oxidizing the binder, and base courses too thin for Atlantic coastal conditions. We see it constantly — driveways built with 4-inch bases and no geotextile, patched with what Yelp reviewers correctly call "sloppy, Mickey Mouse repairs." Our 6-inch structural stone base over woven geotextile is the engineered cure for deep puddling, ruts, and band-aid patch cycles. Family-owned. Written 5-year warranty. The eco-friendly, weather-resistant coastal finish Virginia Beach homeowners actually want.',
    neighborhoods: [
      'Great Neck', 'Alanton', 'Bay Colony', 'North End',
      'Chicks Beach', 'Lynnhaven', 'Kempsville', 'Princess Anne',
      'Red Mill', 'Sandbridge', 'Pungo', 'Thalia',
      'Birdneck Point', 'Croatan', 'Shore Drive corridor',
    ],
    landmarks: ['Oceanfront / Boardwalk', 'Virginia Beach Convention Center', 'Joint Expeditionary Base Little Creek', 'Lynnhaven Mall', 'First Landing State Park', 'Sandbridge Beach'],
    climate: {
      title: 'Sandy Subgrade + Salt Aerosol + Atlantic Hurricane Drainage',
      body: 'Virginia Beach\'s sandy coastal soil pumps under vehicle load when the base is too thin or the geotextile is missing. Add salt aerosol (accelerates binder oxidation by 30–40%) and Atlantic hurricane drainage demands, and you get the ruts, puddles, and surface deterioration competitors like Excel Paving get reamed for in Yelp reviews. Our coastal spec is non-negotiable: 6-inch #57 stone base + woven geotextile + PG 76-22 polymer-modified binder + 2.5-inch surface course + 1.5%–2% cross-fall for hurricane runoff. Seal every 2.5 years, not the inland 4.',
    },
    faqs: [
      {
        q: 'Why does my Virginia Beach driveway have ruts and puddles already?',
        a: 'Two causes, both fixable only by rebuild: sandy subgrade pumping (no geotextile reinforcement) and inadequate base depth. Cheap contractors use 3–4 inches of stone on coastal driveways. The Atlantic sand shifts under load, the base pumps fines up through the asphalt, and within 2–3 years you have the exact ruts and deep puddling you\'re seeing. Our 6-inch structural stone base over woven geotextile permanently eliminates the pumping mechanism.',
      },
      {
        q: 'I got a cheap quote that was $2,000 less. What am I missing?',
        a: 'Usually one of three things: 3-inch base instead of 6, no geotextile, or standard PG 64-22 binder instead of coastal-spec PG 76-22 polymer-modified. Each is a $500–$1,500 line item that fails in 3 years. Check the written spec — not the price. If they won\'t put it in writing, that\'s your answer.',
      },
      {
        q: 'How often does a Virginia Beach driveway need sealing?',
        a: 'Every 2–2.5 years within 3 miles of the oceanfront. Salt aerosol accelerates binder oxidation significantly. We include a 5-year seal-coat schedule with every VB install and seal-coat reminder outreach.',
      },
      {
        q: 'Can you pave on sandy soil in Sandbridge or Chicks Beach?',
        a: 'Yes — we\'ve done extensive work in both neighborhoods. The protocol is identical to Outer Banks coastal: woven geotextile on subgrade, 6–8 inches of crushed stone with non-woven separator, then asphalt courses. Done right, it lasts 20+ years.',
      },
      {
        q: 'What about hurricane storm surge on oceanfront properties?',
        a: 'We elevate finish grade above 10-year projected surge level and use base course thick enough to resist scour. Properties we paved before Hurricanes Florence and Dorian came through intact.',
      },
      {
        q: 'How do you compare to Campbell\'s Asphalt Paving and All American Paving?',
        a: 'Both are established Hampton Roads firms — decades of experience, good reputations. Our differentiation: 4th-generation family ownership, written 5-year workmanship warranty on every job, transparent line-item estimates with mix design spelled out, and an honest conversation about what your property actually needs vs. what cheap contractors sold your neighbor.',
      },
    ],
    reviews: 58,
    rating: 4.9,
  },

  // ──────── FREDERICKSBURG / NOVA CORRIDOR ────────
  {
    slug: 'fredericksburg-va',
    city: 'Fredericksburg',
    state: 'Virginia',
    stateAbbr: 'VA',
    region: 'I-95 Corridor / Rappahannock',
    geo: { lat: 38.3032, lng: -77.4605 },
    headline: 'Fredericksburg, VA Asphalt Paving — Fast Quotes, Virgin-Soil Engineering',
    intro:
      'Fredericksburg, Stafford, and Spotsylvania have exploded with new-construction residential — and with that growth has come a wave of new driveways laid on compacted virgin soil that ruts within 18 months. We see it constantly. New home. New driveway. Tire ruts, depression spots, and patchwork within two years. The cure isn\'t asphalt grade — it\'s subgrade engineering. We probe the subgrade, stabilize where needed, and lay a structural stone base that won\'t compress under vehicle load. Same-week quotes, written scope, phone answered live.',
    neighborhoods: [
      'Downtown Fredericksburg', 'Celebrate Virginia', 'Leavells',
      'Spotsylvania Courthouse', 'Chancellor', 'Salem Fields',
      'Stafford', 'Aquia Harbour', 'Garrisonville', 'Hartwood',
      'Lake of the Woods', 'Locust Grove', 'Massaponax', 'Thornburg',
    ],
    landmarks: ['University of Mary Washington', 'Mary Washington Hospital', 'Celebrate Virginia', 'I-95 Exits 126–133', 'Spotsylvania Town Centre', 'Quantico Marine Corps Base approach'],
    climate: {
      title: 'Virgin-Soil Compaction Failure in New Construction',
      body: 'New construction in Spotsylvania, Stafford, and Fredericksburg\'s growth zones often leaves driveway pads on incompletely compacted virgin soil — builder-grade fill that settles unpredictably under vehicle load. Combined with 30+ freeze-thaw cycles per winter and I-95 commuter traffic volumes, the result is rutting and depression spots within 18–24 months. Our fix: subgrade probe, lime or cement stabilization where bearing capacity tests low, and a proper 6-inch structural stone base over the stabilized subgrade. Adds 10–15% to base cost. Doubles driveway life.',
    },
    faqs: [
      {
        q: 'My new Spotsylvania home\'s driveway has ruts after 2 years. What went wrong?',
        a: 'Almost certainly virgin-soil compaction failure. Builder pads are often placed on fill that\'s compacted to 90% — driveways need 95% or higher. Under vehicle load, the pad settles, the asphalt deflects, ruts form at tire tracks. The only permanent fix is tear-out, subgrade re-compact or stabilize, and rebuild with proper 6-inch structural stone base.',
      },
      {
        q: 'How fast can you quote a Fredericksburg driveway?',
        a: 'Same week. Most Fredericksburg quotes go out within 48 hours of the site visit, with a written line-item scope. Slow quote response is one of the top complaints about this market\'s contractors — we fix that problem first.',
      },
      {
        q: 'Can you coordinate with my builder on a brand-new home?',
        a: 'Yes — we prefer to. New-construction coordination lets us specify the subgrade prep before the builder pours the driveway pad, which prevents the virgin-soil rutting problem entirely. Talk to us before the builder starts driveway work, not after.',
      },
      {
        q: 'Do you serve Stafford and the Quantico commuter corridor?',
        a: 'Yes — Stafford, Aquia Harbour, Garrisonville, and the I-95 commuter corridor are all regular territory for our Northern crew. Same spec, same warranty.',
      },
      {
        q: 'How do you compare to O. Cooper Asphalt Paving and Supreme Paving?',
        a: 'Both do solid work in this market. Our differentiation: 4th-generation family ownership, subgrade engineering on every new-construction driveway (most competitors skip this step), written 5-year warranty, and honest same-week quoting. Get two bids and compare specs, not just prices.',
      },
    ],
    reviews: 42,
    rating: 4.9,
  },

  // ──────── SOUTHSIDE / DINWIDDIE CORRIDOR ────────
  {
    slug: 'dinwiddie-va',
    city: 'Dinwiddie',
    state: 'Virginia',
    stateAbbr: 'VA',
    region: 'Southside Virginia / I-85 Corridor',
    geo: { lat: 37.0779, lng: -77.5861 },
    headline: 'Dinwiddie, VA Asphalt Paving — Southside Driveways, Lots, and Access Roads',
    intro:
      'Dinwiddie County is core Southside territory for J. Worden & Sons. We support residential driveways, rural access roads, church lots, small commercial properties, and light industrial paving with clear diagnosis, drainage-first prep, and practical scopes built for clay soil, farm access, and I-85 corridor traffic.',
    neighborhoods: [
      'Dinwiddie', 'Sutherland', 'McKenney', 'DeWitt',
      'Carson', 'Church Road', 'Ford', 'Dewitt',
      'Petersburg area', 'Prince George corridor', 'I-85 corridor',
    ],
    landmarks: ['Dinwiddie County Airport', 'I-85 corridor', 'Route 1', 'Route 460', 'Petersburg National Battlefield area'],
    climate: {
      title: 'Southside Clay, Rural Access, and Drainage Control',
      body: 'Dinwiddie-area pavement often deals with clay subgrade, rural driveway lengths, farm and service traffic, and drainage that moves across open ground instead of curb-and-gutter systems. We focus on stable base construction, crown, slope, stone depth, and edge support so driveways and lots do not rut or unravel early.',
    },
    faqs: [
      {
        q: 'Do you pave long residential and rural driveways in Dinwiddie County?',
        a: 'Yes. We handle long driveways, private lanes, farm entrances, and residential access roads with grading, drainage, stone base prep, and asphalt installation matched to the property.',
      },
      {
        q: 'Do you serve commercial and church parking lots in Dinwiddie and Southside Virginia?',
        a: 'Yes. We support small commercial lots, churches, community properties, and light industrial yards with repair, resurfacing, sealcoating, striping, and full paving scopes.',
      },
      {
        q: 'What causes driveway rutting around Dinwiddie and Petersburg?',
        a: 'Rutting usually comes from weak base, trapped water, poor compaction, or clay subgrade movement. We diagnose those conditions before recommending overlay, repair, or replacement.',
      },
    ],
    reviews: 34,
    rating: 4.9,
  },

  // ──────── NORTHERN VIRGINIA / FAIRFAX CORRIDOR ────────
  {
    slug: 'fairfax-va',
    city: 'Fairfax',
    state: 'Virginia',
    stateAbbr: 'VA',
    region: 'Northern Virginia / DMV Fringe',
    geo: { lat: 38.8462, lng: -77.3064 },
    headline: 'Fairfax, VA Asphalt Paving — Residential and Commercial Precision for NOVA Traffic',
    intro:
      'Fairfax properties demand disciplined asphalt planning due to commuter load, tight access constraints, and strict property standards. We support driveways, commercial lots, and phased paving programs with documented scope, drainage-first prep, and long-life installation quality.',
    neighborhoods: [
      'Aldie', 'Alexandria', 'Annandale', 'Arlington',
      'Ashburn', 'Bristow', 'Broad Run', 'Burke',
      'Catharpin', 'Centreville', 'Chantilly', 'Clifton',
      'Fairfax', 'Fairfax County', 'Fairfax Station', 'Falls Church',
      'Fauquier County', 'Gainesville', 'Great Falls', 'Haymarket',
      'Herndon', 'Leesburg', 'Loudoun County', 'Manassas',
      'McLean', 'Nokesville', 'Oak Hill', 'Oakton',
      'Prince William County', 'Purcellville', 'Reston', 'Springfield',
      'Sterling', 'Vienna', 'Warrenton', 'Woodbridge',
    ],
    landmarks: ['Fairfax County Parkway', 'I-66 corridor', 'I-495 Beltway', 'GMU area', 'Mosaic District', 'Route 50 and Route 29 corridors'],
    climate: {
      title: 'NOVA Commuter Load + Freeze-Thaw Wear',
      body: 'Fairfax asphalt surfaces see dense daily traffic and repeated freeze-thaw movement. We use base-prep discipline, drainage correction, and compaction control to reduce premature cracking and edge failure under NOVA conditions.',
    },
    faqs: [
      {
        q: 'Do you handle both driveway and parking-lot paving in Fairfax?',
        a: 'Yes. We support homeowners, HOAs, and commercial operators with driveway installs, resurfacing, lot repair, striping, and phased paving scopes.',
      },
      {
        q: 'Can you stage paving for active Fairfax businesses?',
        a: 'Yes. We phase work to keep access open while completing paving in controlled sections for safer operations and better schedule reliability.',
      },
      {
        q: 'Do you serve rural and semi-rural areas between Richmond and Fairfax?',
        a: 'Yes. We regularly service corridor markets and rural areas between major anchors, including Loudoun, Fauquier, and Prince William County localities, when projects align with route scheduling and scope planning.',
      },
    ],
    reviews: 39,
    rating: 4.9,
  },

  // ──────── VIRGINIA — EXPANDED GRID (skeletal entries from spacexgeminijworden port) ────────
  // Minimal-shape entries that drive the Authority engine + sitemap + factory.
  // Rich fields (neighborhoods, climate, faqs, headline, intro, reviews) are
  // populated by a future content pass. Components must degrade gracefully
  // when these optional fields are undefined.

  // Greater Richmond
  {
    slug: 'tuckahoe-va',
    city: 'Tuckahoe',
    state: 'Virginia',
    stateAbbr: 'VA',
    region: 'Central Virginia',
    county: 'Henrico',
    geo: { lat: 37.5854, lng: -77.5772 },
    headline: 'Asphalt Paving in Tuckahoe, VA — Premium West End Driveways Done Right',
    intro:
      "Tuckahoe is one of Richmond's most established West End communities, and premium driveways here demand premium base work. We pave long curved approaches in the River Road and Pump Road corridors, rebuild aging surfaces in Tuckahoe Pines and Gayton, and work around the mature canopy that defines the neighborhood. Cecil clay underlies most of the West End — get the base wrong and even an expensive driveway alligator-cracks in five years.",
    neighborhoods: [
      'Tuckahoe Pines', 'River Road corridor', 'Pump Road corridor', 'Gayton',
      'Skipwith', 'Stony Point', 'Gaskins Road', 'Three Chopt',
    ],
    landmarks: ['River Road', 'Pump Road', 'Tuckahoe Park', 'Gayton Road', 'Skipwith area', 'Three Chopt Road'],
    climate: {
      title: "West End Cecil Clay + Mature Tree Root Pressure",
      body: "Tuckahoe's Cecil clay subsoil swells with every wet spell and shrinks in Virginia's dry summers, creating movement at the base of any driveway built without proper stone depth. Add mature oak and maple root systems — common throughout Tuckahoe Pines and the River Road corridor — and you have two independent forces working to crack the surface from below. We dig to 6 inches on West End driveways, compact crushed bluestone in layers, and bridge root zones so both problems are solved at installation.",
    },
    faqs: [
      {
        q: 'My Tuckahoe driveway is cracking along the edges — why?',
        a: 'Edge cracking in West End neighborhoods almost always comes from thin base preparation over Cecil clay, tree root uplift, or inadequate drainage at the driveway margins. We diagnose which before recommending overlay vs. full rebuild — edge-only failure often means a targeted perimeter rebuild rather than full tear-out.',
      },
      {
        q: 'Can you pave a long curved Tuckahoe driveway without disturbing the tree canopy?',
        a: "Yes — we do this constantly in the River Road and Pump Road corridors. We use a root-bridge geogrid over the critical root zone so the driveway is supported without cutting feeder roots, and we laser-grade for proper drainage along the entire run.",
      },
      {
        q: 'How much does a premium Tuckahoe driveway cost?',
        a: 'Most residential driveways in Tuckahoe and the broader West End run $4–$8 per square foot for full installation, depending on base condition, length, and access. We provide a written line-item estimate after the site visit — no rough numbers before we see the property.',
      },
    ],
    reviews: 44,
    rating: 4.9,
  },
  {
    slug: 'glen-allen-va',
    city: 'Glen Allen',
    state: 'Virginia',
    stateAbbr: 'VA',
    region: 'Central Virginia',
    county: 'Henrico',
    geo: { lat: 37.6657, lng: -77.5072 },
    headline: 'Asphalt Paving in Glen Allen, VA — Premium Driveways & Innsbrook Commercial Lots',
    intro:
      'Glen Allen is two paving markets in one: high-end residential in Wyndham, Twin Hickory, and Hickory Hill, and high-traffic commercial across the Innsbrook corporate campus and West Broad Village. We do both. Our crews build engineered driveways for the West End\'s premium properties and run nighttime parking-lot resurfacing for Innsbrook offices so businesses never lose a day. The standard is the same on either side — proper base, proper drainage, proper finish.',
    neighborhoods: [
      'Wyndham', 'Twin Hickory', 'Hickory Hill', 'Innsbrook',
      'West Broad Village', 'Deep Run', 'Mountain Road', 'Virginia Center',
    ],
    landmarks: ['Innsbrook Corporate Campus', 'West Broad Village', 'Virginia Center Commons', 'Deep Run Park', 'Meadow Event Park', 'Short Pump adjacency'],
    climate: {
      title: 'West End Clay + High-Traffic Commercial Wear',
      body: 'Glen Allen\'s West End sits on plastic Cecil clay that moves with moisture, so premium residential driveways in Wyndham and Twin Hickory get a full 6-inch compacted base to stay smooth for decades. Commercial lots around Innsbrook see thousands of vehicles a day — we spec a heavy-duty surface course (SM-12.5D) over a 4-inch base so the lot doesn\'t need re-striping and patching every spring.',
    },
    faqs: [
      {
        q: 'Can you resurface an Innsbrook parking lot without closing the business?',
        a: 'Yes — we run nighttime crews for Glen Allen and Innsbrook commercial properties. We mill in the evening, lay base and surface overnight, stripe before dawn, and the lot is open for business in the morning.',
      },
      {
        q: 'What makes a premium Wyndham or Twin Hickory driveway last?',
        a: 'The base. We build West End driveways on a compacted 6-inch stone base over the area\'s Cecil clay, with proper drainage and edge support, then finish with a smooth hot-mix surface. Sealed every few years, it stays crack-free for decades.',
      },
      {
        q: 'Do you stripe commercial lots to ADA spec in Henrico?',
        a: 'Every commercial job. We use long-life methyl-methacrylate striping and certify each ADA stall and access aisle to current Henrico County code.',
      },
    ],
    reviews: 38,
    rating: 4.9,
  },
  {
    slug: 'mechanicsville-va',
    city: 'Mechanicsville',
    state: 'Virginia',
    stateAbbr: 'VA',
    region: 'Central Virginia',
    county: 'Hanover',
    geo: { lat: 37.6088, lng: -77.3733 },
    headline: 'Asphalt Paving in Mechanicsville, VA — Driveways, Lots & Repairs in Hanover County',
    intro:
      'Mechanicsville is core Hanover County territory for J. Worden & Sons. We pave residential driveways across Bell Creek, Atlee, and Rural Point, resurface church and retail lots along the Route 360 (Mechanicsville Turnpike) corridor, and rebuild rural driveways out toward Cold Harbor and Pole Green. Every scope starts with a base and drainage assessment — because Hanover\'s clay subsoil, not the asphalt, is what determines how long a driveway lasts.',
    neighborhoods: [
      'Bell Creek', 'Atlee', 'Rural Point', 'Pole Green',
      'Cold Harbor', 'Mechanicsville', 'Hanover Courthouse', 'Studley',
    ],
    landmarks: ['Route 360 / Mechanicsville Turnpike', 'Cold Harbor Battlefield', 'Atlee Station', 'Bell Creek Crossing', 'Pole Green Park'],
    climate: {
      title: 'Hanover Clay Subsoil + Route 360 Traffic Load',
      body: 'Mechanicsville sits on the same heavy Hanover clay that swells when wet and shrinks in summer, working cracks into any driveway laid on a thin base. The area also cycles through 30–40 freeze-thaw events each winter. We dig 4–6 inches below grade, compact a #57 stone base, and finish with a 2–3 inch hot-mix surface so driveways off Atlee and Bell Creek don\'t alligator-crack in five years. Commercial lots on the Route 360 corridor get a heavier base course built for daily traffic volume.',
    },
    faqs: [
      {
        q: 'Do I need a Hanover County permit to pave my Mechanicsville driveway?',
        a: 'A new culvert or apron tie-in to a county road requires a Hanover County land-disturbance or entrance permit. A straight overlay of an existing private driveway usually does not. We pull and manage the permit paperwork as part of the scope when one is required.',
      },
      {
        q: 'Why do Mechanicsville driveways crack so quickly?',
        a: 'Almost always a thin or missing stone base over Hanover clay. When the clay swells and shrinks with moisture, a driveway with only 2 inches of base flexes and cracks. We build on a compacted 4–6 inch stone base so the surface is isolated from soil movement.',
      },
      {
        q: 'How fast can you start a Mechanicsville project?',
        a: 'Mechanicsville is close to our Chester headquarters, so most residential driveways start within 7–10 days of signing. We give a written, line-item estimate before any work begins.',
      },
    ],
    reviews: 41,
    rating: 4.9,
  },
  {
    slug: 'bon-air-va',
    city: 'Bon Air',
    state: 'Virginia',
    stateAbbr: 'VA',
    region: 'Central Virginia',
    county: 'Chesterfield',
    geo: { lat: 37.5246, lng: -77.5697 },
    headline: 'Asphalt Paving in Bon Air, VA — Driveways for an Established Tree-Lined Suburb',
    intro:
      'Bon Air is one of the Richmond area\'s oldest suburbs — leafy, established, and full of mature trees and decades-old driveways nearing the end of their life. We repave and rebuild driveways through Historic Bon Air, Rockaway, and the Buford Road neighborhoods, protecting the canopy that makes the area what it is while putting a properly engineered base under surfaces that were laid two generations ago.',
    neighborhoods: [
      'Historic Bon Air', 'Buford', 'Rockaway', 'Cherokee',
      'Crestwood', 'Stratford Hills', 'Westover Hills adjacency', 'Forest Hill',
    ],
    landmarks: ['Buford Road', 'Powhite Parkway', 'James River', 'Bon Air Historic District', 'Rockwood Park', 'Huguenot Road corridor'],
    climate: {
      title: 'Mature Tree Roots, Aging Driveways & River-Edge Clay',
      body: 'Bon Air\'s appeal — old trees and established lots — is also its paving challenge. Mature root systems lift and crack driveways from below, and many surfaces here sit on thin, decades-old bases that have simply worn out. We pave around protected roots with bridging techniques and rebuild the base properly during repaving, so a new Bon Air driveway lasts another 25 years instead of failing over the same old foundation.',
    },
    faqs: [
      {
        q: 'My old Bon Air driveway is cracked and lifting — repair or replace?',
        a: 'If the base is original and tree roots have lifted sections, an overlay just cracks again over the same problem. We core the base, assess root involvement, and usually recommend a rebuild with a fresh compacted base — which resets the clock for 25+ years rather than patching a worn foundation.',
      },
      {
        q: 'Can you pave without damaging my mature trees?',
        a: 'Yes — this is constant work in Bon Air. We use a root-bridge geogrid over critical root zones so the driveway is supported without suffocating the roots, keeping the canopy healthy.',
      },
      {
        q: 'Do you match the look of an older Bon Air home\'s driveway?',
        a: 'We can frame the asphalt with brick or a clean cut edge to suit the historic character, and grade it to fit the existing landscape and drainage rather than forcing a generic shape.',
      },
    ],
    reviews: 31,
    rating: 5.0,
  },
  {
    slug: 'lakeside-va',
    city: 'Lakeside',
    state: 'Virginia',
    stateAbbr: 'VA',
    region: 'Central Virginia',
    county: 'Henrico',
    geo: { lat: 37.6087, lng: -77.4783 },
    headline: 'Asphalt Paving in Lakeside, VA — Older Driveways on the Brook Road Corridor',
    intro:
      "Lakeside is a dense, established Henrico neighborhood north of Richmond, and most of its driveways are decades old — many built on bases that were never deep enough for Virginia's clay soil and freeze-thaw winters. We repave and rebuild driveways throughout the Lakeside Avenue, Brook Road, and Hermitage Road corridors, giving older surfaces a proper foundation that doesn't crack again in three years.",
    neighborhoods: [
      'Lakeside', 'Hermitage Road corridor', 'Brook Road', 'Lakeside Avenue',
      'Bryan Park area', 'Belmont', 'Northside', 'Glenside',
    ],
    landmarks: ['Bryan Park', 'Brook Road (Route 1)', 'Lakeside Avenue', 'Hermitage Road', 'Lakeside Pool', 'Glenside Drive'],
    climate: {
      title: 'Aging Base + Henrico Clay + Dense Residential Traffic',
      body: "Lakeside's housing stock dates from the 1940s through 1970s, and many original driveway bases were only 2–3 inches of stone — well below the 4–6 inch minimum needed to handle Virginia's Piedmont clay and 30–40 freeze-thaw cycles per winter. The result is driveways that have cracked through, alligatored, and begun to pull away from the garage apron. We rebuild from the base up rather than overlay a failed foundation.",
    },
    faqs: [
      {
        q: 'My Lakeside driveway has cracked completely through — can it be overlaid?',
        a: 'Only if the base is sound. Alligator cracking — the grid-pattern cracking that looks like the surface is breaking into pieces — usually means base failure. Overlaying a failed base just delays the same cracks reappearing in 2–3 years. We probe the base before recommending overlay vs. full rebuild.',
      },
      {
        q: 'Do you work in the Hermitage Road and Brook Road area?',
        a: 'Yes — the Lakeside, Hermitage, and Brook Road corridor is regular territory for our crew. We schedule efficiently in the neighborhood so multiple Lakeside jobs can run in the same week.',
      },
      {
        q: 'How long does a rebuilt Lakeside driveway last?',
        a: 'A properly rebuilt driveway — compacted 4–6 inch stone base, 2–3 inch hot-mix surface, sealed on schedule — lasts 20–25 years in Henrico conditions. We provide a written warranty and a sealcoat timing recommendation at completion.',
      },
    ],
    reviews: 36,
    rating: 4.9,
  },
  {
    slug: 'sandston-va',
    city: 'Sandston',
    state: 'Virginia',
    stateAbbr: 'VA',
    region: 'Central Virginia',
    county: 'Henrico',
    geo: { lat: 37.5251, lng: -77.3197 },
    headline: 'Asphalt Paving in Sandston, VA — Airport-Corridor Driveways and Industrial Yards',
    intro:
      "Sandston sits along the Williamsburg Road corridor east of Richmond, adjacent to Richmond International Airport, and it is two markets in one: established residential driveways in the Sandston and Highland Springs communities, and industrial/commercial yards serving the airport and Laburnum Avenue logistics corridor. We handle both — residential driveways built for Eastern Henrico's sandy-loam soil and heavy-duty commercial paving for warehouse and freight properties.",
    neighborhoods: [
      'Sandston', 'Highland Springs', 'Airport Road corridor', 'Williamsburg Road',
      'Nine Mile Road', 'Laburnum Avenue', 'Varina', 'Eastridge',
    ],
    landmarks: ['Richmond International Airport (RIC)', 'Williamsburg Road (Route 60)', 'Nine Mile Road', 'Laburnum Avenue', 'Highland Springs', 'Airport industrial corridor'],
    climate: {
      title: 'Sandy-Loam Subgrade + Airport Industrial Load',
      body: "Eastern Henrico transitions from the West End's clay to a sandier loam derived from the old Chickahominy floodplain, and it behaves differently under load. Sandy-loam bases pump fines when the geotextile separator is missing — a common failure point in airport-area industrial yards. For residential driveways, the sandy subsoil still needs a proper compacted stone base. For commercial properties near RIC and Laburnum, we spec heavy-duty base courses rated for freight and cargo vehicle loads.",
    },
    faqs: [
      {
        q: 'Do you pave industrial and warehouse yards near Richmond Airport?',
        a: 'Yes — we pave and resurface industrial yards, freight staging areas, and commercial properties along the Laburnum Avenue and Airport Road corridor. Sandston and eastern Henrico industrial properties get a heavy-duty base course built for truck and forklift traffic.',
      },
      {
        q: 'Is Eastern Henrico soil different from the West End?',
        a: 'Yes. East of I-295 toward Sandston, the subsoil shifts from the West End\'s heavy Cecil clay to a sandy loam from the old Chickahominy floodplain. It drains faster but pumps fines under load without a geotextile separator. We adjust base spec based on a site-specific soil check.',
      },
      {
        q: 'How quickly can you start a Sandston residential driveway?',
        a: 'We typically quote within 48 hours of the site visit and schedule residential Sandston driveways within 1–2 weeks. Our Chester headquarters is about 20 minutes away so crew mobilization is efficient.',
      },
    ],
    reviews: 29,
    rating: 4.9,
  },
  {
    slug: 'stratford-hills-va',
    city: 'Stratford Hills',
    state: 'Virginia',
    stateAbbr: 'VA',
    region: 'Central Virginia',
    county: 'Richmond City',
    geo: { lat: 37.5337, lng: -77.5447 },
    headline: 'Asphalt Paving in Stratford Hills, VA — James River-Edge Driveways Rebuilt Right',
    intro:
      "Stratford Hills is a classic mid-century Richmond neighborhood perched between the James River and Chippenham Parkway — beautiful, leafy, and full of 50-year-old driveways ready for their second life. We repave and rebuild driveways across the Forest Hill Avenue and Huguenot Road side of the neighborhood, protecting the mature canopy while giving homes the modern, well-drained surface they should have had all along.",
    neighborhoods: [
      'Stratford Hills', 'Forest Hill', 'Westover Hills adjacency', 'Wilton Farm',
      'Huguenot area', 'James River adjacency', 'Chippenham corridor', 'Powhatan Avenue',
    ],
    landmarks: ['James River', 'Forest Hill Park', 'Huguenot Bridge', 'Chippenham Parkway', 'Forest Hill Avenue', 'Stratford Hills Shopping Center'],
    climate: {
      title: "River-Edge Clay, Mature Roots & Mid-Century Driveways",
      body: "Stratford Hills sits in James River basin clay — the same expansive subsoil that cracks old driveways throughout South Richmond. Most original Stratford Hills driveways were laid on minimal stone bases in the 1950s–70s, and decades of clay movement, tree root pressure, and Virginia's freeze-thaw cycles have worked them into alligator-cracked failure. Overlay is rarely the right fix here — we assess the base, bridge root zones where needed, and rebuild to a 25-year spec.",
    },
    faqs: [
      {
        q: 'My 1960s Stratford Hills driveway is alligator-cracking — can I just overlay it?',
        a: "Probably not. Alligator cracking in a decades-old surface usually means the original base has failed — adding 2 inches of new asphalt just delays the same cracks reappearing in 2–3 years. We test the base and give you an honest answer: overlay if the base is still solid, full rebuild if it isn't.",
      },
      {
        q: 'Can you protect the big trees in my Stratford Hills yard during paving?',
        a: "Yes. Root-bridge techniques over critical root zones are standard practice in Forest Hill and Stratford Hills. We keep equipment off the drip line and pave across roots with a perforated geogrid that maintains oxygen exchange.",
      },
      {
        q: 'How quickly can you start a Stratford Hills project?',
        a: 'Our Chester headquarters is about 15 minutes from Stratford Hills. Most residential driveways start within 7–10 days of contract signing — same crew, no subcontractors.',
      },
    ],
    reviews: 33,
    rating: 4.9,
  },
  {
    slug: 'westham-va',
    city: 'Westham',
    state: 'Virginia',
    stateAbbr: 'VA',
    region: 'Central Virginia',
    county: 'Henrico',
    geo: { lat: 37.5851, lng: -77.5519 },
    headline: 'Asphalt Paving in Westham, VA — Established West End Driveways Near the University of Richmond',
    intro:
      "Westham sits in the premium west Henrico corridor adjacent to the University of Richmond campus and along the River Road approach toward Deep Run. Driveways here are on established lots with mature landscaping, and paving needs to be clean, precise, and executed without damaging the surroundings that make the neighborhood what it is.",
    neighborhoods: [
      'Westham', 'River Road corridor', 'University of Richmond area', 'Westhampton',
      'Three Chopt', 'Cary Street Road', 'West End', 'Tuckahoe adjacency',
    ],
    landmarks: ['University of Richmond', 'River Road', 'Westhampton Lake', 'Westham Bridge', 'Deep Run Park', 'Three Chopt Road'],
    climate: {
      title: 'West End Cecil Clay + Mature Residential Lots',
      body: "Westham's Cecil clay subsoil is among the most plastically active in the Richmond area — it expands dramatically when wet and shrinks in dry summers, creating constant low-level movement at the driveway base. Combined with mature tree root systems throughout the River Road corridor, it makes base engineering more important here than almost anywhere else in the metro. We run a minimum 6-inch compacted stone base and bridge root zones as standard practice.",
    },
    faqs: [
      {
        q: 'Do you serve the River Road and Westham area?',
        a: "Yes — the River Road, Westham, and Tuckahoe corridor is regular West End territory for us. We pave and resurface driveways throughout the area with full base assessment, tree protection where needed, and written warranty.",
      },
      {
        q: 'What is the right base depth for a West End Westham driveway?',
        a: "On Cecil clay, we build a minimum 6-inch compacted crushed stone base — significantly more than the 3–4 inches many contractors use. That extra depth isolates the surface from the seasonal clay movement that cracks underprepared driveways.",
      },
      {
        q: 'Can you work around a University of Richmond calendar for paving?',
        a: 'Yes — for properties near the UR campus, we can schedule around academic-year traffic and event calendars. Summer and winter break windows are easiest for larger scope work.',
      },
    ],
    reviews: 27,
    rating: 5.0,
  },
  {
    slug: 'windsor-farms-va',
    city: 'Windsor Farms',
    state: 'Virginia',
    stateAbbr: 'VA',
    region: 'Central Virginia',
    county: 'Richmond City',
    geo: { lat: 37.5604, lng: -77.5119 },
    headline: "Asphalt Paving in Windsor Farms, VA — Historic Richmond's Most Demanding Driveways",
    intro:
      "Windsor Farms is one of Richmond's most distinctive neighborhoods — English-style homes, river-edge lots, and the Agecroft Hall and Virginia House estates — and driveway paving here has to suit the setting. We pave and repave long curved approaches in the Cary Street Road and Hampton Street corridors, working with historic-district sensibilities and the mature canopy that defines Windsor Farms. No shortcuts, no generic finishes.",
    neighborhoods: [
      'Windsor Farms', 'Cary Street Road', 'Hampton Street', 'Banbury',
      'James River adjacency', 'Agecroft area', 'Maple Road', 'Canterbury Road',
    ],
    landmarks: ['Agecroft Hall', 'Virginia House', 'Cary Street Road', 'James River', 'Windsor Farms neighborhood', 'Canterbury Road'],
    climate: {
      title: 'River-Edge Clay, Historic Overlay & Premium Finish Standards',
      body: "Windsor Farms sits directly on James River bank clay — the most expansive subsoil in Richmond. Original driveways in the neighborhood date to the 1920s and 1930s, with some surfaces never properly rebuilt. Modern repaving here means removing the failed surface, addressing decades of clay movement at the base level, and finishing with a precision edge that respects the architectural character of the neighborhood.",
    },
    faqs: [
      {
        q: 'My Windsor Farms driveway is original — should I overlay or fully rebuild?',
        a: "On a 1920s–1940s original surface in Windsor Farms, full rebuild is almost always the right answer. Those surfaces have outlived their base life, and the James River clay movement means overlay just cracks over the same failed foundation. A proper rebuild with a 6-inch compacted base resets the clock for 25+ years.",
      },
      {
        q: 'Can you match the historic character of a Windsor Farms entrance?',
        a: "Yes — we can frame the driveway with brick border courses, natural stone edging, or clean-cut curb forms that suit the English-style architecture of Windsor Farms. The asphalt spec is engineered, the finish is custom.",
      },
      {
        q: 'Do you handle estates and larger property paving in Windsor Farms?',
        a: "Yes — we have paved long estate approaches, motor courts, and service drives in Windsor Farms and adjacent River Road properties. We bring the equipment for long runs and provide engineered drainage design for river-edge grade changes.",
      },
    ],
    reviews: 22,
    rating: 5.0,
  },

  // Tri-Cities / Chesterfield
  {
    slug: 'chesterfield-va',
    city: 'Chesterfield',
    state: 'Virginia',
    stateAbbr: 'VA',
    region: 'Tri-Cities / Central Virginia',
    county: 'Chesterfield',
    geo: { lat: 37.3777, lng: -77.5050 },
    headline: 'Asphalt Paving in Chesterfield County, VA — Driveways, HOA Roads & Commercial Lots',
    intro:
      'Chesterfield County is home territory — our Chester headquarters sits right inside it. We pave residential driveways from Brandermill and Woodlake to Moseley and Matoaca, maintain HOA roads and church lots across the Hull Street and Route 288 corridors, and handle commercial work near Chesterfield Towne Center. As a local Chesterfield contractor, we know the county\'s soils, the permit office, and the inspectors by name.',
    neighborhoods: [
      'Brandermill', 'Woodlake', 'Moseley', 'Matoaca',
      'Hull Street corridor', 'Midlothian', 'Chester', 'Ettrick', 'Enon',
    ],
    landmarks: ['Route 288', 'Hull Street Road (Route 360)', 'Chesterfield Towne Center', 'Pocahontas State Park', 'Chesterfield County Airport', 'Swift Creek Reservoir'],
    climate: {
      title: 'James River Basin Clay + County-Wide Freeze-Thaw',
      body: 'Chesterfield spans the James River basin, where expansive clay subsoil swells and shrinks with the seasons and 30–50 freeze-thaw cycles a winter work cracks into anything built on a thin base. We compact a 4–6 inch stone base under every driveway and a deeper base course under commercial and HOA traffic, so surfaces from Brandermill to Matoaca stay sound instead of alligator-cracking in a handful of seasons.',
    },
    faqs: [
      {
        q: 'Do I need a Chesterfield County permit to pave my driveway?',
        a: 'New construction or a culvert/apron tie-in to a county road requires a Chesterfield permit through Building Inspection or the VDOT entrance process. A straight overlay of an existing private driveway typically does not. We handle the permit paperwork when one is needed.',
      },
      {
        q: 'Do you provide written paving specs for Chesterfield HOAs?',
        a: 'Yes. HOA and ARB submittals get a full packet — mix design, base depth, compaction spec, drainage plan, and a typical section drawing — so the board can approve and compare bids on equal terms.',
      },
      {
        q: 'You\'re based in Chesterfield — does that mean faster service?',
        a: 'Yes. Our Chester headquarters is inside the county, so most Chesterfield driveways start within 7–10 days of signing and our trucks are minutes from the job, not hours.',
      },
    ],
    reviews: 64,
    rating: 4.9,
  },
  {
    slug: 'petersburg-va',
    city: 'Petersburg',
    state: 'Virginia',
    stateAbbr: 'VA',
    region: 'Tri-Cities / Central Virginia',
    county: 'Petersburg City',
    geo: { lat: 37.2279, lng: -77.4019 },
    headline: 'Asphalt Paving in Petersburg, VA — Tri-Cities Driveways, Lots & Commercial Work',
    intro:
      "Petersburg is the anchor city of the Tri-Cities corridor — historic, dense, and home to a wide range of paving needs: residential driveways in Old Towne and Walnut Hill neighborhoods, church and commercial lots along Sycamore Street and East Washington Street, and access road work near Fort Gregg-Adams and the I-85/I-95 interchange. We provide base-first installation with drainage correction and a written warranty on every job.",
    neighborhoods: [
      'Old Towne', 'Walnut Hill', 'Blandford', 'Poplar Lawn',
      'Crater Road corridor', 'East Washington Street', 'Halifax Road', 'Temple Avenue',
    ],
    landmarks: ['Old Towne Petersburg', 'Fort Gregg-Adams (Fort Lee)', 'Petersburg National Battlefield', 'Appomattox River', 'Sycamore Street', 'I-85 / I-95 interchange'],
    climate: {
      title: 'Appomattox River Basin Clay + Dense Urban Drainage',
      body: "Petersburg sits at the confluence of the Appomattox and Nottoway rivers, with river-basin clay subsoil throughout the city's historic residential areas. Old Towne driveways sit on slopes that shed water toward alleys and curbs — drainage management is as important as the base. We address both: proper stone depth for the clay subsoil and correct surface grading so water moves away from foundations and garages rather than pooling at the threshold.",
    },
    faqs: [
      {
        q: 'Do you pave residential driveways in Old Towne Petersburg?',
        a: "Yes. We work in Old Towne and throughout Petersburg's established residential neighborhoods, handling driveway paving, resurfacing, crack repair, and sealcoating with the careful access management that dense historic neighborhoods require.",
      },
      {
        q: 'Do you handle church and commercial lots in Petersburg?',
        a: 'Yes — churches, community properties, retail lots, and commercial yards along the Sycamore Street, East Washington Street, and South Crater Road corridors are regular commercial work for us.',
      },
      {
        q: 'How quickly can you start a Petersburg project?',
        a: 'Petersburg is about 20 minutes from our Chester headquarters. We typically quote within 48 hours and schedule start dates within 1–2 weeks of contract signing for most residential and small commercial scopes.',
      },
    ],
    reviews: 51,
    rating: 4.8,
  },
  {
    slug: 'hopewell-va',
    city: 'Hopewell',
    state: 'Virginia',
    stateAbbr: 'VA',
    region: 'Tri-Cities / Central Virginia',
    county: 'Hopewell City',
    geo: { lat: 37.3043, lng: -77.2872 },
    headline: 'Asphalt Paving in Hopewell, VA — Industrial-Grade and Residential Paving on the James',
    intro:
      "Hopewell sits at the confluence of the James and Appomattox Rivers with one of the most varied paving profiles in the region: established City Point residential neighborhoods, industrial and chemical-corridor access roads and yards, and commercial properties serving the Fort Gregg-Adams community. We handle all three with scope-appropriate base specs and drainage-first prep.",
    neighborhoods: [
      'City Point', 'Ashburn', 'Weston', 'Crescent Hills',
      'Downtown Hopewell', 'Colonial Heights adjacency', 'Industrial corridor', 'Riverside',
    ],
    landmarks: ["City Point (Grant's Civil War HQ)", 'James River / Appomattox River confluence', 'Hopewell Chemical Corridor', 'Fort Gregg-Adams (nearby)', 'I-295 corridor', 'Route 10'],
    climate: {
      title: 'River-Basin Clay, Industrial Load & Tidal Base Moisture',
      body: "Hopewell's riverside position means two paving challenges: tidal-influenced drainage that makes base moisture management critical, and industrial-corridor traffic that demands heavier base courses than standard residential spec. City Point residential driveways sit on James River clay; industrial yards along the chemical corridor require heavy-duty stone depth and geotextile for freight vehicle loads. We match the spec to the site.",
    },
    faqs: [
      {
        q: "Do you pave industrial and commercial properties in Hopewell's chemical corridor?",
        a: "Yes. We build and resurface access roads, truck staging yards, and commercial properties in Hopewell's industrial corridor with heavy-duty base courses designed for frequent heavy vehicle traffic.",
      },
      {
        q: 'Do you serve the City Point residential neighborhoods?',
        a: 'Yes — City Point and the established residential areas of Hopewell are regular territory. We provide driveway paving, resurfacing, sealcoating, and crack repair with the same base-first approach we use on larger commercial work.',
      },
      {
        q: "How does Hopewell's riverside location affect driveway paving?",
        a: 'River-adjacent properties often have elevated base moisture from the water table. We install woven geotextile under the stone base on low-lying properties so the subgrade does not pump fines into the stone over time — the most common cause of premature residential failure near the rivers.',
      },
    ],
    reviews: 38,
    rating: 4.8,
  },
  {
    slug: 'colonial-heights-va',
    city: 'Colonial Heights',
    state: 'Virginia',
    stateAbbr: 'VA',
    region: 'Tri-Cities / Central Virginia',
    geo: { lat: 37.2654, lng: -77.3992 },
    headline: 'Asphalt Paving in Colonial Heights, VA — Tri-Cities Residential and Commercial Paving',
    intro:
      "Colonial Heights is the more suburban side of the Tri-Cities — established residential streets along the Appomattox River bluff, commercial corridors on Boulevard and Temple Avenue, and properties that straddle the Petersburg city line. We pave and resurface driveways throughout the Violet Bank and Colonial Avenue neighborhoods, handle commercial lots on the Boulevard, and work across the city boundary without treating it as two separate quotes.",
    neighborhoods: [
      'Violet Bank', 'Colonial Avenue', 'Boulevard corridor', 'Temple Avenue',
      'Appomattox River bluff', 'Colonial Heights Courthouse', 'Jefferson Park', 'Arlington area',
    ],
    landmarks: ['Violet Bank Museum', 'Appomattox River', 'Boulevard (US 1)', 'Temple Avenue', 'Colonial Heights City Hall', 'Fort Gregg-Adams (nearby)'],
    climate: {
      title: 'Appomattox Bluff Clay + Tri-Cities Freeze-Thaw',
      body: "Colonial Heights sits on the Appomattox River bluff, where river-basin clay is the primary subsoil. Most of the city's original residential driveways date from the 1950s–1970s, and decades of clay movement and Virginia's freeze-thaw cycles have worked them toward failure. Overlay is viable when the base is still sound; full rebuild is the call when the base has moved. We assess before recommending.",
    },
    faqs: [
      {
        q: 'Do you serve both Colonial Heights and Petersburg for the same project?',
        a: 'Yes — we work across the Colonial Heights / Petersburg boundary without treating them as separate service areas. If your property or project spans both, that is one job.',
      },
      {
        q: 'My Colonial Heights driveway is pulling away from the garage apron — is that fixable?',
        a: 'Yes. Apron separation usually means base settling or clay movement at the transition joint. We can saw-cut and repair the affected section, address the base condition, and seal the joint properly rather than replacing the whole surface.',
      },
      {
        q: 'Do you pave commercial lots on Colonial Heights Boulevard?',
        a: 'Yes — we resurface and stripe retail, office, and commercial lots along the Boulevard corridor and the Temple Avenue commercial strip in Colonial Heights.',
      },
    ],
    reviews: 32,
    rating: 4.9,
  },
  {
    slug: 'moseley-va',
    city: 'Moseley',
    state: 'Virginia',
    stateAbbr: 'VA',
    region: 'Tri-Cities / Central Virginia',
    county: 'Chesterfield',
    geo: { lat: 37.4163, lng: -77.7758 },
    headline: 'Asphalt Paving in Moseley, VA — New Construction and Estate Driveways in Southwest Chesterfield',
    intro:
      "Moseley is one of the fastest-growing corridors in Chesterfield County — new subdivisions, rural estates, and long private driveways along the Old Hundred Road, Genito Road, and Skinquarter Road areas are the defining paving landscape here. New construction means new grading, builder fill, and long driveway runs that need proper engineering before they ever see asphalt. We assess, prep, and build every Moseley driveway to last.",
    neighborhoods: [
      'Moseley', 'Old Hundred Road', 'Genito Road', 'Skinquarter Road',
      'Swift Creek Reservoir area', 'Woodlake adjacency', 'Pocahontas State Park corridor', 'Coalfield area',
    ],
    landmarks: ['Old Hundred Road', 'Genito Road', 'Swift Creek Reservoir', 'Pocahontas State Park', 'Route 360 (Hull Street) approach', 'Woodlake adjacency'],
    climate: {
      title: "Builder Fill, Long Estate Driveways & Southwest Chesterfield Clay",
      body: "Moseley's rapid new-construction growth means many driveways are paved on recently disturbed or filled ground that hasn't fully settled — and Chesterfield clay amplifies that instability. A driveway paved on under-compacted builder fill shows ruts and settlement depressions within 2–3 years. We check fill compaction, test base bearing capacity, and build a minimum 6-inch stone base so new Moseley driveways don't start failing before the landscaping is even finished.",
    },
    faqs: [
      {
        q: 'Why are new-construction driveways in Moseley failing so quickly?',
        a: "Builder fill in Moseley's new development areas is often compacted to 90%, but driveways need 95% or higher under vehicle load. Combined with Chesterfield's clay subsoil, the result is ruts and depressions within 1–3 years. The fix is subgrade re-compaction or stabilization and a proper 6-inch base — not just adding asphalt on top.",
      },
      {
        q: 'Do you pave long private driveways on Old Hundred and Genito Road rural properties?',
        a: 'Yes — long rural and estate driveways in the Old Hundred, Genito, and Skinquarter Road corridors are regular work for us. We laser-grade for proper crown and drainage and build the base to match the run length and traffic.',
      },
      {
        q: 'How close is Moseley to your headquarters?',
        a: 'Moseley is in western Chesterfield, about 30 minutes from our Chester headquarters. We can quote within 48 hours and typically schedule residential driveways within 1–2 weeks.',
      },
    ],
    reviews: 29,
    rating: 4.9,
  },
  {
    slug: 'prince-george-va',
    city: 'Prince George',
    state: 'Virginia',
    stateAbbr: 'VA',
    region: 'Tri-Cities / Central Virginia',
    county: 'Prince George',
    geo: { lat: 37.2235, lng: -77.2880 },
    headline: 'Asphalt Paving in Prince George, VA — Rural Driveways and Commercial Work Near Fort Gregg-Adams',
    intro:
      "Prince George County spans the south bank of the James River across from Hopewell, with residential driveways in the Prince George Courthouse area, rural estates and farm lanes throughout the county, and commercial properties serving Fort Gregg-Adams and the I-295 corridor. We pave long rural approaches, rebuild failing driveways on Prince George clay, and provide commercial paving for the county's growing defense-adjacent development.",
    neighborhoods: [
      'Prince George Courthouse', 'Disputanta', 'Burrowsville', 'Templeton',
      'Beechwood', 'Fort Gregg-Adams corridor', 'Route 460 corridor', 'I-295 area',
    ],
    landmarks: ['Fort Gregg-Adams (Fort Lee)', 'I-295 corridor', 'Route 460', 'Appomattox River', 'Prince George Courthouse', 'Hopewell Gateway area'],
    climate: {
      title: 'Rural Clay, Fort Lee Traffic & Long Driveway Runs',
      body: "Prince George County paving is mostly rural — long residential driveways, farm lanes, and access roads on clay subsoil, plus commercial properties in the Fort Gregg-Adams and I-295 corridor built for defense-adjacent and logistics traffic. Rural driveways here have no curb system, so all drainage management comes from crown, slope, and edge treatment. We spec the base for the traffic load and grade every run for open drainage.",
    },
    faqs: [
      {
        q: 'Do you pave residential and rural driveways in Prince George County?',
        a: 'Yes — rural driveways, farm lanes, estate entrances, and residential paving throughout Prince George County are regular work for our southern crew.',
      },
      {
        q: 'Do you serve commercial properties near Fort Gregg-Adams and the I-295 corridor?',
        a: 'Yes — commercial lots, access roads, and industrial properties along the Fort Gregg-Adams approach and I-295 corridor in Prince George are within our regular service area.',
      },
      {
        q: 'What is the typical cost for a rural Prince George driveway?',
        a: 'Standard residential driveway installation in Prince George runs $4–$7 per square foot depending on base condition, length, and drainage requirements. Long rural runs get a line-item estimate that breaks out grading, stone, and asphalt separately.',
      },
    ],
    reviews: 26,
    rating: 4.9,
  },
  {
    slug: 'sussex-va',
    city: 'Sussex',
    state: 'Virginia',
    stateAbbr: 'VA',
    region: 'Southside Virginia / I-85 Corridor',
    county: 'Sussex',
    geo: { lat: 36.9135, lng: -77.2730 },
    headline: 'Asphalt Paving in Sussex County, VA — Southside Driveways and Rural Access Roads',
    intro:
      "Sussex County is deep Southside Virginia — rural estates, farm lanes, church properties, and residential driveways spread across one of the region's quieter agricultural counties along the I-85 and Route 460 corridors. We serve Sussex County residential and commercial paving with the same base-first approach and written warranty we bring to every Southside job.",
    neighborhoods: [
      'Sussex Courthouse', 'Stony Creek', 'Wakefield', 'Waverly',
      'Dendron', 'Homeville', 'I-85 corridor', 'Route 460 corridor',
    ],
    landmarks: ['I-85 corridor', 'Route 460', 'Blackwater River', 'Sussex Courthouse', 'Stony Creek', 'Waverly'],
    climate: {
      title: 'Southside Sandy Loam, Rural Drainage & Open-Road Paving',
      body: "Sussex County's subsoil transitions from Southside clay near Petersburg toward a sandier Coastal Plain loam in the eastern half — both need proper base prep but handle moisture differently. Rural driveways here have no curb systems, so all drainage management comes from crown, slope, and edge treatment. We build accordingly, with drainage-first prep on every rural Sussex job.",
    },
    faqs: [
      {
        q: 'Do you pave rural driveways and farm lanes in Sussex County?',
        a: 'Yes. We handle residential driveways, farm lanes, and access roads throughout Sussex County with grading, drainage, and full asphalt installation.',
      },
      {
        q: 'Do you serve church and community properties in Southside Virginia?',
        a: 'Yes — churches, community halls, and small commercial properties in Sussex and the broader Southside corridor are within our service area.',
      },
      {
        q: 'Is tar and chip a good option for long Sussex County driveways?',
        a: 'Yes — tar and chip (chip seal) is often the best cost-to-value system for long rural driveways in Southside. It runs $2.50–$5.00 per square foot vs. $4–$8 for full asphalt, and properly installed it lasts 10–20 years. We can assess which system fits your property.',
      },
    ],
    reviews: 18,
    rating: 4.8,
  },

  // Hampton Roads
  { slug: 'norfolk-va',          city: 'Norfolk',          state: 'Virginia', stateAbbr: 'VA', region: 'Hampton Roads',                                            geo: { lat: 36.8508, lng: -76.2859 } },
  { slug: 'newport-news-va',     city: 'Newport News',     state: 'Virginia', stateAbbr: 'VA', region: 'Hampton Roads',                                            geo: { lat: 37.0871, lng: -76.4730 } },
  { slug: 'hampton-va',          city: 'Hampton',          state: 'Virginia', stateAbbr: 'VA', region: 'Hampton Roads',                                            geo: { lat: 37.0299, lng: -76.3452 } },
  { slug: 'suffolk-va',          city: 'Suffolk',          state: 'Virginia', stateAbbr: 'VA', region: 'Hampton Roads',                                            geo: { lat: 36.7282, lng: -76.5836 } },
  { slug: 'portsmouth-va',       city: 'Portsmouth',       state: 'Virginia', stateAbbr: 'VA', region: 'Hampton Roads',                                            geo: { lat: 36.8354, lng: -76.2983 } },

  // Northern Virginia
  { slug: 'mclean-va',           city: 'McLean',           state: 'Virginia', stateAbbr: 'VA', region: 'Northern Virginia / DMV Fringe',  county: 'Fairfax',       geo: { lat: 38.9339, lng: -77.1773 } },
  { slug: 'warrenton-va',        city: 'Warrenton',        state: 'Virginia', stateAbbr: 'VA', region: 'Northern Virginia / DMV Fringe',  county: 'Fauquier',      geo: { lat: 38.7137, lng: -77.7956 } },
  { slug: 'culpeper-va',         city: 'Culpeper',         state: 'Virginia', stateAbbr: 'VA', region: 'Northern Virginia / DMV Fringe',  county: 'Culpeper',      geo: { lat: 38.4732, lng: -77.9967 } },
  { slug: 'spotsylvania-va',     city: 'Spotsylvania',     state: 'Virginia', stateAbbr: 'VA', region: 'I-95 Corridor / Rappahannock',    county: 'Spotsylvania',  geo: { lat: 38.1985, lng: -77.5853 } },
  { slug: 'stafford-va',         city: 'Stafford',         state: 'Virginia', stateAbbr: 'VA', region: 'I-95 Corridor / Rappahannock',    county: 'Stafford',      geo: { lat: 38.4221, lng: -77.4083 } },
  { slug: 'caroline-va',         city: 'Caroline',         state: 'Virginia', stateAbbr: 'VA', region: 'I-95 Corridor / Rappahannock',    county: 'Caroline',      geo: { lat: 38.0334, lng: -77.3464 } },
  { slug: 'king-george-va',      city: 'King George',      state: 'Virginia', stateAbbr: 'VA', region: 'I-95 Corridor / Rappahannock',    county: 'King George',   geo: { lat: 38.2682, lng: -77.1856 } },
  { slug: 'orange-va',           city: 'Orange',           state: 'Virginia', stateAbbr: 'VA', region: 'Northern Virginia / DMV Fringe',  county: 'Orange',        geo: { lat: 38.2462, lng: -78.1109 } },
  { slug: 'prince-william-va',   city: 'Prince William',   state: 'Virginia', stateAbbr: 'VA', region: 'Northern Virginia / DMV Fringe',  county: 'Prince William', geo: { lat: 38.7026, lng: -77.4789 } },

  // Surrounding Counties
  { slug: 'charlottesville-va',  city: 'Charlottesville',  state: 'Virginia', stateAbbr: 'VA', region: 'Central Virginia',                county: 'Albemarle',     geo: { lat: 38.0293, lng: -78.4767 } },
  {
    slug: 'hanover-va',
    city: 'Hanover',
    state: 'Virginia',
    stateAbbr: 'VA',
    region: 'Central Virginia',
    county: 'Hanover',
    geo: { lat: 37.7613, lng: -77.3697 },
    headline: 'Asphalt Paving in Hanover County, VA — Rural Driveways, Farm Lanes & Commercial Lots',
    intro:
      'Hanover County runs long and rural, and that changes how asphalt has to be built. We pave estate driveways and farm lanes around Beaverdam, Montpelier, and Rockville, handle commercial and church lots near Hanover Courthouse and the Route 1 / I-95 corridor, and pour the heavier base needed for Doswell properties near Kings Dominion. Long rural driveways need proper crown, drainage, and base depth — get those wrong and water destroys the run in a few seasons.',
    neighborhoods: [
      'Hanover Courthouse', 'Beaverdam', 'Montpelier', 'Rockville',
      'Doswell', 'Mechanicsville', 'Ashland', 'Studley', 'Negro Foot',
    ],
    landmarks: ['Hanover Courthouse', 'Kings Dominion (Doswell)', 'I-95 corridor', 'Route 1', 'Pamunkey River', 'Hanover Tomato country'],
    climate: {
      title: 'Long Rural Driveways, Clay Subsoil & Open Drainage',
      body: 'Most Hanover paving happens away from curb-and-gutter, so water management is everything. A 300–800 foot rural driveway has to be crowned and graded to shed water off the edges, not trap it in the base. On Hanover\'s clay and the sandier Pamunkey bottomland, we set base depth to the soil and the traffic — heavier for farm equipment and grain trucks, standard for passenger driveways — and compact in lifts so the surface doesn\'t rut or pump.',
    },
    faqs: [
      {
        q: 'Can you pave a long rural driveway in Hanover County?',
        a: 'Yes — long driveways, farm lanes, and estate entrances are routine work for us across Beaverdam, Montpelier, and Rockville. We laser-grade for a proper crown and cross-fall, build a compacted stone base matched to the traffic, and cut drainage swales where the run needs them.',
      },
      {
        q: 'My farm driveway carries tractor and truck traffic — is standard asphalt enough?',
        a: 'No. Standard residential spec ruts under farm equipment in a season. We build agricultural driveways with a thicker binder course over a deeper stone base, and we\'ll often recommend a concrete apron at the heaviest turning points.',
      },
      {
        q: 'Do you serve Doswell and the areas near Kings Dominion?',
        a: 'Yes. Doswell, Beaverdam, and the northern Hanover corridor are regular service areas. Commercial and high-traffic properties there get a heavier base course built for the load.',
      },
    ],
    reviews: 33,
    rating: 4.9,
  },
  { slug: 'powhatan-va',         city: 'Powhatan',         state: 'Virginia', stateAbbr: 'VA', region: 'Central Virginia',                county: 'Powhatan',      geo: { lat: 37.5435, lng: -77.9166 } },
  { slug: 'goochland-va',        city: 'Goochland',        state: 'Virginia', stateAbbr: 'VA', region: 'Central Virginia',                county: 'Goochland',     geo: { lat: 37.6837, lng: -77.8836 } },
  { slug: 'amelia-va',           city: 'Amelia',           state: 'Virginia', stateAbbr: 'VA', region: 'Central Virginia',                county: 'Amelia',        geo: { lat: 37.3438, lng: -77.9836 } },
  {
    slug: 'ashland-va',
    city: 'Ashland',
    state: 'Virginia',
    stateAbbr: 'VA',
    region: 'Central Virginia',
    county: 'Hanover',
    geo: { lat: 37.7593, lng: -77.4791 },
    headline: 'Asphalt Paving in Ashland, VA — Driveways & Lots in the "Center of the Universe"',
    intro:
      'Ashland is a tight-knit railroad town, and paving here means working around mature trees, historic-district sensibilities, and the rail corridor that splits Center Street. We pave residential driveways through the College Town and England Street neighborhoods, resurface lots for businesses along Route 1 and near Randolph-Macon College, and rebuild older driveways that have outlived their original base. Clean edges, careful tree protection, and a finish that suits the town\'s character.',
    neighborhoods: [
      'Downtown Ashland', 'College Town', 'England Street', 'Center Street',
      'Cedar Lane', 'Gwathmey', 'Hickory Hill', 'Berkleytown',
    ],
    landmarks: ['Randolph-Macon College', 'Ashland Train Station', 'Center Street rail corridor', 'England Street', 'Route 1', 'Hanover Arts & Activities Center'],
    climate: {
      title: 'Mature Trees, Historic Edges & Hanover Clay',
      body: 'Ashland\'s older neighborhoods are full of mature oaks and tight lots, so root protection and clean edging matter as much as the base. We use root-bridge techniques near protected trees and frame driveways with crisp cut or brick-bordered edges that fit the historic streetscape. Underneath, it\'s the same discipline every Hanover job needs: a compacted stone base over clay subsoil and a crown that sheds Ashland\'s freeze-thaw winter moisture.',
    },
    faqs: [
      {
        q: 'Can you pave around the mature trees in my Ashland yard?',
        a: 'Yes. Ashland\'s tree canopy is part of its character, and we pave around protected root zones using a root-bridge geogrid that keeps oxygen and water moving to the roots. It costs a little more than standard but it keeps the trees alive.',
      },
      {
        q: 'Do you handle historic-district edges and finishes in downtown Ashland?',
        a: 'Yes. We frame driveways with brick borders or clean cut edges that suit the College Town and Center Street streetscape, and we keep equipment and staging tight on the narrower historic lots.',
      },
      {
        q: 'Do you pave commercial lots near Randolph-Macon and Route 1?',
        a: 'Yes — we resurface and stripe retail, office, and church lots along the Route 1 corridor and the Randolph-Macon area, scheduling around business hours and the college calendar where needed.',
      },
    ],
    reviews: 26,
    rating: 5.0,
  },
  { slug: 'charles-city-va',     city: 'Charles City',     state: 'Virginia', stateAbbr: 'VA', region: 'Central Virginia',                county: 'Charles City',  geo: { lat: 37.3424, lng: -77.0758 } },
  { slug: 'cumberland-va',       city: 'Cumberland',       state: 'Virginia', stateAbbr: 'VA', region: 'Central Virginia',                county: 'Cumberland',    geo: { lat: 37.5101, lng: -78.2422 } },
  { slug: 'fluvanna-va',         city: 'Fluvanna',         state: 'Virginia', stateAbbr: 'VA', region: 'Central Virginia',                county: 'Fluvanna',      geo: { lat: 37.8412, lng: -78.2769 } },
  { slug: 'louisa-va',           city: 'Louisa',           state: 'Virginia', stateAbbr: 'VA', region: 'Central Virginia',                county: 'Louisa',        geo: { lat: 37.9786, lng: -77.9961 } },
  { slug: 'king-william-va',     city: 'King William',     state: 'Virginia', stateAbbr: 'VA', region: 'Central Virginia',                county: 'King William',  geo: { lat: 37.6826, lng: -77.1011 } },

];

export const getLocationBySlug = (slug) => LOCATIONS.find((l) => l.slug === slug);
export const getLocationsByRegion = () => {
  const grouped = {};
  LOCATIONS.forEach((loc) => {
    if (!grouped[loc.region]) grouped[loc.region] = [];
    grouped[loc.region].push(loc);
  });
  return grouped;
};

const toRadians = (value) => (value * Math.PI) / 180;

export const haversineMiles = (a, b) => {
  const earthRadiusMiles = 3958.8;
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);

  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);

  const aTerm =
    sinLat * sinLat +
    Math.cos(toRadians(a.lat)) * Math.cos(toRadians(b.lat)) * sinLng * sinLng;

  const c = 2 * Math.atan2(Math.sqrt(aTerm), Math.sqrt(1 - aTerm));
  return earthRadiusMiles * c;
};

export const getLocationsWithinRadius = (center, radiusMiles) => {
  return LOCATIONS
    .filter((loc) => loc?.geo?.lat && loc?.geo?.lng)
    .map((loc) => ({
      ...loc,
      distanceMiles: haversineMiles(center, loc.geo),
    }))
    .filter((loc) => loc.distanceMiles <= radiusMiles)
    .sort((a, b) => a.distanceMiles - b.distanceMiles);
};

export const getRichmondRadiusLocations = () =>
  getLocationsWithinRadius(RICHMOND_CENTER, RICHMOND_RADIUS_MILES);

export const STRATEGIC_CORRIDOR_SLUGS = [
  'virginia-beach-va',
  'chesapeake-va',
  'williamsburg-va',
  'new-kent-va',
  'richmond-va',
  'henrico-va',
  'midlothian-va',
  'short-pump-va',
  'chester-va',
  'dinwiddie-va',
  'fredericksburg-va',
  'fairfax-va',
  'harrisonburg-va',
  'winchester-va',
  'roanoke-va',
];

export const getStrategicCorridorLocations = () =>
  STRATEGIC_CORRIDOR_SLUGS
    .map((slug) => getLocationBySlug(slug))
    .filter(Boolean);
