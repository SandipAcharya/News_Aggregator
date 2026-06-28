export const Footer = () => {
    return (
        <footer className="w-full bg-primary dark:bg-surface border-t border-border mt-auto shadow-2xl relative z-50">
            <div className="max-w-screen-xl mx-auto px-4 sm:px-8 py-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                    {/* Brand Section */}
                    <div className="flex flex-col items-center md:items-start text-center md:text-left">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-sm overflow-hidden shrink-0 border-2 border-primary flex items-center justify-center bg-primary shadow-lg">
                                <img src="/logo.jpeg" alt="Logo" className="w-full h-full object-cover" />
                            </div>
                            <div>
                                <div className="text-xl font-black text-white tracking-tight" style={{ fontFamily: 'var(--font-serif)' }}>
                                    BICHAR BIMARSH
                                </div>
                                <div className="text-[10px] font-bold tracking-[0.3em] text-primary">
                                    MEDIA
                                </div>
                            </div>
                        </div>
                        <p className="text-sm text-white/70 font-medium">
                            सत्य, तथ्य र निष्पक्ष समाचार
                        </p>
                    </div>

                    {/* Newsletter CTA */}
                    <div className="flex flex-col items-center justify-center space-y-2">
                        <p className="text-xs font-black tracking-widest text-primary uppercase">
                            Subscribe for Updates
                        </p>
                        <div className="flex w-full max-w-sm gap-2">
                            <input
                                type="email"
                                placeholder="Email address..."
                                className="flex-1 h-8 px-3 rounded-lg border border-white/20 bg-white/5 text-white placeholder-white/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm transition-all"
                            />
                            <button className="h-8 px-4   hover:bg-primary-dark text-white font-bold rounded-lg text-sm transition-all shadow-md hover:shadow-primary/20">
                                Join
                            </button>
                        </div>
                    </div>

                    {/* Social & Legal */}
                    <div className="flex flex-col items-center md:items-end justify-center space-y-2">
                        <div className="flex items-center gap-4">
                            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-white/100 flex items-center justify-center text-white hover:bg-[#1877F2] transition-colors" aria-label="Facebook">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/>
                                </svg>
                            </a>
                            <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-white/100 flex items-center justify-center text-white hover:bg-white hover:text-black transition-colors" aria-label="TikTok">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.01.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.53 2.87 1.52-.09 2.82-1.29 3.09-2.77.16-1.16.14-2.33.15-3.51.01-4.32.02-8.65.02-12.98.01-.13-.01-.26-.03-.39z" />
                                </svg>
                            </a>
                        </div>
                        <div className="flex gap-3 text-[11px] text-white/100 font-medium">
                            <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
                            <span>|</span>
                            <a href="#" className="hover:text-primary transition-colors">Terms of Use</a>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Bottom bar */}
            <div className="w-full bg-[#11111a] py-2 text-center">
                <p className="text-[10px] text-white/100 tracking-wider">
                    &copy; {new Date().getFullYear()} BICHAR BIMARSH MEDIA. ALL RIGHTS RESERVED.
                </p>
            </div>
        </footer>
    );
};
