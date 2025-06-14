import { useState } from 'react';
import { 
  Plus, 
  X, 
  Server, 
  Globe, 
  Database, 
  Settings, 
  HardDrive, 
  AlertTriangle, 
  Info, 
  TrendingUp,
  Activity
} from 'lucide-react';
import type { DeploymentConfig, Container, EnvVar, ConfigMap, Secret } from '../types';

interface DeploymentFormProps {
  config: DeploymentConfig;
  onChange: (config: DeploymentConfig) => void;
  availableNamespaces: string[];
  availableConfigMaps: ConfigMap[];
  availableSecrets: Secret[];
}

export function DeploymentForm({ 
  config, 
  onChange, 
  availableNamespaces, 
  availableConfigMaps, 
  availableSecrets 
}: DeploymentFormProps) {
  const [activeTab, setActiveTab] = useState<'basic' | 'containers' | 'networking' | 'storage' | 'scaling'>('basic');
  const [newLabel, setNewLabel] = useState({ key: '', value: '' });
  const [newAnnotation, setNewAnnotation] = useState({ key: '', value: '' });
  const [newVolume, setNewVolume] = useState({ 
    name: '', 
    mountPath: '', 
    type: 'emptyDir' as const,
    configMapName: '',
    secretName: ''
  });
  const [newIngressRule, setNewIngressRule] = useState({
    host: '',
    path: '/',
    pathType: 'Prefix' as const,
    serviceName: config.appName ? `${config.appName}-service` : '',
    servicePort: config.port || 80
  });
  const [newTLS, setNewTLS] = useState({
    secretName: '',
    hosts: ['']
  });

  const tabs = [
    { id: 'basic' as const, label: 'Basic', icon: Server },
    { id: 'containers' as const, label: 'Containers', icon: Database },
    { id: 'networking' as const, label: 'Networking', icon: Globe },
    { id: 'storage' as const, label: 'Storage', icon: HardDrive },
    { id: 'scaling' as const, label: 'Scaling', icon: TrendingUp }
  ];

  const updateConfig = (updates: Partial<DeploymentConfig>) => {
    onChange({ ...config, ...updates });
  };

  const addContainer = () => {
    const newContainer: Container = {
      name: '',
      image: '',
      port: 8080,
      env: [],
      resources: {
        requests: { cpu: '', memory: '' },
        limits: { cpu: '', memory: '' }
      },
      volumeMounts: []
    };
    
    const containers = config.containers || [];
    updateConfig({ containers: [...containers, newContainer] });
  };

  const updateContainer = (index: number, updates: Partial<Container>) => {
    const containers = [...(config.containers || [])];
    containers[index] = { ...containers[index], ...updates };
    updateConfig({ containers });
  };

  const removeContainer = (index: number) => {
    const containers = config.containers?.filter((_, i) => i !== index) || [];
    updateConfig({ containers });
  };

  const addEnvVar = (containerIndex: number) => {
    const containers = [...(config.containers || [])];
    const newEnvVar: EnvVar = { name: '', value: '' };
    containers[containerIndex].env.push(newEnvVar);
    updateConfig({ containers });
  };

  const updateEnvVar = (containerIndex: number, envIndex: number, updates: Partial<EnvVar>) => {
    const containers = [...(config.containers || [])];
    containers[containerIndex].env[envIndex] = { 
      ...containers[containerIndex].env[envIndex], 
      ...updates 
    };
    updateConfig({ containers });
  };

  const removeEnvVar = (containerIndex: number, envIndex: number) => {
    const containers = [...(config.containers || [])];
    containers[containerIndex].env = containers[containerIndex].env.filter((_, i) => i !== envIndex);
    updateConfig({ containers });
  };

  const addVolumeMount = (containerIndex: number) => {
    const containers = [...(config.containers || [])];
    containers[containerIndex].volumeMounts.push({ name: '', mountPath: '' });
    updateConfig({ containers });
  };

  const updateVolumeMount = (containerIndex: number, mountIndex: number, updates: { name?: string; mountPath?: string }) => {
    const containers = [...(config.containers || [])];
    containers[containerIndex].volumeMounts[mountIndex] = {
      ...containers[containerIndex].volumeMounts[mountIndex],
      ...updates
    };
    updateConfig({ containers });
  };

  const removeVolumeMount = (containerIndex: number, mountIndex: number) => {
    const containers = [...(config.containers || [])];
    containers[containerIndex].volumeMounts = containers[containerIndex].volumeMounts.filter((_, i) => i !== mountIndex);
    updateConfig({ containers });
  };

  const addLabel = () => {
    if (newLabel.key && newLabel.value) {
      updateConfig({
        labels: { ...config.labels, [newLabel.key]: newLabel.value }
      });
      setNewLabel({ key: '', value: '' });
    }
  };

  const removeLabel = (key: string) => {
    const { [key]: removed, ...rest } = config.labels;
    updateConfig({ labels: rest });
  };

  const addAnnotation = () => {
    if (newAnnotation.key && newAnnotation.value) {
      updateConfig({
        annotations: { ...config.annotations, [newAnnotation.key]: newAnnotation.value }
      });
      setNewAnnotation({ key: '', value: '' });
    }
  };

  const removeAnnotation = (key: string) => {
    const { [key]: removed, ...rest } = config.annotations;
    updateConfig({ annotations: rest });
  };

  const addVolume = () => {
    if (newVolume.name && newVolume.mountPath) {
      const volume = {
        name: newVolume.name,
        mountPath: newVolume.mountPath,
        type: newVolume.type,
        ...(newVolume.type === 'configMap' && { configMapName: newVolume.configMapName }),
        ...(newVolume.type === 'secret' && { secretName: newVolume.secretName })
      };
      updateConfig({
        volumes: [...config.volumes, volume]
      });
      setNewVolume({ name: '', mountPath: '', type: 'emptyDir', configMapName: '', secretName: '' });
    }
  };

  const removeVolume = (index: number) => {
    updateConfig({
      volumes: config.volumes.filter((_, i) => i !== index)
    });
  };

  const addIngressRule = () => {
    if (newIngressRule.path) {
      const rule = {
        ...newIngressRule,
        serviceName: newIngressRule.serviceName || `${config.appName}-service`,
        servicePort: newIngressRule.servicePort || config.port
      };
      updateConfig({
        ingress: {
          ...config.ingress,
          rules: [...config.ingress.rules, rule]
        }
      });
      setNewIngressRule({
        host: '',
        path: '/',
        pathType: 'Prefix',
        serviceName: config.appName ? `${config.appName}-service` : '',
        servicePort: config.port || 80
      });
    }
  };

  const removeIngressRule = (index: number) => {
    updateConfig({
      ingress: {
        ...config.ingress,
        rules: config.ingress.rules.filter((_, i) => i !== index)
      }
    });
  };

  const addTLS = () => {
    if (newTLS.secretName && newTLS.hosts[0]) {
      updateConfig({
        ingress: {
          ...config.ingress,
          tls: [...config.ingress.tls, { ...newTLS, hosts: newTLS.hosts.filter(h => h.trim()) }]
        }
      });
      setNewTLS({ secretName: '', hosts: [''] });
    }
  };

  const removeTLS = (index: number) => {
    updateConfig({
      ingress: {
        ...config.ingress,
        tls: config.ingress.tls.filter((_, i) => i !== index)
      }
    });
  };

  const updateTLSHost = (index: number, value: string) => {
    const hosts = [...newTLS.hosts];
    hosts[index] = value;
    setNewTLS({ ...newTLS, hosts });
  };

  const addTLSHost = () => {
    setNewTLS({ ...newTLS, hosts: [...newTLS.hosts, ''] });
  };

  const removeTLSHost = (index: number) => {
    setNewTLS({ ...newTLS, hosts: newTLS.hosts.filter((_, i) => i !== index) });
  };

  // Initialize containers if empty
  if (!config.containers || config.containers.length === 0) {
    const defaultContainer: Container = {
      name: config.appName || 'app',
      image: '',
      port: config.targetPort || 8080,
      env: [],
      resources: {
        requests: { cpu: '', memory: '' },
        limits: { cpu: '', memory: '' }
      },
      volumeMounts: []
    };
    updateConfig({ containers: [defaultContainer] });
  }

  // Validation functions
  const validateHPA = () => {
    const errors = [];
    if (config.hpa.enabled) {
      if (config.hpa.minReplicas <= 0) {
        errors.push('Minimum replicas must be greater than 0');
      }
      if (config.hpa.maxReplicas <= config.hpa.minReplicas) {
        errors.push('Maximum replicas must be greater than minimum replicas');
      }
      if (!config.hpa.targetCPUUtilizationPercentage && !config.hpa.targetMemoryUtilizationPercentage) {
        errors.push('At least one target metric (CPU or Memory) is required');
      }
      if (config.hpa.targetCPUUtilizationPercentage && (config.hpa.targetCPUUtilizationPercentage <= 0 || config.hpa.targetCPUUtilizationPercentage > 100)) {
        errors.push('CPU target must be between 1-100%');
      }
      if (config.hpa.targetMemoryUtilizationPercentage && (config.hpa.targetMemoryUtilizationPercentage <= 0 || config.hpa.targetMemoryUtilizationPercentage > 100)) {
        errors.push('Memory target must be between 1-100%');
      }
    }
    return errors;
  };

  const hpaErrors = validateHPA();

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* Basic Configuration */}
        {activeTab === 'basic' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Application Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Application Name *
                </label>
                <input
                  type="text"
                  value={config.appName}
                  onChange={(e) => updateConfig({ appName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="my-app"
                />
              </div>

              {/* Namespace */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Namespace
                </label>
                <select
                  value={config.namespace}
                  onChange={(e) => updateConfig({ namespace: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {availableNamespaces.map(namespace => (
                    <option key={namespace} value={namespace}>
                      {namespace}
                    </option>
                  ))}
                </select>
              </div>

              {/* Replicas */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Replicas
                </label>
                <input
                  type="number"
                  min="1"
                  value={config.replicas}
                  onChange={(e) => updateConfig({ replicas: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {config.hpa.enabled && (
                  <p className="mt-1 text-xs text-amber-600">
                    <AlertTriangle className="w-3 h-3 inline mr-1" />
                    HPA is enabled. This value will be used as the initial replica count.
                  </p>
                )}
              </div>

              {/* Service Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service Type
                </label>
                <select
                  value={config.serviceType}
                  onChange={(e) => updateConfig({ serviceType: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="ClusterIP">ClusterIP</option>
                  <option value="NodePort">NodePort</option>
                  <option value="LoadBalancer">LoadBalancer</option>
                </select>
              </div>

              {/* Service Port */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service Port
                </label>
                <input
                  type="number"
                  min="1"
                  max="65535"
                  value={config.port}
                  onChange={(e) => updateConfig({ port: parseInt(e.target.value) || 80 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Target Port */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Port
                </label>
                <input
                  type="number"
                  min="1"
                  max="65535"
                  value={config.targetPort}
                  onChange={(e) => updateConfig({ targetPort: parseInt(e.target.value) || 8080 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Labels */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Labels
              </label>
              <div className="flex space-x-2 mb-2">
                <input
                  type="text"
                  value={newLabel.key}
                  onChange={(e) => setNewLabel({ ...newLabel, key: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="key"
                />
                <input
                  type="text"
                  value={newLabel.value}
                  onChange={(e) => setNewLabel({ ...newLabel, value: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="value"
                />
                <button
                  onClick={addLabel}
                  disabled={!newLabel.key || !newLabel.value}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              
              {Object.entries(config.labels).length > 0 && (
                <div className="space-y-1">
                  {Object.entries(config.labels).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg">
                      <span className="text-sm text-gray-900">
                        <span className="font-medium">{key}</span>: {value}
                      </span>
                      <button
                        onClick={() => removeLabel(key)}
                        className="text-gray-400 hover:text-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Annotations */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Annotations
              </label>
              <div className="flex space-x-2 mb-2">
                <input
                  type="text"
                  value={newAnnotation.key}
                  onChange={(e) => setNewAnnotation({ ...newAnnotation, key: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="key"
                />
                <input
                  type="text"
                  value={newAnnotation.value}
                  onChange={(e) => setNewAnnotation({ ...newAnnotation, value: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="value"
                />
                <button
                  onClick={addAnnotation}
                  disabled={!newAnnotation.key || !newAnnotation.value}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              
              {Object.entries(config.annotations).length > 0 && (
                <div className="space-y-1">
                  {Object.entries(config.annotations).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg">
                      <span className="text-sm text-gray-900">
                        <span className="font-medium">{key}</span>: {value}
                      </span>
                      <button
                        onClick={() => removeAnnotation(key)}
                        className="text-gray-400 hover:text-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Containers Configuration */}
        {activeTab === 'containers' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Container Configuration</h3>
              <button
                onClick={addContainer}
                className="inline-flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Container
              </button>
            </div>

            {config.containers?.map((container, containerIndex) => (
              <div key={containerIndex} className="border border-gray-200 rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900">
                    Container {containerIndex + 1}
                    {container.name && `: ${container.name}`}
                  </h4>
                  {config.containers && config.containers.length > 1 && (
                    <button
                      onClick={() => removeContainer(containerIndex)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Container Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Container Name *
                    </label>
                    <input
                      type="text"
                      value={container.name}
                      onChange={(e) => updateContainer(containerIndex, { name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="app"
                    />
                  </div>

                  {/* Container Image */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Image *
                    </label>
                    <input
                      type="text"
                      value={container.image}
                      onChange={(e) => updateContainer(containerIndex, { image: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="nginx:latest"
                    />
                  </div>

                  {/* Container Port */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Port
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="65535"
                      value={container.port}
                      onChange={(e) => updateContainer(containerIndex, { port: parseInt(e.target.value) || 8080 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Environment Variables */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Environment Variables
                    </label>
                    <button
                      onClick={() => addEnvVar(containerIndex)}
                      className="inline-flex items-center px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add
                    </button>
                  </div>
                  
                  {container.env.map((envVar, envIndex) => (
                    <div key={envIndex} className="flex space-x-2 mb-2">
                      <input
                        type="text"
                        value={envVar.name}
                        onChange={(e) => updateEnvVar(containerIndex, envIndex, { name: e.target.value })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="ENV_NAME"
                      />
                      
                      {envVar.valueFrom ? (
                        <div className="flex-1 flex space-x-2">
                          <select
                            value={envVar.valueFrom.type}
                            onChange={(e) => updateEnvVar(containerIndex, envIndex, {
                              valueFrom: { ...envVar.valueFrom!, type: e.target.value as 'configMap' | 'secret' }
                            })}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="configMap">ConfigMap</option>
                            <option value="secret">Secret</option>
                          </select>
                          
                          <select
                            value={envVar.valueFrom.name}
                            onChange={(e) => updateEnvVar(containerIndex, envIndex, {
                              valueFrom: { ...envVar.valueFrom!, name: e.target.value }
                            })}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="">Select {envVar.valueFrom.type}</option>
                            {envVar.valueFrom.type === 'configMap' 
                              ? availableConfigMaps.map(cm => (
                                  <option key={cm.name} value={cm.name}>{cm.name}</option>
                                ))
                              : availableSecrets.map(secret => (
                                  <option key={secret.name} value={secret.name}>{secret.name}</option>
                                ))
                            }
                          </select>
                          
                          <input
                            type="text"
                            value={envVar.valueFrom.key}
                            onChange={(e) => updateEnvVar(containerIndex, envIndex, {
                              valueFrom: { ...envVar.valueFrom!, key: e.target.value }
                            })}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="key"
                          />
                        </div>
                      ) : (
                        <input
                          type="text"
                          value={envVar.value || ''}
                          onChange={(e) => updateEnvVar(containerIndex, envIndex, { value: e.target.value })}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="value"
                        />
                      )}
                      
                      <button
                        onClick={() => {
                          const currentEnvVar = container.env[envIndex];
                          if (currentEnvVar.valueFrom) {
                            updateEnvVar(containerIndex, envIndex, { value: '', valueFrom: undefined });
                          } else {
                            updateEnvVar(containerIndex, envIndex, { 
                              value: undefined, 
                              valueFrom: { type: 'configMap', name: '', key: '' }
                            });
                          }
                        }}
                        className="px-2 py-2 bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
                        title={envVar.valueFrom ? 'Switch to direct value' : 'Switch to reference'}
                      >
                        <Settings className="w-3 h-3" />
                      </button>
                      
                      <button
                        onClick={() => removeEnvVar(containerIndex, envIndex)}
                        className="px-2 py-2 text-red-600 hover:text-red-800"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Resource Limits */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Resource Limits
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">CPU Requests</label>
                      <input
                        type="text"
                        value={container.resources.requests.cpu}
                        onChange={(e) => updateContainer(containerIndex, {
                          resources: {
                            ...container.resources,
                            requests: { ...container.resources.requests, cpu: e.target.value }
                          }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="100m"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Memory Requests</label>
                      <input
                        type="text"
                        value={container.resources.requests.memory}
                        onChange={(e) => updateContainer(containerIndex, {
                          resources: {
                            ...container.resources,
                            requests: { ...container.resources.requests, memory: e.target.value }
                          }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="128Mi"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">CPU Limits</label>
                      <input
                        type="text"
                        value={container.resources.limits.cpu}
                        onChange={(e) => updateContainer(containerIndex, {
                          resources: {
                            ...container.resources,
                            limits: { ...container.resources.limits, cpu: e.target.value }
                          }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="500m"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Memory Limits</label>
                      <input
                        type="text"
                        value={container.resources.limits.memory}
                        onChange={(e) => updateContainer(containerIndex, {
                          resources: {
                            ...container.resources,
                            limits: { ...container.resources.limits, memory: e.target.value }
                          }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="256Mi"
                      />
                    </div>
                  </div>
                  {config.hpa.enabled && (
                    <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700">
                      <Info className="w-3 h-3 inline mr-1" />
                      Resource requests are required for HPA to function properly.
                    </div>
                  )}
                </div>

                {/* Volume Mounts */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Volume Mounts
                    </label>
                    <button
                      onClick={() => addVolumeMount(containerIndex)}
                      className="inline-flex items-center px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add
                    </button>
                  </div>
                  
                  {container.volumeMounts.map((mount, mountIndex) => (
                    <div key={mountIndex} className="flex space-x-2 mb-2">
                      <select
                        value={mount.name}
                        onChange={(e) => updateVolumeMount(containerIndex, mountIndex, { name: e.target.value })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select Volume</option>
                        {config.volumes.map(volume => (
                          <option key={volume.name} value={volume.name}>{volume.name}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={mount.mountPath}
                        onChange={(e) => updateVolumeMount(containerIndex, mountIndex, { mountPath: e.target.value })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="/app/data"
                      />
                      <button
                        onClick={() => removeVolumeMount(containerIndex, mountIndex)}
                        className="px-2 py-2 text-red-600 hover:text-red-800"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Networking Configuration */}
        {activeTab === 'networking' && (
          <div className="space-y-6">
            {/* Ingress Configuration */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <input
                  type="checkbox"
                  id="enable-ingress"
                  checked={config.ingress.enabled}
                  onChange={(e) => updateConfig({
                    ingress: { ...config.ingress, enabled: e.target.checked }
                  })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="enable-ingress" className="text-sm font-medium text-gray-700">
                  Enable Ingress
                </label>
              </div>

              {config.ingress.enabled && (
                <div className="space-y-4 pl-6 border-l-2 border-blue-200">
                  {/* Ingress Class */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ingress Class
                    </label>
                    <input
                      type="text"
                      value={config.ingress.className || ''}
                      onChange={(e) => updateConfig({
                        ingress: { ...config.ingress, className: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="nginx"
                    />
                  </div>

                  {/* Ingress Rules */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Ingress Rules
                      </label>
                      <button
                        onClick={addIngressRule}
                        disabled={!newIngressRule.path}
                        className="inline-flex items-center px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add Rule
                      </button>
                    </div>

                    {/* New Rule Form */}
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-2 mb-2 p-3 bg-gray-50 rounded-lg">
                      <input
                        type="text"
                        value={newIngressRule.host}
                        onChange={(e) => setNewIngressRule({ ...newIngressRule, host: e.target.value })}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="example.com"
                      />
                      <input
                        type="text"
                        value={newIngressRule.path}
                        onChange={(e) => setNewIngressRule({ ...newIngressRule, path: e.target.value })}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="/api"
                      />
                      <select
                        value={newIngressRule.pathType}
                        onChange={(e) => setNewIngressRule({ ...newIngressRule, pathType: e.target.value as any })}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="Prefix">Prefix</option>
                        <option value="Exact">Exact</option>
                        <option value="ImplementationSpecific">Implementation Specific</option>
                      </select>
                      <input
                        type="text"
                        value={newIngressRule.serviceName}
                        onChange={(e) => setNewIngressRule({ ...newIngressRule, serviceName: e.target.value })}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="service-name"
                      />
                      <input
                        type="number"
                        value={newIngressRule.servicePort}
                        onChange={(e) => setNewIngressRule({ ...newIngressRule, servicePort: parseInt(e.target.value) || 80 })}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="80"
                      />
                    </div>

                    {/* Existing Rules */}
                    {config.ingress.rules.map((rule, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg mb-1">
                        <span className="text-sm text-gray-900">
                          {rule.host || '*'} {rule.path} → {rule.serviceName}:{rule.servicePort}
                        </span>
                        <button
                          onClick={() => removeIngressRule(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* TLS Configuration */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        TLS Configuration
                      </label>
                      <button
                        onClick={addTLS}
                        disabled={!newTLS.secretName || !newTLS.hosts[0]}
                        className="inline-flex items-center px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add TLS
                      </button>
                    </div>

                    {/* New TLS Form */}
                    <div className="p-3 bg-gray-50 rounded-lg mb-2">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                        <input
                          type="text"
                          value={newTLS.secretName}
                          onChange={(e) => setNewTLS({ ...newTLS, secretName: e.target.value })}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="tls-secret-name"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="block text-xs font-medium text-gray-600">Hosts</label>
                        {newTLS.hosts.map((host, index) => (
                          <div key={index} className="flex space-x-2">
                            <input
                              type="text"
                              value={host}
                              onChange={(e) => updateTLSHost(index, e.target.value)}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="example.com"
                            />
                            {newTLS.hosts.length > 1 && (
                              <button
                                onClick={() => removeTLSHost(index)}
                                className="px-2 py-2 text-red-600 hover:text-red-800"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          onClick={addTLSHost}
                          className="text-blue-600 hover:text-blue-800 text-xs"
                        >
                          + Add Host
                        </button>
                      </div>
                    </div>

                    {/* Existing TLS */}
                    {config.ingress.tls.map((tls, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg mb-1">
                        <span className="text-sm text-gray-900">
                          {tls.secretName}: {tls.hosts.join(', ')}
                        </span>
                        <button
                          onClick={() => removeTLS(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Storage Configuration */}
        {activeTab === 'storage' && (
          <div className="space-y-6">
            {/* Volumes */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Volumes</h3>
                <button
                  onClick={addVolume}
                  disabled={!newVolume.name || !newVolume.mountPath}
                  className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Volume
                </button>
              </div>

              {/* New Volume Form */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg mb-4">
                <input
                  type="text"
                  value={newVolume.name}
                  onChange={(e) => setNewVolume({ ...newVolume, name: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="volume-name"
                />
                <input
                  type="text"
                  value={newVolume.mountPath}
                  onChange={(e) => setNewVolume({ ...newVolume, mountPath: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="/app/data"
                />
                <select
                  value={newVolume.type}
                  onChange={(e) => setNewVolume({ ...newVolume, type: e.target.value as any })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="emptyDir">Empty Directory</option>
                  <option value="configMap">ConfigMap</option>
                  <option value="secret">Secret</option>
                </select>
                {newVolume.type === 'configMap' && (
                  <select
                    value={newVolume.configMapName}
                    onChange={(e) => setNewVolume({ ...newVolume, configMapName: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select ConfigMap</option>
                    {availableConfigMaps.map(cm => (
                      <option key={cm.name} value={cm.name}>{cm.name}</option>
                    ))}
                  </select>
                )}
                {newVolume.type === 'secret' && (
                  <select
                    value={newVolume.secretName}
                    onChange={(e) => setNewVolume({ ...newVolume, secretName: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Secret</option>
                    {availableSecrets.map(secret => (
                      <option key={secret.name} value={secret.name}>{secret.name}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Existing Volumes */}
              {config.volumes.length > 0 && (
                <div className="space-y-2">
                  {config.volumes.map((volume, index) => (
                    <div key={index} className="flex items-center justify-between bg-white border border-gray-200 px-4 py-3 rounded-lg">
                      <div>
                        <span className="font-medium text-gray-900">{volume.name}</span>
                        <span className="text-gray-500 ml-2">→ {volume.mountPath}</span>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded ml-2">
                          {volume.type}
                        </span>
                        {volume.type === 'configMap' && volume.configMapName && (
                          <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded ml-1">
                            {volume.configMapName}
                          </span>
                        )}
                        {volume.type === 'secret' && volume.secretName && (
                          <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded ml-1">
                            {volume.secretName}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => removeVolume(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Scaling Configuration */}
        {activeTab === 'scaling' && (
          <div className="space-y-6">
            {/* HPA Configuration */}
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-purple-900">Horizontal Pod Autoscaler</h3>
                  <p className="text-sm text-purple-700">Automatically scale your deployment based on resource usage</p>
                </div>
              </div>

              {/* Enable HPA Toggle */}
              <div className="flex items-center space-x-3 mb-6">
                <input
                  type="checkbox"
                  id="enable-hpa"
                  checked={config.hpa.enabled}
                  onChange={(e) => updateConfig({
                    hpa: { ...config.hpa, enabled: e.target.checked }
                  })}
                  className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 focus:ring-2"
                />
                <label htmlFor="enable-hpa" className="text-sm font-medium text-purple-900">
                  Enable Horizontal Pod Autoscaler
                </label>
              </div>

              {config.hpa.enabled && (
                <div className="space-y-6 pl-6 border-l-2 border-purple-300">
                  {/* Validation Errors */}
                  {hpaErrors.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                        <span className="font-medium text-red-900">Configuration Issues</span>
                      </div>
                      <ul className="text-sm text-red-700 space-y-1">
                        {hpaErrors.map((error, index) => (
                          <li key={index}>• {error}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Scaling Range */}
                  <div>
                    <label className="block text-sm font-medium text-purple-900 mb-3">
                      Scaling Range
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-purple-700 mb-1">Minimum Replicas *</label>
                        <input
                          type="number"
                          min="1"
                          value={config.hpa.minReplicas}
                          onChange={(e) => updateConfig({
                            hpa: { ...config.hpa, minReplicas: parseInt(e.target.value) || 1 }
                          })}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                            config.hpa.minReplicas <= 0 ? 'border-red-300' : 'border-gray-300'
                          }`}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-purple-700 mb-1">Maximum Replicas *</label>
                        <input
                          type="number"
                          min="1"
                          value={config.hpa.maxReplicas}
                          onChange={(e) => updateConfig({
                            hpa: { ...config.hpa, maxReplicas: parseInt(e.target.value) || 10 }
                          })}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                            config.hpa.maxReplicas <= config.hpa.minReplicas ? 'border-red-300' : 'border-gray-300'
                          }`}
                        />
                      </div>
                    </div>
                    {config.hpa.maxReplicas <= config.hpa.minReplicas && (
                      <p className="mt-1 text-xs text-red-600">
                        Maximum replicas must be greater than minimum replicas
                      </p>
                    )}
                  </div>

                  {/* Scaling Metrics */}
                  <div>
                    <label className="block text-sm font-medium text-purple-900 mb-3">
                      Scaling Metrics
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-purple-700 mb-1">Target CPU Utilization (%)</label>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={config.hpa.targetCPUUtilizationPercentage || ''}
                          onChange={(e) => updateConfig({
                            hpa: { 
                              ...config.hpa, 
                              targetCPUUtilizationPercentage: e.target.value ? parseInt(e.target.value) : undefined 
                            }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="80"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-purple-700 mb-1">Target Memory Utilization (%)</label>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={config.hpa.targetMemoryUtilizationPercentage || ''}
                          onChange={(e) => updateConfig({
                            hpa: { 
                              ...config.hpa, 
                              targetMemoryUtilizationPercentage: e.target.value ? parseInt(e.target.value) : undefined 
                            }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="70"
                        />
                      </div>
                    </div>
                    {!config.hpa.targetCPUUtilizationPercentage && !config.hpa.targetMemoryUtilizationPercentage && (
                      <p className="mt-1 text-xs text-amber-600">
                        <AlertTriangle className="w-3 h-3 inline mr-1" />
                        At least one target metric (CPU or Memory) is required
                      </p>
                    )}
                  </div>

                  {/* Scaling Behavior Preview */}
                  <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-purple-200">
                    <div className="flex items-center space-x-2 mb-3">
                      <Activity className="w-5 h-5 text-purple-600" />
                      <span className="font-medium text-purple-900">Scaling Behavior</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                      <div className="text-center">
                        <div className="text-lg font-bold text-purple-800">{config.hpa.minReplicas}</div>
                        <div className="text-xs text-purple-600">Min Replicas</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-purple-800">{config.replicas}</div>
                        <div className="text-xs text-purple-600">Current</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-purple-800">{config.hpa.maxReplicas}</div>
                        <div className="text-xs text-purple-600">Max Replicas</div>
                      </div>
                    </div>
                    
                    {(config.hpa.targetCPUUtilizationPercentage || config.hpa.targetMemoryUtilizationPercentage) && (
                      <div className="mt-3 pt-3 border-t border-purple-200">
                        <div className="text-xs text-purple-700">
                          <strong>Active Thresholds:</strong>
                          {config.hpa.targetCPUUtilizationPercentage && (
                            <span className="ml-2">CPU: {config.hpa.targetCPUUtilizationPercentage}%</span>
                          )}
                          {config.hpa.targetMemoryUtilizationPercentage && (
                            <span className="ml-2">Memory: {config.hpa.targetMemoryUtilizationPercentage}%</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Requirements Notice */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start space-x-2">
                      <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-blue-800">
                        <p className="font-medium mb-1">Requirements for HPA:</p>
                        <ul className="text-xs space-y-1">
                          <li>• Resource requests must be specified for containers</li>
                          <li>• Metrics server must be installed in your cluster</li>
                          <li>• HPA will automatically adjust replicas based on resource usage</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* How It Works */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start space-x-2">
                      <TrendingUp className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-gray-700">
                        <p className="font-medium mb-1">How HPA Works:</p>
                        <ul className="text-xs space-y-1">
                          <li>• Monitors resource usage every 15 seconds</li>
                          <li>• Scales up when usage exceeds target thresholds</li>
                          <li>• Scales down when usage is below target for 5 minutes</li>
                          <li>• Respects min/max replica limits you set</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Manual Scaling Info */}
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex items-start space-x-2">
                      <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-amber-800">
                        <p className="font-medium mb-1">Manual vs Automatic Scaling:</p>
                        <p className="text-xs">
                          When HPA is enabled, the replica count you set above ({config.replicas}) will be used as the initial number of replicas. 
                          HPA will then automatically adjust this number between {config.hpa.minReplicas} and {config.hpa.maxReplicas} based on resource usage.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export { DeploymentForm }