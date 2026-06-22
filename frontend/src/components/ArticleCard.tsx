import type { Article } from '../services/api';
import { ExternalLink, ImageOff } from 'lucide-react';

interface Props {
    article: Article;
    viewMode: 'grid' | 'list';
}

// Strip any residual HTML tags from text (safety net for older DB records)
const stripHtml = (text: string) => text?.replace(/<[^>]*>/g, '').trim() ?? '';

// Category → gradient fallback when no real image is available
const categoryGradient: Record<string, string> = {
    Technology:    'from-blue-900 to-slate-800',
    Politics:      'from-red-900 to-slate-800',
    Sports:        'from-green-900 to-slate-800',
    Business:      'from-yellow-900 to-slate-800',
    Entertainment: 'from-purple-900 to-slate-800',
    Science:       'from-teal-900 to-slate-800',
    Health:        'from-pink-900 to-slate-800',
    General:       'from-slate-700 to-slate-900',
};

export const ArticleCard: React.FC<Props> = ({ article, viewMode }) => {
    const isList = viewMode === 'list';
    const gradient = categoryGradient[article.category] ?? 'from-slate-700 to-slate-900';

    // Calculate relative time
    const getRelativeTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours}h ago`;
        return `${Math.floor(diffInHours / 24)}d ago`;
    };

    return (
        <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`
                block bg-surface rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 group
                ${isList ? 'flex flex-row h-48' : 'flex flex-col'}
            `}
        >
            {/* Image / Fallback */}
            <div className={`relative overflow-hidden ${isList ? 'w-64 h-full flex-shrink-0' : 'w-full h-48'}`}>
                {article.image_url ? (
                    <img
                        src={article.image_url}
                        alt={article.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                            // If the real image fails to load, swap in the gradient fallback
                            const el = e.currentTarget;
                            el.style.display = 'none';
                            el.parentElement!.classList.add(`bg-gradient-to-br`, ...gradient.split(' '));
                        }}
                    />
                ) : (
                    <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                        <ImageOff size={32} className="text-white/20" />
                    </div>
                )}
                {/* Category pill overlay on image */}
                <span className="absolute top-2 left-2 text-[9px] font-bold tracking-wider bg-black/60 text-white px-2 py-1 rounded uppercase backdrop-blur-sm">
                    {article.category}
                </span>
            </div>

            {/* Content */}
            <div className={`p-5 flex flex-col flex-1 ${isList ? 'min-w-0' : ''}`}>

                {/* Source Name */}
                <div className="text-[10px] font-extrabold tracking-widest text-text-muted uppercase mb-2">
                    {article.source_name || 'News Source'}
                </div>

                {/* Title */}
                <h2 className="text-[17px] font-bold text-text-main group-hover:text-primary transition-colors leading-snug mb-3 line-clamp-2">
                    {article.title}
                </h2>

                {/* Category + Leaning badge */}
                <div className="mb-3">
                    <span className="inline-block px-2.5 py-1 text-[9px] font-extrabold tracking-wider bg-surface-hover text-text-muted rounded uppercase">
                        {article.category} · {article.political_leaning}
                    </span>
                </div>

                {/* Summary — with HTML stripped as safety net */}
                {article.summary && article.summary.length > 0 ? (
                    <p className="text-sm text-text-muted line-clamp-2 mb-4 leading-relaxed">
                        {stripHtml(article.summary.join(' '))}
                    </p>
                ) : null}

                {/* Footer */}
                <div className="mt-auto pt-4 flex items-center justify-between">
                    <span className="text-xs font-medium text-text-muted">
                        {getRelativeTime(article.published_at)}
                    </span>
                    <span className="text-xs font-bold text-primary flex items-center gap-1 group-hover:text-orange-500 transition-colors">
                        Read More <ExternalLink size={12} />
                    </span>
                </div>
            </div>
        </a>
    );
};
