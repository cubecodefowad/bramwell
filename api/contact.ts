/**
 * Vercel serverless endpoint for the enquiry form: POST /api/contact.
 *
 * bramwell.top is served by Vercel as a static Vite build, so the form needs a
 * function on the same origin; a static host has no /api/contact and answers
 * 404. This mirrors the Sites Worker (sites/worker.js) so both hosts behave
 * identically: validate, throttle, then deliver through Resend with the API key
 * held in the server environment, never in the browser bundle.
 *
 * Two emails go out per enquiry: the enquiry to the studio inbox (blind-copied
 * to team@mail.bramwell.top), then a copy to the sender as a receipt. The copy is best effort — the enquiry is the
 * message that matters, so a failed receipt never fails the submission; the
 * response only reports whether the copy went out.
 *
 * Environment (Vercel -> Settings -> Environment Variables), all optional:
 *   RESEND_API_KEY  (secret)  Resend API key. Required for delivery.
 *   CONTACT_TO      (var)     Inbox that receives enquiries. Default hello@bramwell.top
 *   CONTACT_FROM    (var)     Verified sender in Resend.
 *                             Default Bramwell Enquiries <enquiries@mail.bramwell.top>
 *                             (mail.bramwell.top is the verified domain).
 *   UPSTASH_REDIS_REST_URL    (var)    Durable rate limiter. Unset = per-instance only.
 *   UPSTASH_REDIS_REST_TOKEN  (secret) Durable rate limiter credential.
 *   TURNSTILE_SECRET_KEY      (secret) Bot challenge. Unset = no challenge required.
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
/** Copied blind on every enquiry so the team inbox sees what the studio inbox sees. */
const BCC = 'team@mail.bramwell.top';
const POSTAL = ['600 1st Ave, Ste 330 PMB 92768', 'Seattle, WA 98104-2246'];

/** Fallback counter, used only when the durable store is unavailable. */
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

/**
 * Name, company and service are pasted into the Subject header, so newlines and
 * other control characters must not survive: a bare CRLF in a subject line is
 * header injection. Collapsing whitespace keeps the subject readable as well.
 */
function singleLine(value: string) {
  return value.replace(/[\s\u0000-\u001f\u007f]+/g, ' ').trim();
}

/** Validate the payload on the server too: the browser checks are only a courtesy. */
function validateEnquiry(payload: Record<string, unknown>) {
  const read = (key: keyof Enquiry) => (typeof payload[key] === 'string' ? (payload[key] as string).trim() : '');
  const enquiry: Enquiry = {
    name: singleLine(read('name')),
    email: read('email'),
    company: singleLine(read('company')),
    service: singleLine(read('service')),
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

/**
 * The form is same-origin: a browser sends Origin on every POST, so a request
 * without one did not come from the page. Refusing it closes the hole where the
 * endpoint could be driven as an email relay from a script.
 */
function isAllowedOrigin(origin: string | null, host: string) {
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

function firstHeader(value: string | string[] | undefined) {
  return (Array.isArray(value) ? value[0] : value)?.split(',')[0]?.trim() ?? '';
}

/**
 * Per-instance counter. Kept as the fallback so an Upstash outage never turns
 * the form into a wall, even though a cold instance starts from zero.
 */
function memoryHit(key: string) {
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

/**
 * Durable fixed-window counter shared by every instance. Upstash's REST API is
 * plain fetch, so the same call works from a Vercel function and a Worker.
 * Returns null when the store is not configured or cannot be reached.
 */
async function durableHit(key: string, windowSeconds: number) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  try {
    const response = await fetch(`${url.replace(/\/+$/, '')}/pipeline`, {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify([
        ['INCR', key],
        ['EXPIRE', key, windowSeconds, 'NX'],
      ]),
    });

    if (!response.ok) {
      console.error('ratelimit rejected', response.status);
      return null;
    }

    const results = (await response.json()) as { result?: unknown }[];
    const count = results?.[0]?.result;
    return typeof count === 'number' ? count : null;
  } catch (error) {
    console.error('ratelimit unreachable', error instanceof Error ? error.message : 'unknown');
    return null;
  }
}

async function isRateLimited(clientIp: string) {
  const key = `bramwell:contact:${clientIp}`;
  const count = await durableHit(key, Math.round(RATE_LIMIT.windowMs / 1000));
  if (count !== null) return count > RATE_LIMIT.max;
  return memoryHit(key);
}

/**
 * Turnstile is enforced only when its secret is configured, so the form keeps
 * working on its other defences until the keys are in place. The token is
 * single-use and must be confirmed with Cloudflare, never trusted from the page.
 */
async function verifyChallenge(payload: Record<string, unknown>, clientIp: string) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;

  const token = typeof payload.turnstileToken === 'string' ? payload.turnstileToken : '';
  if (!token) return false;

  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        secret,
        response: token,
        ...(clientIp === 'unknown' ? {} : { remoteip: clientIp }),
      }),
    });

    if (!response.ok) {
      console.error('turnstile rejected', response.status);
      return false;
    }

    const result = (await response.json()) as { success?: boolean };
    return result.success === true;
  } catch (error) {
    console.error('turnstile unreachable', error instanceof Error ? error.message : 'unknown');
    return false;
  }
}

/** CONTACT_TO may be given as "Team <addr>"; compare the bare address. */
function isTeamInbox(inbox: string) {
  const bracketed = inbox.match(/<([^>]+)>/);
  return (bracketed ? bracketed[1] : inbox).trim().toLowerCase() === BCC;
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

  const host = firstHeader(req.headers['x-forwarded-host']) || firstHeader(req.headers.host);
  if (!isAllowedOrigin(firstHeader(req.headers.origin) || null, host)) {
    send(res, 403, { ok: false, error: 'forbidden' });
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

  const clientIp = firstHeader(req.headers['x-forwarded-for']) || 'unknown';
  if (await isRateLimited(clientIp)) {
    send(res, 429, { ok: false, error: 'rate_limited' });
    return;
  }

  if (!(await verifyChallenge(payload, clientIp))) {
    send(res, 400, { ok: false, error: 'challenge_failed' });
    return;
  }

  const { enquiry } = checked;
  const from = process.env.CONTACT_FROM || DEFAULT_FROM;
  const inbox = process.env.CONTACT_TO || DEFAULT_TO;

  // If the studio inbox is the team address itself, a Bcc would deliver it twice.
  const blindCopy = isTeamInbox(inbox) ? {} : { bcc: [BCC] };

  const delivery = await deliver(apiKey, {
    from,
    to: [inbox],
    ...blindCopy,
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
