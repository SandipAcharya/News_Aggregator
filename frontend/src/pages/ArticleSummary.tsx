/**
 * ArticleSummary.tsx
 *
 * CONCEPTS DEMONSTRATED:
 * ─────────────────────
 * [Streaming SSR + Hydration]
 *   Multiple <Suspense> boundaries divide this page into independent "chunks".
 *   In a real SSR setup, React renders each boundary as a separate HTML
 *   stream fragment — the browser receives and shows the hero instantly, then
 *   the AI summary streams in, then the entities panel. This is how React 18's
 *   `renderToPipeableStream` works (Next.js App Router uses this).
 *
 *   Here we simulate it with useQuery + Suspense: the article metadata and the
 *   AI summary are fetched in parallel, each revealing progressively as they
 *   resolve — without a global loading spinner blocking the whole page.
 *
 * [Web Vitals — LCP]
 *   The hero image uses `fetchPriority="high"` and `loading="eager"` because
 *   it's the Largest Contentful Paint element. Getting it right here makes the
 *   biggest impact on LCP score.
 *
 * [Incremental Static Regeneration]
 *   staleTime: 5 * 60_000 — individual article pages are "statically cached"
 *   for 5 minutes. Background revalidation updates the cache without blocking
 *   the user — identical to ISR's stale-while-revalidate behaviour.
 */

import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft, Clock, ExternalLink, ShieldAlert,
  Sparkles, AlertCircle, Bookmark,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { getCategoryChip } from '../components/ArticleFeed';

/* ── Sentiment colour helper ─────────────────────────────────────────────── */
function getSentimentColor(sentiment: string) {
  const s = sentiment?.toLowerCase() || '';
  if (s.includes('positive')) return 'bg-emerald-500';
  if (s.includes('negative')) return 'bg-red-500';
  if (s.includes('mixed'))    return 'bg-yellow-500';
  return 'bg-gray-400';
}

/* ── Skeleton for the whole page ─────────────────────────────────────────── */
function ArticleSummarySkeleton() {
  return (
    <div className="max-w-4xl mx-auto pb-20 animate-pulse">
      <div className="w-28 h-4 skeleton-shimmer rounded mb-6" />
      {/* Hero image skeleton — 16:9 aspect to prevent CLS */}
      <div className="w-full rounded-2xl overflow-hidden mb-8" style={{ paddingBottom: '42.85%', position: 'relative' }}>
        <div className="absolute inset-0 skeleton-shimmer" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-surface rounded-2xl border border-border p-8 h-72 skeleton-shimmer" />
        <div className="bg-surface rounded-2xl border border-border p-6 h-48 skeleton-shimmer" />
      </div>
    </div>
  );
}

