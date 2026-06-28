import { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Routes, Route, Link, Navigate } from 'react-router-dom';
import { ArticleFeed } from './components/ArticleFeed';
import { ArticleSummary } from './pages/ArticleSummary';
import { ArticleComposer } from './pages/ArticleComposer';
import { Login } from './pages/Login';
import { ForgotPassword } from './pages/ForgotPassword';
import { useStore } from './store/useStore';
import { Search, ChevronDown, Menu, X, Sun, Moon, LogOut, PenSquare } from 'lucide-react';

const queryClient = new QueryClient({
    defaultOptions: { queries: { refetchOnWindowFocus: false, retry: 1 } },
});

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { token } = useStore();
    return token ? <>{children}</> : <Navigate to="/login" replace />;
};

const NAV_CATEGORIES = [
    { label: 'Home', value: null },
    { label: 'Politics', value: 'Politics' },
    { label: 'Economy', value: 'Business' },
    { label: 'Society', value: 'General' },
    { label: 'Technology', value: 'Technology' },
    { label: 'World', value: 'World' },
    { label: 'Sports', value: 'Sports' },
];

function App() {
    const { selectedCategory, setSelectedCategory, isDarkMode, toggleDarkMode, setSearchQuery, token, logout } = useStore();
    const [time, setTime] = useState(new Date());
    const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [searchInput, setSearchInput] = useState('');

    useEffect(() => {
        const t = setInterval(() => setTime(new Date()), 60000);
        return () => clearInterval(t);
    }, []);

    const dateStr = time.toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
    });

    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDarkMode]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setSearchQuery(searchInput.trim());
    };

    return (
        <QueryClientProvider client={queryClient}>
            <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900'}`}>
                
                {/* ══ TOP UTILITY BAR ══ */}
                <div className={`${isDarkMode ? 'bg-gray-950 border-gray-800 text-gray-400' : 'bg-gray-50 border-gray-200 text-gray-600'} border-b text-[11px] font-semibold hidden md:block`}>
                    <div className="max-w-[1400px] mx-auto px-4 lg:px-8 h-9 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <span>{dateStr}</span>
                            <span className="w-px h-3 bg-gray-300"/>
                            <span>Kathmandu, Nepal 24° ⛅</span>
                        </div>
                        <div className="flex items-center gap-6">
                            <a href="#" className="hover:text-black transition-colors">About Us</a>
                            <a href="#" className="hover:text-black transition-colors">Contact</a>
                            <a href="#" className="hover:text-black transition-colors">Advertise</a>
                            <div className="flex items-center gap-3 ml-2 border-l border-gray-300 pl-4">
                                <a href="#" className="font-bold hover:text-black">f</a>
                                <a href="#" className="font-bold hover:text-black">𝕏</a>
                                <a href="#" className="font-bold hover:text-black">▶</a>
                            </div>
                            <button onClick={toggleDarkMode} className="ml-2 hover:text-black dark:text-gray-400 dark:hover:text-white">
                                {isDarkMode ? <Sun size={14} /> : <Moon size={14} />}
                            </button>
                            
                            {/* Action Buttons */}
                            {token ? (
                                <div className="flex items-center gap-2 ml-2 border-l border-gray-300 dark:border-gray-700 pl-4">
                                    <Link to="/compose" className="hover:text-brand-red flex items-center gap-1 dark:text-gray-400 dark:hover:text-white"><PenSquare size={14}/></Link>
                                    <button onClick={logout} className="hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 flex items-center gap-1"><LogOut size={14}/></button>
                                </div>
                            ) : (
                                <Link to="/login" className="ml-2 hover:text-brand-red dark:text-gray-400 dark:hover:text-white font-bold">Login</Link>
                            )}

                            <form onSubmit={handleSearch} className="flex items-center gap-1 border border-gray-300 rounded-full px-2 py-0.5 bg-white dark:bg-gray-800 dark:border-gray-700 ml-2">
                                <input 
                                    type="text"  
                                    placeholder="Search..." 
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                    className="w-24 text-[10px] bg-transparent outline-none dark:text-white"
                                />
                                <button type="submit" className="hover:text-black dark:text-gray-400 dark:hover:text-white">
                                    <Search size={12}/>
                                </button>
                            </form>
                        </div>
                    </div>
                </div>

                {/* ══ MASTHEAD & NAVIGATION ══ */}
                <header className={`border-b ${isDarkMode ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'} sticky top-0 z-50`}>
                    <div className="max-w-[1400px] mx-auto px-4 lg:px-8 h-20 flex items-center justify-between gap-8">
                        
                        {/* Logo */}
                        <Link to="/" onClick={() => setSelectedCategory(null)} className="flex items-center gap-4 shrink-0">
                            <img src="/logo.jpeg" alt="Logo" className="h-14 md:h-16 w-auto object-contain border border-gray-200 dark:border-gray-700 rounded p-1 bg-white" />
                            <div className="flex flex-col justify-center pt-1 hidden sm:flex">
                                <span className="font-extrabold text-[22px] tracking-tight leading-none dark:text-white text-gray-900">
                                    BICHAR BIMARSH
                                </span>
                                <span className="text-[12px] font-bold tracking-[0.3em] text-brand-red mt-1">
                                    MEDIA
                                </span>
                            </div>
                        </Link>

                        {/* Navigation Links */}
                        <nav className="hidden md:flex items-center h-full gap-8">
                            {NAV_CATEGORIES.map((cat) => {
                                const isActive = cat.value === null ? selectedCategory === null : selectedCategory === cat.value;
                                return (
                                    <button 
                                        key={cat.label}
                                        onClick={() => setSelectedCategory(cat.value)}
                                        className={`relative h-full flex items-center text-sm font-bold transition-colors
                                            ${isActive ? 'text-brand-red' : (isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-black')}
                                        `}
                                    >
                                        {cat.label}
                                        {isActive && (
                                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-[3px] bg-brand-red"/>
                                        )}
                                    </button>
                                );
                            })}
                            <button className="flex items-center gap-1 text-sm font-bold text-gray-700 hover:text-black">
                                More <ChevronDown size={14}/>
                            </button>
                        </nav>

                        {/* Mobile Menu Toggle */}
                        <button className="md:hidden" onClick={() => setMobileMenuOpen(true)}>
                            <Menu size={24}/>
                        </button>
                    </div>
                </header>

                {/* Mobile Menu Overlay */}
                {isMobileMenuOpen && (
                    <div className="fixed inset-0 z-50 bg-white p-4 flex flex-col md:hidden">
                        <div className="flex justify-end mb-4">
                            <button onClick={() => setMobileMenuOpen(false)}><X size={28}/></button>
                        </div>
                        <div className="flex flex-col gap-4 text-xl font-bold">
                            {NAV_CATEGORIES.map(cat => (
                                <button key={cat.label} onClick={() => { setSelectedCategory(cat.value); setMobileMenuOpen(false); }} className="text-left py-2 border-b">
                                    {cat.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* ══ MAIN CONTENT ══ */}
                <main className="flex-1 w-full pb-16">
                    <Routes>
                        <Route path="/" element={<ArticleFeed />} />
                        <Route path="/article/:id" element={<ArticleSummary />} />
                        <Route path="/compose" element={<ProtectedRoute><ArticleComposer /></ProtectedRoute>} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/forgot-password" element={<ForgotPassword />} />
                    </Routes>
                </main>

                {/* ══ FOOTER ══ */}
                <footer className="bg-[#121212] text-white mt-auto">
                    <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-12 flex flex-col md:flex-row justify-between items-center gap-8">
                        <div>
                            <h2 className="text-xl md:text-2xl font-bold leading-snug">
                                For truth, facts, and impartial news,<br/>
                                stay connected with Bichar Bimarsh Media.
                            </h2>
                        </div>
                        <div className="flex flex-col gap-3 w-full md:w-auto">
                            <div className="flex w-full md:w-96">
                                <input 
                                    type="email" 
                                    placeholder="Your email address" 
                                    className="flex-1 h-11 px-4 bg-white text-black text-sm focus:outline-none"
                                />
                                <button className="h-11 px-6 bg-brand-red text-white text-sm font-bold hover:bg-brand-red-hover transition-colors">
                                    Subscribe
                                </button>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-400">
                                <input type="checkbox" className="rounded-sm bg-transparent border-gray-500" />
                                <span>I agree to the <a href="#" className="underline">Privacy Policy</a> and <a href="#" className="underline">Terms of Use</a>.</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="border-t border-gray-800 bg-[#0a0a0a]">
                        <div className="max-w-[1400px] mx-auto px-4 lg:px-8 h-14 flex items-center justify-between text-[11px] text-gray-400 font-medium">
                            <p>© 2025 Bichar Bimarsh Media. All rights reserved.</p>
                            <div className="flex gap-6">
                                <a href="#" className="hover:text-white">Privacy Policy</a>
                                <a href="#" className="hover:text-white">Terms of Use</a>
                                <a href="#" className="hover:text-white">Sitemap</a>
                            </div>
                        </div>
                    </div>
                </footer>
            </div>
        </QueryClientProvider>
    );
}

export default App;