# Site Blueprint Studio

Optional high-logic system for designing beautiful, conversion-focused websites before implementation.

This does not change live routes. It generates design and build artifacts you can choose to adopt.

## What It Generates

Running `npm run ai:site-studio` (or `node scripts/site-blueprint-studio.mjs`) reads JSON files from `site-blueprints/` and generates:

- `generated/site-studio/<slug>/README.md`
  - visual direction
  - audience + offer framing
  - content hierarchy
  - conversion architecture
- `generated/site-studio/<slug>/tokens.css`
  - color tokens
  - typography tokens
  - spacing/radius/shadow tokens
- `generated/site-studio/<slug>/page-architecture.json`
  - homepage section map
  - pillar page plan
  - CTA and funnel sequence

## Why This Exists

Use this system when you want premium design logic and strategic structure preserved as reusable artifacts, without forcing immediate public deployment.

## Blueprint Schema

Required fields:

- `slug` (string)
- `brandName` (string)
- `market` (string)
- `positioning` (string)
- `primaryAudience` (string)
- `coreOffer` (string)
- `tone` (string)
- `visualDirection` (string)
- `colorSystem` (object)
  - `background`
  - `foreground`
  - `primary`
  - `accent`
- `typography` (object)
  - `display`
  - `body`
- `conversionModel` (object)
  - `primaryCTA`
  - `secondaryCTA`
  - `leadMagnet`

Optional:

- `enabled` (boolean, default true)
- `regions` (string[])
- `proofStack` (string[])
- `contentPillars` (string[])

## Usage

1. Add blueprint JSON files under `site-blueprints/`.
2. Run `npm run ai:site-studio`.
3. Review generated files in `generated/site-studio/`.
4. Choose when and where to implement in live routes.
