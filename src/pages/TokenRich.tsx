import { AppShell } from '@/components/layout/AppShell';
import { SEO } from '@/components/SEO';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { Zap, ExternalLink, Quote } from 'lucide-react';

export default function TokenRich() {
  const companies = useQuery(api.tokenRich.getCompanies);

  return (
    <AppShell>
      <SEO
        title="The Prometheus List — Token-Rich Companies"
        description="A curated directory of companies that give their engineers unlimited or high AI token budgets. See who's going all-in on AI-assisted development."
        canonical="/token-rich"
        keywords="token rich companies, unlimited AI tokens, AI budget, Claude unlimited, engineering AI spend, NVIDIA AI, Shopify AI"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          "name": "The Prometheus List - Token-Rich Companies",
          "description": "Companies providing unlimited AI token budgets to engineers",
          "url": "https://awarts.club/token-rich",
        }}
      />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-3xl mx-auto space-y-8"
      >
        {/* Header */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Zap className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">The Prometheus List</h1>
          </div>
          <p className="text-sm text-muted-foreground max-w-xl">
            Companies that give their engineers <strong className="text-foreground">unlimited AI token budgets</strong>.
            These organizations understand that the cost of tokens is nothing compared to the velocity they unlock.
          </p>
        </div>

        {/* Companies list */}
        {!companies ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-lg" />
            ))}
          </div>
        ) : companies.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-lg font-medium">No companies listed yet</p>
            <p className="text-sm mt-1">Check back soon!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {companies.map((company, i) => (
              <motion.article
                key={company._id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
                className="rounded-lg border border-border bg-card p-5 space-y-3 hover:border-primary/20 hover:shadow-sm transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{company.logoEmoji ?? '🏢'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="font-semibold text-foreground">{company.name}</h2>
                      <a
                        href={company.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </div>
                  <span className="shrink-0 text-xs text-primary font-medium bg-primary/10 rounded-full px-2.5 py-0.5">
                    #{i + 1}
                  </span>
                </div>

                <div className="flex gap-2">
                  <Quote className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground italic leading-relaxed">
                    "{company.quote}"
                  </p>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span>Source:</span>
                  <a
                    href={company.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline font-medium"
                  >
                    {company.sourceLabel}
                  </a>
                </div>
              </motion.article>
            ))}
          </div>
        )}

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="rounded-lg border border-dashed border-border bg-muted/20 p-5 text-center space-y-2"
        >
          <p className="text-sm font-medium text-foreground">Is your company token-rich?</p>
          <p className="text-xs text-muted-foreground">
            Submit it via{' '}
            <a
              href="https://github.com/HarshalJain-cs/AWARTS/issues/new?title=Prometheus+List+Submission&labels=prometheus-list"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              GitHub Issue
            </a>{' '}
            with a source link and quote from the company.
          </p>
        </motion.div>
      </motion.div>
    </AppShell>
  );
}
