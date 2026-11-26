import { useEffect, useState } from 'react';

/** `/privacy/` and `/privacy` are the same page. */
function normalise(pathname: string) {
  if (pathname.length > 1 && pathname.endsWith('/')) return pathname.replace(/\/+$/, '');
  return pathname;
}

/**
 * The site is a static build with no router, so the path is read from the
 * document once and kept in step with back/forward. Moving between pages is a
 * normal navigation; Vercel rewrites /privacy and /terms to the app shell.
 */
export function usePathname() {
  const [pathname, setPathname] = useState(() => normalise(window.location.pathname));

  useEffect(() => {
    const sync = () => setPathname(normalise(window.location.pathname));
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, []);

  return pathname;
}
