import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

import {
  authenticateWithPassword,
  authenticateWithPin,
  bootstrapAuth,
  clearAuthToken,
  fetchIdentity,
  getAccessToken,
  registerTenant,
} from '@/api/client'

const AuthContext = createContext();

// Subscription tiers, weakest first. Ordered so a gate can ask "at least pro"
// instead of enumerating every tier above it. These are the three values the
// tenants.subscription_tier column accepts.
const TIER_RANK = { lite: 0, pro: 1, max: 2 };

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [identity, setIdentity] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);
  const [authRequired, setAuthRequired] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  // The identity the server reports, turned into the shape the rest of the app
  // consumes. `user.role` used to be the literal string 'admin', set here
  // regardless of who signed in — so the operator and a paying subscriber were
  // indistinguishable to every guard in the SPA. It now comes from
  // GET /api/v1/auth/me.
  const applyIdentity = useCallback((me, { authMode, tokenEndpoint } = {}) => {
    setIdentity(me);
    setUser(me ? {
      id: me.email,
      email: me.email,
      // Carried through so a page that greets someone by name has one. Without
      // it CustomerPortal falls back to the literal word "Client", which it
      // showed to the operator.
      full_name: me.full_name || null,
      role: me.role,
      tenantId: me.tenant_id,
      isOwner: Boolean(me.is_owner),
      tier: me.subscription_tier || null,
      companyName: me.company_name || null,
      authMode: authMode || me.auth_mode || 'token',
      tokenEndpoint: tokenEndpoint || null,
    } : null);
  }, []);

  const checkUserAuth = useCallback(async ({ force = false } = {}) => {
    if (isLoadingAuth) return;
    if (authChecked && !force) return;

    setIsLoadingAuth(true);
    try {
      const status = await bootstrapAuth();
      const required = Boolean(status?.auth_required);
      const token = required ? await getAccessToken().catch(() => null) : null;

      setAuthRequired(required);
      setAccessToken(token);

      // A token is not the same thing as an identity: it can be signed,
      // unexpired, and still rejected (revoked tenant, missing scope claim).
      // Treat "the server told me who I am" as the bar for authenticated,
      // rather than "I am holding a string".
      const me = (!required || token) ? await fetchIdentity() : null;
      setIsAuthenticated(Boolean(me));
      applyIdentity(me, {
        authMode: status?.auth_mode || 'required',
        tokenEndpoint: status?.token_endpoint || null,
      });

      setAuthError(status?.token_bootstrap_error ? { type: 'pin_required', message: status.token_bootstrap_error } : null);
    } catch (error) {
      setAuthRequired(true);
      setIsAuthenticated(false);
      applyIdentity(null);
      setAuthError({ type: 'auth_status_unavailable', message: error.message || 'Unable to load auth status.' });
    } finally {
      setAuthChecked(true);
      setIsLoadingAuth(false);
    }
  }, [authChecked, isLoadingAuth, applyIdentity]);

  useEffect(() => {
    const handleAuthExpired = () => {
      setAccessToken(null);
      applyIdentity(null);
      setAuthRequired(true);
      setIsAuthenticated(false);
      setAuthChecked(true);
      setAuthError({ type: 'pin_required', message: 'Your session expired. Sign in again to continue.' });
    };

    window.addEventListener('jworden:auth-expired', handleAuthExpired);
    return () => window.removeEventListener('jworden:auth-expired', handleAuthExpired);
  }, [applyIdentity]);

  const logout = () => {
    localStorage.removeItem("jworden_admin_session");
    clearAuthToken();
    applyIdentity(null);
    setAuthRequired(true);
    setIsAuthenticated(false);
    setAccessToken(null);
    setAuthChecked(true);
  };

  // Shared tail of every sign-in path: the server issued a token, so ask it who
  // that token belongs to rather than assuming.
  const adoptSession = async (token, authMode) => {
    setAuthRequired(true);
    setAuthChecked(true);
    setAccessToken(token);
    const me = await fetchIdentity();
    if (!me) {
      // The credential was accepted but the identity call was refused. Signing
      // in "successfully" into a session where every panel 403s is worse than
      // a failed login, because it looks like the app is broken.
      clearAuthToken();
      setIsAuthenticated(false);
      applyIdentity(null);
      throw new Error('Signed in, but the server would not confirm the account. Try again.');
    }
    setIsAuthenticated(true);
    applyIdentity(me, { authMode });
    setAuthError(null);
    return me;
  };

  // Operator sign-in. The PIN is the deployment's master gate — it is not a
  // customer credential and never carries a tenant of its own.
  const loginWithPin = async (pin) => {
    const token = await authenticateWithPin(pin);
    return adoptSession(token, 'pin');
  };

  // Customer sign-in. POST /api/v1/auth/login existed on the backend with
  // nothing calling it: /register created a tenant and a user, and then there
  // was no way to sign in as that user again.
  const loginWithPassword = async (email, password) => {
    const token = await authenticateWithPassword(email, password);
    // Returns the identity, not the token: the caller's next decision is where
    // to send this person, and that depends on who they are.
    return adoptSession(token, 'password');
  };

  // Sign-up, which must leave the new customer signed in — the next step is
  // Stripe checkout, and that endpoint is behind auth.
  const signUp = async (payload) => {
    const response = await registerTenant(payload);
    if (response?.access_token) {
      await adoptSession(response.access_token, 'password');
    }
    return response;
  };

  const navigateToLogin = () => {
    window.location.assign('/signin');
  };

  const isOwner = Boolean(identity?.is_owner);
  const tier = identity?.subscription_tier || null;

  // Owner is above the tier ladder, not on it: he operates the platform rather
  // than subscribing to it, and has no tenants row to read a tier from.
  const hasTier = useCallback((minimum) => {
    if (isOwner) return true;
    if (!tier) return false;
    const have = TIER_RANK[String(tier).toLowerCase()];
    const need = TIER_RANK[String(minimum).toLowerCase()];
    if (have === undefined || need === undefined) return false;
    return have >= need;
  }, [isOwner, tier]);

  return (
    <AuthContext.Provider
      value={{
        user,
        identity,
        isOwner,
        tier,
        hasTier,
        role: identity?.role || null,
        tenantId: identity?.tenant_id || null,
        subscriptionStatus: identity?.subscription_status || null,
        accessToken,
        authRequired,
        isAuthenticated,
        isLoadingAuth,
        authChecked,
        checkUserAuth,
        isLoadingPublicSettings: false,
        authError,
        appPublicSettings: { public_settings: {} },
        logout,
        loginWithPin,
        loginWithPassword,
        signUp,
        navigateToLogin,
        checkAppState: async () => null,
        getAccessToken,
        setUser,
        setIsAuthenticated
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
