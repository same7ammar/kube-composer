import type { DeploymentConfig, DaemonSetConfig, Namespace, ConfigMap, Secret, ServiceAccount, ProjectSettings, DockerHubSecret, KubernetesRole, KubernetesClusterRole, RoleBinding } from '../types';

// Job interface from JobManager component
export interface Job {
  id: string;
  name: string;
  type: 'job' | 'cronjob';
  namespace: string;
  containers: any[];
  image: string;
  command?: string;
  args?: string;
  schedule?: string;
  cpuRequest: string;
  memoryRequest: string;
  cpuLimit?: string;
  memoryLimit?: string;
  restartPolicy: 'Never' | 'OnFailure';
  labels: { key: string; value: string }[];
  concurrencyPolicy?: 'Allow' | 'Forbid' | 'Replace';
  startingDeadline?: string;
  historySuccess?: string;
  historyFailure?: string;
  completions?: number;
  replicas?: number;
  backoffLimit?: number;
  activeDeadlineSeconds?: number;
}

export interface KubeConfig {
  deployments: DeploymentConfig[];
  daemonSets: DaemonSetConfig[];
  jobs: Job[];
  configMaps: ConfigMap[];
  secrets: Secret[];
  dockerHubSecrets: DockerHubSecret[];
  serviceAccounts: ServiceAccount[];
  roles: KubernetesRole[];
  clusterRoles: KubernetesClusterRole[];
  roleBindings: RoleBinding[];
  namespaces: Namespace[];
  crds: any[]; // CustomResourceDefinition array
  projectSettings: ProjectSettings;
  generatedYaml?: string;
  metadata: {
    lastSaved: number;
    version: string;
  };
}

const STORAGE_KEY = 'kube-composer-autosave';
const CONFIG_VERSION = '1.0.0';

/**
 * Check if localStorage is available and working
 */
export function isStorageAvailable(): boolean {
  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Get storage usage information
 */
export function getStorageInfo(): { used: number; available: number; quota: number } {
  try {
    const used = new Blob([JSON.stringify(localStorage)]).size;
    // Most browsers have 5-10MB limit, we'll assume 5MB
    const quota = 5 * 1024 * 1024;
    const available = quota - used;
    
    return { used, available, quota };
  } catch (e) {
    return { used: 0, available: 0, quota: 0 };
  }
}

/**
 * Handle storage quota exceeded by clearing old data
 */
export function handleQuotaExceeded(): boolean {
  try {
    // Clear all localStorage data except our key
    const keysToKeep = [STORAGE_KEY];
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && !keysToKeep.includes(key)) {
        keysToRemove.push(key);
      }
    }
    
    // Remove old data
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    return true;
  } catch (e) {
    console.warn('Failed to clear localStorage:', e);
    return false;
  }
}

/**
 * Save configuration to localStorage with error handling
 */
export function saveConfig(config: Partial<KubeConfig>): boolean {
  if (!isStorageAvailable()) {
    console.warn('localStorage not available');
    return false;
  }

  try {
    const fullConfig: KubeConfig = {
      deployments: config.deployments || [],
      daemonSets: config.daemonSets || [],
      jobs: config.jobs || [],
      configMaps: config.configMaps || [],
      secrets: config.secrets || [],
      dockerHubSecrets: config.dockerHubSecrets || [],
      serviceAccounts: config.serviceAccounts || [],
      roles: config.roles || [],
      clusterRoles: config.clusterRoles || [],
      roleBindings: config.roleBindings || [],
      namespaces: config.namespaces || [],
      crds: config.crds || [],
      projectSettings: config.projectSettings || {
        name: 'my-project',
        description: '',
        globalLabels: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      generatedYaml: config.generatedYaml || '',
      metadata: {
        lastSaved: Date.now(),
        version: CONFIG_VERSION
      }
    };

    const configString = JSON.stringify(fullConfig);
    const configSize = new Blob([configString]).size;
    
    // Check if we have enough space
    const { available } = getStorageInfo();
    if (configSize > available) {
      console.warn('Storage quota exceeded, attempting to clear old data');
      if (!handleQuotaExceeded()) {
        console.error('Failed to free up storage space');
        return false;
      }
    }

    localStorage.setItem(STORAGE_KEY, configString);
    console.log('Configuration saved successfully', {
      deployments: config.deployments?.length || 0,
      daemonSets: config.daemonSets?.length || 0,
      jobs: config.jobs?.length || 0,
      configMaps: config.configMaps?.length || 0,
      secrets: config.secrets?.length || 0,
      dockerHubSecrets: config.dockerHubSecrets?.length || 0,
      namespaces: config.namespaces?.length || 0,
      hasYaml: !!config.generatedYaml,
      size: configString.length
    });
    return true;
  } catch (e) {
    console.error('Failed to save configuration:', e);
    return false;
  }
}

/**
 * Load configuration from localStorage with validation
 */
export function loadConfig(): Partial<KubeConfig> | null {
  if (!isStorageAvailable()) {
    console.warn('localStorage not available');
    return null;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      console.log('No saved configuration found');
      return null;
    }

    const config = JSON.parse(stored) as KubeConfig;
    
    // Basic validation
    if (!config || typeof config !== 'object') {
      console.warn('Invalid stored configuration');
      return null;
    }

    // Version check for future migrations
    if (config.metadata?.version !== CONFIG_VERSION) {
      console.warn('Configuration version mismatch, using default');
      return null;
    }

    console.log('Configuration loaded successfully', {
      deployments: config.deployments?.length || 0,
      daemonSets: config.daemonSets?.length || 0,
      jobs: config.jobs?.length || 0,
      configMaps: config.configMaps?.length || 0,
      secrets: config.secrets?.length || 0,
      dockerHubSecrets: config.dockerHubSecrets?.length || 0,
      namespaces: config.namespaces?.length || 0,
      hasYaml: !!config.generatedYaml,
      lastSaved: config.metadata?.lastSaved
    });
    return config;
  } catch (e) {
    console.error('Failed to load configuration:', e);
    return null;
  }
}

/**
 * Clear all saved configuration
 */
export function clearConfig(): boolean {
  if (!isStorageAvailable()) {
    return false;
  }

  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (e) {
    console.error('Failed to clear configuration:', e);
    return false;
  }
}

/**
 * Get last saved timestamp
 */
export function getLastSavedTime(): number | null {
  try {
    const config = loadConfig();
    return config?.metadata?.lastSaved || null;
  } catch (e) {
    return null;
  }
}

/**
 * Test localStorage functionality
 */
export function testLocalStorage(): boolean {
  try {
    const testData = {
      deployments: [],
      daemonSets: [],
      jobs: [],
      configMaps: [],
      secrets: [],
      namespaces: [],
      projectSettings: {
        name: 'test-project',
        description: '',
        globalLabels: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    };

    const saveResult = saveConfig(testData);
    const loadResult = loadConfig();
    const clearResult = clearConfig();

    console.log('localStorage test results:', {
      saveResult,
      loadResult: !!loadResult,
      clearResult,
      storageAvailable: isStorageAvailable()
    });

    return saveResult && !!loadResult && clearResult;
  } catch (e) {
    console.error('localStorage test failed:', e);
    return false;
  }
} 