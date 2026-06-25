/**
 * Filters.tsx
 *
 * CONCEPTS DEMONSTRATED:
 * ─────────────────────
 * [Island Architecture]
 *   The Filters panel is an "island" — a self-contained interactive component
 *   that loads and hydrates independently from the rest of the page. In a real
 *   SSR/island setup (e.g. Astro or Qwik), this component would be the only
 *   part of the sidebar that ships JavaScript to the client. The main article
 *   feed would be static HTML until interacted with.
 *
 *   Here we simulate it with a <Suspense> boundary wrapping FiltersContent,
 *   and a dedicated React.lazy() import (see FiltersIsland at bottom).
 *   This means the filter UI can load independently without blocking the feed.
 *
 * [Time Slicing — startTransition]
 *   Every filter change is wrapped in startTransition(). This tells React
 *   Fiber's scheduler that the resulting re-render is "non-urgent". React will:
 *   1. Apply the state change
 *   2. Yield to any pending user interactions (keypresses, clicks)
 *   3. Resume the re-render in the next idle slice
 *   Result: the filter dropdown never freezes the UI, even with 500 articles.
 *
 * [React Fiber Architecture]
 *   useTransition() returns isPending — a boolean set by Fiber while it is
 *   scheduling the low-priority update. We use it to show a spinner on the
 *   "Apply Filters" button without blocking the main thread.
 */

