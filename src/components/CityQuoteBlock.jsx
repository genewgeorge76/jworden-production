import QuoteBlock from './QuoteBlock'
import { BRAND_JWORDEN } from '@/data/publicRecords'

/**
 * CityQuoteBlock — the location-page wording for the shared quote section.
 *
 * The markup, the records gate and the error guard all live in QuoteBlock now,
 * because the same section belongs on service pages and regional pages too and
 * two copies of a revenue path is one copy too many. What is left here is the
 * only part that is genuinely about a city: the sentence that names the soil
 * and the drainage, which is the thing that makes the page about that town
 * rather than about paving in general.
 */
export default function CityQuoteBlock({ city, slug }) {
  return (
    <QuoteBlock
      brand={BRAND_JWORDEN}
      source={`city_${slug}`}
      heading={`Request a Quote for ${city}`}
      intro={`Tell us the job and we will come and look at it. Free estimate, no obligation, and a straight answer about what ${city} soil and drainage mean for the price.`}
    />
  )
}
