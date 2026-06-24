import { useStore } from '../store/useStore';
import { ChevronDown, Lock } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

interface FiltersProps {
    onClose?: () => void;
}

export const Filters = ({ onClose }: FiltersProps) => {
    const {
        selectedCategory, setSelectedCategory,
        selectedLeaning, setSelectedLeaning,
        selectedLanguage, setSelectedLanguage,
        selectedCountry, setSelectedCountry,
        selectedSourceType, setSelectedSourceType,
        startDate, setStartDate,
        endDate, setEndDate,
        datePreset, setDatePreset,
        clearAllFilters,
        token,
    } = useStore();

    const queryClient = useQueryClient();
    const navigate = useNavigate();

    const requireAuth = <T extends (...args: any[]) => any>(action: T) => {
        return (...args: Parameters<T>) => {
            if (!useStore.getState().token) {
                onClose?.();
                navigate('/login');
                return;
            }
            return action(...args);
        };
    };

    const handleApplyFilters = requireAuth(() => {
        queryClient.invalidateQueries({ queryKey: ['articles'] });
        onClose?.();
    });

    const handleClearAll = requireAuth(() => {
        clearAllFilters();
        queryClient.invalidateQueries({ queryKey: ['articles'] });
    });

    // Overlay shown when user is NOT logged in
    const AuthOverlay = () => (
        <div
            className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-surface/80 backdrop-blur-sm rounded-lg cursor-pointer"
            onClick={() => { onClose?.(); navigate('/login'); }}
        >
            <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Lock size={24} className="text-primary" />
            </div>
            <div className="text-center px-6">
                <p className="text-sm font-bold text-text-main mb-1">Sign in to use Filters</p>
                <p className="text-xs text-text-muted">Customize your news feed with powerful filters</p>
            </div>
            <span className="px-5 py-2 rounded-lg bg-primary text-white text-sm font-bold hover:bg-orange-600 transition-colors">
                Sign In →
            </span>
        </div>
    );

    return (
        <div className="flex flex-col h-full bg-surface text-text-main py-5 px-4">

            <div className="flex-1 space-y-5 overflow-y-auto relative">
                {/* Auth overlay over filter controls */}
                {!token && <AuthOverlay />}

                {/* Date Range Presets */}
                <div>
                    <h3 className="text-[11px] font-extrabold text-text-muted uppercase tracking-widest mb-3">Date Range</h3>
                    <div className="flex gap-2 mb-4">
                        {[7, 14, 30].map((days) => (
                            <button
                                key={days}
                                onClick={requireAuth(() => setDatePreset(datePreset === days ? null : days))}
                                className={`flex-1 py-2 border rounded-lg text-sm font-semibold transition-all ${
                                    datePreset === days
                                        ? 'bg-primary border-primary text-white shadow-sm shadow-primary/30'
                                        : 'bg-background border-border text-text-muted hover:border-primary hover:text-text-main'
                                }`}
                            >
                                {days}d
                            </button>
                        ))}
                    </div>
                    <div className="flex gap-3">
                        <div className="flex-1">
                            <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5 block">Start Date</label>
                            <input
                                type="date"
                                value={startDate || ''}
                                onChange={requireAuth((e: any) => setStartDate(e.target.value || null))}
                                onClick={requireAuth(() => {})}
                                className="w-full h-10 bg-background border border-border rounded-lg px-2 text-sm text-text-main focus:outline-none focus:border-primary cursor-pointer"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5 block">End Date</label>
                            <input
                                type="date"
                                value={endDate || ''}
                                onChange={requireAuth((e: any) => setEndDate(e.target.value || null))}
                                onClick={requireAuth(() => {})}
                                className="w-full h-10 bg-background border border-border rounded-lg px-2 text-sm text-text-main focus:outline-none focus:border-primary cursor-pointer"
                            />
                        </div>
                    </div>
                    {(startDate || endDate) && (
                        <button
                            onClick={requireAuth(() => { setStartDate(null); setEndDate(null); setDatePreset(null); })}
                            className="text-xs text-primary mt-2 hover:underline"
                        >
                            Clear dates
                        </button>
                    )}
                </div>

                <div className="h-px bg-border" />

                {/* Topics */}
                <div>
                    <h3 className="text-[11px] font-extrabold text-text-muted uppercase tracking-widest mb-3">Topics</h3>
                    <div className="relative">
                        <select
                            value={selectedCategory || ''}
                            onChange={requireAuth((e: any) => setSelectedCategory(e.target.value || null))}
                            onClick={requireAuth(() => {})}
                            className="w-full h-10 bg-background border border-border rounded-lg appearance-none px-3 text-sm focus:outline-none focus:border-primary text-text-main cursor-pointer"
                        >
                            <option value="">All Topics</option>
                            <option value="Technology">Technology</option>
                            <option value="Business">Business</option>
                            <option value="Politics">Politics</option>
                            <option value="Science">Science</option>
                            <option value="Sports">Sports</option>
                            <option value="Health">Health</option>
                            <option value="Entertainment">Entertainment</option>
                            <option value="World">World</option>
                        </select>
                        <ChevronDown size={15} className="absolute right-3 top-3 pointer-events-none text-text-muted" />
                    </div>
                </div>

                {/* Media Bias */}
                <div>
                    <h3 className="text-[11px] font-extrabold text-text-muted uppercase tracking-widest mb-1">Media Bias</h3>
                    <p className="text-[10px] text-text-muted mb-3">Editorial slant of the news source</p>
                    <div className="relative">
                        <select
                            value={selectedLeaning || ''}
                            onChange={requireAuth((e: any) => setSelectedLeaning(e.target.value || null))}
                            onClick={requireAuth(() => {})}
                            className="w-full h-10 bg-background border border-border rounded-lg appearance-none px-3 text-sm focus:outline-none focus:border-primary text-text-main cursor-pointer"
                        >
                            <option value="">All Leanings</option>
                            <option value="Left">◀ Left</option>
                            <option value="Center-Left">◁ Center-Left</option>
                            <option value="Center">● Center</option>
                            <option value="Center-Right">▷ Center-Right</option>
                            <option value="Right">▶ Right</option>
                        </select>
                        <ChevronDown size={15} className="absolute right-3 top-3 pointer-events-none text-text-muted" />
                    </div>
                </div>

                {/* Country */}
                <div>
                    <h3 className="text-[11px] font-extrabold text-text-muted uppercase tracking-widest mb-3">Country</h3>
                    <div className="relative">
                        <select
                            value={selectedCountry || ''}
                            onChange={requireAuth((e: any) => setSelectedCountry(e.target.value || null))}
                            onClick={requireAuth(() => {})}
                            className="w-full h-10 bg-background border border-border rounded-lg appearance-none px-3 text-sm focus:outline-none focus:border-primary text-text-main cursor-pointer"
                        >
                            <option value="">All Countries</option>
                            <option value="US">🇺🇸 United States</option>
                            <option value="GB">🇬🇧 United Kingdom</option>
                            <option value="NP">🇳🇵 Nepal</option>
                            <option value="IN">🇮🇳 India</option>
                            <option value="CN">🇨🇳 China</option>
                            <option value="DE">🇩🇪 Germany</option>
                            <option value="FR">🇫🇷 France</option>
                            <option value="AU">🇦🇺 Australia</option>
                            <option value="CA">🇨🇦 Canada</option>
                        </select>
                        <ChevronDown size={15} className="absolute right-3 top-3 pointer-events-none text-text-muted" />
                    </div>
                </div>

                {/* Language */}
                <div>
                    <h3 className="text-[11px] font-extrabold text-text-muted uppercase tracking-widest mb-3">Language</h3>
                    <div className="relative">
                        <select
                            value={selectedLanguage || ''}
                            onChange={requireAuth((e: any) => setSelectedLanguage(e.target.value || null))}
                            onClick={requireAuth(() => {})}
                            className="w-full h-10 bg-background border border-border rounded-lg appearance-none px-3 text-sm focus:outline-none focus:border-primary text-text-main cursor-pointer"
                        >
                            <option value="">All Languages</option>
                            <option value="en">English</option>
                            <option value="ne">Nepali (नेपाली)</option>
                            <option value="hi">Hindi (हिंदी)</option>
                            <option value="zh">Chinese (中文)</option>
                            <option value="de">German (Deutsch)</option>
                            <option value="fr">French (Français)</option>
                            <option value="es">Spanish (Español)</option>
                            <option value="ar">Arabic (العربية)</option>
                        </select>
                        <ChevronDown size={15} className="absolute right-3 top-3 pointer-events-none text-text-muted" />
                    </div>
                </div>

                {/* Source Type */}
                <div>
                    <h3 className="text-[11px] font-extrabold text-text-muted uppercase tracking-widest mb-3">Source Type</h3>
                    <div className="relative">
                        <select
                            value={selectedSourceType || ''}
                            onChange={requireAuth((e: any) => setSelectedSourceType(e.target.value || null))}
                            onClick={requireAuth(() => {})}
                            className="w-full h-10 bg-background border border-border rounded-lg appearance-none px-3 text-sm focus:outline-none focus:border-primary text-text-main cursor-pointer"
                        >
                            <option value="">All Source Types</option>
                            <option value="newspaper">📰 Newspaper</option>
                            <option value="magazine">📖 Magazine</option>
                            <option value="digital">💻 Digital Native</option>
                            <option value="broadcast">📡 Broadcast</option>
                            <option value="wire">📡 Wire Service</option>
                            <option value="blog">✍️ Blog / Opinion</option>
                        </select>
                        <ChevronDown size={15} className="absolute right-3 top-3 pointer-events-none text-text-muted" />
                    </div>
                </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 flex gap-3 mt-auto border-t border-border shrink-0">
                <button
                    onClick={handleClearAll}
                    className="flex-1 py-2.5 bg-transparent border border-border rounded-lg text-sm font-semibold hover:bg-background transition-colors text-text-main"
                >
                    Clear All
                </button>
                <button
                    onClick={handleApplyFilters}
                    className="flex-1 py-2.5 bg-primary hover:bg-orange-600 rounded-lg text-sm font-semibold text-white transition-colors shadow-sm shadow-primary/30"
                >
                    Apply Filters
                </button>
            </div>
        </div>
    );
};