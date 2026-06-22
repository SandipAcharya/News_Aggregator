import { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Filters } from './components/Filters';
import { ArticleFeed } from './components/ArticleFeed';
import { useStore } from './store/useStore';
import { Sun, Moon, Search, LayoutGrid, List } from 'lucide-react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, retry: 1 },
  },
});

function App() {
  const { isDarkMode, toggleDarkMode, viewMode, setViewMode, setSearchQuery, startDate, setStartDate, endDate, setEndDate } = useStore();
  const [inputValue, setInputValue] = useState('');

  const handleSearch = () => {
    setSearchQuery(inputValue);
  };

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
        
        {/* Top Header */}
        <header className="h-16 border-b border-border bg-surface flex items-center justify-between px-6 shrink-0">
          <div className="flex items-baseline gap-3">
            <h1 className="text-2xl font-bold text-text-main tracking-tight">News Aggregator</h1>
            <span className="text-sm font-medium text-text-muted hidden sm:block">Powered by KAFAL CARE</span>
          </div>
          <button 
            onClick={toggleDarkMode}
            className="w-10 h-10 rounded-lg bg-background flex items-center justify-center text-text-muted hover:text-white border border-border transition-colors"
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </header>

        {/* Main Content Layout */}
        <div className="flex flex-1 overflow-hidden">
          
          {/* Left Sidebar (Filters) */}
          <aside className="w-72 border-r border-border bg-surface overflow-y-auto shrink-0 flex flex-col">
            <Filters />
          </aside>

          {/* Right Main Content */}
          <main className="flex-1 overflow-y-auto bg-background p-6 flex flex-col">
            
            {/* Search and Top Controls */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-6">
              
              {/* Search Bar */}
              <div className="relative flex-1 max-w-2xl">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search size={18} className="text-text-muted" />
                </div>
                <input 
                  type="text" 
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search news... (e.g., climate change, technology)"
                  className="w-full h-12 pl-11 pr-24 rounded-xl border border-border bg-surface text-text-main placeholder-text-muted focus:outline-none focus:border-primary transition-colors"
                />
                <button 
                  onClick={handleSearch}
                  className="absolute right-2 top-2 bottom-2 px-6 bg-primary hover:bg-orange-600 text-white font-medium rounded-lg transition-colors"
                >
                  Search
                </button>
              </div>

              {/* Top Right Controls (Dates & View Toggles) */}
              <div className="flex items-center gap-4 shrink-0">
                <div className="flex items-center gap-2 text-sm text-text-muted">
                  <span>From</span>
                  <input
                    type="date"
                    value={startDate || ''}
                    onChange={(e) => setStartDate(e.target.value || null)}
                    className="h-10 px-3 bg-surface border border-border rounded-lg text-text-main focus:outline-none focus:border-primary cursor-pointer"
                  />
                  <span>To</span>
                  <input
                    type="date"
                    value={endDate || ''}
                    onChange={(e) => setEndDate(e.target.value || null)}
                    className="h-10 px-3 bg-surface border border-border rounded-lg text-text-main focus:outline-none focus:border-primary cursor-pointer"
                  />
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  <button 
                    onClick={() => setViewMode('grid')}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${viewMode === 'grid' ? 'bg-primary text-white' : 'bg-surface border border-border text-text-muted hover:text-white'}`}
                  >
                    <LayoutGrid size={18} />
                  </button>
                  <button 
                    onClick={() => setViewMode('list')}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${viewMode === 'list' ? 'bg-primary text-white' : 'bg-surface border border-border text-text-muted hover:text-white'}`}
                  >
                    <List size={18} />
                  </button>
                </div>
              </div>
            </div>

            {/* The Feed */}
            <ArticleFeed />

          </main>
        </div>
      </div>
    </QueryClientProvider>
  );
}

export default App;
