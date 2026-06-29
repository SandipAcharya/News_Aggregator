import { Link } from 'react-router-dom';
import { Mail, MapPin, Phone, ArrowRight } from 'lucide-react';

const QUICK_LINKS = [
  { to: '/about', label: 'About Us' },
  { to: '/contact', label: 'Contact' },
  { to: '/advertise', label: 'Advertise With Us' },
];

const CATEGORIES = [
  'Business', 'Health', 'Technology', 'Science', 'Politics', 'Sports',
];

export const Footer = () => {
  return (
    <footer className="w-full mt-auto relative z-50 overflow-hidden">
      {/* Gold accent strip */}
      <div className="h-1 w-full bg-gradient-to-r from-accent/60 via-accent to-accent/60" />

      <div className="bg-gradient-to-b from-navy to-[#001528] text-white relative">
        {/* Decorative blurs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-accent/10 blur-3xl" />
        </div>

        <div className="max-w-screen-xl mx-auto px-4 sm:px-8 py-14 relative z-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">

            {/* Brand */}
            <div className="space-y-5">
              <Link to="/" className="inline-block">
                <img
                  src="/logo.jpeg"
                  alt="Bichar Bimarsh Media"
                  className="h-14 w-auto "
                />
              </Link>
              <p className="text-sm text-white/70 leading-relaxed max-w-xs">
                सत्य, तथ्य र निष्पक्ष समाचार — your trusted source for thoughtful journalism and balanced reporting from Nepal and beyond.
              </p>
              <p className="text-[10px] font-bold tracking-[0.25em] text-accent uppercase">
                Estd 2025
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-accent mb-5">
                Quick Links
              </h3>
              <ul className="space-y-3">
                {QUICK_LINKS.map(({ to, label }) => (
                  <li key={to}>
                    <Link
                      to={to}
                      className="text-sm text-white/70 hover:text-white hover:translate-x-0.5 inline-flex items-center gap-1.5 transition-all duration-200"
                    >
                      <ArrowRight size={12} className="text-accent opacity-0 -ml-4 group-hover:opacity-100" />
                      {label}
                    </Link>
                  </li>
                ))}
                <li>
                  <a href="#" className="text-sm text-white/70 hover:text-white transition-colors">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm text-white/70 hover:text-white transition-colors">
                    Terms of Use
                  </a>
                </li>
              </ul>
            </div>

            {/* Categories */}
            <div>
              <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-accent mb-5">
                Categories
              </h3>
              <ul className="grid grid-cols-2 gap-x-4 gap-y-3">
                {CATEGORIES.map((cat) => (
                  <li key={cat}>
                    <Link
                      to="/"
                      className="text-sm text-white/70 hover:text-white transition-colors"
                    >
                      {cat}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Newsletter + Contact */}
            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-accent mb-5">
                  Stay Informed
                </h3>
                <p className="text-sm text-white/60 mb-4">
                  Get the latest headlines delivered to your inbox every morning.
                </p>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
                    <input
                      type="email"
                      placeholder="your@email.com"
                      className="w-full h-10 pl-9 pr-3 rounded-lg border border-white/15 bg-white/8 text-white placeholder-white/35 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/40 text-sm transition-all"
                    />
                  </div>
                  <button className="h-10 px-5 bg-accent hover:bg-accent/90 text-navy font-bold rounded-lg text-sm transition-all shrink-0">
                    Join
                  </button>
                </div>
              </div>

              <div className="space-y-2.5 pt-2 border-t border-white/10">
                <a href="mailto:info@bicharbimarsh.com" className="flex items-center gap-2.5 text-sm text-white/60 hover:text-white transition-colors">
                  <Mail size={14} className="text-accent shrink-0" />
                  info@bicharbimarsh.com
                </a>
                <p className="flex items-center gap-2.5 text-sm text-white/60">
                  <Phone size={14} className="text-accent shrink-0" />
                  +977 1-XXXXXXX
                </p>
                <p className="flex items-start gap-2.5 text-sm text-white/60">
                  <MapPin size={14} className="text-accent shrink-0 mt-0.5" />
                  Kathmandu, Nepal
                </p>
              </div>
            </div>
          </div>

          {/* Social + bottom row */}
          <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold tracking-wider text-white/50 uppercase mr-1">Follow Us</span>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white hover:bg-[#1877F2] transition-all hover:scale-105"
                aria-label="Facebook"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/>
                </svg>
              </a>
              <a
                href="https://tiktok.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-black  flex items-center justify-center text-white hover:bg-black transition-all hover:scale-105"
                aria-label="TikTok"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.01.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.53 2.87 1.52-.09 2.82-1.29 3.09-2.77.16-1.16.14-2.33.15-3.51.01-4.32.02-8.65.02-12.98.01-.13-.01-.26-.03-.39z" />
                </svg>
              </a>
            </div>

            <p className="text-[11px] text-white/40 tracking-wider text-center sm:text-right">
              &copy; {new Date().getFullYear()} Bichar Bimarsh Media. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
