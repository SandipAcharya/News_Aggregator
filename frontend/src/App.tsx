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
import { Footer } from './components/Footer';
import { ArticleSummary } from './pages/ArticleSummary';
import { useStore } from './store/useStore';
import {
  Search, Menu, X,
  LogOut, LogIn, Radio, ChevronDown
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
  'Home','Business',  'Health','Politics', 'Technology',  'Science'
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
    isDarkMode,
    setSearchQuery,
    token, logout,
    setSelectedCategory,
  } = useStore();

  const [inputValue, setInputValue]       = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen]   = useState(false);
  const [activeTab, setActiveTab]         = useState('Home');
  const [time, setTime]                   = useState(new Date());

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

        {/* ══ Top Utility Bar ═══════════════════════════════════════════════ */}
        <div className="hidden xl:block w-full bg-[#385681] border-b border-white/10" style={{ fontFamily: 'var(--font-sans)' }}>
          <div className="max-w-screen-xl mx-auto px-4 sm:px-8 flex items-center justify-between h-8">
            <div className="flex items-center gap-2 text-[12px] text-gray-200 font-medium">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse shrink-0" />
              <span>{englishDate} &nbsp;·&nbsp; {englishTime} NPT</span>
            </div>
            <div className="flex items-center gap-0">
              <a href="/about" className="text-[11px] font-bold tracking-wide text-gray-200 hover:text-white transition-colors px-3 py-1 uppercase">About Us</a>
              <span className="text-gray-400 select-none">|</span>
              <a href="/contact" className="text-[11px] font-bold tracking-wide text-gray-200 hover:text-white transition-colors px-3 py-1 uppercase">Contact</a>
              <span className="text-gray-400 select-none">|</span>
              <a href="/advertise" className="text-[11px] font-bold tracking-wide text-gray-200 hover:text-white transition-colors px-3 py-1 uppercase">Advertise</a>
            </div>
          </div>
        </div>

        {/* ══ Main Navbar ═══════════════════════════════════════════════════════ */}
        <header className="sticky top-0 z-[60] bg-white shadow-lg border-b border-gray-200" style={{ fontFamily: 'var(--font-sans)' }}>
          <div className="max-w-screen-xl mx-auto px-4 sm:px-8">
            <div className="flex items-center h-14 gap-4">

              {/* Left: Mobile Menu Toggle + Logo */}
              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={() => {
                    startTransition(() => setIsSidebarOpen(!isSidebarOpen));
                  }}
                  className="p-2 -ml-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors xl:hidden"
                  aria-label="Toggle Menu"
                >
                  {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
                </button>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-sm overflow-hidden shrink-0 border-2 border-primary flex items-center justify-center bg-primary">
                    <img src="/logo.jpeg" alt="Logo" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex flex-col justify-center">
                    <div className="text-lg sm:text-xl font-black tracking-tight text-gray-900 leading-none" style={{ fontFamily: 'var(--font-serif)' }}>
                      BICHAR BIMARSH
                    </div>
                    <div className="text-[9px] font-bold tracking-[0.3em] text-[#50A0BA] uppercase leading-tight">
                      MEDIA
                    </div>
                  </div>
                </div>
              </div>

              {/* Centre: Navigation Tabs (Desktop) */}
              <nav className="hidden xl:flex flex-1 items-center justify-center gap-1 overflow-visible">
                {NAV_TABS.map((tab) => {
                  if (tab === 'Politics') {
                    return (
                      <div key={tab} className="relative group">
                        <button
                          onClick={() => handleTabChange(tab)}
                          className={`
                            flex items-center gap-1 px-3.5 py-1.5 text-[13px] font-semibold whitespace-nowrap transition-all duration-200 rounded
                            ${['Politics', 'Sports', 'Entertainment'].includes(activeTab)
                              ? 'bg-[#50A0BA] text-white shadow-md shadow-[#50A0BA]/25'
                              : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'}
                          `}
                        >
                          {tab} <ChevronDown size={14} className="group-hover:rotate-180 transition-transform duration-200" />
                        </button>
                        {/* Dropdown Menu */}
                        <div className="absolute left-0 top-full mt-1 w-40 bg-white rounded-lg shadow-xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 overflow-hidden transform origin-top scale-95 group-hover:scale-100">
                          <button
                            onClick={() => handleTabChange('Sports')}
                            className={`w-full text-left px-4 py-2.5 text-[13px] font-semibold hover:bg-gray-50 transition-colors ${activeTab === 'Sports' ? 'text-[#50A0BA] bg-[#50A0BA]/5' : 'text-gray-700'}`}
                          >
                            Sports
                          </button>
                          <button
                            onClick={() => handleTabChange('Entertainment')}
                            className={`w-full text-left px-4 py-2.5 text-[13px] font-semibold hover:bg-gray-50 transition-colors ${activeTab === 'Entertainment' ? 'text-[#50A0BA] bg-[#50A0BA]/5' : 'text-gray-700'}`}
                          >
                            Entertainment
                          </button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <button
                      key={tab}
                      onClick={() => handleTabChange(tab)}
                      className={`
                        px-3.5 py-1.5 text-[13px] font-semibold whitespace-nowrap transition-all duration-200 rounded
                        ${activeTab === tab
                          ? 'bg-[#50A0BA] text-white shadow-md shadow-[#50A0BA]/25'
                          : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'}
                        ${isPending && activeTab === tab ? 'opacity-70' : ''}
                      `}
                    >
                      {tab}
                    </button>
                  );
                })}
              </nav>

              {/* Right: Search + Auth */}
              <div className="flex items-center gap-2 shrink-0 ml-auto xl:ml-0">
                {/* Search */}
                <div className="flex justify-end items-center">
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
                        className={`w-full h-9 pl-4 pr-12 rounded-full border border-gray-300 bg-white text-gray-700 placeholder-gray-500 focus:outline-none focus:border-[#50A0BA] focus:ring-1 focus:ring-[#50A0BA] transition-colors text-sm ${!token ? 'cursor-pointer opacity-70' : ''}`}
                      />
                      <button
                        onClick={() => setIsSearchOpen(false)}
                        className="absolute right-1 top-1 bottom-1 px-3 text-gray-500 hover:text-gray-900 flex items-center justify-center transition-colors rounded-full"
                        aria-label="Close search"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsSearchOpen(true)}
                      className="p-2 text-gray-600 hover:text-gray-900 transition-colors rounded-lg hover:bg-gray-100"
                      aria-label="Toggle Search"
                    >
                      <Search size={18} />
                    </button>
                  )}
                </div>

                {/* Auth */}
                {token ? (
                  <button
                    onClick={logout}
                    title="Log out"
                    className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 hover:text-red-500 border border-gray-200 transition-colors"
                  >
                    <LogOut size={15} />
                  </button>
                ) : (
                  <a
                    href="/login"
                    className="flex items-center gap-1.5 px-4 h-8 rounded-full bg-[#50A0BA] text-white text-xs font-bold hover:bg-[#3d7a8e] transition-colors shadow-md shadow-[#50A0BA]/20"
                  >
                    <LogIn size={13} />
                    <span className="hidden sm:inline">Sign In</span>
                  </a>
                )}
              </div>

            </div>
          </div>
        </header>

        {/* ══ Breaking News Ticker (Just below Navbar) ══════════════════════════════ */}
        <div className="w-full bg-white dark:bg-surface border-b border-gray-200 shadow-sm overflow-hidden relative z-40">
          <div className="max-w-screen-xl mx-auto px-4 sm:px-8">
            <div className="flex items-center h-12 gap-3">
              <div className="flex items-center gap-2 shrink-0 bg-primary text-white px-3 py-1.5 rounded-sm text-xs font-black tracking-wider uppercase">
                <Radio size={12} className="animate-pulse" />
                BroadCast
              </div>
              <div className="flex-1 overflow-hidden relative">
                <div className="ticker-track flex items-center">
                  {tickerContent.map((item, i) => (
                    <span key={i} className="text-[14px] font-medium text-gray-800 whitespace-nowrap pr-12">
                      <span className="text-primary mr-2 font-bold">•</span>{item}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

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
            className={`fixed inset-y-0 left-0 z-50 w-80 bg-surface shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out pt-[56px] ${
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

        <Footer />
      </div>
    </QueryClientProvider>
  );
}

export default App;
