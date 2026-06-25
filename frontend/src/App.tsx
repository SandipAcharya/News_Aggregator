import { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Routes, Route } from 'react-router-dom';
import { Filters } from './components/Filters';
import { ArticleFeed } from './components/ArticleFeed';
import { ArticleSummary } from './pages/ArticleSummary';
import { ArticleComposer } from './pages/ArticleComposer';
import { ForgotPassword } from './pages/ForgotPassword';
import { Login } from './pages/Login';
import { useStore } from './store/useStore';
import { Sun, Moon, Search, LayoutGrid, List, Menu, X, LogOut, LogIn, PenSquare } from 'lucide-react';



function App() {
  const {
    isDarkMode, toggleDarkMode,
    viewMode, setViewMode,
    setSearchQuery,
    token, logout,
  } = useStore();

  const [inputValue, setInputValue] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [time, setTime] = useState(new Date());

useEffect(() => {
  const timer = setInterval(() => setTime(new Date()), 1000);
  return () => clearInterval(timer);
}, []);

const englishTime = time.toLocaleTimeString('en-US', {
  hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true,
});

const englishDate = time.toLocaleDateString('en-US', {
  year: 'numeric', month: 'short', day: 'numeric',
});


const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, retry: 1 },
  },
});

  const requireAuth = (action: () => void) => {
    if (!token) {
      window.location.href = '/login';
      return;
    }
    action();
  };

  const handleSearch = () => requireAuth(() => setSearchQuery(inputValue));

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background text-text-main flex flex-col font-sans">

        {/* ── Top Header ─────────────────────────────────────────── */}
        <header className="sticky top-0 z-50 h-16 border-b border-border bg-surface flex items-center justify-between px-6 shrink-0 gap-4">

          {/* Left: Hamburger + Brand */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 -ml-2 rounded-lg hover:bg-background text-text-muted transition-colors"
              aria-label="Open Filters"
            >
              <Menu size={22} />
            </button>
            <div className="flex items-center gap-3">
              <img
                src="/logo.jpeg"
                alt="Bichar Bimarsh Media Logo"
                className="h-10 w-10 rounded-full object-cover shrink-0"
              />
              <div className="flex flex-col justify-center">
                <h1 className="text-xl sm:text-2xl font-bold text-text-main tracking-tight leading-tight">
                  Bichar Bimarsh Media
                </h1>
                <div className="flex items-center gap-3 text-xs font-mono leading-tight">
                  <span className="text-text-muted">{englishDate} &nbsp;{englishTime}</span>
                </div>
              </div>
            </div>  
          </div>
          {/* Centre: Search Bar */}
          <div className="relative flex-1 max-w-xl hidden md:block">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search size={16} className="text-text-muted" />
            </div>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onClick={() => { if (!token) window.location.href = '/login'; }}
              placeholder={token ? 'Search articles…' : 'Sign in to search…'}
              readOnly={!token}
              className={`w-full h-10 pl-10 pr-24 rounded-lg border border-border bg-background text-text-main placeholder-text-muted focus:outline-none focus:border-primary transition-colors text-sm ${!token ? 'cursor-pointer opacity-70' : ''}`}
            />
            <button
              onClick={handleSearch}
              className="absolute right-1 top-1 bottom-1 px-4 bg-primary hover:bg-orange-600 text-white text-sm font-semibold rounded-md transition-colors"
            >
              Search
            </button>
          </div>

          {/* Right: Controls */}
          <div className="flex items-center gap-2 shrink-0">
            {/* View Toggles */}
            <div className="hidden sm:flex items-center gap-1 p-1 bg-background border border-border rounded-lg">
              <button
                onClick={() => setViewMode('grid')}
                className={`w-8 h-8 rounded-md flex items-center justify-center transition-colors ${viewMode === 'grid' ? 'bg-primary text-white' : 'text-text-muted hover:text-text-main'}`}
                aria-label="Grid view"
              >
                <LayoutGrid size={16} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`w-8 h-8 rounded-md flex items-center justify-center transition-colors ${viewMode === 'list' ? 'bg-primary text-white' : 'text-text-muted hover:text-text-main'}`}
                aria-label="List view"
              >
                <List size={16} />
              </button>
            </div>

            <div className="w-px h-6 bg-border mx-1 hidden sm:block" />

            {/* Dark Mode */}
            <button
              onClick={toggleDarkMode}
              className="w-9 h-9 rounded-lg bg-background flex items-center justify-center text-text-muted hover:text-text-main border border-border transition-colors"
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Auth Button */}
            {token && (
              <a
                href="/compose"
                title="Compose Article"
                className="w-9 h-9 rounded-lg bg-background flex items-center justify-center text-text-muted hover:text-text-main border border-border transition-colors"
              >
                <PenSquare size={18} />
              </a>
            )}

            {token ? (
              <button
                onClick={logout}
                title="Log out"
                className="w-9 h-9 rounded-lg bg-background flex items-center justify-center text-text-muted hover:text-red-500 border border-border transition-colors"
              >
                <LogOut size={18} />
              </button>
            ) : (
              <a
                href="/login"
                title="Sign In"
                className="flex items-center gap-1.5 px-3 h-9 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-orange-600 transition-colors"
              >
                <LogIn size={15} />
                <span className="hidden sm:block">Sign In</span>
              </a>
            )}
          </div>
        </header>

        {/* ── Main Layout ─────────────────────────────────────────── */}
        <div className="flex flex-1 overflow-hidden relative">

          {/* Backdrop */}
          {isSidebarOpen && (
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}

          {/* Sliding Drawer Sidebar */}
          <aside
            className={`fixed inset-y-0 left-0 z-50 w-80 bg-surface shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${
              isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            {/* Drawer Header */}
            <div className="h-16 flex items-center justify-between px-5 border-b border-border shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <h2 className="text-base font-bold text-text-main">Filters</h2>
                {!token && (
                  <span className="text-[10px] font-bold text-orange-500 border border-orange-500/30 rounded-full px-2 py-0.5 bg-orange-500/10">
                    LOGIN REQUIRED
                  </span>
                )}
              </div>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-2 rounded-lg hover:bg-background text-text-muted transition-colors"
                aria-label="Close filters"
              >
                <X size={18} />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-hidden">
              <Filters onClose={() => setIsSidebarOpen(false)} />
            </div>
          </aside>

          {/* Main Feed */}
          <main className="flex-1 overflow-y-auto bg-background">
            <div className="px-4 sm:px-6 py-6 h-full">
              <Routes>
                <Route path="/" element={<ArticleFeed />} />
                <Route path="/article/:id" element={<ArticleSummary />} />
                <Route path="/compose" element={<ArticleComposer />} />
                <Route path="/login" element={<Login />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
              </Routes>
            </div>
          </main>
        </div>
      </div>
    </QueryClientProvider>
  );
}

export default App;