

export const Advertise = () => {
  return (
    <div className="bg-white dark:bg-surface rounded-xl shadow-sm border border-gray-100 p-8 max-w-4xl mx-auto my-8">
      <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-6" style={{ fontFamily: 'var(--font-serif)' }}>
        Advertise With Us
      </h1>
      <div className="space-y-6">
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
          Reach a diverse and engaged audience by advertising with Bichar Bimarsh Media. We offer a variety of advertising solutions tailored to meet your marketing goals.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Display Advertising</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Premium placement across our homepage and article pages. Maximize your brand visibility.
            </p>
            <ul className="list-disc pl-5 text-sm text-gray-700 dark:text-gray-300 space-y-1">
              <li>Leaderboard (728x90)</li>
              <li>Medium Rectangle (300x250)</li>
              <li>Half Page (300x600)</li>
            </ul>
          </div>
          <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Sponsored Content</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Engage our readers with native content that blends seamlessly with our editorial articles.
            </p>
            <ul className="list-disc pl-5 text-sm text-gray-700 dark:text-gray-300 space-y-1">
              <li>Sponsored Articles</li>
              <li>Featured Interviews</li>
              <li>Product Reviews</li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 p-6 bg-primary/10 rounded-lg border border-primary/20">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Get in Touch</h3>
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
            For rates, media kits, and custom packages, please contact our advertising team.
          </p>
          <a href="mailto:ads@bicharbimarsh.com" className="inline-block px-6 py-2 bg-primary text-white font-bold rounded-lg hover:bg-primary-dark transition-colors shadow-md">
            Email Advertising Team
          </a>
        </div>
      </div>
    </div>
  );
};
