export type PageMeta = {
  title: string;
  description: string;
  path: string;
  index: boolean;
};

export const SITE_URL = 'https://bramwell.top';

const PAGES: Record<string, PageMeta> = {
  '/': {
    title: 'Bramwell | Intelligent Automation & Digital Solutions',
    description:
      'Bramwell helps businesses work smarter through AI receptionists, website development, intelligent automation, content planning, and creative digital solutions.',
    path: '/',
    index: true,
  },
  '/privacy': {
    title: 'Privacy Policy | Bramwell',
    description:
      'What Bramwell collects when you send an enquiry, how it is used and stored, and the rights you have over it.',
    path: '/privacy',
    index: true,
  },
  '/terms': {
    title: 'Terms of Service | Bramwell',
    description:
      'The terms that apply when you use the Bramwell website, send us an enquiry, or engage us to do work.',
    path: '/terms',
    index: true,
  },
};

export function metaFor(pathname: string): PageMeta {
  return (
    PAGES[pathname] ?? {
      title: 'Page not found | Bramwell',
      description:
        'That page is not here. Return to the Bramwell home page for our services, studio address, and enquiry form.',
      path: pathname,
      index: false,
    }
  );
}

function metaTag(key: 'name' | 'property', value: string) {
  const selector = `meta[${key}="${value}"]`;
  const existing = document.head.querySelector<HTMLMetaElement>(selector);
  if (existing) return existing;

  const created = document.createElement('meta');
  created.setAttribute(key, value);
  document.head.appendChild(created);
  return created;
}

function linkTag(rel: string) {
  const existing = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (existing) return existing;

  const created = document.createElement('link');
  created.rel = rel;
  document.head.appendChild(created);
  return created;
}

/**
 * Keep the document head in step with the page being shown. index.html holds the
 * home-page values for crawlers and for the first paint; a legal page or a 404
 * replaces them before the component renders.
 */
export function applyMeta(meta: PageMeta) {
  const url = `${SITE_URL}${meta.path}`;

  document.title = meta.title;

  metaTag('name', 'description').setAttribute('content', meta.description);
  metaTag('name', 'robots').setAttribute('content', meta.index ? 'index, follow' : 'noindex, follow');

  metaTag('property', 'og:title').setAttribute('content', meta.title);
  metaTag('property', 'og:description').setAttribute('content', meta.description);
  metaTag('property', 'og:url').setAttribute('content', url);

  metaTag('name', 'twitter:title').setAttribute('content', meta.title);
  metaTag('name', 'twitter:description').setAttribute('content', meta.description);

  linkTag('canonical').setAttribute('href', url);
}
