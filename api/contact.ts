/**
 * Vercel serverless endpoint for the enquiry form: POST /api/contact.
 *
 * bramwell.top is served by Vercel as a static Vite build, so the form needs a
 * function on the same origin; a static host has no /api/contact and answers
 * 404. This mirrors the Sites Worker (sites/worker.js) so both hosts behave
 * identically: validate, throttle, then deliver through Resend with the API key
 * held in the server environment, never in the browser bundle.
 *
 * Two emails go out per enquiry: the enquiry to the studio inbox, then a copy
 * to the sender as a receipt. The copy is best effort — the enquiry is the
 * message that matters, so a failed receipt never fails the submission; the
 * response only reports whether the copy went out.
 *
 * Environment (Vercel -> Settings -> Environment Variables), all optional:
 *   RESEND_API_KEY  (secret)  Resend API key. Required for delivery.
 *   CONTACT_TO      (var)     Inbox that receives enquiries. Default hello@bramwell.top
 *   CONTACT_FROM    (var)     Verified sender in Resend.
 *                             Default Bramwell Enquiries <enquiries@mail.bramwell.top>
 *                             (mail.bramwell.top is the verified domain).
 */

type VercelRequest = {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
};

type VercelResponse = {
  status(code: number): VercelResponse;
  setHeader(name: string, value: string): unknown;
  end(body?: string): unknown;
};

type Enquiry = {
  name: string;
  email: string;
  company: string;
  service: string;
  message: string;
};

const MAX_BODY_BYTES = 16 * 1024;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const RATE_LIMIT = { windowMs: 10 * 60 * 1000, max: 5 };
const FIELD_LIMITS = { name: 100, email: 254, company: 120, service: 80, message: 2000 };

const DEFAULT_FROM = 'Bramwell Enquiries <enquiries@mail.bramwell.top>';
const DEFAULT_TO = 'hello@bramwell.top';
const POSTAL = ['600 1st Ave, Ste 330 PMB 92768', 'Seattle, WA 98104-2246'];

/** Best-effort per-instance throttle. Vercel may run several instances. */
const recentHits = new Map<string, { start: number; count: number }>();

function send(res: VercelResponse, status: number, body: unknown) {
  res.status(status);
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.setHeader('cache-control', 'no-store');
  res.setHeader('x-content-type-options', 'nosniff');
  res.setHeader('referrer-policy', 'strict-origin-when-cross-origin');
  res.end(JSON.stringify(body));
}

function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character] as string,
  );
}

/** Validate the payload on the server too: the browser checks are only a courtesy. */
function validateEnquiry(payload: Record<string, unknown>) {
  const read = (key: keyof Enquiry) => (typeof payload[key] === 'string' ? (payload[key] as string).trim() : '');
  const enquiry: Enquiry = {
    name: read('name'),
    email: read('email'),
    company: read('company'),
    service: read('service'),
    message: read('message'),
  };

  const fields: Partial<Record<keyof Enquiry, string>> = {};
  if (!enquiry.name || enquiry.name.length > FIELD_LIMITS.name) fields.name = 'invalid';
  if (!EMAIL_PATTERN.test(enquiry.email) || enquiry.email.length > FIELD_LIMITS.email) fields.email = 'invalid';
  if (enquiry.company.length > FIELD_LIMITS.company) fields.company = 'invalid';
  if (!enquiry.service || enquiry.service.length > FIELD_LIMITS.service) fields.service = 'invalid';
  if (enquiry.message.length < 20 || enquiry.message.length > FIELD_LIMITS.message) fields.message = 'invalid';

  if (Object.keys(fields).length > 0) return { ok: false as const, fields };
  return { ok: true as const, enquiry };
}

function isRateLimited(key: string) {
  const now = Date.now();
  const record = recentHits.get(key);

  if (!record || now - record.start > RATE_LIMIT.windowMs) {
    if (recentHits.size > 1000) {
      for (const [entryKey, entry] of recentHits) {
        if (now - entry.start > RATE_LIMIT.windowMs) recentHits.delete(entryKey);
      }
    }
    recentHits.set(key, { start: now, count: 1 });
    return false;
  }

  record.count += 1;
  return record.count > RATE_LIMIT.max;
}

