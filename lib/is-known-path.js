// ponytail: manual list tied to the site's actual top-level directories (see repo root).
// Update when a new top-level page ships. Keeps vulnerability-scanner probes
// (/.env, /wp-includes/.., /console/, /telescope/requests, ...) out of the
// page-view counter without trying to generically detect "is this a scanner".
const KNOWN_TOP_LEVEL_PATHS = [
  "about",
  "edu",
  "education",
  "faq",
  "portfolio",
  "privacy",
  "products",
  "services",
  "terms",
  // not pages, but real files we deliberately track AI-crawler-readiness access to
  "robots.txt",
  "sitemap.xml",
  "llms.txt",
];

export function isKnownPath(pathname) {
  if (pathname === "/") return true;
  const first = pathname.replace(/^\/+/, "").split("/")[0];
  return KNOWN_TOP_LEVEL_PATHS.includes(first);
}
