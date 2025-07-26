import { useState, useRef, useEffect, useCallback } from 'react';
import { Download, FileText, List, Plus, Menu, X, Database, Settings, Key, PlayCircle, Container as Docker, FolderOpen, GitBranch, Link2, Copy, Trash2, AlertTriangle } from 'lucide-react';
import { loadConfig, saveConfig, clearConfig } from './utils/localStorage';
import { DeploymentForm } from './components/DeploymentForm';
import { DaemonSetForm } from './components/DaemonSetForm';
import { YamlPreview } from './components/YamlPreview';
import { ResourceSummary } from './components/ResourceSummary';
import { DeploymentsList } from './components/DeploymentsList';
import { DaemonSetsList } from './components/DaemonSetsList';
import { NamespacesList } from './components/NamespacesList';
import { ConfigMapsList } from './components/ConfigMapsList';
import { SecretsList } from './components/SecretsList';
import { ServiceAccountsList } from './components/ServiceAccountsList';
import { RolesList } from './components/RolesList';

import { VisualPreview } from './components/VisualPreview';
import { Footer } from './components/Footer';
import { SocialShare } from './components/SocialShare';
import { SEOHead } from './components/SEOHead';
import { NamespaceManager } from './components/NamespaceManager';
import { ConfigMapManager } from './components/ConfigMapManager';
import { SecretManager } from './components/SecretManager';
import { ServiceAccountManager } from './components/ServiceAccountManager';
import RoleWizardManager from './components/RoleWizardManager';
import { ProjectSettingsManager } from './components/ProjectSettingsManager';
import { YouTubePopup } from './components/YouTubePopup';
import { DockerRunPopup } from './components/DockerRunPopup';
import { generateMultiDeploymentYaml, generateCustomResourceYaml } from './utils/yamlGenerator';
import { JobManager, Job } from './components/JobManager';
import { CrdManager } from './components/CrdManager';
import { CrdList } from './components/CrdList';
import { CrdYamlViewer } from './components/CrdYamlViewer';
import { CustomResourceForm } from './components/CustomResourceForm';
import { CustomResourcesList } from './components/CustomResourcesList';
import { CustomResourceDefinition, CustomResource } from './types';
import { JobList } from './components/jobs/JobList';
import { CronJobList } from './components/jobs/CronJobList';
import type { DeploymentConfig, DaemonSetConfig, Namespace, ConfigMap, Secret, ServiceAccount, ProjectSettings, JobConfig, CronJobConfig, KubernetesRole, KubernetesClusterRole, RoleBinding } from './types';
import {
  K8sDeploymentIcon,
  K8sNamespaceIcon,
  K8sConfigMapIcon,
  K8sSecretIcon,
  K8sJobIcon,
  K8sCronJobIcon,
  K8sStorageIcon,
  K8sDaemonSetIcon,
  K8sSecurityIcon,
  K8sServiceAccountIcon
} from './components/KubernetesIcons';
import { RoleBindingManager } from './components/RoleBindingManager';

// Move this outside the component to avoid breaking the Rules of Hooks
const isPlayground = typeof window !== 'undefined' && window.location.search.includes('q=playground');

type PreviewMode = 'visual' | 'yaml' | 'summary' | 'argocd' | 'flow';
type SidebarTab =
  | 'deployments'
  | 'daemonsets'
  | 'namespaces'
  | 'storage'
  | 'security'
  | 'jobs'
  | 'configmaps'
  | 'secrets'
  | 'roles'
  | 'advanced'
  | 'crds';

