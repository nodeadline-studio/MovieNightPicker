import React from 'react';
import { ArrowLeft, Calendar, CheckSquare, Users, Zap, Award, Rocket, Bookmark } from 'lucide-react';
import { Link } from 'react-router-dom';

interface RoadmapItem {
  version: string;
  title: string;
  description: string;
  features: string[];
  status: 'completed' | 'in-progress' | 'planned';
  icon: React.ReactNode;
}

const Roadmap: React.FC = () => {
  const roadmapItems: RoadmapItem[] = [
    {
      version: '1.0',
      title: 'Initial Release',
      description: 'Core movie picker functionality with basic filters and watchlist.',
      features: [
        'Random movie recommendation engine',
        'Basic filtering (genre, year, rating)',
        'Movie details display',
        'Watchlist functionality',
        'Mobile-responsive design',
      ],
      status: 'completed',
      icon: <Rocket />,
    },
    {
      version: '1.1',
      title: 'User Accounts',
      description: 'Personalized experience with user accounts and preferences.',
      features: [
        'User registration and login',
        'Cloud-synced watchlists',
        'User profiles with preferences',
        'Email notifications for new recommendations',
      ],
      status: 'in-progress',
      icon: <Users />,
    },
    {
      version: '1.2',
      title: 'Advanced Filtering',
      description: 'More customization options for finding the perfect movie.',
      features: [
        'Streaming service availability filters',
        'Language and country options',
        'Runtime filters (short, medium, long)',
        'Advanced genre combinations',
        'Director and actor filters',
      ],
      status: 'planned',
      icon: <CheckSquare />,
    },
    {
      version: '1.3',
      title: 'Social Features',
      description: 'Share and discover movies with friends.',
      features: [
        'Friend connections',
        'Shared watchlists',
        'Movie recommendations for groups',
        'Social media sharing',
        'Activity feed',
      ],
      status: 'planned',
      icon: <Users />,
    },
    {
      version: '1.4',
      title: 'Premium Features & Monetization',
      description: 'Premium features and ad-based monetization model.',
      features: [
        'Ad-free experience for premium users',
        'Advanced recommendation algorithm',
        'Personalized weekly movie picks',
        'Unlimited watchlists',
        'Priority feature access',
      ],
      status: 'planned',
      icon: <Award />,
    },
    {
      version: '2.0',
      title: 'Expansion to TV Shows',
      description: 'Bringing the random picker experience to TV series.',
      features: [
        'TV show random picker',
        'Season and episode recommendations',
        'Binge-worthy show suggestions',
        'Combined movie and TV recommendations',
        'Watch time estimates',
      ],
      status: 'planned',
      icon: <Zap />,
    },
  ];

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'in-progress':
        return 'bg-blue-500';
      case 'planned':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="mb-12">
          <Link to="/" className="inline-flex items-center text-gray-400 hover:text-white mb-6 transition-colors">
            <ArrowLeft size={16} className="mr-2" />
            Back to Movie Picker
          </Link>
          <h1 className="text-4xl font-bold mb-4">Development Roadmap</h1>
          <p className="text-gray-400 max-w-3xl">
            Here's our plan for NightMoviePicker development. We're committed to continually improving
            the app with new features and enhancements based on user feedback.
          </p>
        </div>

        <div className="space-y-8 relative">
          <div className="absolute left-[39px] top-8 bottom-0 w-1 bg-gray-800"></div>
          
          {roadmapItems.map((item, index) => (
            <div 
              key={index} 
              className="flex relative"
            >
              <div className={`flex-shrink-0 w-20 h-20 rounded-full ${getStatusClass(item.status)} flex items-center justify-center z-10 text-white`}>
                {item.icon}
              </div>
              
              <div className="ml-8 bg-gray-900 border border-gray-800 rounded-xl p-6 flex-1 relative">
                <div className="absolute top-6 left-[-16px] h-0 w-0 border-t-8 border-r-16 border-b-8 border-gray-900 border-r-gray-900 border-t-transparent border-b-transparent"></div>
                
                <div className="flex flex-wrap justify-between items-start mb-3">
                  <div>
                    <div className="px-3 py-1 rounded-full bg-gray-800 text-sm text-gray-300 inline-block mb-2">
                      Version {item.version}
                    </div>
                    <h3 className="text-2xl font-bold mb-2">{item.title}</h3>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm ${getStatusClass(item.status)} text-white uppercase font-semibold`}>
                    {item.status}
                  </div>
                </div>
                
                <p className="text-gray-400 mb-4">{item.description}</p>
                
                <h4 className="font-semibold text-white mb-2">Key Features:</h4>
                <ul className="space-y-2">
                  {item.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start">
                      <CheckSquare size={16} className="text-gray-500 mr-2 mt-1 flex-shrink-0" />
                      <span className="text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-12 bg-gray-900 rounded-xl p-6 border border-gray-800">
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            <Bookmark className="mr-2 text-blue-500" /> 
            Have Suggestions?
          </h2>
          <p className="text-gray-400 mb-4">
            We'd love to hear your ideas for future features! This roadmap is flexible and we're always looking
            to improve NightMoviePicker based on user feedback.
          </p>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Submit Feedback
          </button>
        </div>
      </div>
    </div>
  );
};

export default Roadmap;