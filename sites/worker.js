/**
 * Freebuff Sites entry Worker for the Bramwell site.
 *
 * Two jobs:
 *
 * 1. Serve the static single-page build (Vite) from the asset binding: real
 *    files as-is, the app shell for document routes, and honest 404s for
 *    missing files so a stale chunk reference fails loudly instead of being
 *    answered with HTML.
 * 2. Accept the enquiry form at POST /api/contact and deliver it by email
 *    through Resend, then send the enquirer a copy as a receipt. The API key
 *    lives in the Worker environment, never in the browser bundle. If no key is
 *    configured the endpoint says so (503) and the page shows its "not
 *    connected" state rather than faking a success.
 *
 * Environment:
 *   RESEND_API_KEY  (secret)  Resend API key. Required for delivery.
 *   CONTACT_TO      (var)     Inbox that receives enquiries. Default hello@bramwell.top
 *   CONTACT_FROM    (var)     Verified sender in Resend.
 *                             Default Bramwell Enquiries <enquiries@mail.bramwell.top>
 *                             (mail.bramwell.top is the verified domain).
 *
 * Every enquiry is blind-copied to team@mail.bramwell.top.
 */

/**
 * The production header set, mirroring vercel.json. frame-ancestors 'none' and
 * x-frame-options DENY stop the site being framed: relax both to 'self' /
 * SAMEORIGIN if this deployment ever needs to sit inside an embed.
 */
const SECURITY_HEADERS = {
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'DENY',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'permissions-policy':
    'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()',
  'strict-transport-security': 'max-age=63072000; includeSubDomains',
  'content-security-policy':
    "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; img-src 'self' data:; font-src 'self'; style-src 'self'; script-src 'self' https://challenges.cloudflare.com; frame-src https://challenges.cloudflare.com; connect-src 'self' https://challenges.cloudflare.com https://vitals.vercel-insights.com; upgrade-insecure-requests",
};

/** A path whose last segment has a file extension is a file, not a route. */
const FILE_PATH = /\.[a-z0-9]+$/i;

const CONTACT_PATH = '/api/contact';
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
const recentHits = new Map();

function withHeaders(response, extra = {}) {
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) headers.set(name, value);
  for (const [name, value] of Object.entries(extra)) headers.set(name, value);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function notFound() {
  return new Response('Not Found', {
    status: 404,
    headers: { 'content-type': 'text/plain; charset=utf-8', ...SECURITY_HEADERS },
  });
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      ...SECURITY_HEADERS,
    },
  });
}

function methodNotAllowed(allow) {
  return new Response('Method Not Allowed', {
    status: 405,
    headers: { allow, 'content-type': 'text/plain; charset=utf-8', ...SECURITY_HEADERS },
  });
}

function escapeHtml(value) {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character],
  );
}

/**
 * Name, company and service are pasted into the Subject header, so newlines and
 * other control characters must not survive: a bare CRLF in a subject line is
 * header injection. Collapsing whitespace keeps the subject readable as well.
 */
function singleLine(value) {
  return value.replace(/[\s\u0000-\u001f\u007f]+/g, ' ').trim();
}

/** Validate the payload on the server too: the browser checks are only a courtesy. */
function validateEnquiry(payload) {
  const read = (key) => (typeof payload[key] === 'string' ? payload[key].trim() : '');
  const enquiry = {
    name: singleLine(read('name')),
    email: read('email'),
    company: singleLine(read('company')),
    service: singleLine(read('service')),
    message: read('message'),
  };

  const fields = {};
  if (!enquiry.name || enquiry.name.length > FIELD_LIMITS.name) fields.name = 'invalid';
  if (!EMAIL_PATTERN.test(enquiry.email) || enquiry.email.length > FIELD_LIMITS.email) {
    fields.email = 'invalid';
  }
  if (enquiry.company.length > FIELD_LIMITS.company) fields.company = 'invalid';
  if (!enquiry.service || enquiry.service.length > FIELD_LIMITS.service) fields.service = 'invalid';
  if (enquiry.message.length < 20 || enquiry.message.length > FIELD_LIMITS.message) {
    fields.message = 'invalid';
  }

  if (Object.keys(fields).length > 0) return { ok: false, fields };
  return { ok: true, enquiry };
}

/**
 * The form is same-origin: a browser sends Origin on every POST, so a request
 * without one did not come from the page. Refusing it closes the hole where the
 * endpoint could be driven as an email relay from a script.
 */
function isAllowedOrigin(origin, host) {
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

/**
 * Per-isolate counter. Kept as the fallback so an Upstash outage never turns the
 * form into a wall, even though a fresh isolate starts from zero.
 */
function memoryHit(key) {
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
 * Durable fixed-window counter shared by every isolate. Upstash's REST API is
 * plain fetch, so the same call works from a Worker and a Vercel function.
 * Returns null when the store is not configured or cannot be reached.
 */
async function durableHit(key, windowSeconds, env) {
  const url = env.UPSTASH_REDIS_REST_URL;
  const token = env.UPSTASH_REDIS_REST_TOKEN;
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

    const results = await response.json();
    const count = results?.[0]?.result;
    return typeof count === 'number' ? count : null;
  } catch (error) {
    console.error('ratelimit unreachable', error instanceof Error ? error.message : 'unknown');
    return null;
  }
}

async function isRateLimited(clientIp, env) {
  const key = `bramwell:contact:${clientIp}`;
  const count = await durableHit(key, Math.round(RATE_LIMIT.windowMs / 1000), env);
  if (count !== null) return count > RATE_LIMIT.max;
  return memoryHit(key);
}

/**
 * Turnstile is enforced only when its secret is configured, so the form keeps
 * working on its other defences until the keys are in place. The token is
 * single-use and must be confirmed with Cloudflare, never trusted from the page.
 */
async function verifyChallenge(payload, clientIp, env) {
  const secret = env.TURNSTILE_SECRET_KEY;
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

    const result = await response.json();
    return result?.success === true;
  } catch (error) {
    console.error('turnstile unreachable', error instanceof Error ? error.message : 'unknown');
    return false;
  }
}

