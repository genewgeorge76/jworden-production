export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-brand-dark text-white">
      <div className="absolute inset-0 bg-[url('/hero-pattern.svg')] bg-cover bg-center opacity-10" />
      <div className="relative mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:py-40">
        <div className="max-w-2xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-yellow/30 bg-brand-yellow/10 px-4 py-1.5 text-sm font-medium text-brand-yellow">
            <span className="h-2 w-2 rounded-full bg-brand-yellow animate-pulse" />
            Serving the Carolinas Since 1984
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
            Paving the Way for a{" "}
            <span className="text-brand-yellow">Smoother Tomorrow</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-zinc-300">
            From driveways to commercial lots, Carolina Blacktop delivers
            quality asphalt paving, sealcoating, and maintenance you can trust.
            4th-generation expertise — built on reputation, not shortcuts.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <a
              href="#contact"
              className="rounded-lg bg-brand-yellow px-8 py-3.5 text-base font-bold text-brand-dark shadow-lg shadow-brand-yellow/20 transition-all hover:bg-brand-yellow-dark hover:shadow-brand-yellow/30"
            >
              Get a Free Estimate
            </a>
            <a
              href="#services"
              className="rounded-lg border border-white/20 px-8 py-3.5 text-base font-semibold text-white transition-colors hover:border-white/40 hover:bg-white/5"
            >
              Our Services
            </a>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-2 gap-8 sm:grid-cols-4">
          {[
            { value: "40+", label: "Years Experience" },
            { value: "2,500+", label: "Projects Completed" },
            { value: "4th", label: "Generation Family" },
            { value: "100%", label: "Licensed & Insured" },
          ].map((stat) => (
            <div key={stat.label} className="text-center sm:text-left">
              <div className="text-3xl font-extrabold text-brand-yellow">
                {stat.value}
              </div>
              <div className="mt-1 text-sm text-zinc-400">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
