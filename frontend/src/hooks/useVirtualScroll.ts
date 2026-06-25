/**
 * useVirtualScroll.ts
 *
 * CONCEPT: Virtual List (windowed rendering)
 * ─────────────────────────────────────────
 * Traditional lists render ALL items into the DOM. With 500+ articles, this
 * causes massive memory use and layout thrash.
 *
 * Virtual / Windowed rendering only mounts the items currently visible in the
 * scroll viewport, plus a small overscan buffer above and below. As the user
 * scrolls, items outside the window are unmounted and new ones are mounted —
 * the DOM node count stays constant (~10-20 items) regardless of list length.
 *
 * React Fiber makes this efficient: its work-loop can pause midway through
 * reconciling the new window of items and yield to the browser if a frame
 * deadline is approaching (time-slicing), preventing jank.
 *
 * This hook uses IntersectionObserver (O(1) scroll observation, no scroll
 * event listeners) for the infinite-scroll sentinel at the bottom.
 */

import { useState, useEffect, useRef, useCallback } from 'react';

interface VirtualScrollOptions {
  /** Total number of items */
  totalItems: number;
  /** Estimated item height in px (used for scroll thumb position) */
  itemHeight: number;
  /** Extra items to render above and below the visible window */
  overscan?: number;
  /** Items per row (for grid layouts) */
  columns?: number;
  /** Called when the user scrolls near the bottom (infinite scroll) */
  onLoadMore?: () => void;
  /** If true, onLoadMore will not be called (prevents duplicate fetches) */
  isLoadingMore?: boolean;
  /** If false, onLoadMore will not trigger (no more pages) */
  hasMore?: boolean;
}

interface VirtualScrollResult {
  /** Ref to attach to the scrollable container */
  containerRef: React.RefObject<HTMLDivElement | null>;
  /** Ref to attach to the invisible sentinel div at the bottom of the list */
  sentinelRef: React.RefObject<HTMLDivElement | null>;
  /** Index of the first item to render */
  startIndex: number;
  /** Index of the last item to render (exclusive) */
  endIndex: number;
  /** Total scroll height to maintain the scrollbar (px) */
  totalHeight: number;
  /** Top offset for the rendered window (px) */
  offsetTop: number;
}

export function useVirtualScroll({
  totalItems,
  itemHeight,
  overscan = 4,
  columns = 1,
  onLoadMore,
  isLoadingMore = false,
  hasMore = true,
}: VirtualScrollOptions): VirtualScrollResult {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef  = useRef<HTMLDivElement | null>(null);

  // Track scroll position to compute the visible window
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(600);

  // Rows (for grid: ceil(items / columns))
  const totalRows = Math.ceil(totalItems / columns);
  const rowHeight  = itemHeight;
  const totalHeight = totalRows * rowHeight;

  // Which rows are visible?
  const firstVisibleRow = Math.floor(scrollTop / rowHeight);
  const visibleRows     = Math.ceil(containerHeight / rowHeight);

  const startRow = Math.max(0, firstVisibleRow - overscan);
  const endRow   = Math.min(totalRows, firstVisibleRow + visibleRows + overscan);

  const startIndex = startRow * columns;
  const endIndex   = Math.min(totalItems, endRow * columns);
  const offsetTop  = startRow * rowHeight;

  /* ── Scroll listener ────────────────────────────────────────────────────── */
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Measure initial size
    setContainerHeight(el.clientHeight);

    const onScroll = () => setScrollTop(el.scrollTop);
    el.addEventListener('scroll', onScroll, { passive: true });

    // ResizeObserver updates container height if the window is resized
    const ro = new ResizeObserver(([entry]) => {
      setContainerHeight(entry.contentRect.height);
    });
    ro.observe(el);

    return () => {
      el.removeEventListener('scroll', onScroll);
      ro.disconnect();
    };
  }, []);

  /* ── Infinite scroll sentinel (IntersectionObserver) ───────────────────── */
  const handleIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
        onLoadMore?.();
      }
    },
    [hasMore, isLoadingMore, onLoadMore],
  );

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !onLoadMore) return;

    const io = new IntersectionObserver(handleIntersect, {
      root: containerRef.current,
      rootMargin: '200px', // trigger 200px before hitting the bottom
      threshold: 0,
    });
    io.observe(sentinel);
    return () => io.disconnect();
  }, [handleIntersect, onLoadMore]);

  return {
    containerRef,
    sentinelRef,
    startIndex,
    endIndex,
    totalHeight,
    offsetTop,
  };
}
