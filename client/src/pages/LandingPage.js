import React, { useState } from 'react';
import { Link } from 'react-router-dom';

function LandingPage({ isDark = false }) {
  const [selectedFeature, setSelectedFeature] = useState(null);

  const features = [
    {
      id: 1,
      icon: "🔍",
      title: "Smart Detection",
      description: "AI-powered similarity detection finds related bugs automatically",
      fullDescription: "Our advanced AI engine analyzes bug descriptions, error messages, and stack traces to automatically detect similar bugs in your system. This saves your team countless hours of manual searching and helps prevent duplicate bug reports. The system learns over time and gets smarter with every new bug you report."
    },
    {
      id: 2,
      icon: "📊",
      title: "Analytics Dashboard",
      description: "Track bugs by severity, status, and create detailed reports",
      fullDescription: "Get comprehensive insights into your software quality with detailed analytics. Track metrics like bug distribution by severity, status breakdown, resolution time, and team performance. Generate beautiful visual reports that help stakeholders understand the health of your project. Make data-driven decisions about resource allocation and priorities."
    },
    {
      id: 3,
      icon: "🔐",
      title: "Privacy Control",
      description: "Mark bugs as public or private to control visibility",
      fullDescription: "Control who sees your bugs with granular privacy settings. Mark sensitive bugs as private to keep them visible only to your team and administrators. Public bugs can be shared with stakeholders and external teams. Perfect for open-source projects that want selective transparency while protecting proprietary information."
    },
    {
      id: 4,
      icon: "👥",
      title: "Team Collaboration",
      description: "Work together with role-based access and permissions",
      fullDescription: "Enable seamless collaboration across your team with role-based access control. Assign different permissions to team members - admins manage users and settings, while regular users report and track bugs. Comment on bugs, assign them to colleagues, and keep everyone in the loop. Real-time updates ensure your team is always synchronized."
    },
    {
      id: 5,
      icon: "🏷️",
      title: "Tagging System",
      description: "Organize bugs with custom tags for better categorization",
      fullDescription: "Create custom tags to organize bugs by component, priority, feature, or any category that makes sense for your team. Use tags like 'UI', 'API', 'Database', 'Critical', 'Enhancement', etc. Filter and search bugs by tags for faster navigation. Build a knowledge base of your software's structure through organized tagging."
    },
    {
      id: 6,
      icon: "⚡",
      title: "Fast Search",
      description: "Quickly find bugs with powerful search and filtering",
      fullDescription: "Search your entire bug database in milliseconds with our powerful full-text search. Filter by status, severity, date, tags, assigned user, and more. Save your favorite filter combinations for quick access. Find exactly what you're looking for without wasting time scrolling through hundreds of bugs."
    }
  ];

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-300 ${isDark ? 'bg-slate-900 text-slate-50' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* Navigation */}
      <nav className={`sticky top-0 z-50 px-6 py-4 flex justify-between items-center border-b backdrop-blur-md transition-colors duration-300 ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white/80 border-slate-200'}`}>
        <div className="text-2xl font-extrabold flex items-center gap-2 cursor-pointer transform hover:scale-105 transition-transform">
          <span className="text-3xl">🐛</span>
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-violet-500">
            BugRadar
          </span>
        </div>
        <div className="flex gap-4">
          <Link to="/admin/login">
            <button className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all transform hover:-translate-y-0.5 ${isDark ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}>
              Admin
            </button>
          </Link>
          <Link to="/login">
            <button className={`px-4 py-2 text-sm font-semibold rounded-lg border transition-all shadow-sm hover:shadow-md transform hover:-translate-y-0.5 ${isDark ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-300 text-slate-700 hover:bg-slate-100'}`}>
              Sign In
            </button>
          </Link>
          <Link to="/register">
            <button className="px-5 py-2 text-sm font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.23)] transform hover:-translate-y-0.5 transition-all">
              Get Started
            </button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className={`flex-1 flex flex-col items-center justify-center p-8 md:p-16 relative overflow-hidden ${isDark ? 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-slate-900' : 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50 via-white to-blue-50'}`}>
        
        {/* Decorative blur blobs */}
        <div className="absolute top-0 left-10 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 right-10 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>

        <div className="max-w-4xl text-center relative z-10 w-full animate-fade-in-up">
          <h1 className={`text-5xl md:text-6xl font-extrabold mb-6 tracking-tight leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Smart Bug Tracking & <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-600">
              Management
            </span>
          </h1>
          <p className={`text-xl mb-10 max-w-2xl mx-auto leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            BugRadar is an intelligent bug tracking system that helps teams
            discover, organize, and resolve issues efficiently. With AI-powered
            clustering and similarity detection, find related bugs instantly.
          </p>

          <div className="flex justify-center gap-4 mb-20">
            <Link to="/register">
              <button className="px-8 py-4 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-blue-500/50 transform hover:-translate-y-1 transition-all">
                Start Tracking Bugs
              </button>
            </Link>
            <Link to="/login">
              <button className={`px-8 py-4 rounded-xl font-bold border-2 transition-all transform hover:-translate-y-1 ${isDark ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-blue-600 text-blue-600 hover:bg-blue-50/50'}`}>
                Sign In
              </button>
            </Link>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full text-left">
            {features.map((feature, idx) => (
              <FeatureCard 
                key={feature.id} 
                feature={feature} 
                isDark={isDark} 
                onClick={() => setSelectedFeature(feature)} 
                delay={idx * 100}
              />
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className={`py-8 text-center border-t transition-colors duration-300 ${isDark ? 'bg-slate-900 border-slate-800 text-slate-500' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
        <p>© 2026 BugRadar. Built with ❤️ and AI magic.</p>
      </footer>

      {/* Modal Overlay */}
      {selectedFeature && (
        <FeatureModal feature={selectedFeature} isDark={isDark} onClose={() => setSelectedFeature(null)} />
      )}

    </div>
  );
}

// Sub-components

function FeatureCard({ feature, isDark, onClick, delay }) {
  return (
    <div 
      onClick={onClick}
      className={`p-8 rounded-2xl cursor-pointer transition-all duration-300 transform hover:-translate-y-2 group border backdrop-blur-sm ${
        isDark 
          ? 'bg-slate-800/50 border-slate-700 hover:border-blue-500 hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)]' 
          : 'bg-white/80 border-slate-200 hover:border-blue-500 hover:shadow-xl'
      }`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="text-4xl mb-4 transform transition-transform group-hover:scale-110 origin-left">
        {feature.icon}
      </div>
      <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
        {feature.title}
      </h3>
      <p className={`text-sm mb-6 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
        {feature.description}
      </p>
      <div className="text-sm font-semibold text-blue-500 flex items-center gap-1 group-hover:gap-2 transition-all">
        Learn more <span className="text-lg">→</span>
      </div>
    </div>
  );
}

function FeatureModal({ feature, isDark, onClose }) {
  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div 
        className={`relative w-full max-w-2xl rounded-2xl shadow-2xl p-8 md:p-12 animate-slide-up ${
          isDark ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200'
        }`}
        onClick={e => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className={`absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
            isDark ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
          }`}
        >
          ✕
        </button>

        <div className="text-6xl text-center mb-6">{feature.icon}</div>
        <h2 className={`text-3xl font-extrabold text-center mb-6 ${isDark ? 'text-white' : 'text-slate-900'}`}>
          {feature.title}
        </h2>
        
        <p className={`text-lg leading-relaxed mb-8 text-center ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
          {feature.fullDescription}
        </p>

        <div className={`p-6 rounded-xl mb-8 ${isDark ? 'bg-slate-900/50' : 'bg-slate-50'}`}>
          <h3 className={`text-sm font-bold tracking-wider uppercase mb-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Key Benefits
          </h3>
          <ul className="space-y-3">
            {getBenefits(feature.id).map(benefit => (
              <li key={benefit} className={`flex items-start gap-3 text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                <span className="text-green-500 mt-0.5">✓</span>
                {benefit}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex justify-end gap-3">
          <button 
            onClick={onClose}
            className={`px-6 py-2.5 rounded-lg font-semibold transition-colors ${
              isDark ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            Close
          </button>
          <Link to="/register" onClick={onClose}>
            <button className="px-6 py-2.5 rounded-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30 transition-all transform hover:-translate-y-0.5">
              Get Started Now
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

function getBenefits(featureId) {
  const benefitsMap = {
    1: ['Automatically finds duplicate bug reports', 'Saves development time and reduces redundancy', 'Improves bug database organization', 'Prevents wasted effort on known issues'],
    2: ['Visual representation of bug metrics', 'Track progress over time', 'Identify patterns and bottlenecks', 'Export reports for stakeholders'],
    3: ['Keep sensitive bugs confidential', 'Control information access by role', 'Perfect for proprietary software', 'Flexible sharing with teams and partners'],
    4: ['Assign bugs to team members', 'Comment and discuss solutions', 'Role-based permissions (Admin/User)', 'Real-time synchronization'],
    5: ['Organize bugs by component or topic', 'Quick filtering and navigation', 'Build knowledge base structure', 'Improve searchability and discoverability'],
    6: ['Search across all bug data', 'Filter by multiple criteria', 'Save favorite filter combinations', 'Lightning-fast results']
  };
  return benefitsMap[featureId] || [];
}

export default LandingPage;
