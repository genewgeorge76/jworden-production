import { portfolioPhotos } from '../data/legacyPortfolio';

export const SITE_IMAGES = {
  pavingHero: '/hero-paving.jpg',
  commercialLot: portfolioPhotos.find(p => p.category === 'Commercial')?.url || '/hero-paving.jpg',
  industrialWork: portfolioPhotos.find(p => p.title.toLowerCase().includes('big'))?.url || portfolioPhotos[1]?.url || '/hero-paving.jpg',
  siteWork: portfolioPhotos[2]?.url || '/hero-paving.jpg',
  driveway: portfolioPhotos.find(p => p.category === 'Residential')?.url || '/hero-paving.jpg',
  drivewayCrew: portfolioPhotos[4]?.url || '/hero-paving.jpg',
  concretePatio: portfolioPhotos.find(p => p.title.toLowerCase().includes('cobblestone'))?.url || portfolioPhotos[5]?.url || '/hero-paving.jpg',
  patioFinish: portfolioPhotos[6]?.url || '/hero-paving.jpg',
  streetPaving: portfolioPhotos[7]?.url || '/hero-paving.jpg',
}

export const PROOF_IMAGE_SET = [
  {
    src: SITE_IMAGES.commercialLot,
    label: 'Commercial Lot Proof',
    sublabel: 'Franchise paving and sealed parking areas',
    alt: 'Finished commercial parking lot paving and sealcoating work',
  },
  {
    src: SITE_IMAGES.driveway,
    label: 'Residential Driveway Proof',
    sublabel: 'Private driveway installation and repair',
    alt: 'Residential asphalt driveway completed by J. Worden and Sons',
  },
  {
    src: SITE_IMAGES.concretePatio,
    label: 'Concrete And Patio Proof',
    sublabel: 'GC, hardscape, and exterior planning',
    alt: 'Concrete patio and driveway work for residential construction planning',
  },
]