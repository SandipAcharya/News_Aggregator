

export const AboutUs = () => {
  return (
    <div className="bg-white dark:bg-surface rounded-xl shadow-sm border border-gray-100 p-8 max-w-4xl mx-auto my-8">
      <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-6" style={{ fontFamily: 'var(--font-serif)' }}>
        About Us
      </h1>
      <div className="space-y-4 text-gray-700 dark:text-gray-300">
        <p className="leading-relaxed">
          Welcome to Bichar Bimarsh Media. We are dedicated to providing you with the most accurate, reliable, and unbiased news coverage from around the globe, with a special focus on local issues that matter most to our community.
        </p>
        <p className="leading-relaxed">
          Founded with the principle of "सत्य, तथ्य र निष्पक्ष समाचार" (Truth, Fact, and Impartial News), our mission is to empower citizens with the knowledge they need to make informed decisions in a rapidly changing world.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 pt-8 border-t border-gray-100">
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
            <h3 className="font-bold text-primary mb-2">Our Vision</h3>
            <p className="text-sm">To be the most trusted source of news in the region.</p>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
            <h3 className="font-bold text-primary mb-2">Our Mission</h3>
            <p className="text-sm">Delivering truth with integrity and speed.</p>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
            <h3 className="font-bold text-primary mb-2">Our Values</h3>
            <p className="text-sm">Accuracy, Fairness, and Independence.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
