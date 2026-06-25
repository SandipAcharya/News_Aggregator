import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Image, Tag, Globe, BarChart2, FileText,
  Send, Save, Eye, AlertCircle, CheckCircle2, Loader2, X, Plus, Upload, Link2
} from 'lucide-react';

const CATEGORIES = ['General', 'Politics', 'Technology', 'Business', 'Science', 'Sports', 'Entertainment', 'Health', 'World', 'Nepal'];
const LEANINGS = ['Left', 'Center-Left', 'Center', 'Center-Right', 'Right'];
const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'ne', label: 'Nepali (नेपाली)' },
  { code: 'hi', label: 'Hindi (हिन्दी)' },
];



interface FormData {
  title: string;
  excerpt: string;
  content: string;
  image_url: string;
  category: string;
  language: string;
  political_leaning: string;
  source_name: string;
  tags: string[];
  status: 'draft' | 'auto_scraped';
}

export const ArticleComposer = () => {
  const navigate = useNavigate();
  const [tagInput, setTagInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [charCount, setCharCount] = useState(0);
  const [imageMode, setImageMode] = useState<'url' | 'upload'>('url');
  const [uploadedFileName, setUploadedFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Image too large. Max size is 5MB.');
      return;
    }
    setUploadedFileName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      set('image_url', reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const [form, setForm] = useState<FormData>({
    title: '',
    excerpt: '',
    content: '',
    image_url: '',
    category: 'General',
    language: 'en',
    political_leaning: 'Center',
    source_name: '',
    tags: [],
    status: 'draft',
  });

  const set = (key: keyof FormData, value: any) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !form.tags.includes(t) && form.tags.length < 8) {
      set('tags', [...form.tags, t]);
    }
    setTagInput('');
  };

  const removeTag = (tag: string) =>
    set('tags', form.tags.filter(t => t !== tag));

  const handleSubmit = async (submitStatus: 'draft' | 'auto_scraped') => {
    if (!form.title.trim() || !form.content.trim()) {
      setErrorMsg('Title and Content are required before saving.');
      return;
    }
    setErrorMsg('');
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/articles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...form, status: submitStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit');
      setSuccessMsg(submitStatus === 'auto_scraped'
        ? '🎉 Article published to the feed!'
        : '💾 Draft saved successfully!');
      setTimeout(() => navigate('/'), 2500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Submission failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const wordCount = form.content.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-background text-text-main">
      {/* ── Sticky Compose Header ───────────────────────────────────── */}
      <div className="sticky top-0 z-40 bg-surface/90 backdrop-blur-md border-b border-border px-4 sm:px-8 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link to="/" className="p-2 rounded-lg hover:bg-background text-text-muted transition-colors" title="Back to Feed">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-base font-bold text-text-main leading-tight">Article Composer</h1>
            <p className="text-xs text-text-muted">{wordCount} words · {charCount} characters</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleSubmit('draft')}
            disabled={isSubmitting}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl border border-border text-text-main hover:bg-background transition-colors disabled:opacity-50"
          >
            <Save size={15} />
            Save Draft
          </button>
          <button
            onClick={() => handleSubmit('auto_scraped')}
            disabled={isSubmitting}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl bg-primary text-white hover:bg-orange-600 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
            Publish Now
          </button>
        </div>
      </div>

      {/* ── Status Banner ───────────────────────────────────────────── */}
      {successMsg && (
        <div className="flex items-center gap-3 px-6 py-3 bg-green-500/10 border-b border-green-500/20 text-green-600 dark:text-green-400">
          <CheckCircle2 size={18} /> <span className="text-sm font-medium">{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="flex items-center gap-3 px-6 py-3 bg-red-500/10 border-b border-red-500/20 text-red-500">
          <AlertCircle size={18} /> <span className="text-sm font-medium">{errorMsg}</span>
          <button onClick={() => setErrorMsg('')} className="ml-auto"><X size={16} /></button>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* ── LEFT: Main Content ──────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-text-muted uppercase tracking-widest mb-2">
              Headline <span className="text-red-500">*</span>
            </label>
            <textarea
              value={form.title}
              onChange={e => set('title', e.target.value)}
              placeholder="Write a compelling, clear headline..."
              rows={2}
              maxLength={300}
              className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-text-main text-2xl font-bold placeholder-text-muted focus:outline-none focus:border-primary resize-none transition-colors leading-snug"
            />
            <p className="text-xs text-text-muted mt-1 text-right">{form.title.length}/300</p>
          </div>

          {/* Excerpt / Lead */}
          <div>
            <label className="block text-xs font-bold text-text-muted uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <FileText size={13} /> Excerpt / Lead Paragraph
            </label>
            <textarea
              value={form.excerpt}
              onChange={e => set('excerpt', e.target.value)}
              placeholder="A 1-2 sentence summary shown on the article card in the feed…"
              rows={3}
              maxLength={500}
              className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-text-main placeholder-text-muted focus:outline-none focus:border-primary resize-none transition-colors text-sm leading-relaxed"
            />
            <p className="text-xs text-text-muted mt-1 text-right">{form.excerpt.length}/500</p>
          </div>

          {/* Hero Image */}
          <div>
            <label className="block text-xs font-bold text-text-muted uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <Image size={13} /> Hero Image
            </label>

            {/* Tab switcher */}
            <div className="flex rounded-xl border border-border overflow-hidden mb-3">
              <button
                type="button"
                onClick={() => { setImageMode('url'); set('image_url', ''); setUploadedFileName(''); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold transition-colors ${
                  imageMode === 'url' ? 'bg-primary text-white' : 'bg-surface text-text-muted hover:text-text-main'
                }`}
              >
                <Link2 size={13} /> Paste URL
              </button>
              <button
                type="button"
                onClick={() => { setImageMode('upload'); set('image_url', ''); setUploadedFileName(''); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold transition-colors ${
                  imageMode === 'upload' ? 'bg-primary text-white' : 'bg-surface text-text-muted hover:text-text-main'
                }`}
              >
                <Upload size={13} /> Upload File
              </button>
            </div>

            {imageMode === 'url' ? (
              <input
                type="url"
                value={form.image_url}
                onChange={e => set('image_url', e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-text-main placeholder-text-muted focus:outline-none focus:border-primary text-sm transition-colors"
              />
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary/60 hover:bg-primary/5 transition-all group"
              >
                <Upload size={28} className="text-text-muted group-hover:text-primary transition-colors" />
                {uploadedFileName ? (
                  <>
                    <p className="text-sm font-semibold text-green-500 truncate max-w-full px-4">{uploadedFileName}</p>
                    <p className="text-xs text-text-muted">Click to change</p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-semibold text-text-main">Click to browse</p>
                    <p className="text-xs text-text-muted">PNG, JPG, WEBP — max 5MB</p>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </div>
            )}

            {form.image_url && (
              <div className="mt-3 rounded-xl overflow-hidden border border-border aspect-video bg-background relative group">
                <img
                  src={form.image_url}
                  alt="Article preview"
                  className="w-full h-full object-cover"
                  onError={e => (e.currentTarget.style.display = 'none')}
                />
                <button
                  type="button"
                  onClick={() => { set('image_url', ''); setUploadedFileName(''); }}
                  className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                >
                  <X size={14} />
                </button>
              </div>
            )}
          </div>

          {/* Full Article Body */}
          <div>
            <label className="block text-xs font-bold text-text-muted uppercase tracking-widest mb-2">
              Article Body <span className="text-red-500">*</span>
            </label>
            <textarea
              ref={contentRef}
              value={form.content}
              onChange={e => {
                set('content', e.target.value);
                setCharCount(e.target.value.length);
              }}
              placeholder={`Write the full article body here.\n\nTip: Use blank lines to separate paragraphs. The AI will generate a summary automatically when your article is clicked by readers.`}
              rows={22}
              className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-text-main placeholder-text-muted focus:outline-none focus:border-primary resize-y transition-colors text-base leading-relaxed font-mono"
            />
            <p className="text-xs text-text-muted mt-1">{wordCount} words · Good articles are typically 400–1200 words.</p>
          </div>
        </div>

        {/* ── RIGHT: Metadata Panel ───────────────────────────────────── */}
        <div className="space-y-5">

          {/* Publication Status */}
          <div className="bg-surface border border-border rounded-2xl p-5">
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-4 flex items-center gap-1.5"><Eye size={13} /> Visibility</h3>
            <div className="space-y-2">
              {[
                { val: 'draft', label: '💾 Draft', desc: 'Only visible to you' },
                { val: 'auto_scraped', label: '🌐 Published', desc: 'Live in the public feed' },
              ].map(opt => (
                <label key={opt.val} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${form.status === opt.val ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}>
                  <input
                    type="radio"
                    name="status"
                    value={opt.val}
                    checked={form.status === opt.val}
                    onChange={() => set('status', opt.val)}
                    className="mt-0.5 accent-orange-500"
                  />
                  <div>
                    <p className="text-sm font-semibold text-text-main">{opt.label}</p>
                    <p className="text-xs text-text-muted">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Category */}
          <div className="bg-surface border border-border rounded-2xl p-5">
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-3 flex items-center gap-1.5"><Tag size={13} /> Category</h3>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => set('category', cat)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${form.category === cat ? 'bg-primary text-white border-primary' : 'border-border text-text-muted hover:border-primary/60 hover:text-text-main'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Language */}
          <div className="bg-surface border border-border rounded-2xl p-5">
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-3 flex items-center gap-1.5"><Globe size={13} /> Language</h3>
            <div className="space-y-2">
              {LANGUAGES.map(lang => (
                <label key={lang.code} className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition-all ${form.language === lang.code ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}>
                  <input
                    type="radio"
                    name="language"
                    value={lang.code}
                    checked={form.language === lang.code}
                    onChange={() => set('language', lang.code)}
                    className="accent-orange-500"
                  />
                  <span className="text-sm font-medium text-text-main">{lang.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Political Leaning */}
          <div className="bg-surface border border-border rounded-2xl p-5">
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-3 flex items-center gap-1.5"><BarChart2 size={13} /> Editorial Stance</h3>
            <select
              value={form.political_leaning}
              onChange={e => set('political_leaning', e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-xl text-text-main text-sm focus:outline-none focus:border-primary transition-colors"
            >
              {LEANINGS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>

          {/* Publication / Byline */}
          <div className="bg-surface border border-border rounded-2xl p-5">
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-3">Publication Name</h3>
            <input
              type="text"
              value={form.source_name}
              onChange={e => set('source_name', e.target.value)}
              placeholder="e.g. Bichar Bimarsh, My Blog…"
              className="w-full px-3 py-2 bg-background border border-border rounded-xl text-text-main text-sm placeholder-text-muted focus:outline-none focus:border-primary transition-colors"
            />
            <p className="text-xs text-text-muted mt-1.5">Leave blank to use your account name.</p>
          </div>

          {/* Tags */}
          <div className="bg-surface border border-border rounded-2xl p-5">
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-3">Tags</h3>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                placeholder="Add a tag…"
                maxLength={30}
                className="flex-1 px-3 py-2 bg-background border border-border rounded-xl text-text-main text-sm placeholder-text-muted focus:outline-none focus:border-primary transition-colors"
              />
              <button type="button" onClick={addTag} className="p-2 bg-primary text-white rounded-xl hover:bg-orange-600 transition-colors">
                <Plus size={16} />
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {form.tags.map(tag => (
                <span key={tag} className="flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full border border-primary/20">
                  #{tag}
                  <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-500 transition-colors"><X size={11} /></button>
                </span>
              ))}
              {form.tags.length === 0 && <p className="text-xs text-text-muted">No tags yet.</p>}
            </div>
          </div>

          {/* Submit Footer */}
          <div className="bg-gradient-to-br from-primary/10 to-orange-400/5 border border-primary/20 rounded-2xl p-5 space-y-3">
            <h3 className="text-sm font-bold text-text-main">Ready to go?</h3>
            <p className="text-xs text-text-muted leading-relaxed">
              Publishing will add your article to the live public feed. Drafts are only visible in your dashboard.
            </p>
            <button
              onClick={() => handleSubmit('auto_scraped')}
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-white font-bold rounded-xl hover:bg-orange-600 transition-colors text-sm disabled:opacity-60"
            >
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              {isSubmitting ? 'Publishing…' : 'Publish to Feed'}
            </button>
            <button
              onClick={() => handleSubmit('draft')}
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-2.5 border border-border text-text-muted font-semibold rounded-xl hover:bg-background transition-colors text-sm disabled:opacity-60"
            >
              <Save size={15} /> Save as Draft
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
