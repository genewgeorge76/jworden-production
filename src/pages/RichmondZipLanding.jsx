import React from "react";
import { useParams, Link } from "react-router-dom";
import { CheckCircle2, Phone, MapPin } from "lucide-react";
import SEO from "@/components/SEO";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SmartImage from "@/components/SmartImage";
import { trackPhoneClick } from "@/lib/analytics";
import { DEFAULT_RICHMOND_ZIP, RICHMOND_ZIP_PAGES } from "@/data/richmondZipPages";

function toTelHref(phoneDisplay) {
  const digits = String(phoneDisplay || "").replace(/\D/g, "");
  if (!digits) return "tel:+18044461296";
  if (digits.startsWith("1")) return `tel:+${digits}`;
  return `tel:+1${digits}`;
}

const PHONE_DISPLAY = "(804) 446-1296";
const PHONE_HREF = toTelHref(PHONE_DISPLAY);

export default function RichmondZipLanding() {
  const { zip } = useParams();
  const data = RICHMOND_ZIP_PAGES[zip] || RICHMOND_ZIP_PAGES[DEFAULT_RICHMOND_ZIP];

  const title = `${data.heroTitle} | J. Worden & Sons`;
  const description = `${data.heroBody} Serving ${data.titleArea} in ${data.city}, ${data.state} ${data.zip}.`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service",
        name: `Asphalt Paving in ${data.zip}`,
        serviceType: [
          "Residential driveway paving",
          "Commercial parking lot paving",
          "Asphalt resurfacing",
          "Asphalt repair",
          "Sealcoating"
        ],
        areaServed: {
          "@type": "PostalCode",
          postalCode: data.zip,
          addressLocality: data.city,
          addressRegion: data.state,
          addressCountry: "US"
        },
        provider: {
          "@type": "LocalBusiness",
          name: "J. Worden & Sons Paving LLC",
          telephone: "+18044461296",
          url: "https://www.jwordenasphaltpaving.com"
        }
      },
      {
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: `Do you handle tight-access paving projects in ${data.zip}?`,
            acceptedAnswer: {
              "@type": "Answer",
              text: `Yes. We routinely handle constrained access conditions across ${data.titleArea} using practical staging and controlled paving sequences.`
            }
          },
          {
            "@type": "Question",
            name: `What services are most common in ${data.zip}?`,
            acceptedAnswer: {
              "@type": "Answer",
              text: `${data.services.join(", ")}.`
            }
          }
        ]
      }
    ]
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-body">
      <SEO
        title={title}
        description={description}
        canonicalPath={`/locations/richmond-va/${data.zip}`}
        jsonLd={jsonLd}
      />
      <Navbar />

      <main>
        <section className="relative border-b border-border pt-28 pb-14 md:pb-18 overflow-hidden">
          <div className="absolute -top-20 right-0 w-72 h-72 rounded-full bg-primary/12 blur-3xl pointer-events-none" />
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-end">
              <div>
                <p className="font-display text-primary text-xs tracking-[0.3em] uppercase mb-4">
                  Richmond Zip Code Landing • {data.zip}
                </p>
                <h1 className="font-display font-black text-foreground text-4xl md:text-6xl uppercase tracking-tight leading-[0.95] max-w-5xl">
                  {data.heroTitle}
                </h1>
                <p className="text-muted-foreground text-base md:text-lg mt-6 max-w-3xl leading-relaxed">
                  {data.heroBody}
                </p>
                <div className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4 text-primary" />
                  {data.titleArea}
                </div>
                <div className="mt-8 flex flex-wrap gap-3">
                  <a
                    href={PHONE_HREF}
                    onClick={() => trackPhoneClick(`zip_${data.zip}_hero`)}
                    className="premium-cta inline-flex items-center gap-2 px-6 py-4 font-display font-bold text-sm tracking-[0.14em] uppercase text-primary-foreground"
                  >
                    <Phone className="w-4 h-4" />
                    Call 804-446-1296
                  </a>
                  <Link
                    to="/quote"
                    className="border border-primary/50 text-primary px-6 py-4 font-display font-bold text-sm tracking-[0.14em] uppercase hover:bg-primary/10 transition-colors"
                  >
                    Request Free Estimate
                  </Link>
                </div>
              </div>
              <figure className="border border-border bg-card p-3 shadow-[0_24px_60px_-36px_rgba(15,48,68,0.45)]">
                <SmartImage
                  src={data.image}
                  alt={`Asphalt paving project proof for Richmond ${data.zip}`}
                  width={1200}
                  height={900}
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="aspect-[4/3] w-full object-cover"
                  priority
                />
                <figcaption className="px-2 pt-3 font-display text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Documented project proof in and around {data.zip}
                </figcaption>
              </figure>
            </div>
          </div>
        </section>

        <section className="py-12 border-b border-border">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <h2 className="font-display font-black text-foreground text-3xl md:text-5xl uppercase tracking-tight leading-[0.95] mb-6">
              Local Service Focus For {data.zip}
            </h2>
            <p className="text-base text-muted-foreground leading-relaxed max-w-4xl mb-8">
              {data.challenge}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.services.map((service) => (
                <article key={service} className="border border-border bg-card p-5">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <p className="text-sm text-foreground/90 leading-relaxed">{service}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
