import { steps } from '../data/services';
import { Reveal } from './Reveal';

export function Approach() {
  return (
    <section id="approach" aria-labelledby="approach-heading" className="bg-ivory-dim py-24 md:py-32 lg:py-36">
      <div className="gutter">
        <div aria-hidden="true" className="rule-double mb-16 text-charcoal" />

        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <Reveal>
            <h2 id="approach-heading" className="display text-[clamp(2.4rem,5vw,4.25rem)]">
              Simple by design.
            </h2>
          </Reveal>
          <Reveal delay={0.08}>
            <p className="label text-brass-ink">Four steps, start to finish</p>
          </Reveal>
        </div>

        <ol className="relative mt-16 grid gap-10 md:mt-20 md:grid-cols-4 md:gap-8">
          <span
            aria-hidden="true"
            className="absolute top-[3px] bottom-[6px] left-[3px] w-px bg-charcoal/20 md:right-0 md:bottom-auto md:left-0 md:h-px md:w-auto"
          />
          {steps.map((step, index) => (
            <li key={step.number} className="relative pl-9 md:pl-0 md:pt-10">
              <span
                aria-hidden="true"
                className="absolute top-[7px] left-0 size-[7px] rotate-45 bg-brass md:top-0"
              />
              <Reveal delay={index * 0.07}>
                <span className="label text-brass-ink tabular-nums">{step.number}</span>
                <h3 className="display mt-3 text-[1.6rem]">{step.title}</h3>
                <p className="mt-3 max-w-[30ch] text-[0.925rem] leading-[1.7] text-charcoal/70">{step.description}</p>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
