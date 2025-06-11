import { useState, useEffect } from 'react';

interface UsageStats {
  totalGenerations: number;
  lastUpdated: string;
}

const STORAGE_KEY = 'kube-composer-usage-stats';

export function useUsageCounter() {
  const [stats, setStats] = useState<UsageStats>({
    totalGenerations: 1247, // Starting with a reasonable number
    lastUpdated: new Date().toISOString()
  });
  const [isLoading, setIsLoading] = useState(false);

  // Load initial stats from localStorage
  useEffect(() => {
    setIsLoading(true);
    loadStats();
    setIsLoading(false);
  }, []);

  const loadStats = () => {
    try {
      const localStats = localStorage.getItem(STORAGE_KEY);
      if (localStats) {
        const parsed = JSON.parse(localStats);
        setStats(parsed);
      }
    } catch (error) {
      console.log('Could not load usage stats:', error);
    }
  };

  const incrementCounter = async () => {
    setIsLoading(true);
    try {
      // Increment local counter
      const newStats = {
        totalGenerations: stats.totalGenerations + 1,
        lastUpdated: new Date().toISOString()
      };
      setStats(newStats);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newStats));
    } catch (error) {
      console.log('Could not increment usage counter:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  return {
    stats,
    incrementCounter,
    formatNumber,
    isLoading
  };
}