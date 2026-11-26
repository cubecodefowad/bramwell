/**
 * Vercel serverless endpoint for the enquiry form: POST /api/contact.
 *
 * bramwell.top is served by Vercel as a static Vite build, so the form needs a
 * function on the same origin; a static host has no /api/contact and answers
 * 404. This mirrors the Sites Worker (sites/worker.js) so both hosts behave
 * identically: validate, throttle, then deliver through Resend with the API key
 * held in the server environment, never in the browser bundle.
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

function composeEmail(enquiry: Enquiry) {
  const received = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
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

  const row = (label: string, value: string) =>
    `<tr><td style="padding:6px 16px 6px 0;color:#6b6b6b;font:600 12px/1.4 Helvetica,Arial,sans-serif;text-transform:uppercase;letter-spacing:.08em;vertical-align:top">${label}</td>` +
    `<td style="padding:6px 0;color:#292b28;font:15px/1.6 Georgia,serif">${value}</td></tr>`;

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
<div style="margin:24px 0 0;padding:20px;background:#f5f1e8;border-left:3px solid #b69a65">
<p style="margin:0;color:#292b28;font:15px/1.7 Georgia,serif;white-space:pre-wrap">${escapeHtml(enquiry.message)}</p>
</div>
<p style="margin:24px 0 0;color:#6b6b6b;font:13px/1.6 Helvetica,Arial,sans-serif">Reply to this email to answer them directly.</p>
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
    send(res, 200, { ok: true });
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
  const { subject, text, html } = composeEmail(enquiry);

  let delivery: Response;
  try {
    delivery = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${apiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.CONTACT_FROM || DEFAULT_FROM,
        to: [process.env.CONTACT_TO || DEFAULT_TO],
        reply_to: enquiry.email,
        subject,
        text,
        html,
      }),
    });
  } catch {
    send(res, 502, { ok: false, error: 'delivery_failed' });
    return;
  }

  if (!delivery.ok) {
    // Log Resend's own explanation (it never contains the key) and tell the
    // client only the upstream status, so nothing about the account leaks.
    const detail = await delivery.text().catch(() => '');
    console.error('resend rejected', delivery.status, detail.slice(0, 500));
    send(res, 502, { ok: false, error: 'delivery_failed', upstream: delivery.status });
    return;
  }

  send(res, 200, { ok: true });
}
