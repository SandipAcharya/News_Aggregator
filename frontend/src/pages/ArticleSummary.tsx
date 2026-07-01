import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Clock, ExternalLink, ShieldAlert, Sparkles, AlertCircle, Bookmark, Share2 } from 'lucide-react';
import { useStore } from '../store/useStore';

export function ArticleSummary() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token, setSearchQuery } = useStore();

  const { data: articleRes, isLoading: articleLoading } = useQuery({
    queryKey: ['article', id],
    queryFn: async () => {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
      const res = await fetch(`${baseUrl}/articles/${id}`);
      if (!res.ok) throw new Error('Failed to fetch article details');
      return res.json();
    },
  });

  const { data: summaryRes, isLoading: summaryLoading } = useQuery({
    queryKey: ['article_summary', id],
    queryFn: async () => {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
      const res = await fetch(`${baseUrl}/articles/${id}/summary`);
      if (!res.ok) throw new Error('Failed to generate summary');
      return res.json();
    },
    enabled: !!id,
  });

  const article = articleRes?.data;
  const summary = summaryRes?.data;
  const isGuest = !token;

  if (articleLoading) return <ArticleSummarySkeleton />;

  if (!article) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-text-muted">
        <AlertCircle size={64} className="mb-6 opacity-50" />
        <h2 className="font-serif text-4xl font-black text-text-main mb-4">Story Not Found</h2>
        <p className="text-lg font-medium mb-8">This article may have been removed or is unavailable.</p>
        <Link to="/" className="px-8 py-4 bg-primary text-white rounded-full font-bold shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">Return to Front Page</Link>
      </div>
    );
  }

  const handleEntityClick = (entity: string) => {
    setSearchQuery(entity);
    navigate('/');
  };

  return (
    <article className="max-w-[1000px] mx-auto pb-24">
      {/* ── TOP NAV ── */}
      <div className="mb-8 flex items-center justify-between">
        <button 
          onClick={() => navigate('/')} 
          className="flex items-center gap-2 text-sm font-bold text-text-muted hover:text-primary transition-colors"
        >
          <ArrowLeft size={16} /> BACK TO NEWS
        </button>
        <div className="flex items-center gap-4">
            <button className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-text-muted hover:text-primary hover:border-primary transition-all">
                <Bookmark size={16} />
            </button>
            <button className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-text-muted hover:text-primary hover:border-primary transition-all">
                <Share2 size={16} />
            </button>
        </div>
      </div>

      {/* ── ARTICLE HEADER ── */}
      <header className="mb-12 text-center max-w-4xl mx-auto">
        <div className="flex items-center justify-center gap-4 mb-6">
            <span className="text-xs font-black text-primary uppercase tracking-widest border border-primary px-3 py-1 rounded-full">
                {article.category || 'News'}
            </span>
            <span className="text-xs font-bold text-text-muted uppercase tracking-widest">
                {new Date(article.published_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </span>
        </div>
        <h1 className="font-serif text-4xl md:text-6xl font-black text-text-main leading-[1.1] mb-8 tracking-tight">
          {article.title}
        </h1>
        <div className="flex items-center justify-center gap-2 text-sm font-bold text-text-main">
            By <span className="text-primary">{article.source_name}</span>
            {summary?.reading_time_mins && (
                <>
                    <span className="w-1 h-1 rounded-full bg-border mx-2"/>
                    <span className="text-text-muted flex items-center gap-1.5"><Clock size={14}/> {summary.reading_time_mins} min read</span>
                </>
            )}
        </div>
      </header>

      {/* ── HERO IMAGE ── */}
      <div className="relative rounded-3xl overflow-hidden mb-16 shadow-2xl bg-surface-hover aspect-video lg:aspect-[21/9]">
        <img 
          src={article.image_url || '/placeholder-news.jpg'} 
          alt={article.title}
          className="w-full h-full object-cover"
          onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=1600&q=80'; }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-16">
        
        {/* ── MAIN CONTENT (AI Summary) ── */}
        <div className="prose prose-lg dark:prose-invert max-w-none">
          
          <div className="flex items-center gap-3 mb-8 pb-4 border-b-2 border-border">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Sparkles size={20} />
            </div>
            <h2 className="font-serif text-3xl font-black m-0 text-text-main">AI Executive Briefing</h2>
          </div>

          <div className={`relative ${isGuest ? 'select-none' : ''}`}>
            
            {summaryLoading ? (
              <SummaryContentSkeleton />
            ) : summary ? (
              <div className={`transition-all duration-500 ${isGuest ? 'blur-md opacity-60' : ''}`}>
                
                {/* Intro / TLDR (First letter drop cap) */}
                {(summary.key_entities?.tldr || summary.bullet_points?.[0]) && (
                  <p className="text-xl leading-relaxed text-text-main font-medium mb-8 first-letter:text-6xl first-letter:font-serif first-letter:font-black first-letter:text-primary first-letter:float-left first-letter:mr-3 first-letter:mt-1">
                      {summary.key_entities.tldr || summary.bullet_points[0]}
                  </p>
                )}

                {/* Paragraphs */}
                {summary.key_entities?.summary_paragraphs?.map((p: string, i: number) => (
                    <p key={i} className="text-lg leading-loose text-text-muted mb-6">
                        {p}
                    </p>
                ))}

                {/* Key Takeaways */}
                {summary.bullet_points?.length > 1 && (
                  <div className="bg-surface rounded-2xl p-8 border border-border mt-10 shadow-sm">
                    <h3 className="font-serif text-2xl font-black text-text-main mb-6 mt-0">Key Takeaways</h3>
                    <ul className="space-y-4 m-0 p-0 list-none">
                      {summary.bullet_points.slice(1).map((point: string, i: number) => (
                        <li key={i} className="flex gap-4 text-text-muted leading-relaxed pl-0 m-0">
                          <span className="text-primary font-black mt-1 text-xl leading-none">•</span>
                          <span className="text-lg">{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-red-500 flex items-center gap-2"><AlertCircle size={16}/> Briefing generation failed.</div>
            )}

            {/* Guest Paywall */}
            {isGuest && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/50 backdrop-blur-[2px] rounded-2xl">
                <div className="bg-surface p-10 rounded-3xl border border-border shadow-2xl text-center max-w-md mx-4">
                  <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <ShieldAlert size={40} className="text-primary" />
                  </div>
                  <h3 className="font-serif text-3xl font-black text-text-main mb-4">Subscriber Exclusive</h3>
                  <p className="text-text-muted text-lg mb-8 leading-relaxed">
                    Log in to unlock AI-powered executive briefings, key takeaways, and deep entity tracking.
                  </p>
                  <Link to="/login" className="block w-full py-4 bg-primary text-white rounded-full font-bold text-lg hover:shadow-lg transition-all hover:-translate-y-1">
                    Sign In to Read
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── SIDEBAR (Metadata & Entities) ── */}
        <aside className="space-y-8">
          
          <a 
            href={article.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="group flex items-center justify-between w-full p-6 bg-surface border-2 border-border hover:border-primary rounded-2xl transition-all shadow-sm hover:shadow-md"
          >
            <span className="font-bold text-text-main group-hover:text-primary transition-colors">Read Full Article</span>
            <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center text-text-muted group-hover:text-primary transition-colors">
                <ExternalLink size={18} />
            </div>
          </a>

          {!summaryLoading && summary && !isGuest && (
            <div className="bg-surface rounded-2xl border border-border p-6 shadow-sm">
                
                {/* Sentiment */}
                <div className="mb-8">
                  <h4 className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-3">Tone Analysis</h4>
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white ${getSentimentColor(summary.sentiment)}`}>
                        <Sparkles size={20}/>
                    </div>
                    <div>
                        <span className="block font-bold text-lg text-text-main capitalize">{summary.sentiment}</span>
                        <span className="text-xs text-text-muted font-medium">AI Evaluated</span>
                    </div>
                  </div>
                </div>

                <div className="w-full h-px bg-border mb-8"/>

                {/* Entities */}
                <h4 className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-4">Mentioned Entities</h4>
                
                {summary.key_entities?.people?.length > 0 && (
                  <div className="mb-6">
                    <p className="text-xs font-bold text-text-main mb-2">People</p>
                    <div className="flex flex-wrap gap-2">
                      {summary.key_entities.people.map((p: string) => (
                        <button key={p} onClick={() => handleEntityClick(p)} className="px-3 py-1.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-lg hover:bg-blue-500/20 transition-colors">{p}</button>
                      ))}
                    </div>
                  </div>
                )}

                {summary.key_entities?.orgs?.length > 0 && (
                  <div className="mb-6">
                    <p className="text-xs font-bold text-text-main mb-2">Organizations</p>
                    <div className="flex flex-wrap gap-2">
                      {summary.key_entities.orgs.map((o: string) => (
                        <button key={o} onClick={() => handleEntityClick(o)} className="px-3 py-1.5 bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-bold rounded-lg hover:bg-purple-500/20 transition-colors">{o}</button>
                      ))}
                    </div>
                  </div>
                )}

                {summary.key_entities?.places?.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-text-main mb-2">Locations</p>
                    <div className="flex flex-wrap gap-2">
                      {summary.key_entities.places.map((p: string) => (
                        <button key={p} onClick={() => handleEntityClick(p)} className="px-3 py-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-lg hover:bg-emerald-500/20 transition-colors">{p}</button>
                      ))}
                    </div>
                  </div>
                )}

            </div>
          )}
        </aside>
      </div>
    </article>
  );
}

function getSentimentColor(sentiment: string) {
  const s = sentiment?.toLowerCase() || '';
  if (s.includes('positive')) return 'bg-emerald-500 shadow-emerald-500/30';
  if (s.includes('negative')) return 'bg-red-500 shadow-red-500/30';
  if (s.includes('mixed')) return 'bg-yellow-500 shadow-yellow-500/30';
  return 'bg-gray-400';
}

function ArticleSummarySkeleton() {
  return (
    <div className="max-w-[1000px] mx-auto pb-24 animate-pulse">
      <div className="w-24 h-4 bg-surface-hover rounded mb-12"></div>
      <div className="max-w-4xl mx-auto text-center mb-12">
        <div className="w-32 h-6 bg-surface-hover rounded-full mx-auto mb-6"></div>
        <div className="w-full h-16 bg-surface-hover rounded mb-4"></div>
        <div className="w-3/4 h-16 bg-surface-hover rounded mx-auto"></div>
      </div>
      <div className="w-full aspect-[21/9] bg-surface-hover rounded-3xl mb-16"></div>
    </div>
  );
}

function SummaryContentSkeleton() {
  return (
    <div className="animate-pulse space-y-8">
      <div className="w-full h-32 bg-surface-hover rounded-2xl"></div>
      <div className="space-y-4">
        <div className="w-full h-6 bg-surface-hover rounded"></div>
        <div className="w-5/6 h-6 bg-surface-hover rounded"></div>
        <div className="w-4/6 h-6 bg-surface-hover rounded"></div>
      </div>
      <div className="w-full h-48 bg-surface-hover rounded-2xl mt-12"></div>
    </div>
  );
}
