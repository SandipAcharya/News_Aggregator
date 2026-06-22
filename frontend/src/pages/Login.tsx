import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { login, signup } from '../services/api';

export const Login = () => {
    const [isLoginMode, setIsLoginMode] = useState(true);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const navigate = useNavigate();
    const { isDarkMode, setToken } = useStore();

    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDarkMode]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            if (isLoginMode) {
                const response = await login(email, password);
                setToken(response.token);
                navigate('/');
            } else {
                await signup(email, password, username);
                // Auto login after successful signup
                const response = await login(email, password);
                setToken(response.token);
                navigate('/');
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'Authentication failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col justify-center items-center px-6 relative overflow-hidden">
            {/* Background glowing orbs */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[100px] pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none"></div>
            
            <div className="w-full max-w-md bg-surface/80 backdrop-blur-xl p-8 rounded-2xl shadow-2xl border border-border relative z-10">
                <div className={`transition-opacity duration-1000 ease-in-out ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
                    <div className="text-center mb-8">
                        <div className="w-14 h-14 bg-gradient-to-br from-primary to-orange-400 rounded-2xl mx-auto flex items-center justify-center text-white font-black text-3xl mb-5 shadow-lg shadow-primary/30">
                            N
                        </div>
                        <h2 className="text-3xl font-bold text-text-main mb-2">
                            {isLoginMode ? 'Welcome back' : 'Create an account'}
                        </h2>
                        <p className="text-sm text-text-muted">
                            Sign in to customize your news feed.
                        </p>
                    </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm font-medium text-center">
                        {error}
                    </div>
                )}

                {/* Google OAuth (Mock UI for now) */}
                <button 
                    type="button"
                    onClick={() => alert("Google OAuth API integration requires GCP credentials. For now, use the standard email login below!")}
                    className="w-full h-12 bg-white hover:bg-gray-50 text-gray-900 font-bold rounded-xl shadow-md border border-gray-200 transition-all flex items-center justify-center gap-3 mb-6"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Continue with Google
                </button>

                <div className="flex items-center gap-4 mb-6">
                    <div className="h-px bg-border flex-1"></div>
                    <span className="text-xs text-text-muted font-medium uppercase">Or continue with email</span>
                    <div className="h-px bg-border flex-1"></div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {!isLoginMode && (
                        <div>
                            <label className="block text-sm font-semibold text-text-main mb-2">Username</label>
                            <input 
                                type="text" 
                                required
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full h-12 bg-background/50 border border-border rounded-xl px-4 text-text-main placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                placeholder="johndoe"
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-semibold text-text-main mb-2">Email address</label>
                        <input 
                            type="email" 
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full h-12 bg-background/50 border border-border rounded-xl px-4 text-text-main placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                            placeholder="admin@newsdatahub.com"
                        />
                    </div>
                    
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-semibold text-text-main">Password</label>
                            {isLoginMode && (
                                <a href="#" className="text-sm font-medium text-primary hover:text-orange-500 transition-colors">Forgot password?</a>
                            )}
                        </div>
                        <input 
                            type="password" 
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full h-12 bg-background/50 border border-border rounded-xl px-4 text-text-main placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                            placeholder="••••••••"
                        />
                    </div>

                    <button 
                        type="submit" 
                        disabled={isLoading}
                        className="w-full h-12 bg-primary hover:bg-orange-600 text-white font-bold rounded-xl shadow-lg shadow-primary/30 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed mt-2"
                    >
                        {isLoading ? 'Processing...' : (isLoginMode ? 'Sign in' : 'Create account')}
                    </button>
                </form>
                </div> {/* End Transition Wrapper */}

                <p className="text-center text-sm text-text-muted mt-8">
                    {isLoginMode ? "Don't have an account? " : "Already have an account? "}
                    <button 
                        onClick={() => {
                            if (isTransitioning) return;
                            setError('');
                            setIsTransitioning(true);
                            setTimeout(() => {
                                setIsLoginMode(!isLoginMode);
                                setIsTransitioning(false);
                            }, 1000); // 1-second delay
                        }} 
                        className="font-bold text-primary hover:text-orange-500 transition-colors disabled:opacity-50"
                        disabled={isTransitioning}
                    >
                        {isLoginMode ? 'Sign up' : 'Log in'}
                    </button>
                </p>
            </div>
        </div>
    );
};
