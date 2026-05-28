import React from 'react';

/**
 * Lightweight route-level loader shown while a lazy-loaded page chunk downloads.
 * On-brand, minimal, no layout shift.
 */
export default function RouteLoader() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-border border-t-primary rounded-full animate-spin" />
    </div>
  );
}
