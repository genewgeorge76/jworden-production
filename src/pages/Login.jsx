import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/AuthContext';

/**
 * Tenant sign-in for the Standard OS.
 *
 * POST /api/v1/auth/login has existed on the backend all along with nothing
 * calling it. /register created a tenant and a user and then handed off to
 * Stripe — after which there was nowhere to sign in as that user. An app with
 * registration and no login is not a login problem, it is a missing door.
 *
 * Distinct from AdminPinGate, which is the single-admin PIN gate for the
 * command centre. This is the per-tenant email + password path.
 */
export default function Login({ redirectOnSuccess = true }) {
  const navigate = useNavigate();
  const { loginWithPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError(null);
    setLoading(true);
    try {
      // Through the context, not straight to the client: signing in has to
      // update the identity the rest of the app reads, or every guard still
      // believes you are signed out until the next full page load.
      const me = await loginWithPassword(email.trim(), password);

      // When this form is standing in for a page you asked for — RequireAuth
      // renders it in place — there is nowhere to navigate to. The identity
      // change re-renders the guard and the page you wanted appears.
      if (!redirectOnSuccess) return;

      // The operator's console and a customer's dashboard are different places.
      navigate(me?.is_owner ? '/command-center' : '/dashboard', { replace: true });
    } catch (err) {
      // The backend answers a bad email and a bad password with the same 401
      // and the same wording, which is deliberate: distinguishing them tells an
      // attacker which addresses are registered. Surface it as sent, and only
      // translate the cases where the real cause is not the credentials.
      const raw = err?.message || '';
      setError(
        /Failed to fetch|NetworkError|aborted/i.test(raw)
          ? 'Could not reach the server. Check your connection and try again.'
          : /401|Incorrect email or password/i.test(raw)
            ? 'Incorrect email or password.'
            : raw || 'Sign in failed. Please try again.',
      );
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050810] text-slate-200 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-[#0a0f1c] border border-white/5 rounded-2xl p-8 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600" />

        <div className="flex items-center gap-2 mb-8 justify-center">
          <Shield className="w-6 h-6 text-amber-500" />
          <span className="font-display font-bold text-lg tracking-wide text-white">
            THE J. WORDEN STANDARD OS
          </span>
        </div>

        <h1 className="text-2xl font-bold text-white mb-1">Sign in</h1>
        <p className="text-sm text-slate-400 mb-6">
          Use the email and password you set when you created your account.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label htmlFor="email" className="block text-sm text-slate-300 mb-1.5">
              Email
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm text-slate-300 mb-1.5">
              Password
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          {/* role="alert" so a screen reader announces the failure; the old
              Register flow used alert(), which is unstyled and blocks the tab. */}
          {error && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-300"
            >
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Button
            type="submit"
            disabled={loading || !email.trim() || !password}
            className="w-full bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Signing in…
              </>
            ) : (
              'Sign in'
            )}
          </Button>
        </form>

        <p className="text-sm text-slate-400 mt-6 text-center">
          No account yet?{' '}
          <Link to="/register" className="text-amber-400 hover:text-amber-300 font-medium">
            Create one
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
