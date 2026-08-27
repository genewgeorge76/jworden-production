import { motion } from 'framer-motion'

const NETWORK_HUBS = [
  {
    name: 'OBX Paving',
    url: 'https://obxpaving.com',
    region: 'Outer Banks, NC',
    desc: 'Coastal paving and sealcoating built for salt air and storm drainage on the Outer Banks.',
  },
  {
    name: 'Blue Ridge Asphalt',
    url: 'https://blueridgeasphaltpaving.com',
    region: 'Mountain & Valley Region',
    desc: 'Commercial paving and grading for mountain grades and valley freeze-thaw.',
  },
  {
    name: 'J. Worden Asphalt',
    url: 'https://jwordenasphaltpaving.com',
    region: 'Mid-Atlantic Central',
    desc: 'The home operation: commercial and residential asphalt across central Virginia since 1984.',
  },
]

export default function NetworkCoverage() {
  return (
    <section className="bg-brand-navy text-white py-20 px-4 border-t border-brand-amber/20">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-brand-amber text-sm font-semibold uppercase tracking-[0.08em] mb-3 block">
            The Worden Coverage Network
          </span>
          <h2 className="font-display font-bold text-3xl sm:text-4xl mb-4">
            One Family, Three Regional Brands
          </h2>
          <p className="text-white/60 text-lg max-w-2xl mx-auto leading-relaxed">
            The same crews and the same standards, organized by region so the spec fits the ground it sits on — coastal, mountain, and central Virginia.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {NETWORK_HUBS.map((hub, i) => (
            <motion.a
              key={hub.name}
              href={hub.url}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group block bg-white/5 border border-white/10 rounded-2xl p-8 hover:bg-white/10 hover:border-brand-amber/50 transition-all duration-300 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-amber/5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
              
              <h3 className="font-display font-bold text-xl mb-1 text-brand-amber">
                {hub.name}
              </h3>
              <div className="text-white/50 text-xs font-semibold tracking-wide uppercase mb-4">
                {hub.region}
              </div>
              <p className="text-white/70 text-sm leading-relaxed mb-6">
                {hub.desc}
              </p>
              
              <div className="flex items-center text-brand-amber text-sm font-semibold group-hover:translate-x-2 transition-transform">
                Visit the regional site <span className="ml-2">→</span>
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  )
}
