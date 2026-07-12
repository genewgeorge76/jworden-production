export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-brand-dark border-t border-white/10">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-yellow font-bold text-brand-dark text-lg">
                CB
              </div>
              <div className="leading-tight">
                <span className="block text-lg font-bold text-white tracking-tight">
                  Carolina Blacktop
                </span>
                <span className="block text-xs text-brand-yellow font-medium tracking-wide uppercase">
                  Paving &amp; Sealcoating
                </span>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-zinc-400">
              4th-generation asphalt paving serving North &amp; South Carolina
              since 1984.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white">Services</h3>
            <ul className="mt-4 space-y-2 text-sm text-zinc-400">
              <li>Asphalt Paving</li>
              <li>Sealcoating</li>
              <li>Parking Lot Maintenance</li>
              <li>Grading &amp; Excavation</li>
              <li>Concrete Work</li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white">Company</h3>
            <ul className="mt-4 space-y-2 text-sm text-zinc-400">
              <li>
                <a href="#about" className="hover:text-brand-yellow">
                  About Us
                </a>
              </li>
              <li>
                <a href="#why-us" className="hover:text-brand-yellow">
                  Why Choose Us
                </a>
              </li>
              <li>
                <a href="#contact" className="hover:text-brand-yellow">
                  Contact
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white">Contact</h3>
            <ul className="mt-4 space-y-2 text-sm text-zinc-400">
              <li>
                <a
                  href="tel:+18005551234"
                  className="hover:text-brand-yellow"
                >
                  (800) 555-1234
                </a>
              </li>
              <li>
                <a
                  href="mailto:info@carolinablacktop.com"
                  className="hover:text-brand-yellow"
                >
                  info@carolinablacktop.com
                </a>
              </li>
              <li>North &amp; South Carolina</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-white/10 pt-8 text-center text-sm text-zinc-500">
          &copy; {year} Carolina Blacktop. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
