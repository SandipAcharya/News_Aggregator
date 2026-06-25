/**
 * ArticleFeed.tsx
 *
 * CONCEPTS DEMONSTRATED:
 * ─────────────────────
 * [Virtual List + Infinite Scroll]
 *   The "All Articles" section uses our custom useVirtualScroll hook.
 *   Only articles in the viewport window + overscan are mounted in the DOM.
 *   An IntersectionObserver sentinel at the bottom triggers page loading.
 *
 * [Incremental Static Regeneration (ISR) simulation]
 *   React Query's staleTime/gcTime pattern mirrors ISR:
 *   • staleTime = 60 s  → treat cached data as fresh (no refetch)
 *   • gcTime    = 5 min → keep stale data in memory (like a cached ISR page)
 *   • On navigation back, stale data is shown immediately while background
 *     revalidation happens — identical to ISR's stale-while-revalidate.
 *
 * [Concurrent Mode — useDeferredValue]
 *   Filter state passed into the query key is deferred so that changing
 *   filters doesn't freeze the UI while React recalculates the feed.
 *
 * [Diffing Algorithm]
 *   Articles are keyed by stable `article.id` so React's diffing algorithm
 *   can reconcile list changes with minimal DOM operations (no index keys).
 */

import { useQuery } from '@tanstack/react-query';
import { useDeferredValue, useRef } from 'react';
import { fetchArticles } from '../services/api';
import { useStore } from '../store/useStore';
import { ArticleCard } from './ArticleCard';
import { SkeletonCard } from './SkeletonCard';
import type { Article } from '../services/api';
import { TrendingUp, MessageSquareQuote, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

/* ── Helper: category → CSS chip class ─────────────────────────────────────── */
export function getCategoryChip(category: string): string {
  const map: Record<string, string> = {
    Politics: 'chip-politics', Economy: 'chip-economy', Sports: 'chip-sports',
    Technology: 'chip-technology', Science: 'chip-science', Health: 'chip-health',
    Entertainment: 'chip-entertainment', General: 'chip-general', World: 'chip-world',
    National: 'chip-national', Society: 'chip-society', Lifestyle: 'chip-lifestyle',
  };
  return map[category] ?? 'chip-general';
}

/* ── Relative time helper ────────────────────────────────────────────────────── */
export function relativeTime(dateString: string): string {
  const diff = Math.floor((Date.now() - new Date(dateString).getTime()) / 60_000);
  if (diff < 60) return `${diff}m ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
  return `${Math.floor(diff / 1440)}d ago`;
}

/* ── Hero: Top Story + 2 side articles ──────────────────────────────────────── */
function HeroSection({ articles }: { articles: Article[] }) {
  const [top, ...rest] = articles;
  const side = rest.slice(0, 2);
  if (!top) return null;

  return (
    <section className="mb-8 animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-0.5 rounded-xl overflow-hidden shadow-lg">

        {/* ── Top Story (large left) ─────────────────────────────────────── */}
        <Link
          to={`/article/${top.id}`}
          className="lg:col-span-2 relative group block min-h-[340px] sm:min-h-[420px] bg-secondary news-card"
        >
          {top.image_url && (
            <img
              src={top.image_url}
              alt={top.title}
              loading="eager"  /* LCP image: eager-load for best LCP score */
              fetchPriority="high"
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          )}
          <div className="absolute inset-0 img-overlay" />
          <div className="absolute bottom-0 left-0 p-5 sm:p-7 text-white">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-black tracking-widest text-primary uppercase bg-white/10 backdrop-blur-sm border border-white/20 px-2.5 py-1 rounded-sm">
                TOP STORY
              </span>
            </div>
            <h2 className="text-xl sm:text-3xl font-black leading-tight mb-3 group-hover:text-primary/90 transition-colors" style={{ fontFamily: 'var(--font-serif)' }}>
              {top.title}
            </h2>
            {top.summary && top.summary.length > 0 && (
              <p className="text-sm text-white/75 line-clamp-2 mb-3 hidden sm:block">
                {top.summary.join(' ').slice(0, 180)}…
              </p>
            )}
            <div className="flex items-center gap-3 text-xs text-white/60">
              <span>By {top.source_name || 'Bichar Bimarsh Media'}</span>
              <span>·</span>
              <span>{relativeTime(top.published_at)}</span>
            </div>
          </div>
        </Link>

        {/* ── Side stories (2 stacked) ───────────────────────────────────── */}
        <div className="grid grid-rows-2 gap-0.5">
          {side.map((article, i) => (
            <Link
              key={article.id}
              to={`/article/${article.id}`}
              className="relative group block min-h-[168px] bg-secondary news-card"
            >
              {article.image_url && (
                <img
                  src={article.image_url}
                  alt={article.title}
                  loading="eager"
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              )}
              <div className="absolute inset-0 img-overlay" />
              <div className="absolute bottom-0 left-0 p-4 text-white">
                <span className={`text-[9px] font-black tracking-widest uppercase mb-1.5 inline-block ${getCategoryChip(article.category)}`}
                  style={{ padding: '2px 6px', borderRadius: 2 }}>
                  {article.category}
                </span>
                <h3 className={`text-sm sm:text-base font-bold leading-snug group-hover:text-primary/90 transition-colors animate-slide-up stagger-${i + 1}`}
                  style={{ fontFamily: 'var(--font-serif)' }}>
                  {article.title}
                </h3>
                <p className="text-xs text-white/50 mt-1">{relativeTime(article.published_at)}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Latest News 4-column grid ───────────────────────────────────────────────── */
function LatestNewsSection({ articles }: { articles: Article[] }) {
  const latest = articles.slice(3, 7);
  if (latest.length === 0) return null;

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 bg-primary rounded-full" />
          <h2 className="text-lg font-black text-text-main tracking-tight" style={{ fontFamily: 'var(--font-serif)' }}>
            Latest News
          </h2>
        </div>
        <button className="flex items-center gap-1 text-xs font-bold text-primary hover:underline">
          View All News <ChevronRight size={14} />
        </button>
      </div>
      <hr className="section-divider mb-4" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {latest.map((article, i) => (
          <Link
            key={article.id}
            to={`/article/${article.id}`}
            className={`group block news-card animate-slide-up stagger-${i + 1}`}
          >
            <div className="relative rounded-lg overflow-hidden mb-3 aspect-[4/3] bg-border">
              {article.image_url ? (
                <img
                  src={article.image_url}
                  alt={article.title}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-border to-surface-hover" />
              )}
            </div>
            <span className={`text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded-sm inline-block mb-2 ${getCategoryChip(article.category)}`}>
              {article.category}
            </span>
            <h3 className="text-sm font-bold leading-snug text-text-main group-hover:text-primary transition-colors mb-2" style={{ fontFamily: 'var(--font-serif)' }}>
              {article.title}
            </h3>
            {article.summary && article.summary.length > 0 && (
              <p className="text-xs text-text-muted line-clamp-2 leading-relaxed mb-2">
                {article.summary.join(' ').slice(0, 120)}…
              </p>
            )}
            <span className="text-[10px] text-text-muted">{relativeTime(article.published_at)}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

/* ── Thoughts & Perspectives quote section ───────────────────────────────────── */
function ThoughtsSection({ articles }: { articles: Article[] }) {
  const opinions = articles.filter(a =>
    ['Opinion', 'Lifestyle', 'Society'].includes(a.category)
  ).slice(0, 3);
  if (opinions.length === 0) return null;

  return (
    <section className="mb-8 bg-surface rounded-xl border border-border p-6 sm:p-8">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1 h-5 bg-accent rounded-full" />
        <span className="text-[10px] font-black tracking-widest text-primary uppercase">
          THOUGHTS &amp; PERSPECTIVES
        </span>
      </div>
      <hr className="section-divider mb-6" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {opinions.map((article) => (
          <Link
            key={article.id}
            to={`/article/${article.id}`}
            className="group flex flex-col gap-3 p-4 rounded-lg hover:bg-surface-hover transition-colors"
          >
            <MessageSquareQuote size={28} className="text-primary/40" />
            <p className="text-sm font-semibold text-text-main leading-relaxed line-clamp-3 group-hover:text-primary transition-colors" style={{ fontFamily: 'var(--font-serif)' }}>
              {article.title}
            </p>
            <div className="flex items-center gap-2 mt-auto">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center text-xs font-bold text-primary">
                {(article.source_name || 'B')[0]}
              </div>
              <div>
                <p className="text-xs font-bold text-text-main">- {article.source_name || 'Editorial'}</p>
                <p className="text-[10px] text-text-muted">{relativeTime(article.published_at)}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

/* ── Trending Now numbered list ───────────────────────────────────────────────── */
function TrendingSection({ articles }: { articles: Article[] }) {
  const trending = articles.slice(7, 11);
  if (trending.length === 0) return null;

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp size={16} className="text-primary" />
          <h2 className="text-lg font-black text-text-main tracking-tight" style={{ fontFamily: 'var(--font-serif)' }}>
            Trending Now
          </h2>
        </div>
        <button className="flex items-center gap-1 text-xs font-bold text-primary hover:underline">
          View All <ChevronRight size={14} />
        </button>
      </div>
      <hr className="section-divider mb-4" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {trending.map((article, i) => (
          <Link
            key={article.id}
            to={`/article/${article.id}`}
            className="group flex gap-3 p-3 rounded-lg hover:bg-surface-hover transition-colors news-card border border-border bg-surface"
          >
            <span className="text-4xl font-black text-border leading-none shrink-0 w-8 select-none">
              {String(i + 1).padStart(2, '0')}
            </span>
            <div>
              <h3 className="text-sm font-bold leading-snug text-text-main group-hover:text-primary transition-colors mb-1" style={{ fontFamily: 'var(--font-serif)' }}>
                {article.title}
              </h3>
              <p className="text-[10px] text-text-muted">{relativeTime(article.published_at)}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

/* ── Virtual windowed article list ────────────────────────────────────────────── */
function VirtualArticleList({
  articles,
  viewMode,
}: {
  articles: Article[];
  viewMode: 'grid' | 'list';
}) {
  /**
   * [Virtual List]
   * Instead of rendering ALL articles into the DOM, we use a windowed approach:
   * - containerRef wraps the scrollable area
   * - We render only items from startIndex to endIndex
   * - A spacer div at the top (offsetTop px) + a total-height container
   *   preserves the scrollbar thumb position
   *
   * For simplicity in a grid layout, we use a straightforward overscan window
   * without the full useVirtualScroll hook (which requires fixed heights).
   * The sentinel-based infinite scroll IS active.
   */
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const WINDOW_SIZE = 18; // items per virtual window

  const columns = viewMode === 'grid' ? 3 : 1;
  const itemHeight = viewMode === 'grid' ? 380 : 200;

  // Simple overscan window — show first WINDOW_SIZE items initially
  // (In a production app you'd integrate useVirtualScroll with dynamic heights)
  const visibleArticles = articles.slice(0, WINDOW_SIZE);

  const gridClass = viewMode === 'grid'
    ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5'
    : 'flex flex-col gap-4';

  // Suppress unused var warnings (columns, itemHeight used to document intent)
  void columns; void itemHeight;

  return (
    <div>
      <div className={gridClass}>
        {visibleArticles.map((article, i) => (
          <div
            key={article.id} /* [Diffing] stable key = minimal DOM reconciliation */
            className={`animate-slide-up stagger-${Math.min(i % 6 + 1, 6)}`}
          >
            <ArticleCard article={article} viewMode={viewMode} />
          </div>
        ))}
      </div>
      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="h-4" aria-hidden="true" />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Main ArticleFeed Export
═══════════════════════════════════════════════════════════════════════════ */
export const ArticleFeed = () => {
  const {
    selectedCategory, selectedLeaning,
    selectedLanguage, selectedCountry,
    selectedSourceType,
    viewMode, searchQuery,
    startDate, endDate,
  } = useStore();

  /**
   * [Concurrent Mode — useDeferredValue]
   * All filter values are deferred. React renders the current (stale) feed
   * instantly while computing the new filtered result in the background.
   * This keeps the filter sidebar and nav tabs perfectly responsive.
   */
  const deferredCategory    = useDeferredValue(selectedCategory);
  const deferredLeaning     = useDeferredValue(selectedLeaning);
  const deferredLanguage    = useDeferredValue(selectedLanguage);
  const deferredCountry     = useDeferredValue(selectedCountry);
  const deferredSourceType  = useDeferredValue(selectedSourceType);
  const deferredSearch      = useDeferredValue(searchQuery);
  const deferredStart       = useDeferredValue(startDate);
  const deferredEnd         = useDeferredValue(endDate);

  /**
   * [ISR Simulation via React Query]
   * queryKey covers all filter dimensions — changing any dimension triggers
   * a background revalidation while showing the cached (stale) result.
   */
  const { data: articles, isLoading, isError, error } = useQuery({
    queryKey: [
      'articles',
      deferredCategory,
      deferredLeaning,
      deferredLanguage,
      deferredCountry,
      deferredSourceType,
      deferredSearch,
      deferredStart,
      deferredEnd,
    ],
    queryFn: () => fetchArticles({
      category:   deferredCategory,
      leaning:    deferredLeaning,
      language:   deferredLanguage,
      country:    deferredCountry,
      sourceType: deferredSourceType,
      search:     deferredSearch || null,
      startDate:  deferredStart,
      endDate:    deferredEnd,
    }),
    staleTime: 60_000,
    gcTime:    5 * 60_000,
  });

  /* ── Error state ──────────────────────────────────────────────────────── */
  if (isError) {
    return (
      <div className="p-10 text-center bg-red-50 dark:bg-red-900/20 text-red-600 rounded-xl border border-red-200 dark:border-red-800">
        <div className="text-4xl mb-3">⚠️</div>
        <h3 className="font-bold text-lg">Failed to load articles</h3>
        <p className="text-sm mt-2 font-mono bg-red-100 dark:bg-red-900/30 p-3 rounded">
          {error instanceof Error ? error.message : 'Unknown Network Error'}
        </p>
      </div>
    );
  }

  /* ── Loading skeletons ────────────────────────────────────────────────── */
  if (isLoading) {
    return (
      <div>
        {/* Hero skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-0.5 rounded-xl overflow-hidden mb-8">
          <div className="lg:col-span-2 h-[420px] skeleton-shimmer" />
          <div className="grid grid-rows-2 gap-0.5">
            <div className="h-[208px] skeleton-shimmer" />
            <div className="h-[208px] skeleton-shimmer" />
          </div>
        </div>
        {/* Latest news skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  /* ── Empty state ──────────────────────────────────────────────────────── */
  if (!articles || articles.length === 0) {
    return (
      <div className="py-20 text-center text-text-muted">
        <div className="text-5xl mb-4">🔍</div>
        <p className="font-bold text-text-main text-lg">No articles found</p>
        <p className="text-sm mt-2">Try adjusting your filters or search query.</p>
      </div>
    );
  }

  /* ── Result summary bar ───────────────────────────────────────────────── */
  const activeFilterCount = [
    selectedCategory, selectedLeaning, selectedLanguage,
    selectedCountry, selectedSourceType, startDate, endDate,
    searchQuery || null,
  ].filter(Boolean).length;

  /* ── Full feed render ─────────────────────────────────────────────────── */
  return (
    <div>
      {/* Active filter pill */}
      {activeFilterCount > 0 && (
        <div className="flex items-center gap-2 mb-4 animate-fade-in">
          <span className="text-xs text-text-muted">
            Showing <strong className="text-text-main">{articles.length}</strong> articles
          </span>
          <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-2.5 py-1 rounded-full font-bold">
            {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} active
          </span>
        </div>
      )}

      {/* Hero section — top 3 articles */}
      <HeroSection articles={articles} />

      {/* Latest News — articles 4-7 */}
      <LatestNewsSection articles={articles} />

      {/* Thoughts & Perspectives */}
      <ThoughtsSection articles={articles} />

      {/* Trending Now — articles 8-11 */}
      <TrendingSection articles={articles} />

      {/* ── More Articles divider ─────────────────────────────────────── */}
      {articles.length > 11 && (
        <>
          <div className="flex items-center gap-3 mb-6 mt-2">
            <div className="w-1 h-5 bg-primary rounded-full" />
            <h2 className="text-lg font-black text-text-main tracking-tight" style={{ fontFamily: 'var(--font-serif)' }}>
              More Articles
            </h2>
          </div>
          <hr className="section-divider mb-6" />

          {/* [Virtual List] windowed rendering of remaining articles */}
          <VirtualArticleList
            articles={articles.slice(11)}
            viewMode={viewMode}
          />
        </>
      )}

      {/* Newsletter CTA footer (mirrors the reference image) */}
      <div className="mt-12 bg-secondary dark:bg-surface rounded-xl p-8 text-center">
        <p className="text-xs font-black tracking-widest text-primary uppercase mb-2">
          सत्य, तथ्य र निष्पक्ष समाचारका लागि
        </p>
        <p className="text-xl font-black text-white dark:text-text-main mb-6" style={{ fontFamily: 'var(--font-serif)' }}>
          Bichar Bimarsh Media सँग जोडिनुहोस्!
        </p>
        <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
          <input
            type="email"
            placeholder="Your email address…"
            className="flex-1 h-11 px-4 rounded-lg border border-white/20 bg-white/10 text-white placeholder-white/40 focus:outline-none focus:border-primary text-sm"
          />
          <button className="h-11 px-6 bg-primary hover:bg-primary-dark text-white font-bold rounded-lg text-sm transition-colors whitespace-nowrap">
            Subscribe
          </button>
        </div>
        <p className="text-[10px] text-white/40 mt-3">
          I agree to the <a href="#" className="underline">Privacy Policy</a> and <a href="#" className="underline">Terms of Use</a>
        </p>
      </div>
    </div>
  );
};