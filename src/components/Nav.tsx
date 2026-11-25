import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { EASE } from '../lib/motion';

const LINKS = [
  { href: '#services', label: 'Services' },
  { href: '#approach', label: 'Our Approach' },
  { href: '#about', label: 'About' },
  { href: '#contact', label: 'Contact' },
];

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 32);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    menuRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const dark = !scrolled || open;

  return (
    <header
      className={[
        'fixed inset-x-0 top-0 z-50 border-b transition-colors duration-500',
        dark ? 'border-transparent bg-transparent text-ivory' : 'border-charcoal/10 bg-ivory text-charcoal',
      ].join(' ')}
    >
      <div className="gutter relative z-10 flex h-[72px] items-center justify-between">
        <a href="#top" className="flex items-baseline gap-3" aria-label="Bramwell — back to top">
          <span aria-hidden="true" className="mb-[3px] size-[6px] shrink-0 rotate-45 bg-brass" />
          <span className="font-display text-[1.55rem] leading-none tracking-[0.005em]">Bramwell</span>
          <span
            className={[
              'label hidden border-l pl-3 opacity-60 xl:inline-block',
              dark ? 'border-ivory/25' : 'border-charcoal/20',
            ].join(' ')}
          >
            Digital Services &amp; Automation
          </span>
        </a>

        <nav aria-label="Primary" className="hidden items-center gap-8 md:flex">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="label relative py-1 opacity-85 transition-opacity duration-300 after:absolute after:inset-x-0 after:bottom-0 after:h-px after:w-0 after:bg-current after:transition-[width] after:duration-500 after:ease-out hover:opacity-100 hover:after:w-full"
            >
              {link.label}
            </a>
          ))}
          <a
            href="#contact"
            className={[
              'label group inline-flex items-center gap-2 border px-5 py-2.5 transition-colors duration-300',
              dark
                ? 'border-ivory/30 hover:border-brass hover:bg-brass hover:text-forest'
                : 'border-charcoal/25 hover:border-forest hover:bg-forest hover:text-ivory',
            ].join(' ')}
          >
            Let&rsquo;s Talk
            <ArrowUpRight
              aria-hidden="true"
              className="size-3.5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              strokeWidth={1.5}
            />
          </a>
        </nav>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls="mobile-menu"
          className="label -mr-2 flex min-h-[44px] items-center gap-3 pr-2 md:hidden"
        >
          <span>{open ? 'Close' : 'Menu'}</span>
          <span aria-hidden="true" className="flex h-3 w-5 flex-col justify-between">
            <span
              className={[
                'h-px w-full bg-current transition-transform duration-300',
                open ? 'translate-y-[5.5px] rotate-45' : '',
              ].join(' ')}
            />
            <span className={['h-px w-full bg-current transition-opacity duration-300', open ? 'opacity-0' : ''].join(' ')} />
            <span
              className={[
                'h-px w-full bg-current transition-transform duration-300',
                open ? '-translate-y-[5.5px] -rotate-45' : '',
              ].join(' ')}
            />
          </span>
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            key="mobile-menu"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            ref={menuRef}
            tabIndex={-1}
            className="on-dark fixed inset-0 top-0 z-0 flex flex-col justify-between bg-forest px-6 pt-[104px] pb-10 text-ivory outline-none md:hidden"
          >
            <nav aria-label="Mobile" className="flex flex-col">
              {LINKS.map((link, index) => (
                <motion.a
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  initial={reduceMotion ? false : { opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.06 * index + 0.05, ease: EASE }}
                  className="flex items-baseline justify-between border-b border-ivory/15 py-5"
                >
                  <span className="display text-[2rem]">{link.label}</span>
                  <span className="label text-brass">{String(index + 1).padStart(2, '0')}</span>
                </motion.a>
              ))}
            </nav>

            <div className="space-y-5">
              <a
                href="#contact"
                onClick={() => setOpen(false)}
                className="label flex w-full items-center justify-between border border-brass/60 px-5 py-4 text-brass"
              >
                Let&rsquo;s Talk
                <ArrowUpRight aria-hidden="true" className="size-4" strokeWidth={1.5} />
              </a>
              <p className="label text-ivory/65">A Modern Business House</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
