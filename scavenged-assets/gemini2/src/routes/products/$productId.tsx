import { Link, createFileRoute } from '@tanstack/react-router'
import services from '../../data/services'

export const Route = createFileRoute('/products/$productId')({
  component: RouteComponent,
  loader: async ({ params }) => {
    const service = services.find(
      (service) => service.id === +params.productId,
    )
    if (!service) {
      throw new Error(`Service not found for id ${params.productId}`)
    }
    return service
  },
})

function RouteComponent() {
  const service = Route.useLoaderData()

  return (
    <div className="max-w-[1100px] mx-auto px-6 py-20">
      <Link to="/" className="inline-block mb-8 text-[#c8a84b] hover:underline font-sans text-sm">
        &larr; Back to all services
      </Link>

      <div className="flex flex-col md:flex-row gap-16">
        <div className="w-full md:w-[50%]">
          <div className="bg-[#f5f5f0] border border-[#e8e8e0] rounded-sm h-[400px] flex items-center justify-center text-6xl">
            {service.id === 1 ? '🏗️' : service.id === 2 ? '🛡️' : '🏠'}
          </div>
        </div>

        <div className="w-full md:w-[50%]">
          <p className="font-sans text-[0.7rem] tracking-[0.2em] uppercase text-[#c8a84b] mb-2">Service Details</p>
          <h1 className="text-4xl font-bold text-[#111] mb-6">{service.name}</h1>
          <p className="text-[#2b2b2b] text-lg mb-8 leading-relaxed">{service.description}</p>

          <div className="mb-8">
            <h3 className="text-sm font-bold uppercase tracking-wider mb-4 border-b pb-2">Key Features</h3>
            <ul className="space-y-3">
              {service.features.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-[#888] font-sans">
                   <span className="text-[#c8a84b] font-bold">✓</span>
                   {feature}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-center gap-6">
            <a href="tel:8044461296" className="bg-[#c8a84b] text-[#111] px-10 py-4 rounded-sm font-sans font-bold text-lg hover:bg-[#e0c06a] transition-colors">
              Call for a Free Quote
            </a>
            <div className="text-xl font-bold text-[#3d3d3d] uppercase tracking-widest text-[0.8rem]">
               Contact us 24/7
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
