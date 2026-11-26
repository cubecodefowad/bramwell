import { LegalSection, LegalList } from '../components/LegalLayout';
import { CONTACT_EMAIL, LEGAL_UPDATED, POSTAL_ADDRESS } from '../data/legal';

export function Privacy() {
  return (
    <article className="gutter max-w-[880px] py-20 md:py-28">
      <p className="label text-brass-ink">Legal</p>
      <h1 className="display mt-5 text-[clamp(2.3rem,5vw,3.6rem)]">Privacy Policy</h1>
      <p className="mt-7 max-w-[58ch] text-[1.0625rem] leading-[1.8] text-charcoal/75">
        This policy explains what Bramwell collects when you visit this website or send us an enquiry, why we hold
        it, who else sees it, and how you can get it removed.
      </p>
      <p className="label mt-8 text-charcoal/55">Last updated {LEGAL_UPDATED}</p>

      <div className="mt-14 space-y-12 border-t border-charcoal/15 pt-12">
        <LegalSection id="who-we-are" title="Who we are">
          <p>
            Bramwell is a digital services studio that builds AI receptionists, websites, automation and creative
            content for other businesses. In this policy, &ldquo;we&rdquo;, &ldquo;us&rdquo; and &ldquo;Bramwell&rdquo;
            mean Bramwell. We are the controller of the personal information described below.
          </p>
          <p>
            You can reach us about anything in this policy at{' '}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="text-forest underline decoration-brass/60 underline-offset-4 hover:text-brass-ink"
            >
              {CONTACT_EMAIL}
            </a>
            , or by post at {POSTAL_ADDRESS.join(', ')}.
          </p>
        </LegalSection>

        <LegalSection id="what-we-collect" title="What we collect">
          <p>We collect only what the site actually needs to work:</p>
          <LegalList
            items={[
              <>
                <strong className="font-medium text-forest">Enquiry details.</strong> When you use the contact form we
                collect your name, email address, company name if you give one, the service you chose, and your
                message.
              </>,
              <>
                <strong className="font-medium text-forest">Delivery records.</strong> The time of your enquiry and a
                truncated form of the network address it came from, used to stop the form being abused. We do not keep
                a profile of you.
              </>,
              <>
                <strong className="font-medium text-forest">Usage analytics.</strong> Aggregated, cookieless
                information about page visits &mdash; the page path, the referring site, the country, and the kind of
                device. It cannot be used to identify you.
              </>,
              <>
                <strong className="font-medium text-forest">Technical logs.</strong> Our hosting providers record
                requests, including network addresses, so they can serve the site and defend it against attacks.
              </>,
            ]}
          />
          <p>
            We do not collect payment details through this site, we do not run advertising trackers, and we do not buy
            personal information from anyone.
          </p>
        </LegalSection>

        <LegalSection id="how-we-use-it" title="How we use it">
          <LegalList
            items={[
              'To read your enquiry and reply to it.',
              'To send you a copy of your enquiry as a receipt.',
              'To keep a record of the conversation if we go on to work together.',
              'To protect the form against spam and automated abuse.',
              'To understand which pages are useful, so we can improve them.',
            ]}
          />
          <p>
            We do not sell your details, and we do not add you to a marketing list because you sent an enquiry. If we
            ever want to write to you about something else, we will ask first.
          </p>
        </LegalSection>

        <LegalSection id="legal-bases" title="Our legal bases">
          <p>
            Where data protection law requires us to name a basis, we rely on: our legitimate interest in answering
            enquiries and running a business; taking steps at your request before entering a contract; performance of
            a contract once one exists; compliance with legal and accounting obligations; and, for anything optional,
            your consent.
          </p>
        </LegalSection>

        <LegalSection id="sharing" title="Who else sees it">
          <p>
            Your enquiry passes through a small number of service providers, each acting on our instructions and each
            bound by its own data protection terms:
          </p>
          <LegalList
            items={[
              <>
                <strong className="font-medium text-forest">Vercel</strong> &mdash; hosting for the website and for the
                enquiry endpoint, and the cookieless analytics described above.
              </>,
              <>
                <strong className="font-medium text-forest">Resend</strong> &mdash; delivery of the enquiry email and
                your receipt.
              </>,
              <>
                <strong className="font-medium text-forest">Cloudflare</strong> &mdash; the content delivery and
                security layer in front of the site, and the Turnstile bot check that runs when you send the enquiry
                form.
              </>,
              <>
                <strong className="font-medium text-forest">Upstash</strong> &mdash; a short-lived counter that limits
                how many enquiries one network address can send. It holds the network address and a count, and deletes
                both within ten minutes.
              </>,
              <>
                <strong className="font-medium text-forest">Google Workspace or a similar mailbox</strong> &mdash; where
                the studio inbox lives.
              </>,
            ]}
          />
          <p>
            The web fonts used here are served from this site itself, so no font request reaches a third party. We
            may also disclose information where the law requires it, or where it is necessary to establish or defend
            a legal claim. Some of these providers are in the United States, so information may be transferred
            outside the UK and the EEA; those transfers rely on the providers&rsquo; standard contractual clauses or an
            equivalent safeguard.
          </p>
        </LegalSection>

        <LegalSection id="cookies" title="Cookies and analytics">
          <p>
            This site sets no advertising or profiling cookies, and the analytics it uses are cookieless, so there is
            no cookie banner to accept. If that changes, this section will change first.
          </p>
        </LegalSection>

        <LegalSection id="retention" title="How long we keep it">
          <p>
            Enquiries are kept for up to 24 months after the last message, so we can pick up a conversation that went
            quiet. If we work together, project records are kept for as long as the relationship lasts and then for as
            long as tax and accounting rules require. Analytics data is aggregate from the start and is not kept
            against you.
          </p>
        </LegalSection>

        <LegalSection id="your-rights" title="Your rights">
          <p>
            Subject to the law where you live, you can ask for a copy of the information we hold about you, have it
            corrected or deleted, object to or restrict how it is used, and ask for it in a portable format. You can
            also withdraw any consent you have given at any time.
          </p>
          <p>
            Write to{' '}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="text-forest underline decoration-brass/60 underline-offset-4 hover:text-brass-ink"
            >
              {CONTACT_EMAIL}
            </a>{' '}
            and we will respond within one month. If you are in the UK or the EEA and are not satisfied with our
            answer, you can complain to your national regulator &mdash; in the UK, the Information Commissioner&rsquo;s
            Office. California residents may also request the categories of information we have collected in the last
            twelve months, and we will not discriminate against you for exercising any of these rights.
          </p>
        </LegalSection>

        <LegalSection id="security" title="Security">
          <p>
            The site is served over HTTPS, the enquiry endpoint validates and limits what it will accept, and the
            email credentials used to deliver your message are held in the hosting environment rather than in the
            page. No system is perfect; if we ever became aware of a breach affecting your information, we would tell
            you and the relevant regulator as the law requires.
          </p>
        </LegalSection>

        <LegalSection id="children" title="Children">
          <p>
            Our services are for businesses. This site is not directed at children and we do not knowingly collect
            information from them.
          </p>
        </LegalSection>

        <LegalSection id="changes" title="Changes to this policy">
          <p>
            If how we handle information changes, this page changes with it, and the date at the top changes too.
            Material changes will be flagged on the home page.
          </p>
        </LegalSection>
      </div>
    </article>
  );
}
