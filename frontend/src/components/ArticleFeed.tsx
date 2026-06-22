import { useQuery } from '@tanstack/react-query';
import { fetchArticles } from '../services/api';
import { useStore } from '../store/useStore';
import { ArticleCard } from './ArticleCard';
import { SkeletonCard } from './SkeletonCard';

export const ArticleFeed = () => {
    const {
        selectedCategory, selectedLeaning,
        selectedLanguage, selectedCountry,
        selectedSourceType,
        viewMode, searchQuery,
        startDate, endDate,
    } = useStore();

    // All filters are sent server-side — cache key covers all dimensions
    const { data: articles, isLoading, isError, error } = useQuery({
        queryKey: [
            'articles',
            selectedCategory,
            selectedLeaning,
            selectedLanguage,
            selectedCountry,
            selectedSourceType,
            searchQuery,
            startDate,
            endDate,
        ],
        queryFn: () => fetchArticles({
            category:   selectedCategory,
            leaning:    selectedLeaning,
            language:   selectedLanguage,
            country:    selectedCountry,
            sourceType: selectedSourceType,
            search:     searchQuery || null,
            startDate:  startDate,
            endDate:    endDate,
        }),
        staleTime: 60000,
    });

    if (isError) {
        return (
            <div className="p-10 text-center bg-red-50 dark:bg-red-900/20 text-red-600 rounded-xl border border-red-200 dark:border-red-800">
                <div className="text-4xl mb-3">⚠️</div>
                <h3 className="font-bold text-lg">Failed to load articles</h3>
                <p className="text-sm mt-2 font-mono bg-red-100 dark:bg-red-900/30 p-3 rounded">
                    {error instanceof Error ? error.message : 'Unknown Network Error'}
                </p>
                <p className="text-sm mt-3 text-red-500">
                    Make sure the backend is running: <code className="font-mono font-bold">npm run dev</code> in <code className="font-mono">backend-node/</code>
                </p>
            </div>
        );
    }

    const gridClass = viewMode === 'grid'
        ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
        : 'flex flex-col gap-4';

    const activeFilterCount = [
        selectedCategory, selectedLeaning, selectedLanguage,
        selectedCountry, selectedSourceType, startDate, endDate,
        searchQuery || null,
    ].filter(Boolean).length;

    return (
        <div>
            {/* Results summary bar */}
            {!isLoading && articles && (
                <div className="flex items-center justify-between mb-4">
                    <p className="text-xs text-text-muted">
                        Showing <span className="font-bold text-text-main">{articles.length}</span> articles
                        {searchQuery && (
                            <span> matching "<span className="text-primary font-medium">{searchQuery}</span>"</span>
                        )}
                        {selectedCategory && (
                            <span> · <span className="text-primary font-medium">{selectedCategory}</span></span>
                        )}
                        {selectedLeaning && (
                            <span> · <span className="text-primary font-medium">{selectedLeaning}</span></span>
                        )}
                        {startDate && endDate && (
                            <span> · <span className="text-primary font-medium">{startDate}</span> → <span className="text-primary font-medium">{endDate}</span></span>
                        )}
                    </p>
                    {activeFilterCount > 0 && (
                        <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-2 py-1 rounded-full font-bold">
                            {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} active
                        </span>
                    )}
                </div>
            )}

            <div className={gridClass}>
                {isLoading ? (
                    [...Array(6)].map((_, i) => <SkeletonCard key={i} />)
                ) : (
                    articles?.map((article) => (
                        <ArticleCard key={article.id} article={article} viewMode={viewMode} />
                    ))
                )}

                {articles?.length === 0 && !isLoading && (
                    <div className="col-span-full py-20 text-center text-text-muted">
                        <div className="text-5xl mb-4">🔍</div>
                        <p className="font-semibold text-text-main text-lg">No articles found</p>
                        <p className="text-sm mt-2">Try adjusting your filters or search query.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

