import React, { useState } from 'react';
import { Share2, Twitter, Facebook, Linkedin, Link, Check } from 'lucide-react';

interface SocialShareProps {
  className?: string;
}

export function SocialShare({ className = '' }: SocialShareProps) {
  const [copied, setCopied] = useState(false);
  
  const shareData = {
    title: 'Kube Composer - Free Kubernetes YAML Generator',
    text: 'Generate production-ready Kubernetes YAML files in minutes with this amazing visual editor! 🚀',
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
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareData.text)}&url=${encodeURIComponent(shareData.url)}&hashtags=kubernetes,yaml,devops,docker`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareData.url)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareData.url)}`
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <span className="text-sm font-medium text-gray-700">Share:</span>
      
      {/* Native Share (mobile) */}
      {navigator.share && (
        <button
          onClick={handleNativeShare}
          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
          title="Share"
        >
          <Share2 className="w-4 h-4" />
        </button>
      )}
      
      {/* Twitter */}
      <a
        href={shareUrls.twitter}
        target="_blank"
        rel="noopener noreferrer"
        className="p-2 text-gray-500 hover:text-blue-400 hover:bg-blue-50 rounded-lg transition-colors duration-200"
        title="Share on Twitter"
      >
        <Twitter className="w-4 h-4" />
      </a>
      
      {/* Facebook */}
      <a
        href={shareUrls.facebook}
        target="_blank"
        rel="noopener noreferrer"
        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
        title="Share on Facebook"
      >
        <Facebook className="w-4 h-4" />
      </a>
      
      {/* LinkedIn */}
      <a
        href={shareUrls.linkedin}
        target="_blank"
        rel="noopener noreferrer"
        className="p-2 text-gray-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors duration-200"
        title="Share on LinkedIn"
      >
        <Linkedin className="w-4 h-4" />
      </a>
      
      {/* Copy Link */}
      <button
        onClick={handleCopyLink}
        className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors duration-200"
        title="Copy link"
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