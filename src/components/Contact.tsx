import { useState } from 'react';
import { ArrowUpRight, ChevronDown } from 'lucide-react';
import { serviceNames } from '../data/services';
import {
  emptyEnquiry,
  sendEnquiry,
  validate,
  type Enquiry,
  type FieldErrors,
  type SubmitFailure,
} from '../lib/contact';
import { Reveal } from './Reveal';
import { Turnstile } from './Turnstile';

const CONTACT_EMAIL = 'hello@bramwell.top';
const ENDPOINT = import.meta.env.VITE_CONTACT_ENDPOINT || '/api/contact';
const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY;

type Status = 'idle' | 'sending' | 'sent' | 'error';

const FAILURE_COPY: Record<SubmitFailure, { title: string; body: string }> = {
  unconfigured: {
    title: 'This form is not connected yet',
    body: 'Nothing was sent, and we would rather say so than pretend. Write to the address below and your message will reach us directly.',
  },
  network: {
    title: 'The message did not go through',
    body: 'The connection dropped before it reached us. Try again, or send it by email instead.',
  },
  rejected: {
    title: 'The form service refused the message',
    body: 'Something on the receiving side blocked it. Email is the reliable route today.',
  },
  busy: {
    title: 'Too many messages from here just now',
    body: 'Give it a few minutes and send it again, or write to the address below and we will pick it up there.',
  },
  challenge: {
    title: 'The verification did not pass',
    body: 'The bot check expired or was not completed. Send it again, or write to the address below and we will pick it up there.',
  },
};

const fieldClass =
  'w-full border-b border-ivory/25 bg-transparent py-3 text-[1rem] text-ivory placeholder:text-ivory/55 transition-colors duration-300 hover:border-ivory/40 focus:border-brass';

