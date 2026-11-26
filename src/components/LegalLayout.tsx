import type { ReactNode } from 'react';
import { Footer } from './Footer';

/**
 * The quiet shell the legal and error pages sit in. The site's own navigation
 * assumes the dark hero behind it, so these pages get a plain ivory header with
 * one way back instead.
 */
export function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-ivory">
      <header className="border-b border-charcoal/15">
        <div className="gutter flex h-[72px] items-center justify-between">
          <a href="/" aria-label="Bramwell — home" className="flex items-baseline gap-3 text-charcoal">
            <span aria-hidden="true" className="mb-[3px] size-[6px] shrink-0 rotate-45 bg-brass" />
            <span className="font-display text-[1.55rem] leading-none">Bramwell</span>
          </a>
          <a
            href="/"
            className="label inline-flex items-center border border-charcoal/25 px-5 py-2.5 transition-colors duration-300 hover:border-forest hover:bg-forest hover:text-ivory"
          >
            Back to Home
          </a>
        </div>
      </header>

      <main id="main">{children}</main>

      <Footer />
    </div>
  );
}

export function LegalSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-heading`}>
      <h2 id={`${id}-heading`} className="display text-[1.6rem] leading-[1.15] md:text-[1.85rem]">
        {title}
      </h2>
      <div className="mt-4 space-y-4 text-[0.975rem] leading-[1.8] text-charcoal/80">{children}</div>
    </section>
  );
}

export function LegalList({ items }: { items: ReactNode[] }) {
  return (
    <ul className="space-y-2.5 pl-1">
      {items.map((item, index) => (
        <li key={index} className="relative pl-6">
          <span aria-hidden="true" className="absolute top-[0.7em] left-0 size-[5px] rotate-45 bg-brass" />
          {item}
        </li>
      ))}
    </ul>
  );
}
