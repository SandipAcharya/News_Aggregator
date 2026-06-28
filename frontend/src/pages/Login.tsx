/**
 * Login.tsx
 *
 * Premium newspaper-style authentication page.
 * Matches the Bichar Bimarsh Media brand with clean editorial aesthetics.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { login, signup, verifyOtp } from '../services/api';
import { ArrowLeft, Newspaper, Eye, EyeOff } from 'lucide-react';

export const Login = () => {
    const [isLoginMode,     setIsLoginMode]     = useState(true);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [isOtpMode,       setIsOtpMode]       = useState(false);
    const [otp,      setOtp]      = useState('');
    const [email,    setEmail]    = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [error,    setError]    = useState('');
    const [success,  setSuccess]  = useState('');
    const [isLoading,setIsLoading]= useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const navigate = useNavigate();
    const { isDarkMode, setToken } = useStore();

    useEffect(() => {
        document.documentElement.classList.toggle('dark', isDarkMode);
    }, [isDarkMode]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setIsLoading(true);

        try {
            if (isOtpMode) {
                await verifyOtp(email, otp);
                setIsOtpMode(false);
                setIsLoginMode(true);
                setSuccess('Email verified! You can now log in.');
            } else if (isLoginMode) {
                const response = await login(email, password);
                setToken(response.token);
                navigate('/');
            } else {
                await signup(email, password, username);
                setIsOtpMode(true);
            }
        } catch (err: any) {
            const msg = err.response?.data?.error || 'Authentication failed. Please try again.';
            setError(msg);
            if (msg.toLowerCase().includes('verify')) setIsOtpMode(true);
        } finally {
            setIsLoading(false);
        }
    };

    const switchMode = () => {
        if (isTransitioning) return;
        setError('');
        setIsTransitioning(true);
        setTimeout(() => {
            setIsLoginMode(m => !m);
            setIsTransitioning(false);
        }, 400);
    };

    return (
        <div className="min-h-screen bg-background flex">

            {/* ── Left decorative panel (desktop only) ─────────────────────── */}
            <div className="hidden lg:flex lg:w-1/2 bg-primary dark:bg-surface flex-col justify-between p-12 relative overflow-hidden">
                {/* Background texture — newspaper column lines */}
                <div className="absolute inset-0 opacity-5" style={{
                    backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 28px, rgba(255,255,255,0.3) 28px, rgba(255,255,255,0.3) 29px)',
                }}>
                </div>

                {/* Brand */}
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-12 h-12 rounded-sm overflow-hidden shrink-0 border-2 border-primary flex items-center justify-center bg-primary">
                            <img src="/logo.jpeg" alt="Logo" className="w-full h-full object-cover" />
                        </div>
                        <div>
                            <div className="text-xl font-black text-white tracking-tight" style={{ fontFamily: 'var(--font-serif)' }}>
                                BICHAR BIMARSH
                            </div>
                            <div className="text-xs font-bold tracking-[0.3em] text-primary">MEDIA</div>
                        </div>
                    </div>

                    <blockquote className="text-white/100 text-xl font-serif leading-relaxed mt-12" style={{ fontFamily: 'var(--font-serif)' }}>
                        "सत्य, तथ्य र निष्पक्ष समाचार — यही हाम्रो प्रतिबद्धता।"
                    </blockquote>
                    <p className="text-white/100 text-sm mt-4 font-medium">
                        Truth, Facts &amp; Unbiased Reporting — Our Commitment.
                    </p>
                </div>

                {/* Decorative headlines */}
                <div className="relative z-10 space-y-4 border-t border-white/80 pt-8">
                    {[
                        'AI-Powered News Summaries',
                        'Multi-Source Bias Analysis',
                        'Real-Time Global Coverage',
                        'Smart Search & Filters',
                    ].map((feature) => (
                        <div key={feature} className="flex items-center gap-3 text-sm text-white/60">
                            <div className="w-1 h-1 rounded-full bg-primary" />
                            {feature}
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Right: Auth form ───────────────────────────────────────────── */}
            <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 relative">

                {/* Back to home */}
                <button
                    onClick={() => navigate('/')}
                    className="absolute top-6 left-6 flex items-center gap-2 text-sm text-text-muted hover:text-text-main transition-colors font-medium"
                >
                    <ArrowLeft size={15} /> Back to News
                </button>

                {/* Mobile brand */}
                <div className="lg:hidden flex items-center gap-2 mb-8">
                    <div className="w-9 h-9 rounded-sm overflow-hidden shrink-0 border border-primary flex items-center justify-center bg-primary">
                        <img src="/logo.jpeg" alt="Logo" className="w-full h-full object-cover" />
                    </div>
                    <span className="font-black text-text-main tracking-tight" style={{ fontFamily: 'var(--font-serif)' }}>BICHAR BIMARSH</span>
                </div>

                {/* Form card */}
                <div
                    className={`w-full max-w-sm transition-opacity duration-400 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}
                >
                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex items-center gap-2 mb-1">
                            <Newspaper size={18} className="text-primary" />
                            <span className="text-[10px] font-black tracking-widest text-primary uppercase">
                                {isOtpMode ? 'Verify Email' : isLoginMode ? 'Sign In' : 'Create Account'}
                            </span>
                        </div>
                        <h1 className="text-2xl font-black text-text-main" style={{ fontFamily: 'var(--font-serif)' }}>
                            {isOtpMode
                                ? 'Check your inbox'
                                : isLoginMode
                                    ? 'Welcome back'
                                    : 'Join Bichar Bimarsh'}
                        </h1>
                        <p className="text-sm text-text-muted mt-1">
                            {isOtpMode
                                ? 'Enter the 6-digit code sent to your email.'
                                : 'Sign in to access AI summaries and personalized news.'}
                        </p>
                    </div>

                    {/* Error / success messages */}
                    {error && (
                        <div className="mb-5 p-3.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm font-medium">
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="mb-5 p-3.5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-700 dark:text-emerald-400 text-sm font-medium">
                            {success}
                        </div>
                    )}



                    {/* Form fields */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {isOtpMode ? (
                            <>
                                <div>
                                    <label className="block text-xs font-bold text-text-main mb-1.5 uppercase tracking-wider">Email address</label>
                                    <input
                                        type="email" required value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full h-11 bg-background border border-border rounded-xl px-4 text-text-main placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-sm"
                                        placeholder="you@example.com"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-text-main mb-1.5 uppercase tracking-wider">Verification Code</label>
                                    <input
                                        type="text" required maxLength={6} value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        className="w-full h-11 bg-background border border-border rounded-xl px-4 text-text-main placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-center tracking-[0.5em] text-lg font-bold"
                                        placeholder="000000"
                                    />
                                </div>
                            </>
                        ) : (
                            <>
                                {!isLoginMode && (
                                    <div>
                                        <label className="block text-xs font-bold text-text-main mb-1.5 uppercase tracking-wider">Username</label>
                                        <input
                                            type="text" required value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            className="w-full h-11 bg-background border border-border rounded-xl px-4 text-text-main placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-sm"
                                            placeholder="johndoe"
                                        />
                                    </div>
                                )}
                                <div>
                                    <label className="block text-xs font-bold text-text-main mb-1.5 uppercase tracking-wider">Email address</label>
                                    <input
                                        type="email" required value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full h-11 bg-background border border-border rounded-xl px-4 text-text-main placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-sm"
                                        placeholder="admin@bicharbimarsh.com"
                                    />
                                </div>
                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label className="block text-xs font-bold text-text-main uppercase tracking-wider">Password</label>
                                        {isLoginMode && (
                                            <a href="#" className="text-xs font-semibold text-primary hover:text-primary-dark transition-colors">Forgot?</a>
                                        )}
                                    </div>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"} required value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full h-11 bg-background border border-border rounded-xl px-4 pr-10 text-text-main placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-sm"
                                            placeholder="••••••••"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-main transition-colors"
                                            tabIndex={-1}
                                        >
                                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-11 bg-primary hover:bg-primary-dark text-white font-black rounded-xl shadow-lg shadow-primary/20 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed mt-2 text-sm tracking-wide"
                        >
                            {isLoading
                                ? 'Processing…'
                                : isOtpMode ? 'Verify Email'
                                : isLoginMode ? 'Sign In'
                                : 'Create Account'}
                        </button>
                    </form>

                    {/* Mode switcher */}
                    {!isOtpMode ? (
                        <p className="text-center text-sm text-text-muted mt-6">
                            {isLoginMode ? "Don't have an account? " : 'Already have an account? '}
                            <button
                                onClick={switchMode}
                                disabled={isTransitioning}
                                className="font-bold text-primary hover:text-primary-dark transition-colors"
                            >
                                {isLoginMode ? 'Sign up' : 'Log in'}
                            </button>
                        </p>
                    ) : (
                        <p className="text-center text-sm text-text-muted mt-6">
                            <button
                                onClick={() => { setIsOtpMode(false); setIsLoginMode(true); }}
                                className="font-bold text-primary hover:text-primary-dark transition-colors"
                            >
                                ← Back to login
                            </button>
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};
