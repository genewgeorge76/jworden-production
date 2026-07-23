# J. Worden & Sons Asphalt Paving — Website

> **This is the one canonical repository for the J. Worden & Sons Asphalt Paving website.**
> All development, changes, and deployments should happen here.

A static HTML/CSS website for a 4th-generation family asphalt paving contractor based in Richmond, VA.

## Pages

### Service Pages
- `index.html` — Home page
- `asphalt-driveway-paving.html` — Asphalt driveway paving service
- `asphalt-paving-cost-virginia.html` — Cost guide
- `asphalt-repair.html` — Asphalt repair service
- `chip-and-tar.html` — Chip and tar service
- `cobblestone-paving.html` — Cobblestone paving service
- `commercial-paving.html` — Commercial paving service
- `concrete-paving.html` — Concrete paving service
- `driveway-paving.html` — Driveway paving service
- `grading-excavation.html` — Grading & excavation service
- `line-striping.html` — Line striping service
- `parking-lot-paving.html` — Parking lot paving service
- `residential-asphalt-paving.html` — Residential asphalt paving service
- `sealcoating.html` — Sealcoating service
- `stone-masonry-paving.html` — Stone masonry paving service

### Location Pages
- `ashland-asphalt-paving.html` — Ashland
- `charlottesville-residential-paving.html` — Charlottesville
- `chester-va-paving.html` — Chester, VA
- `chesterfield-asphalt-paving.html` — Chesterfield
- `downtown-richmond-driveway-paving.html` — Downtown Richmond
- `fairfax-county-driveway-paving.html` — Fairfax County
- `glen-allen-asphalt-paving.html` — Glen Allen
- `henrico-asphalt-paving.html` — Henrico
- `mclean-residential-paving.html` — McLean
- `mechanicsville-asphalt-paving.html` — Mechanicsville
- `midlothian-asphalt-paving.html` — Midlothian
- `new-kent-asphalt-paving.html` — New Kent
- `richmond-va-asphalt-paving.html` — Richmond, VA (asphalt)
- `richmond-va-paving.html` — Richmond, VA (general)
- `short-pump-asphalt-paving.html` — Short Pump
- `sleepy-hollow-driveway-paving.html` — Sleepy Hollow
- `tuckahoe-driveway-paving.html` — Tuckahoe
- `virginia-beach-driveway-paving.html` — Virginia Beach
- `williamsburg-asphalt-paving.html` — Williamsburg

## Build

```bash
npm install
npm run build
```

The build script minifies HTML and CSS into a `dist/` folder.

## Deployment

Deployed via [Netlify](https://www.netlify.com/) (see `netlify.toml`).

## Repository Consolidation

Yes — keeping everything in **one repository is the right call**. Here's why:

- **Single source of truth:** One place to make changes, no need to remember which repo has the latest version.
- **Simpler deployments:** Netlify only needs to watch this one repo.
- **Easier to maintain:** All pages, styles, and scripts live together.
- **Clear history:** Every change is tracked in one place.

All previous experimental or duplicate repositories (`final-j-worden`, `gene-final`, `finalgene2000`, `genebigfinal`, etc.) have been superseded by this repository. Those old repos can be archived on GitHub (Settings → Archive this repository) so they are preserved but no longer active.
