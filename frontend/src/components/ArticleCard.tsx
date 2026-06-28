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
import {  relativeTime } from './ArticleFeed';

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
  // const chipClass = getCategoryChip(article.category);

  return (
    <Link
      to={`/article/${article.id}`}
      className={`
        group block bg-white rounded-[20px] overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 border border-gray-100/80
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

          {/* Category chip over image (Glassmorphism) */}
          <span className={`absolute top-3 left-3 z-10 text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-md bg-white/90 backdrop-blur-md text-gray-800 shadow-sm border border-white/40 uppercase`}>
            {article.category}
          </span>
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────────────────── */}
      <div className={`p-4 flex flex-col flex-1 ${isList ? 'min-w-0' : ''}`}>

        {/* Source name */}
        <p className="text-[10px] font-bold tracking-widest text-[#50A0BA] uppercase mb-1.5 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#50A0BA]/50"></span>
          {article.source_name || 'News Source'}
        </p>

        {/* Title */}
        <h2
          className="text-[16px] font-extrabold text-gray-900 group-hover:text-[#50A0BA] transition-colors leading-[1.35] mb-2.5 line-clamp-2"
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
          <p className="text-[13px] text-gray-500 line-clamp-2 mb-4 leading-relaxed">
            {stripHtml(article.summary.join(' '))}
          </p>
        )}

        {/* Footer */}
        <div className="mt-auto pt-4 flex items-center justify-between border-t border-gray-100">
          <span className="text-[11px] font-semibold text-gray-400 flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            {relativeTime(article.published_at)}
          </span>
          <div className="w-7 h-7 rounded-full bg-gray-50 group-hover:bg-[#50A0BA] flex items-center justify-center transition-colors">
             <ArrowRight size={14} className="text-gray-400 group-hover:text-white transition-colors" />
          </div>
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