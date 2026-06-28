import { Link } from 'react-router-dom';
import type { Article } from '../services/api';

interface CardProps {
    article: Article;
    viewMode?: 'grid' | 'list';
}

const formatTimeAgo = (dateStr: string) => {
    const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
    if (mins < 60) return `${mins}m ago`;
    if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
    return `${Math.floor(mins / 1440)}d ago`;
};

// ── LARGE HERO (LEFT) ──
export const HeroCard = ({ article }: CardProps) => (
    <Link to={`/article/${article.id}`} className="group relative block w-full h-full min-h-[450px] md:min-h-[500px] rounded-2xl overflow-hidden card-hover">
        <img
            src={article.image_url || '/placeholder-news.jpg'}
            alt=""
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=1200&q=80'; }}
        />
        <div className="absolute inset-0 hero-gradient" />
        <div className="absolute inset-0 p-8 flex flex-col justify-end text-white">
            <div className="mb-4">
                <span className="px-2 py-1 bg-brand-red text-white text-[10px] font-bold rounded-sm uppercase tracking-wider shadow-sm">
                    TOP STORY
                </span>
            </div>
            <h2 className="text-3xl md:text-[40px] font-bold leading-tight mb-3 group-hover:text-gray-200 transition-colors">
                {article.title}
            </h2>
            <p className="text-gray-200 text-sm md:text-base font-medium line-clamp-2 md:w-3/4 mb-4 leading-relaxed">
                {article.summary ? (Array.isArray(article.summary) ? article.summary[0] : article.summary) : 'Read the full story to learn more about this developing situation.'}
            </p>
            <div className="text-xs font-medium text-gray-300">
                By {article.source_name} &bull; {formatTimeAgo(article.published_at)}
            </div>
        </div>
    </Link>
);

// ── SMALL HERO (RIGHT STACK) ──
export const HeroSmCard = ({ article }: CardProps) => (
    <Link to={`/article/${article.id}`} className="group relative block w-full h-full min-h-[200px] md:min-h-[240px] rounded-2xl overflow-hidden card-hover">
        <img
            src={article.image_url || '/placeholder-news.jpg'}
            alt=""
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&q=80'; }}
        />
        <div className="absolute inset-0 hero-sm-gradient" />
        <div className="absolute inset-0 p-6 flex flex-col justify-end text-white">
            <div className="mb-2">
                <span className="px-2 py-1 bg-black/40 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-wider rounded-sm">
                    {article.category || 'NATIONAL'}
                </span>
            </div>
            <h3 className="text-xl md:text-[22px] font-bold leading-snug mb-2 group-hover:text-gray-200 transition-colors">
                {article.title}
            </h3>
            <div className="text-[11px] font-medium text-gray-300">
                {formatTimeAgo(article.published_at)}
            </div>
        </div>
    </Link>
);

// ── STANDARD GRID CARD (Latest News) ──
export const ArticleCard = ({ article }: CardProps) => (
    <Link to={`/article/${article.id}`} className="group flex flex-col bg-white dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow duration-300 h-full">
        <div className="relative h-48 w-full overflow-hidden bg-gray-100 dark:bg-gray-700 shrink-0">
            <img
                src={article.image_url || '/placeholder-news.jpg'}
                alt=""
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=600&q=80'; }}
            />
        </div>
        
        <div className="p-5 flex flex-col flex-1">
            <span className="text-[10px] font-bold text-brand-red uppercase tracking-wider mb-2">
                {article.category || 'NEWS'}
            </span>
            
            <h3 className="text-[17px] font-bold text-gray-900 dark:text-gray-100 leading-snug mb-3 group-hover:text-brand-red dark:group-hover:text-brand-red transition-colors line-clamp-3">
                {article.title}
            </h3>
            
            <p className="text-[13px] text-gray-500 dark:text-gray-400 font-medium line-clamp-2 leading-relaxed mb-4 flex-1">
                {article.summary 
                    ? (Array.isArray(article.summary) ? article.summary[0] : article.summary) 
                    : 'Read full story...'}
            </p>
            
            <div className="pt-2 text-[11px] font-medium text-gray-400 mt-auto">
                {formatTimeAgo(article.published_at)}
            </div>
        </div>
    </Link>
);