import { useState, useRef, useEffect } from 'react';
import { Download, FileText, List, Plus, Menu, X, Database, Settings, Key, PlayCircle, Container as Docker, FolderOpen, GitBranch, Clock } from 'lucide-react';
import { DeploymentForm } from './components/DeploymentForm';
import { DaemonSetForm } from './components/DaemonSetForm';
import { YamlPreview } from './components/YamlPreview';
import { ResourceSummary } from './components/ResourceSummary';
import { DeploymentsList } from './components/DeploymentsList';
import { DaemonSetsList } from './components/DaemonSetsList';
import { NamespacesList } from './components/NamespacesList';
import { ConfigMapsList } from './components/ConfigMapsList';
import { SecretsList } from './components/SecretsList';
import { VisualPreview } from './components/VisualPreview';
import { Footer } from './components/Footer';
import { SocialShare } from './components/SocialShare';
import { SEOHead } from './components/SEOHead';
import { NamespaceManager } from './components/NamespaceManager';
import { ConfigMapManager } from './components/ConfigMapManager';
import { SecretManager } from './components/SecretManager';
import { ProjectSettingsManager } from './components/ProjectSettingsManager';
import { YouTubePopup } from './components/YouTubePopup';
import { DockerRunPopup } from './components/DockerRunPopup';
import { generateMultiDeploymentYaml } from './utils/yamlGenerator';
import { JobManager, Job } from './components/JobManager';
import { JobList } from './components/jobs/JobList';
import { CronJobList } from './components/jobs/CronJobList';
import type { DeploymentConfig, DaemonSetConfig, Namespace, ConfigMap, Secret, ProjectSettings, JobConfig, CronJobConfig } from './types';
import {
  K8sDeploymentIcon,
  K8sNamespaceIcon,
  K8sConfigMapIcon,
  K8sSecretIcon,
  K8sJobIcon,
  K8sCronJobIcon,
  K8sStorageIcon,
  K8sDaemonSetIcon,
  K8sPodIcon
} from './components/KubernetesIcons';

type PreviewMode = 'visual' | 'yaml' | 'summary' | 'argocd' | 'flow';
type SidebarTab = 'deployments' | 'daemonsets' | 'namespaces' | 'storage' | 'jobs' | 'configmaps' | 'secrets';