function App() {
  const hideDemoIcons = import.meta.env.VITE_HIDE_DEMO_ICONS === 'true';
  // Add a flag to hide header actions if ?q=plaground or ?q=playground is present
  const hideHeaderActions = typeof window !== 'undefined' && (window.location.search.includes('q=plaground') || window.location.search.includes('q=playground'));
  
  // Initialize state with loading flag
  const [isLoading, setIsLoading] = useState(true);
  
  const [projectSettings, setProjectSettings] = useState<ProjectSettings>({
    name: 'my-project',
    description: '',
    globalLabels: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  const [deployments, setDeployments] = useState<DeploymentConfig[]>([]);
  const [daemonSets, setDaemonSets] = useState<DaemonSetConfig[]>([]);
  const [namespaces, setNamespaces] = useState<Namespace[]>([{
    name: 'default',
    labels: {},
    annotations: {},
    createdAt: new Date().toISOString()
  }]);
  const [configMaps, setConfigMaps] = useState<ConfigMap[]>([]);
  const [secrets, setSecrets] = useState<Secret[]>([]);
  const [serviceAccounts, setServiceAccounts] = useState<ServiceAccount[]>([]);
  const [roles, setRoles] = useState<KubernetesRole[]>([]);
  const [clusterRoles, setClusterRoles] = useState<KubernetesClusterRole[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedDeployment, setSelectedDeployment] = useState<number>(0);
  const [selectedDaemonSet, setSelectedDaemonSet] = useState<number>(0);
  const [selectedNamespace, setSelectedNamespace] = useState<number>(0);
  const [selectedConfigMap, setSelectedConfigMap] = useState<number>(0);
  const [selectedSecret, setSelectedSecret] = useState<number>(0);
  const [selectedServiceAccount, setSelectedServiceAccount] = useState<number>(0);
  const [selectedRole, setSelectedRole] = useState<number>(0);

  const [previewMode, setPreviewMode] = useState<PreviewMode>(isPlayground ? 'yaml' : 'flow');
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('deployments');
  const [showAllResources, setShowAllResources] = useState<boolean>(true); // Show all resources by default
  const [storageSubTab, setStorageSubTab] = useState<'configmaps' | 'secrets'>('configmaps');
  const [securitySubTab, setSecuritySubTab] = useState<'serviceaccounts' | 'roles' | 'rolebindings'>('serviceaccounts');
  const [jobsSubTab, setJobsSubTab] = useState<'jobs' | 'cronjobs'>('jobs');
  const [showForm, setShowForm] = useState(false);
  const [showNamespaceManager, setShowNamespaceManager] = useState(false);
  const [showConfigMapManager, setShowConfigMapManager] = useState(false);
  const [showSecretManager, setShowSecretManager] = useState(false);
  const [editingSecretIndex, setEditingSecretIndex] = useState<number | undefined>(undefined);
  const [showServiceAccountManager, setShowServiceAccountManager] = useState(false);
  const [editingServiceAccountIndex, setEditingServiceAccountIndex] = useState<number | undefined>(undefined);
  const [showRoleWizard, setShowRoleWizard] = useState(false);
  const [editingRoleIndex, setEditingRoleIndex] = useState<number | undefined>(undefined);
  const [isClusterRoleMode, setIsClusterRoleMode] = useState(false);
  const [showJobManager, setShowJobManager] = useState(false);
  const [jobTypeToCreate, setJobTypeToCreate] = useState<'job' | 'cronjob'>('job');
  const [showProjectSettings, setShowProjectSettings] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showYouTubePopup, setShowYouTubePopup] = useState(false);
  const [showDockerPopup, setShowDockerPopup] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  // Only one group open at a time: 'workloads' | 'storage' | 'security' | null (all collapsed)
  const [openGroup, setOpenGroup] = useState<'workloads' | 'storage' | 'security' | 'advanced' | null>(null);
  const [jobToEdit, setJobToEdit] = useState<Job | undefined>(undefined);
  const [selectedJob, setSelectedJob] = useState<number>(-1);
  const [selectedCronJob, setSelectedCronJob] = useState<number>(-1);
  const [generatedYaml, setGeneratedYaml] = useState<string>('');
  const [roleBindings, setRoleBindings] = useState<RoleBinding[]>([]);
  const [showRoleBindingManager, setShowRoleBindingManager] = useState(false);
  const [editingRoleBindingIndex, setEditingRoleBindingIndex] = useState<number | undefined>(undefined);
  // Add a state to track if RoleManager was opened from RoleBindingManager
  const [reopenRoleBindingAfterRole, setReopenRoleBindingAfterRole] = useState(false);
  const [selectedRoleBindingIndex, setSelectedRoleBindingIndex] = useState<number>(-1);
  const [deleteRoleBindingConfirm, setDeleteRoleBindingConfirm] = useState<number | null>(null);
  
  // CRD Management
  const [crds, setCrds] = useState<CustomResourceDefinition[]>([]);
  const [selectedCrd, setSelectedCrd] = useState<number>(0);
  const [showCrdManager, setShowCrdManager] = useState(false);
  const [crdToView, setCrdToView] = useState<CustomResourceDefinition | null>(null);
  
  // Custom Resources Management
  const [customResources, setCustomResources] = useState<CustomResource[]>([]);
  const [showCustomResourceForm, setShowCustomResourceForm] = useState<CustomResourceDefinition | null>(null);
  const [selectedCustomResource, setSelectedCustomResource] = useState<number>(-1);
  const [editingCustomResource, setEditingCustomResource] = useState<CustomResource | null>(null);
  const [customResourceToView, setCustomResourceToView] = useState<CustomResource | null>(null);
  
  // Custom Resource handlers
  const handleSaveCustomResource = (cr: CustomResource) => {
    setCustomResources(prev => {
      const existingIndex = prev.findIndex(existing => existing.id === cr.id);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = cr;
        return updated;
      } else {
        return [...prev, cr];
      }
    });
    forceSave();
  };

  const handleDeleteCustomResource = (index: number) => {
    const updated = [...customResources];
    updated.splice(index, 1);
    setCustomResources(updated);
    forceSave();
  };

  const handleEditCustomResource = (cr: CustomResource) => {
    const crd = crds.find(c => c.id === cr.crdId);
    if (crd) {
      setEditingCustomResource(cr);
      setShowCustomResourceForm(crd);
    }
  };

  const handleViewCustomResourceYaml = (cr: CustomResource) => {
    setCustomResourceToView(cr);
  };

  // Auto-save functionality
  const autoSaveTimeoutRef = useRef<number | null>(null);
  const lastSavedRef = useRef<number>(0);

  // Force save function for immediate saves
  const forceSave = useCallback(() => {
    try {
      const config = {
        deployments,
        daemonSets,
        jobs,
        configMaps,
        secrets,
        serviceAccounts,
        roles,
        clusterRoles,
        namespaces,
        projectSettings,
        crds,
        customResources,
        generatedYaml
      };
      const success = saveConfig(config);
      if (success) {
        lastSavedRef.current = Date.now();
        console.log('Configuration force-saved successfully');
      }
      return success;
    } catch (e) {
      console.warn('Force save failed:', e);
      return false;
    }
  }, [deployments, daemonSets, jobs, configMaps, secrets, serviceAccounts, roles, clusterRoles, namespaces, projectSettings, crds, generatedYaml]);

  // Auto-save function
  const autoSave = useCallback(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = window.setTimeout(() => {
      try {
        const config = {
          deployments,
          daemonSets,
          jobs,
          configMaps,
          secrets,
          serviceAccounts,
          roles,
          clusterRoles,
          namespaces,
          projectSettings,
                  generatedYaml,
        roleBindings,
        crds,
        customResources
        };
        const success = saveConfig(config);
        if (success) {
          lastSavedRef.current = Date.now();
        }
      } catch (e) {
        console.warn('Auto-save failed:', e);
      }
    }, 3000); // 3 second delay
  }, [deployments, daemonSets, jobs, configMaps, secrets, serviceAccounts, roles, clusterRoles, namespaces, projectSettings, generatedYaml, roleBindings, crds]);

  // Update generated YAML when configuration changes
  useEffect(() => {
    // If in playground mode and no resources, keep the default YAML
    const isPlayground = typeof window !== 'undefined' && window.location.search.includes('q=playground');
    const noResources =
      deployments.length === 0 &&
      daemonSets.length === 0 &&
      jobs.length === 0 &&
      configMaps.length === 0 &&
      secrets.length === 0 &&
      serviceAccounts.length === 0 &&
      roles.length === 0 &&
      clusterRoles.length === 0 &&
      roleBindings.length === 0;
    if (isPlayground && noResources) {
      setGeneratedYaml(`# Playground Mode\n# Example Deployment\napiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: playground-deployment\nspec:\n  replicas: 1\n  selector:\n    matchLabels:\n      app: playground\n  template:\n    metadata:\n      labels:\n        app: playground\n    spec:\n      containers:\n        - name: playground\n          image: nginx:latest\n`);
    } else {
      const yaml = getPreviewYaml();
      setGeneratedYaml(yaml);
    }
  }, [deployments, daemonSets, jobs, configMaps, secrets, serviceAccounts, roles, clusterRoles, namespaces, projectSettings, roleBindings, crds]);

  // Trigger auto-save when any configuration changes
  useEffect(() => {
    autoSave();
  }, [autoSave]);

  // Load saved configuration on mount
  useEffect(() => {
    try {
      const saved = loadConfig();
      if (saved) {
        if (saved.projectSettings) setProjectSettings(saved.projectSettings);
        if (saved.deployments) setDeployments(saved.deployments);
        if (saved.daemonSets) setDaemonSets(saved.daemonSets);
        if (saved.namespaces && saved.namespaces.length > 0) setNamespaces(saved.namespaces);
        if (saved.configMaps) setConfigMaps(saved.configMaps);
        if (saved.secrets) setSecrets(saved.secrets);
        if (saved.serviceAccounts) setServiceAccounts(saved.serviceAccounts);
        if (saved.roles) setRoles(saved.roles);
        if (saved.clusterRoles) setClusterRoles(saved.clusterRoles);
        if (saved.jobs) setJobs(saved.jobs);
        if (saved.generatedYaml) setGeneratedYaml(saved.generatedYaml);
        if (saved.roleBindings) setRoleBindings(saved.roleBindings);
        if (saved.crds) setCrds(saved.crds);
        console.log('Configuration loaded from localStorage');
      } else if (typeof window !== 'undefined' && window.location.search.includes('q=playground')) {
        setGeneratedYaml(`# Playground Mode\n# Example Deployment\napiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: playground-deployment\nspec:\n  replicas: 1\n  selector:\n    matchLabels:\n      app: playground\n  template:\n    metadata:\n      labels:\n        app: playground\n    spec:\n      containers:\n        - name: playground\n          image: nginx:latest\n`);
      }
    } catch (e) {
      console.warn('Failed to load saved configuration:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  const currentConfig = deployments[selectedDeployment] || {
    appName: '',
    containers: [{
      name: '',
      image: '',
      port: 8080,
      env: [],
      resources: {
        requests: { cpu: '', memory: '' },
        limits: { cpu: '', memory: '' }
      },
      volumeMounts: []
    }],
    replicas: 1,
    port: 80,
    targetPort: 8080,
    serviceType: 'ClusterIP',
    namespace: 'default',
    labels: {},
    annotations: {},
    volumes: [],
    configMaps: [],
    secrets: [],
    selectedConfigMaps: [],
    selectedSecrets: [],
    serviceAccount: undefined,
    ingress: {
      enabled: false,
      className: '',
      annotations: {},
      tls: [],
      rules: []
    }
  };

  const currentDaemonSetConfig = daemonSets[selectedDaemonSet] || {
    appName: '',
    containers: [{
      name: '',
      image: '',
      port: 8080,
      env: [],
      resources: {
        requests: { cpu: '', memory: '' },
        limits: { cpu: '', memory: '' }
      },
      volumeMounts: []
    }],
    serviceEnabled: false,
    port: 80,
    targetPort: 8080,
    serviceType: 'ClusterIP',
    namespace: 'default',
    labels: {},
    annotations: {},
    volumes: [],
    configMaps: [],
    secrets: [],
    selectedConfigMaps: [],
    selectedSecrets: [],
    serviceAccount: undefined,
    nodeSelector: {}
  };

  // Get available namespaces from all deployments
  const availableNamespaces = [...new Set([
    ...namespaces.map(ns => ns.name),
    ...deployments.map(d => d.namespace).filter(Boolean)
  ])];

  // Helper function to remove old global labels and apply new ones
  const cleanAndMergeLabels = (
    resourceLabels: Record<string, string>, 
    oldGlobalLabels: Record<string, string> = {},
    newGlobalLabels: Record<string, string> = projectSettings.globalLabels,
    projectName: string = projectSettings.name
  ) => {
    // Start with a copy of resource labels
    const cleanedLabels = { ...resourceLabels };
    
    // Remove ALL old global labels (including the old project label)
    Object.keys(oldGlobalLabels).forEach(key => {
      delete cleanedLabels[key];
    });
    
    // Remove old project label specifically (in case it wasn't in oldGlobalLabels)
    delete cleanedLabels.project;
    
    // Apply new global labels first, then resource-specific labels, then project label
    return {
      ...newGlobalLabels,
      ...cleanedLabels,
      project: projectName
    };
  };

  const handleConfigChange = (newConfig: DeploymentConfig) => {
    // Apply global labels to the new config
    const configWithGlobalLabels = {
      ...newConfig,
      labels: cleanAndMergeLabels(newConfig.labels)
    };

    const newDeployments = [...deployments];
    if (selectedDeployment < deployments.length) {
      newDeployments[selectedDeployment] = configWithGlobalLabels;
    } else {
      newDeployments.push(configWithGlobalLabels);
    }
    setDeployments(newDeployments);
  };

  const handleAddDeployment = () => {
    const newDeployment: DeploymentConfig = {
      appName: '',
      containers: [{
        name: '',
        image: '',
        port: 8080,
        env: [],
        resources: {
          requests: { cpu: '', memory: '' },
          limits: { cpu: '', memory: '' }
        },
        volumeMounts: []
      }],
      replicas: 1,
      port: 80,
      targetPort: 8080,
      serviceType: 'ClusterIP',
      namespace: 'default',
      labels: cleanAndMergeLabels({}),
      annotations: {},
      volumes: [],
      configMaps: [],
      secrets: [],
      selectedConfigMaps: [],
      selectedSecrets: [],
      serviceAccount: undefined,
      ingress: {
        enabled: false,
        className: '',
        annotations: {},
        tls: [],
        rules: []
      }
    };
    setDeployments([...deployments, newDeployment]);
    setSelectedDeployment(deployments.length);
    setSidebarTab('deployments');
    setShowForm(true);
  };

  const handleDeleteDeployment = (index: number) => {
    if (deployments.length <= 1) {
      // If it's the last deployment, remove it completely
      setDeployments([]);
      setSelectedDeployment(0);
      return;
    }

    const newDeployments = deployments.filter((_, i) => i !== index);
    setDeployments(newDeployments);
    
    // Adjust selected deployment index
    if (selectedDeployment >= index) {
      setSelectedDeployment(Math.max(0, selectedDeployment - 1));
    }
  };

  const handleDuplicateDeployment = (index: number) => {
    const deploymentToDuplicate = deployments[index];
    const duplicatedDeployment: DeploymentConfig = {
      ...deploymentToDuplicate,
      appName: `${deploymentToDuplicate.appName}-copy`,
      containers: deploymentToDuplicate.containers.map(container => ({
        ...container,
        name: container.name ? `${container.name}-copy` : ''
      })),
      labels: cleanAndMergeLabels(deploymentToDuplicate.labels),
      ingress: {
        ...deploymentToDuplicate.ingress,
        rules: deploymentToDuplicate.ingress.rules.map(rule => ({
          ...rule,
          serviceName: `${deploymentToDuplicate.appName}-copy-service`
        }))
      }
    };
    
    const newDeployments = [...deployments];
    newDeployments.splice(index + 1, 0, duplicatedDeployment);
    setDeployments(newDeployments);
    setSelectedDeployment(index + 1);
  };

  // Namespace management
  const handleAddNamespace = (namespace: Namespace) => {
    const namespaceWithGlobalLabels = {
      ...namespace,
      labels: cleanAndMergeLabels(namespace.labels)
    };
    setNamespaces([...namespaces, namespaceWithGlobalLabels]);
    setShowNamespaceManager(false);
    setSidebarTab('namespaces');
    setSelectedNamespace(namespaces.length);
  };

  const handleDeleteNamespace = (namespaceName: string) => {
    // Don't allow deleting system namespaces
    if (['default', 'kube-system', 'kube-public', 'kube-node-lease'].includes(namespaceName)) {
      return;
    }

    // Remove the namespace
    setNamespaces(namespaces.filter(ns => ns.name !== namespaceName));
    
    // Move any deployments using this namespace to 'default'
    const updatedDeployments = deployments.map(deployment => 
      deployment.namespace === namespaceName 
        ? { ...deployment, namespace: 'default' }
        : deployment
    );
    setDeployments(updatedDeployments);

    // Move any ConfigMaps/Secrets using this namespace to 'default'
    setConfigMaps(configMaps.map(cm => 
      cm.namespace === namespaceName ? { ...cm, namespace: 'default' } : cm
    ));
    setSecrets(secrets.map(secret => 
      secret.namespace === namespaceName ? { ...secret, namespace: 'default' } : secret
    ));

    // Adjust selected namespace index
    const namespaceIndex = namespaces.findIndex(ns => ns.name === namespaceName);
    if (selectedNamespace >= namespaceIndex) {
      setSelectedNamespace(Math.max(0, selectedNamespace - 1));
    }
  };

  const handleDuplicateNamespace = (index: number) => {
    const namespaceToDuplicate = namespaces[index];
    const duplicatedNamespace: Namespace = {
      ...namespaceToDuplicate,
      name: `${namespaceToDuplicate.name}-copy`,
      labels: cleanAndMergeLabels(namespaceToDuplicate.labels),
      createdAt: new Date().toISOString()
    };
    
    const newNamespaces = [...namespaces];
    newNamespaces.splice(index + 1, 0, duplicatedNamespace);
    setNamespaces(newNamespaces);
    setSelectedNamespace(index + 1);
  };

  // ConfigMap management
  const handleAddConfigMap = (configMap: ConfigMap) => {
    const configMapWithGlobalLabels = {
      ...configMap,
      labels: cleanAndMergeLabels(configMap.labels)
    };
    setConfigMaps([...configMaps, configMapWithGlobalLabels]);
    setShowConfigMapManager(false);
    setSidebarTab('storage');
    setStorageSubTab('configmaps');
    setSelectedConfigMap(configMaps.length);
  };

  const handleDeleteConfigMap = (configMapName: string) => {
    setConfigMaps(configMaps.filter(cm => cm.name !== configMapName));
    
    // Remove references from deployments
    const updatedDeployments = deployments.map(deployment => ({
      ...deployment,
      selectedConfigMaps: deployment.selectedConfigMaps.filter(name => name !== configMapName),
      volumes: deployment.volumes.filter(v => v.type !== 'configMap' || v.configMapName !== configMapName)
    }));
    setDeployments(updatedDeployments);

    // Adjust selected index
    const configMapIndex = configMaps.findIndex(cm => cm.name === configMapName);
    if (selectedConfigMap >= configMapIndex) {
      setSelectedConfigMap(Math.max(0, selectedConfigMap - 1));
    }
  };

  const handleDuplicateConfigMap = (index: number) => {
    const configMapToDuplicate = configMaps[index];
    const duplicatedConfigMap: ConfigMap = {
      ...configMapToDuplicate,
      name: `${configMapToDuplicate.name}-copy`,
      labels: cleanAndMergeLabels(configMapToDuplicate.labels),
      createdAt: new Date().toISOString()
    };
    
    const newConfigMaps = [...configMaps];
    newConfigMaps.splice(index + 1, 0, duplicatedConfigMap);
    setConfigMaps(newConfigMaps);
    setSelectedConfigMap(index + 1);
  };

  // Secret management
  const handleAddSecret = (secret: Secret) => {
    const secretWithGlobalLabels = {
      ...secret,
      labels: cleanAndMergeLabels(secret.labels)
    };
    setSecrets([...secrets, secretWithGlobalLabels]);
    setShowSecretManager(false);
    setSidebarTab('storage');
    setStorageSubTab('secrets');
    setSelectedSecret(secrets.length);
  };

  const handleUpdateSecret = (secret: Secret, index: number) => {
    const secretWithGlobalLabels = {
      ...secret,
      labels: cleanAndMergeLabels(secret.labels)
    };
    const updatedSecrets = [...secrets];
    updatedSecrets[index] = secretWithGlobalLabels;
    setSecrets(updatedSecrets);
    setShowSecretManager(false);
  };

  const handleDeleteSecret = (secretName: string) => {
    setSecrets(secrets.filter(s => s.name !== secretName));
    
    // Remove references from deployments
    const updatedDeployments = deployments.map(deployment => ({
      ...deployment,
      selectedSecrets: deployment.selectedSecrets.filter(name => name !== secretName),
      volumes: deployment.volumes.filter(v => v.type !== 'secret' || v.secretName !== secretName),
      ingress: {
        ...deployment.ingress,
        tls: deployment.ingress.tls.filter(tls => tls.secretName !== secretName)
      }
    }));
    setDeployments(updatedDeployments);

    // Adjust selected index
    const secretIndex = secrets.findIndex(s => s.name === secretName);
    if (selectedSecret >= secretIndex) {
      setSelectedSecret(Math.max(0, selectedSecret - 1));
    }
  };

  const handleDuplicateSecret = (index: number) => {
    const secretToDuplicate = secrets[index];
    const duplicatedSecret: Secret = {
      ...secretToDuplicate,
      name: `${secretToDuplicate.name}-copy`,
      createdAt: new Date().toISOString()
    };
    setSecrets([...secrets, duplicatedSecret]);
    setSelectedSecret(secrets.length);
  };



  // Service Account management functions
  const handleAddServiceAccount = (serviceAccount: ServiceAccount) => {
    const serviceAccountWithGlobalLabels: ServiceAccount = {
      ...serviceAccount,
      labels: cleanAndMergeLabels(serviceAccount.labels)
    };
    setServiceAccounts([...serviceAccounts, serviceAccountWithGlobalLabels]);
    setSelectedServiceAccount(serviceAccounts.length);
    setShowServiceAccountManager(false);
    setEditingServiceAccountIndex(undefined);
  };

  const handleUpdateServiceAccount = (serviceAccount: ServiceAccount, index: number) => {
    const oldServiceAccount = serviceAccounts[index];
    const serviceAccountWithGlobalLabels: ServiceAccount = {
      ...serviceAccount,
      labels: cleanAndMergeLabels(serviceAccount.labels)
    };
    const newServiceAccounts = [...serviceAccounts];
    newServiceAccounts[index] = serviceAccountWithGlobalLabels;
    setServiceAccounts(newServiceAccounts);
    
    // Update deployments that reference this service account
    const updatedDeployments = deployments.map(deployment => {
      if (deployment.serviceAccount === oldServiceAccount.name) {
        return {
          ...deployment,
          serviceAccount: serviceAccount.name // Update to new name
        };
      }
      return deployment;
    });
    setDeployments(updatedDeployments);
    
    // Update daemonSets that reference this service account
    const updatedDaemonSets = daemonSets.map(daemonSet => {
      if (daemonSet.serviceAccount === oldServiceAccount.name) {
        return {
          ...daemonSet,
          serviceAccount: serviceAccount.name // Update to new name
        };
      }
      return daemonSet;
    });
    setDaemonSets(updatedDaemonSets);
    
    setShowServiceAccountManager(false);
    setEditingServiceAccountIndex(undefined);
  };

  const handleDeleteServiceAccount = (serviceAccountName: string) => {
    const index = serviceAccounts.findIndex(sa => sa.name === serviceAccountName);
    if (index > -1) {
      const newServiceAccounts = serviceAccounts.filter((_, i) => i !== index);
      setServiceAccounts(newServiceAccounts);
      
      // Remove service account reference from deployments that use it
      const updatedDeployments = deployments.map(deployment => {
        if (deployment.serviceAccount === serviceAccountName) {
          return {
            ...deployment,
            serviceAccount: undefined // Clear the reference
          };
        }
        return deployment;
      });
      setDeployments(updatedDeployments);
      
      // Remove service account reference from daemonSets that use it
      const updatedDaemonSets = daemonSets.map(daemonSet => {
        if (daemonSet.serviceAccount === serviceAccountName) {
          return {
            ...daemonSet,
            serviceAccount: undefined // Clear the reference
          };
        }
        return daemonSet;
      });
      setDaemonSets(updatedDaemonSets);
      
      if (selectedServiceAccount >= newServiceAccounts.length) {
        setSelectedServiceAccount(Math.max(0, newServiceAccounts.length - 1));
      }
    }
  };

  const handleDuplicateServiceAccount = (index: number) => {
    const serviceAccountToDuplicate = serviceAccounts[index];
    const duplicatedServiceAccount: ServiceAccount = {
      ...serviceAccountToDuplicate,
      name: `${serviceAccountToDuplicate.name}-copy`,
      createdAt: new Date().toISOString()
    };
    setServiceAccounts([...serviceAccounts, duplicatedServiceAccount]);
    setSelectedServiceAccount(serviceAccounts.length);
    setEditingServiceAccountIndex(serviceAccounts.length);
    setShowServiceAccountManager(true);
  };

  const handleEditServiceAccount = (index: number) => {
    setEditingServiceAccountIndex(index);
    setShowServiceAccountManager(true);
  };

  // Role management functions
  const handleAddRole = (role: KubernetesRole) => {
    setRoles([...roles, role]);
  };

  const handleUpdateRole = (role: KubernetesRole, index: number) => {
    const newRoles = [...roles];
    newRoles[index] = role;
    setRoles(newRoles);
  };

  const handleDeleteRole = (roleName: string) => {
    const index = roles.findIndex(role => role.metadata.name === roleName);
    if (index > -1) {
      const newRoles = roles.filter(role => role.metadata.name !== roleName);
      setRoles(newRoles);
      
      // Adjust selected index if needed
      if (selectedRole >= newRoles.length) {
        setSelectedRole(Math.max(0, newRoles.length - 1));
      }
    }
  };

  const handleDuplicateRole = (index: number) => {
    const roleToClone = roles[index];
    const clonedRole: KubernetesRole = {
      ...roleToClone,
      metadata: {
        ...roleToClone.metadata,
        name: `${roleToClone.metadata.name}-copy`
      }
    };
    setRoles([...roles, clonedRole]);
    setSelectedRole(roles.length);
  };



  // ClusterRole management functions
  const handleAddClusterRole = (clusterRole: KubernetesClusterRole) => {
    setClusterRoles([...clusterRoles, clusterRole]);
  };

  const handleUpdateClusterRole = (clusterRole: KubernetesClusterRole, index: number) => {
    const newClusterRoles = [...clusterRoles];
    newClusterRoles[index] = clusterRole;
    setClusterRoles(newClusterRoles);
  };





  // Job management functions
  const handleAddJob = (job: Job) => {
    // Convert job labels from array to object format for global label merging
    const jobLabelsAsObject = job.labels.reduce((acc, label) => {
      if (label.key) acc[label.key] = label.value;
      return acc;
    }, {} as Record<string, string>);
    
    // Apply global labels
    const mergedLabels = cleanAndMergeLabels(jobLabelsAsObject);
    
    // Convert back to array format for Job interface
    const jobWithGlobalLabels = {
      ...job,
      labels: Object.entries(mergedLabels).map(([key, value]) => ({ key, value }))
    };
    setJobs(prev => [...prev, jobWithGlobalLabels]);
  };

  const handleDeleteJob = (jobId: string) => {
    setJobs(jobs.filter(j => j.id !== jobId));
  };

  const handleEditJob = (jobId: string) => {
    const job = jobs.find(j => j.id === jobId);
    if (job) {
      setJobToEdit(job);
      setShowJobManager(true);
    }
  };

  const handleUpdateJob = (jobId: string, updatedJob: Job) => {
    // Convert job labels from array to object format for global label merging
    const jobLabelsAsObject = updatedJob.labels.reduce((acc, label) => {
      if (label.key) acc[label.key] = label.value;
      return acc;
    }, {} as Record<string, string>);
    
    // Apply global labels
    const mergedLabels = cleanAndMergeLabels(jobLabelsAsObject);
    
    // Convert back to array format for Job interface
    const jobWithGlobalLabels = {
      ...updatedJob,
      labels: Object.entries(mergedLabels).map(([key, value]) => ({ key, value }))
    };
    setJobs(jobs.map(j => j.id === jobId ? jobWithGlobalLabels : j));
    setJobToEdit(undefined);
    setShowJobManager(false);
  };

  // Project settings management
  const handleUpdateProjectSettings = (newSettings: ProjectSettings) => {
    const oldGlobalLabels = projectSettings.globalLabels;
    setProjectSettings(newSettings);
    
    // Update all existing resources with new global labels, properly removing old ones
    const updatedDeployments = deployments.map(deployment => ({
      ...deployment,
      labels: cleanAndMergeLabels(deployment.labels, oldGlobalLabels, newSettings.globalLabels, newSettings.name)
    }));
    setDeployments(updatedDeployments);

    const updatedNamespaces = namespaces.map(namespace => ({
      ...namespace,
      labels: cleanAndMergeLabels(namespace.labels, oldGlobalLabels, newSettings.globalLabels, newSettings.name)
    }));
    setNamespaces(updatedNamespaces);

    const updatedConfigMaps = configMaps.map(configMap => ({
      ...configMap,
      labels: cleanAndMergeLabels(configMap.labels, oldGlobalLabels, newSettings.globalLabels, newSettings.name)
    }));
    setConfigMaps(updatedConfigMaps);

    const updatedSecrets = secrets.map(secret => ({
      ...secret,
      labels: cleanAndMergeLabels(secret.labels, oldGlobalLabels, newSettings.globalLabels, newSettings.name)
    }));
    setSecrets(updatedSecrets);

    const updatedServiceAccounts = serviceAccounts.map(serviceAccount => ({
      ...serviceAccount,
      labels: cleanAndMergeLabels(serviceAccount.labels, oldGlobalLabels, newSettings.globalLabels, newSettings.name)
    }));
    setServiceAccounts(updatedServiceAccounts);

    // Update jobs with new global labels
    const updatedJobs = jobs.map(job => {
      // Convert job labels from array to object format
      const jobLabelsAsObject = job.labels.reduce((acc, label) => {
        if (label.key) acc[label.key] = label.value;
        return acc;
      }, {} as Record<string, string>);
      
      // Apply new global labels
      const mergedLabels = cleanAndMergeLabels(jobLabelsAsObject, oldGlobalLabels, newSettings.globalLabels, newSettings.name);
      
      // Convert back to array format
      return {
        ...job,
        labels: Object.entries(mergedLabels).map(([key, value]) => ({ key, value }))
      };
    });
    setJobs(updatedJobs);
  };

  const handleDownload = async () => {
    if (deployments.length === 0) {
      return;
    }
    
    // Filter out deployments without app names
    const validDeployments = deployments.filter(d => d.appName);
    if (validDeployments.length === 0) {
      return;
    }
    
    const yaml = generateMultiDeploymentYaml(validDeployments, namespaces, configMaps, secrets, projectSettings);
    const blob = new Blob([yaml], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    // Create filename based on project name and number of deployments
    const filename = validDeployments.length === 1 
      ? `${projectSettings.name}-${validDeployments[0].appName}-deployment.yaml`
      : `${projectSettings.name}-kubernetes-deployments-${validDeployments.length}.yaml`;
    
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Generate YAML for preview based on mode
  const getPreviewYaml = () => {
    const validDeployments = deployments.filter(d => d.appName);
    const validDaemonSets = daemonSets.filter(d => d.appName);
    // Fix: Only map regular jobs to jobConfigs, not cronjobs
    const jobConfigs = jobs.filter(j => j.type === 'job').map(jobToJobConfig);
    const cronJobConfigs = jobs.filter(j => j.type === 'cronjob').map(jobToCronJobConfig);
    const yaml = generateMultiDeploymentYaml(
      validDeployments,
      namespaces,
      configMaps,
      secrets,
      projectSettings,
      jobConfigs,
      cronJobConfigs,
      validDaemonSets,
      serviceAccounts,
      [],
      roles,
      clusterRoles,
      roleBindings, // Pass roleBindings here
      crds, // Pass CRDs here
      customResources // Pass Custom Resources here
    );
    
    let finalYaml = yaml;
    if (
      validDeployments.length === 0 &&
      validDaemonSets.length === 0 &&
      jobConfigs.length === 0 &&
      cronJobConfigs.length === 0 &&
      namespaces.length <= 1 &&
      configMaps.length === 0 &&
      secrets.length === 0 &&
      serviceAccounts.length === 0 &&
      roles.length === 0 &&
      clusterRoles.length === 0 &&
      roleBindings.length === 0 &&
      crds.length === 0 &&
      customResources.length === 0 // Add CRDs check
    ) {
      finalYaml = '# No resources configured\n# Create your first deployment, daemonset, job, service account, configmap, or secret to see the generated YAML';
    }
    
    return finalYaml;
  };

  const previewModes = [
    { id: 'flow' as const, label: 'Visual', icon: GitBranch },
    { id: 'summary' as const, label: 'Summary', icon: List },
    { id: 'yaml' as const, label: 'YAML', icon: FileText },
  ];

  // Check if download should be enabled
  const hasValidDeployments = deployments.some(d => d.appName) || daemonSets.some(d => d.appName);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollLeft = 0; // or center calculation
    }
  }, []);



  // Helper: Map Job (JobManager) to JobConfig (for JobList)
  function jobToJobConfig(job: Job): JobConfig {
    return {
      name: job.name || 'unnamed-job',
      namespace: job.namespace || 'default',
      labels: job.labels && Array.isArray(job.labels)
        ? job.labels.reduce((acc, l) => l.key ? { ...acc, [l.key]: l.value } : acc, {})
        : (job.labels || {}),
      annotations: {},
      containers: job.containers && job.containers.length > 0 ? job.containers : [{ name: 'main', image: 'nginx', resources: { requests: { cpu: '100m', memory: '128Mi' }, limits: { cpu: '', memory: '' } }, env: [], volumeMounts: [] }],
      restartPolicy: job.restartPolicy || 'Never',
      completions: job.completions || 1,
      parallelism: job.replicas || 1,
      backoffLimit: job.backoffLimit || 6,
      activeDeadlineSeconds: job.activeDeadlineSeconds,
    };
  }
  // Helper: Map Job (JobManager) to CronJobConfig (for CronJobList)
  function jobToCronJobConfig(job: Job): CronJobConfig {
    return {
      name: job.name,
      namespace: job.namespace,
      labels: {},
      annotations: {},
      schedule: job.schedule || '',
      concurrencyPolicy: job.concurrencyPolicy,
      startingDeadlineSeconds: job.startingDeadline ? parseInt(job.startingDeadline) : undefined,
      successfulJobsHistoryLimit: job.historySuccess ? parseInt(job.historySuccess) : undefined,
      failedJobsHistoryLimit: job.historyFailure ? parseInt(job.historyFailure) : undefined,
      jobTemplate: jobToJobConfig(job),
      createdAt: undefined,
    };
  }

  // Function to determine filter type based on current sidebar tab and sub-tabs
  const getFilterType = (): 'all' | 'deployments' | 'daemonsets' | 'namespaces' | 'configmaps' | 'secrets' | 'serviceaccounts' | 'roles' | 'rolebindings' | 'jobs' | 'cronjobs' | 'crds' => {
    // Show all resources when showAllResources is true
    if (showAllResources) return 'all';
    
    // Show specific resources based on sidebar tab
    if (sidebarTab === 'deployments') return 'deployments';
    if (sidebarTab === 'daemonsets') return 'daemonsets';
    if (sidebarTab === 'namespaces') return 'namespaces';
    if (sidebarTab === 'crds') return 'crds';
    if (sidebarTab === 'jobs') {
      if (jobsSubTab === 'jobs') return 'jobs';
      if (jobsSubTab === 'cronjobs') return 'cronjobs';
      return 'jobs'; // default
    }
    if (sidebarTab === 'storage') {
      if (storageSubTab === 'configmaps') return 'configmaps';
      if (storageSubTab === 'secrets') return 'secrets';
      return 'configmaps'; // default
    }
    if (sidebarTab === 'security') {
      if (securitySubTab === 'serviceaccounts') return 'serviceaccounts';
      if (securitySubTab === 'roles') return 'roles';
      if (securitySubTab === 'rolebindings') return 'rolebindings';

      return 'serviceaccounts'; // default
    }
    return 'all'; // Show all resources by default
  };

  // Function to handle menu item clicks and set appropriate preview mode
  const handleMenuClick = (tab: SidebarTab, subTab?: string) => {
    setSidebarTab(tab);
    setShowAllResources(false); // Show filtered view when clicking menu items
    setPreviewMode('flow');
    // Handle sub-tabs
    if (subTab === 'configmaps') {
      setStorageSubTab('configmaps');
    } else if (subTab === 'secrets') {
      setStorageSubTab('secrets');
    } else if (subTab === 'serviceaccounts') {
      setSecuritySubTab('serviceaccounts');
    } else if (subTab === 'roles') {
      setSecuritySubTab('roles');
    } else if (subTab === 'rolebindings') {
      setSecuritySubTab('rolebindings');
    } else if (subTab === 'jobs') {
      setJobsSubTab('jobs');
    } else if (subTab === 'cronjobs') {
      setJobsSubTab('cronjobs');
    }
  };

  // DaemonSet management
  const handleDaemonSetConfigChange = (newConfig: DaemonSetConfig) => {
    // Apply global labels to the new config
    const configWithGlobalLabels = {
      ...newConfig,
      labels: cleanAndMergeLabels(newConfig.labels)
    };

    const newDaemonSets = [...daemonSets];
    if (selectedDaemonSet < daemonSets.length) {
      newDaemonSets[selectedDaemonSet] = configWithGlobalLabels;
    } else {
      newDaemonSets.push(configWithGlobalLabels);
    }
    setDaemonSets(newDaemonSets);
  };

  const handleAddDaemonSet = () => {
    const newDaemonSet: DaemonSetConfig = {
      appName: '',
      containers: [{
        name: '',
        image: '',
        port: 8080,
        env: [],
        resources: {
          requests: { cpu: '', memory: '' },
          limits: { cpu: '', memory: '' }
        },
        volumeMounts: []
      }],
      serviceEnabled: false,
      port: 80,
      targetPort: 8080,
      serviceType: 'ClusterIP',
      namespace: 'default',
      labels: cleanAndMergeLabels({}),
      annotations: {},
      volumes: [],
      configMaps: [],
      secrets: [],
      selectedConfigMaps: [],
      selectedSecrets: [],
      serviceAccount: undefined,
      nodeSelector: {}
    };
    setDaemonSets([...daemonSets, newDaemonSet]);
    setSelectedDaemonSet(daemonSets.length);
    setSidebarTab('daemonsets');
    setShowForm(true);
  };

  const handleDeleteDaemonSet = (index: number) => {
    if (daemonSets.length <= 1) {
      // If it's the last daemonset, remove it completely
      setDaemonSets([]);
      setSelectedDaemonSet(0);
      return;
    }

    const newDaemonSets = daemonSets.filter((_, i) => i !== index);
    setDaemonSets(newDaemonSets);
    
    // Adjust selected daemonset index
    if (selectedDaemonSet >= index) {
      setSelectedDaemonSet(Math.max(0, selectedDaemonSet - 1));
    }
  };

  const handleDuplicateDaemonSet = (index: number) => {
    const daemonSetToDuplicate = daemonSets[index];
    const duplicatedDaemonSet: DaemonSetConfig = {
      ...daemonSetToDuplicate,
      appName: `${daemonSetToDuplicate.appName}-copy`,
      containers: daemonSetToDuplicate.containers.map(container => ({
        ...container,
        name: container.name ? `${container.name}-copy` : ''
      })),
      labels: cleanAndMergeLabels(daemonSetToDuplicate.labels),
      nodeSelector: { ...daemonSetToDuplicate.nodeSelector }
    };
    
    const newDaemonSets = [...daemonSets];
    newDaemonSets.splice(index + 1, 0, duplicatedDaemonSet);
    setDaemonSets(newDaemonSets);
    setSelectedDaemonSet(index + 1);
  };

  // Show loading state while initializing
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading saved configuration...</p>
        </div>
      </div>
    );
  }

  const handleAddRoleBinding = (binding: RoleBinding) => {
    setRoleBindings([...roleBindings, binding]);
    setShowRoleBindingManager(false);
    setEditingRoleBindingIndex(undefined);
  };
  const handleUpdateRoleBinding = (binding: RoleBinding, index: number) => {
    const updated = [...roleBindings];
    updated[index] = binding;
    setRoleBindings(updated);
    setShowRoleBindingManager(false);
    setEditingRoleBindingIndex(undefined);
  };
  const handleDeleteRoleBinding = (index: number) => {
    setRoleBindings(roleBindings.filter((_, i) => i !== index));
  };
  const handleEditRoleBinding = (index: number) => {
    setEditingRoleBindingIndex(index);
    setShowRoleBindingManager(true);
  };

  // Add the handler for duplicating a RoleBinding
  const handleDuplicateRoleBinding = (index: number) => {
    const rbToDuplicate = roleBindings[index];
    const duplicated: RoleBinding = {
      ...rbToDuplicate,
      name: `${rbToDuplicate.name}-copy`,
      // Optionally, you could also add logic to ensure unique names
    };
    const newRoleBindings = [...roleBindings];
    newRoleBindings.splice(index + 1, 0, duplicated);
    setRoleBindings(newRoleBindings);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* SEO Head Component */}
      <SEOHead />
      
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
            {/* Top row: Logo, Title, Menu */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                {sidebarOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
            {/* Advanced Group */}
            <button
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
              onClick={() => {
                if (openGroup === 'advanced') { setOpenGroup(null); } else { setOpenGroup('advanced'); setSidebarTab('advanced'); }
              }}
              aria-expanded={openGroup === 'advanced'}
            >
              <span className="flex items-center gap-2">
                <span className="mr-2">
                  {/* Gear Icon (Heroicons Outline Cog) */}
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 2.25c.414-1.036 1.586-1.036 2 0l.286.716a1.125 1.125 0 001.418.642l.734-.244c1.07-.355 2.07.645 1.715 1.715l-.244.734a1.125 1.125 0 00.642 1.418l.716.286c1.036.414 1.036 1.586 0 2l-.716.286a1.125 1.125 0 00-.642 1.418l.244.734c.355 1.07-.645 2.07-1.715 1.715l-.734-.244a1.125 1.125 0 00-1.418.642l-.286.716c-.414 1.036-1.586 1.036-2 0l-.286-.716a1.125 1.125 0 00-1.418-.642l-.734.244c-1.07.355-2.07-.645-1.715-1.715l.244-.734a1.125 1.125 0 00-.642-1.418l-.716-.286c-1.036-.414-1.036-1.586 0-2l.716-.286a1.125 1.125 0 00.642-1.418l-.244-.734c-.355-1.07.645-2.07 1.715-1.715l.734.244a1.125 1.125 0 001.418-.642l.286-.716z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </span>
                Advanced
              </span>
              <span>{openGroup === 'advanced' ? '▾' : '▸'}</span>
            </button>
            {openGroup === 'advanced' && (
              <div className="pl-6 space-y-1">
                <button
                  onClick={() => handleMenuClick('advanced', 'crds')}
                  className={`flex items-center w-full px-2 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                    sidebarTab === 'crds' ? 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300 shadow-sm border border-gray-200 dark:border-gray-800' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100/50 dark:hover:bg-gray-900/10 hover:text-gray-600 dark:hover:text-gray-300'
                  }`}
                >
                  {/* CRDs icon (Document icon) */}
                  <svg xmlns="http://www.w3.org/2000/svg" className="mr-3 flex-shrink-0 h-6 w-6 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3A2.25 2.25 0 004.5 5.25v13.5A2.25 2.25 0 006.75 21h10.5A2.25 2.25 0 0019.5 18.75V8.25a2.25 2.25 0 00-2.25-2.25h-6.75a.75.75 0 01-.75-.75V3z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 3v4.5a.75.75 0 00.75.75h6.75" />
                  </svg>
                  CRDs
                </button>
              </div>
            )}
              </button>
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <button 
                  onClick={() => {
                    setShowAllResources(true);
                    setSidebarTab('deployments'); // Reset to default tab
                  }}
                  className="text-lg sm:text-xl font-semibold text-gray-900 hover:text-blue-600 transition-colors duration-200 text-left"
                >
                  Kube Composer
                </button>
                <p className="block text-sm text-gray-500">
                  {projectSettings.name ? `Project: ${projectSettings.name}` : 'Kubernetes YAML Generator for developers'}
                  {showAllResources && (
                    <span className="inline-block ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      All Resources
                    </span>
                  )}
                </p>
              </div>
            </div>
            {/* Mobile: Social + Actions grouped and centered, Desktop: inline */}
            <div className="flex flex-col items-center w-full sm:hidden">
              <div className="w-full max-w-sm bg-gray-50 rounded-xl py-2 px-2 shadow-sm mt-2">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <SocialShare />
                </div>
                <div className="flex flex-col space-y-2 w-full">
                  {!hideDemoIcons && !hideHeaderActions && (
                    <>
                      <button
                        onClick={() => setShowDockerPopup(true)}
                        className="inline-flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm font-medium w-full max-w-sm mx-auto"
                        title="Run locally with Docker"
                      >
                        <Docker className="w-4 h-4 mr-1" />
                        <span>Run Locally</span>
                      </button>
                      <button
                        onClick={() => setShowYouTubePopup(true)}
                        className="inline-flex items-center justify-center px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200 text-sm font-medium w-full max-w-sm mx-auto"
                        title="Watch demo video"
                      >
                        <PlayCircle className="w-4 h-4 mr-1" />
                        <span>Watch a Demo</span>
                      </button>
                    </>
                  )}
                  {!hideHeaderActions && (
                    <button
                      onClick={handleDownload}
                      disabled={!hasValidDeployments}
                      className="inline-flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 text-sm font-medium w-full max-w-sm mx-auto"
                      title={hasValidDeployments ? 'Download all deployments as YAML' : 'No valid deployments to download'}
                    >
                      <Download className="w-4 h-4 mr-1" />
                      <span>Download YAML</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
            {/* Desktop: SocialShare inline + actions inline */}
            <div className="hidden sm:flex flex-row items-center space-x-2">
              <SocialShare />
              {!hideDemoIcons && !hideHeaderActions && (
                <>
                  <button
                    onClick={() => setShowDockerPopup(true)}
                    className="inline-flex items-center justify-center px-2 sm:px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm font-medium"
                    title="Run locally with Docker"
                  >
                    <Docker className="w-4 h-4 mr-1" />
                    <span>Run Locally</span>
                  </button>
                  <button
                    onClick={() => setShowYouTubePopup(true)}
                    className="inline-flex items-center justify-center px-2 sm:px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200 text-sm font-medium"
                    title="Watch demo video"
                  >
                    <PlayCircle className="w-4 h-4 mr-1" />
                    <span>Watch a Demo</span>
                  </button>
                </>
              )}
              {!hideHeaderActions && (
                <button
                  onClick={handleDownload}
                  disabled={!hasValidDeployments}
                  className="inline-flex items-center justify-center px-2 sm:px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 text-sm font-medium"
                  title={hasValidDeployments ? 'Download all deployments as YAML' : 'No valid deployments to download'}
                >
                  <Download className="w-4 h-4 mr-1" />
                  <span>Download YAML</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex min-h-0 overflow-hidden" role="main">
        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Left Sidebar - Tabbed Interface */}
        <div className={`
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 fixed lg:relative inset-y-0 left-0 z-50 lg:z-auto
          w-80 lg:w-1/4 xl:w-1/5 bg-white border-r border-gray-200 
          transition-transform duration-300 ease-in-out lg:transition-none
          flex flex-col min-h-0
        `}>
          {/* Project Settings Button */}
          <div className="p-4 border-b border-gray-200 flex-shrink-0">
            <button
              onClick={() => setShowProjectSettings(true)}
              className="w-full inline-flex items-center justify-center px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 text-sm font-medium shadow-md hover:shadow-lg transform hover:scale-105"
            >
              <FolderOpen className="w-4 h-4 mr-2" />
              <span>Project Settings</span>
            </button>
            {Object.keys(projectSettings.globalLabels).length > 0 && (
              <div className="mt-2 text-xs text-gray-600 text-center">
                {Object.keys(projectSettings.globalLabels).length} global label{Object.keys(projectSettings.globalLabels).length !== 1 ? 's' : ''} active
              </div>
            )}
            
            {/* Debug buttons - remove in production */}
            <div className="mt-3">
              <div className="flex space-x-2">
                <button 
                  onClick={() => {
                    console.log('Current state:', { deployments: deployments.length, daemonSets: daemonSets.length, jobs: jobs.length });
                    const success = forceSave();
                    if (success) {
                      alert('Configuration saved successfully!');
                    } else {
                      alert('Failed to save configuration. Please try again.');
                    }
                  }}
                  className="flex-1 px-3 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center space-x-1"
                  title="Save current configuration"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                  <span>Save</span>
                </button>
                <button 
                  onClick={() => {
                    setShowUploadModal(true);
                  }}
                  className="flex-1 px-3 py-2 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center space-x-1"
                  title="Upload configuration file"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                  </svg>
                  <span>Upload</span>
                </button>
                <button 
                  onClick={() => {
                    setShowClearModal(true);
                  }}
                  className="flex-1 px-3 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center space-x-1"
                  title="Clear all configuration data"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span>Clear</span>
                </button>
              </div>
            </div>
          </div>

          {/* Grouped Sidebar Menu */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0 space-y-2">
            {/* Workloads Group */}
            <button
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
              onClick={() => {
                if (openGroup === 'workloads') {
                  setOpenGroup(null);
                } else {
                  setOpenGroup('workloads');
                  setSidebarTab('deployments');
                }
              }}
              aria-expanded={openGroup === 'workloads'}
            >
              <span className="flex items-center gap-2">
                <Database className="w-4 h-4 text-blue-600" />
                Workloads
              </span>
              <span>{openGroup === 'workloads' ? '▾' : '▸'}</span>
            </button>
            {openGroup === 'workloads' && (
              <div className="pl-6 space-y-1">
                <button
                  onClick={() => handleMenuClick('deployments')}
                  className={`flex items-center w-full px-2 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                    sidebarTab === 'deployments' 
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 shadow-sm border border-blue-100 dark:border-blue-800' 
                      : 'text-gray-700 dark:text-gray-200 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 hover:text-blue-600 dark:hover:text-blue-300'
                  }`}
                >
                  <K8sDeploymentIcon className={`mr-3 flex-shrink-0 h-6 w-6 ${
                    sidebarTab === 'deployments' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'
                  }`} />
                  Deployments
                </button>

                <button
                  onClick={() => handleMenuClick('daemonsets')}
                  className={`flex items-center w-full px-2 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                    sidebarTab === 'daemonsets' 
                      ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300 shadow-sm border border-indigo-100 dark:border-indigo-800' 
                      : 'text-gray-700 dark:text-gray-200 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 hover:text-indigo-600 dark:hover:text-indigo-300'
                  }`}
                >
                  <K8sDaemonSetIcon className={`mr-3 flex-shrink-0 h-6 w-6 ${
                    sidebarTab === 'daemonsets' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'
                  }`} />
                  DaemonSets
                </button>

                <button
                  onClick={() => handleMenuClick('namespaces')}
                  className={`flex items-center w-full px-2 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                    sidebarTab === 'namespaces' 
                      ? 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300 shadow-sm border border-purple-100 dark:border-purple-800' 
                      : 'text-gray-700 dark:text-gray-200 hover:bg-purple-50/50 dark:hover:bg-purple-900/10 hover:text-purple-600 dark:hover:text-purple-300'
                  }`}
                >
                  <K8sNamespaceIcon className={`mr-3 flex-shrink-0 h-6 w-6 ${
                    sidebarTab === 'namespaces' ? 'text-purple-600 dark:text-purple-400' : 'text-gray-500 dark:text-gray-400'
                  }`} />
                  Namespaces
                </button>

                <button
                  onClick={() => handleMenuClick('jobs', 'jobs')}
                  className={`flex items-center w-full px-2 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                    sidebarTab === 'jobs' && jobsSubTab === 'jobs'
                      ? 'bg-pink-50 text-pink-700 dark:bg-pink-900/20 dark:text-pink-300 shadow-sm border border-pink-100 dark:border-pink-800' 
                      : 'text-gray-700 dark:text-gray-200 hover:bg-pink-50/50 dark:hover:bg-pink-900/10 hover:text-pink-600 dark:hover:text-pink-300'
                  }`}
                >
                  <K8sJobIcon className={`mr-3 flex-shrink-0 h-6 w-6 ${
                    sidebarTab === 'jobs' && jobsSubTab === 'jobs' ? 'text-pink-600 dark:text-pink-400' : 'text-gray-500 dark:text-gray-400'
                  }`} />
                  Jobs
                </button>

                <button
                  onClick={() => handleMenuClick('jobs', 'cronjobs')}
                  className={`flex items-center w-full px-2 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                    sidebarTab === 'jobs' && jobsSubTab === 'cronjobs'
                      ? 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300 shadow-sm border border-yellow-100 dark:border-yellow-800' 
                      : 'text-gray-700 dark:text-gray-200 hover:bg-yellow-50/50 dark:hover:bg-yellow-900/10 hover:text-yellow-600 dark:hover:text-yellow-300'
                  }`}
                >
                  <K8sCronJobIcon className={`mr-3 flex-shrink-0 h-6 w-6 ${
                    sidebarTab === 'jobs' && jobsSubTab === 'cronjobs' ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-500 dark:text-gray-400'
                  }`} />
                  CronJobs
                </button>


              </div>
            )}
            {/* Storage Group */}
            <button
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
              onClick={() => {
                if (openGroup === 'storage') {
                  setOpenGroup(null);
                } else {
                  setOpenGroup('storage');
                  setSidebarTab('storage');
                  setStorageSubTab('configmaps');
                }
              }}
              aria-expanded={openGroup === 'storage'}
            >
              <span className="flex items-center gap-2">
                <K8sStorageIcon className="w-4 h-4 text-blue-600" />
                Storage
              </span>
              <span>{openGroup === 'storage' ? '▾' : '▸'}</span>
            </button>
            {openGroup === 'storage' && (
              <div className="pl-6 space-y-1">
                <button
                  onClick={() => handleMenuClick('storage', 'configmaps')}
                  className={`flex items-center w-full px-2 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                    sidebarTab === 'storage' && storageSubTab === 'configmaps'
                      ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300 shadow-sm border border-green-100 dark:border-green-800' 
                      : 'text-gray-700 dark:text-gray-200 hover:bg-green-50/50 dark:hover:bg-green-900/10 hover:text-green-600 dark:hover:text-green-300'
                  }`}
                >
                  <K8sConfigMapIcon className={`mr-3 flex-shrink-0 h-6 w-6 ${
                    sidebarTab === 'storage' && storageSubTab === 'configmaps' ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'
                  }`} />
                  ConfigMaps
                </button>
                <button
                  onClick={() => handleMenuClick('storage', 'secrets')}
                  className={`flex items-center w-full px-2 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                    sidebarTab === 'storage' && storageSubTab === 'secrets'
                      ? 'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300 shadow-sm border border-orange-100 dark:border-orange-800' 
                      : 'text-gray-700 dark:text-gray-200 hover:bg-orange-50/50 dark:hover:bg-orange-900/10 hover:text-orange-600 dark:hover:text-orange-300'
                  }`}
                >
                  <K8sSecretIcon className={`mr-3 flex-shrink-0 h-6 w-6 ${
                    sidebarTab === 'storage' && storageSubTab === 'secrets' ? 'text-orange-600 dark:text-orange-400' : 'text-gray-500 dark:text-gray-400'
                  }`} />
                  Secrets
                </button>

                {/* Add back the disabled storage items */}
                <button
                  disabled
                  className="flex items-center w-full px-2 py-2 text-sm font-medium rounded-md text-gray-400 dark:text-gray-600 cursor-not-allowed opacity-50"
                >
                  <K8sStorageIcon className="mr-3 flex-shrink-0 h-6 w-6 text-gray-400 dark:text-gray-600" />
                  PersistentVolumes
                </button>

                <button
                  disabled
                  className="flex items-center w-full px-2 py-2 text-sm font-medium rounded-md text-gray-400 dark:text-gray-600 cursor-not-allowed opacity-50"
                >
                  <K8sStorageIcon className="mr-3 flex-shrink-0 h-6 w-6 text-gray-400 dark:text-gray-600" />
                  PersistentVolumeClaims
                </button>

                <button
                  disabled
                  className="flex items-center w-full px-2 py-2 text-sm font-medium rounded-md text-gray-400 dark:text-gray-600 cursor-not-allowed opacity-50"
                >
                  <K8sStorageIcon className="mr-3 flex-shrink-0 h-6 w-6 text-gray-400 dark:text-gray-600" />
                  StorageClasses
                </button>
              </div>
            )}

            {/* Security Group */}
            <button
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
              onClick={() => {
                if (openGroup === 'security') {
                  setOpenGroup(null);
                } else {
                  setOpenGroup('security');
                  setSidebarTab('security');
                  setSecuritySubTab('serviceaccounts');
                }
              }}
              aria-expanded={openGroup === 'security'}
            >
              <span className="flex items-center gap-2">
                <K8sSecurityIcon className="w-4 h-4 text-blue-600" />
                Security
              </span>
              <span>{openGroup === 'security' ? '▾' : '▸'}</span>
            </button>
            {openGroup === 'security' && (
              <div className="pl-6 space-y-1">
                <button
                  onClick={() => handleMenuClick('security', 'serviceaccounts')}
                  className={`flex items-center w-full px-2 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                    sidebarTab === 'security' && securitySubTab === 'serviceaccounts'
                      ? 'bg-cyan-50 text-cyan-700 dark:bg-cyan-900/20 dark:text-cyan-300 shadow-sm border border-cyan-100 dark:border-cyan-800'
                      : 'text-gray-700 dark:text-gray-200 hover:bg-cyan-50/50 dark:hover:bg-cyan-900/10 hover:text-cyan-600 dark:hover:text-cyan-300'
                  }`}
                >
                  <K8sServiceAccountIcon className={`mr-3 flex-shrink-0 h-6 w-6 ${
                    sidebarTab === 'security' && securitySubTab === 'serviceaccounts' ? 'text-cyan-600 dark:text-cyan-400' : 'text-gray-500 dark:text-gray-400'
                  }`} />
                  Service Accounts
                </button>
                {/* RBAC Roles */}
                <button
                  onClick={() => handleMenuClick('security', 'roles')}
                  className={`flex items-center w-full px-2 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                    sidebarTab === 'security' && securitySubTab === 'roles'
                      ? 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300 shadow-sm border border-purple-100 dark:border-purple-800'
                      : 'text-gray-700 dark:text-gray-200 hover:bg-purple-50/50 dark:hover:bg-purple-900/10 hover:text-purple-600 dark:hover:text-purple-300'
                  }`}
                >
                  <K8sSecurityIcon className={`mr-3 flex-shrink-0 h-6 w-6 ${
                    sidebarTab === 'security' && securitySubTab === 'roles' ? 'text-purple-600 dark:text-purple-400' : 'text-gray-500 dark:text-gray-400'
                  }`} />
                  Roles
                </button>
                {/* RoleBindings - enabled */}
                <button
                  onClick={() => handleMenuClick('security', 'rolebindings')}
                  className={`flex items-center w-full px-2 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                    sidebarTab === 'security' && securitySubTab === 'rolebindings'
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 shadow-sm border border-blue-100 dark:border-blue-800'
                      : 'text-gray-700 dark:text-gray-200 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 hover:text-blue-600 dark:hover:text-blue-300'
                  }`}
                >
                  <Link2 className={`mr-3 flex-shrink-0 h-6 w-6 ${
                    sidebarTab === 'security' && securitySubTab === 'rolebindings' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'
                  }`} />
                  RoleBindings
                </button>


              </div>
            )}
            
            {/* Advanced Group */}
            <button
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
              onClick={() => {
                if (openGroup === 'advanced') {
                  setOpenGroup(null);
                } else {
                  setOpenGroup('advanced');
                  setSidebarTab('crds'); // Set tab to CRDs when opening Advanced
                }
              }}
              aria-expanded={openGroup === 'advanced'}
            >
              <span className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-blue-600" />
                Advanced
              </span>
              <span>{openGroup === 'advanced' ? '▾' : '▸'}</span>
            </button>
            {openGroup === 'advanced' && (
              <div className="pl-6 space-y-1">
                <button
                  onClick={() => handleMenuClick('crds')}
                  className={`flex items-center w-full px-2 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                    sidebarTab === 'crds' 
                      ? 'bg-teal-50 text-teal-700 dark:bg-teal-900/20 dark:text-teal-300 shadow-sm border border-teal-100 dark:border-teal-800' 
                      : 'text-gray-700 dark:text-gray-200 hover:bg-teal-50/50 dark:hover:bg-teal-900/10 hover:text-teal-600 dark:hover:text-teal-300'
                  }`}
                >
                  <FileText className={`mr-3 flex-shrink-0 h-6 w-6 ${
                    sidebarTab === 'crds' ? 'text-teal-600 dark:text-teal-400' : 'text-gray-500 dark:text-gray-400'
                  }`} />
                  CRDs
                </button>
              </div>
            )}
          </div>

          {/* Tab Content */}
          <div className="flex-1 min-h-0">
            {sidebarTab === 'deployments' && (
              <div>
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <button
                    onClick={handleAddDeployment}
                    className="w-full inline-flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 text-sm font-medium"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Deployment
                  </button>
                </div>
                {deployments.length > 0 ? (
                  <DeploymentsList
                    deployments={deployments}
                    selectedIndex={selectedDeployment}
                    onSelect={(index) => {
                      setSelectedDeployment(index);
                      setSidebarOpen(false);
                    }}
                    onEdit={() => setShowForm(true)}
                    onDelete={handleDeleteDeployment}
                    onDuplicate={handleDuplicateDeployment}
                  />
                ) : (
                  <div className="p-6 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FileText className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Deployments</h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Get started by creating your first Kubernetes deployment
                    </p>
                  </div>
                )}
              </div>
            )}

            {sidebarTab === 'daemonsets' && (
              <div>
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <button
                    onClick={handleAddDaemonSet}
                    className="w-full inline-flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200 text-sm font-medium"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add DaemonSet
                  </button>
                </div>
                {daemonSets.length > 0 ? (
                  <DaemonSetsList
                    daemonSets={daemonSets}
                    selectedDaemonSet={selectedDaemonSet}
                    onSelectDaemonSet={(index) => {
                      setSelectedDaemonSet(index);
                      setSidebarOpen(false);
                    }}
                    onEditDaemonSet={() => setShowForm(true)}
                    onDuplicateDaemonSet={handleDuplicateDaemonSet}
                    onDeleteDaemonSet={handleDeleteDaemonSet}
                  />
                ) : (
                  <div className="p-6 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FileText className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No DaemonSets</h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Get started by creating your first Kubernetes DaemonSet
                    </p>
                  </div>
                )}
              </div>
            )}

            {sidebarTab === 'namespaces' && (
              <div className="space-y-4">
                <div className="p-4 border-b border-gray-200">
                  <button
                    onClick={() => setShowNamespaceManager(true)}
                    className="w-full inline-flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200 text-sm font-medium"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Namespace
                  </button>
                </div>
                <NamespacesList
                  namespaces={namespaces}
                  selectedIndex={selectedNamespace}
                  onSelect={(index) => {
                    setSelectedNamespace(index);
                    setSidebarOpen(false);
                  }}
                  onEdit={() => setShowNamespaceManager(true)}
                  onDelete={handleDeleteNamespace}
                  onDuplicate={handleDuplicateNamespace}
                />
              </div>
            )}
            
            {sidebarTab === 'crds' && (
              <div className="space-y-4">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => setShowCrdManager(true)}
                    className="w-full inline-flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200 text-sm font-medium"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Import CRD
                  </button>
                </div>
                <div className="px-4">
                  <CrdList
                    crds={crds}
                    selectedIndex={selectedCrd}
                    onSelect={(index) => {
                      setSelectedCrd(index);
                      setSidebarOpen(false);
                    }}
                    onDelete={(index) => {
                      const updatedCrds = [...crds];
                      updatedCrds.splice(index, 1);
                      setCrds(updatedCrds);
                      forceSave();
                    }}
                    onViewYaml={(crd) => setCrdToView(crd)}
                    onCreateResource={(crd) => setShowCustomResourceForm(crd)}
                  />
                </div>
                
                {/* Custom Resources Section */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <div className="px-4 mb-3">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Custom Resources
                    </h3>
                  </div>
                  <div className="px-4">
                    <CustomResourcesList
                      customResources={customResources}
                      crds={crds}
                      selectedIndex={selectedCustomResource}
                      onSelect={(index) => {
                        setSelectedCustomResource(index);
                        setSidebarOpen(false);
                      }}
                      onDelete={handleDeleteCustomResource}
                      onEdit={handleEditCustomResource}
                      onViewYaml={handleViewCustomResourceYaml}
                    />
                  </div>
                </div>
              </div>
            )}

            {sidebarTab === 'storage' && (
              <>
                {storageSubTab === 'configmaps' && (
                  <>
                    <div className="p-4 border-b border-gray-200">
                      <button
                        onClick={() => setShowConfigMapManager(true)}
                        className="w-full inline-flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 text-sm font-medium"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add ConfigMap
                      </button>
                    </div>
                    <ConfigMapsList
                      configMaps={configMaps}
                      selectedIndex={selectedConfigMap}
                      onSelect={(index) => {
                        setSelectedConfigMap(index);
                        setSidebarOpen(false);
                      }}
                      onEdit={() => setShowConfigMapManager(true)}
                      onDelete={handleDeleteConfigMap}
                      onDuplicate={handleDuplicateConfigMap}
                    />
                  </>
                )}
                {storageSubTab === 'secrets' && (
                  <>
                    <div className="p-4 border-b border-gray-200">
                      <button
                        onClick={() => {
                          setEditingSecretIndex(undefined);
                          setShowSecretManager(true);
                        }}
                        className="w-full inline-flex items-center justify-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors duration-200 text-sm font-medium"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Secret
                      </button>
                    </div>
                    <SecretsList
                      secrets={secrets}
                      selectedIndex={selectedSecret}
                      onSelect={(index) => {
                        setSelectedSecret(index);
                        setSidebarOpen(false);
                      }}
                      onEdit={(index) => {
                        setEditingSecretIndex(index);
                        setShowSecretManager(true);
                      }}
                      onDelete={handleDeleteSecret}
                      onDuplicate={handleDuplicateSecret}
                    />
                  </>
                )}
              </>
            )}

            {sidebarTab === 'jobs' && (
              <>
                {jobsSubTab === 'jobs' && (
                  <>
                    <JobList
                      jobs={jobs.filter(j => j.type === 'job').map(jobToJobConfig)}
                      selectedIndex={selectedJob}
                      onSelect={setSelectedJob}
                      onDelete={idx => {
                        const job = jobs.filter(j => j.type === 'job')[idx];
                        if (job) handleDeleteJob(job.id);
                      }}
                      onEdit={idx => {
                        const job = jobs.filter(j => j.type === 'job')[idx];
                        if (job) handleEditJob(job.id);
                      }}
                    />
                    <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                      <button
                        onClick={() => {
                          setJobTypeToCreate('job');
                          setShowJobManager(true);
                        }}
                        className="w-full inline-flex items-center justify-center px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors duration-200 text-sm font-medium"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Job
                      </button>
                    </div>
                  </>
                )}
                {jobsSubTab === 'cronjobs' && (
                  <>
                    <CronJobList
                      cronjobs={jobs.filter(j => j.type === 'cronjob').map(jobToCronJobConfig)}
                      selectedIndex={selectedCronJob}
                      onSelect={setSelectedCronJob}
                      onDelete={idx => {
                        const job = jobs.filter(j => j.type === 'cronjob')[idx];
                        if (job) handleDeleteJob(job.id);
                      }}
                      onEdit={idx => {
                        const job = jobs.filter(j => j.type === 'cronjob')[idx];
                        if (job) handleEditJob(job.id);
                      }}
                    />
                    <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                      <button
                        onClick={() => {
                          setJobTypeToCreate('cronjob');
                          setShowJobManager(true);
                        }}
                        className="w-full inline-flex items-center justify-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors duration-200 text-sm font-medium"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add CronJob
                      </button>
                    </div>
                  </>
                )}
              </>
            )}



            {sidebarTab === 'security' && (
              <>
                {securitySubTab === 'serviceaccounts' && (
                  <>
                    <div className="p-4 border-b border-gray-200">
                      <button
                        onClick={() => {
                          setEditingServiceAccountIndex(undefined);
                          setShowServiceAccountManager(true);
                        }}
                        className="w-full inline-flex items-center justify-center px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors duration-200 text-sm font-medium"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Service Account
                      </button>
                    </div>
                    <ServiceAccountsList
                      serviceAccounts={serviceAccounts}
                      selectedIndex={selectedServiceAccount}
                      onSelect={(index) => {
                        setSelectedServiceAccount(index);
                        setSidebarOpen(false);
                      }}
                      onEdit={handleEditServiceAccount}
                      onDelete={handleDeleteServiceAccount}
                      onDuplicate={handleDuplicateServiceAccount}
                    />
                  </>
                )}
                {securitySubTab === 'roles' && (
                  <>
                    <div className="p-4 border-b border-gray-200">
                      <button
                        onClick={() => {
                          setEditingRoleIndex(undefined);
                          setIsClusterRoleMode(false);
                          setShowRoleWizard(true);
                        }}
                        className="w-full inline-flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200 text-sm font-medium"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Role
                      </button>
                    </div>
                    <RolesList
                      roles={roles}
                      selectedIndex={selectedRole}
                      onSelect={(index) => {
                        setSelectedRole(index);
                        setSidebarOpen(false);
                      }}
                      onEdit={(index) => {
                        setEditingRoleIndex(index);
                        setIsClusterRoleMode(false);
                        setShowRoleWizard(true);
                      }}
                      onDelete={handleDeleteRole}
                      onDuplicate={handleDuplicateRole}
                    />
                  </>
                )}

                {securitySubTab === 'rolebindings' && (
                  <div className="p-4">
                    <button
                      onClick={() => {
                        setEditingRoleBindingIndex(undefined);
                        setShowRoleBindingManager(true);
                      }}
                      className="w-full inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm font-medium mb-4"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add RoleBinding
                    </button>
                    <div className="mb-6">
                      {roleBindings.length === 0 ? (
                        <div className="p-6 text-center">
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Link2 className="w-8 h-8 text-gray-400" />
                          </div>
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No RoleBindings</h3>
                          <p className="text-sm text-gray-500 mb-4">
                            Create RoleBindings to manage RBAC permissions for users, groups, and service accounts
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2 p-4">
                          {roleBindings.map((rb, i) => {
                            const isSelected = selectedRoleBindingIndex === i;
                            return (
                              <div
                                key={i}
                                onClick={() => setSelectedRoleBindingIndex(i)}
                                className={`p-2 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md hover:bg-blue-50 focus-within:ring-2 focus-within:ring-blue-200 outline-none group
                                  ${isSelected
                                    ? rb.isClusterRoleBinding
                                      ? 'border-blue-500 bg-blue-50 shadow-md'
                                      : 'border-purple-500 bg-purple-50 shadow-md'
                                    : 'border-gray-200 bg-white hover:border-blue-300'}
                                `}
                                tabIndex={0}
                                aria-label={`RoleBinding ${rb.name || '(no name)'}`}
                              >
                                <div className="flex items-center space-x-2 min-w-0 flex-1 mb-1 justify-between">
                                  <div className="flex items-center space-x-2 min-w-0">
                                    <div className="flex-shrink-0">
                                      <div className={`w-7 h-7 rounded-full flex items-center justify-center border ${rb.isClusterRoleBinding ? 'bg-blue-100 border-blue-300' : 'bg-purple-100 border-purple-300'}`}>
                                        {rb.isClusterRoleBinding ? (
                                          <Key className="w-4 h-4 text-blue-600" />
                                        ) : (
                                          <Key className="w-4 h-4 text-purple-600" />
                                        )}
                                      </div>
                                    </div>
                                    <h4
                                      className="text-base font-bold text-gray-900 truncate group-hover:text-blue-700"
                                      title={rb.name || '(no name)'}
                                    >
                                      {rb.name || <span className="italic text-gray-400">(no name)</span>}
                                    </h4>
                                  </div>
                                  <div className="flex items-center space-x-1 flex-shrink-0 ml-2">
                                    {deleteRoleBindingConfirm === i ? (
                                      <div className="flex items-center space-x-1" onClick={e => e.stopPropagation()}>
                                        <button
                                          onClick={e => { e.stopPropagation(); setDeleteRoleBindingConfirm(null); }}
                                          className="px-1.5 py-0.5 text-[10px] bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors duration-200"
                                        >
                                          Cancel
                                        </button>
                                        <button
                                          onClick={e => { e.stopPropagation(); handleDeleteRoleBinding(i); setDeleteRoleBindingConfirm(null); }}
                                          className="px-1.5 py-0.5 text-[10px] bg-red-600 text-white rounded hover:bg-red-700 transition-colors duration-200 flex items-center space-x-1"
                                        >
                                          <AlertTriangle className="w-3 h-3" />
                                          <span>Delete</span>
                                        </button>
                                      </div>
                                    ) : (
                                      <>
                                        <button
                                          onClick={e => { e.stopPropagation(); handleEditRoleBinding(i); }}
                                          className="p-1 text-gray-400 hover:text-blue-600 rounded transition-colors duration-200"
                                          title="Edit RoleBinding"
                                          aria-label="Edit RoleBinding"
                                        >
                                          <Settings className="w-4 h-4" />
                                        </button>
                                        <button
                                          onClick={e => { e.stopPropagation(); handleDuplicateRoleBinding(i); }}
                                          className="p-1 text-gray-400 hover:text-green-600 rounded transition-colors duration-200"
                                          title="Duplicate RoleBinding"
                                          aria-label="Duplicate RoleBinding"
                                        >
                                          <Copy className="w-4 h-4" />
                                        </button>
                                        <button
                                          onClick={e => { e.stopPropagation(); setDeleteRoleBindingConfirm(i); }}
                                          className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors duration-200"
                                          title="Delete RoleBinding"
                                          aria-label="Delete RoleBinding"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </div>
                                <div className="pl-9">
                                  <div className="flex items-center space-x-1 text-[11px] text-gray-500 font-medium mb-0.5">
                                    <span>{rb.isClusterRoleBinding ? 'ClusterRoleBinding' : 'RoleBinding'}</span>
                                    <span>•</span>
                                    <span>{rb.subjects.length} subj</span>
                                  </div>
                                  <div className="flex items-center space-x-1 text-[11px] text-gray-600 mb-0.5">
                                    <span className="truncate" title={`Role: ${rb.roleRef.name} (${rb.roleRef.kind})`}>
                                      <span className="font-semibold">Role:</span> {rb.roleRef.name} <span className="text-gray-400">({rb.roleRef.kind})</span>
                                    </span>
                                    {!rb.isClusterRoleBinding && rb.namespace && <>
                                      <span>•</span>
                                      <span className="truncate" title={`Namespace: ${rb.namespace}`}><span className="font-semibold">NS:</span> {rb.namespace}</span>
                                    </>}
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    {!rb.isClusterRoleBinding && (
                                      <span className="px-1.5 py-0.5 bg-purple-100 text-purple-800 rounded text-[10px] font-semibold tracking-wide border border-purple-200">{rb.namespace}</span>
                                    )}
                                    {rb.isClusterRoleBinding && (
                                      <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded text-[10px] font-semibold tracking-wide border border-blue-200">cluster-wide</span>
                                    )}
                                  </div>
                                </div>
                                {/* Delete confirmation warning */}
                                {deleteRoleBindingConfirm === i && (
                                  <div className="mt-1 p-1 bg-red-50 border border-red-200 rounded text-[10px] text-red-700">
                                    <div className="flex items-center space-x-1 mb-1">
                                      <AlertTriangle className="w-3 h-3" />
                                      <span className="font-medium">Are you sure?</span>
                                    </div>
                                    <div>This action cannot be undone.</div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Right Content - Preview */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          {/* Preview Content with Sticky Header */}
          <div className="flex-1 min-h-0 overflow-y-auto bg-gray-50">
            <div className="sticky top-0 z-10 bg-white border-b border-gray-200 p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                <div className="flex items-center w-full">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                    Preview
                    {previewMode === 'yaml' && deployments.length > 1 && (
                      <span className="ml-2 text-sm font-normal text-gray-500">
                        (All {deployments.filter(d => d.appName).length} deployments)
                      </span>
                    )}
                  </h2>
                  {/* Resource Stats Row - now directly next to Preview */}
                  <div className="hidden md:flex items-center space-x-4 ml-6 px-4 py-1 bg-gray-50 border border-gray-200 rounded-lg shadow-sm">
                    <div className="flex items-center space-x-1 text-sm text-gray-700 font-medium">
                      <FileText className="w-5 h-5 text-blue-500" />
                      <span className="font-bold">{deployments.length}</span>
                      <span className="text-gray-500">deployment{deployments.length !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex items-center space-x-1 text-sm text-gray-700 font-medium">
                      <K8sDaemonSetIcon className="w-5 h-5 text-indigo-500" />
                      <span className="font-bold">{daemonSets.length}</span>
                      <span className="text-gray-500">daemonset{daemonSets.length !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex items-center space-x-1 text-sm text-gray-700 font-medium">
                      <Database className="w-5 h-5 text-purple-500" />
                      <span className="font-bold">{namespaces.length}</span>
                      <span className="text-gray-500">namespace{namespaces.length !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex items-center space-x-1 text-sm text-gray-700 font-medium">
                      <Settings className="w-5 h-5 text-green-500" />
                      <span className="font-bold">{configMaps.length}</span>
                      <span className="text-gray-500">configmap{configMaps.length !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex items-center space-x-1 text-sm text-gray-700 font-medium">
                      <Key className="w-5 h-5 text-orange-500" />
                      <span className="font-bold">{secrets.length}</span>
                      <span className="text-gray-500">secret{secrets.length !== 1 ? 's' : ''}</span>
                    </div>

                    <div className="flex items-center space-x-1 text-sm text-gray-700 font-medium">
                      <K8sJobIcon className="w-5 h-5 text-pink-500" />
                      <span className="font-bold">{jobs.filter(j => j.type === 'job' || j.type === 'cronjob').length}</span>
                      <span className="text-gray-500">job{jobs.filter(j => j.type === 'job' || j.type === 'cronjob').length !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end">
                  <div className="flex items-center space-x-1">
                    {previewModes.map((mode) => {
                      const Icon = mode.icon;
                      return (
                        <button
                          key={mode.id}
                          onClick={() => setPreviewMode(mode.id)}
                          className={`${
                            previewMode === mode.id
                              ? 'bg-blue-100 text-blue-700'
                              : 'text-gray-500 hover:text-gray-700'
                          } px-2 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-medium flex items-center space-x-1 transition-colors duration-200`}
                        >
                          <Icon className="w-4 h-4" />
                          <span className="hidden sm:inline">{mode.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 sm:p-6 pb-8">
              {previewMode === 'flow' && <VisualPreview deployments={deployments} daemonSets={daemonSets} namespaces={namespaces} configMaps={configMaps} secrets={secrets} serviceAccounts={serviceAccounts} roles={roles} clusterRoles={clusterRoles} jobs={jobs} containerRef={containerRef} filterType={getFilterType()} roleBindings={roleBindings} customResources={customResources} crds={crds} />}
              {previewMode === 'summary' && <ResourceSummary deployments={deployments} daemonSets={daemonSets} namespaces={namespaces} configMaps={configMaps} secrets={secrets} serviceAccounts={serviceAccounts} roles={roles} clusterRoles={clusterRoles} jobs={jobs} customResources={customResources} crds={crds} />}
              {previewMode === 'yaml' && <YamlPreview yaml={generatedYaml} />}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />

      {/* YouTube Popup */}
      <YouTubePopup
        isOpen={showYouTubePopup}
        onClose={() => setShowYouTubePopup(false)}
        videoId="LT-1FZXR62o"
      />

      {/* Docker Run Popup */}
      <DockerRunPopup
        isOpen={showDockerPopup}
        onClose={() => setShowDockerPopup(false)}
      />

      {/* Project Settings Modal */}
      {showProjectSettings && (
        <ProjectSettingsManager
          projectSettings={projectSettings}
          onUpdateProjectSettings={handleUpdateProjectSettings}
          onClose={() => setShowProjectSettings(false)}
        />
      )}

      {/* Deployment/DaemonSet Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-2xl mx-auto max-h-[90vh] overflow-y-auto flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {sidebarTab === 'daemonsets' ? 'Create DaemonSet' : 'Create Deployment'}
              </h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="flex-1 p-6 overflow-y-auto">
              {sidebarTab === 'daemonsets' ? (
                <DaemonSetForm
                  config={currentDaemonSetConfig}
                  onChange={handleDaemonSetConfigChange}
                  availableNamespaces={availableNamespaces}
                  availableConfigMaps={configMaps}
                  availableSecrets={secrets}
                />
              ) : (
                <DeploymentForm
                  config={currentConfig}
                  onChange={handleConfigChange}
                  availableNamespaces={availableNamespaces}
                  availableConfigMaps={configMaps}
                  availableSecrets={secrets}
                  availableServiceAccounts={serviceAccounts}
                  onNavigateToServiceAccounts={() => {
                    setShowForm(false);
                    setSidebarTab('security');
                    setSecuritySubTab('serviceaccounts');
                    setShowServiceAccountManager(true);
                  }}
                />
              )}
            </div>
            <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Namespace Manager Modal */}
      {showNamespaceManager && (
        <NamespaceManager
          namespaces={namespaces}
          onAddNamespace={handleAddNamespace}
          onDeleteNamespace={handleDeleteNamespace}
          onClose={() => setShowNamespaceManager(false)}
        />
      )}

      {/* ConfigMap Manager Modal */}
      {showConfigMapManager && (
        <ConfigMapManager
          configMaps={configMaps}
          namespaces={availableNamespaces}
          onAddConfigMap={handleAddConfigMap}
          onDeleteConfigMap={handleDeleteConfigMap}
          onClose={() => setShowConfigMapManager(false)}
        />
      )}

      {/* Secret Manager Modal */}
      {showSecretManager && (
        <SecretManager
          secrets={secrets}
          namespaces={availableNamespaces}
          onAddSecret={handleAddSecret}
          onUpdateSecret={handleUpdateSecret}
          onClose={() => {
            setShowSecretManager(false);
            setEditingSecretIndex(undefined);
          }}
          editingIndex={editingSecretIndex}
        />
      )}



      {/* Service Account Manager Modal */}
      
      {/* CRD Manager Modal */}
      {showCrdManager && (
        <CrdManager
          onAddCrd={(crd: CustomResourceDefinition) => {
            setCrds([...crds, crd]);
            forceSave();
          }}
          onClose={() => {
            setShowCrdManager(false);
          }}
        />
      )}
      
      {/* CRD YAML Viewer Modal */}
      {crdToView && (
        <CrdYamlViewer
          crd={crdToView}
          onClose={() => setCrdToView(null)}
        />
      )}
      {showServiceAccountManager && (
        <ServiceAccountManager
          serviceAccounts={serviceAccounts}
          namespaces={availableNamespaces}
          secrets={secrets}
          onAddServiceAccount={handleAddServiceAccount}
          onUpdateServiceAccount={handleUpdateServiceAccount}
          onClose={() => {
            setShowServiceAccountManager(false);
            setEditingServiceAccountIndex(undefined);
          }}
          editingIndex={editingServiceAccountIndex}
        />
      )}



      {/* Job Manager Modal */}
      {showJobManager && (
        <JobManager
          jobs={jobs}
          namespaces={namespaces.map(ns => ns.name)}
          onAddJob={handleAddJob}
          onUpdateJob={handleUpdateJob}
          onDeleteJob={handleDeleteJob}
          onClose={() => {
            setShowJobManager(false);
            setJobToEdit(undefined);
          }}
          initialJobType={jobTypeToCreate}
          initialJob={jobToEdit}
          availableConfigMaps={configMaps}
          availableSecrets={secrets}
        />
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-md mx-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                <svg className="w-6 h-6 mr-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
                Upload Configuration
              </h3>
              <button 
                onClick={() => setShowUploadModal(false)} 
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Coming Soon!
                </h4>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  The upload functionality is currently under development. You'll soon be able to import your existing Kubernetes configurations directly into Kube Composer.
                </p>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6">
                  <h5 className="font-medium text-gray-900 dark:text-white mb-2">Planned Features:</h5>
                  <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                    <li className="flex items-center">
                      <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Import YAML files
                    </li>
                    <li className="flex items-center">
                      <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Drag & drop support
                    </li>
                    <li className="flex items-center">
                      <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Configuration validation
                    </li>
                    <li className="flex items-center">
                      <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Auto-detection of resources
                    </li>
                  </ul>
                </div>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
                >
                  Got it!
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Clear Configuration Modal */}
      {showClearModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-md mx-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                <svg className="w-6 h-6 mr-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                Clear Configuration
              </h3>
              <button 
                onClick={() => setShowClearModal(false)} 
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Clear All Configuration?
                </h4>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  This action will permanently remove all your deployments, daemonsets, jobs, configmaps, secrets, service accounts, roles, cluster roles, and namespaces. This action cannot be undone.
                </p>
                
                {/* Configuration Summary */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6">
                  <h5 className="font-medium text-gray-900 dark:text-white mb-3">Current Configuration:</h5>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-300">Deployments:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{deployments.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-300">DaemonSets:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{daemonSets.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-300">Jobs:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{jobs.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-300">ConfigMaps:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{configMaps.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-300">Secrets:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{secrets.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-300">Namespaces:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{namespaces.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-300">Service Accounts:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{serviceAccounts.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-300">Roles:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{roles.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-300">ClusterRoles:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{clusterRoles.length}</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <button
                    onClick={() => {
                      handleDownload();
                      setShowClearModal(false);
                    }}
                    className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium flex items-center justify-center space-x-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Download & Clear</span>
                  </button>
                  <button
                    onClick={() => {
                      const success = clearConfig();
                      if (success) {
                        // Reset all state to defaults
                        setDeployments([]);
                        setDaemonSets([]);
                        setJobs([]);
                        setConfigMaps([]);
                        setSecrets([]);
                        setServiceAccounts([]);
                        setNamespaces([{
                          name: 'default',
                          labels: {},
                          annotations: {},
                          createdAt: new Date().toISOString()
                        }]);
                        setProjectSettings({
                          name: 'my-project',
                          description: '',
                          globalLabels: {},
                          createdAt: new Date().toISOString(),
                          updatedAt: new Date().toISOString()
                        });
                        setGeneratedYaml('');
                        setSelectedDeployment(0);
                        setSelectedDaemonSet(0);
                        setSelectedNamespace(0);
                        setSelectedConfigMap(0);
                        setSelectedSecret(0);
                        setSelectedServiceAccount(0);
                        setEditingServiceAccountIndex(undefined);
                        setSelectedJob(-1);
                        setSelectedCronJob(-1);
                        setRoles([]);
                        setClusterRoles([]);
                        setRoleBindings([]);
                        setCrds([]);
                        
                        console.log('Configuration cleared successfully');
                        alert('Configuration cleared successfully!');
                      } else {
                        console.error('Failed to clear configuration');
                        alert('Failed to clear configuration. Please try again.');
                      }
                      setShowClearModal(false);
                    }}
                    className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 font-medium flex items-center justify-center space-x-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span>Clear Without Download</span>
                  </button>
                  <button
                    onClick={() => setShowClearModal(false)}
                    className="w-full px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors duration-200 font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* All modals at the root level */}
      {showRoleWizard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] min-h-[600px] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {editingRoleIndex !== undefined ? 'Edit Role' : 'Create Role'}
              </h3>
              <button onClick={() => { setShowRoleWizard(false); setEditingRoleIndex(undefined); }} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="flex-1 p-6 overflow-y-auto">
              <RoleWizardManager
                namespaces={availableNamespaces}
                roles={roles}
                clusterRoles={clusterRoles}
                initialRole={editingRoleIndex !== undefined ? (isClusterRoleMode ? clusterRoles[editingRoleIndex] : roles[editingRoleIndex]) : undefined}
                isClusterRole={isClusterRoleMode}
                onSubmit={editingRoleIndex !== undefined 
                  ? (role: KubernetesRole | KubernetesClusterRole) => {
                      if (isClusterRoleMode) {
                        handleUpdateClusterRole(role as KubernetesClusterRole, editingRoleIndex);
                      } else {
                        handleUpdateRole(role as KubernetesRole, editingRoleIndex);
                      }
                    }
                  : (role: KubernetesRole | KubernetesClusterRole) => {
                      if (isClusterRoleMode) {
                        handleAddClusterRole(role as KubernetesClusterRole);
                      } else {
                        handleAddRole(role as KubernetesRole);
                      }
                    }
                }
                onCancel={() => { 
                  setShowRoleWizard(false); 
                  setEditingRoleIndex(undefined);
                  if (reopenRoleBindingAfterRole) {
                    setShowRoleBindingManager(true);
                    setReopenRoleBindingAfterRole(false);
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}
      {showRoleBindingManager && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] min-h-[600px] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {editingRoleBindingIndex !== undefined ? 'Edit RoleBinding' : 'Create RoleBinding'}
              </h3>
              <button onClick={() => { setShowRoleBindingManager(false); setEditingRoleBindingIndex(undefined); }} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="flex-1 p-6 overflow-y-auto">
              <RoleBindingManager
                namespaces={availableNamespaces}
                roles={roles.map(r => ({ name: r.metadata.name, namespace: r.metadata.namespace, description: r.metadata.annotations?.description }))}
                clusterRoles={clusterRoles.map(r => ({ name: r.metadata.name, description: r.metadata.annotations?.description }))}
                serviceAccounts={serviceAccounts}
                initialBinding={editingRoleBindingIndex !== undefined ? roleBindings[editingRoleBindingIndex] : undefined}
                onSubmit={editingRoleBindingIndex !== undefined ? (binding: RoleBinding) => handleUpdateRoleBinding(binding, editingRoleBindingIndex) : handleAddRoleBinding}
                onCancel={() => { setShowRoleBindingManager(false); setEditingRoleBindingIndex(undefined); }}
              />
            </div>
          </div>
        </div>
      )}
      
      {/* Custom Resource Form Modal */}
      {showCustomResourceForm && (
        <CustomResourceForm
          crd={showCustomResourceForm}
          existingCr={editingCustomResource || undefined}
          onSave={handleSaveCustomResource}
          onClose={() => {
            setShowCustomResourceForm(null);
            setEditingCustomResource(null);
          }}
        />
      )}

      {/* Custom Resource YAML Viewer Modal */}
      {customResourceToView && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Custom Resource YAML
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {customResourceToView.kind} - {customResourceToView.name}
                </p>
              </div>
              <button 
                onClick={() => setCustomResourceToView(null)} 
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 p-6 overflow-y-auto">
              <YamlPreview yaml={generateCustomResourceYaml([customResourceToView], projectSettings)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;