import { Link, useParams } from 'react-router-dom'
import { Phone, Shield, MapPin, Calendar, CheckCircle2, ArrowRight, Camera } from 'lucide-react'
import SchemaMarkup, { serviceSchema, faqSchema } from '../components/SchemaMarkup'
import { getStatePavingPageModel, STATE_PAGE_ROUTES } from '../lib/states50'
import NotFound from './NotFound'

function statePavingSchema(model) {
  return [
    serviceSchema(
      `${model.name} Asphalt Paving & Commercial Pavement Services`,
      model.metaDescription,
      model.path,
      model.pricingSignal
    ),
    faqSchema([
      {
        question: `Do you provide commercial asphalt paving in ${model.name}?`,
        answer: `Yes, J. Worden & Sons provides premium commercial and residential paving, sealcoating, and repair throughout ${model.name}.`
      },
      {
        question: `When is the best time to pave in ${model.name}?`,
        answer: `The primary paving season in ${model.name} is generally ${model.pavingSeasonDesc} months long, but we also accommodate off-season emergency repairs and specific preservation techniques.`
      }
    ])
  ]
}

export default function StatePavingPage() {
  const { stateSlug } = useParams()
  const model = getStatePavingPageModel(stateSlug)

  if (!model) return <NotFound />

  const nearbyStates = STATE_PAGE_ROUTES.filter((state) => state.abbr !== model.abbr).slice(0, 6)

  return (
    <>
      <SchemaMarkup
        title={model.title}
        description={model.metaDescription}
        canonical={model.path}
        schema={statePavingSchema(model)}
        breadcrumb={[
          { name: 'Home', path: '/' },
          { name: 'Service Areas', path: '/service-areas' },
          { name: model.name, path: model.path },
        ]}
      />

      {/* PREMIUM HERO SECTION */}
      <section className="relative pt-32 pb-24 overflow-hidden bg-slate-900 border-b-8 border-amber-500">
        <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1584877132717-38cf9e6eb293?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/90 to-slate-900/40" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
          <div className="flex items-center gap-2 text-amber-500 mb-6 font-display uppercase tracking-widest text-sm">
            <MapPin className="w-5 h-5" />
            <span>Serving {model.name} Region</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black text-white font-display tracking-tight max-w-4xl leading-[1.05]">
            PREMIUM ASPHALT PAVING IN <span className="text-amber-500">{model.name.toUpperCase()}</span>
          </h1>
          
          <p className="mt-6 text-xl text-slate-300 max-w-2xl leading-relaxed">
            {model.climateNote} We bring our 40-year legacy of commercial code-compliance and premium residential driveway paving directly to your property.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-5">
            <Link to="/quote" className="inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 uppercase tracking-wide transition-colors">
              Get Your {model.name} Estimate <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
            <a href="tel:+18044461296" className="inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white border-2 border-slate-600 hover:border-amber-500 hover:bg-slate-800 transition-colors uppercase tracking-wide">
              <Phone className="mr-2 w-5 h-5" /> (804) 446-1296
            </a>
          </div>
        </div>
      </section>

      {/* CLIMATE & COMPLIANCE */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl font-black text-slate-900 font-display mb-6 tracking-tight">
                Engineered for {model.name}'s Climate & Traffic
              </h2>
              <p className="text-slate-600 text-lg leading-relaxed mb-6">
                {model.pricingSignal} Our specialized crews understand local zoning laws, freeze-thaw cycles, and optimal curing windows to ensure your asphalt outlasts the competition.
              </p>
              
              <ul className="space-y-4 mt-8">
                <li className="flex items-start gap-4">
                  <Calendar className="w-6 h-6 text-amber-500 shrink-0 mt-1" />
                  <div>
                    <h4 className="font-bold text-slate-900">Optimal Paving Window</h4>
                    <p className="text-slate-600 text-sm">We strictly adhere to {model.name}'s {model.asphaltMonths}-month seasonal paving window for structural longevity.</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <Shield className="w-6 h-6 text-amber-500 shrink-0 mt-1" />
                  <div>
                    <h4 className="font-bold text-slate-900">Code Compliant Work</h4>
                    <p className="text-slate-600 text-sm">Fully compliant with {model.name} state commercial zoning, ADA line striping regulations, and water runoff compliance.</p>
                  </div>
                </li>
              </ul>
            </div>

            <div className="bg-white p-8 sm:p-10 shadow-2xl border-t-4 border-amber-500 rounded-xl relative">
              <h3 className="font-black text-2xl text-slate-900 font-display mb-6 border-b pb-4">
                Available Services in {model.name}
              </h3>
              <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-4">
                {model.targetServices.slice(0, 8).map((service, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-amber-500 shrink-0" />
                    <span className="text-slate-700 font-medium text-sm">{service}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8 text-center pt-8 border-t border-slate-100">
                 <Link to="/services" className="text-amber-600 font-bold hover:text-amber-700 uppercase tracking-wide text-sm flex items-center justify-center gap-2">
                    View Complete Service List <ArrowRight className="w-4 h-4" />
                 </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* LOCAL OPTIMIZED GALLERY INTEGRATION */}
      <section className="py-24 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 text-amber-500 rounded-full text-xs font-bold uppercase tracking-widest mb-4">
               <Camera className="w-4 h-4" /> Live Project Intel
            </div>
            <h2 className="text-4xl font-black font-display tracking-tight mb-4">
              Recent Paving Work in {model.name}
            </h2>
            <p className="text-slate-400 text-lg">
              We document our work. View our latest commercial and residential asphalt jobs completed across {model.name}, featuring lightweight, optimized imagery engineered for maximum page speed.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              '/work/imported/KFC/IMG_9496.JPG',
              '/work/imported/KFC/IMG_9499-COLLAGE.jpg',
              '/work/imported/KFC/IMG_9499.JPG',
              '/work/imported/KFC/IMG_9500.JPG',
              '/work/imported/KFC/IMG_9507.JPG',
              '/work/imported/KFC/IMG_9509.JPG'
            ].map((imgSrc, idx) => (
              <div key={idx} 
                   className="group relative aspect-video bg-slate-800 overflow-hidden rounded-xl bg-cover bg-center cursor-pointer"
                   style={{ backgroundImage: `url('${imgSrc}')` }}>
                <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                   <p className="text-amber-500 font-bold uppercase tracking-widest text-xs mb-1">{model.name} Job Details</p>
                   <p className="text-white font-bold text-lg">Completed Paving Project</p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Link to="/gallery" className="inline-flex items-center justify-center px-8 py-3 text-sm font-bold text-slate-900 bg-white hover:bg-slate-200 uppercase tracking-wide transition-colors rounded">
              View Extended Portfolio
            </Link>
          </div>
        </div>
      </section>

      {/* NEARBY STATES CRAWLER LINKAGE */}
      <section className="py-16 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="font-display font-bold text-lg text-slate-400 uppercase tracking-widest mb-8">
            Also Serving Neighboring Regions
          </h3>
          <div className="flex flex-wrap justify-center gap-3">
            {nearbyStates.map((state) => (
              <Link
                key={state.abbr}
                to={state.path}
                className="px-6 py-2 rounded-full border border-slate-200 text-slate-600 hover:border-amber-500 hover:text-amber-600 hover:bg-amber-50 font-medium transition-all text-sm"
              >
                {state.name} Paving
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
