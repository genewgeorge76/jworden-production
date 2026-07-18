const reasons = [
  {
    title: "Family-Owned & Operated",
    description:
      "Four generations of paving expertise. A family member is on-site for every project — your satisfaction is personal to us.",
  },
  {
    title: "Licensed, Bonded & Insured",
    description:
      "Fully licensed in North Carolina and South Carolina with comprehensive liability and workers' compensation coverage.",
  },
  {
    title: "Quality Materials Only",
    description:
      "We use premium hot-mix asphalt from certified plants and commercial-grade sealcoat products — never cut corners.",
  },
  {
    title: "Transparent Pricing",
    description:
      "Detailed written estimates with no hidden fees. We explain every line item so you know exactly what you're paying for.",
  },
  {
    title: "Proven Track Record",
    description:
      "Trusted by national restaurant chains, HOAs, municipalities, and thousands of residential customers across the Carolinas.",
  },
  {
    title: "Warranty Backed",
    description:
      "We stand behind our work with written warranties on materials and workmanship. If there's an issue, we'll make it right.",
  },
];

export default function WhyUs() {
  return (
    <section id="why-us" className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-brand-yellow-dark">
            The Carolina Blacktop Difference
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-brand-dark sm:text-4xl">
            Why Customers Choose Us
          </h2>
        </div>
        <div className="mx-auto mt-16 max-w-5xl">
          <div className="grid gap-x-12 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {reasons.map((reason, idx) => (
              <div key={reason.title} className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-yellow/10 text-lg font-bold text-brand-yellow-dark">
                  {idx + 1}
                </div>
                <div>
                  <h3 className="text-base font-bold text-brand-dark">
                    {reason.title}
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-zinc-600">
                    {reason.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
