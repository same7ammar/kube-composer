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
  const [isLoading, setIsLoading] = useState(true);

  // Check if localStorage is available
  const isLocalStorageAvailable = () => {
    try {
      return typeof window !== 'undefined' && window.localStorage !== undefined;
    } catch {
      return false;
    }
  };

  // Load initial stats from Supabase
  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setIsLoading(true);
    try {
      // Get environment variables safely
      const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
      const supabaseKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        console.log('Supabase environment variables not configured, using localStorage');
        loadFromLocalStorage();
        return;
      }

      // Try to load from Supabase first
      const response = await fetch(`${supabaseUrl}/functions/v1/increment-downloads`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const newStats = {
          totalGenerations: data.total_downloads || 1247,
          lastUpdated: data.last_updated || new Date().toISOString()
        };
        setStats(newStats);
        
        // Cache in localStorage
        if (isLocalStorageAvailable()) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(newStats));
        }
      } else {
        // Fallback to localStorage
        loadFromLocalStorage();
      }
    } catch (error) {
      console.log('Could not load stats from Supabase, using localStorage:', error);
      loadFromLocalStorage();
    } finally {
      setIsLoading(false);
    }
  };

  const loadFromLocalStorage = () => {
    if (!isLocalStorageAvailable()) {
      return;
    }

    try {
      const localStats = localStorage.getItem(STORAGE_KEY);
      if (localStats) {
        const parsed = JSON.parse(localStats);
        setStats(parsed);
      }
    } catch (error) {
      console.log('Could not load usage stats from localStorage:', error);
    }
  };

  const incrementCounter = async () => {
    try {
      // Optimistically update UI
      const optimisticStats = {
        totalGenerations: stats.totalGenerations + 1,
        lastUpdated: new Date().toISOString()
      };
      setStats(optimisticStats);

      // Get environment variables safely
      const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
      const supabaseKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        // If Supabase not configured, just save to localStorage
        if (isLocalStorageAvailable()) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(optimisticStats));
        }
        return;
      }

      // Try to increment in Supabase
      const response = await fetch(`${supabaseUrl}/functions/v1/increment-downloads`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const newStats = {
          totalGenerations: data.total_downloads,
          lastUpdated: data.last_updated
        };
        setStats(newStats);
        
        // Update localStorage
        if (isLocalStorageAvailable()) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(newStats));
        }
      } else {
        // If Supabase fails, keep the optimistic update and save to localStorage
        if (isLocalStorageAvailable()) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(optimisticStats));
        }
      }
    } catch (error) {
      console.log('Could not increment usage counter in Supabase:', error);
      // Keep the optimistic update and save to localStorage
      if (isLocalStorageAvailable()) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          totalGenerations: stats.totalGenerations + 1,
          lastUpdated: new Date().toISOString()
        }));
      }
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