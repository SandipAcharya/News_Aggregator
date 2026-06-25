/**
 * SkeletonCard.tsx
 *
 * CONCEPT: Web Vitals — Cumulative Layout Shift (CLS) prevention
 * ─────────────────────────────────────────────────────────────
 * CLS is a Core Web Vitals metric that measures unexpected layout movement.
 * A common CLS source: content placeholders that are smaller than the real
 * content, causing the page to "jump" when real content loads.
 *
 * Our skeleton uses EXACT same dimensions as the real ArticleCard:
 * - Same border-radius, same padding, same font-size approximations
 * - Image area is 16:9 aspect ratio (padding-bottom: 56.25%) — identical
 *   to the real card's image container
 * - Same footer height and margin
 *
 * When the real card replaces the skeleton, the layout doesn't shift at all,
 * resulting in a CLS score of 0 for this interaction.
 *
 * The shimmer animation uses a CSS gradient sweep instead of a simple pulse,
 * which looks more premium and is GPU-accelerated (transform/opacity only).
 */

import { useStore } from '../store/useStore';

export const SkeletonCard = () => {
    const { viewMode } = useStore();
    const isList = viewMode === 'list';

    return (
        <div
            className={`bg-surface rounded-xl overflow-hidden border border-border flex ${
                isList ? 'flex-row' : 'flex-col h-full'
            }`}
            aria-hidden="true"
            role="presentation"
        >
            {/*
              [CLS] Image placeholder — exact 16:9 aspect ratio via padding-bottom.
              The real ArticleCard image also uses padding-bottom: 56.25%.
              So the height is identical → zero layout shift on content load.
            */}
            <div
                className={`relative flex-shrink-0 skeleton-shimmer ${
                    isList ? 'w-48 sm:w-56 min-h-[12rem]' : 'w-full'
                }`}
                style={{ paddingBottom: isList ? 0 : '56.25%' }}
            />

            {/* Content area */}
            <div className={`p-4 flex flex-col flex-1 ${isList ? '' : ''}`}>

                {/* Source name (9px → approximate with h-2.5) */}
                <div className="h-2.5 skeleton-shimmer rounded w-20 mb-2" />

                {/* Title — two lines at ~15px */}
                <div className="h-4 skeleton-shimmer rounded w-full mb-1.5" />
                <div className="h-4 skeleton-shimmer rounded w-3/4 mb-3" />

                {/* Leaning badge */}
                <div className="h-3 skeleton-shimmer rounded w-16 mb-3" />

                {/* Summary — two lines */}
                <div className="space-y-1.5 mb-3">
                    <div className="h-3 skeleton-shimmer rounded w-full" />
                    <div className="h-3 skeleton-shimmer rounded w-5/6" />
                </div>

                {/* Footer (mt-auto equivalent — push to bottom) */}
                <div className="mt-auto pt-3 flex items-center justify-between border-t border-border-light">
                    <div className="h-2.5 skeleton-shimmer rounded w-12" />
                    <div className="h-2.5 skeleton-shimmer rounded w-10" />
                </div>
            </div>
        </div>
    );
};