/** CONTACT_TO may be given as "Team <addr>"; compare the bare address. */
function isTeamInbox(inbox) {
  const bracketed = inbox.match(/<([^>]+)>/);
  return (bracketed ? bracketed[1] : inbox).trim().toLowerCase() === BCC;
}

function stamp() {
  return new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
}

function row(label, value) {
  return (
    `<tr><td style="padding:6px 16px 6px 0;color:#6b6b6b;font:600 12px/1.4 Helvetica,Arial,sans-serif;text-transform:uppercase;letter-spacing:.08em;vertical-align:top">${label}</td>` +
    `<td style="padding:6px 0;color:#292b28;font:15px/1.6 Georgia,serif">${value}</td></tr>`
  );
}

function quote(message) {
  return `<div style="margin:24px 0 0;padding:20px;background:#f5f1e8;border-left:3px solid #b69a65">
<p style="margin:0;color:#292b28;font:15px/1.7 Georgia,serif;white-space:pre-wrap">${escapeHtml(message)}</p>
</div>`;
}

function composeEmail(enquiry) {
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
function composeAcknowledgement(enquiry) {
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
<h1 style="margin:0 0 20px;color:#19352d;font:400 24px/1.25 Georgia,serif">Thank you, ${escapeHtml(firstName)}.</h1>
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

/** One Resend call. Failures are logged with Resend's own words, never echoed. */
async function sendMail(apiKey, message) {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${apiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      console.error('resend rejected', response.status, detail.slice(0, 500));
      return { ok: false, status: response.status };
    }

    return { ok: true };
  } catch (error) {
    console.error('resend unreachable', error instanceof Error ? error.message : 'unknown');
    return { ok: false, status: 0 };
  }
}

async function handleContact(request, env) {
  const url = new URL(request.url);
  if (!isAllowedOrigin(request.headers.get('origin'), url.host)) {
    return json({ ok: false, error: 'forbidden' }, 403);
  }

  const apiKey = env.RESEND_API_KEY;
  if (!apiKey) return json({ ok: false, error: 'not_configured' }, 503);

  const declaredLength = Number(request.headers.get('content-length') ?? '0');
  if (declaredLength > MAX_BODY_BYTES) return json({ ok: false, error: 'too_large' }, 413);

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json({ ok: false, error: 'invalid' }, 400);
  }
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return json({ ok: false, error: 'invalid' }, 400);
  }

  // Honeypot: accept and drop, so a bot gets no signal that it was caught.
  if (typeof payload.website === 'string' && payload.website.trim() !== '') {
    return json({ ok: true, copySent: false });
  }

  const checked = validateEnquiry(payload);
  if (!checked.ok) return json({ ok: false, error: 'invalid', fields: checked.fields }, 400);

  const clientIp = request.headers.get('cf-connecting-ip') ?? 'unknown';
  if (await isRateLimited(clientIp, env)) return json({ ok: false, error: 'rate_limited' }, 429);

  if (!(await verifyChallenge(payload, clientIp, env))) {
    return json({ ok: false, error: 'challenge_failed' }, 400);
  }

  const { enquiry } = checked;
  const from = env.CONTACT_FROM || DEFAULT_FROM;
  const inbox = env.CONTACT_TO || DEFAULT_TO;

  // If the studio inbox is the team address itself, a Bcc would deliver it twice.
  const blindCopy = isTeamInbox(inbox) ? {} : { bcc: [BCC] };

  const delivery = await sendMail(apiKey, {
    from,
    to: [inbox],
    ...blindCopy,
    reply_to: enquiry.email,
    ...composeEmail(enquiry),
  });

  if (!delivery.ok) return json({ ok: false, error: 'delivery_failed' }, 502);

  // The enquiry is safely delivered at this point; the receipt is a courtesy.
  const copy = await sendMail(apiKey, {
    from,
    to: [enquiry.email],
    reply_to: inbox,
    ...composeAcknowledgement(enquiry),
  });

  return json({ ok: true, copySent: copy.ok });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === CONTACT_PATH) {
      if (request.method === 'POST') return handleContact(request, env);
      return methodNotAllowed('POST');
    }

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return methodNotAllowed('GET, HEAD');
    }

    const response = await env.ASSETS.fetch(request);
    const contentType = response.headers.get('content-type') ?? '';
    const servedHtml = contentType.includes('text/html');

    // A file path must never be answered with the app shell: a stale chunk
    // reference should fail as a 404 rather than as HTML with a script MIME type.
    if (FILE_PATH.test(url.pathname)) {
      if (servedHtml || response.status === 404) return notFound();
      return withHeaders(response);
    }

    if (response.status !== 404) return withHeaders(response);

    // Document route: hand back the app shell.
    const shell = await env.ASSETS.fetch(
      new Request(new URL('/index.html', url), { method: request.method, headers: request.headers }),
    );
    if (shell.status >= 400) return notFound();

    return withHeaders(shell, { 'cache-control': 'public, max-age=0, must-revalidate' });
  },
};
