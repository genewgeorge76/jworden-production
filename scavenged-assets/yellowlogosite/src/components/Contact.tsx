"use client";

import { useState, type FormEvent } from "react";

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <section id="contact" className="bg-brand-dark py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-16 lg:grid-cols-2">
          <div className="text-white">
            <p className="text-sm font-semibold uppercase tracking-widest text-brand-yellow">
              Get In Touch
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Request a Free Estimate
            </h2>
            <p className="mt-4 text-lg leading-8 text-zinc-400">
              Tell us about your project and we&apos;ll get back to you within
              one business day with a detailed, no-obligation quote.
            </p>

            <div className="mt-10 space-y-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-yellow/10">
                  <svg className="h-6 w-6 text-brand-yellow" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm text-zinc-400">Call Us</div>
                  <a
                    href="tel:+18005551234"
                    className="text-lg font-semibold text-white hover:text-brand-yellow"
                  >
                    (800) 555-1234
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-yellow/10">
                  <svg className="h-6 w-6 text-brand-yellow" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm text-zinc-400">Email</div>
                  <a
                    href="mailto:info@carolinablacktop.com"
                    className="text-lg font-semibold text-white hover:text-brand-yellow"
                  >
                    info@carolinablacktop.com
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-yellow/10">
                  <svg className="h-6 w-6 text-brand-yellow" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm text-zinc-400">Service Area</div>
                  <div className="text-lg font-semibold text-white">
                    North &amp; South Carolina
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-8 shadow-2xl">
            {submitted ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                  <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-brand-dark">
                  Thank You!
                </h3>
                <p className="mt-2 text-zinc-600">
                  We&apos;ve received your request. A team member will contact
                  you within one business day.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-brand-dark"
                    >
                      Name
                    </label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required
                      className="mt-1 block w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-sm text-brand-dark placeholder-zinc-400 focus:border-brand-yellow focus:ring-2 focus:ring-brand-yellow/20 focus:outline-none"
                      placeholder="John Smith"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="phone"
                      className="block text-sm font-medium text-brand-dark"
                    >
                      Phone
                    </label>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      required
                      className="mt-1 block w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-sm text-brand-dark placeholder-zinc-400 focus:border-brand-yellow focus:ring-2 focus:ring-brand-yellow/20 focus:outline-none"
                      placeholder="(555) 123-4567"
                    />
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-brand-dark"
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    className="mt-1 block w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-sm text-brand-dark placeholder-zinc-400 focus:border-brand-yellow focus:ring-2 focus:ring-brand-yellow/20 focus:outline-none"
                    placeholder="john@example.com"
                  />
                </div>
                <div>
                  <label
                    htmlFor="service"
                    className="block text-sm font-medium text-brand-dark"
                  >
                    Service Needed
                  </label>
                  <select
                    id="service"
                    name="service"
                    className="mt-1 block w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-sm text-brand-dark focus:border-brand-yellow focus:ring-2 focus:ring-brand-yellow/20 focus:outline-none"
                  >
                    <option>Asphalt Paving</option>
                    <option>Sealcoating</option>
                    <option>Parking Lot Maintenance</option>
                    <option>Grading &amp; Excavation</option>
                    <option>Concrete Work</option>
                    <option>Commercial / Municipal</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="message"
                    className="block text-sm font-medium text-brand-dark"
                  >
                    Project Details
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={4}
                    className="mt-1 block w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-sm text-brand-dark placeholder-zinc-400 focus:border-brand-yellow focus:ring-2 focus:ring-brand-yellow/20 focus:outline-none"
                    placeholder="Tell us about your project..."
                  />
                </div>
                <button
                  type="submit"
                  className="w-full rounded-lg bg-brand-yellow px-6 py-3 text-base font-bold text-brand-dark transition-colors hover:bg-brand-yellow-dark"
                >
                  Submit Request
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