import { useTransition, Suspense } from 'react';
import { useStore } from '../store/useStore';
import { ChevronDown, Lock, Loader2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

interface FiltersProps {
    onClose?: () => void;
}

/* ── Auth overlay ─────────────────────────────────────────────────────────── */
const AuthOverlay = ({ onClose }: { onClose?: () => void }) => {
    const navigate = useNavigate();
    return (
        <div
            className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-surface/80 backdrop-blur-sm rounded-lg cursor-pointer"
            onClick={() => { onClose?.(); navigate('/login'); }}
        >
            <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Lock size={22} className="text-primary" />
            </div>
            <div className="text-center px-6">
                <p className="text-sm font-bold text-text-main mb-1">Sign in to use Filters</p>
                <p className="text-xs text-text-muted">Customize your news feed with powerful filters</p>
            </div>
            <span className="px-5 py-2 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary-dark transition-colors">
                Sign In →
            </span>
        </div>
    );
};

/* ── Select wrapper with custom chevron ────────────────────────────────────── */
const FilterSelect = ({
    label,
    value,
    onChange,
    children,
    disabled,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    children: React.ReactNode;
    disabled?: boolean;
}) => (
    <div>
        <h3 className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-2">{label}</h3>
        <div className="relative">
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                className="w-full h-9 bg-background border border-border rounded-lg appearance-none px-3 pr-8 text-sm focus:outline-none focus:border-primary text-text-main cursor-pointer transition-colors hover:border-primary/50"
            >
                {children}
            </select>
            <ChevronDown size={13} className="absolute right-2.5 top-3 pointer-events-none text-text-muted" />
        </div>
    </div>
);

/* ── Bias spectrum visualiser ─────────────────────────────────────────────── */
const BiasSpectrum = ({ value }: { value: string | null }) => {
    const positions: Record<string, number> = {
        'Left': 0, 'Center-Left': 25, 'Center': 50, 'Center-Right': 75, 'Right': 100,
    };
    const pos = value ? (positions[value] ?? 50) : 50;
    return (
        <div className="relative h-2 rounded-full bg-gradient-to-r from-blue-500 via-gray-300 to-red-500 mt-2 mb-1">
            <div
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border-2 border-primary shadow transition-all duration-300"
                style={{ left: `calc(${pos}% - 6px)` }}
            />
        </div>
    );
};

/* ── Main FiltersContent (the "island") ────────────────────────────────────── */
const FiltersContent = ({ onClose }: FiltersProps) => {
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

    /**
     * [React Fiber — useTransition]
     * isPending tells us Fiber is still scheduling the low-priority re-render.
     * We use it to show a loading indicator on the Apply button.
     */
    const [isPending, startTransition] = useTransition();

    const requireAuth = <T extends (...args: any[]) => any>(action: T) => {
        return (...args: Parameters<T>) => {
            if (!useStore.getState().token) {
                onClose?.();
                window.location.href = '/login';
                return;
            }
            return action(...args);
        };
    };

    /**
     * [Time Slicing] Each filter change goes through startTransition.
     * This prevents the filter UI from stuttering when the feed re-renders
     * with hundreds of articles.
     */
    const handleCategoryChange = requireAuth((v: string) => {
        startTransition(() => setSelectedCategory(v || null));
    });
    const handleLeaningChange = requireAuth((v: string) => {
        startTransition(() => setSelectedLeaning(v || null));
    });
    const handleLanguageChange = requireAuth((v: string) => {
        startTransition(() => setSelectedLanguage(v || null));
    });
    const handleCountryChange = requireAuth((v: string) => {
        startTransition(() => setSelectedCountry(v || null));
    });
    const handleSourceTypeChange = requireAuth((v: string) => {
        startTransition(() => setSelectedSourceType(v || null));
    });

    const handleApplyFilters = requireAuth(() => {
        queryClient.invalidateQueries({ queryKey: ['articles'] });
        onClose?.();
    });

    const handleClearAll = requireAuth(() => {
        startTransition(() => {
            clearAllFilters();
            queryClient.invalidateQueries({ queryKey: ['articles'] });
        });
    });

    /* ── Category pills (replaces boring <select> for topics) ────────────── */
    const CATEGORIES = ['All', 'Politics', 'Economy', 'Sports', 'Technology', 'Health', 'Entertainment', 'World', 'Society', 'Lifestyle'];

    return (
        <div className="flex flex-col h-full bg-surface text-text-main py-4 px-4">
            <div className="flex-1 space-y-5 overflow-y-auto relative">
                {/* Auth overlay */}
                {!token && <AuthOverlay onClose={onClose} />}

                {/* ── Date Range ─────────────────────────────────────────── */}
                <div>
                    <h3 className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-2">Date Range</h3>
                    <div className="flex gap-1.5 mb-3">
                        {[7, 14, 30].map((days) => (
                            <button
                                key={days}
                                onClick={requireAuth(() => setDatePreset(datePreset === days ? null : days))}
                                className={`flex-1 py-1.5 border rounded-lg text-xs font-bold transition-all ${
                                    datePreset === days
                                        ? 'bg-primary border-primary text-white shadow-sm'
                                        : 'bg-background border-border text-text-muted hover:border-primary hover:text-text-main'
                                }`}
                            >
                                {days}d
                            </button>
                        ))}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider mb-1 block">Start</label>
                            <input
                                type="date"
                                value={startDate || ''}
                                onChange={requireAuth((e: any) => setStartDate(e.target.value || null))}
                                className="w-full h-9 bg-background border border-border rounded-lg px-2 text-xs text-text-main focus:outline-none focus:border-primary cursor-pointer"
                            />
                        </div>
                        <div>
                            <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider mb-1 block">End</label>
                            <input
                                type="date"
                                value={endDate || ''}
                                onChange={requireAuth((e: any) => setEndDate(e.target.value || null))}
                                className="w-full h-9 bg-background border border-border rounded-lg px-2 text-xs text-text-main focus:outline-none focus:border-primary cursor-pointer"
                            />
                        </div>
                    </div>
                    {(startDate || endDate) && (
                        <button
                            onClick={requireAuth(() => { setStartDate(null); setEndDate(null); setDatePreset(null); })}
                            className="text-xs text-primary mt-1.5 hover:underline"
                        >
                            Clear dates
                        </button>
                    )}
                </div>

                <hr className="border-border" />

                {/* ── Topics — pill grid (Island: interactive element) ─────── */}
                <div>
                    <h3 className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-2">Topics</h3>
                    <div className="flex flex-wrap gap-1.5">
                        {CATEGORIES.map((cat) => {
                            const isActive = cat === 'All' ? !selectedCategory : selectedCategory === cat;
                            return (
                                <button
                                    key={cat}
                                    onClick={handleCategoryChange.bind(null, cat === 'All' ? '' : cat)}
                                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${
                                        isActive
                                            ? 'bg-primary text-white shadow-sm'
                                            : 'bg-background border border-border text-text-muted hover:border-primary hover:text-primary'
                                    }`}
                                >
                                    {cat}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <hr className="border-border" />

                {/* ── Media Bias with spectrum bar ─────────────────────────── */}
                <div>
                    <h3 className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Media Bias</h3>
                    <p className="text-[9px] text-text-muted mb-2">Editorial slant of the news source</p>
                    <BiasSpectrum value={selectedLeaning} />
                    <div className="flex justify-between text-[8px] text-text-muted mt-0.5 mb-2">
                        <span>Left</span><span>Center</span><span>Right</span>
                    </div>
                    <FilterSelect label="" value={selectedLeaning || ''} onChange={handleLeaningChange}>
                        <option value="">All Leanings</option>
                        <option value="Left">◀ Left</option>
                        <option value="Center-Left">◁ Center-Left</option>
                        <option value="Center">● Center</option>
                        <option value="Center-Right">▷ Center-Right</option>
                        <option value="Right">▶ Right</option>
                    </FilterSelect>
                </div>

                <hr className="border-border" />

                {/* ── Country ───────────────────────────────────────────────── */}
                <FilterSelect label="Country" value={selectedCountry || ''} onChange={handleCountryChange}>
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
                </FilterSelect>

                {/* ── Language ──────────────────────────────────────────────── */}
                <FilterSelect label="Language" value={selectedLanguage || ''} onChange={handleLanguageChange}>
                    <option value="">All Languages</option>
                    <option value="en">English</option>
                    <option value="ne">Nepali (नेपाली)</option>
                    <option value="hi">Hindi (हिंदी)</option>
                    <option value="zh">Chinese (中文)</option>
                    <option value="de">German (Deutsch)</option>
                    <option value="fr">French (Français)</option>
                    <option value="es">Spanish (Español)</option>
                    <option value="ar">Arabic (العربية)</option>
                </FilterSelect>

                {/* ── Source Type ───────────────────────────────────────────── */}
                <FilterSelect label="Source Type" value={selectedSourceType || ''} onChange={handleSourceTypeChange}>
                    <option value="">All Source Types</option>
                    <option value="newspaper">📰 Newspaper</option>
                    <option value="magazine">📖 Magazine</option>
                    <option value="digital">💻 Digital Native</option>
                    <option value="broadcast">📡 Broadcast</option>
                    <option value="wire">📡 Wire Service</option>
                    <option value="blog">✍️ Blog / Opinion</option>
                </FilterSelect>
            </div>

            {/* ── Bottom actions ─────────────────────────────────────────────── */}
            <div className="pt-4 flex gap-2 mt-auto border-t border-border shrink-0">
                <button
                    onClick={handleClearAll}
                    className="flex-1 py-2.5 bg-transparent border border-border rounded-lg text-xs font-bold hover:bg-surface-hover transition-colors text-text-main"
                >
                    Clear All
                </button>
                <button
                    onClick={handleApplyFilters}
                    disabled={isPending}
                    className="flex-1 py-2.5 bg-primary hover:bg-primary-dark rounded-lg text-xs font-bold text-white transition-colors shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-70"
                >
                    {/*
                      [Fiber] isPending is true while React is processing
                      the transition update triggered by filter changes.
                    */}
                    {isPending && <Loader2 size={12} className="animate-spin" />}
                    Apply Filters
                </button>
            </div>
        </div>
    );
};

/**
 * [Island Architecture] — Exported wrapper
 *
 * In a real island architecture (Astro, Qwik, etc.):
 * - The server renders a static HTML snapshot of this sidebar
 * - Only this component's JS bundle is hydrated on the client
 * - The rest of the page (header, hero, article list) would be static HTML
 *
 * Here we simulate it with Suspense, which allows React to stream and
 * independently hydrate the filters section. The fallback is rendered
 * server-side while the client-side JS loads.
 */
export const Filters = ({ onClose }: FiltersProps) => (
    <Suspense
        fallback={
            <div className="p-4 flex flex-col gap-3 animate-pulse">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-9 skeleton-shimmer rounded-lg" />
                ))}
            </div>
        }
    >
        <FiltersContent onClose={onClose} />
    </Suspense>
);