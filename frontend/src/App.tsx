/**
 * App.tsx
 *
 * CONCEPTS DEMONSTRATED:
 * ─────────────────────
 * [React Fiber Architecture] — useTransition() is a Fiber-level primitive that
 *   marks state updates as "interruptible". The sidebar open/close and navigation
 *   tab changes are wrapped in startTransition so they never block user input.
 *
 * [Concurrent Mode] — useDeferredValue() creates a deferred copy of the search
 *   input. React renders the "stale" feed while computing the updated one in the
 *   background, keeping the input field perfectly responsive.
 *
 * [Time Slicing] — startTransition() tells React to yield to higher-priority
 *   work (e.g., keystrokes) while processing lower-priority updates (tab switch,
 *   filter apply). The browser stays responsive even on slow devices.
 */

import { useEffect, useState, useTransition, useDeferredValue } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Routes, Route } from 'react-router-dom';
import { Filters } from './components/Filters';
import { ArticleFeed } from './components/ArticleFeed';
import { ArticleSummary } from './pages/ArticleSummary';
import { useStore } from './store/useStore';
import {
  Sun, Moon, Search, LayoutGrid, List, Menu, X,
  LogOut, LogIn, Radio,
} from 'lucide-react';

/* ── React Query client — ISR simulation ───────────────────────────────────
   [Incremental Static Regeneration]
   staleTime = 60 s  → article list treated as "fresh" for 60 s (like ISR revalidation)
   gcTime    = 5 min → stale data stays in memory (like ISR cached page)
   retry = 1         → single retry mirrors ISR fallback behaviour
*/
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 60_000,      // 60 s — "ISR revalidation window"
      gcTime:    5 * 60_000,  // 5 min cache lifetime
    },
  },
});

/* ── Navigation tabs ───────────────────────────────────────────────────────── */
const NAV_TABS = [
  'Home', 'Politics', 'Sports', 'Technology', 'Business', 'Science', 'Health', 'Entertainment', 'World'
];

/* ── Ticker headlines (demo — would come from API in production) ──────────── */
const TICKER_ITEMS = [
  'Nepal PM addresses parliament on federal governance restructuring',
  'Stock market hits record high amid economic optimism',
  'National cricket team qualifies for Asia Cup quarter-finals',
  'Supreme Court delivers landmark ruling on digital privacy',
  'Monsoon update: Heavy rainfall forecast for eastern provinces',
  'Everest expedition season concludes with 12 successful summits',
];