function App() {
  const hideDemoIcons = import.meta.env.VITE_HIDE_DEMO_ICONS === 'true';
  
  const [projectSettings, setProjectSettings] = useState<ProjectSettings>({
    name: 'my-project',
    description: '',
    globalLabels: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  const [deployments, setDeployments] = useState<DeploymentConfig[]>([]);
  const [daemonSets, setDaemonSets] = useState<DaemonSetConfig[]>([]);
  const [namespaces, setNamespaces] = useState<Namespace[]>([
    {
      name: 'default',
      labels: {},
      annotations: {},
      createdAt: new Date().toISOString()
    }
  ]);
  const [configMaps, setConfigMaps] = useState<ConfigMap[]>([]);
  const [secrets, setSecrets] = useState<Secret[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedDeployment, setSelectedDeployment] = useState<number>(0);
  const [selectedDaemonSet, setSelectedDaemonSet] = useState<number>(0);
  const [selectedNamespace, setSelectedNamespace] = useState<number>(0);
  const [selectedConfigMap, setSelectedConfigMap] = useState<number>(0);
  const [selectedSecret, setSelectedSecret] = useState<number>(0);
  const [previewMode, setPreviewMode] = useState<PreviewMode>('flow');
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('deployments');
  const [storageSubTab, setStorageSubTab] = useState<'configmaps' | 'secrets'>('configmaps');
  const [jobsSubTab, setJobsSubTab] = useState<'jobs' | 'cronjobs'>('jobs');
  const [showForm, setShowForm] = useState(false);
  const [showNamespaceManager, setShowNamespaceManager] = useState(false);
  const [showConfigMapManager, setShowConfigMapManager] = useState(false);
  const [showSecretManager, setShowSecretManager] = useState(false);
  const [showJobManager, setShowJobManager] = useState(false);
  const [jobTypeToCreate, setJobTypeToCreate] = useState<'job' | 'cronjob'>('job');
  const [showProjectSettings, setShowProjectSettings] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showYouTubePopup, setShowYouTubePopup] = useState(false);
  const [showDockerPopup, setShowDockerPopup] = useState(false);
  // Only one group open at a time: 'workloads' | 'storage'
  const [openGroup, setOpenGroup] = useState<'workloads' | 'storage'>('workloads');
  const [jobToEdit, setJobToEdit] = useState<Job | undefined>(undefined);
  const [selectedJob, setSelectedJob] = useState<number>(-1);
  const [selectedCronJob, setSelectedCronJob] = useState<number>(-1);

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
    const yaml = generateMultiDeploymentYaml(validDeployments, namespaces, configMaps, secrets, projectSettings, jobConfigs, cronJobConfigs, validDaemonSets);
    if (
      validDeployments.length === 0 &&
      validDaemonSets.length === 0 &&
      jobConfigs.length === 0 &&
      cronJobConfigs.length === 0 &&
      namespaces.length <= 1 &&
      configMaps.length === 0 &&
      secrets.length === 0
    ) {
      return '# No deployments, daemonsets, or jobs configured\n# Create your first deployment, daemonset, or job to see the generated YAML';
    }
    return yaml;
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

  useEffect(() => {
    // Ensure the correct group is open based on the selected tab
    if (sidebarTab === 'storage' || sidebarTab === 'configmaps' || sidebarTab === 'secrets') {
      setOpenGroup('storage');
    } else {
      setOpenGroup('workloads');
    }
  }, [sidebarTab]);

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

  // Function to handle menu item clicks and set appropriate preview mode
  const handleMenuClick = (tab: SidebarTab, subTab?: string) => {
    setSidebarTab(tab);
    
    // Set preview mode based on the selected tab
    if (tab === 'deployments' || tab === 'daemonsets') {
      setPreviewMode('flow');
    } else {
      setPreviewMode('yaml');
    }
    
    // Handle sub-tabs
    if (subTab === 'configmaps') {
      setStorageSubTab('configmaps');
    } else if (subTab === 'secrets') {
      setStorageSubTab('secrets');
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
              </button>
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <a 
                  href="https://kube-composer.com" 
                  className="text-lg sm:text-xl font-semibold text-gray-900 hover:text-blue-600 transition-colors duration-200"
                >
                  Kube Composer
                </a>
                <p className="block text-sm text-gray-500">
                  {projectSettings.name ? `Project: ${projectSettings.name}` : 'Kubernetes YAML Generator for developers'}
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
                  {!hideDemoIcons && (
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
                  <button
                    onClick={handleDownload}
                    disabled={!hasValidDeployments}
                    className="inline-flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 text-sm font-medium w-full max-w-sm mx-auto"
                    title={hasValidDeployments ? 'Download all deployments as YAML' : 'No valid deployments to download'}
                  >
                    <Download className="w-4 h-4 mr-1" />
                    <span>Download YAML</span>
                  </button>
                </div>
              </div>
            </div>
            {/* Desktop: SocialShare inline + actions inline */}
            <div className="hidden sm:flex flex-row items-center space-x-2">
              <SocialShare />
              {!hideDemoIcons && (
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
              <button
                onClick={handleDownload}
                disabled={!hasValidDeployments}
                className="inline-flex items-center justify-center px-2 sm:px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 text-sm font-medium"
                title={hasValidDeployments ? 'Download all deployments as YAML' : 'No valid deployments to download'}
              >
                <Download className="w-4 h-4 mr-1" />
                <span>Download YAML</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex min-h-0 overflow-hidden">
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
          </div>

          {/* Grouped Sidebar Menu */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0 space-y-2">
            {/* Workloads Group */}
            <button
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
              onClick={() => setOpenGroup('workloads')}
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

                <button
                  disabled
                  className="flex items-center w-full px-2 py-2 text-sm font-medium rounded-md text-gray-400 dark:text-gray-600 cursor-not-allowed opacity-50"
                >
                  <K8sPodIcon className="mr-3 flex-shrink-0 h-6 w-6 text-gray-400 dark:text-gray-600" />
                  Pods
                </button>
              </div>
            )}
            {/* Storage Group */}
            <button
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
              onClick={() => setOpenGroup('storage')}
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
          </div>

          {/* Tab Content */}
          <div className="flex-1 min-h-0 overflow-y-auto">
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
                        onClick={() => setShowSecretManager(true)}
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
                      onEdit={() => setShowSecretManager(true)}
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
                      <span className="font-bold">{jobs.filter(j => j.type === 'job').length}</span>
                      <span className="text-gray-500">job{jobs.filter(j => j.type === 'job').length !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex items-center space-x-1 text-sm text-gray-700 font-medium">
                      <Clock className="w-5 h-5 text-yellow-500" />
                      <span className="font-bold">{jobs.filter(j => j.type === 'cronjob').length}</span>
                      <span className="text-gray-500">cronjob{jobs.filter(j => j.type === 'cronjob').length !== 1 ? 's' : ''}</span>
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
              {previewMode === 'flow' && <VisualPreview deployments={deployments} daemonSets={daemonSets} namespaces={namespaces} configMaps={configMaps} secrets={secrets} containerRef={containerRef} />}
              {previewMode === 'summary' && <ResourceSummary config={currentConfig} />}
              {previewMode === 'yaml' && <YamlPreview yaml={getPreviewYaml()} />}
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
          onDeleteSecret={handleDeleteSecret}
          onClose={() => setShowSecretManager(false)}
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
    </div>
  );
}

export default App;