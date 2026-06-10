import fs from "fs";
import path from "path";

function required(value, field) {
  if (!value) {
    throw new Error(`BUILD FAILED: Missing ${field} in truth.json`);
  }
}

function escapeHtml(input) {
  return String(input)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buildAuthoritySite(clientSlug) {
  const truthPath = path.resolve(`data/${clientSlug}/truth.json`);
  if (!fs.existsSync(truthPath)) {
    throw new Error(`CRITICAL: truth.json missing for ${clientSlug}`);
  }

  const truthData = JSON.parse(fs.readFileSync(truthPath, "utf8"));

  required(truthData?.entity?.name, "entity.name");
  required(truthData?.entity?.phone, "entity.phone");
  required(truthData?.entity?.naics, "entity.naics");
  required(truthData?.location?.street, "location.street");
  required(truthData?.location?.city, "location.city");
  required(truthData?.location?.zip, "location.zip");

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: truthData.entity.name,
    foundingDate: truthData.entity.founded ?? undefined,
    telephone: truthData.entity.phone,
    address: {
      "@type": "PostalAddress",
      streetAddress: truthData.location.street,
      addressLocality: truthData.location.city,
      addressRegion: truthData.location.region ?? "VA",
      postalCode: truthData.location.zip,
      addressCountry: truthData.location.country ?? "US",
    },
  };

  const templatePath = path.resolve("templates/premium-base.html");
  if (!fs.existsSync(templatePath)) {
    throw new Error("CRITICAL: templates/premium-base.html missing");
  }

  const branding = truthData.branding ?? {};
  const serviceArea = truthData.location.serviceArea ?? [];
  const portfolio = truthData.portfolio ?? [];

  const serviceAreaItems = serviceArea
    .map((s) => `<li>${escapeHtml(s)}</li>`)
    .join("");

  const portfolioSections = portfolio
    .map(
      (p) => `
<article class="portfolio-item">
  <h3>${escapeHtml(p.title ?? "")}</h3>
  <p>${escapeHtml(p.specs ?? "")}</p>
  <p>${escapeHtml(p.description ?? "")}</p>
</article>`
    )
    .join("");

  const metaDescription =
    truthData.meta?.description ??
    `${truthData.entity.name} serves ${serviceArea.join(", ")} with professional services.`;

  const template = fs.readFileSync(templatePath, "utf8");
  const finalizedSite = template
    .replaceAll("{{ENTITY_NAME}}", escapeHtml(truthData.entity.name))
    .replaceAll("{{H1}}", escapeHtml(truthData.meta?.h1 ?? truthData.entity.name))
    .replaceAll("{{META_DESCRIPTION}}", escapeHtml(metaDescription))
    .replaceAll("{{ENTITY_DOMAIN}}", escapeHtml(truthData.entity.domain ?? "example.com"))
    .replaceAll("{{PHONE_DISPLAY}}", escapeHtml(truthData.entity.phone))
    .replaceAll(
      "{{ADDRESS_SINGLE_LINE}}",
      escapeHtml(
        `${truthData.location.street}, ${truthData.location.city}, ${truthData.location.region ?? "VA"} ${truthData.location.zip}`
      )
    )
    .replaceAll("{{PRIMARY_CTA_TEXT}}", escapeHtml(truthData.cta?.text ?? "Request a Free Estimate"))
    .replaceAll("{{PRIMARY_CTA_HREF}}", escapeHtml(truthData.cta?.href ?? "/contact"))
    .replaceAll("{{BRAND_PRIMARY}}", escapeHtml(branding.primaryColor ?? "#004a99"))
    .replaceAll("{{BRAND_ACCENT}}", escapeHtml(branding.accentColor ?? "#ffcc00"))
    .replaceAll("{{FONT_STACK}}", branding.fontStack ?? "'Helvetica Neue', Arial, sans-serif")
    .replaceAll("{{SERVICE_AREA_LIST}}", serviceAreaItems)
    .replaceAll("{{PORTFOLIO_SECTIONS}}", portfolioSections)
    .replaceAll("{{SCHEMA_JSON_LD}}", JSON.stringify(jsonLd))
    // Ensure CSS font stack renders with raw single quotes in output HTML.
    .replaceAll("&#39;", "'");

  const outDir = path.resolve(`dist/${clientSlug}`);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "index.html"), finalizedSite, "utf8");
  console.log(`Verified authority site deployed for ${truthData.entity.name}.`);
}

const clientArg = process.argv.find((a) => a.startsWith("--client="));
const client = clientArg ? clientArg.split("=")[1] : null;

if (!client) {
  console.error("Missing --client=<slug>");
  process.exit(1);
}

try {
  buildAuthoritySite(client);
} catch (err) {
  console.error(err.message);
  process.exit(2);
}
