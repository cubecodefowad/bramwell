export type Enquiry = {
  name: string;
  email: string;
  company: string;
  service: string;
  message: string;
};

export type FieldErrors = Partial<Record<keyof Enquiry, string>>;

export type SubmitFailure = 'unconfigured' | 'network' | 'rejected';

export type SubmitResult = { ok: true } | { ok: false; reason: SubmitFailure };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const emptyEnquiry: Enquiry = {
  name: '',
  email: '',
  company: '',
  service: '',
  message: '',
};

export function validate(values: Enquiry): FieldErrors {
  const errors: FieldErrors = {};
  const name = values.name.trim();
  const email = values.email.trim();
  const message = values.message.trim();

  if (!name) errors.name = 'Please tell us your name.';
  else if (name.length > 100) errors.name = 'That is longer than we can store — 100 characters at most.';

  if (!email) errors.email = 'Please add an email address so we can reply.';
  else if (!EMAIL_PATTERN.test(email)) errors.email = 'That address looks incomplete. Check for a missing @ or domain.';

  if (values.company.length > 120) errors.company = 'Please keep the company name under 120 characters.';

  if (!values.service) errors.service = 'Choose the service closest to what you need.';

  if (!message) errors.message = 'A sentence or two about the problem is enough.';
  else if (message.length < 20) errors.message = 'A little more detail, please — at least 20 characters.';
  else if (message.length > 2000) errors.message = 'Please keep this under 2,000 characters.';

  return errors;
}

export async function sendEnquiry(values: Enquiry, endpoint: string | undefined): Promise<SubmitResult> {
  if (!endpoint) return { ok: false, reason: 'unconfigured' };

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        ...values,
        name: values.name.trim(),
        email: values.email.trim(),
        company: values.company.trim(),
        message: values.message.trim(),
        source: 'bramwell.com',
        submittedAt: new Date().toISOString(),
      }),
    });

    if (!response.ok) return { ok: false, reason: 'rejected' };
    return { ok: true };
  } catch {
    return { ok: false, reason: 'network' };
  }
}
