import { motion, useReducedMotion } from 'framer-motion';
import { ArrowDown, ArrowRight } from 'lucide-react';
import { EASE } from '../lib/motion';
import { Emblem } from './Emblem';

export function Hero() {
  const reduceMotion = useReducedMotion();

  const line = (delay: number) =>
    reduceMotion
      ? {}
      : {
          initial: { y: '110%' },
          animate: { y: '0%' },
          transition: { duration: 1.1, delay, ease: EASE },
        };

  const fade = (delay: number) =>
    reduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 14 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.9, delay, ease: EASE },
        };

  return (
    <section id="top" aria-labelledby="hero-heading" className="on-dark relative overflow-hidden bg-forest text-ivory">
      <div className="gutter relative flex min-h-[100svh] flex-col pt-[104px]">
        <div className="grid flex-1 items-center gap-12 py-12 lg:grid-cols-[1.12fr_0.88fr] lg:gap-10 lg:py-16">
          <div>
            <div className="mb-10 w-16 text-brass lg:hidden">
              <Emblem decorative />
            </div>

            <h1 id="hero-heading" className="display text-[clamp(2.6rem,6.2vw,5.5rem)]">
              <span className="block overflow-hidden pb-[0.06em]">
                <motion.span className="block" {...line(0.1)}>
                  Better systems.
                </motion.span>
              </span>
              <span className="block overflow-hidden pb-[0.1em]">
                <motion.span className="block italic lg:pl-[9%]" {...line(0.22)}>
                  Brighter businesses.
                </motion.span>
              </span>
            </h1>

            <motion.div className="mt-9 max-w-[46ch]" {...fade(0.5)}>
              <div aria-hidden="true" className="mb-6 h-px w-14 bg-brass/70" />
              <p className="text-[1.0625rem] leading-[1.75] text-ivory/75">
                We bring thoughtful technology and creative solutions together to help businesses work smarter,
                connect with customers, and grow with confidence.
              </p>
            </motion.div>

            <motion.div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4" {...fade(0.62)}>
              <a
                href="#services"
                className="label group inline-flex items-center justify-between gap-6 bg-ivory px-6 py-4 text-forest transition-colors duration-300 hover:bg-brass sm:justify-start"
              >
                Explore Our Services
                <ArrowRight
                  aria-hidden="true"
                  className="size-4 transition-transform duration-300 group-hover:translate-x-1"
                  strokeWidth={1.5}
                />
              </a>
              <a
                href="#contact"
                className="label inline-flex items-center justify-between gap-6 border border-ivory/30 px-6 py-4 text-ivory transition-colors duration-300 hover:border-brass hover:text-brass sm:justify-start"
              >
                Let&rsquo;s Talk
                <ArrowRight aria-hidden="true" className="size-4 opacity-70" strokeWidth={1.5} />
              </a>
            </motion.div>
          </div>

          <div className="hidden items-center justify-center lg:flex">
            <motion.div
              className="w-full max-w-[400px] text-brass"
              initial={reduceMotion ? false : { opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.6, delay: 0.35, ease: EASE }}
            >
              <Emblem />
            </motion.div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-6 border-t border-ivory/15 py-5">
          <p className="label text-ivory/65">A Modern Business House</p>
          <a
            href="#introduction"
            className="label group flex items-center gap-3 text-ivory/60 transition-colors duration-300 hover:text-brass"
          >
            <span className="hidden sm:inline">Scroll</span>
            <span aria-hidden="true" className="block h-7 w-px bg-ivory/25 transition-colors group-hover:bg-brass" />
            <ArrowDown aria-hidden="true" className="size-3.5" strokeWidth={1.5} />
          </a>
        </div>
      </div>
    </section>
  );
}
