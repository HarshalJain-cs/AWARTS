import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  ogType?: string;
  ogImage?: string;
  noindex?: boolean;
  jsonLd?: object | object[];
}

const SITE_NAME = 'AWARTS';
const DEFAULT_TITLE = 'AWARTS — Strava for AI Coding | Track Claude, Codex, Gemini & Antigravity Sessions';
const DEFAULT_DESCRIPTION =
  'AWARTS is the Strava for AI coding. Track your AI coding sessions across Claude, Codex, Gemini & Antigravity. Compete on leaderboards, share sessions, maintain streaks. Free, open source CLI — no API keys needed.';
const DEFAULT_OG_IMAGE = 'https://awarts.vercel.app/og-image.png';
const BASE_URL = 'https://awarts.vercel.app';

export function SEO({
  title,
  description = DEFAULT_DESCRIPTION,
  keywords,
  canonical,
  ogType = 'website',
  ogImage = DEFAULT_OG_IMAGE,
  noindex = false,
  jsonLd,
}: SEOProps) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : DEFAULT_TITLE;
  const canonicalUrl = canonical ? `${BASE_URL}${canonical}` : undefined;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
      <meta property="og:site_name" content={SITE_NAME} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {jsonLd &&
        (Array.isArray(jsonLd)
          ? jsonLd.map((ld, i) => (
              <script key={i} type="application/ld+json">
                {JSON.stringify(ld)}
              </script>
            ))
          : (
              <script type="application/ld+json">
                {JSON.stringify(jsonLd)}
              </script>
            ))}
    </Helmet>
  );
}
