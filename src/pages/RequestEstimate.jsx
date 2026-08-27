import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SEO from '@/components/SEO';
import LeadCaptureForm from '@/components/LeadCaptureForm';

export default function RequestEstimate() {
  return (
    <div className="min-h-screen bg-background font-body text-foreground pb-20 md:pb-0">
      <SEO
        title="Request a Free Paving Estimate | J. Worden & Sons"
        description="Get a free, no-obligation estimate from J. Worden & Sons — Richmond's 4th-generation asphalt paving contractor. Driveways, parking lots, sealcoating, and more across Central Virginia."
        canonicalPath="/request-estimate"
      />
      <Navbar />

      <section className="pt-32 pb-20 px-6">
        <div className="max-w-2xl mx-auto">
          <p className="font-display text-primary text-xs tracking-[0.1em] uppercase mb-4">
            Free · No Obligation
          </p>
          <h1 className="font-display font-bold text-foreground text-4xl md:text-6xl uppercase tracking-tighter leading-[0.9] mb-4">
            Request a Free Paving Estimate
          </h1>
          <p className="text-muted-foreground text-lg mb-10">
            Tell us about your project. We'll review the details and reach out within one business day with a written scope and pricing.
          </p>

          <div className="bg-background border border-border rounded-xl p-6 md:p-10 shadow-sm">
            <LeadCaptureForm />
          </div>

          <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            <div>
              <p className="font-display font-bold text-primary text-2xl uppercase">40+</p>
              <p className="text-muted-foreground text-sm mt-1">Years in Business</p>
            </div>
            <div>
              <p className="font-display font-bold text-primary text-2xl uppercase">4.9★</p>
              <p className="text-muted-foreground text-sm mt-1">Google Rating</p>
            </div>
            <div>
              <p className="font-display font-bold text-primary text-2xl uppercase">100%</p>
              <p className="text-muted-foreground text-sm mt-1">Licensed & Insured</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
