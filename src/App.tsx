import { useState } from 'react';
import { Download, Eye, FileText, List, Plus, Menu, X, Database, Settings, Key } from 'lucide-react';
import { DeploymentForm } from './components/DeploymentForm';
import { YamlPreview } from './components/YamlPreview';
import { ResourceSummary } from './components/ResourceSummary';
import { DeploymentsList } from './components/DeploymentsList';
import { NamespacesList } from './components/NamespacesList';
import { ConfigMapsList } from './components/ConfigMapsList';
import { SecretsList } from './components/SecretsList';
import { ArchitecturePreview } from './components/ArchitecturePreview';
import { Footer } from './components/Footer';
import { SocialShare } from './components/SocialShare';
import { SEOHead } from './components/SEOHead';
import { NamespaceManager } from './components/NamespaceManager';
import { ConfigMapManager } from './components/ConfigMapManager';
import { SecretManager } from './components/SecretManager';
import { generateMultiDeploymentYaml } from './utils/yamlGenerator';
import type { DeploymentConfig, Namespace, ConfigMap, Secret } from './types';

type PreviewMode = 'visual' | 'yaml' | 'summary';
type SidebarTab = 'deployments' | 'namespaces' | 'configmaps' | 'secrets';

function App() {
  const [deployments, setDeployments] = useState<DeploymentConfig[]>([]);
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
  const [selectedDeployment, setSelectedDeployment] = useState<number>(0);
  const [selectedNamespace, setSelectedNamespace] = useState<number>(0);
  const [selectedConfigMap, setSelectedConfigMap] = useState<number>(0);
  const [selectedSecret, setSelectedSecret] = useState<number>(0);
  const [previewMode, setPreviewMode] = useState<PreviewMode>('visual');
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('deployments');
  const [showForm, setShowForm] = useState(false);
  const [showNamespaceManager, setShowNamespaceManager] = useState(false);
  const [showConfigMapManager, setShowConfigMapManager] = useState(false);
  const [showSecretManager, setShowSecretManager] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
    },
    hpa: {
      enabled: false,
      minReplicas: 1,
      maxReplicas: 10,
      targetCPUUtilizationPercentage: 80,
      targetMemoryUtilizationPercentage: undefined,
      scaleUpPolicy: undefined,
      scaleDownPolicy: undefined
    }
  };

  // Get available namespaces from all deployments
  const availableNamespaces = [...new Set([
    ...namespaces.map(ns => ns.name),
    ...deployments.map(d => d.namespace).filter(Boolean)
  ])];

  const handleConfigChange = (newConfig: DeploymentConfig) => {
    const newDeployments = [...deployments];
    if (selectedDeployment < deployments.length) {
      newDeployments[selectedDeployment] = newConfig;
    } else {
      newDeployments.push(newConfig);
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
      },
      hpa: {
        enabled: false,
        minReplicas: 1,
        maxReplicas: 10,
        targetCPUUtilizationPercentage: 80,
        targetMemoryUtilizationPercentage: undefined,
        scaleUpPolicy: undefined,
        scaleDownPolicy: undefined
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
      ingress: {
        ...deploymentToDuplicate.ingress,
        rules: deploymentToDuplicate.ingress.rules.map(rule => ({
          ...rule,
          serviceName: `${deploymentToDuplicate.appName}-copy-service`
        }))
      },
      hpa: {
        ...deploymentToDuplicate.hpa
      }
    };
    
    const newDeployments = [...deployments];
    newDeployments.splice(index + 1, 0, duplicatedDeployment);
    setDeployments(newDeployments);
    setSelectedDeployment(index + 1);
  };

  // Namespace management
  const handleAddNamespace = (namespace: Namespace) => {
    setNamespaces([...namespaces, namespace]);
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
      createdAt: new Date().toISOString()
    };
    
    const newNamespaces = [...namespaces];
    newNamespaces.splice(index + 1, 0, duplicatedNamespace);
    setNamespaces(newNamespaces);
    setSelectedNamespace(index + 1);
  };

  // ConfigMap management
  const handleAddConfigMap = (configMap: ConfigMap) => {
    setConfigMaps([...configMaps, configMap]);
    setShowConfigMapManager(false);
    setSidebarTab('configmaps');
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
      createdAt: new Date().toISOString()
    };
    
    const newConfigMaps = [...configMaps];
    newConfigMaps.splice(index + 1, 0, duplicatedConfigMap);
    setConfigMaps(newConfigMaps);
    setSelectedConfigMap(index + 1);
  };

  // Secret management
  const handleAddSecret = (secret: Secret) => {
    setSecrets([...secrets, secret]);
    setShowSecretManager(false);
    setSidebarTab('secrets');
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
    
    const newSecrets = [...secrets];
    newSecrets.splice(index + 1, 0, duplicatedSecret);
    setSecrets(newSecrets);
    setSelectedSecret(index + 1);
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
    
    const yaml = generateMultiDeploymentYaml(validDeployments, namespaces, configMaps, secrets);
    const blob = new Blob([yaml], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    // Create filename based on number of deployments
    const filename = validDeployments.length === 1 
      ? `${validDeployments[0].appName}-deployment.yaml`
      : `kubernetes-deployments-${validDeployments.length}.yaml`;
    
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Generate YAML for preview based on mode
  const getPreviewYaml = () => {
    if (deployments.length === 0 && namespaces.length <= 1 && configMaps.length === 0 && secrets.length === 0) {
      return '# No deployments configured\n# Create your first deployment to see the generated YAML';
    }
    
    const validDeployments = deployments.filter(d => d.appName);
    return generateMultiDeploymentYaml(validDeployments, namespaces, configMaps, secrets);
  };

  const previewModes = [
    { id: 'visual' as const, label: 'Visual', icon: Eye },
    { id: 'summary' as const, label: 'Summary', icon: List },
    { id: 'yaml' as const, label: 'YAML', icon: FileText }
  ];

  // Check if download should be enabled
  const hasValidDeployments = deployments.some(d => d.appName);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* SEO Head Component */}
      <SEOHead />
      
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {/* Mobile menu button */}
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
              <div>
                <a 
                  href="https://kube-composer.com" 
                  className="text-lg sm:text-xl font-semibold text-gray-900 hover:text-blue-600 transition-colors duration-200"
                >
                  Kube Composer
                </a>
                <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">Kubernetes YAML Generator for developers</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Stats - Hidden on mobile */}
              <div className="hidden lg:flex items-center space-x-4">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <FileText className="w-4 h-4" />
                  <span>{deployments.length} deployment{deployments.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Database className="w-4 h-4" />
                  <span>{namespaces.length} namespace{namespaces.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Settings className="w-4 h-4" />
                  <span>{configMaps.length} configmap{configMaps.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Key className="w-4 h-4" />
                  <span>{secrets.length} secret{secrets.length !== 1 ? 's' : ''}</span>
                </div>
                <SocialShare />
              </div>
              
              {/* Action Buttons */}
              <button
                onClick={handleAddDeployment}
                className="inline-flex items-center px-2 sm:px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 text-sm font-medium"
                title="Add new deployment"
              >
                <Plus className="w-4 h-4 sm:mr-1" />
                <span className="hidden sm:inline">Add Deployment</span>
              </button>
              <button
                onClick={handleDownload}
                disabled={!hasValidDeployments}
                className="inline-flex items-center px-2 sm:px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 text-sm font-medium"
                title={hasValidDeployments ? 'Download all deployments as YAML' : 'No valid deployments to download'}
              >
                <Download className="w-4 h-4 sm:mr-1" />
                <span className="hidden sm:inline">Download YAML</span>
              </button>
            </div>
          </div>
          
          {/* Mobile Stats Row */}
          <div className="lg:hidden mt-3 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <FileText className="w-4 h-4" />
                <span>{deployments.length}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Database className="w-4 h-4" />
                <span>{namespaces.length}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Settings className="w-4 h-4" />
                <span>{configMaps.length}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Key className="w-4 h-4" />
                <span>{secrets.length}</span>
              </div>
            </div>
            <SocialShare />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden">
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
          flex flex-col
        `}>
          {/* Tab Headers */}
          <div className="p-4 border-b border-gray-200 flex-shrink-0">
            <div className="grid grid-cols-2 gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setSidebarTab('deployments')}
                className={`flex items-center justify-center space-x-1 px-2 py-2 rounded-md text-xs font-medium transition-all duration-200 ${
                  sidebarTab === 'deployments'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <FileText className="w-3 h-3" />
                <span>Deployments</span>
              </button>
              <button
                onClick={() => setSidebarTab('namespaces')}
                className={`flex items-center justify-center space-x-1 px-2 py-2 rounded-md text-xs font-medium transition-all duration-200 ${
                  sidebarTab === 'namespaces'
                    ? 'bg-white text-purple-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Database className="w-3 h-3" />
                <span>Namespaces</span>
              </button>
              <button
                onClick={() => setSidebarTab('configmaps')}
                className={`flex items-center justify-center space-x-1 px-2 py-2 rounded-md text-xs font-medium transition-all duration-200 ${
                  sidebarTab === 'configmaps'
                    ? 'bg-white text-green-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Settings className="w-3 h-3" />
                <span>ConfigMaps</span>
              </button>
              <button
                onClick={() => setSidebarTab('secrets')}
                className={`flex items-center justify-center space-x-1 px-2 py-2 rounded-md text-xs font-medium transition-all duration-200 ${
                  sidebarTab === 'secrets'
                    ? 'bg-white text-orange-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Key className="w-3 h-3" />
                <span>Secrets</span>
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto">
            {sidebarTab === 'deployments' && (
              deployments.length > 0 ? (
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
                  <button
                    onClick={handleAddDeployment}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm font-medium"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Deployment
                  </button>
                </div>
              )
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

            {sidebarTab === 'configmaps' && (
              <div className="space-y-4">
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
              </div>
            )}

            {sidebarTab === 'secrets' && (
              <div className="space-y-4">
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
              </div>
            )}
          </div>
        </div>

        {/* Right Content - Preview */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Preview Header */}
          <div className="bg-white border-b border-gray-200 p-4 flex-shrink-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
              <h2 className="text-lg font-semibold text-gray-900">
                Preview
                {previewMode === 'yaml' && deployments.length > 1 && (
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    (All {deployments.filter(d => d.appName).length} deployments)
                  </span>
                )}
              </h2>
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

          {/* Preview Content */}
          <div className="flex-1 overflow-y-auto bg-gray-50">
            <div className="p-4 sm:p-6 pb-8">
              {previewMode === 'visual' && <ArchitecturePreview deployments={deployments} />}
              {previewMode === 'yaml' && <YamlPreview yaml={getPreviewYaml()} />}
              {previewMode === 'summary' && <ResourceSummary config={currentConfig} />}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />

      {/* Deployment Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
              <h3 className="text-xl font-semibold text-gray-900">
                {currentConfig.appName ? `Edit ${currentConfig.appName}` : 'Create New Deployment'}
              </h3>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <DeploymentForm 
                config={currentConfig} 
                onChange={handleConfigChange}
                availableNamespaces={availableNamespaces}
                availableConfigMaps={configMaps}
                availableSecrets={secrets}
              />
            </div>
            
            {/* Modal Footer */}
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
              <button
                onClick={() => setShowForm(false)}
                className="px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium shadow-sm"
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
    </div>
  );
}

export default App;