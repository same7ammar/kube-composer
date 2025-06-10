import { useState, useEffect } from 'react';

interface UsageStats {
  totalGenerations: number;
  lastUpdated: string;
}

const STORAGE_KEY = 'kube-composer-usage-stats';
const API_ENDPOINT = 'https://api.countapi.xyz/hit/kube-composer/downloads';

export function useUsageCounter() {
  const [stats, setStats] = useState<UsageStats>({
    totalGenerations: 0,
    lastUpdated: new Date().toISOString()
  });
  const [isLoading, setIsLoading] = useState(true);

  // Load initial stats from localStorage and API
  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // Load from localStorage first for immediate display
      const localStats = localStorage.getItem(STORAGE_KEY);
      if (localStats) {
        const parsed = JSON.parse(localStats);
        setStats(parsed);
      }

      // Then try to get updated stats from API
      const response = await fetch('https://api.countapi.xyz/get/kube-composer/downloads');
      if (response.ok) {
        const data = await response.json();
        const updatedStats = {
          totalGenerations: data.value || 0,
          lastUpdated: new Date().toISOString()
        };
        setStats(updatedStats);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedStats));
      }
    } catch (error) {
      console.log('Could not load usage stats:', error);
      // Fallback to localStorage only
    } finally {
      setIsLoading(false);
    }
  };

  const incrementCounter = async () => {
    try {
      // Increment local counter immediately for responsive UI
      const newStats = {
        totalGenerations: stats.totalGenerations + 1,
        lastUpdated: new Date().toISOString()
      };
      setStats(newStats);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newStats));

      // Try to increment remote counter
      const response = await fetch(API_ENDPOINT);
      if (response.ok) {
        const data = await response.json();
        const updatedStats = {
          totalGenerations: data.value,
          lastUpdated: new Date().toISOString()
        };
        setStats(updatedStats);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedStats));
      }
    } catch (error) {
      console.log('Could not increment usage counter:', error);
      // Local increment still works even if API fails
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