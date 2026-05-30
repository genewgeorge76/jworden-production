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
  {
    slug: 'norfolk-va',
    city: 'Norfolk',
    state: 'Virginia',
    stateAbbr: 'VA',
    region: 'Hampton Roads',
    geo: { lat: 36.8508, lng: -76.2859 },
    headline: 'Asphalt Paving in Norfolk, VA — Naval Station-Adjacent Driveways and Commercial Lots',
    intro:
      "Norfolk is Hampton Roads' urban core — a dense mix of military housing, historic neighborhoods, commercial corridors, and industrial waterfronts. We pave residential driveways in Ghent, Larchmont, and Wards Corner, resurface commercial lots along Military Highway and Granby Street, and handle heavy-duty industrial paving near the Naval Station perimeter. Coastal soil conditions, salt exposure, and a high water table are non-negotiable parts of every spec we write in Norfolk.",
    neighborhoods: [
      'Ghent', 'Larchmont', 'Wards Corner', 'Freemason',
      'Botanical Gardens area', 'Granby Street corridor', 'Military Highway', 'Berkley',
      'Norfolk Naval Station perimeter', 'Ocean View', 'Broad Creek', 'Park Place',
    ],
    landmarks: ['Naval Station Norfolk', 'Nauticus / USS Wisconsin', 'Chrysler Museum of Art', 'Granby Street', 'Military Highway (Route 13)', 'I-64 corridor'],
    climate: {
      title: 'Coastal Clay + Salt Aerosol + High Water Table',
      body: "Norfolk's tidal geography means asphalt sits close to a water table that fluctuates with tide cycles in low-lying areas, and salt aerosol from the Chesapeake Bay accelerates binder oxidation year-round. We install woven geotextile on every Norfolk job as a standard line item — not an upgrade — and use anti-strip additive in the asphalt mix. On properties within a mile of the water, we seal every 2–2.5 years instead of the standard 3–4. The Naval Station perimeter and industrial waterfront properties get heavy-duty base courses rated for government fleet traffic.",
    },
    faqs: [
      {
        q: 'Does the high water table in Norfolk affect my driveway base?',
        a: "Yes. In low-lying Norfolk neighborhoods — Ocean View, Berkley, and areas near the Elizabeth River — the water table can be within 3–4 feet of grade. Untreated, base stone wicks moisture and pumps fines under vehicle load. We install woven geotextile on every job and use #57 stone at 6-inch minimum depth to prevent base saturation and premature failure.",
      },
      {
        q: 'Do you pave commercial and industrial lots near Naval Station Norfolk?',
        a: 'Yes — commercial and light industrial properties in the Military Highway, Granby Street, and Naval Station perimeter corridors are regular work. Government-adjacent properties often see heavy fleet vehicle traffic, which requires a heavier base course spec than standard residential.',
      },
      {
        q: 'How do Ghent and Larchmont residential driveways differ from typical suburban work?',
        a: "Ghent and Larchmont are tight urban lots with mature trees, alley access, and narrow approaches — the opposite of a suburban cul-de-sac. We work with small equipment where needed, protect root zones, and engineer clean edges that fit the historic streetscape rather than a generic suburban finish.",
      },
    ],
    reviews: 43,
    rating: 4.8,
  },
  {
    slug: 'newport-news-va',
    city: 'Newport News',
    state: 'Virginia',
    stateAbbr: 'VA',
    region: 'Hampton Roads',
    geo: { lat: 37.0871, lng: -76.4730 },
    headline: 'Asphalt Paving in Newport News, VA — Shipyard-Corridor to Suburban Driveways',
    intro:
      "Newport News runs 25 miles from the Warwick Courthouse area down to the shipyard waterfront, and the paving landscape changes dramatically along that run. We handle residential driveways in Hidenwood, Kiln Creek, and Oyster Point, commercial lots along Jefferson Avenue and Warwick Boulevard, and industrial-grade work in the Shipyard and Port corridor. Same base-first approach across all of it — Newport News soil gives no margin for shortcuts.",
    neighborhoods: [
      'Hidenwood', 'Kiln Creek', 'Oyster Point', 'Denbigh',
      'Jefferson Avenue corridor', 'Warwick Boulevard', 'Shipyard district', 'Port area',
      'Hilton Village', 'Beechwood', 'Newmarket', 'City Center at Oyster Point',
    ],
    landmarks: ['Newport News Shipbuilding (HII)', 'Jefferson Avenue', 'Warwick Boulevard', 'City Center at Oyster Point', 'Mariners Museum', 'James River Bridge approach'],
    climate: {
      title: 'Tidewater Clay-Sand Transition + Industrial Load Corridors',
      body: "Newport News straddles the James River tidal zone — soil transitions from sandy tidal flats near the shipyard to heavier clay through the Denbigh and Kiln Creek corridors. Both conditions require proper geotextile and base depth, just for different reasons: sandy tidal soils pump fines without a separator; the upland clay swells with moisture and freeze-thaw cycles. On industrial properties near HII and the port, we spec heavy-duty base courses rated for freight and government vehicle loads.",
    },
    faqs: [
      {
        q: 'Do you pave industrial and commercial properties near Newport News Shipbuilding?',
        a: 'Yes — commercial lots, access roads, and industrial staging areas in the Shipyard and Port corridor are within our regular service area. These sites get a heavy-duty base course spec built for the loads generated by shipyard and freight operations.',
      },
      {
        q: 'My Kiln Creek or Oyster Point driveway has ruts — what causes that?',
        a: "Rutting in Kiln Creek and Oyster Point is usually a base or subgrade issue, not a surface issue. The area's soil transitions from sandy tidal loam to clay, and a thin or unseparated base pumps fines under vehicle load. We core the base before recommending overlay vs. rebuild.",
      },
      {
        q: 'Do you serve the full length of Newport News from Denbigh to the shipyard?',
        a: 'Yes — we work the full Newport News corridor, from the Denbigh and Hidenwood residential areas down to Jefferson Avenue commercial and the shipyard waterfront. Same crew, same spec, one quote.',
      },
    ],
    reviews: 37,
    rating: 4.8,
  },
  {
    slug: 'hampton-va',
    city: 'Hampton',
    state: 'Virginia',
    stateAbbr: 'VA',
    region: 'Hampton Roads',
    geo: { lat: 37.0299, lng: -76.3452 },
    headline: 'Asphalt Paving in Hampton, VA — Langley-Adjacent Driveways and Coastal Commercial Work',
    intro:
      "Hampton is the oldest continuously English-speaking settlement in America, and its paving landscape reflects that layered history — colonial-era street grids, established residential neighborhoods, military housing near Langley AFB, and commercial corridors along Mercury Boulevard and Coliseum Drive. We pave residential driveways in Buckroe, Phoebus, and Fox Hill, resurface commercial lots along the Mercury Boulevard corridor, and handle military-adjacent industrial paving near Langley.",
    neighborhoods: [
      'Buckroe Beach', 'Phoebus', 'Fox Hill', 'Wythe',
      'Mercury Boulevard corridor', 'Coliseum Drive', 'Langley AFB perimeter', 'Newmarket',
      'Hampton University area', 'Kecoughtan', 'Elizabeth Lake Estates', 'Aberdeen',
    ],
    landmarks: ['Langley Air Force Base (JBLAngley-Eustis)', 'Hampton Roads Convention Center', 'Hampton Coliseum', 'Mercury Boulevard', 'Hampton University', 'Buckroe Beach'],
    climate: {
      title: 'Coastal Tidal Flats + Military Traffic + Chesapeake Salt Exposure',
      body: "Hampton's coastal position on the Chesapeake Bay puts asphalt under dual stress: salt aerosol from the Bay that accelerates binder oxidation, and low-lying tidal flats in Buckroe and Fox Hill where the water table runs 3–5 feet from the surface. We use anti-strip additive in every Hampton mix, install geotextile on all low-lying properties, and seal every 2–2.5 years near the waterfront. Military-adjacent properties near Langley AFB get heavy-duty base specs.",
    },
    faqs: [
      {
        q: 'Do you pave near Langley AFB and military-adjacent properties in Hampton?',
        a: 'Yes — residential and commercial properties in the Langley perimeter area and along the Coliseum Drive corridor are regular work. Government-adjacent sites often need heavier base specs for fleet vehicle traffic.',
      },
      {
        q: 'My Buckroe or Fox Hill driveway floods during storms — can you fix that?',
        a: 'Flooding on low-lying Hampton properties is often a grade and drainage issue rather than just a pavement issue. We assess the site drainage, recommend corrections, and grade the surface for proper runoff before the asphalt goes down so the problem is solved, not paved over.',
      },
      {
        q: 'Do you handle commercial lots along Mercury Boulevard?',
        a: 'Yes — retail, office, and commercial lots along the Mercury Boulevard and Coliseum Drive corridors are regular commercial work. We schedule around business hours and provide ADA-compliant striping on every commercial job.',
      },
    ],
    reviews: 31,
    rating: 4.8,
  },
  {
    slug: 'suffolk-va',
    city: 'Suffolk',
    state: 'Virginia',
    stateAbbr: 'VA',
    region: 'Hampton Roads',
    geo: { lat: 36.7282, lng: -76.5836 },
    headline: 'Asphalt Paving in Suffolk, VA — Hampton Roads\' Largest City, Rural to Commercial',
    intro:
      "Suffolk is Virginia's largest city by land area — a sprawling mix of historic downtown streets, fast-growing suburban corridors like Harbour View, rural estate driveways, and agricultural land along the Nansemond River. We pave residential driveways in Harbour View, Bennetts Creek, and the western development corridors, handle commercial lots along Route 58 and the Business 58 Bypass, and build rural approaches on the wooded estate lots that still define much of Suffolk's character.",
    neighborhoods: [
      'Harbour View', 'Bennetts Creek', 'Lakeview', 'Historic Downtown Suffolk',
      'Route 58 corridor', 'Business 58 Bypass', 'Nansemond River area', 'Whaleyville',
      'Holland', 'Driver', 'Chuckatuck', 'Isle of Wight adjacency',
    ],
    landmarks: ['Route 58 corridor', 'Harbour View development', 'Nansemond River', 'Suffolk Executive Airport', 'Great Dismal Swamp', 'Business 58 Bypass'],
    climate: {
      title: 'Coastal Plain Sandy Loam + Rural Estate Drainage',
      body: "Suffolk's soils shift from the sandy Coastal Plain loam near the waterways to heavier clay in the upland areas — both need proper base prep but behave differently. Near the Nansemond River and in the lower-elevation Harbour View corridors, base moisture management is critical. On the rural estate lots that dominate western Suffolk, long driveway runs need proper crown and open drainage since there is no curb system to handle runoff. We adjust spec to the site.",
    },
    faqs: [
      {
        q: 'Do you pave driveways in Harbour View and the Bennetts Creek area?',
        a: 'Yes — Harbour View, Bennetts Creek, and the northern Suffolk development corridors are regular residential territory. We assess the base and drainage on every estimate and build to a spec that handles the coastal soil conditions in those areas.',
      },
      {
        q: 'Can you pave a long rural driveway in western Suffolk?',
        a: 'Yes — long driveways on rural estate lots in Chuckatuck, Driver, and the western Suffolk corridor are routine work. We laser-grade for proper crown, build the base to the soil and traffic, and cut drainage swales where the run needs them.',
      },
      {
        q: 'Do you handle commercial lots along Route 58 in Suffolk?',
        a: 'Yes — commercial, retail, and light industrial properties along the Route 58 and Business 58 Bypass corridors are within our regular service area. We schedule around business operations and provide line-item estimates before any work begins.',
      },
    ],
    reviews: 27,
    rating: 4.9,
  },
  {
    slug: 'portsmouth-va',
    city: 'Portsmouth',
    state: 'Virginia',
    stateAbbr: 'VA',
    region: 'Hampton Roads',
    geo: { lat: 36.8354, lng: -76.2983 },
    headline: 'Asphalt Paving in Portsmouth, VA — Olde Towne to Naval Shipyard Corridor',
    intro:
      "Portsmouth sits across the Elizabeth River from Norfolk — a historic naval shipyard city with Olde Towne's preserved 18th-century streetscape on one side and the industrial Portsmouth Naval Shipyard on the other. We pave residential driveways in Olde Towne, Cradock, and Port Norfolk, resurface commercial lots along High Street and Frederick Boulevard, and handle industrial-grade work in the Shipyard corridor. Dense urban lots, tight access, and tidal soil conditions define the work here.",
    neighborhoods: [
      'Olde Towne', 'Cradock', 'Port Norfolk', 'Churchland',
      'High Street corridor', 'Frederick Boulevard', 'Naval Shipyard perimeter', 'Hodges Manor',
      'Cavalier Manor', 'Academy Park', 'Western Branch adjacency', 'Prentis Park',
    ],
    landmarks: ['Portsmouth Naval Shipyard', 'Olde Towne Historic District', 'Elizabeth River', 'High Street', 'Naval Medical Center Portsmouth', 'I-264 corridor'],
    climate: {
      title: 'Tidal Elizabeth River Clay + Historic Lot Constraints',
      body: "Portsmouth's Elizabeth River tidal zone means many neighborhoods sit on saturated clay with a water table within 4–5 feet of grade. In Olde Towne and Cradock's dense historic lots, equipment access is tight and surface finishes need to suit the historic streetscape. We work with small equipment on narrow lots, install geotextile as standard on all Elizabeth River-adjacent properties, and use anti-strip additive in every Portsmouth mix to counter tidal moisture's effect on binder adhesion.",
    },
    faqs: [
      {
        q: 'Do you pave in Olde Towne Portsmouth\'s historic district?',
        a: "Yes — Olde Towne's tight lots, alley access, and historic overlay require careful equipment selection and clean finishing. We've done multiple Olde Towne driveways and know how to work within the historic district constraints without damaging the streetscape.",
      },
      {
        q: 'Do you handle industrial and commercial work near the Portsmouth Naval Shipyard?',
        a: 'Yes — commercial lots, access roads, and industrial properties in the Shipyard perimeter and High Street corridor are regular work. Shipyard-adjacent sites get a heavy-duty base course spec.',
      },
      {
        q: 'My Portsmouth driveway has soft spots and sunken areas — what causes that?',
        a: 'Soft spots and sunken areas in Portsmouth are almost always from tidal moisture undermining the base — the water table fluctuates, saturates the base stone, and the surface sinks under vehicle load. The fix requires excavating to a dry base, installing geotextile, rebuilding with proper stone, and then paving. Surface patching alone won\'t hold.',
      },
    ],
    reviews: 24,
    rating: 4.8,
  },

  // Northern Virginia / I-95 Corridor
  {
    slug: 'mclean-va',
    city: 'McLean',
    state: 'Virginia',
    stateAbbr: 'VA',
    region: 'Northern Virginia / DMV Fringe',
    county: 'Fairfax',
    geo: { lat: 38.9339, lng: -77.1773 },
    headline: 'Asphalt Paving in McLean, VA — Premium Estate Driveways in Northern Virginia',
    intro:
      "McLean is among Northern Virginia's most affluent communities — long estate driveways, circular approaches, gated entries, and premium properties that demand premium installation. We pave and resurface driveways throughout the Georgetown Pike, Chain Bridge Road, and Old Dominion Drive corridors, working with the precise finishes and careful tree protection that McLean properties expect.",
    neighborhoods: [
      'Georgetown Pike corridor', 'Chain Bridge Road', 'Old Dominion Drive', 'Langley',
      'Great Falls adjacency', 'Tysons Corner adjacency', 'Kirby Road', 'Dolley Madison Boulevard',
    ],
    landmarks: ['CIA Headquarters (Langley)', 'Georgetown Pike', 'Chain Bridge Road', 'Tysons Corner', 'Great Falls Park approach', 'Dolley Madison Boulevard'],
    climate: {
      title: 'NOVA Freeze-Thaw + Premium Estate Base Requirements',
      body: "McLean averages 35–45 freeze-thaw cycles per winter — more than Richmond — and the heavy clay soils throughout Fairfax County move with moisture year-round. Estate driveways here run 200–600 feet and often include circular approaches, motor courts, and decorative edge treatments. We engineer each scope with a minimum 6-inch structural stone base, polymer-modified PG 70-22 binder, and the drainage management long premium runs require.",
    },
    faqs: [
      {
        q: 'Can you pave a long circular driveway on a McLean estate?',
        a: 'Yes — long estate approaches, circular motor courts, and gated entry driveways are regular work in the McLean and Great Falls corridor. We laser-grade for a 2% cross-fall, engineer the drainage at the turnaround, and finish with the precision edge detail the property calls for.',
      },
      {
        q: 'How much does a premium McLean driveway cost?',
        a: 'Premium Northern Virginia driveways with proper 6-inch base, polymer binder, and finish detailing typically run $5–$9 per square foot. Long estate runs and circular approaches are priced by the linear foot and square footage. We provide a written line-item estimate after the site visit.',
      },
      {
        q: 'Do you serve Great Falls and the Fairfax County estate corridor?',
        a: 'Yes — the McLean, Great Falls, and Langley estate corridor is our Northern Virginia premium residential market. Same structural spec, same written warranty.',
      },
    ],
    reviews: 29,
    rating: 5.0,
  },
  {
    slug: 'warrenton-va',
    city: 'Warrenton',
    state: 'Virginia',
    stateAbbr: 'VA',
    region: 'Northern Virginia / DMV Fringe',
    county: 'Fauquier',
    geo: { lat: 38.7137, lng: -77.7956 },
    headline: 'Asphalt Paving in Warrenton, VA — Piedmont Hunt Country Driveways and Commercial Work',
    intro:
      "Warrenton is the county seat of Fauquier County and the gateway to Virginia's Piedmont hunt country — long estate and farm driveways, equestrian property approaches, and commercial lots in the historic downtown and Lee Highway corridors. We pave residential and estate driveways throughout Fauquier County, handle commercial lots along Route 29 and Lee Highway, and build the heavy-duty approaches equestrian properties need for trailer and farm equipment traffic.",
    neighborhoods: [
      'Downtown Warrenton', 'Lee Highway corridor', 'Route 29 corridor', 'Meetze',
      'New Baltimore', 'Vint Hill', 'Marshall', 'The Plains',
      'Goldvein', 'Bealeton', 'Remington', 'Calverton',
    ],
    landmarks: ['Fauquier County Courthouse', 'Lee Highway (Route 211)', 'Route 29 corridor', 'Vint Hill Farms (former Army base)', 'Warrenton Training Center', 'Old Town Warrenton'],
    climate: {
      title: 'Piedmont Clay + Equestrian Load + Hunt Country Frost Depth',
      body: "Warrenton's Piedmont clay is among the most active in Virginia — deep, plastic, and responsive to every wet/dry cycle. The area also sees 40+ freeze-thaw cycles per winter at its elevation. Equestrian and farm properties add a heavy-load dimension: horse trailer turnarounds, tractor approaches, and paddock access lanes that standard residential spec will rut under in a single season. We size the base to the traffic — deeper stone and heavier binder for any approach that sees trailer or farm equipment weight.",
    },
    faqs: [
      {
        q: 'Do you pave equestrian property driveways and farm approaches in Fauquier County?',
        a: 'Yes — equestrian property approaches, horse trailer turnarounds, farm lane paving, and paddock access roads in the Warrenton and Fauquier County area are regular work. These sites get a heavier base course spec than standard residential, typically 6–8 inches of stone under a 3-inch asphalt section.',
      },
      {
        q: 'How does Fauquier County Piedmont clay affect driveway paving?',
        a: "Fauquier's Piedmont clay is deep and plastic — it shrinks significantly in summer droughts and expands when wet. Driveways built on thin bases crack and heave within 3–5 years. We build a minimum 6-inch compacted stone base and use geotextile fabric to isolate the asphalt from clay movement.",
      },
      {
        q: 'Do you serve The Plains, Marshall, and the rural Fauquier hunt country?',
        a: 'Yes — the rural Fauquier corridor including The Plains, Marshall, and the Route 17 hunt country area are within our service area for driveways, farm lanes, and estate approaches.',
      },
    ],
    reviews: 22,
    rating: 4.9,
  },
  {
    slug: 'culpeper-va',
    city: 'Culpeper',
    state: 'Virginia',
    stateAbbr: 'VA',
    region: 'Northern Virginia / DMV Fringe',
    county: 'Culpeper',
    geo: { lat: 38.4732, lng: -77.9967 },
    headline: 'Asphalt Paving in Culpeper, VA — Piedmont Driveways and the Route 29 Corridor',
    intro:
      "Culpeper County sits at the intersection of Piedmont Virginia and the I-66/Route 29 commuter corridor — a mix of rural estate driveways, growing residential subdivisions, and commercial lots serving the Route 29 and Route 15 business strips. We pave residential driveways and long estate approaches across the county, handle commercial lots in the downtown and Route 29 corridor, and build farm-road approaches on the agricultural properties that define the Culpeper landscape.",
    neighborhoods: [
      'Downtown Culpeper', 'Route 29 corridor', 'Route 15 corridor', 'Stevensburg',
      'Brandy Station', 'Elkwood', 'Lignum', 'Rapidan area',
      'Mitchells', 'Rixeyville', 'Raccoon Ford', 'James Madison Highway',
    ],
    landmarks: ['Route 29 corridor', 'James Madison Highway (Route 15)', 'Culpeper National Cemetery', 'Cedar Mountain Battlefield', 'Rapidan River', 'Shenandoah National Park approach'],
    climate: {
      title: 'Culpeper Clay Loam + Piedmont Rural Drainage',
      body: "Culpeper's soils are a clay-loam mix from the Piedmont — heavier than Coastal Plain sand but less plastic than the deep clays of Chesterfield or Fauquier. The county still sees 35–40 freeze-thaw cycles per winter, and rural properties have no curb systems to manage runoff from long driveway runs. We build to the soil — stone base depth adjusted for the clay content at each site — and grade every rural run for open drainage so water moves off the drive, not into it.",
    },
    faqs: [
      {
        q: 'Do you pave residential and estate driveways in Culpeper County?',
        a: 'Yes — residential driveways, rural estate approaches, and farm lane paving throughout Culpeper County are regular work. We provide base assessments and written line-item estimates before any work begins.',
      },
      {
        q: 'Do you handle commercial lots along Route 29 and Route 15 in Culpeper?',
        a: 'Yes — commercial, retail, and small industrial lots along the Route 29 and James Madison Highway (Route 15) corridors in Culpeper are within our service area.',
      },
      {
        q: 'Is tar and chip a good option for long Culpeper rural driveways?',
        a: 'Often yes. Tar and chip at $2.50–$5/sqft vs. full asphalt at $4–$8/sqft gives rural Culpeper landowners a cost-effective, durable surface for long private driveways and farm lanes. Properly installed over a correct base, it lasts 10–20 years. We assess which system fits each property.',
      },
    ],
    reviews: 19,
    rating: 4.9,
  },
  {
    slug: 'spotsylvania-va',
    city: 'Spotsylvania',
    state: 'Virginia',
    stateAbbr: 'VA',
    region: 'I-95 Corridor / Rappahannock',
    county: 'Spotsylvania',
    geo: { lat: 38.1985, lng: -77.5853 },
    headline: 'Asphalt Paving in Spotsylvania, VA — New-Construction Driveways and Growing Subdivision Work',
    intro:
      "Spotsylvania County has exploded with new residential construction along the I-95 and Route 1 corridors, and with it has come a wave of new driveways laid on incompletely compacted builder fill. We rebuild failed new-construction driveways throughout the Spotsylvania Courthouse, Chancellor, and Lake Wilderness areas, and we coordinate with builders on new homes to get the subgrade right before the asphalt goes down.",
    neighborhoods: [
      'Spotsylvania Courthouse', 'Chancellor', 'Lake Wilderness', 'Salem Fields',
      'Fawn Lake', 'Leavells', 'Massaponax', 'Thornburg',
      'Partlow', 'Brokenburg', 'Ni River area', 'Battlefield area',
    ],
    landmarks: ['Spotsylvania Court House Battlefield', 'Lake Anna (proximity)', 'I-95 Exits 118–130', 'Route 1 corridor', 'Spotsylvania Town Centre', 'Lake Wilderness'],
    climate: {
      title: 'New-Construction Fill Failure + Rappahannock-Watershed Clay',
      body: "Spotsylvania's rapid growth means most new driveways are paved on recently graded land where builder fill hasn't fully consolidated. The county's red-clay subsoil amplifies settlement — even properly compacted fill on Piedmont clay continues to consolidate under traffic load for 2–3 years. Driveways paved before that consolidation ends develop ruts and depression spots that worsen every season. We test the subgrade, stabilize where needed, and build a structural stone base that won't deflect when the underlying soil is still settling.",
    },
    faqs: [
      {
        q: 'My new Spotsylvania subdivision driveway has ruts after one year — what happened?',
        a: "Almost certainly builder fill compaction failure. Spotsylvania's red clay on partially consolidated fill deflects under vehicle load, and driveways paved before the subgrade is ready show tire-track ruts within 1–2 years. The correct fix is subgrade re-compaction and a proper 6-inch stone base — not an overlay.",
      },
      {
        q: 'Do you coordinate with builders on new Spotsylvania homes before paving?',
        a: 'Yes — and we prefer it. Coordinating before the builder lays the subgrade lets us spec the compaction requirement and base depth that prevents premature failure. Talk to us before the builder starts driveway work, not after the driveway ruts.',
      },
      {
        q: 'Do you serve Lake Wilderness, Fawn Lake, and the rural Spotsylvania corridors?',
        a: 'Yes — residential, estate, and rural driveways throughout Spotsylvania County including the Fawn Lake, Lake Wilderness, and Partlow areas are within our service area.',
      },
    ],
    reviews: 31,
    rating: 4.9,
  },
  {
    slug: 'stafford-va',
    city: 'Stafford',
    state: 'Virginia',
    stateAbbr: 'VA',
    region: 'I-95 Corridor / Rappahannock',
    county: 'Stafford',
    geo: { lat: 38.4221, lng: -77.4083 },
    headline: 'Asphalt Paving in Stafford, VA — I-95 Commuter Driveways Built to Last',
    intro:
      "Stafford County is one of Virginia's fastest-growing I-95 corridor markets — bedroom communities for DC and Quantico that see heavy daily commuter traffic and rapid new-construction residential development. We rebuild failed new-construction driveways throughout Aquia Harbour, Garrisonville, and the Austin Ridge area, and we pave new driveways for the estates and rural properties along the Rappahannock bluffs that give Stafford its other character.",
    neighborhoods: [
      'Aquia Harbour', 'Garrisonville', 'Austin Ridge', 'Embrey Mill',
      'Shelton Woods', 'Widewater', 'Stafford Courthouse', 'Hartwood',
      'Falmouth', 'Brooke', 'Winding Creek', 'Quantico adjacency',
    ],
    landmarks: ['Marine Corps Base Quantico (approach)', 'I-95 Exits 140–152', 'Route 1 / Jefferson Davis Highway', 'Aquia Creek', 'Rappahannock River bluffs', 'Garrisonville Road corridor'],
    climate: {
      title: 'Quantico-Corridor Clay + I-95 Commuter Traffic Load',
      body: "Stafford's Piedmont clay is active — deep, plastic, and responsive to Virginia's moisture swings — and the I-95 commuter corridor amplifies traffic load beyond what standard residential driveways are typically built for. New-construction driveways on the county's rapid growth corridors show the same builder fill compaction failure we see in Spotsylvania: ruts and depressions within 1–2 years. Our fix is a structural 6-inch stone base on a properly tested and stabilized subgrade, engineered to carry the daily commuter load without deflecting.",
    },
    faqs: [
      {
        q: 'Do you serve Aquia Harbour, Garrisonville, and the I-95 Stafford corridor?',
        a: 'Yes — the Aquia Harbour, Garrisonville, Austin Ridge, and Embrey Mill residential areas are regular territory for our Northern crew. Same structural spec, same written warranty as every other market.',
      },
      {
        q: 'Do you pave near Marine Corps Base Quantico in Stafford?',
        a: 'Yes — residential and commercial properties in the Quantico corridor and Widewater area are within our service area. Military-adjacent sites often see heavy vehicle traffic and get a heavier base course spec.',
      },
      {
        q: 'Why does my Stafford driveway have ruts when it is only 2 years old?',
        a: "Rutting in 2-year-old Stafford driveways is almost always builder fill compaction failure on Piedmont clay. The fix is excavation to a firm bearing depth, subgrade re-compaction or stabilization, and a proper 6-inch stone base — not another overlay.",
      },
    ],
    reviews: 28,
    rating: 4.9,
  },
  {
    slug: 'caroline-va',
    city: 'Caroline',
    state: 'Virginia',
    stateAbbr: 'VA',
    region: 'I-95 Corridor / Rappahannock',
    county: 'Caroline',
    geo: { lat: 38.0334, lng: -77.3464 },
    headline: 'Asphalt Paving in Caroline County, VA — Rural Driveways Between Richmond and Fredericksburg',
    intro:
      "Caroline County is the rural stretch between Richmond and Fredericksburg along the I-95 corridor — agricultural land, estate driveways, rural residential properties, and the Bowling Green commercial area. We pave long rural driveways, rebuild failing approaches on Caroline's clay soils, and provide commercial paving for the Bowling Green and Route 301 corridor businesses.",
    neighborhoods: [
      'Bowling Green', 'Milford', 'Port Royal', 'Woodford',
      'Penola', 'Sparta', 'Ladysmith', 'Ruther Glen',
      'I-95 corridor', 'Route 301 corridor', 'Mattaponi River area', 'Rappahannock River area',
    ],
    landmarks: ['Bowling Green (county seat)', 'I-95 corridor', 'Route 301', 'Mattaponi River', 'Rappahannock River', 'Port Royal'],
    climate: {
      title: 'I-95 Corridor Clay + Open Rural Drainage',
      body: "Caroline County's Piedmont-to-Coastal Plain transition soils range from clay-heavy near the Rappahannock bluffs to sandier loam near the Mattaponi River — both need proper base prep but drain differently. Rural driveways throughout the county have no curb systems, so all water management comes from crown, slope, and edge grading. We assess the soil and drainage at each site before specifying stone depth and drainage corrections.",
    },
    faqs: [
      {
        q: 'Do you pave long rural driveways in Caroline County?',
        a: 'Yes — rural driveways, farm lanes, and estate approaches throughout Caroline County are within our service area. Long rural runs get a line-item estimate that breaks out grading, drainage, stone, and asphalt separately.',
      },
      {
        q: 'Do you serve the Bowling Green and Route 301 commercial corridor?',
        a: 'Yes — commercial lots, church properties, and small industrial facilities in the Bowling Green and Route 301 corridor are regular commercial work.',
      },
      {
        q: 'Is Caroline County between your Richmond and Fredericksburg crews?',
        a: "Yes — Caroline sits on our I-95 corridor route between Chester and the Fredericksburg market. We schedule Caroline work efficiently alongside Spotsylvania and Stafford jobs to keep mobilization costs reasonable.",
      },
    ],
    reviews: 17,
    rating: 4.9,
  },
  {
    slug: 'king-george-va',
    city: 'King George',
    state: 'Virginia',
    stateAbbr: 'VA',
    region: 'I-95 Corridor / Rappahannock',
    county: 'King George',
    geo: { lat: 38.2682, lng: -77.1856 },
    headline: 'Asphalt Paving in King George County, VA — Dahlgren Naval Surface Warfare Center Corridor',
    intro:
      "King George County sits along the Potomac River between Fredericksburg and the Potomac, anchored by Dahlgren Naval Surface Warfare Center. The county is a mix of residential communities serving Dahlgren's civilian and military workforce, rural estate properties, and the growing Route 3 corridor commercial strip. We pave residential driveways, rural approaches, and commercial lots throughout the county.",
    neighborhoods: [
      'King George Courthouse', 'Dahlgren', 'Hopyard Farm', 'Comorn',
      'Route 3 corridor', 'Potomac River bluffs', 'Caledon area', 'Cleydael',
    ],
    landmarks: ['Dahlgren Naval Surface Warfare Center', 'Route 3 corridor', 'Potomac River', 'Caledon State Park', 'King George Courthouse', 'Dahlgren Heritage Museum'],
    climate: {
      title: 'Potomac River Clay + Naval Corridor Traffic',
      body: "King George County's Potomac River bluff soils are heavy clay — among the most plastic in the Northern Neck and Northern Virginia region. Driveways on thin bases crack and heave within 3–4 years on this subsoil. The Dahlgren corridor also sees regular heavy government vehicle traffic that demands more than standard residential base depth. We assess the soil and traffic on each site and build accordingly.",
    },
    faqs: [
      {
        q: 'Do you pave near Dahlgren Naval Surface Warfare Center in King George County?',
        a: 'Yes — residential and commercial properties in the Dahlgren corridor and Route 3 commercial strip are within our service area. Government-adjacent sites often need heavier base specs.',
      },
      {
        q: 'Do you serve rural estate driveways on the Potomac River bluffs?',
        a: 'Yes — estate driveways and rural approaches on the King George Potomac River bluffs are regular work. The clay soil here requires a minimum 6-inch stone base and geotextile fabric to prevent early cracking.',
      },
      {
        q: 'How far is King George from your closest crew?',
        a: "King George is about 45 minutes from our Fredericksburg-corridor crew staging. We schedule King George work alongside other Northern Rappahannock jobs to keep mobilization efficient.",
      },
    ],
    reviews: 14,
    rating: 4.9,
  },
  {
    slug: 'orange-va',
    city: 'Orange',
    state: 'Virginia',
    stateAbbr: 'VA',
    region: 'Northern Virginia / DMV Fringe',
    county: 'Orange',
    geo: { lat: 38.2462, lng: -78.1109 },
    headline: 'Asphalt Paving in Orange County, VA — Piedmont Estate Driveways and Wine Country Approaches',
    intro:
      "Orange County is the heart of Virginia Piedmont wine country — the Route 20 and Route 15 corridors are lined with vineyards, estates, historic properties, and the James Madison and Montpelier corridor. We pave long estate and vineyard approaches, residential driveways in the Town of Orange area, and rural farm lane access throughout the county.",
    neighborhoods: [
      'Town of Orange', 'Rapidan', 'Unionville', 'Barboursville',
      'Locust Grove', 'Route 20 corridor', 'Route 15 corridor', 'Montpelier area',
      'Wilderness area', 'Gordonsville adjacency', 'Somerset', 'Rhoadesville',
    ],
    landmarks: ['Montpelier (James Madison home)', 'Barboursville Vineyards', 'Route 20 corridor', 'Route 15 (James Madison Highway)', 'Rapidan River', 'Lake Orange'],
    climate: {
      title: 'Piedmont Vineyard Clay + Estate Driveway Frost Depth',
      body: "Orange County's Piedmont soils are deep red clay — heavy, plastic, and highly responsive to moisture. The county sees 35–40 freeze-thaw cycles per winter at its elevation, and the long approach driveways on vineyard and estate properties put substantial thermal and moisture stress on anything built on a thin base. We build estate approaches with a minimum 6-inch structural stone base over geotextile fabric and use polymer-modified binder on long runs to handle the Piedmont frost-heave cycle.",
    },
    faqs: [
      {
        q: 'Do you pave vineyard and estate approach driveways in Orange County?',
        a: 'Yes — long estate approaches, vineyard access drives, and farm lane paving throughout the Orange County wine country corridor are regular work. We engineer each run for proper drainage and build the base to handle the traffic and soil conditions.',
      },
      {
        q: 'Do you serve the Montpelier and Barboursville estate corridor?',
        a: 'Yes — the Route 20 estate and vineyard corridor from Orange Courthouse to the Culpeper County line is within our service area.',
      },
      {
        q: 'Is tar and chip suitable for a long Orange County rural driveway?',
        a: 'Often yes. For long rural or vineyard access drives where traction and cost efficiency matter more than smooth appearance, tar and chip at $2.50–$5/sqft provides a durable 10–20 year surface at a significant cost savings vs. full asphalt.',
      },
    ],
    reviews: 16,
    rating: 4.9,
  },
  {
    slug: 'prince-william-va',
    city: 'Prince William',
    state: 'Virginia',
    stateAbbr: 'VA',
    region: 'Northern Virginia / DMV Fringe',
    county: 'Prince William',
    geo: { lat: 38.7026, lng: -77.4789 },
    headline: 'Asphalt Paving in Prince William County, VA — Manassas to Woodbridge Corridor',
    intro:
      "Prince William County is one of Virginia's fastest-growing suburban markets, stretching from the Manassas and Gainesville growth corridors in the west to the I-95 Woodbridge and Dale City communities in the east. We pave residential driveways in Gainesville, Lake Ridge, and Occoquan, resurface commercial lots along Route 28 and I-66, and handle HOA road work in the county's rapid-growth subdivision corridors.",
    neighborhoods: [
      'Gainesville', 'Haymarket', 'Woodbridge', 'Dale City',
      'Lake Ridge', 'Occoquan', 'Dumfries', 'Manassas adjacency',
      'Montclair', 'Independent Hill', 'Nokesville', 'Catharpin',
    ],
    landmarks: ['I-95 Prince William corridor', 'I-66 / Route 28 interchange', 'Potomac Mills', 'Manassas National Battlefield', 'Marine Corps Base Quantico (southern perimeter)', 'Occoquan Reservoir'],
    climate: {
      title: 'Northern Virginia Growth-Corridor Clay + I-95 Commuter Load',
      body: "Prince William County's clay-heavy soils and rapid development create the same builder fill compaction failure we see throughout the I-95 growth corridor — new driveways rutting and settling within 1–2 years on partially consolidated builder pads. The county also sees 40+ freeze-thaw cycles per winter in the western Gainesville and Haymarket corridors. We test the subgrade on every new-construction site and build a structural 6-inch stone base that won't deflect before the underlying soil finishes consolidating.",
    },
    faqs: [
      {
        q: 'Do you pave driveways in Gainesville, Haymarket, and western Prince William County?',
        a: 'Yes — the Gainesville, Haymarket, and Route 29 corridor in western Prince William are regular residential and commercial territory for our Northern crew.',
      },
      {
        q: 'Do you serve Woodbridge, Dale City, and the I-95 eastern corridor?',
        a: 'Yes — the I-95 Woodbridge and Dale City corridors in eastern Prince William are within our service area for residential driveways, commercial lots, and HOA road work.',
      },
      {
        q: 'My Prince William subdivision driveway has ruts after two years — what do I do?',
        a: "Rutting in 1–2 year old driveways on Prince William builder pads is almost always subgrade compaction failure on clay fill. The durable fix is excavation, subgrade stabilization, and a proper 6-inch stone base — not an overlay that will rut again in another season.",
      },
    ],
    reviews: 26,
    rating: 4.9,
  },

  // Surrounding Counties
  {
    slug: 'charlottesville-va',
    city: 'Charlottesville',
    state: 'Virginia',
    stateAbbr: 'VA',
    region: 'Central Virginia',
    county: 'Albemarle',
    geo: { lat: 38.0293, lng: -78.4767 },
    headline: 'Asphalt Paving in Charlottesville, VA — UVA-Adjacent Driveways, Historic-District Lots & Albemarle Estate Approaches',
    intro:
      'Charlottesville sits at the foot of the Blue Ridge, and paving here means navigating historic-district sensibilities in Belmont and Woolen Mills, steep-grade driveways in the Pantops and Ragged Mountain fringe, and the base specifications that Albemarle County\'s expansive red clay demands. We pave residential driveways through Fry\'s Spring and North Downtown, resurface commercial lots near the Route 29 corridor and Barracks Road, and build long rural approaches for estate properties in Free Union, Earlysville, and along Route 250 West toward Crozet. Urban tight-lot work and rural estate paving call for different specs — and we know which is which.',
    neighborhoods: [
      'Belmont', "Fry's Spring", 'North Downtown', 'Woolen Mills',
      'Locust Grove', 'Fifeville', 'Pantops', 'Barracks', 'Johnson Village',
    ],
    landmarks: ['University of Virginia', 'Barracks Road Shopping Center', 'Monticello (Route 53)', 'Route 29 North corridor', 'Ragged Mountain Reservoir', 'Rivanna River'],
    climate: {
      title: 'Albemarle Clay, Blue Ridge Freeze-Thaw & Historic-District Constraints',
      body: 'Charlottesville averages 35–40 freeze-thaw cycles per year — enough to pump any base that was under-compacted or built too shallow. Albemarle\'s red-orange clay is expansive: it swells with winter moisture and contracts and cracks in July heat. We build a minimum 6-inch compacted aggregate base on residential driveways and go deeper on estate approaches that carry horse trailers or farm equipment. In Belmont and the Woolen Mills historic corridor, we work to a tight footprint, protect mature trees with root-bridge geogrid, and keep staging off brick-curbed streetscapes.',
    },
    faqs: [
      {
        q: 'How much does driveway paving cost in Charlottesville?',
        a: 'Residential driveways in Charlottesville and Albemarle County typically run $4–$8 per square foot installed, depending on base condition, grade, and access. Steep approaches on the Ragged Mountain fringe or rural estate lanes in Free Union cost more because of the extra grading, drainage, and deeper base required. We provide free written estimates with a line-item breakdown.',
      },
      {
        q: 'Does Albemarle County require a permit for driveway paving near Route 29 or Route 250?',
        a: 'A VDOT entrance permit is required any time a driveway connects to a state-maintained road, which includes most Route 29, Route 250, and Route 20 frontages in Albemarle County. We handle VDOT entrance permit applications on those jobs. Work entirely on private property with an existing entrance does not require a separate permit.',
      },
      {
        q: 'Can you pave a steep or curved driveway in the Charlottesville hills?',
        a: 'Yes — steep grades and curved approaches in the Pantops area and along the mountain fringes are routine for us. We grade a consistent cross-fall so water sheds off the edges rather than running down the center, install interceptor drains at transition points, and use a slightly slower-set binder mix on grades above 8% to prevent shoving.',
      },
    ],
    reviews: 29,
    rating: 4.9,
  },
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
  {
    slug: 'powhatan-va',
    city: 'Powhatan',
    state: 'Virginia',
    stateAbbr: 'VA',
    region: 'Central Virginia',
    county: 'Powhatan',
    geo: { lat: 37.5435, lng: -77.9166 },
    headline: 'Asphalt Paving in Powhatan County, VA — Equestrian Driveways, Estate Approaches & Rural Property Paving',
    intro:
      'Powhatan County is horse country — large rural lots, long driveway runs, and equestrian-property approaches that have to handle trailer traffic without rutting. We pave residential driveways and farm lanes throughout the Route 60 corridor and around Powhatan Court House, Flat Rock, and Tobaccoville. Builder fill from newer subdivisions along the Route 60 / Route 13 growth corridor hides compaction failures that don\'t show up until the first hard winter — we diagnose base problems before we pave and fix them rather than cover them. Whether it\'s a 600-foot estate entrance or a simple 2-car residential pour, Powhatan jobs get the drainage crown and base depth rural clay soil demands.',
    neighborhoods: [
      'Powhatan Court House', 'Flat Rock', 'Tobaccoville', 'Fine Creek Mills',
      'Huguenot Trail corridor', 'Route 60 West', 'Maidens', 'Belboeuf',
    ],
    landmarks: ['Powhatan State Park', 'Powhatan County Courthouse', 'Route 60 corridor', 'Huguenot Trail', 'James River (Powhatan access)', 'Fine Creek'],
    climate: {
      title: 'Rural Clay Subsoil, Equestrian Traffic & Long Driveway Drainage',
      body: 'Powhatan\'s Piedmont clay swells in wet winters and shrinks in dry summers — the same expansion-contraction cycle that cracks undersized bases across Central Virginia. Equestrian-property driveways face a compounding load: horses, trailers, and feed deliveries hit the surface repeatedly at concentrated points, which demands a deeper base than a passenger-car driveway. We build equestrian approaches with a 6–8-inch compacted aggregate base, proper crown for edge drainage, and a binder course specified for moderate traffic. Long rural runs also need turnouts or widened passing areas at the bottom to prevent mud push-off from trailer backing.',
    },
    faqs: [
      {
        q: 'Can you pave a horse farm driveway or trailer approach in Powhatan County?',
        a: 'Yes — equestrian driveways and trailer approaches are regular work for us in Powhatan. We build them to a heavier spec than standard residential: deeper aggregate base, a crowned cross-section that drains to both edges, and a concrete or reinforced apron at the turning area if needed. Standard residential asphalt spec ruts under repeated trailer loading within a few years.',
      },
      {
        q: 'Do new subdivisions in Powhatan County have paving problems?',
        a: 'Some do. Builder fill on newer Route 60 corridor lots is sometimes placed fast and not compacted properly, leaving a spongy base that pumps under traffic. We probe and test before we quote — if the base is soft, we excavate and recompact rather than pave over a problem. A failed base repair costs two to three times as much as fixing it before the first pour.',
      },
      {
        q: 'What does a long rural driveway cost in Powhatan?',
        a: 'Rural residential driveways in Powhatan County typically run $4–$7 per square foot installed. Long runs — 300 feet or more — can be lower per foot because fixed mobilization costs spread over more area. Equestrian approaches with heavier base specs cost more. We provide free on-site estimates for any property in Powhatan.',
      },
    ],
    reviews: 22,
    rating: 4.9,
  },
  {
    slug: 'goochland-va',
    city: 'Goochland',
    state: 'Virginia',
    stateAbbr: 'VA',
    region: 'Central Virginia',
    county: 'Goochland',
    geo: { lat: 37.6837, lng: -77.8836 },
    headline: 'Asphalt Paving in Goochland County, VA — River Road Estate Driveways, Rural Lanes & Wine Country Approaches',
    intro:
      'Goochland County stretches along the James River between Richmond\'s western suburbs and the Piedmont interior, and the paving work here reflects that geography: West End-adjacent estate driveways on River Road and Route 6, rural farm and vineyard approaches west of Goochland Court House, and the longer low-density runs that come with Goochland\'s five-acre minimum lot size in most of the county. The James River corridor brings river-bank clay with high moisture variability — driveways here fail from base saturation as often as from load. We build to the soil, not to a generic spec.',
    neighborhoods: [
      'Goochland Court House', 'Manakin-Sabot', 'Hadensville', 'Fife',
      'Shallow Well', 'Centerville', 'Sandy Hook', 'River Road corridor',
    ],
    landmarks: ['Goochland County Courthouse', 'River Road / Route 6 corridor', 'James River (Goochland access)', 'Elk Hill Farm Winery', 'Tuckahoe Creek', 'Route 250 West'],
    climate: {
      title: 'James River Clay, River-Bank Moisture & Low-Density Long Driveways',
      body: 'Goochland\'s riverfront properties sit on alluvial clay that retains moisture long after rain has stopped — a base problem for any paving that wasn\'t set deep enough or drained properly. Further back from the river the soil transitions to Piedmont red clay with the same shrink-swell behavior seen across Central Virginia. Long rural driveways — common in Goochland given the lot sizes — need a full crown so water runs to the edges, not the center, and properly sloped turnouts where the grade changes. We size the base to the soil profile and traffic, not to a residential minimum.',
    },
    faqs: [
      {
        q: 'Do you pave driveways on River Road and the Route 6 corridor in Goochland?',
        a: 'Yes — River Road and Route 6 in Manakin-Sabot and Fife are regular service areas for us. Estate driveways along the river corridor get a properly drained base with geotextile filter fabric under the aggregate where the soil is particularly wet, and we match the finished width and edge treatment to the property character.',
      },
      {
        q: 'What is the minimum driveway spec for a property in rural Goochland?',
        a: 'For a rural residential driveway in Goochland we build a minimum 6-inch compacted 21-A aggregate base, a full-width geotextile fabric separator where clay subsoil is soft or wet, a 2-inch binder course, and 1.5-inch surface. Longer runs or heavier traffic — farm equipment, boat trailers — get a deeper binder and additional base.',
      },
      {
        q: 'Can you pave a vineyard or winery approach road in Goochland County?',
        a: 'Yes. Vineyard and farm access roads carry delivery trucks, harvest equipment, and event visitor traffic — they need a commercial-grade base even if they look rural. We\'ve built and rebuilt farm lane approaches across Goochland and the surrounding wine country and spec them to the heaviest anticipated load, not the lightest.',
      },
    ],
    reviews: 18,
    rating: 5.0,
  },
  {
    slug: 'amelia-va',
    city: 'Amelia',
    state: 'Virginia',
    stateAbbr: 'VA',
    region: 'Central Virginia',
    county: 'Amelia',
    geo: { lat: 37.3438, lng: -77.9836 },
    headline: 'Asphalt Paving in Amelia County, VA — Southside Rural Driveways, Farm Lanes & Tar and Chip Paving',
    intro:
      'Amelia County is deep Southside rural — long driveways on large lots, county-maintained gravel roads that transition to private asphalt or tar-and-chip, and the kind of low-traffic estate paving that rewards a proper base over a rushed surface. We serve Amelia Court House and the Route 360 / Route 153 corridors, paving residential driveways and farm lane approaches for properties spread across one of Virginia\'s most rural counties. Tar and chip is a strong option here — it matches the rural aesthetic, handles the low traffic volumes well, and costs 30–40% less than full hot-mix on long driveways while lasting 10–15 years with a chip seal renewal.',
    neighborhoods: [
      'Amelia Court House', 'Deatonsville', 'Jetersville', 'Mannboro',
      'Winterham', 'Chula', 'Route 360 corridor', 'Route 153 corridor',
    ],
    landmarks: ['Amelia County Courthouse', 'Route 360 corridor', 'Appomattox-Buckingham State Forest (Amelia fringe)', 'Amelia Wildlife Management Area', 'Deep Creek'],
    climate: {
      title: 'Southside Clay, Low Traffic & Tar-and-Chip Suitability',
      body: 'Amelia\'s soils are Southside Piedmont clay — heavy, slow-draining, and prone to base saturation after wet winters. Long rural driveways on large lots mean water runoff has to be managed the full length of the run, not just at the entrance. Because Amelia sees low daily traffic volumes on most private driveways, tar-and-chip is frequently the right call: it drains better than impervious asphalt, handles freeze-thaw without cracking as severely, and is renewable with a chip seal top coat at roughly 40% of replacement cost. For heavier-traffic entrances and commercial properties, we build full hot-mix with the compacted aggregate base and drainage crowns that Virginia clay demands.',
    },
    faqs: [
      {
        q: 'Is tar and chip a good choice for a rural driveway in Amelia County?',
        a: 'Yes — for a low-traffic rural driveway in Amelia, tar and chip typically runs $2.50–$4.50 per square foot installed versus $4–$7 for full hot-mix asphalt. It drains well on long runs, tolerates the freeze-thaw cycle, suits the rural aesthetic, and can be renewed with a chip seal top coat at about 40% of replacement cost every 8–12 years. We\'ll walk you through both options so you can decide what fits your budget and use.',
      },
      {
        q: 'How deep does the base need to be on a rural driveway in Amelia County?',
        a: 'On Amelia\'s Southside clay, we build a minimum 6-inch compacted aggregate base for standard residential driveways. Longer runs where water has more time to infiltrate the base, or driveways that carry farm equipment, get 8 inches or a geotextile separator under the stone to prevent clay pumping up through the base material.',
      },
      {
        q: 'Do you serve Amelia Court House and the surrounding rural properties?',
        a: 'Yes — Amelia Court House and the full Route 360 and Route 153 corridors are service areas for us. Rural Southside is where we started and these counties get the same on-site assessment and written estimate process as our Richmond-area work.',
      },
    ],
    reviews: 16,
    rating: 4.8,
  },
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
  {
    slug: 'charles-city-va',
    city: 'Charles City',
    state: 'Virginia',
    stateAbbr: 'VA',
    region: 'Central Virginia',
    county: 'Charles City',
    geo: { lat: 37.3424, lng: -77.0758 },
    headline: 'Asphalt Paving in Charles City County, VA — James River Plantation Approaches & Historic Rural Driveways',
    intro:
      'Charles City County is one of Virginia\'s most historically significant rural counties — Route 5 runs through it as a National Scenic Byway, connecting Richmond to Williamsburg past Shirley, Berkeley, and Westover Plantations. Paving here means long estate and plantation-approach driveways on James River alluvial clay, farm lane rebuilds on working agricultural properties, and the occasional commercial or civic lot along the thin Route 5 commercial corridor. We understand that a paving job in Charles City County is visible to historic properties and neighbors who take the landscape seriously — and we work accordingly.',
    neighborhoods: [
      'Charles City Court House', 'Weyanoke', 'Ruthville', 'Barretts',
      'Lanexa fringe', 'Route 5 corridor', 'Sherwood Forest',
    ],
    landmarks: ['Shirley Plantation', 'Berkeley Plantation', 'Westover Plantation', 'Sherwood Forest (John Tyler estate)', 'Route 5 National Scenic Byway', 'James River (Charles City access)'],
    climate: {
      title: 'James River Alluvial Clay, Historic-Landscape Sensitivity & Long Low-Traffic Runs',
      body: 'The James River bottomlands through Charles City carry alluvial clay that retains moisture year-round — a base-saturation risk if the sub-grade drainage and stone base aren\'t set correctly. Plantation and estate driveways here can run 500–1,500 feet, which means the grade and crown have to be designed to drain water the full length of the run without ponding at any transition point. Traffic volumes are low enough that tar-and-chip is an appropriate surface alternative on working farm lanes, and it fits the rural landscape better than a glossy black asphalt finish.',
    },
    faqs: [
      {
        q: 'Can you pave a long plantation or estate driveway in Charles City County?',
        a: 'Yes — long estate and plantation-approach driveways along Route 5 and the James River corridor are the kind of work we do in Charles City County. We design the grade and drainage for the full run, not just the entrance, set the base depth to the soil moisture conditions, and deliver a clean finished edge that fits a historic landscape.',
      },
      {
        q: 'Is tar and chip suitable for a farm lane in Charles City County?',
        a: 'Yes — for low-traffic farm lanes in Charles City, tar and chip runs $2.50–$4.50 per square foot installed versus $4–$7 for full hot-mix. It handles the clay subsoil drainage better than an impervious asphalt surface on long rural runs, suits the agricultural landscape, and can be chip-seal renewed at about 40% of replacement cost every 8–12 years.',
      },
      {
        q: 'How far out is Charles City County for J. Worden & Sons?',
        a: 'Charles City County is about 30–45 minutes east of our Chester base depending on where in the county the property sits. We serve the full Route 5 corridor from the New Kent County line to the Williamsburg fringe, and we provide free on-site estimates with no travel charge to the county.',
      },
    ],
    reviews: 14,
    rating: 5.0,
  },
  {
    slug: 'cumberland-va',
    city: 'Cumberland',
    state: 'Virginia',
    stateAbbr: 'VA',
    region: 'Central Virginia',
    county: 'Cumberland',
    geo: { lat: 37.5101, lng: -78.2422 },
    headline: 'Asphalt Paving in Cumberland County, VA — Remote Rural Driveways, Farm Lanes & Estate Approaches',
    intro:
      'Cumberland County sits between the Appomattox River and the James River, west of Powhatan and south of Goochland — one of Central Virginia\'s most rural and least-developed counties. Paving here is almost entirely residential and agricultural: long driveways on large rural lots, farm lane rebuilds on working properties, and the occasional church or community hall parking lot. Low traffic volumes and tight budgets make tar-and-chip a frequent fit for Cumberland, and we know how to build it to last on the Piedmont clay that dominates the county\'s subsoil.',
    neighborhoods: [
      'Cumberland Court House', 'Cartersville', 'Farmville fringe', 'Columbia',
      'Faber', 'Route 60 corridor', 'Route 45 corridor',
    ],
    landmarks: ['Cumberland County Courthouse', 'Appomattox River (Cumberland access)', 'James River (western access)', 'Route 60 corridor', 'Willis Mountain (kyanite quarry)'],
    climate: {
      title: 'Piedmont Clay, Appomattox River Moisture & Rural Low-Traffic Paving',
      body: 'Cumberland\'s Piedmont soils are heavy clay with poor drainage — the same subsoil profile as the rest of the Central Virginia Piedmont, but with more rural isolation and less access to the rapid-response contractors that serve suburban markets. That means a base failure on a Cumberland driveway can sit unrepaired for years, getting progressively worse. We diagnose the existing sub-grade condition before quoting so we\'re fixing the problem, not just covering it up. For low-traffic rural lanes, we evaluate whether tar-and-chip delivers better value than full hot-mix, and we give you honest numbers for both.',
    },
    faqs: [
      {
        q: 'Do you serve Cumberland County for residential and farm paving?',
        a: 'Yes — we serve Cumberland Court House, Cartersville, and the Route 60 and Route 45 corridors. Cumberland is farther out than our Richmond core but we make the drive and provide free on-site estimates with no travel charge within the county.',
      },
      {
        q: 'Is tar and chip a good option for a low-budget rural driveway in Cumberland?',
        a: 'For a low-traffic rural driveway in Cumberland, tar and chip typically saves 30–40% compared to full hot-mix — running $2.50–$4.50 per square foot installed versus $4–$7 for asphalt. It performs well on low-traffic clay subsoil conditions and can be renewed with a chip seal at 40% of replacement cost every 8–12 years. We\'ll walk through both options with you on-site.',
      },
      {
        q: 'My gravel driveway in Cumberland has soft spots and ruts — can it be paved over?',
        a: 'Usually not without addressing the soft spots first. Soft gravel sections are typically caused by sub-grade clay saturation or base material that has been pumped up by clay underneath. We probe and test before we quote — if the base needs work, we excavate and recompact before paving rather than letting a weak spot turn into a warranty claim.',
      },
    ],
    reviews: 12,
    rating: 4.9,
  },
  {
    slug: 'fluvanna-va',
    city: 'Fluvanna',
    state: 'Virginia',
    stateAbbr: 'VA',
    region: 'Central Virginia',
    county: 'Fluvanna',
    geo: { lat: 37.8412, lng: -78.2769 },
    headline: 'Asphalt Paving in Fluvanna County, VA — Lake Monticello Driveways, Palmyra Lots & Route 250 Corridor Paving',
    intro:
      'Fluvanna County is growing faster than most of Central Virginia\'s rural counties, driven largely by Lake Monticello — a private residential lake community east of Charlottesville that has brought thousands of homes and driveways to an otherwise rural county. We pave driveways throughout Lake Monticello\'s neighborhoods, resurface commercial lots along the Route 250 corridor in Palmyra, and build new driveways and access roads for the new-construction growth spreading east from Charlottesville. Builder fill compaction on newer Fluvanna lots is a known issue — we check before we pour.',
    neighborhoods: [
      'Lake Monticello', 'Palmyra', 'Columbia', 'Cunningham',
      'Fork Union', 'Riverton', 'Route 250 corridor',
    ],
    landmarks: ['Lake Monticello', 'Fluvanna County Courthouse (Palmyra)', 'Fork Union Military Academy', 'Route 250 corridor', 'James River (Columbia access)', 'Rivanna River'],
    climate: {
      title: 'Lake Monticello Clay Fill, Rapid Growth & Freeze-Thaw Exposure',
      body: 'Lake Monticello\'s neighborhoods were developed in multiple phases over several decades, and the base quality under older driveways varies widely. Some 1970s and 1980s-era driveways were built on poorly compacted fill that has been slowly settling ever since. Newer construction around Palmyra and the Route 250 growth corridor sometimes has the opposite problem: builder fill placed for speed rather than compaction that fails in the first winter. Fluvanna\'s Piedmont clay also runs cold and wet in January and February — 35–40 freeze-thaw cycles per year is enough to crack any base with hidden soft spots.',
    },
    faqs: [
      {
        q: 'Do you pave driveways in Lake Monticello?',
        a: 'Yes — Lake Monticello is a primary service area for Fluvanna County work. We pave new driveways, resurface aging ones, and repair cracked or settled sections throughout the community. Lake Monticello\'s gate and road access rules are familiar to us — we coordinate delivery and equipment timing to work within the community\'s requirements.',
      },
      {
        q: 'How much does driveway paving cost in Fluvanna County?',
        a: 'Residential driveways in Fluvanna County typically run $4–$7 per square foot installed. Lake Monticello driveways on level lots toward the lower end; steeper or longer driveways that need extra drainage work or base remediation toward the higher end. We provide free on-site estimates with a written line-item breakdown.',
      },
      {
        q: 'My Lake Monticello driveway is cracking and has soft spots — what\'s the fix?',
        a: 'Soft spots under an asphalt surface usually mean base failure — either the original fill compaction was inadequate or clay has migrated up through the stone. A surface overlay won\'t hold over a soft base. We core or probe the soft areas, excavate to stable material, recompact and replace the base, then resurface. The repair costs more than a straight overlay but it lasts instead of failing again in two winters.',
      },
    ],
    reviews: 24,
    rating: 4.9,
  },
  {
    slug: 'louisa-va',
    city: 'Louisa',
    state: 'Virginia',
    stateAbbr: 'VA',
    region: 'Central Virginia',
    county: 'Louisa',
    geo: { lat: 37.9786, lng: -77.9961 },
    headline: 'Asphalt Paving in Louisa County, VA — Lake Anna Driveways, Rural Property Paving & Route 33 Corridor',
    intro:
      'Louisa County is Lake Anna country — the largest inland lake in Virginia, ringed by second-home properties, recreational residences, and year-round lakefront driveways that take a beating from boat-trailer and ATV traffic. We pave residential driveways throughout Lake Anna\'s Louisa County shoreline, build new driveways for the new-construction growth pushing west from the Fredericksburg corridor, and service rural properties along Route 33 and Route 208. Lake Anna properties need heavier base specs than typical residential — boat trailers, jet ski rigs, and the sandy loam soils near the lake require a deeper foundation to stay stable.',
    neighborhoods: [
      'Lake Anna (Louisa County shoreline)', 'Louisa Court House', 'Mineral',
      'Bumpass', 'Ferncliff', 'Trevilians', 'Route 208 corridor',
    ],
    landmarks: ['Lake Anna', 'Lake Anna State Park', 'Dominion Energy North Anna Power Station', 'Louisa County Courthouse', 'Route 208 corridor', 'CSX rail corridor (Trevilians)'],
    climate: {
      title: 'Sandy Lake Soils, Boat-Trailer Traffic & Freeze-Thaw Exposure',
      body: 'Lake Anna\'s Louisa County shoreline sits on sandy loam soils rather than the pure clay found farther south in the Piedmont — which means water moves faster but the base material can wash out if the drainage isn\'t designed correctly. Boat-trailer driveways need a wider turning radius, a concrete or heavily reinforced apron at the bottom, and enough slope to drain water off the launch area rather than pooling on the surface. Further inland on the Route 33 and Route 208 corridors, Piedmont clay returns, and the usual freeze-thaw base requirements apply. Louisa County averages 35–40 freeze-thaw cycles per year.',
    },
    faqs: [
      {
        q: 'Do you pave driveways at Lake Anna in Louisa County?',
        a: 'Yes — Lake Anna driveways on the Louisa County side are a regular service area for us. Lakefront driveways often carry boat trailers, ATVs, and recreational equipment that standard residential asphalt isn\'t spec\'d for. We build them heavier: deeper aggregate base, reinforced apron at the turning/launch area, and drainage designed for both rain runoff and trailer wash-down.',
      },
      {
        q: 'How much does driveway paving cost in Louisa County?',
        a: 'Residential driveways in Louisa County typically run $4–$7 per square foot installed. Lake Anna lakefront driveways with boat-trailer aprons and reinforced turning areas are toward the higher end. We provide free on-site estimates — call or text for availability.',
      },
      {
        q: 'My Lake Anna driveway has cracking and edge failures — can it be repaired or does it need to be replaced?',
        a: 'It depends on the base condition. Surface cracks that haven\'t broken through to the base can be crack-filled and sealed to extend life 3–5 years. Edge failures where the asphalt is crumbling at the sides usually indicate the base has washed out — those sections need excavation, base replacement, and a new surface patch. A full replacement is warranted when more than 30% of the surface shows structural failure. We assess and give you an honest recommendation on repair vs replace.',
      },
    ],
    reviews: 20,
    rating: 4.9,
  },
  {
    slug: 'king-william-va',
    city: 'King William',
    state: 'Virginia',
    stateAbbr: 'VA',
    region: 'Central Virginia',
    county: 'King William',
    geo: { lat: 37.6826, lng: -77.1011 },
    headline: 'Asphalt Paving in King William County, VA — Rural Driveways, Farm Lanes & Mattaponi River Corridor Paving',
    intro:
      'King William County sits between the Pamunkey and Mattaponi Rivers northeast of Richmond — one of Virginia\'s most rural and historically rooted counties, home to the Pamunkey and Mattaponi Indian Tribal communities and thousands of acres of working farmland. Paving here is almost entirely rural: long residential driveways on large lots, farm lane rebuilds, and the occasional civic or church lot along the Route 360 corridor through King William Court House. Low traffic volumes, large properties, and rural clay subsoil make tar-and-chip a practical choice for many King William jobs alongside full hot-mix asphalt.',
    neighborhoods: [
      'King William Court House', 'Aylett', 'West Point fringe', 'Mangohick',
      'Acquinton', 'Route 360 corridor', 'Mattaponi corridor',
    ],
    landmarks: ['King William County Courthouse', 'Mattaponi Indian Tribal Reservation', 'Pamunkey Indian Tribal Reservation', 'Pamunkey River', 'Mattaponi River', 'Route 360 corridor'],
    climate: {
      title: 'River-Bottom Clay, Long Rural Driveways & Low-Traffic Paving Needs',
      body: 'King William\'s Pamunkey and Mattaponi River bottomlands carry heavy alluvial clay that holds moisture through the winter — a base-saturation problem if the sub-grade drainage and aggregate base aren\'t sized to the soil. Long rural driveways on these floodplain-adjacent lots need a crowned cross-section, proper side drainage, and a base that won\'t pump clay up through the stone. Inland areas transition to Piedmont clay with the familiar freeze-thaw cycle exposure. Because daily traffic volumes on most King William driveways are low, we evaluate tar-and-chip versus full asphalt on every job and give you honest cost and performance numbers for both options.',
    },
    faqs: [
      {
        q: 'Do you pave driveways and farm lanes in King William County?',
        a: 'Yes — King William County is a service area for us, including the Route 360 corridor, Aylett, and the Mattaponi and Pamunkey River corridor properties. Rural King William is about 45–60 minutes from our Chester base and we provide free on-site estimates with no travel charge within the county.',
      },
      {
        q: 'Is tar and chip a good fit for a King William County rural driveway?',
        a: 'Often yes. Tar and chip typically runs $2.50–$4.50 per square foot in King William versus $4–$7 for full hot-mix asphalt — a 30–40% savings on long rural runs. It handles clay subsoil conditions and freeze-thaw well on low-traffic driveways, fits the rural landscape, and can be chip-seal renewed at about 40% of replacement cost every 8–12 years. We\'ll walk through both options with you on-site.',
      },
      {
        q: 'My King William gravel driveway turns to mud in wet weather — can it be paved?',
        a: 'Yes, and it\'s usually the right call when a gravel driveway is causing repeated maintenance headaches. We grade and crown the sub-grade first, install geotextile fabric to separate the clay from the aggregate, build the compacted base, and then pave. A properly built asphalt or tar-and-chip surface eliminates the mud problem permanently rather than adding more gravel every year.',
      },
    ],
    reviews: 15,
    rating: 5.0,
  },

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
