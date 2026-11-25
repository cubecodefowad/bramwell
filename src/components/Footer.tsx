import { ArrowUp } from 'lucide-react';
import { services } from '../data/services';

const NAV_LINKS = [
  { href: '#top', label: 'Home' },
  { href: '#services', label: 'Services' },
  { href: '#approach', label: 'Our Approach' },
  { href: '#about', label: 'About' },
  { href: '#contact', label: 'Contact' },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-charcoal text-ivory/70">
      <div className="gutter py-16 md:py-20">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-[1.5fr_0.8fr_1fr_1fr]">
          <div>
            <div className="flex items-baseline gap-3 text-ivory">
              <span aria-hidden="true" className="mb-[3px] size-[6px] rotate-45 bg-brass" />
              <span className="font-display text-[1.6rem] leading-none">Bramwell</span>
            </div>
            <p className="mt-5 max-w-[32ch] text-[0.925rem] leading-[1.75]">
              A modern business house bringing intelligent automation, digital design, and creative thinking together.
            </p>
            <p className="label mt-6 text-brass">Thoughtfully made for better business.</p>
          </div>

          <nav aria-label="Footer">
            <h2 className="label text-ivory/60">Navigate</h2>
            <ul className="mt-5 space-y-3 text-[0.925rem]">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className="transition-colors duration-300 hover:text-brass">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="label text-ivory/60">Services</h2>
            <ul className="mt-5 space-y-3 text-[0.925rem]">
              {services.map((service) => (
                <li key={service.number}>
                  <a href="#services" className="transition-colors duration-300 hover:text-brass">
                    {service.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="label text-ivory/60">Contact</h2>
            <ul className="mt-5 space-y-3 text-[0.925rem]">
              <li>
                <a
                  href="mailto:hello@bramwell.com"
                  className="underline decoration-brass/40 underline-offset-4 transition-colors duration-300 hover:text-brass"
                >
                  hello@bramwell.com
                </a>
              </li>
              <li>
                <a href="#contact" className="transition-colors duration-300 hover:text-brass">
                  Send an enquiry
                </a>
              </li>
            </ul>
            <a
              href="#top"
              className="label mt-8 inline-flex items-center gap-2 text-ivory/60 transition-colors duration-300 hover:text-brass"
            >
              Back to top
              <ArrowUp aria-hidden="true" className="size-3.5" strokeWidth={1.5} />
            </a>
          </div>
        </div>

        <div className="mt-14 flex flex-col justify-between gap-4 border-t border-ivory/12 pt-6 sm:flex-row sm:items-center">
          <p className="label text-ivory/55">&copy; {year} Bramwell. All rights reserved.</p>
          <p className="label text-ivory/55">Digital Services &amp; Automation</p>
        </div>
      </div>
    </footer>
  );
}
