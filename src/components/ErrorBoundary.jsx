import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

/**
 * Top-level error boundary. Prevents a component-level throw from white-screening
 * the entire app. Logs to console and shows a branded, professional fallback.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log for visibility. A production app would forward this to Sentry/etc.
    console.error('[ErrorBoundary]', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const kicker = this.props.kicker || 'Something Went Wrong';
    const title = this.props.title || 'Unexpected Error';
    const message = this.props.message || 'Our site hit an unexpected snag. Our team has been notified. You can try refreshing or return to the home page.';
    const homeHref = this.props.homeHref || '/';
    const homeLabel = this.props.homeLabel || 'Go Home';
    const secondaryHref = this.props.secondaryHref || null;
    const secondaryLabel = this.props.secondaryLabel || null;
    const detailsLabel = this.props.detailsLabel || 'Technical details';
    const supportPhone = this.props.supportPhone || '(804) 446-1296';
    const supportTel = this.props.supportTel || '+18044461296';

    return (
      <div className="min-h-screen bg-background text-foreground font-body flex items-center justify-center p-6">
        <div className="max-w-xl w-full border border-border bg-card p-8 md:p-10 text-center">
          <div className="w-16 h-16 bg-destructive/10 border border-destructive/40 flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
          <p className="font-display text-primary text-xs tracking-[0.3em] uppercase mb-3">
            {kicker}
          </p>
          <h1 className="font-display font-black text-foreground text-3xl uppercase tracking-tight mb-3">
            {title}
          </h1>
          <p className="font-body text-muted-foreground text-sm leading-relaxed mb-6">
            {message}
          </p>
          {this.state.error?.message && (
            <details className="text-left mb-6 bg-muted/30 border border-border p-3">
              <summary className="font-display text-muted-foreground text-xs tracking-wider uppercase cursor-pointer">
                {detailsLabel}
              </summary>
              <code className="block mt-2 text-xs text-muted-foreground whitespace-pre-wrap break-words">
                {this.state.error.message}
              </code>
            </details>
          )}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="flex items-center justify-center gap-2 bg-primary text-primary-foreground font-display font-bold text-sm tracking-wider uppercase px-6 py-3 hover:bg-primary/90 transition-colors"
            >
              <RefreshCw className="w-4 h-4" /> Refresh Page
            </button>
            <a
              href={homeHref}
              className="flex items-center justify-center gap-2 border border-border text-foreground font-display font-bold text-sm tracking-wider uppercase px-6 py-3 hover:border-foreground/40 transition-colors"
            >
              <Home className="w-4 h-4" /> {homeLabel}
            </a>
            {secondaryHref && secondaryLabel && (
              <a
                href={secondaryHref}
                className="flex items-center justify-center gap-2 border border-border text-foreground font-display font-bold text-sm tracking-wider uppercase px-6 py-3 hover:border-foreground/40 transition-colors"
              >
                {secondaryLabel}
              </a>
            )}
          </div>
          <div className="mt-8 pt-6 border-t border-border">
            <p className="font-body text-muted-foreground text-xs">
              Need help immediately? Call{' '}
              <a href={`tel:${supportTel}`} className="text-primary font-bold">
                {supportPhone}
              </a>
            </p>
          </div>
        </div>
      </div>
    );
  }
}
