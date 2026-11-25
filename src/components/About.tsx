import { Emblem } from './Emblem';
import { Reveal } from './Reveal';

export function About() {
  return (
    <section id="about" aria-labelledby="about-heading" className="bg-ivory py-24 md:py-32 lg:py-40">
      <div className="gutter grid items-start gap-14 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-7">
          <Reveal>
            <h2 id="about-heading" className="display max-w-[18ch] text-[clamp(2.1rem,4vw,3.4rem)]">
              A little more thoughtful. A lot more capable.
            </h2>
          </Reveal>

          <Reveal delay={0.08}>
            <div className="mt-10 max-w-[58ch] space-y-6 text-[1.0625rem] leading-[1.8] text-charcoal/80">
              <p className="first-letter:font-display first-letter:float-left first-letter:mt-[0.18em] first-letter:mr-3 first-letter:text-[3.4rem] first-letter:leading-[0.72] first-letter:text-forest">
                Bramwell was founded on a simple idea: technology should make running a business easier, not more
                complicated.
              </p>
              <p>
                We bring together intelligent automation, digital design, and creative thinking to help businesses make
                better use of their time and opportunities.
              </p>
              <p className="border-l border-brass/50 pl-6 text-charcoal/90">
                No unnecessary complexity. Just considered solutions that work.
              </p>
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.12} className="lg:col-span-5">
          <figure className="mx-auto max-w-[420px] border border-charcoal/15 p-3">
            <div className="border border-charcoal/10 px-8 py-12">
              <div className="mx-auto w-full max-w-[240px] text-brass-ink">
                <Emblem />
              </div>
              <figcaption className="mt-10 border-t border-charcoal/15 pt-4">
                <p className="label text-brass-ink">Fig. I &mdash; The Bramwell mark</p>
              </figcaption>
            </div>
          </figure>
        </Reveal>
      </div>
    </section>
  );
}