function stamp() {
  return new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
}

function row(label: string, value: string) {
  return (
    `<tr><td style="padding:6px 16px 6px 0;color:#6b6b6b;font:600 12px/1.4 Helvetica,Arial,sans-serif;text-transform:uppercase;letter-spacing:.08em;vertical-align:top">${label}</td>` +
    `<td style="padding:6px 0;color:#292b28;font:15px/1.6 Georgia,serif">${value}</td></tr>`
  );
}

function quote(message: string) {
  return `<div style="margin:24px 0 0;padding:20px;background:#f5f1e8;border-left:3px solid #b69a65">
<p style="margin:0;color:#292b28;font:15px/1.7 Georgia,serif;white-space:pre-wrap">${escapeHtml(message)}</p>
</div>`;
}

function composeEmail(enquiry: Enquiry) {
  const received = stamp();
  const company = enquiry.company || '—';
  const subject = `New enquiry — ${enquiry.service} — ${enquiry.name}`;

  const text = [
    'New enquiry from bramwell.com',
    '',
    `Name:     ${enquiry.name}`,
    `Email:    ${enquiry.email}`,
    `Company:  ${company}`,
    `Service:  ${enquiry.service}`,
    `Received: ${received}`,
    '',
    'Message:',
    enquiry.message,
    '',
    '—',
    'Reply to this email to answer them directly.',
  ].join('\n');

  const html = `<!doctype html><html><body style="margin:0;background:#f5f1e8;padding:32px">
<div style="max-width:600px;margin:0 auto;background:#ffffff;border-top:4px solid #19352d;padding:32px">
<p style="margin:0 0 4px;color:#7c6435;font:600 11px/1.4 Helvetica,Arial,sans-serif;text-transform:uppercase;letter-spacing:.18em">Bramwell</p>
<h1 style="margin:0 0 20px;color:#19352d;font:400 24px/1.25 Georgia,serif">New enquiry</h1>
<table style="border-collapse:collapse;width:100%">
${row('Name', escapeHtml(enquiry.name))}
${row('Email', `<a href="mailto:${escapeHtml(enquiry.email)}" style="color:#19352d">${escapeHtml(enquiry.email)}</a>`)}
${row('Company', escapeHtml(company))}
${row('Service', escapeHtml(enquiry.service))}
${row('Received', received)}
</table>
${quote(enquiry.message)}
<p style="margin:24px 0 0;color:#6b6b6b;font:13px/1.6 Helvetica,Arial,sans-serif">Reply to this email to answer them directly.</p>
</div></body></html>`;

  return { subject, text, html };
}

/** The receipt the enquirer keeps. No promises the studio has not made. */
function composeAcknowledgement(enquiry: Enquiry) {
  const firstName = enquiry.name.split(/\s+/)[0];
  const company = enquiry.company || '—';
  const sent = stamp();
  const subject = 'We have your enquiry — Bramwell';

  const text = [
    `Thank you, ${firstName}. Your enquiry has reached us.`,
    '',
    'We will come back to you within two working days.',
    '',
    'For your records, this is what you sent:',
    '',
    `Service:  ${enquiry.service}`,
    `Company:  ${company}`,
    `Sent:     ${sent}`,
    '',
    enquiry.message,
    '',
    '—',
    'Bramwell',
    ...POSTAL,
    '',
    'Reply to this email if anything needs adding.',
  ].join('\n');

  const html = `<!doctype html><html><body style="margin:0;background:#f5f1e8;padding:32px">
<div style="max-width:600px;margin:0 auto;background:#ffffff;border-top:4px solid #19352d;padding:32px">
<p style="margin:0 0 4px;color:#7c6435;font:600 11px/1.4 Helvetica,Arial,sans-serif;text-transform:uppercase;letter-spacing:.18em">Bramwell</p>
<h1 style="margin:0 0 20px;color:#19352d;font:400 24px/1.25 Georgia,serif">Thank you, ${escapeHtml(
    firstName,
  )}.</h1>
<p style="margin:0 0 20px;color:#292b28;font:16px/1.7 Georgia,serif">Your enquiry has reached us. We will come back to you within two working days.</p>
<p style="margin:0;color:#6b6b6b;font:600 12px/1.4 Helvetica,Arial,sans-serif;text-transform:uppercase;letter-spacing:.08em">A copy of what you sent</p>
<table style="border-collapse:collapse;width:100%;margin-top:12px">
${row('Service', escapeHtml(enquiry.service))}
${row('Company', escapeHtml(company))}
${row('Sent', sent)}
</table>
${quote(enquiry.message)}
<p style="margin:28px 0 0;color:#292b28;font:15px/1.7 Georgia,serif">Bramwell<br />
<span style="color:#6b6b6b;font:14px/1.7 Helvetica,Arial,sans-serif">${POSTAL.join('<br />')}</span></p>
<p style="margin:20px 0 0;color:#6b6b6b;font:13px/1.6 Helvetica,Arial,sans-serif">Reply to this email if anything needs adding.</p>
</div></body></html>`;

  return { subject, text, html };
}

