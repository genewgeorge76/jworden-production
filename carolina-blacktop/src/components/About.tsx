export default function About() {
  return (
    <section id="about" className="bg-zinc-50 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-brand-yellow-dark">
              Our Story
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-brand-dark sm:text-4xl">
              Four Generations of Blacktop Excellence
            </h2>
            <div className="mt-6 space-y-4 text-base leading-7 text-zinc-600">
              <p>
                Since 1984, the Carolina Blacktop family has been laying
                asphalt across the Carolinas. What started as a single truck
                and a handshake has grown into one of the region&apos;s most
                trusted paving companies.
              </p>
              <p>
                We&apos;re independent and locally owned — not part of a
                franchise or conglomerate. Every job is supervised by a family
                member who takes personal pride in the finished product. Our
                reputation has been vetted by national brands including KFC,
                Arby&apos;s, and Taco Bell for their commercial lot work.
              </p>
              <p>
                We believe quality pavement starts with quality people. Our
                crews are trained, certified, and committed to doing the job
                right the first time.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl bg-brand-dark p-8 text-center">
              <div className="text-4xl font-extrabold text-brand-yellow">
                1984
              </div>
              <div className="mt-2 text-sm text-zinc-400">Founded</div>
            </div>
            <div className="rounded-2xl bg-brand-dark p-8 text-center">
              <div className="text-4xl font-extrabold text-brand-yellow">
                4th
              </div>
              <div className="mt-2 text-sm text-zinc-400">Generation</div>
            </div>
            <div className="rounded-2xl bg-brand-dark p-8 text-center">
              <div className="text-4xl font-extrabold text-brand-yellow">
                NC &amp; SC
              </div>
              <div className="mt-2 text-sm text-zinc-400">Service Area</div>
            </div>
            <div className="rounded-2xl bg-brand-yellow p-8 text-center">
              <div className="text-4xl font-extrabold text-brand-dark">
                A+
              </div>
              <div className="mt-2 text-sm text-brand-dark/70">BBB Rating</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
