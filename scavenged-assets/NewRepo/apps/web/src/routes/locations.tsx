import React from 'react';
import { Link } from '@tanstack/react-router';
import { MapPin, ArrowRight } from 'lucide-react';
import { getLocationsForTenant, getUniqueRegions } from '@jworden/core';
import { CURRENT_TENANT } from '../config/tenant';

export function LocationsPage() {
  const { business } = CURRENT_TENANT;
  const allLocations = getLocationsForTenant(CURRENT_TENANT);
  const totalCount = allLocations.length;

  // Group by state, then by region within state
  const byState = CURRENT_TENANT.serviceAreas.map((area) => {
    const stateLocations = allLocations.filter((l) => l.stateAbbr === area.stateAbbr);
    const regionNames = getUniqueRegions({ ...CURRENT_TENANT, serviceAreas: [area] });
    return { area, stateLocations, regionNames };
  });

  return (
    <div className="bg-zinc-950 min-h-screen py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <div className="flex items-center gap-2 text-yellow-400 text-xs font-semibold mb-3">
            <MapPin size={12} /> Service Area
          </div>
          <h1 className="text-3xl font-black text-white mb-3">{business.tradeLabel} Service Area</h1>
          <p className="text-zinc-400 max-w-2xl text-sm leading-relaxed">
            {business.shortName} serves {totalCount} communities across our service area.
            Free on-site estimates throughout our entire coverage zone.
          </p>
        </div>

        {byState.map(({ area, stateLocations, regionNames }) => (
          <div key={area.stateAbbr} className="mb-12">
            {byState.length > 1 && (
              <div className="text-yellow-400 text-xs font-semibold uppercase tracking-widest mb-6">
                {area.state} — {stateLocations.length} communities
              </div>
            )}

            {regionNames.length > 0 ? (
              regionNames.map((region) => {
                const locs = stateLocations.filter((l) => l.region === region);
                if (locs.length === 0) return null;
                return (
                  <div key={region} className="mb-10">
                    <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4 border-b border-zinc-800 pb-3">
                      {region} — {locs.length} communities
                    </h2>
                    <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {locs.map((loc) => (
                        <Link
                          key={loc.slug}
                          to="/locations/$slug"
                          params={{ slug: loc.slug }}
                          className="group flex items-center justify-between bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 hover:border-yellow-500/30 rounded-xl px-4 py-3.5 transition-all"
                        >
                          <div>
                            <div className="text-sm font-medium text-white group-hover:text-yellow-400 transition-colors">
                              {loc.city}
                            </div>
                            <div className="text-xs text-zinc-600 mt-0.5">{loc.county}</div>
                          </div>
                          <ArrowRight size={13} className="text-zinc-600 group-hover:text-yellow-400 transition-colors shrink-0" />
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {stateLocations.map((loc) => (
                  <Link
                    key={loc.slug}
                    to="/locations/$slug"
                    params={{ slug: loc.slug }}
                    className="group flex items-center justify-between bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 hover:border-yellow-500/30 rounded-xl px-4 py-3.5 transition-all"
                  >
                    <div>
                      <div className="text-sm font-medium text-white group-hover:text-yellow-400 transition-colors">
                        {loc.city}
                      </div>
                      <div className="text-xs text-zinc-600 mt-0.5">{loc.county}</div>
                    </div>
                    <ArrowRight size={13} className="text-zinc-600 group-hover:text-yellow-400 transition-colors shrink-0" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}

        <div className="mt-10 text-center">
          <p className="text-zinc-500 text-sm mb-4">
            Don't see your area? We travel throughout our region for the right project.
          </p>
          <a
            href={`tel:${business.phoneE164}`}
            className="inline-flex items-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-6 py-3 rounded-lg transition-colors text-sm"
          >
            Call {business.phone} — Free Estimate
          </a>
        </div>
      </div>
    </div>
  );
}
