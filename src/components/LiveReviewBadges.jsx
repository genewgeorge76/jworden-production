/**
 * LiveReviewBadges — shows live-linked platform trust badges
 * Google, Houzz, Angi, and Pavement Magazine industry recognition
 */
import React from 'react';

class BadgeErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) return null; // Gracefully hide on error
    return this.props.children;
  }
}

function LiveReviewBadgesContent({ compact = false }) {
  const GOOGLE_REVIEW_URL = `https://search.google.com/local/writereview?placeid=${import.meta.env.VITE_GOOGLE_PLACE_ID || 'ChIJG3X8o_OStokRzRynNBuVfQ0'}`
  const HOUZZ_URL = 'https://www.houzz.com/professionals/paving-contractors/j-worden-sons-asphalt-paving-pfvwus-pf~48430947'
  const ANGI_URL = 'https://www.angi.com/companylist/us/va/chester/j-worden-and-sons-asphalt-paving-reviews-'
  const PAVEMENT_URL = 'https://www.pavementonline.com/top-contractor'

  if (compact) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <a
          href={GOOGLE_REVIEW_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 shadow-sm hover:bg-white/10 transition-colors backdrop-blur-md"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0" style={{ width: '20px', height: '20px' }} aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          <div className="text-left">
            <div className="text-xs font-bold text-white leading-none">★★★★★</div>
            <div className="text-[10px] text-gray-400 leading-none mt-0.5">Review us on Google</div>
          </div>
        </a>

        <a
          href={HOUZZ_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 shadow-sm hover:bg-white/10 transition-colors backdrop-blur-md"
        >
          <span className="text-[#4dbc15] font-black text-lg leading-none">h</span>
          <div className="text-left">
            <div className="text-xs font-bold text-white leading-none">Best of Houzz</div>
            <div className="text-[10px] text-gray-400 leading-none mt-0.5">Multiple Years</div>
          </div>
        </a>

        <a
          href={ANGI_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 shadow-sm hover:bg-white/10 transition-colors backdrop-blur-md"
        >
          <span className="text-[#FF6153] font-black text-sm leading-none">Angi</span>
          <div className="text-left">
            <div className="text-xs font-bold text-white leading-none">Super Service</div>
            <div className="text-[10px] text-gray-400 leading-none mt-0.5">Verified Contractor</div>
          </div>
        </a>

        <a
          href={PAVEMENT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 shadow-sm hover:bg-white/10 transition-colors backdrop-blur-md"
        >
          <span className="text-blue-400 font-black text-sm leading-none">PM</span>
          <div className="text-left">
            <div className="text-xs font-bold text-white leading-none">Pavement Magazine</div>
            <div className="text-[10px] text-gray-400 leading-none mt-0.5">Top 75 Recognition</div>
          </div>
        </a>
      </div>
    )
  }

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Google */}
      <a
        href={GOOGLE_REVIEW_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="flex flex-col items-center gap-3 bg-white/5 border border-white/10 rounded-2xl p-6 shadow-lg hover:bg-white/10 transition-all backdrop-blur-md group"
      >
        <svg viewBox="0 0 24 24" className="w-10 h-10 flex-shrink-0" style={{ width: '40px', height: '40px' }} aria-label="Google">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        <div className="text-center">
          <div className="flex justify-center gap-0.5 mb-1">
            {[1,2,3,4,5].map(s => <span key={s} className="text-[#FBBC05] text-xl">★</span>)}
          </div>
          <div className="font-black text-lg text-white">Review us on Google</div>
          <div className="text-sm text-gray-400 mt-1">Share your experience</div>
        </div>
        <span className="text-xs font-bold text-[#4285F4] group-hover:underline mt-1">
          Write a Review →
        </span>
      </a>

      {/* Houzz */}
      <a
        href={HOUZZ_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="flex flex-col items-center gap-3 bg-white/5 border border-white/10 rounded-2xl p-6 shadow-lg hover:bg-white/10 transition-all backdrop-blur-md group"
      >
        <div className="w-10 h-10 rounded-xl bg-[#4dbc15] flex items-center justify-center">
          <span className="text-white font-black text-2xl leading-none">h</span>
        </div>
        <div className="text-center">
          <div className="font-black text-lg text-white">Best of Houzz</div>
          <div className="text-sm text-gray-400 mt-1">Design & Service Award</div>
          <div className="text-xs text-gray-500 mt-2">Multiple consecutive years</div>
        </div>
        <span className="text-xs font-bold text-[#4dbc15] group-hover:underline mt-1">
          View Houzz Profile →
        </span>
      </a>

      {/* Angi */}
      <a
        href={ANGI_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="flex flex-col items-center gap-3 bg-white/5 border border-white/10 rounded-2xl p-6 shadow-lg hover:bg-white/10 transition-all backdrop-blur-md group"
      >
        <div className="w-10 h-10 rounded-xl bg-[#FF6153] flex items-center justify-center">
          <span className="text-white font-black text-sm leading-none">Angi</span>
        </div>
        <div className="text-center">
          <div className="font-black text-lg text-white">Super Service Award</div>
          <div className="text-sm text-gray-400 mt-1">Angi Verified Contractor</div>
          <div className="text-xs text-gray-500 mt-2">Top-rated in Virginia</div>
        </div>
        <span className="text-xs font-bold text-[#FF6153] group-hover:underline mt-1">
          View Angi Profile →
        </span>
      </a>

      {/* Pavement Magazine */}
      <a
        href={PAVEMENT_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="flex flex-col items-center gap-3 bg-white/5 border border-white/10 rounded-2xl p-6 shadow-lg hover:bg-white/10 transition-all backdrop-blur-md group"
      >
        <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
          <span className="text-blue-400 font-black text-sm leading-none">PM</span>
        </div>
        <div className="text-center">
          <div className="font-black text-lg text-white">Pavement Magazine</div>
          <div className="text-sm text-gray-400 mt-1">Top 75 Contractor Recognition</div>
          <div className="text-xs text-gray-500 mt-2">Four paving categories</div>
        </div>
        <span className="text-xs font-bold text-blue-400 group-hover:underline mt-1">
          Industry Recognition →
        </span>
      </a>
    </div>
  )
}

export default function LiveReviewBadges(props) {
  return (
    <BadgeErrorBoundary>
      <LiveReviewBadgesContent {...props} />
    </BadgeErrorBoundary>
  );
}

