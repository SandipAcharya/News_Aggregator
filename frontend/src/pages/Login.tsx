import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';

export const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();
    const { isDarkMode } = useStore();

    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDarkMode]);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        // Mock authentication for boilerplate
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-background flex flex-col justify-center items-center px-6">
            <div className="w-full max-w-md bg-surface p-8 rounded-2xl shadow-2xl border border-border">
                <div className="text-center mb-8">
                    <div className="w-12 h-12 bg-primary rounded-xl mx-auto flex items-center justify-center text-white font-bold text-2xl mb-4 shadow-lg shadow-primary/30">
                        N
                    </div>
                    <h2 className="text-2xl font-bold text-text-main">Sign in to your account</h2>
                    <p className="text-sm text-text-muted mt-2">Enterprise NewsDataHub Dashboard</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-text-main mb-2">Email address</label>
                        <input 
                            type="email" 
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full h-12 bg-background border border-border rounded-xl px-4 text-text-main placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                            placeholder="admin@newsdatahub.com"
                        />
                    </div>
                    
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-medium text-text-main">Password</label>
                            <a href="#" className="text-sm font-medium text-primary hover:text-orange-500 transition-colors">Forgot password?</a>
                        </div>
                        <input 
                            type="password" 
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full h-12 bg-background border border-border rounded-xl px-4 text-text-main placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                            placeholder="••••••••"
                        />
                    </div>

                    <button 
                        type="submit" 
                        className="w-full h-12 bg-primary hover:bg-orange-600 text-white font-bold rounded-xl shadow-lg shadow-primary/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        Sign in
                    </button>
                </form>

                <p className="text-center text-sm text-text-muted mt-8">
                    Not a member? <a href="#" className="font-medium text-primary hover:text-orange-500">Request access</a>
                </p>
            </div>
        </div>
    );
};