function parseBody(body: unknown): Record<string, unknown> | null {
  if (typeof body === 'string') {
    try {
      const parsed = JSON.parse(body);
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }
  if (body && typeof body === 'object' && !Array.isArray(body)) return body as Record<string, unknown>;
  return null;
}

/** One Resend call. Failures are logged with Resend's own words, never echoed. */
async function deliver(apiKey: string, message: Record<string, unknown>) {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      console.error('resend rejected', response.status, detail.slice(0, 500));
      return { ok: false as const, status: response.status };
    }

    return { ok: true as const };
  } catch (error) {
    console.error('resend unreachable', error instanceof Error ? error.message : 'unknown');
    return { ok: false as const, status: 0 };
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('allow', 'POST');
    res.setHeader('content-type', 'text/plain; charset=utf-8');
    res.setHeader('x-content-type-options', 'nosniff');
    res.status(405).end('Method Not Allowed');
    return;
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    send(res, 503, { ok: false, error: 'not_configured' });
    return;
  }

  const declaredLength = Number(req.headers['content-length'] ?? '0');
  if (declaredLength > MAX_BODY_BYTES) {
    send(res, 413, { ok: false, error: 'too_large' });
    return;
  }

  const payload = parseBody(req.body);
  if (!payload) {
    send(res, 400, { ok: false, error: 'invalid' });
    return;
  }

  // Honeypot: accept and drop, so a bot gets no signal that it was caught.
  if (typeof payload.website === 'string' && payload.website.trim() !== '') {
    send(res, 200, { ok: true, copySent: false });
    return;
  }

  const checked = validateEnquiry(payload);
  if (!checked.ok) {
    send(res, 400, { ok: false, error: 'invalid', fields: checked.fields });
    return;
  }

  const forwarded = req.headers['x-forwarded-for'];
  const clientIp =
    (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(',')[0]?.trim() || 'unknown';
  if (isRateLimited(clientIp)) {
    send(res, 429, { ok: false, error: 'rate_limited' });
    return;
  }

  const { enquiry } = checked;
  const from = process.env.CONTACT_FROM || DEFAULT_FROM;
  const inbox = process.env.CONTACT_TO || DEFAULT_TO;

  const delivery = await deliver(apiKey, {
    from,
    to: [inbox],
    reply_to: enquiry.email,
    ...composeEmail(enquiry),
  });

  if (!delivery.ok) {
    send(res, 502, {
      ok: false,
      error: 'delivery_failed',
      ...(delivery.status ? { upstream: delivery.status } : {}),
    });
    return;
  }

  // The enquiry is safely delivered at this point; the receipt is a courtesy.
  const copy = await deliver(apiKey, {
    from,
    to: [enquiry.email],
    reply_to: inbox,
    ...composeAcknowledgement(enquiry),
  });

  send(res, 200, { ok: true, copySent: copy.ok });
}
