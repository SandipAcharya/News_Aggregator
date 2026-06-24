import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Clock, ExternalLink, ShieldAlert, Sparkles, AlertCircle, Bookmark } from 'lucide-react';
import { useStore } from '../store/useStore';

export function ArticleSummary() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token, setSearchQuery } = useStore();

  const { data: articleRes, isLoading: articleLoading } = useQuery({
    queryKey: ['article', id],
    queryFn: async () => {
      const res = await fetch(`/api/articles/${id}`);
      if (!res.ok) throw new Error('Failed to fetch article details');
      return res.json();
    },
  });

  const { data: summaryRes, isLoading: summaryLoading } = useQuery({
    queryKey: ['article_summary', id],
    queryFn: async () => {
      const res = await fetch(`/api/articles/${id}/summary`);
      if (!res.ok) throw new Error('Failed to generate summary');
      return res.json();
    },
    // Only fetch summary if we have the article and the user is viewing it
    enabled: !!id,
  });

  const article = articleRes?.data;
  const summary = summaryRes?.data;
  const isGuest = !token;

  if (articleLoading) {
    return <ArticleSummarySkeleton />;
  }

  if (!article) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-text-muted">
        <AlertCircle size={48} className="mb-4" />
        <h2 className="text-xl font-bold mb-2 text-text-main">Article Not Found</h2>
        <p className="mb-6">We couldn't find the requested article.</p>
        <Link to="/" className="px-6 py-2 bg-primary text-white rounded-lg font-semibold">Back to Feed</Link>
      </div>
    );
  }

  const handleEntityClick = (entity: string) => {
    setSearchQuery(entity);
    navigate('/');
  };

  return (
    <div className="max-w-4xl mx-auto pb-20">
      {/* Back button */}
      <div className="mb-6">
        <button 
          onClick={() => navigate('/')} 
          className="flex items-center gap-2 text-text-muted hover:text-text-main transition-colors text-sm font-semibold"
        >
          <ArrowLeft size={16} /> Back to News
        </button>
      </div>

      {/* Hero Section */}
      <div className="relative rounded-2xl overflow-hidden mb-8 shadow-xl bg-surface">
        <div className="aspect-video sm:aspect-[21/9] w-full relative">
          <img 
            src={article.image_url || '/placeholder-news.jpg'} 
            alt={article.title}
            className="w-full h-full object-cover"
            onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=1200&q=80'; }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
          
          <div className="absolute bottom-0 left-0 p-6 sm:p-8 w-full text-white">
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <span className="px-3 py-1 bg-primary text-white text-xs font-bold rounded-full uppercase tracking-wider">
                {article.category || 'News'}
              </span>
              <span className="flex items-center gap-1 text-sm font-medium text-white/80">
                <Bookmark size={14} /> {article.source_name}
              </span>
              <span className="text-sm text-white/60">
                {new Date(article.published_at).toLocaleDateString()}
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold leading-tight tracking-tight mb-2">
              {article.title}
            </h1>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: AI Summary */}
        <div className="lg:col-span-2 space-y-8">
          
          <div className="bg-surface rounded-2xl border border-border p-6 sm:p-8 relative overflow-hidden">
            <div className="flex items-center gap-2 mb-6 text-primary">
              <Sparkles size={24} className="fill-primary/20" />
              <h2 className="text-xl font-bold text-text-main tracking-tight">AI Executive Summary</h2>
            </div>

            {/* Content Area - Blurred for guests */}
            <div className={`relative ${isGuest ? 'select-none' : ''}`}>
              
              {summaryLoading ? (
                <SummaryContentSkeleton />
              ) : summary ? (
                <div className={`space-y-6 ${isGuest ? 'blur-md opacity-60' : ''} transition-all duration-500`}>
                  {summary.key_entities?.summary_paragraphs && summary.key_entities.summary_paragraphs.length > 0 ? (
                    <div className="space-y-5">
                      {summary.key_entities.summary_paragraphs.map((paragraph: string, idx: number) => (
                        <p key={idx} className="text-text-main font-medium leading-relaxed sm:text-lg">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  ) : (
                    // Fallback for older DB records that still have tldr/bullet_points
                    <div className="space-y-6">
                      <div className="bg-primary/5 rounded-xl p-5 border border-primary/10">
                        <h3 className="text-xs font-bold text-primary uppercase tracking-wider mb-2">TL;DR</h3>
                        <p className="text-text-main font-medium leading-relaxed sm:text-lg">
                          {summary.key_entities?.tldr || summary.bullet_points?.[0] || 'Generating concise overview...'}
                        </p>
                      </div>
                      {summary.bullet_points?.length > 0 && (
                        <div>
                          <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-4">Key Takeaways</h3>
                          <ul className="space-y-3">
                            {summary.bullet_points.map((point: string, i: number) => (
                              <li key={i} className="flex gap-3 text-text-main leading-relaxed">
                                <span className="text-primary font-bold mt-0.5">•</span>
                                <span>{point}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-red-500 flex items-center gap-2"><AlertCircle size={16}/> Summary generation failed.</div>
              )}

              {/* Guest Paywall Overlay */}
              {isGuest && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface/40 rounded-xl">
                  <div className="bg-surface p-6 sm:p-8 rounded-2xl border border-border shadow-2xl text-center max-w-sm mx-4 transform transition-all">
                    <ShieldAlert size={48} className="mx-auto mb-4 text-primary" />
                    <h3 className="text-xl font-bold text-text-main mb-2">Premium Insight</h3>
                    <p className="text-text-muted text-sm mb-6">
                      Unlock AI-powered summaries, key takeaways, and entity tracking by signing in.
                    </p>
                    <Link to="/login" className="block w-full py-3 bg-primary text-white rounded-lg font-bold hover:bg-orange-600 transition-colors">
                      Sign In to Read
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Metadata & Entities */}
        <div className="space-y-6">
          
          {/* Action Box */}
          <div className="bg-surface rounded-2xl border border-border p-6 shadow-sm">
            <a 
              href={article.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 bg-background border-2 border-primary text-primary hover:bg-primary hover:text-white rounded-xl font-bold transition-colors mb-6"
            >
              Read Full Article <ExternalLink size={18} />
            </a>

            {!summaryLoading && summary && !isGuest && (
              <div className="grid grid-cols-2 gap-4 pt-6 border-t border-border">
                <div>
                  <p className="text-xs font-bold text-text-muted uppercase mb-1">Sentiment</p>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${getSentimentColor(summary.sentiment)}`} />
                    <span className="font-semibold text-text-main">{summary.sentiment}</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-text-muted uppercase mb-1">Reading Time</p>
                  <div className="flex items-center gap-2 text-text-main font-semibold">
                    <Clock size={16} className="text-text-muted"/> {summary.reading_time_mins} min
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Entities (Hidden for guests or loading) */}
          {!summaryLoading && summary && !isGuest && (
            <div className="bg-surface rounded-2xl border border-border p-6 shadow-sm">
              <h3 className="text-sm font-bold text-text-main mb-4 flex items-center gap-2">
                Related Entities
              </h3>
              
              {/* People */}
              {summary.key_entities?.people?.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs text-text-muted mb-2 font-semibold">People</p>
                  <div className="flex flex-wrap gap-2">
                    {summary.key_entities.people.map((person: string) => (
                      <button 
                        key={person} 
                        onClick={() => handleEntityClick(person)}
                        className="px-3 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-semibold rounded-md hover:bg-blue-500/20 transition-colors"
                      >
                        {person}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Organizations */}
              {summary.key_entities?.orgs?.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs text-text-muted mb-2 font-semibold">Organizations</p>
                  <div className="flex flex-wrap gap-2">
                    {summary.key_entities.orgs.map((org: string) => (
                      <button 
                        key={org} 
                        onClick={() => handleEntityClick(org)}
                        className="px-3 py-1 bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-semibold rounded-md hover:bg-purple-500/20 transition-colors"
                      >
                        {org}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Places */}
              {summary.key_entities?.places?.length > 0 && (
                <div>
                  <p className="text-xs text-text-muted mb-2 font-semibold">Locations</p>
                  <div className="flex flex-wrap gap-2">
                    {summary.key_entities.places.map((place: string) => (
                      <button 
                        key={place} 
                        onClick={() => handleEntityClick(place)}
                        className="px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold rounded-md hover:bg-emerald-500/20 transition-colors"
                      >
                        {place}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

function getSentimentColor(sentiment: string) {
  const s = sentiment?.toLowerCase() || '';
  if (s.includes('positive')) return 'bg-emerald-500';
  if (s.includes('negative')) return 'bg-red-500';
  if (s.includes('mixed')) return 'bg-yellow-500';
  return 'bg-gray-400';
}

function ArticleSummarySkeleton() {
  return (
    <div className="max-w-4xl mx-auto pb-20 animate-pulse">
      <div className="w-32 h-4 bg-border rounded mb-6"></div>
      <div className="w-full aspect-[21/9] bg-border rounded-2xl mb-8"></div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-surface rounded-2xl border border-border p-8 h-96">
            <div className="w-48 h-6 bg-border rounded mb-6"></div>
            <div className="w-full h-24 bg-background rounded-xl mb-6"></div>
            <div className="space-y-3">
              <div className="w-full h-4 bg-border rounded"></div>
              <div className="w-5/6 h-4 bg-border rounded"></div>
              <div className="w-4/6 h-4 bg-border rounded"></div>
            </div>
          </div>
        </div>
        <div className="bg-surface rounded-2xl border border-border p-6 h-64"></div>
      </div>
    </div>
  );
}

function SummaryContentSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="w-full h-24 bg-border/50 rounded-xl"></div>
      <div className="space-y-4">
        <div className="w-32 h-4 bg-border/50 rounded mb-4"></div>
        <div className="w-full h-4 bg-border/50 rounded"></div>
        <div className="w-5/6 h-4 bg-border/50 rounded"></div>
        <div className="w-full h-4 bg-border/50 rounded"></div>
      </div>
    </div>
  );
}
