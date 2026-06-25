/**
 * main.tsx
 *
 * CONCEPTS DEMONSTRATED:
 * ─────────────────────
 * [Hydration]   — Uses hydrateRoot() so the app is hydration-ready if server
 *                 renders HTML (SSR). Falls back to createRoot() for pure CSR.
 *                 The SSR_HYDRATE flag simulates what a Next.js / Remix server would do.
 *
 * [Concurrent Mode] — StrictMode + createRoot/hydrateRoot opts into React's
 *                     concurrent renderer that powers useTransition & useDeferredValue.
 *
 * [Streaming SSR] — <Suspense> at the root level means React can stream partial
 *                   HTML to the client and hydrate each piece as it arrives.
 *
 * [Web Vitals]  — onCLS, onFID, onLCP, onFCP, onTTFB are reported from the
 *                 web-vitals library and logged (or sent to analytics).
 */

import { StrictMode, Suspense } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import './index.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App.tsx';
import { Login } from './pages/Login.tsx';

/* ── Web Vitals reporting ─────────────────────────────────────────────────── */
// Dynamic import so it never blocks the critical rendering path (non-blocking)
const reportWebVitals = async () => {
  try {
    const { onCLS, onINP, onLCP, onFCP, onTTFB } = await import('web-vitals');
    const send = (metric: { name: string; value: number; rating: string }) => {
      // In production: replace console with sendBeacon / analytics endpoint
      const emoji = metric.rating === 'good' ? '✅' : metric.rating === 'needs-improvement' ? '⚠️' : '❌';
      console.log(`[Web Vitals] ${emoji} ${metric.name}: ${Math.round(metric.value)} (${metric.rating})`);
    };
    onCLS(send);   // Cumulative Layout Shift
    onINP(send);   // Interaction to Next Paint (replaces FID)
    onLCP(send);   // Largest Contentful Paint
    onFCP(send);   // First Contentful Paint
    onTTFB(send);  // Time to First Byte
  } catch {
    // web-vitals not installed yet — silently skip
  }
};

/* ── App tree (wrapped in Suspense for Streaming SSR / hydration) ─────────── */
const AppTree = (
  <StrictMode>
    {/*
      [Streaming SSR + Hydration]:
      This top-level <Suspense> is the boundary that React uses when streaming
      HTML. The server sends whatever it can render synchronously, and the client
      "hydrates" each suspended piece as the stream arrives.
      The fallback is an ultra-lightweight placeholder to prevent CLS.
    */}
    <Suspense
      fallback={
        <div
          style={{
            minHeight: '100vh',
            background: 'var(--color-background)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              border: '3px solid var(--color-border)',
              borderTopColor: 'var(--color-primary)',
              animation: 'spin 0.8s linear infinite',
            }}
          />
        </div>
      }
    >
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/*"     element={<App />} />
        </Routes>
      </BrowserRouter>
    </Suspense>
  </StrictMode>
);

/* ── Mount strategy: hydrateRoot (SSR) vs createRoot (CSR) ──────────────── */
const container = document.getElementById('root')!;

/**
 * [Hydration] — If the server has pre-rendered HTML into #root (innerHTML
 * is non-empty), we call hydrateRoot() to attach event listeners without
 * discarding the existing DOM — this is the key hydration step.
 * Otherwise we fall back to createRoot() for a standard CSR mount.
 *
 * In production with a real SSR server, container.innerHTML will have content.
 * During local `vite dev`, it will be empty, so createRoot is used instead.
 */
if (container.innerHTML.trim().length > 0) {
  // SSR path — hydrate server-rendered markup
  hydrateRoot(container, AppTree);
} else {
  // CSR path — fresh client render
  createRoot(container).render(AppTree);
}

/* ── Report Web Vitals after paint (non-blocking) ─────────────────────────── */
// requestIdleCallback ensures vitals reporting never delays TTI
if ('requestIdleCallback' in window) {
  requestIdleCallback(reportWebVitals);
} else {
  setTimeout(reportWebVitals, 1);
}
