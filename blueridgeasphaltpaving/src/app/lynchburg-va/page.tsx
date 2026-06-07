import { Metadata } from 'next'
import AIEstimationForm from '@/components/AIEstimationForm'

export const metadata: Metadata = {
  title: 'Blue Ridge Estate Paving in Lynchburg, VA | Premium Asphalt',
  description: 'Top-rated asphalt paving in Lynchburg, VA. Get an instant AI Satellite Scan for your commercial or residential project.',
}

export default function CityPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white pb-20">
      <div className="relative pt-32 pb-20 px-6 max-w-7xl mx-auto text-center border-b border-white/5">
        <div className="inline-block bg-yellow-400/10 border border-yellow-400/20 px-4 py-1.5 rounded-full text-yellow-400 text-xs font-bold tracking-widest uppercase mb-6">
          Serving Lynchburg, VA
        </div>
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-8 leading-[1.1] uppercase">
          PREMIUM PAVING IN <span style={{color:'var(--powerhouse-red)'}}>LYNCHBURG, VA</span>
        </h1>
        <p className="text-xl text-slate-400 font-light max-w-3xl mx-auto">
          Serving the entire Lynchburg, VA corridor with heritage craftsmanship and institutional performance.
        </p>
      </div>

      <div className="max-w-4xl mx-auto px-6 mt-16">
        <AIEstimationForm />
      </div>
    </main>
  )
}