import { useStore } from '../store/useStore';

export const SkeletonCard = () => {
    const { viewMode } = useStore();
    const isList = viewMode === 'list';

    return (
        <div className={`bg-surface rounded-xl overflow-hidden animate-pulse flex ${isList ? 'flex-row h-48' : 'flex-col'}`}>
            
            {/* Image Placeholder */}
            <div className={`bg-border ${isList ? 'w-64 h-full' : 'w-full h-48'}`}></div>
            
            <div className={`p-5 flex flex-col flex-1 ${isList ? 'w-full' : ''}`}>
                {/* Source Name */}
                <div className="h-3 bg-border rounded w-20 mb-3"></div>
                
                {/* Title */}
                <div className="h-5 bg-border rounded w-full mb-2"></div>
                <div className="h-5 bg-border rounded w-3/4 mb-4"></div>
                
                {/* Badge */}
                <div className="h-4 bg-border rounded w-24 mb-4"></div>
                
                {/* Summary */}
                <div className="space-y-2 mb-4">
                    <div className="h-3 bg-border rounded w-full"></div>
                    <div className="h-3 bg-border rounded w-5/6"></div>
                </div>
                
                {/* Footer */}
                <div className="mt-auto flex justify-between pt-4">
                    <div className="h-3 bg-border rounded w-16"></div>
                    <div className="h-3 bg-border rounded w-20"></div>
                </div>
            </div>
        </div>
    );
};
