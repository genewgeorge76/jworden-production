/**
 * LiveReviewBadges — shows live-linked platform trust badges
 * Google, Houzz, Angi, and Pavement Magazine industry recognition
 */
export default function LiveReviewBadges({ compact = false }) {
  const GOOGLE_SEARCH = 'J+Worden+%26+Sons+Asphalt+Paving+Chester+VA'
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
          className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm hover:shadow-md transition-shadow"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          <div className="text-left">
            <div className="text-xs font-bold text-gray-800 leading-none">4.9 ★★★★★</div>
            <div className="text-[10px] text-gray-500 leading-none mt-0.5">Google Reviews</div>
          </div>
        </a>

        <a
          href={HOUZZ_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm hover:shadow-md transition-shadow"
        >
          <span className="text-[#4dbc15] font-black text-lg leading-none">h</span>
          <div className="text-left">
            <div className="text-xs font-bold text-gray-800 leading-none">Best of Houzz</div>
            <div className="text-[10px] text-gray-500 leading-none mt-0.5">Multiple Years</div>
          </div>
        </a>

        <a
          href={ANGI_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm hover:shadow-md transition-shadow"
        >
          <span className="text-[#FF6153] font-black text-sm leading-none">Angi</span>
          <div className="text-left">
            <div className="text-xs font-bold text-gray-800 leading-none">Super Service</div>
            <div className="text-[10px] text-gray-500 leading-none mt-0.5">Verified Contractor</div>
          </div>
        </a>

        <a
          href={PAVEMENT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm hover:shadow-md transition-shadow"
        >
          <span className="text-[#0f3044] font-black text-sm leading-none">PM</span>
          <div className="text-left">
            <div className="text-xs font-bold text-gray-800 leading-none">Pavement Magazine</div>
            <div className="text-[10px] text-gray-500 leading-none mt-0.5">Top 75 Recognition</div>
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
        className="flex flex-col items-center gap-3 bg-white border border-gray-100 rounded-2xl p-6 shadow hover:shadow-lg transition-all group"
      >
        <svg viewBox="0 0 24 24" className="w-10 h-10" aria-label="Google">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        <div className="text-center">
          <div className="flex justify-center gap-0.5 mb-1">
            {[1,2,3,4,5].map(s => <span key={s} className="text-yellow-400 text-xl">★</span>)}
          </div>
          <div className="font-black text-3xl text-gray-900">4.9</div>
          <div className="text-sm text-gray-500 mt-1">Google Reviews</div>
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
        className="flex flex-col items-center gap-3 bg-white border border-gray-100 rounded-2xl p-6 shadow hover:shadow-lg transition-all group"
      >
        <div className="w-10 h-10 rounded-xl bg-[#4dbc15] flex items-center justify-center">
          <span className="text-white font-black text-2xl leading-none">h</span>
        </div>
        <div className="text-center">
          <div className="font-black text-lg text-gray-900">Best of Houzz</div>
          <div className="text-sm text-gray-500 mt-1">Design & Service Award</div>
          <div className="text-xs text-gray-400 mt-2">Multiple consecutive years</div>
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
        className="flex flex-col items-center gap-3 bg-white border border-gray-100 rounded-2xl p-6 shadow hover:shadow-lg transition-all group"
      >
        <div className="w-10 h-10 rounded-xl bg-[#FF6153] flex items-center justify-center">
          <span className="text-white font-black text-sm leading-none">Angi</span>
        </div>
        <div className="text-center">
          <div className="font-black text-lg text-gray-900">Super Service Award</div>
          <div className="text-sm text-gray-500 mt-1">Angi Verified Contractor</div>
          <div className="text-xs text-gray-400 mt-2">Top-rated in Virginia</div>
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
        className="flex flex-col items-center gap-3 bg-white border border-gray-100 rounded-2xl p-6 shadow hover:shadow-lg transition-all group"
      >
        <div className="w-10 h-10 rounded-xl bg-[#0f3044] flex items-center justify-center">
          <span className="text-white font-black text-sm leading-none">PM</span>
        </div>
        <div className="text-center">
          <div className="font-black text-lg text-gray-900">Pavement Magazine</div>
          <div className="text-sm text-gray-500 mt-1">Top 75 Contractor Recognition</div>
          <div className="text-xs text-gray-400 mt-2">Four paving categories</div>
        </div>
        <span className="text-xs font-bold text-[#0f3044] group-hover:underline mt-1">
          Industry Recognition →
        </span>
      </a>
    </div>
  )
}
