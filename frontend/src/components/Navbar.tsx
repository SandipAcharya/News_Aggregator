import { Link } from 'react-router-dom';
import {
  Search, Menu, X, LogOut, LogIn, Radio, ChevronDown,
} from 'lucide-react';

const NAV_TABS = [
  'Home', 'Business', 'Health', 'Technology', 'Science', 'Politics',
];

const TICKER_ITEMS = [
  'Nepal PM addresses parliament on federal governance restructuring',
  'Stock market hits record high amid economic optimism',
  'National cricket team qualifies for Asia Cup quarter-finals',
  'Supreme Court delivers landmark ruling on digital privacy',
  'Monsoon update: Heavy rainfall forecast for eastern provinces',
  'Everest expedition season concludes with 12 successful summits',
];

interface NavbarProps {
  englishDate: string;
  englishTime: string;
  activeTab: string;
  isPending: boolean;
  isSidebarOpen: boolean;
  isSearchOpen: boolean;
  inputValue: string;
  token: string | null;
  onToggleSidebar: () => void;
  onTabChange: (tab: string) => void;
  onSearchOpen: (open: boolean) => void;
  onInputChange: (value: string) => void;
  onSearchKeyDown: (e: React.KeyboardEvent) => void;
  onLogout: () => void;
}

export function Navbar({
  englishDate,
  englishTime,
  activeTab,
  isPending,
  isSidebarOpen,
  isSearchOpen,
  inputValue,
  token,
  onToggleSidebar,
  onTabChange,
  onSearchOpen,
  onInputChange,
  onSearchKeyDown,
  onLogout,
}: NavbarProps) {
  const politicsActive = ['Politics', 'Sports', 'Entertainment'].includes(activeTab);
  const tickerContent = [...TICKER_ITEMS, ...TICKER_ITEMS];

  const navLinkClass = (isActive: boolean) =>
    `relative px-4 py-5 text-[13px] font-semibold tracking-wide whitespace-nowrap transition-colors duration-200 ${
      isActive
        ? 'nav-tab-active text-primary'
        : 'text-text-muted hover:text-primary'
    } ${isPending && isActive ? 'opacity-70' : ''}`;

  return (
    <>
      {/* Top utility bar */}
      <div className="hidden xl:block w-full bg-navy border-b border-white/8">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-8 flex items-center justify-between h-9">
          <div className="flex items-center gap-2.5 text-[11px] text-white/75 font-medium tracking-wide">
            <span className="live-dot" />
            <span>{englishDate}</span>
            <span className="text-white/30">·</span>
            <span className="text-accent font-semibold">{englishTime} NPT</span>
          </div>
          <div className="flex items-center gap-1">
            {[
              { to: '/about', label: 'About Us' },
              { to: '/contact', label: 'Contact' },
              { to: '/advertise', label: 'Advertise' },
            ].map(({ to, label }, i) => (
              <span key={to} className="flex items-center">
                {i > 0 && <span className="text-white/20 mx-1 select-none">|</span>}
                <Link
                  to={to}
                  className="text-[11px] font-semibold tracking-wider text-white/70 hover:text-white transition-colors px-2.5 py-1 uppercase"
                >
                  {label}
                </Link>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Main header */}
      <header className="sticky top-0 z-[60] bg-surface border-b border-border-light shadow-[0_1px_3px_rgba(0,40,68,0.08)]">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-8">
          <div className="flex items-center h-16 gap-6">

            {/* Mobile menu */}
            <button
              onClick={onToggleSidebar}
              className="p-2 -ml-2 rounded-lg hover:bg-surface-hover text-text-muted hover:text-primary transition-colors xl:hidden"
              aria-label="Toggle Menu"
            >
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 shrink-0 group">
              <div className="h-11 w-auto max-w-[140px] sm:max-w-[160px] overflow-hidden shrink-0">
                <img
                  src="/logo.jpeg"
                  alt="Bichar Bimarsh Media"
                  className="h-full w-auto object-contain object-left group-hover:opacity-90 transition-opacity"
                />
              </div>
            </Link>

            {/* Desktop navigation */}
            <nav className="hidden xl:flex flex-1 items-stretch justify-center self-stretch border-x border-border-light mx-2">
              {NAV_TABS.map((tab) => {
                if (tab === 'Politics') {
                  return (
                    <div key={tab} className="relative group flex items-stretch">
                      <button
                        onClick={() => onTabChange(tab)}
                        className={`${navLinkClass(politicsActive)} flex items-center gap-1`}
                      >
                        {tab}
                        <ChevronDown
                          size={13}
                          className="opacity-60 group-hover:rotate-180 transition-transform duration-200"
                        />
                      </button>
                      <div className="absolute left-0 top-full w-44 bg-surface rounded-b-lg shadow-xl border border-border-light opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 overflow-hidden">
                        {['Sports', 'Entertainment'].map((sub) => (
                          <button
                            key={sub}
                            onClick={() => onTabChange(sub)}
                            className={`w-full text-left px-4 py-3 text-[13px] font-medium border-l-2 transition-colors ${
                              activeTab === sub
                                ? 'text-primary bg-primary-light border-primary'
                                : 'text-text-muted hover:text-primary hover:bg-surface-hover border-transparent hover:border-primary/40'
                            }`}
                          >
                            {sub}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                }

                return (
                  <button
                    key={tab}
                    onClick={() => onTabChange(tab)}
                    className={navLinkClass(activeTab === tab)}
                  >
                    {tab}
                  </button>
                );
              })}
            </nav>

            {/* Search + Auth */}
            <div className="flex items-center gap-2 shrink-0 ml-auto xl:ml-0">
              <div className="flex items-center">
                {isSearchOpen ? (
                  <div className="relative animate-fade-in flex items-center w-48 sm:w-64">
                    <Search size={15} className="absolute left-3.5 text-text-muted pointer-events-none" />
                    <input
                      id="main-search"
                      autoFocus
                      type="text"
                      value={inputValue}
                      onChange={(e) => onInputChange(e.target.value)}
                      onKeyDown={(e) => {
                        onSearchKeyDown(e);
                        if (e.key === 'Enter') onSearchOpen(false);
                      }}
                      onClick={() => { if (!token) window.location.href = '/login'; }}
                      placeholder={token ? 'Search articles…' : 'Sign in to search…'}
                      readOnly={!token}
                      className={`w-full h-9 pl-9 pr-9 rounded-lg border border-border bg-background text-text-main placeholder-text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all text-sm ${
                        !token ? 'cursor-pointer opacity-70' : ''
                      }`}
                    />
                    <button
                      onClick={() => onSearchOpen(false)}
                      className="absolute right-2 p-1 text-text-muted hover:text-text-main transition-colors rounded"
                      aria-label="Close search"
                    >
                      <X size={15} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => onSearchOpen(true)}
                    className="p-2.5 text-text-muted hover:text-primary transition-colors rounded-lg hover:bg-surface-hover"
                    aria-label="Toggle Search"
                  >
                    <Search size={18} />
                  </button>
                )}
              </div>

              <div className="w-px h-6 bg-border hidden sm:block" />

              {token ? (
                <button
                  onClick={onLogout}
                  title="Log out"
                  className="flex items-center gap-1.5 px-3 h-9 rounded-lg text-text-muted hover:text-red-600 hover:bg-red-50 border border-border hover:border-red-200 transition-colors text-xs font-semibold"
                >
                  <LogOut size={14} />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              ) : (
                <a
                  href="/login"
                  className="flex items-center gap-1.5 px-4 h-9 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary-dark transition-colors shadow-sm"
                >
                  <LogIn size={14} />
                  <span className="hidden sm:inline">Sign In</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Breaking news ticker */}
      <div className="sticky top-16 z-[50] w-full bg-primary-light/60 dark:bg-navy/40 border-b border-border-light overflow-hidden">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-8">
          <div className="flex items-center h-10 gap-4">
            <div className="flex items-center gap-2 shrink-0 bg-navy text-white px-3 py-1 rounded text-[10px] font-bold tracking-[0.15em] uppercase">
              <Radio size={11} className="text-accent animate-pulse" />
              Live
            </div>
            <div className="w-px h-4 bg-border shrink-0" />
            <div className="flex-1 overflow-hidden relative">
              <div className="ticker-track flex items-center">
                {tickerContent.map((item, i) => (
                  <span key={i} className="text-[13px] font-medium text-text-main whitespace-nowrap pr-16">
                    <span className="text-accent mr-2 font-bold">▸</span>
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export { NAV_TABS };