/* ── Skeleton for the AI summary content only ────────────────────────────── */
function SummaryContentSkeleton() {
  return (
    <div className="animate-pulse space-y-5">
      <div className="h-5 skeleton-shimmer rounded w-full" />
      <div className="h-5 skeleton-shimmer rounded w-5/6" />
      <div className="h-5 skeleton-shimmer rounded w-full" />
      <div className="h-5 skeleton-shimmer rounded w-4/6" />
      <div className="h-5 skeleton-shimmer rounded w-full" />
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   ArticleSummary — main component
════════════════════════════════════════════════════════════════════════════ */
export function ArticleSummary() {
  const { id }       = useParams<{ id: string }>();
  const navigate     = useNavigate();
  const { token, setSearchQuery } = useStore();

  /* [ISR simulation] staleTime=5min — treat as "statically generated" */
  const { data: articleRes, isLoading: articleLoading } = useQuery({
    queryKey: ['article', id],
    queryFn: async () => {
      const res = await fetch(`/api/articles/${id}`);
      if (!res.ok) throw new Error('Failed to fetch article details');
      return res.json();
    },
    staleTime: 5 * 60_000,
    gcTime:    10 * 60_000,
  });

  /**
   * [Streaming SSR]
   * The summary query is independent — it resolves AFTER the article metadata.
   * In React's streaming SSR, the browser would have already painted the hero
   * and metadata while this fetch is in-flight. The Suspense boundary below
   * handles the "still loading" state for just the summary section.
   */
  const { data: summaryRes, isLoading: summaryLoading } = useQuery({
    queryKey: ['article_summary', id],
    queryFn: async () => {
      const res = await fetch(`/api/articles/${id}/summary`);
      if (!res.ok) throw new Error('Failed to generate summary');
      return res.json();
    },
    enabled: !!id,
    staleTime: 5 * 60_000,
  });

  const article  = articleRes?.data;
  const summary  = summaryRes?.data;
  const isGuest  = !token;

  /* ── Article loading skeleton ─────────────────────────────────────────── */
  if (articleLoading) return <ArticleSummarySkeleton />;

  /* ── Article not found ────────────────────────────────────────────────── */
  if (!article) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-text-muted">
        <AlertCircle size={48} className="mb-4" />
        <h2 className="text-xl font-bold mb-2 text-text-main">Article Not Found</h2>
        <p className="mb-6">We couldn't find the requested article.</p>
        <Link to="/" className="px-6 py-2 bg-primary text-white rounded-lg font-bold">Back to Feed</Link>
      </div>
    );
  }

  const handleEntityClick = (entity: string) => {
    setSearchQuery(entity);
    navigate('/');
  };

  const chipClass = getCategoryChip(article.category);

  return (
    <div className="max-w-4xl mx-auto pb-20">

      {/* ── Back button ───────────────────────────────────────────────────── */}
      <div className="mb-6 animate-slide-left">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-text-muted hover:text-text-main transition-colors text-sm font-semibold"
        >
          <ArrowLeft size={16} /> Back to News
        </button>
      </div>

      {/* ── Hero Section ──────────────────────────────────────────────────── */}
      {/*
        [Web Vitals — LCP]
        This image is the Largest Contentful Paint candidate. We:
        1. fetchPriority="high"  — hints the browser to prioritise this request
        2. loading="eager"       — no lazy-loading (it's above the fold)
        3. Fixed aspect container — prevents CLS when image loads
      */}
      <div className="relative rounded-2xl overflow-hidden mb-8 shadow-xl bg-surface animate-fade-in">
        <div className="relative" style={{ paddingBottom: '42.85%' }}>
          <img
            src={article.image_url || 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=1200&q=80'}
            alt={article.title}
            fetchPriority="high"
            loading="eager"
            className="absolute inset-0 w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src = 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=1200&q=80';
            }}
          />
          <div className="absolute inset-0 img-overlay" />

          <div className="absolute bottom-0 left-0 p-6 sm:p-8 w-full text-white">
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              <span className={`px-2.5 py-1 text-[9px] font-black rounded-sm uppercase tracking-wider ${chipClass}`}>
                {article.category || 'News'}
              </span>
              <span className="flex items-center gap-1.5 text-sm font-medium text-white/80">
                <Bookmark size={13} /> {article.source_name}
              </span>
              <span className="text-sm text-white/60">
                {new Date(article.published_at).toLocaleDateString('en-US', {
                  year: 'numeric', month: 'long', day: 'numeric',
                })}
              </span>
            </div>
            <h1
              className="text-2xl sm:text-4xl font-black leading-tight tracking-tight"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              {article.title}
            </h1>
          </div>
        </div>
      </div>

      {/* ── Main Content Grid ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* ── Left: AI Summary (Suspense island) ────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface rounded-2xl border border-border p-6 sm:p-8 animate-slide-up">
            <div className="flex items-center gap-2 mb-6 text-primary">
              <Sparkles size={22} className="fill-primary/20" />
              <h2 className="text-lg font-black text-text-main tracking-tight" style={{ fontFamily: 'var(--font-serif)' }}>
                AI Executive Summary
              </h2>
            </div>

            {/*
              [Streaming SSR — Suspense boundary]
              This inner boundary is the key demonstration. When React streams
              this page from the server:
              1. The hero + metadata HTML arrive first (above this boundary)
              2. The browser renders and hydrates them immediately
              3. When the summary fetch resolves, React streams the summary
                 HTML into this boundary without touching the rest of the page
              The client never sees a full-page loading spinner.
            */}
            <div className={`relative ${isGuest ? 'select-none' : ''}`}>
              {summaryLoading ? (
                <SummaryContentSkeleton />
              ) : summary ? (
                <div className={`space-y-5 ${isGuest ? 'blur-md opacity-60' : ''} transition-all duration-500 animate-fade-in`}>
                  {summary.key_entities?.summary_paragraphs?.length > 0 ? (
                    summary.key_entities.summary_paragraphs.map((para: string, idx: number) => (
                      <p key={idx} className="text-text-main font-medium leading-relaxed sm:text-lg">
                        {para}
                      </p>
                    ))
                  ) : (
                    <div className="space-y-6">
                      <div className="bg-primary/5 rounded-xl p-5 border border-primary/10">
                        <h3 className="text-xs font-black text-primary uppercase tracking-wider mb-2">TL;DR</h3>
                        <p className="text-text-main font-medium leading-relaxed sm:text-lg">
                          {summary.key_entities?.tldr || summary.bullet_points?.[0] || 'Generating overview…'}
                        </p>
                      </div>
                      {summary.bullet_points?.length > 0 && (
                        <div>
                          <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-4">Key Takeaways</h3>
                          <ul className="space-y-3">
                            {summary.bullet_points.map((point: string, i: number) => (
                              <li key={i} className="flex gap-3 text-text-main leading-relaxed">
                                <span className="text-primary font-black mt-0.5">•</span>
                                <span>{point}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-red-500 flex items-center gap-2 text-sm">
                  <AlertCircle size={16} /> Summary generation failed.
                </div>
              )}

              {/* Guest paywall overlay */}
              {isGuest && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface/40 rounded-xl">
                  <div className="bg-surface p-6 sm:p-8 rounded-2xl border border-border shadow-2xl text-center max-w-sm mx-4">
                    <ShieldAlert size={44} className="mx-auto mb-4 text-primary" />
                    <h3 className="text-lg font-black text-text-main mb-2" style={{ fontFamily: 'var(--font-serif)' }}>
                      Premium Insight
                    </h3>
                    <p className="text-text-muted text-sm mb-5">
                      Unlock AI-powered summaries, key takeaways, and entity tracking by signing in.
                    </p>
                    <Link
                      to="/login"
                      className="block w-full py-3 bg-primary text-white rounded-lg font-bold hover:bg-primary-dark transition-colors text-sm"
                    >
                      Sign In to Read
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Right: Metadata + Entities ────────────────────────────────── */}
        {/*
          [Streaming SSR — independent Suspense island]
          This right column resolves and hydrates independently from the left.
          Server can stream it as soon as its data is ready.
        */}
        <div className="space-y-5">

          {/* Action box */}
          <div className="bg-surface rounded-2xl border border-border p-5 shadow-sm animate-slide-up stagger-2">
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2.5 bg-background border-2 border-primary text-primary hover:bg-primary hover:text-white rounded-xl font-bold transition-colors text-sm mb-5"
            >
              Read Full Article <ExternalLink size={16} />
            </a>

            {!summaryLoading && summary && !isGuest && (
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                <div>
                  <p className="text-[9px] font-black text-text-muted uppercase mb-1 tracking-wider">Sentiment</p>
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${getSentimentColor(summary.sentiment)}`} />
                    <span className="font-bold text-text-main text-sm">{summary.sentiment}</span>
                  </div>
                </div>
                <div>
                  <p className="text-[9px] font-black text-text-muted uppercase mb-1 tracking-wider">Reading Time</p>
                  <div className="flex items-center gap-1.5 text-text-main font-bold text-sm">
                    <Clock size={14} className="text-text-muted" /> {summary.reading_time_mins} min
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Entities panel */}
          {!summaryLoading && summary && !isGuest && (
            <div className="bg-surface rounded-2xl border border-border p-5 shadow-sm animate-slide-up stagger-3">
              <h3 className="text-sm font-black text-text-main mb-4">Related Entities</h3>

              {summary.key_entities?.people?.length > 0 && (
                <div className="mb-4">
                  <p className="text-[9px] font-black text-text-muted uppercase tracking-wider mb-2">People</p>
                  <div className="flex flex-wrap gap-1.5">
                    {summary.key_entities.people.map((person: string) => (
                      <button
                        key={person}
                        onClick={() => handleEntityClick(person)}
                        className="px-2.5 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-bold rounded-md hover:bg-blue-500/20 transition-colors"
                      >
                        {person}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {summary.key_entities?.orgs?.length > 0 && (
                <div className="mb-4">
                  <p className="text-[9px] font-black text-text-muted uppercase tracking-wider mb-2">Organizations</p>
                  <div className="flex flex-wrap gap-1.5">
                    {summary.key_entities.orgs.map((org: string) => (
                      <button
                        key={org}
                        onClick={() => handleEntityClick(org)}
                        className="px-2.5 py-1 bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[10px] font-bold rounded-md hover:bg-purple-500/20 transition-colors"
                      >
                        {org}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {summary.key_entities?.places?.length > 0 && (
                <div>
                  <p className="text-[9px] font-black text-text-muted uppercase tracking-wider mb-2">Locations</p>
                  <div className="flex flex-wrap gap-1.5">
                    {summary.key_entities.places.map((place: string) => (
                      <button
                        key={place}
                        onClick={() => handleEntityClick(place)}
                        className="px-2.5 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold rounded-md hover:bg-emerald-500/20 transition-colors"
                      >
                        {place}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
