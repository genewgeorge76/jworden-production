"use client";

import { useState } from "react";

export default function Home() {
  const [showContact, setShowContact] = useState(false);

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <div className="flex flex-col items-center gap-2 sm:items-start">
          <span className="text-amber-500 text-5xl font-bold tracking-tight">
            JW&amp;S
          </span>
          <h1 className="max-w-md text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
            J. Worden &amp; Sons Asphalt Paving
          </h1>
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            4th-Generation Legacy &middot; Since 1984
          </p>
        </div>

        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Independent from other local entities. Trusted by national brands
            including KFC, Arby&#39;s, and Taco Bell for quality paving work.
          </p>

          <ul className="grid gap-3 text-left text-zinc-700 dark:text-zinc-300">
            <li>&#9679; Commercial Parking Lots</li>
            <li>&#9679; Tar &amp; Chip Estate Lanes</li>
            <li>&#9679; Subdivision Asphalt Resurfacing</li>
            <li>&#9679; Residential Driveways</li>
            <li>&#9679; Sealcoating &amp; Repairs</li>
            <li>&#9679; Line Striping</li>
          </ul>
        </div>

        <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
          <button
            onClick={() => setShowContact(!showContact)}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] md:w-[200px] cursor-pointer"
          >
            {showContact ? "Hide Contact" : "Get a Free Quote"}
          </button>
        </div>

        {showContact && (
          <div className="mt-6 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold text-black dark:text-zinc-50 mb-3">
              Contact Us
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400">
              Call us today for a free estimate on your next paving project.
            </p>
            <p className="mt-2 text-lg font-bold text-amber-600">
              (555) 555-1984
            </p>
          </div>
        )}
      </main>

      <footer className="w-full text-center py-6 text-sm text-zinc-400 dark:text-zinc-600">
        &copy; 2024 J. Worden &amp; Sons Asphalt Paving. All rights reserved.
      </footer>
    </div>
  );
}
