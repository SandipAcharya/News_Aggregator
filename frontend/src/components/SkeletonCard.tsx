export const SkeletonCard = () => (
    <div className="bg-surface rounded-lg overflow-hidden border border-border animate-pulse">
        {/* Image placeholder */}
        <div className="w-full h-44 bg-surface-hover" />
        {/* Content */}
        <div className="p-4 space-y-2">
            <div className="h-2.5 bg-surface-hover rounded w-16" />
            <div className="h-4 bg-surface-hover rounded w-full" />
            <div className="h-4 bg-surface-hover rounded w-4/5" />
            <div className="h-3 bg-surface-hover rounded w-full mt-2" />
            <div className="h-3 bg-surface-hover rounded w-3/4" />
            <div className="flex justify-between items-center mt-4">
                <div className="h-3 bg-surface-hover rounded w-20" />
                <div className="h-3 bg-surface-hover rounded w-10" />
            </div>
        </div>
    </div>
);
