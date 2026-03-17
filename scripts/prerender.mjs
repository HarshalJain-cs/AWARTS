/**
 * Post-build prerender script.
 *
 * Generates route-specific HTML files from dist/index.html so that crawlers
 * receive correct <title>, <meta description>, OG tags, and canonical URLs
 * without needing to execute JavaScript.
 *
 * Usage: node scripts/prerender.mjs  (run after `vite build`)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.resolve(__dirname, '..', 'dist');
const BASE_URL = 'https://awarts.vercel.app';

// Route-specific meta data
const ROUTES = [
  {
    output: 'docs.html',
    title: 'Documentation — Getting Started, CLI, API | AWARTS',
    description:
      'Complete AWARTS documentation: installation, CLI reference, API docs, provider setup, achievements, keyboard shortcuts, and troubleshooting.',
    canonical: '/docs',
    keywords:
      'AWARTS docs, CLI reference, API documentation, AI coding tracker setup, Claude CLI, Codex CLI, Gemini CLI',
    // Strip landing-specific JSON-LD: FAQPage, HowTo (keep WebApplication, Organization, BreadcrumbList)
    stripJsonLdTypes: ['FAQPage', 'HowTo'],
  },
  {
    output: 'leaderboard.html',
    title: 'Leaderboard — Top AI Coders | AWARTS',
    description:
      'See who\'s writing the most AI-assisted code. Global leaderboard ranked by output tokens across Claude, Codex, Gemini, and Antigravity.',
    canonical: '/leaderboard',
    keywords:
      'AI coding leaderboard, top developers, Claude leaderboard, Codex ranking, developer competition, coding leaderboard',
    stripJsonLdTypes: ['FAQPage', 'HowTo'],
    // Add route-specific JSON-LD
    addJsonLd: {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'AI Coding Leaderboard',
      description: 'Top AI-assisted developers ranked by usage across Claude, Codex, Gemini, and Antigravity.',
      url: `${BASE_URL}/leaderboard`,
    },
  },
  {
    output: 'feed.html',
    title: 'Feed — Latest AI Coding Sessions | AWARTS',
    description:
      'Explore the latest AI coding sessions from developers worldwide. See who\'s coding with Claude, Codex, Gemini, and Antigravity today.',
    canonical: '/feed',
    keywords:
      'AI coding feed, developer activity, coding sessions, Claude sessions, Codex sessions, AI coding social',
    stripJsonLdTypes: ['FAQPage', 'HowTo'],
  },
  {
    output: 'search.html',
    title: 'Search Developers | AWARTS',
    description:
      'Find AI-assisted developers by username, provider, or country. Discover who\'s coding with Claude, Codex, Gemini, and Antigravity.',
    canonical: '/search',
    keywords:
      'search developers, find AI coders, developer directory, coding community',
    stripJsonLdTypes: ['FAQPage', 'HowTo'],
  },
];

function replaceMetaTag(html, name, content, attr = 'name') {
  // Replace <meta name="X" content="..."> or <meta property="X" content="...">
  const regex = new RegExp(
    `(<meta\\s+${attr}="${name}"\\s+content=")([^"]*)(")`,
    'i'
  );
  return html.replace(regex, `$1${escapeHtml(content)}$3`);
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function stripJsonLdBlocks(html, typesToStrip) {
  if (!typesToStrip || typesToStrip.length === 0) return html;

  // Match all <script type="application/ld+json">...</script> blocks
  const regex = /<script\s+type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/gi;

  return html.replace(regex, (match, jsonContent) => {
    try {
      const data = JSON.parse(jsonContent);
      const type = Array.isArray(data['@type']) ? data['@type'] : [data['@type']];
      if (type.some((t) => typesToStrip.includes(t))) {
        return ''; // Remove this block
      }
    } catch {
      // Not valid JSON — keep it
    }
    return match;
  });
}

function addJsonLdBlock(html, jsonLd) {
  if (!jsonLd) return html;
  const block = `\n    <script type="application/ld+json">\n    ${JSON.stringify(jsonLd, null, 2).replace(/\n/g, '\n    ')}\n    </script>`;
  // Insert before </head>
  return html.replace('</head>', `${block}\n  </head>`);
}

// ── Main ────────────────────────────────────────────────────────────────

const indexPath = path.join(DIST, 'index.html');
if (!fs.existsSync(indexPath)) {
  console.error('dist/index.html not found — run vite build first');
  process.exit(1);
}

const template = fs.readFileSync(indexPath, 'utf-8');
let generated = 0;

for (const route of ROUTES) {
  let html = template;

  // 1. Replace <title>
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(route.title)}</title>`);

  // 2. Replace meta name="title"
  html = replaceMetaTag(html, 'title', route.title);

  // 3. Replace meta name="description"
  html = replaceMetaTag(html, 'description', route.description);

  // 4. Replace keywords if provided
  if (route.keywords) {
    html = replaceMetaTag(html, 'keywords', route.keywords);
  }

  // 5. Replace canonical URL
  html = html.replace(
    /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/,
    `<link rel="canonical" href="${BASE_URL}${route.canonical}" />`
  );

  // 6. Replace OG tags
  html = replaceMetaTag(html, 'og:title', route.title, 'property');
  html = replaceMetaTag(html, 'og:description', route.description, 'property');
  html = replaceMetaTag(html, 'og:url', `${BASE_URL}${route.canonical}`, 'property');

  // 7. Replace Twitter tags
  html = replaceMetaTag(html, 'twitter:title', route.title);
  html = replaceMetaTag(html, 'twitter:description', route.description);
  html = replaceMetaTag(html, 'twitter:url', `${BASE_URL}${route.canonical}`);

  // 8. Strip landing-page-specific JSON-LD
  html = stripJsonLdBlocks(html, route.stripJsonLdTypes);

  // 9. Add route-specific JSON-LD
  html = addJsonLdBlock(html, route.addJsonLd);

  // 10. Write output
  const outPath = path.join(DIST, route.output);
  fs.writeFileSync(outPath, html, 'utf-8');
  generated++;
  console.log(`  prerender: ${route.output} (${route.canonical})`);
}

console.log(`Prerendered ${generated} route(s)`);