function App() {
  const {
    isDarkMode, toggleDarkMode,
    viewMode, setViewMode,
    setSearchQuery,
    token, logout,
    setSelectedCategory,
  } = useStore();

  const [inputValue, setInputValue]   = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeTab, setActiveTab]     = useState('Home');
  const [time, setTime]               = useState(new Date());

  /**
   * [React Fiber / Concurrent Mode]
   * isPending is true while React is processing the transition.
   * We can use it to show a subtle loading indicator on the nav tab.
   */
  const [isPending, startTransition] = useTransition();

  /**
   * [Concurrent Mode — useDeferredValue]
   * The deferred search query lags behind the live input by one render cycle.
   * React prioritises updating the input (high priority) and defers the
   * expensive feed re-filter (low priority). No debounce timer needed!
   */
  const deferredInput = useDeferredValue(inputValue);

  /* ── Clock ───────────────────────────────────────────────────────────────── */
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const englishDate = time.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  const englishTime = time.toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', hour12: true,
  });

  /* ── Dark mode class toggle ──────────────────────────────────────────────── */
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  /* ── Handlers ────────────────────────────────────────────────────────────── */
  const requireAuth = (action: () => void) => {
    if (!token) { window.location.href = '/login'; return; }
    action();
  };

  const handleSearch = () => requireAuth(() => setSearchQuery(deferredInput));

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  /**
   * [Time Slicing] Tab switch wrapped in startTransition so the click
   * registers instantly while React processes the category filter update
   * in a lower-priority, interruptible render batch.
   */
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    startTransition(() => {
      setSelectedCategory(tab === 'Home' ? null : tab);
    });
  };

  /* ── Ticker duplicated for seamless loop ─────────────────────────────────── */
  const tickerContent = [...TICKER_ITEMS, ...TICKER_ITEMS];

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background text-text-main flex flex-col pb-10" style={{ fontFamily: 'var(--font-sans)' }}>

        {/* ══ Brand Header & Nav ════════════════════════════════════════════════ */}
        <header className="bg-surface border-b border-border px-4 sm:px-8 py-3 sticky top-0 z-[60] shadow-sm">
          <div className="max-w-screen-xl mx-auto flex items-center justify-between gap-4">

            {/* Left: Mobile Menu Toggle + Logo */}
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => {
                  startTransition(() => setIsSidebarOpen(!isSidebarOpen));
                }}
                className="p-2 -ml-2 rounded-lg hover:bg-surface-hover text-text-muted transition-colors xl:hidden"
                aria-label="Toggle Menu"
              >
                {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
              </button>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-sm overflow-hidden shrink-0 border-2 border-primary flex items-center justify-center bg-primary">
                  <img src="/logo.jpeg" alt="Logo" className="w-full h-full object-cover" />
                </div>
                <div className="flex flex-col justify-center">
                  <div className="text-xl sm:text-2xl font-black tracking-tight text-text-main leading-none mb-0.5" style={{ fontFamily: 'var(--font-serif)' }}>
                    BICHAR BIMARSH
                  </div>
                  <div className="text-xs font-semibold tracking-[0.25em] text-primary uppercase mb-0.5">
                    MEDIA
                  </div>
                  <div className="text-[10px] text-text-muted font-medium hidden sm:block">
                    {englishDate} • {englishTime}
                  </div>
                </div>
              </div>
            </div>

            {/* Inline Navigation (Desktop) */}
            <nav className="hidden xl:flex flex-1 items-center justify-center overflow-x-auto scrollbar-hide mx-4 gap-1">
              {NAV_TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => handleTabChange(tab)}
                  className={`
                    px-3 py-1.5 text-sm font-bold whitespace-nowrap transition-colors rounded-full
                    ${activeTab === tab
                      ? 'bg-primary/10 text-primary'
                      : 'text-text-muted hover:text-text-main hover:bg-surface-hover'}
                    ${isPending && activeTab === tab ? 'opacity-70' : ''}
                  `}
                >
                  {tab}
                </button>
              ))}
            </nav>

            {/* Centre/Right: search toggle & controls */}
            <div className="flex justify-end items-center sm:mx-4 mx-2">
              {isSearchOpen ? (
                <div className="relative w-full max-w-md animate-fade-in flex items-center">
                  <input
                    id="main-search"
                    autoFocus
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => {
                       handleKeyDown(e);
                       if (e.key === 'Enter') setIsSearchOpen(false);
                    }}
                    onClick={() => { if (!token) window.location.href = '/login'; }}
                    placeholder={token ? 'Search articles…' : 'Sign in to search…'}
                    readOnly={!token}
                    className={`w-full h-10 pl-4 pr-12 rounded-full border border-border bg-background text-text-main placeholder-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-sm shadow-sm ${!token ? 'cursor-pointer opacity-70' : ''}`}
                  />
                  <button
                    onClick={() => setIsSearchOpen(false)}
                    className="absolute right-1 top-1 bottom-1 px-3 text-text-muted hover:text-text-main flex items-center justify-center transition-colors bg-surface rounded-full"
                    aria-label="Close search"
                  >
                    <X size={18} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsSearchOpen(true)}
                  className="p-2 text-text-muted hover:text-text-main transition-colors ml-auto mr-2"
                  aria-label="Toggle Search"
                >
                  <Search size={24} />
                </button>
              )}
            </div>

            {/* Right: controls */}
            <div className="flex items-center gap-2 shrink-0">
              {/* View Toggles */}
              <div className="hidden sm:flex items-center gap-1 p-1 bg-background border border-border rounded-lg">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`w-7 h-7 rounded flex items-center justify-center transition-colors ${viewMode === 'grid' ? 'bg-primary text-white' : 'text-text-muted hover:text-text-main'}`}
                  aria-label="Grid view"
                >
                  <LayoutGrid size={14} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`w-7 h-7 rounded flex items-center justify-center transition-colors ${viewMode === 'list' ? 'bg-primary text-white' : 'text-text-muted hover:text-text-main'}`}
                  aria-label="List view"
                >
                  <List size={14} />
                </button>
              </div>

              {/* Dark mode toggle */}
              <button
                onClick={toggleDarkMode}
                className="w-8 h-8 rounded-lg bg-background flex items-center justify-center text-text-muted hover:text-text-main border border-border transition-colors"
                aria-label="Toggle dark mode"
              >
                {isDarkMode ? <Sun size={15} /> : <Moon size={15} />}
              </button>

              {/* Auth */}
              {token ? (
                <button
                  onClick={logout}
                  title="Log out"
                  className="w-8 h-8 rounded-lg bg-background flex items-center justify-center text-text-muted hover:text-red-500 border border-border transition-colors"
                >
                  <LogOut size={15} />
                </button>
              ) : (
                <a
                  href="/login"
                  className="flex items-center gap-1.5 px-3 h-8 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary-dark transition-colors"
                >
                  <LogIn size={13} />
                  <span className="hidden sm:inline">Sign In</span>
                </a>
              )}
            </div>
          </div>
        </header>

        {/* ══ Main Layout ═════════════════════════════════════════════════════ */}
        <div className="flex flex-1 overflow-hidden relative">

          {/* Backdrop */}
          {isSidebarOpen && (
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}

          {/* ── Sliding Drawer Sidebar ────────────────────────────────────────── */}
          <aside
            className={`fixed inset-y-0 left-0 z-50 w-80 bg-surface shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out pt-[76px] ${
              isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            <div className="flex-1 overflow-y-auto pb-20">
              {/* Mobile Navigation Links */}
              <div className="xl:hidden px-4 py-4 border-b border-border flex flex-col gap-1">
                {NAV_TABS.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => {
                      handleTabChange(tab);
                      setIsSidebarOpen(false);
                    }}
                    className={`
                      text-left px-4 py-2.5 rounded-lg text-sm font-bold transition-colors
                      ${activeTab === tab
                        ? 'bg-primary/10 text-primary'
                        : 'text-text-muted hover:text-text-main hover:bg-surface-hover'}
                    `}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Filters */}
              <div className="px-5 py-4 flex items-center gap-2 border-b border-border">
                <div className="w-1.5 h-5 bg-primary rounded-full" />
                <h2 className="text-sm font-bold text-text-main tracking-wide">FILTERS</h2>
                {!token && (
                  <span className="text-[9px] font-black text-primary border border-primary/30 rounded-full px-2 py-0.5 bg-primary/10">
                    LOGIN REQUIRED
                  </span>
                )}
              </div>
              <div className="min-h-[500px]">
                <Filters onClose={() => setIsSidebarOpen(false)} />
              </div>
            </div>
          </aside>

          {/* ── Main Feed ────────────────────────────────────────────────────── */}
          <main className="flex-1 overflow-y-auto bg-background" id="main-feed">
            <div className="max-w-screen-xl mx-auto px-4 sm:px-8 py-6">
              <Routes>
                <Route path="/"            element={<ArticleFeed />} />
                <Route path="/article/:id" element={<ArticleSummary />} />
              </Routes>
            </div>
          </main>
        </div>

        {/* ══ Breaking News Ticker (Fixed Footer) ════════════════════════════════════ */}
        <div className="fixed bottom-0 left-0 right-0 z-[100] bg-surface dark:bg-surface border-t border-border/50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] overflow-hidden">
          <div className="max-w-screen-xl mx-auto px-4 sm:px-8">
            <div className="flex items-center h-10 gap-3">
              <div className="flex items-center gap-2 shrink-0 bg-primary text-white px-3 py-1 rounded-sm text-[10px] font-black tracking-wider uppercase">
                <Radio size={10} className="animate-pulse" />
                LIVE
              </div>
              <div className="flex-1 overflow-hidden relative">
                <div className="ticker-track">
                  {tickerContent.map((item, i) => (
                    <span key={i} className="text-xs text-text-muted whitespace-nowrap pr-12">
                      <span className="text-primary mr-2">•</span>{item}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </QueryClientProvider>
  );
}

export default App;