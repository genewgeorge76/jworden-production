import { useLocation, Link } from 'react-router-dom';
import { api } from '@/api/client';
import { useQuery } from '@tanstack/react-query';
import SmartImage from '@/components/SmartImage';
import { PRIMARY_LOGO_URL, FALLBACK_LOGO_URL } from '@/lib/branding';


export default function PageNotFound({}) {
    const location = useLocation();
    const pageName = location.pathname.substring(1);

    const authData = { user: null, isAuthenticated: false };
    const isFetched = true;
    
    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-[#0a0a0c]">
            <div className="max-w-md w-full">
                <div className="text-center space-y-10">
                    {/* Logo Section */}
                    <Link to="/" className="inline-block transition-transform hover:scale-[1.02]">
                        <SmartImage
                            src={PRIMARY_LOGO_URL}
                            fallbackSrc={FALLBACK_LOGO_URL}
                            alt="J. Worden & Sons Paving LLC"
                            width={400}
                            height={120}
                            className="h-20 w-auto object-contain mx-auto"
                        />
                    </Link>

                    {/* 404 Error Code */}
                    <div className="space-y-2">
                        <h1 className="text-8xl font-black text-white/10 tracking-tighter">404</h1>
                        <div className="h-1 w-12 bg-primary/40 mx-auto rounded-full"></div>
                    </div>
                    
                    {/* Main Message */}
                    <div className="space-y-4">
                        <h2 className="text-3xl font-bold text-white tracking-tight">
                            Road Closed
                        </h2>
                        <p className="text-white/60 leading-relaxed text-lg">
                            The route <span className="font-mono text-primary/80">/{pageName}</span> is under construction or doesn't exist.
                        </p>
                    </div>
                    
                    {/* Action Button */}
                    <div className="pt-4">
                        <Link 
                            to="/" 
                            className="inline-flex items-center px-8 py-4 text-sm font-bold tracking-widest uppercase text-black bg-primary rounded-none hover:bg-primary/90 transition-all duration-300 shadow-[0_0_20px_rgba(255,184,0,0.2)]"
                        >
                            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                            Back to Site
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}

