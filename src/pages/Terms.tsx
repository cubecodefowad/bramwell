import { LegalSection, LegalList } from '../components/LegalLayout';
import { CONTACT_EMAIL, LEGAL_UPDATED, POSTAL_ADDRESS } from '../data/legal';

export function Terms() {
  return (
    <article className="gutter max-w-[880px] py-20 md:py-28">
      <p className="label text-brass-ink">Legal</p>
      <h1 className="display mt-5 text-[clamp(2.3rem,5vw,3.6rem)]">Terms of Service</h1>
      <p className="mt-7 max-w-[58ch] text-[1.0625rem] leading-[1.8] text-charcoal/75">
        These terms cover your use of this website and what happens when you send us an enquiry. Work we carry out is
        governed by the proposal or statement of work you sign, which takes precedence where it disagrees with this
        page.
      </p>
      <p className="label mt-8 text-charcoal/55">Last updated {LEGAL_UPDATED}</p>

      <div className="mt-14 space-y-12 border-t border-charcoal/15 pt-12">
        <LegalSection id="agreement" title="Using this site">
          <p>
            By browsing this site or sending an enquiry you agree to these terms. If you do not agree with them, please
            do not use the site.
          </p>
          <p>
            Bramwell is a digital services studio. Our address is {POSTAL_ADDRESS.join(', ')}, and you can write to us
            at{' '}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="text-forest underline decoration-brass/60 underline-offset-4 hover:text-brass-ink"
            >
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </LegalSection>

        <LegalSection id="enquiries" title="Enquiries are not an agreement">
          <p>
            Sending the enquiry form, or receiving a reply from us, does not create a contract. It is a conversation.
            Nothing on this website is a binding quote: scope, price and timing are set out in a written proposal, and
            work begins only once that proposal is accepted.
          </p>
        </LegalSection>

        <LegalSection id="services" title="Our services">
          <p>
            We design and build AI receptionists, websites, automation, content plans and custom AI tools, as described
            on this site. Descriptions here are illustrative rather than exhaustive, and a proposal may include,
            exclude or change any particular element.
          </p>
          <p>
            Where a proposal or statement of work is signed, it governs the scope, deliverables, timeline, fees and
            acceptance for that engagement. If it conflicts with this page, the signed document wins.
          </p>
        </LegalSection>

        <LegalSection id="fees" title="Fees and payment">
          <p>
            Fees, invoicing schedule and payment terms are set in each proposal. Unless a proposal says otherwise,
            invoices are payable within 14 days, prices exclude applicable taxes, and work may pause while an invoice
            is outstanding. Ongoing services such as hosting, AI usage or platform subscriptions are billed at the rate
            stated in the proposal and may change with reasonable notice as our suppliers&rsquo; costs change.
          </p>
        </LegalSection>

        <LegalSection id="responsibilities" title="What we need from you">
          <LegalList
            items={[
              'Accurate information about your business, and the right to share any content, logo or data you give us.',
              'Timely access to the accounts, systems and people needed to do the work.',
              'Feedback and approvals within the timescales in the proposal, so the schedule holds.',
              'Responsibility for the lawfulness of what the finished system is used for, including any automated messages it sends on your behalf.',
            ]}
          />
        </LegalSection>

        <LegalSection id="ip" title="Intellectual property">
          <p>
            The Bramwell name, this website, its design and its written content belong to us. You may read, share and
            link to it, but not copy it into your own materials or present it as yours.
          </p>
          <p>
            In the work we deliver, ownership passes to you on final payment, except for our pre-existing tools and
            components and any third-party or open-source software, which remain under their own licences and are
            licensed to you on those terms.
          </p>
        </LegalSection>

        <LegalSection id="third-parties" title="Third-party services and AI">
          <p>
            Much of what we build runs on services operated by other companies &mdash; hosting, AI models, email,
            scheduling. Those services have their own terms, availability and pricing, and we do not control them.
            Interruptions, price changes or discontinuation of a third-party service are outside our control, though we
            will help you move to a sensible alternative.
          </p>
          <p>
            Automated and AI-assisted outputs can be wrong. We build in checks where it matters, but you remain
            responsible for reviewing anything a system sends or decides before it affects a customer, a legal
            obligation or your money.
          </p>
        </LegalSection>

        <LegalSection id="confidentiality" title="Confidentiality">
          <p>
            Anything you tell us in confidence stays confidential, and we use it only to do the work. The same applies
            in reverse to our proposals, pricing and methods. This does not cover information that is already public,
            that you give us permission to share, or that we are legally obliged to disclose.
          </p>
        </LegalSection>

        <LegalSection id="availability" title="Availability of this website">
          <p>
            We try to keep the site available and accurate but we do not promise uninterrupted access. Content,
            services and prices may change, and the site may be offline for maintenance. The enquiry form depends on
            third-party email delivery; if it fails, it will say so rather than pretend the message was sent.
          </p>
        </LegalSection>

        <LegalSection id="liability" title="Limitation of liability">
          <p>
            To the extent the law allows, we are not liable for indirect or consequential loss, lost profit, lost
            revenue or lost data arising from your use of this website. Nothing in these terms limits liability that
            cannot lawfully be limited, including liability for death or personal injury caused by negligence, or for
            fraud.
          </p>
          <p>
            For paid work, our total liability is limited to the fees paid for the engagement in question, as set out
            in the relevant proposal.
          </p>
        </LegalSection>

        <LegalSection id="termination" title="Ending an engagement">
          <p>
            Either side may end an engagement in the way the proposal allows, usually on written notice. On ending,
            you pay for work properly performed up to that point, and we hand over what has been paid for. Clauses that
            by their nature should survive &mdash; confidentiality, intellectual property, liability &mdash; survive.
          </p>
        </LegalSection>

        <LegalSection id="law" title="Governing law">
          <p>
            These terms are governed by the laws of the State of Washington, and the courts of King County, Washington
            have exclusive jurisdiction over any dispute about them, without affecting any right you have to bring a
            claim in your own country of residence where the law gives you that right.
          </p>
        </LegalSection>

        <LegalSection id="changes" title="Changes to these terms">
          <p>
            We may update these terms as the business changes. The version published here is the one that applies, and
            the date at the top of the page tells you when it last changed.
          </p>
        </LegalSection>
      </div>
    </article>
  );
}
