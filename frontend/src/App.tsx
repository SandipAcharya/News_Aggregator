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
import { Navbar, NAV_TABS } from './components/Navbar';
import { ArticleSummary } from './pages/ArticleSummary';
import { AboutUs } from './pages/AboutUs';
import { Contact } from './pages/Contact';
import { Advertise } from './pages/Advertise';
import { useStore } from './store/useStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 60_000,
      gcTime:    5 * 60_000,
    },
  },
});

function App() {
  const {
    
    setSearchQuery,
    token, logout,
    setSelectedCategory,
  } = useStore();

  const [inputValue, setInputValue]       = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen]   = useState(false);
  const [activeTab, setActiveTab]         = useState('Home');
  const [time, setTime]                   = useState(new Date());

  const [isPending, startTransition] = useTransition();
  const deferredInput = useDeferredValue(inputValue);

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


  const requireAuth = (action: () => void) => {
    if (!token) { window.location.href = '/login'; return; }
    action();
  };

  const handleSearch = () => requireAuth(() => setSearchQuery(deferredInput));

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    startTransition(() => {
      setSelectedCategory(tab === 'Home' ? null : tab);
    });
  };

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-white text-text-main flex flex-col">

        <Navbar
          englishDate={englishDate}
          englishTime={englishTime}
          activeTab={activeTab}
          isPending={isPending}
          isSidebarOpen={isSidebarOpen}
          isSearchOpen={isSearchOpen}
          inputValue={inputValue}
          token={token}
          onToggleSidebar={() => startTransition(() => setIsSidebarOpen(!isSidebarOpen))}
          onTabChange={handleTabChange}
          onSearchOpen={setIsSearchOpen}
          onInputChange={setInputValue}
          onSearchKeyDown={handleKeyDown}
          onLogout={logout}
        />

        <div className="flex flex-1 overflow-hidden relative">

          {isSidebarOpen && (
            <div
              className="fixed inset-0 bg-navy/60 backdrop-blur-sm z-40 transition-opacity"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}

          <aside
            className={`fixed inset-y-0 left-0 z-50 w-80 bg-surface shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out pt-[104px] ${
              isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            <div className="flex-1 overflow-y-auto pb-20">
              <div className="xl:hidden px-4 py-4 border-b border-border flex flex-col gap-0.5">
                {NAV_TABS.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => {
                      handleTabChange(tab);
                      setIsSidebarOpen(false);
                    }}
                    className={`
                      text-left px-4 py-3 rounded-lg text-sm font-semibold transition-colors border-l-2
                      ${activeTab === tab
                        ? 'bg-primary-light text-primary border-primary'
                        : 'text-text-muted hover:text-primary hover:bg-surface-hover border-transparent'}
                    `}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="px-5 py-4 flex items-center gap-2 border-b border-border bg-surface-hover/50">
                <div className="w-1 h-5 bg-primary rounded-full" />
                <h2 className="text-sm font-bold text-text-main tracking-wide">Filters</h2>
                {!token && (
                  <span className="text-[9px] font-black text-primary border border-primary/30 rounded-full px-2 py-0.5 bg-primary-light">
                    Login Required
                  </span>
                )}
              </div>
              <div className="min-h-[500px]">
                <Filters onClose={() => setIsSidebarOpen(false)} />
              </div>
            </div>
          </aside>

          <main className="flex-1 overflow-y-auto bg-background" id="main-feed">
            <div className="max-w-screen-xl mx-auto px-4 sm:px-8 py-6">
              <Routes>
                <Route path="/"            element={<ArticleFeed />} />
                <Route path="/article/:id" element={<ArticleSummary />} />
                <Route path="/about"       element={<AboutUs />} />
                <Route path="/contact"     element={<Contact />} />
                <Route path="/advertise"   element={<Advertise />} />
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
