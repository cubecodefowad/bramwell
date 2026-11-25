import { services } from '../data/services';
import { Reveal } from './Reveal';

export function Services() {
  return (
    <section id="services" aria-labelledby="services-heading" className="bg-ivory pb-24 md:pb-32 lg:pb-40">
      <div className="gutter">
        <div className="flex flex-col justify-between gap-6 border-t border-charcoal/15 pt-10 md:flex-row md:items-end">
          <Reveal>
            <h2 id="services-heading" className="display text-[clamp(2.4rem,5vw,4.25rem)]">
              What we do.
            </h2>
          </Reveal>
          <Reveal delay={0.08}>
            <p className="max-w-[26ch] text-[0.95rem] text-charcoal/70 md:text-right">
              Practical digital solutions, thoughtfully brought together.
            </p>
          </Reveal>
        </div>

        <div className="mt-14 grid gap-px border border-charcoal/15 bg-charcoal/15 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service, index) => {
            const Icon = service.icon;
            return (
              <Reveal key={service.number} delay={index * 0.05} distance={12} className="bg-ivory">
                <article className="group relative h-full overflow-hidden bg-ivory p-7 transition-colors duration-500 hover:bg-sage-soft lg:p-9">
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 top-0 h-px w-0 bg-brass transition-[width] duration-700 ease-out group-hover:w-full"
                  />
                  <div className="flex items-start justify-between">
                    <span className="label text-brass-ink tabular-nums">{service.number}</span>
                    <Icon
                      aria-hidden="true"
                      className="size-[22px] text-forest/55 transition-all duration-500 group-hover:-translate-y-0.5 group-hover:text-brass-ink"
                      strokeWidth={1.25}
                    />
                  </div>
                  <h3 className="display mt-12 max-w-[18ch] text-[1.55rem] leading-[1.1]">{service.title}</h3>
                  <p className="mt-4 text-[0.925rem] leading-[1.7] text-charcoal/70">{service.description}</p>
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
