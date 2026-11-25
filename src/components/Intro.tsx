import { principles } from '../data/services';
import { Reveal } from './Reveal';

export function Intro() {
  return (
    <section id="introduction" aria-labelledby="intro-heading" className="bg-ivory py-24 md:py-32 lg:py-40">
      <div className="gutter grid gap-12 lg:grid-cols-12 lg:gap-16">
        <Reveal className="lg:col-span-5">
          <h2 id="intro-heading" className="display text-[clamp(2.1rem,3.6vw,3.2rem)]">
            Good business deserves better tools.
          </h2>
        </Reveal>

        <div className="lg:col-span-7">
          <Reveal delay={0.08}>
            <p className="max-w-[62ch] text-[1.0625rem] leading-[1.8] text-charcoal/80">
              Running a business shouldn&rsquo;t mean getting caught up in repetitive tasks, disconnected systems, or
              complicated technology. We help bring everything together through intelligent automation, thoughtful
              design, and practical digital solutions.
            </p>
          </Reveal>

          <div className="mt-12">
            {principles.map((principle, index) => (
              <Reveal key={principle.numeral} delay={0.1 + index * 0.06}>
                <div className="grid grid-cols-[2.5rem_1fr] items-baseline gap-4 border-t border-charcoal/15 py-6 sm:grid-cols-[3.5rem_1fr]">
                  <span className="font-display text-[1.05rem] text-brass-ink">{principle.numeral}</span>
                  <div className="sm:flex sm:items-baseline sm:justify-between sm:gap-8">
                    <h3 className="font-display text-[1.4rem] leading-snug sm:shrink-0">{principle.title}</h3>
                    <p className="mt-1 max-w-[30ch] text-[0.95rem] text-charcoal/70 sm:mt-0 sm:text-right">
                      {principle.description}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
            <div className="border-t border-charcoal/15" />
          </div>
        </div>
      </div>
    </section>
  );
}
