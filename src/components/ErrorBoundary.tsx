import { Component, type ErrorInfo, type ReactNode } from 'react';
import { LegalLayout } from './LegalLayout';

type Props = { children: ReactNode };
type State = { failed: boolean };

/**
 * Last line of defence: if a component throws while rendering, the visitor gets
 * a page in the site's own voice and a way back, not a blank screen.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('render failed', error.message, info.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;

    return (
      <LegalLayout>
        <div className="gutter max-w-[880px] py-24 md:py-32">
          <p className="label text-brass-ink">Something went wrong</p>
          <h1 className="display mt-5 max-w-[22ch] text-[clamp(2.4rem,5.5vw,4rem)]">
            The page did not load properly.
          </h1>
          <p className="mt-7 max-w-[54ch] text-[1.0625rem] leading-[1.8] text-charcoal/75">
            An unexpected error stopped this page from rendering. Reloading usually clears it. If it keeps happening,
            write to us and we will sort it out.
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <a
              href="/"
              className="label inline-flex items-center justify-between gap-6 bg-forest px-6 py-4 text-ivory transition-colors duration-300 hover:bg-brass hover:text-forest sm:justify-start"
            >
              Return Home
            </a>
            <a
              href="mailto:hello@bramwell.com"
              className="label inline-flex items-center justify-between gap-6 border border-charcoal/25 px-6 py-4 text-charcoal transition-colors duration-300 hover:border-forest hover:bg-forest hover:text-ivory sm:justify-start"
            >
              hello@bramwell.com
            </a>
          </div>
        </div>
      </LegalLayout>
    );
  }
}
