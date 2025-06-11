import { useState } from 'react';
import { Share2, Twitter, Facebook, Linkedin, Link, Check } from 'lucide-react';

interface SocialShareProps {
  className?: string;
}

export function SocialShare({ className = '' }: SocialShareProps) {
  const [copied, setCopied] = useState(false);
  
  const shareData = {
    title: 'Kube Composer - Free Kubernetes YAML Generator',
    text: 'Just discovered this amazing tool! 🚀 Generate production-ready Kubernetes YAML files in minutes with a visual editor. No more manual YAML writing! Perfect for developers and DevOps teams. #kubernetes #yaml #devops #docker #k8s',
    url: 'https://kube-composer.com'
  };

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

  const shareUrls = {
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareData.text)}&url=${encodeURIComponent(shareData.url)}&hashtags=kubernetes,yaml,devops,docker,k8s,deployment,free,tool`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareData.url)}&quote=${encodeURIComponent('Generate production-ready Kubernetes YAML files in minutes with this amazing visual editor! Perfect for developers and DevOps teams.')}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareData.url)}&title=${encodeURIComponent(shareData.title)}&summary=${encodeURIComponent('Generate production-ready Kubernetes YAML files in minutes with our intuitive visual editor. Perfect for developers and DevOps teams.')}`
  };

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      <span className="text-xs font-medium text-gray-600 hidden sm:inline">Share:</span>
      
      {/* Native Share (mobile) */}
      {typeof navigator.share === 'function' && (
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