import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { forgotPassword, verifyResetOtp, resetPassword } from '../services/api';

export const ForgotPassword = () => {
    const [step, setStep] = useState<'request' | 'verify' | 'reset'>('request');
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const navigate = useNavigate();
    const { isDarkMode } = useStore();

    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDarkMode]);

    const handleRequestOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setIsLoading(true);

        try {
            const res = await forgotPassword(email);
            setMessage(res.message || 'OTP sent successfully.');
            setStep('verify');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to request OTP. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setIsLoading(true);

        try {
            const res = await verifyResetOtp(email, otp);
            setMessage(res.message || 'OTP verified.');
            setStep('reset');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Invalid OTP. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setIsLoading(true);

        if (newPassword !== confirmPassword) {
            setError("Passwords do not match.");
            setIsLoading(false);
            return;
        }

        try {
            const res = await resetPassword(email, otp, newPassword, confirmPassword);
            setMessage(res.message || 'Password reset successfully.');
            // Go to login after short delay
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to reset password.');
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
                <div className="text-center mb-8">
                    <div className="w-14 h-14 bg-gradient-to-br from-primary to-orange-400 rounded-2xl mx-auto flex items-center justify-center text-white font-black text-3xl mb-5 shadow-lg shadow-primary/30">
                        N
                    </div>
                    <h2 className="text-3xl font-bold text-text-main mb-2">
                        {step === 'request' && 'Reset Password'}
                        {step === 'verify' && 'Verify OTP'}
                        {step === 'reset' && 'Create New Password'}
                    </h2>
                    <p className="text-sm text-text-muted">
                        {step === 'request' && 'Enter your email to receive a reset code.'}
                        {step === 'verify' && 'Enter the 6-digit code sent to your email.'}
                        {step === 'reset' && 'Enter your new password below.'}
                    </p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm font-medium text-center">
                        {error}
                    </div>
                )}
                {message && (
                    <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-500 text-sm font-medium text-center">
                        {message}
                    </div>
                )}

                {step === 'request' && (
                    <form onSubmit={handleRequestOtp} className="space-y-5">
                        <div>
                            <label className="block text-sm font-semibold text-text-main mb-2">Email address</label>
                            <input 
                                type="email" 
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full h-12 bg-background/50 border border-border rounded-xl px-4 text-text-main placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                placeholder="your@email.com"
                            />
                        </div>
                        <button 
                            type="submit" 
                            disabled={isLoading}
                            className="w-full h-12 bg-primary hover:bg-orange-600 text-white font-bold rounded-xl shadow-lg shadow-primary/30 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed mt-2"
                        >
                            {isLoading ? 'Sending...' : 'Send Reset Code'}
                        </button>
                    </form>
                )}

                {step === 'verify' && (
                    <form onSubmit={handleVerifyOtp} className="space-y-5">
                        <div>
                            <label className="block text-sm font-semibold text-text-main mb-2">Verification Code</label>
                            <input 
                                type="text" 
                                required
                                maxLength={6}
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                className="w-full h-12 bg-background/50 border border-border rounded-xl px-4 text-text-main placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-center tracking-widest text-lg font-bold"
                                placeholder="000000"
                            />
                        </div>
                        <button 
                            type="submit" 
                            disabled={isLoading}
                            className="w-full h-12 bg-primary hover:bg-orange-600 text-white font-bold rounded-xl shadow-lg shadow-primary/30 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed mt-2"
                        >
                            {isLoading ? 'Verifying...' : 'Verify Code'}
                        </button>
                    </form>
                )}

                {step === 'reset' && (
                    <form onSubmit={handleResetPassword} className="space-y-5">
                        <div>
                            <label className="block text-sm font-semibold text-text-main mb-2">New Password</label>
                            <input 
                                type="password" 
                                required
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full h-12 bg-background/50 border border-border rounded-xl px-4 text-text-main placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                placeholder="••••••••"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-text-main mb-2">Confirm Password</label>
                            <input 
                                type="password" 
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full h-12 bg-background/50 border border-border rounded-xl px-4 text-text-main placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                placeholder="••••••••"
                            />
                        </div>
                        <button 
                            type="submit" 
                            disabled={isLoading}
                            className="w-full h-12 bg-primary hover:bg-orange-600 text-white font-bold rounded-xl shadow-lg shadow-primary/30 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed mt-2"
                        >
                            {isLoading ? 'Resetting...' : 'Reset Password'}
                        </button>
                    </form>
                )}

                <p className="text-center text-sm text-text-muted mt-8">
                    <button 
                        onClick={() => navigate('/login')} 
                        className="font-bold text-primary hover:text-orange-500 transition-colors"
                    >
                        Back to login
                    </button>
                </p>
            </div>
        </div>
    );
};
