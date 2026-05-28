# Multi-State GBP Architecture (Atlanta & Florida)

## The Core Concept
When a vanity domain (e.g., `atlantapavingpros.com`) redirects to your main website (`jwordenasphaltpaving.com/locations/atlanta-ga`), Google transfers the domain authority to that specific location page. 

To rank in the Google Local Pack (Map Pack) in Atlanta and Florida while operating an application technically hosted under a single main domain, we must resolve a conflict: **Your main domain says Chester, VA, but the GBP says Atlanta, GA.**

## The Solution: LocalBusiness Schema Isolation
When Googlebot crawls `/locations/atlanta-ga`, it must **NOT** see your Chester, VA address in the code. If it does, Google's algorithm flags an inconsistency between the website and the Atlanta GBP, leading to a ranking penalty or listing suspension.

### Technical Implementation (Done today)
1. **Dynamic Schema**: The `LocationPage.jsx` React component has been updated. It now checks if a location is the Headquarters (`Chester`). If it is not the headquarters, the Virginia address is purged from the `LocalBusiness` schema for that page, relying entirely on the `areaServed` property and local metadata.
2. **Distinct GBP Flags**: In `src/lib/locations.js`, we introduced a `localGbpUrl` and `localPhone` property. If you have an Atlanta phone number or direct GBP link, we embed that directly into the Atlanta page, signaling to Google that this page strictly belongs to the Atlanta profile.
3. **Array Entries**: Added "Atlanta, GA" and "Orlando, FL" (as examples) to your `LOCATIONS` database so the `atlantapavingpros.com` redirect resolves properly instead of hitting a 404.

### Your Next Steps on the Google Business Dashboard
1. Log into your **Atlanta GBP**.
2. Go to "Edit Profile" -> "Contact".
3. Under "Website", paste: `https://www.jwordenasphaltpaving.com/locations/atlanta-ga`
4. Do **NOT** paste the homepage URL. Link it directly to the exact landing page.
5. Repeat this process for your Florida GBP (e.g., `https://www.jwordenasphaltpaving.com/locations/orlando-fl`).

By linking the GBP to the precise location URL, and stripping the Virginia address out of the backend schema for those specific URLs, you create an airtight, Google-compliant multi-state network that inherits the power of your vanity domains without causing NAP (Name, Address, Phone) confusion.
