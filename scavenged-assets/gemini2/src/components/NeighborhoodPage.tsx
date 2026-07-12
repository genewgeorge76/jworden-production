import { Link } from '@tanstack/react-router'

type NeighborhoodPageProps = {
  name: string
  neighborhood: string
  landmarks: string[]
  zipCodes: string[]
}

export default function NeighborhoodPage({
  name,
  neighborhood,
  landmarks,
  zipCodes,
}: NeighborhoodPageProps) {
  return (
    <section className="relative overflow-hidden bg-linear-to-br from-[#0f0f0f] via-[#181818] to-[#222] px-6 pt-20 pb-12 text-center">
      <div className="absolute inset-0 bg-[repeating-linear-gradient(140deg,rgba(200,168,75,0.05)_0px,rgba(200,168,75,0.05)_2px,transparent_2px,transparent_44px)] opacity-60 pointer-events-none" />
      <div className="relative z-10 max-w-5xl mx-auto space-y-6">
        <div className="inline-block rounded-full border border-[#c8a84b]/60 px-4 py-1.5 text-[0.75rem] font-semibold uppercase tracking-[0.18em] text-[#c8a84b]">
          {neighborhood}
        </div>
        <div className="space-y-3">
          <h1 className="text-4xl md:text-6xl font-bold leading-tight">
            {name} <span className="text-[#c8a84b]">Paving</span>
          </h1>
          <p className="text-lg text-[#e8e8e0] leading-relaxed">
            Estate-grade paving with a 6-inch compacted stone base, quiet crews, and clean lines that respect historic architecture.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 text-left">
          <div className="rounded-sm border border-[#262626] bg-[#1a1a1a] p-6">
            <p className="font-sans text-[0.7rem] uppercase tracking-[0.18em] text-[#c8a84b] mb-2">
              Landmarks &amp; Streets
            </p>
            <ul className="space-y-3 text-[#e0e0e0]">
              {landmarks.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm">
                  <span className="text-[#c8a84b] font-bold mt-0.5">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-sm border border-[#262626] bg-[#1a1a1a] p-6">
            <p className="font-sans text-[0.7rem] uppercase tracking-[0.18em] text-[#c8a84b] mb-2">
              Zip Codes
            </p>
            <div className="flex flex-wrap gap-2">
              {zipCodes.map((zip) => (
                <span
                  key={zip}
                  className="rounded-sm border border-[#c8a84b]/50 bg-[#c8a84b]/10 px-3 py-1 text-sm font-semibold text-[#f0e5c4]"
                >
                  {zip}
                </span>
              ))}
            </div>
            <p className="text-sm text-[#c7c7c7] mt-4">
              Scheduling coordinated with neighbors and HOAs to keep access open while we pave.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-4 pt-2">
          <Link
            to="/"
            hash="contact"
            className="inline-flex items-center justify-center rounded-sm bg-[#c8a84b] px-6 py-3 text-[#111] text-sm font-bold uppercase tracking-[0.18em] hover:bg-[#e0c06a] transition-colors"
          >
            Request an Estimate
          </Link>
          <a
            href="tel:8044461296"
            className="inline-flex items-center justify-center rounded-sm border border-white/50 px-6 py-3 text-sm font-bold uppercase tracking-[0.18em] hover:border-[#c8a84b] hover:text-[#c8a84b] transition-colors"
          >
            Call 804-446-1296
          </a>
        </div>
      </div>
    </section>
  )
}