export function Contact() {
  const [values, setValues] = useState<Enquiry>(emptyEnquiry);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<Status>('idle');
  const [failure, setFailure] = useState<SubmitFailure>('unconfigured');
  const [copySent, setCopySent] = useState(false);
  const [trap, setTrap] = useState('');
  const [token, setToken] = useState('');
  const [challengeKey, setChallengeKey] = useState(0);

  const update = (field: keyof Enquiry) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const next = { ...values, [field]: event.target.value };
    setValues(next);
    if (errors[field]) {
      setErrors((current) => {
        const copy = { ...current };
        delete copy[field];
        return copy;
      });
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status === 'sending') return;

    if (trap) {
      setStatus('sent');
      return;
    }

    const nextErrors = validate(values);
    setErrors(nextErrors);

    const firstInvalid = Object.keys(nextErrors)[0];
    if (firstInvalid) {
      document.getElementById(firstInvalid)?.focus();
      return;
    }

    if (TURNSTILE_SITE_KEY && !token) {
      setFailure('challenge');
      setStatus('error');
      return;
    }

    setStatus('sending');
    const result = await sendEnquiry(values, ENDPOINT, token);

    // Turnstile tokens are single-use: start a fresh widget for the next attempt.
    setToken('');
    setChallengeKey((value) => value + 1);

    if (result.ok) {
      setStatus('sent');
      setCopySent(result.copySent);
      setValues(emptyEnquiry);
      return;
    }

    setFailure(result.reason);
    setStatus('error');
  };

  return (
    <section id="contact" aria-labelledby="contact-heading" className="on-dark bg-forest py-24 text-ivory md:py-32 lg:py-36">
      <div className="gutter grid gap-16 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
        <div>
          <Reveal>
            <h2 id="contact-heading" className="display max-w-[15ch] text-[clamp(2.4rem,4.6vw,4rem)]">
              Let&rsquo;s make something work better.
            </h2>
          </Reveal>

          <Reveal delay={0.08}>
            <p className="mt-7 max-w-[42ch] text-[1.0625rem] leading-[1.8] text-ivory/75">
              Have an idea, a challenge, or a business process that could use a little improvement? We&rsquo;d love to
              hear about it.
            </p>

            <a
              href="#enquiry"
              className="label group mt-9 inline-flex items-center gap-6 bg-ivory px-6 py-4 text-forest transition-colors duration-300 hover:bg-brass"
            >
              Start a Conversation
              <ArrowUpRight
                aria-hidden="true"
                className="size-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                strokeWidth={1.5}
              />
            </a>
          </Reveal>

          <Reveal delay={0.14}>
            <div className="mt-14 border-t border-ivory/15 pt-6">
              <p className="label text-ivory/60">Correspondence</p>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="mt-3 inline-block font-display text-[1.4rem] text-ivory underline decoration-brass/50 decoration-1 underline-offset-[6px] transition-colors duration-300 hover:text-brass"
              >
                {CONTACT_EMAIL}
              </a>
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.1}>
          <form id="enquiry" onSubmit={handleSubmit} noValidate className="border-t border-ivory/20 pt-10">
            <div className="grid gap-7 sm:grid-cols-2">
              <div>
                <label htmlFor="name" className="label block text-ivory/70">
                  Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  value={values.name}
                  onChange={update('name')}
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={errors.name ? 'name-error' : undefined}
                  placeholder="Your full name"
                  className={`${fieldClass} mt-3`}
                />
                {errors.name && (
                  <p id="name-error" className="mt-2 text-[0.8rem] leading-snug text-clay">
                    {errors.name}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="label block text-ivory/70">
                  Business email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  value={values.email}
                  onChange={update('email')}
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                  placeholder="you@company.com"
                  className={`${fieldClass} mt-3`}
                />
                {errors.email && (
                  <p id="email-error" className="mt-2 text-[0.8rem] leading-snug text-clay">
                    {errors.email}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="company" className="label block text-ivory/70">
                  Company <span className="normal-case tracking-normal opacity-60">(optional)</span>
                </label>
                <input
                  id="company"
                  name="company"
                  type="text"
                  autoComplete="organization"
                  value={values.company}
                  onChange={update('company')}
                  aria-invalid={Boolean(errors.company)}
                  aria-describedby={errors.company ? 'company-error' : undefined}
                  placeholder="The business you run"
                  className={`${fieldClass} mt-3`}
                />
                {errors.company && (
                  <p id="company-error" className="mt-2 text-[0.8rem] leading-snug text-clay">
                    {errors.company}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="service" className="label block text-ivory/70">
                  Service of interest
                </label>
                <div className="relative">
                  <select
                    id="service"
                    name="service"
                    value={values.service}
                    onChange={update('service')}
                    aria-invalid={Boolean(errors.service)}
                    aria-describedby={errors.service ? 'service-error' : undefined}
                    className={`${fieldClass} mt-3 appearance-none pr-8 ${values.service ? 'text-ivory' : 'text-ivory/60'}`}
                  >
                    <option value="" disabled className="bg-forest text-ivory">
                      Select a service
                    </option>
                    {serviceNames.map((name) => (
                      <option key={name} value={name} className="bg-forest text-ivory">
                        {name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    aria-hidden="true"
                    className="pointer-events-none absolute right-0 bottom-4 size-4 text-ivory/50"
                    strokeWidth={1.5}
                  />
                </div>
                {errors.service && (
                  <p id="service-error" className="mt-2 text-[0.8rem] leading-snug text-clay">
                    {errors.service}
                  </p>
                )}
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="message" className="label block text-ivory/70">
                  What do you need?
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={4}
                  value={values.message}
                  onChange={update('message')}
                  aria-invalid={Boolean(errors.message)}
                  aria-describedby={errors.message ? 'message-error' : undefined}
                  placeholder="The process, the problem, or the idea you have in mind."
                  className={`${fieldClass} mt-3 min-h-[120px] resize-y`}
                />
                {errors.message && (
                  <p id="message-error" className="mt-2 text-[0.8rem] leading-snug text-clay">
                    {errors.message}
                  </p>
                )}
              </div>

              {TURNSTILE_SITE_KEY && (
                <div className="sm:col-span-2">
                  <Turnstile key={challengeKey} siteKey={TURNSTILE_SITE_KEY} onToken={setToken} />
                  <p className="label mt-2 text-ivory/50">Protected by Cloudflare Turnstile</p>
                </div>
              )}

              <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
                <label htmlFor="website">Website</label>
                <input
                  id="website"
                  name="website"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={trap}
                  onChange={(event) => setTrap(event.target.value)}
                />
              </div>
            </div>

            <div className="mt-10 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="submit"
                disabled={status === 'sending'}
                className="label inline-flex items-center justify-between gap-8 border border-brass px-7 py-4 text-brass transition-colors duration-300 hover:bg-brass hover:text-forest disabled:cursor-not-allowed disabled:opacity-60"
              >
                {status === 'sending' ? 'Sending' : 'Send Enquiry'}
                <ArrowUpRight aria-hidden="true" className="size-4" strokeWidth={1.5} />
              </button>
              <p className="text-[0.8rem] leading-relaxed text-ivory/65">
                We use your details only to reply.
              </p>
            </div>

            <div aria-live="polite" className="mt-6">
              {status === 'sent' && (
                <div className="border border-brass/50 bg-forest-deep p-5">
                  <p className="font-display text-[1.3rem] text-ivory">Thank you &mdash; that has reached us.</p>
                  <p className="mt-2 text-[0.9rem] leading-relaxed text-ivory/70">
                    We&rsquo;ll come back to you within two working days.
                    {copySent && ' A copy of your enquiry is on its way to your inbox.'} If it is urgent, write to{' '}
                    <a href={`mailto:${CONTACT_EMAIL}`} className="text-brass underline underline-offset-4">
                      {CONTACT_EMAIL}
                    </a>
                    .
                  </p>
                </div>
              )}

              {status === 'error' && (
                <div className="border border-clay/50 bg-forest-deep p-5">
                  <p className="font-display text-[1.3rem] text-ivory">{FAILURE_COPY[failure].title}</p>
                  <p className="mt-2 text-[0.9rem] leading-relaxed text-ivory/70">
                    {FAILURE_COPY[failure].body}{' '}
                    <a
                      href={`mailto:${CONTACT_EMAIL}`}
                      className="text-brass underline underline-offset-4 hover:text-ivory"
                    >
                      {CONTACT_EMAIL}
                    </a>
                  </p>
                </div>
              )}
            </div>
          </form>
        </Reveal>
      </div>
    </section>
  );
}
