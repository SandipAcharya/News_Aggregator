/**
 * ArticleCard.tsx
 *
 * CONCEPTS DEMONSTRATED:
 * ─────────────────────
 * [Diffing Algorithm]
 *   React's diffing algorithm (reconciler) compares previous and next Virtual
 *   DOM trees to compute the minimal set of DOM mutations. Two optimisations:
 *
 *   1. React.memo() with a custom areEqual() comparator: skips re-rendering
 *      entirely when none of the relevant props have changed. The reconciler
 *      never needs to diff the child subtree if the parent re-renders for an
 *      unrelated reason.
 *
 *   2. Stable `key` prop (article.id) in the parent list so React can match
 *      existing DOM nodes to new array positions without destroying/recreating
 *      them — O(n) instead of O(n²) reconciliation.
 *
 * [Web Vitals — LCP & CLS]
 *   • `loading="lazy"` on non-hero images defers offscreen image requests,
 *     freeing bandwidth for the hero image (LCP element).
 *   • The image container has a fixed aspect ratio so the card never changes
 *     height when the image loads — eliminates Cumulative Layout Shift (CLS).
 */

import React, { memo } from 'react';
import type { Article } from '../services/api';
import { ArrowRight, ImageOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getCategoryChip, relativeTime } from './ArticleFeed';

interface Props {
  article: Article;
  viewMode: 'grid' | 'list';
}

/* ── Strip HTML tags (safety net for older DB records) ──────────────────────── */
const stripHtml = (text: string) => text?.replace(/<[^>]*>/g, '').trim() ?? '';

/* ── Category → gradient fallback when no image ─────────────────────────────── */
const categoryGradient: Record<string, string> = {
  Technology:    'from-blue-900 to-slate-800',
  Politics:      'from-red-900 to-slate-800',
  Sports:        'from-green-900 to-slate-800',
  Business:      'from-yellow-900 to-slate-800',
  Entertainment: 'from-purple-900 to-slate-800',
  Science:       'from-teal-900 to-slate-800',
  Health:        'from-pink-900 to-slate-800',
  General:       'from-slate-700 to-slate-900',
};

/* ─────────────────────────────────────────────────────────────────────────────
   ArticleCard component
   Wrapped in React.memo with a custom comparator (areEqual) to demonstrate
   the Diffing Algorithm concept — we control exactly when a re-render happens.
───────────────────────────────────────────────────────────────────────────── */
const ArticleCardInner: React.FC<Props> = ({ article, viewMode }) => {
  const isList   = viewMode === 'list';
  const gradient = categoryGradient[article.category] ?? 'from-slate-700 to-slate-900';
  const chipClass = getCategoryChip(article.category);

  return (
    <Link
      to={`/article/${article.id}`}
      className={`
        group block bg-surface rounded-xl overflow-hidden border border-border news-card
        ${isList ? 'flex flex-row' : 'flex flex-col h-full'}
      `}
    >
      {/* ── Image / Fallback ─────────────────────────────────────────────── */}
      {/*
        [Web Vitals — CLS prevention]
        The padding-bottom trick (aspect-ratio) reserves the exact pixel height
        the image will occupy before it loads. The browser allocates that space
        immediately, so there's zero layout shift when the image arrives.
      */}
      <div
        className={`relative overflow-hidden bg-surface-hover flex-shrink-0 ${
          isList ? 'w-48 sm:w-56' : 'w-full'
        }`}
        style={{ paddingBottom: isList ? 0 : '56.25%' /* 16:9 aspect ratio */ }}
      >
        <div className={`${isList ? 'relative h-full min-h-[12rem]' : 'absolute inset-0'}`}>
          {article.image_url ? (
            <img
              src={article.image_url}
              alt={article.title}
              /**
               * [Web Vitals — LCP]
               * loading="lazy" defers off-screen images, freeing bandwidth for
               * the above-the-fold hero image which is the LCP candidate.
               * decoding="async" moves JPEG/PNG decoding off the main thread.
               */
              loading="lazy"
              decoding="async"
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={(e) => {
                const el = e.currentTarget;
                el.style.display = 'none';
                el.parentElement!.classList.add(`bg-gradient-to-br`, ...gradient.split(' '));
              }}
            />
          ) : (
            <div className={`absolute inset-0 bg-gradient-to-br ${gradient} flex items-center justify-center`}>
              <ImageOff size={28} className="text-white/20" />
            </div>
          )}

          {/* Category chip over image */}
          <span className={`absolute top-2 left-2 z-10 text-[9px] font-black tracking-wider px-2 py-0.5 rounded-sm ${chipClass}`}>
            {article.category}
          </span>
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────────────────── */}
      <div className={`p-4 flex flex-col flex-1 ${isList ? 'min-w-0' : ''}`}>

        {/* Source name */}
        <p className="text-[9px] font-black tracking-widest text-text-muted uppercase mb-1.5">
          {article.source_name || 'News Source'}
        </p>

        {/* Title */}
        <h2
          className="text-[15px] font-bold text-text-main group-hover:text-primary transition-colors leading-snug mb-2 line-clamp-2"
          style={{ fontFamily: 'var(--font-serif)' }}
        >
          {article.title}
        </h2>

        {/* Leaning badge */}
        <div className="mb-2">
          <span className="inline-block px-2 py-0.5 text-[8px] font-black tracking-wider bg-surface-hover text-text-muted rounded uppercase">
            {article.political_leaning}
          </span>
        </div>

        {/* Summary */}
        {article.summary && article.summary.length > 0 && (
          <p className="text-xs text-text-muted line-clamp-2 mb-3 leading-relaxed">
            {stripHtml(article.summary.join(' '))}
          </p>
        )}

        {/* Footer */}
        <div className="mt-auto pt-3 flex items-center justify-between border-t border-border-light">
          <span className="text-[10px] font-medium text-text-muted">
            {relativeTime(article.published_at)}
          </span>
          <span className="text-[10px] font-bold text-primary flex items-center gap-1 group-hover:gap-2 transition-all">
            Read <ArrowRight size={12} />
          </span>
        </div>
      </div>
    </Link>
  );
};

/**
 * [Diffing Algorithm — React.memo custom comparator]
 *
 * areEqual returns true (skip re-render) when:
 * - The article object reference AND all its relevant fields are identical
 * - The viewMode hasn't changed
 *
 * This is more granular than the default shallow-equal that React.memo uses.
 * Without this, every time the parent re-renders (e.g. clock tick in App.tsx),
 * ALL article cards would re-render even though nothing changed — causing
 * React's diffing algorithm to traverse thousands of Virtual DOM nodes
 * unnecessarily.
 */
function areEqual(prev: Props, next: Props): boolean {
  return (
    prev.viewMode    === next.viewMode &&
    prev.article.id  === next.article.id &&
    prev.article.title         === next.article.title &&
    prev.article.image_url     === next.article.image_url &&
    prev.article.published_at  === next.article.published_at
  );
}

export const ArticleCard = memo(ArticleCardInner, areEqual);