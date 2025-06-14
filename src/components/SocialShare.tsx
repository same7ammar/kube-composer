import { useState, useEffect } from 'react';
import { Share2, Twitter, Facebook, Linkedin, Link, Check, Star, Github } from 'lucide-react';

interface SocialShareProps {
  className?: string;
}

interface GitHubRepo {
  stargazers_count: number;
  name: string;
  full_name: string;
}

export function SocialShare({ className = '' }: SocialShareProps) {
  const [copied, setCopied] = useState(false);
  const [starCount, setStarCount] = useState<number | null>(null);
  const [isLoadingStars, setIsLoadingStars] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  
  const shareData = {
    title: 'Kube Composer - Free Kubernetes YAML Generator',
    text: 'Just discovered this amazing tool! 🚀 Generate production-ready Kubernetes YAML files in minutes with a visual editor. No more manual YAML writing! Perfect for developers and DevOps teams. #kubernetes #yaml #devops #docker #k8s',
    url: 'https://kube-composer.com'
  };

  // Fetch GitHub star count
  useEffect(() => {
    const fetchStarCount = async () => {
      try {
        setIsLoadingStars(true);
        setApiError(null);
        
        // Check cache first (cache for 5 minutes for debugging)
        const cacheKey = 'github-stars-kube-composer';
        const cached = localStorage.getItem(cacheKey);
        
        if (cached) {
          const { count, timestamp } = JSON.parse(cached);
          const fiveMinutes = 5 * 60 * 1000; // Reduced cache time for debugging
          
          if (Date.now() - timestamp < fiveMinutes) {
            console.log('Using cached star count:', count);
            setStarCount(count);
            setIsLoadingStars(false);
            return;
          }
        }

        console.log('Fetching GitHub stars from API...');
        
        // Fetch from GitHub API
        const response = await fetch('https://api.github.com/repos/same7ammar/kube-composer', {
          headers: {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'kube-composer-app'
          },
        });

        console.log('GitHub API response status:', response.status);

        if (response.ok) {
          const data: GitHubRepo = await response.json();
          console.log('GitHub API response data:', data);
          
          const stars = data.stargazers_count || 0;
          console.log('Star count from API:', stars);
          
          setStarCount(stars);
          
          // Cache the result
          localStorage.setItem(cacheKey, JSON.stringify({
            count: stars,
            timestamp: Date.now()
          }));
        } else {
          const errorText = await response.text();
          console.error('GitHub API error:', response.status, errorText);
          setApiError(`API Error: ${response.status}`);
          
          // Try to use cached value even if expired
          if (cached) {
            const { count } = JSON.parse(cached);
            setStarCount(count);
          } else {
            setStarCount(0);
          }
        }
      } catch (error) {
        console.error('Error fetching GitHub stars:', error);
        setApiError('Network Error');
        
        // Try to use cached value even if expired
        const cached = localStorage.getItem('github-stars-kube-composer');
        if (cached) {
          try {
            const { count } = JSON.parse(cached);
            setStarCount(count);
          } catch {
            setStarCount(0);
          }
        } else {
          setStarCount(0);
        }
      } finally {
        setIsLoadingStars(false);
      }
    };

    fetchStarCount();
  }, []);

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Error sharing:', err);
      }
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareData.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const formatStarCount = (count: number): string => {
    if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'k';
    }
    return count.toString();
  };

  const shareUrls = {
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareData.text)}&url=${encodeURIComponent(shareData.url)}&hashtags=kubernetes,yaml,devops,docker,k8s,deployment,free,tool`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareData.url)}&quote=${encodeURIComponent('Generate production-ready Kubernetes YAML files in minutes with this amazing visual editor! Perfect for developers and DevOps teams.')}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareData.url)}&title=${encodeURIComponent(shareData.title)}&summary=${encodeURIComponent('Generate production-ready Kubernetes YAML files in minutes with our intuitive visual editor. Perfect for developers and DevOps teams.')}`
  };

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      <span className="text-xs font-medium text-gray-600 hidden sm:inline">Share:</span>
      
      {/* Enhanced GitHub Star Button with Star Count */}
      <a
        href="https://github.com/same7ammar/kube-composer"
        target="_blank"
        rel="noopener noreferrer"
        className="group inline-flex items-center space-x-2 px-3 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition-all duration-200 text-xs font-medium shadow-md hover:shadow-lg transform hover:scale-105"
        title={`Star on GitHub${starCount !== null ? ` (${starCount} stars)` : ''}`}
        aria-label="Star Kube Composer on GitHub"
      >
        <div className="flex items-center space-x-1">
          <Github className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
          <Star className="w-4 h-4 text-yellow-400 group-hover:text-yellow-300 group-hover:scale-110 transition-all duration-200" />
        </div>
        <div className="flex items-center space-x-1">
          <span className="group-hover:text-yellow-100 transition-colors duration-200">
            Star
          </span>
          {!isLoadingStars && starCount !== null && (
            <span className="bg-gray-700 group-hover:bg-gray-600 px-2 py-0.5 rounded-full text-xs font-bold text-yellow-300 group-hover:text-yellow-200 transition-all duration-200 min-w-[1.5rem] text-center">
              {formatStarCount(starCount)}
            </span>
          )}
          {isLoadingStars && (
            <div className="bg-gray-700 px-2 py-0.5 rounded-full">
              <div className="w-4 h-3 bg-gray-600 rounded animate-pulse"></div>
            </div>
          )}
          {apiError && !isLoadingStars && (
            <span className="bg-red-700 px-2 py-0.5 rounded-full text-xs font-bold text-red-200" title={apiError}>
              ?
            </span>
          )}
        </div>
      </a>
      
      {/* Native Share (mobile) */}
      {typeof navigator !== 'undefined' && navigator.share && (
        <button
          onClick={handleNativeShare}
          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
          title="Share Kube Composer"
          aria-label="Share this tool"
        >
          <Share2 className="w-4 h-4" />
        </button>
      )}
      
      {/* Twitter */}
      <a
        href={shareUrls.twitter}
        target="_blank"
        rel="noopener noreferrer"
        className="p-1.5 text-gray-500 hover:text-blue-400 hover:bg-blue-50 rounded-lg transition-colors duration-200"
        title="Share on Twitter"
        aria-label="Share Kube Composer on Twitter"
      >
        <Twitter className="w-4 h-4" />
      </a>
      
      {/* Facebook */}
      <a
        href={shareUrls.facebook}
        target="_blank"
        rel="noopener noreferrer"
        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
        title="Share on Facebook"
        aria-label="Share Kube Composer on Facebook"
      >
        <Facebook className="w-4 h-4" />
      </a>
      
      {/* LinkedIn */}
      <a
        href={shareUrls.linkedin}
        target="_blank"
        rel="noopener noreferrer"
        className="p-1.5 text-gray-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors duration-200"
        title="Share on LinkedIn"
        aria-label="Share Kube Composer on LinkedIn"
      >
        <Linkedin className="w-4 h-4" />
      </a>
      
      {/* Copy Link */}
      <button
        onClick={handleCopyLink}
        className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors duration-200"
        title={copied ? 'Link copied!' : 'Copy link'}
        aria-label="Copy link to Kube Composer"
      >
        {copied ? (
          <Check className="w-4 h-4 text-green-600" />
        ) : (
          <Link className="w-4 h-4" />
        )}
      </button>
    </div>
  );
}