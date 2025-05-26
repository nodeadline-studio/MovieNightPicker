import React, { useState, useEffect } from 'react';
import { Film, Lock, ChevronRight, Github, ExternalLink, Loader2 } from 'lucide-react';
import Button from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';

const ENCRYPTED_PASSWORD = '0cc175b9c0f1b6a831c399e269772661'; // "artemtest" in md5

const ComingSoon: React.FC = () => {
  const navigate = useNavigate();
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [commitInfo, setCommitInfo] = useState<{ sha: string; date: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const isVerified = localStorage.getItem('password-verified') === 'true';
    if (isVerified) {
      navigate('/app');
    }
  }, [navigate]);

  useEffect(() => {
    // Fetch latest commit info from GitHub
    fetch('https://api.github.com/repos/nodeadline/night-movie-picker/commits/main')
      .then(res => res.json())
      .then(data => {
        if (data && data.sha && data.commit?.author?.date) {
          setCommitInfo({
            sha: data.sha.substring(0, 7),
            date: new Date(data.commit.author.date).toLocaleString()
          });
        }
      })
      .catch(error => {
        console.error('Failed to fetch commit info:', error);
        setCommitInfo(null);
      });
  }, []);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    // In production, this should be a secure hash comparison on the server
    // Simulate network delay
    setTimeout(() => {
      if (password === 'artemtest') {
        localStorage.setItem('password-verified', 'true');
        navigate('/app');
      } else {
        setError('Invalid password');
        setPassword('');
        setIsSubmitting(false);
      }
    }, 800);
  };

  return (
    <div className="min-h-[100dvh] bg-gray-950 text-white flex flex-col">
      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-xl mx-auto text-center mb-8 animate-fadeIn">
          <div className="flex items-center justify-center mb-6">
            <Film className="w-16 h-16 md:w-20 md:h-20 text-red-600" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-red-500 via-red-600 to-red-500 tracking-tight">
            MovieNightPicker
          </h1>
          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto px-4 leading-relaxed">
            Your ultimate movie discovery companion is coming soon. Never waste time deciding what to watch again.
          </p>
        </div>

        <div className="w-full max-w-sm mx-auto space-y-6 text-center animate-fadeIn delay-100 px-4 backdrop-blur-sm bg-gray-900/20 rounded-2xl border border-gray-800/50 p-6">
          {showPasswordInput ? (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    autoFocus
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-gray-800/80 backdrop-blur-sm border border-gray-700 rounded-lg pl-10 pr-4 py-3 w-full focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all"
                    placeholder="Enter password"
                    disabled={isSubmitting}
                  />
                </div>
                {error && (
                  <p className="text-red-500 text-sm mt-2 animate-fadeIn font-medium">
                    {error}
                  </p>
                )}
              </div>
              <Button
                variant="primary"
                type="submit"
                icon={isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <ChevronRight size={18} />}
                disabled={isSubmitting || !password.trim()}
                fullWidth
              >
                {isSubmitting ? 'Verifying...' : 'Access Preview'}
              </Button>
            </form>
          ) : (
            <button
              onClick={() => setShowPasswordInput(true)}
              className="text-gray-400 hover:text-white transition-all text-sm py-3 px-6 rounded-lg hover:bg-gray-800/50 border border-transparent hover:border-gray-700/50 w-full"
            >
              Have a test password?
            </button>
          )}
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-4 md:p-6 bg-gray-900/80 backdrop-blur-sm border-t border-gray-800/50">
          <div className="max-w-6xl mx-auto flex flex-row flex-wrap items-center justify-center md:justify-between gap-4 text-xs md:text-sm text-gray-400">
            <div className="flex items-center gap-4 order-1 md:order-none">
              <span>{currentTime.toLocaleTimeString()}</span>
              {commitInfo && (
                <a
                  href="https://github.com/nodeadline/night-movie-picker"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center hover:text-white transition-colors"
                >
                  <Github size={16} className="mr-1" />
                  <span>#{commitInfo.sha}</span>
                </a>
              )}
            </div>
            <div className="flex items-center gap-4 order-2 md:order-none">
              <a
                href="https://nodeadline.studio"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center hover:text-white transition-colors hover:bg-gray-800/30 px-3 py-1 rounded-full"
              >
                <span>nodeadline.studio</span>
                <ExternalLink size={14} className="ml-1" />
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ComingSoon;