import { useQuery } from '@tanstack/react-query';
import { fetchArticles } from '../services/api';
import { useStore } from '../store/useStore';
import { ArticleCard, HeroCard, HeroSmCard } from './ArticleCard';
import { SkeletonCard } from './SkeletonCard';
import { Link } from 'react-router-dom';

export const ArticleFeed = () => {
    const {
        selectedCategory, selectedLeaning,
        selectedLanguage, selectedCountry,
        selectedSourceType, searchQuery,
        startDate, endDate,
    } = useStore();

    const isFiltered = !!(selectedLeaning || selectedLanguage ||
        selectedCountry || selectedSourceType || searchQuery || startDate || endDate);

    const { data: articles, isLoading, isError, error } = useQuery({
        queryKey: ['articles', selectedCategory, selectedLeaning, selectedLanguage,
            selectedCountry, selectedSourceType, searchQuery, startDate, endDate],
        queryFn: () => fetchArticles({
            category: selectedCategory, leaning: selectedLeaning,
            language: selectedLanguage, country: selectedCountry,
            sourceType: selectedSourceType, search: searchQuery || null,
            startDate, endDate,
        }),
        staleTime: 60000,
    });

    if (isError) {
        return (
            <div className="py-20 text-center flex flex-col items-center">
                <div className="text-4xl mb-4">⚠️</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Service Unavailable</h3>
                <p className="text-sm font-medium text-gray-500 max-w-md">
                    {error instanceof Error ? error.message : 'Please check your connection or try again later.'}
                </p>
            </div>
        );
    }

    if (isFiltered) {
        return (
            <div className="max-w-[1400px] mx-auto px-4 lg:px-8 pt-8 min-h-screen">
                {!isLoading && articles && (
                    <div className="mb-6 flex items-center justify-between">
                        <p className="text-[13px] font-medium text-gray-500 dark:text-gray-400">
                            {articles.length} articles found {searchQuery ? `for "${searchQuery}"` : ''}
                        </p>
                    </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {isLoading
                        ? [...Array(8)].map((_, i) => <SkeletonCard key={i} />)
                        : articles?.map(a => <ArticleCard key={a.id} article={a} viewMode="grid" />)
                    }
                </div>
            </div>
        );
    }

    const hero      = articles?.[0];
    const heroRight = articles?.slice(1, 3) ?? [];
    const latest    = articles?.slice(3, 7) ?? [];
    const trending  = articles?.slice(7, 11) ?? [];

    return (
        <div className="flex flex-col gap-12 pt-8 pb-12">
            
            <div className="max-w-[1400px] mx-auto px-4 lg:px-8 w-full">
                {/* ── HERO ── */}
                <section>
                    <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
                        <div className="min-h-[400px] lg:min-h-[500px]">
                            {isLoading
                                ? <div className="animate-pulse bg-gray-100 rounded-2xl h-full min-h-[500px]" />
                                : hero && <HeroCard article={hero} />
                            }
                        </div>
                        <div className="flex flex-col gap-6">
                            {isLoading
                                ? [0, 1].map(i => <div key={i} className="animate-pulse bg-gray-100 rounded-2xl flex-1 min-h-[240px]" />)
                                : heroRight.map(a => <HeroSmCard key={a.id} article={a} />)
                            }
                        </div>
                    </div>
                </section>

                {/* ── LATEST NEWS ── */}
                <section className="mt-12">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold dark:text-white">Latest News</h2>
                        <button onClick={() => useStore.getState().clearAllFilters()} className="text-xs font-bold hover:text-brand-red flex items-center gap-1 transition-colors dark:text-gray-300">
                            View All News &rarr;
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {isLoading
                            ? [...Array(4)].map((_, i) => <SkeletonCard key={i} />)
                            : latest.map(a => <ArticleCard key={a.id} article={a} viewMode="grid" />)
                        }
                    </div>
                </section>
            </div>

            {/* ── TRENDING NOW ── */}
            <div className="max-w-[1400px] mx-auto px-4 lg:px-8 w-full">
                <section>
                    <div className="flex items-center justify-between mb-8 border-b border-gray-200 dark:border-gray-800 pb-4">
                        <h2 className="text-xl font-bold dark:text-white">Trending Now</h2>
                        <button onClick={() => useStore.getState().clearAllFilters()} className="text-xs font-bold hover:text-brand-red flex items-center gap-1 transition-colors dark:text-gray-300">
                            View All &rarr;
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-6">
                        {isLoading
                            ? [...Array(4)].map((_, i) => (
                                <div key={i} className="flex gap-4 animate-pulse">
                                    <div className="w-8 h-8 rounded bg-gray-100 shrink-0"/>
                                    <div className="flex-1">
                                        <div className="h-4 bg-gray-100 rounded w-full mb-2" />
                                        <div className="h-4 bg-gray-100 rounded w-2/3" />
                                    </div>
                                </div>
                            ))
                            : trending.map((a, i) => {
                                const minsAgo = Math.floor((Date.now() - new Date(a.published_at).getTime()) / 60000);
                                const timeStr = minsAgo < 60 ? `${minsAgo}m ago` : `${Math.floor(minsAgo / 60)}h ago`;
                                return (
                                    <Link key={a.id} to={`/article/${a.id}`} className="group flex items-start gap-4 hover:opacity-80 transition-opacity">
                                        <span className="text-[28px] text-brand-red font-normal shrink-0 leading-none">
                                            {String(i + 1).padStart(2, '0')}
                                        </span>
                                        <div className="pt-1">
                                            <h3 className="text-[15px] font-bold text-gray-900 dark:text-gray-100 leading-snug mb-1.5 line-clamp-2">
                                                {a.title}
                                            </h3>
                                            <div className="text-[11px] font-medium text-gray-400 dark:text-gray-500">
                                                {timeStr}
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })
                        }
                    </div>
                </section>
            </div>
        </div>
    );
};