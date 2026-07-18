import React, { createContext, useContext, useEffect, useState } from 'react';

const TenantContext = createContext(null);

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};

const LoadingSpinner = () => (
  <div className="fixed inset-0 flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
  </div>
);

export const TenantProvider = ({ children }) => {
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTenant = async () => {
      try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://jworden-api.fly.dev';
        const hostname = window.location.hostname;
        const response = await fetch(`${baseUrl}/api/v1/factory/resolve?hostname=${hostname}`);
        
        if (!response.ok) {
          throw new Error('Failed to resolve tenant config');
        }

        const data = await response.json();
        setTenant(data);

        if (data?.primary_color) {
          document.documentElement.style.setProperty('--primary', data.primary_color);
        }
      } catch (err) {
        console.error('Error fetching tenant config:', err);
        setError(err.message);
        // Fallback for default tenant if fetch fails or backend is unreachable, useful during dev.
        setTenant({
          name: 'The Worden Standard',
          domain: 'thewordenstandard.com',
          subscription_tier: 'pro',
          routeMode: 'FULL_SITE'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTenant();
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  // Optionally handle error state
  // if (error) return <div>Error loading site configuration.</div>;

  return (
    <TenantContext.Provider value={tenant}>
      {children}
    </TenantContext.Provider>
  );
};
