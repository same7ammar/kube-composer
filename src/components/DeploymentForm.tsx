import { Plus, Minus, Server, Settings, Database, Key, Trash2, Copy, Globe, Shield, FileText } from 'lucide-react';
import type { DeploymentConfig, Container, ConfigMap, Secret } from '../types';

interface DeploymentFormProps {
  config: DeploymentConfig;
  onChange: (config: DeploymentConfig) => void;
  availableNamespaces: string[];
  availableConfigMaps: ConfigMap[];
  availableSecrets: Secret[];
}

interface EnvVar {
  name: string;
  value?: string;
  valueFrom?: {
    type: 'configMap' | 'secret';
    name: string;
    key: string;
  };
}

export function DeploymentForm({ config, onChange, availableNamespaces, availableConfigMaps, availableSecrets }: DeploymentFormProps) {
  const updateConfig = (updates: Partial<DeploymentConfig>) => {
    onChange({ ...config, ...updates });
  };

  // Container management functions
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
    updateConfig({
      containers: [...config.containers, newContainer]
    });
  };

  const removeContainer = (index: number) => {
    if (config.containers.length > 1) {
      updateConfig({
        containers: config.containers.filter((_, i) => i !== index)
      });
    }
  };

  const duplicateContainer = (index: number) => {
    const containerToDuplicate = config.containers[index];
    const duplicatedContainer: Container = {
      ...containerToDuplicate,
      name: containerToDuplicate.name ? `${containerToDuplicate.name}-copy` : ''
    };
    
    const newContainers = [...config.containers];
    newContainers.splice(index + 1, 0, duplicatedContainer);
    updateConfig({ containers: newContainers });
  };

  const updateContainer = (index: number, updates: Partial<Container>) => {
    const newContainers = [...config.containers];
    newContainers[index] = { ...newContainers[index], ...updates };
    updateConfig({ containers: newContainers });
  };

  const addContainerEnvVar = (containerIndex: number) => {
    const newContainers = [...config.containers];
    newContainers[containerIndex].env.push({ name: '', value: '' });
    updateConfig({ containers: newContainers });
  };

  const removeContainerEnvVar = (containerIndex: number, envIndex: number) => {
    const newContainers = [...config.containers];
    newContainers[containerIndex].env = newContainers[containerIndex].env.filter((_, i) => i !== envIndex);
    updateConfig({ containers: newContainers });
  };

  const updateContainerEnvVar = (containerIndex: number, envIndex: number, updates: Partial<EnvVar>) => {
    const newContainers = [...config.containers];
    newContainers[containerIndex].env[envIndex] = {
      ...newContainers[containerIndex].env[envIndex],
      ...updates
    };
    updateConfig({ containers: newContainers });
  };

  const addContainerVolumeMount = (containerIndex: number) => {
    const newContainers = [...config.containers];
    newContainers[containerIndex].volumeMounts.push({ name: '', mountPath: '' });
    updateConfig({ containers: newContainers });
  };

  const removeContainerVolumeMount = (containerIndex: number, mountIndex: number) => {
    const newContainers = [...config.containers];
    newContainers[containerIndex].volumeMounts = newContainers[containerIndex].volumeMounts.filter((_, i) => i !== mountIndex);
    updateConfig({ containers: newContainers });
  };

  const updateContainerVolumeMount = (containerIndex: number, mountIndex: number, field: 'name' | 'mountPath', value: string) => {
    const newContainers = [...config.containers];
    newContainers[containerIndex].volumeMounts[mountIndex] = {
      ...newContainers[containerIndex].volumeMounts[mountIndex],
      [field]: value
    };
    updateConfig({ containers: newContainers });
  };

  const addVolume = () => {
    updateConfig({
      volumes: [...config.volumes, { name: '', mountPath: '', type: 'emptyDir' }]
    });
  };

  const removeVolume = (index: number) => {
    updateConfig({
      volumes: config.volumes.filter((_, i) => i !== index)
    });
  };

  const updateVolume = (index: number, field: keyof typeof config.volumes[0], value: any) => {
    const newVolumes = [...config.volumes];
    newVolumes[index] = { ...newVolumes[index], [field]: value };
    updateConfig({ volumes: newVolumes });
  };

  // ConfigMap and Secret selection functions
  const toggleConfigMapSelection = (configMapName: string) => {
    const isSelected = config.selectedConfigMaps.includes(configMapName);
    if (isSelected) {
      updateConfig({
        selectedConfigMaps: config.selectedConfigMaps.filter(name => name !== configMapName)
      });
    } else {
      updateConfig({
        selectedConfigMaps: [...config.selectedConfigMaps, configMapName]
      });
    }
  };

  const toggleSecretSelection = (secretName: string) => {
    const isSelected = config.selectedSecrets.includes(secretName);
    if (isSelected) {
      updateConfig({
        selectedSecrets: config.selectedSecrets.filter(name => name !== secretName)
      });
    } else {
      updateConfig({
        selectedSecrets: [...config.selectedSecrets, secretName]
      });
    }
  };

  // Ingress management functions
  const updateIngress = (updates: Partial<typeof config.ingress>) => {
    updateConfig({
      ingress: { ...config.ingress, ...updates }
    });
  };

  const addIngressRule = () => {
    const serviceName = config.appName ? `${config.appName}-service` : 'service';
    updateIngress({
      rules: [...config.ingress.rules, {
        host: '',
        path: '/',
        pathType: 'Prefix',
        serviceName,
        servicePort: config.port
      }]
    });
  };

  const removeIngressRule = (index: number) => {
    updateIngress({
      rules: config.ingress.rules.filter((_, i) => i !== index)
    });
  };

  const updateIngressRule = (index: number, field: keyof typeof config.ingress.rules[0], value: any) => {
    const newRules = [...config.ingress.rules];
    newRules[index] = { ...newRules[index], [field]: value };
    updateIngress({ rules: newRules });
  };

  const addIngressAnnotation = () => {
    const newAnnotations = { ...config.ingress.annotations };
    const key = `annotation-${Object.keys(newAnnotations).length + 1}`;
    newAnnotations[key] = '';
    updateIngress({ annotations: newAnnotations });
  };

  const removeIngressAnnotation = (key: string) => {
    const newAnnotations = { ...config.ingress.annotations };
    delete newAnnotations[key];
    updateIngress({ annotations: newAnnotations });
  };

  const updateIngressAnnotation = (oldKey: string, newKey: string, value: string) => {
    const newAnnotations = { ...config.ingress.annotations };
    if (oldKey !== newKey) {
      delete newAnnotations[oldKey];
    }
    newAnnotations[newKey] = value;
    updateIngress({ annotations: newAnnotations });
  };

  const addIngressTLS = () => {
    updateIngress({
      tls: [...config.ingress.tls, {
        secretName: '',
        hosts: ['']
      }]
    });
  };

  const removeIngressTLS = (index: number) => {
    updateIngress({
      tls: config.ingress.tls.filter((_, i) => i !== index)
    });
  };

  const updateIngressTLS = (index: number, field: 'secretName' | 'hosts', value: any) => {
    const newTLS = [...config.ingress.tls];
    newTLS[index] = { ...newTLS[index], [field]: value };
    updateIngress({ tls: newTLS });
  };

  const addTLSHost = (tlsIndex: number) => {
    const newTLS = [...config.ingress.tls];
    newTLS[tlsIndex].hosts.push('');
    updateIngress({ tls: newTLS });
  };

  const removeTLSHost = (tlsIndex: number, hostIndex: number) => {
    const newTLS = [...config.ingress.tls];
    newTLS[tlsIndex].hosts = newTLS[tlsIndex].hosts.filter((_, i) => i !== hostIndex);
    updateIngress({ tls: newTLS });
  };

  const updateTLSHost = (tlsIndex: number, hostIndex: number, value: string) => {
    const newTLS = [...config.ingress.tls];
    newTLS[tlsIndex].hosts[hostIndex] = value;
    updateIngress({ tls: newTLS });
  };

  // Helper function to get default mount path
  const getDefaultMountPath = (volumeName: string, volumeType: string) => {
    if (!volumeName) return '';
    
    switch (volumeType) {
      case 'configMap':
        return `/etc/config/${volumeName}`;
      case 'secret':
        return `/etc/secrets/${volumeName}`;
      case 'emptyDir':
      default:
        return `/tmp/${volumeName}`;
    }
  };

  // Filter ConfigMaps and Secrets by namespace
  const filteredConfigMaps = availableConfigMaps.filter(cm => cm.namespace === config.namespace);
  const filteredSecrets = availableSecrets.filter(s => s.namespace === config.namespace);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Basic Configuration */}
      <div className="space-y-4 sm:space-y-6">
        <div className="flex items-center space-x-2 text-base sm:text-lg font-semibold text-gray-900">
          <Server className="w-4 sm:w-5 h-4 sm:h-5 text-blue-600" />
          <span>Basic Configuration</span>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Application Name *
            </label>
            <input
              type="text"
              value={config.appName}
              onChange={(e) => updateConfig({ appName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
              placeholder="my-app"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Replicas
            </label>
            <input
              type="number"
              min="1"
              value={config.replicas}
              onChange={(e) => updateConfig({ replicas: parseInt(e.target.value) || 1 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
            />
          </div>
          
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Namespace
            </label>
            <select
              value={config.namespace}
              onChange={(e) => updateConfig({ namespace: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
            >
              {availableNamespaces.map(namespace => (
                <option key={namespace} value={namespace}>
                  {namespace}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Containers Configuration */}
      <div className="space-y-4 sm:space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-base sm:text-lg font-semibold text-gray-900">
            <Database className="w-4 sm:w-5 h-4 sm:h-5 text-purple-600" />
            <span>Containers ({config.containers.length})</span>
          </div>
          <button
            onClick={addContainer}
            className="inline-flex items-center px-3 py-1 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200 text-sm"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Container
          </button>
        </div>

        <div className="space-y-6">
          {config.containers.map((container, containerIndex) => (
            <div key={containerIndex} className="border border-gray-200 rounded-xl p-6 bg-gray-50">
              {/* Container Header */}
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-medium text-gray-900">
                  Container {containerIndex + 1}
                  {container.name && (
                    <span className="ml-2 text-sm text-gray-500">({container.name})</span>
                  )}
                </h4>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => duplicateContainer(containerIndex)}
                    className="p-1 text-gray-400 hover:text-blue-600 rounded transition-colors duration-200"
                    title="Duplicate container"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  {config.containers.length > 1 && (
                    <button
                      onClick={() => removeContainer(containerIndex)}
                      className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors duration-200"
                      title="Remove container"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Container Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Container Name *
                  </label>
                  <input
                    type="text"
                    value={container.name}
                    onChange={(e) => updateContainer(containerIndex, { name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="web-server"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Container Image *
                  </label>
                  <input
                    type="text"
                    value={container.image}
                    onChange={(e) => updateContainer(containerIndex, { image: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="nginx:latest"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Container Port
                  </label>
                  <input
                    type="number"
                    value={container.port}
                    onChange={(e) => updateContainer(containerIndex, { port: parseInt(e.target.value) || 8080 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>

              {/* Container Resources */}
              <div className="mb-6">
                <h5 className="text-sm font-medium text-gray-700 mb-3">Resource Limits</h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      CPU Request
                    </label>
                    <input
                      type="text"
                      value={container.resources.requests.cpu}
                      onChange={(e) => updateContainer(containerIndex, {
                        resources: {
                          ...container.resources,
                          requests: { ...container.resources.requests, cpu: e.target.value }
                        }
                      })}
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm"
                      placeholder="100m"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Memory Request
                    </label>
                    <input
                      type="text"
                      value={container.resources.requests.memory}
                      onChange={(e) => updateContainer(containerIndex, {
                        resources: {
                          ...container.resources,
                          requests: { ...container.resources.requests, memory: e.target.value }
                        }
                      })}
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm"
                      placeholder="128Mi"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      CPU Limit
                    </label>
                    <input
                      type="text"
                      value={container.resources.limits.cpu}
                      onChange={(e) => updateContainer(containerIndex, {
                        resources: {
                          ...container.resources,
                          limits: { ...container.resources.limits, cpu: e.target.value }
                        }
                      })}
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm"
                      placeholder="500m"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Memory Limit
                    </label>
                    <input
                      type="text"
                      value={container.resources.limits.memory}
                      onChange={(e) => updateContainer(containerIndex, {
                        resources: {
                          ...container.resources,
                          limits: { ...container.resources.limits, memory: e.target.value }
                        }
                      })}
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm"
                      placeholder="256Mi"
                    />
                  </div>
                </div>
              </div>

              {/* Container Environment Variables */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="text-sm font-medium text-gray-700">Environment Variables</h5>
                  <button
                    onClick={() => addContainerEnvVar(containerIndex)}
                    className="inline-flex items-center px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors duration-200"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add
                  </button>
                </div>
                
                {container.env.length > 0 && (
                  <div className="space-y-3">
                    {container.env.map((envVar, envIndex) => (
                      <div key={envIndex} className="border border-gray-200 rounded-lg p-3 bg-white">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Variable Name *
                            </label>
                            <input
                              type="text"
                              value={envVar.name}
                              onChange={(e) => updateContainerEnvVar(containerIndex, envIndex, { name: e.target.value })}
                              className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm"
                              placeholder="DATABASE_URL"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Source Type
                            </label>
                            <select
                              value={envVar.valueFrom ? envVar.valueFrom.type : 'direct'}
                              onChange={(e) => {
                                if (e.target.value === 'direct') {
                                  updateContainerEnvVar(containerIndex, envIndex, { 
                                    value: envVar.value || '',
                                    valueFrom: undefined 
                                  });
                                } else {
                                  updateContainerEnvVar(containerIndex, envIndex, { 
                                    value: undefined,
                                    valueFrom: { 
                                      type: e.target.value as 'configMap' | 'secret', 
                                      name: '', 
                                      key: '' 
                                    }
                                  });
                                }
                              }}
                              className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm"
                            >
                              <option value="direct">Direct Value</option>
                              <option value="configMap">ConfigMap</option>
                              <option value="secret">Secret</option>
                            </select>
                          </div>

                          {envVar.valueFrom ? (
                            <>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                  {envVar.valueFrom.type === 'configMap' ? 'ConfigMap' : 'Secret'} Name
                                </label>
                                <select
                                  value={envVar.valueFrom.name}
                                  onChange={(e) => updateContainerEnvVar(containerIndex, envIndex, {
                                    valueFrom: { ...envVar.valueFrom!, name: e.target.value }
                                  })}
                                  className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm"
                                >
                                  <option value="">Select {envVar.valueFrom.type === 'configMap' ? 'ConfigMap' : 'Secret'}</option>
                                  {envVar.valueFrom.type === 'configMap' 
                                    ? filteredConfigMaps.map(cm => (
                                        <option key={cm.name} value={cm.name}>{cm.name}</option>
                                      ))
                                    : filteredSecrets.map(s => (
                                        <option key={s.name} value={s.name}>{s.name}</option>
                                      ))
                                  }
                                </select>
                              </div>
                              
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                  Key
                                </label>
                                <select
                                  value={envVar.valueFrom.key}
                                  onChange={(e) => updateContainerEnvVar(containerIndex, envIndex, {
                                    valueFrom: { ...envVar.valueFrom!, key: e.target.value }
                                  })}
                                  className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm"
                                  disabled={!envVar.valueFrom.name}
                                >
                                  <option value="">Select Key</option>
                                  {envVar.valueFrom.name && envVar.valueFrom.type === 'configMap' && 
                                    filteredConfigMaps.find(cm => cm.name === envVar.valueFrom!.name)?.data &&
                                    Object.keys(filteredConfigMaps.find(cm => cm.name === envVar.valueFrom!.name)!.data).map(key => (
                                      <option key={key} value={key}>{key}</option>
                                    ))
                                  }
                                  {envVar.valueFrom.name && envVar.valueFrom.type === 'secret' && 
                                    filteredSecrets.find(s => s.name === envVar.valueFrom!.name)?.data &&
                                    Object.keys(filteredSecrets.find(s => s.name === envVar.valueFrom!.name)!.data).map(key => (
                                      <option key={key} value={key}>{key}</option>
                                    ))
                                  }
                                </select>
                              </div>
                            </>
                          ) : (
                            <div className="sm:col-span-2">
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Value
                              </label>
                              <input
                                type="text"
                                value={envVar.value || ''}
                                onChange={(e) => updateContainerEnvVar(containerIndex, envIndex, { value: e.target.value })}
                                className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm"
                                placeholder="environment value"
                              />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex justify-end">
                          <button
                            onClick={() => removeContainerEnvVar(containerIndex, envIndex)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors duration-200"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Container Volume Mounts */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h5 className="text-sm font-medium text-gray-700">Volume Mounts</h5>
                  <button
                    onClick={() => addContainerVolumeMount(containerIndex)}
                    className="inline-flex items-center px-2 py-1 bg-indigo-600 text-white rounded text-xs hover:bg-indigo-700 transition-colors duration-200"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add
                  </button>
                </div>
                
                {container.volumeMounts.length > 0 && (
                  <div className="space-y-2">
                    {container.volumeMounts.map((mount, mountIndex) => (
                      <div key={mountIndex} className="flex items-center space-x-2">
                        <select
                          value={mount.name}
                          onChange={(e) => {
                            const selectedVolume = config.volumes.find(v => v.name === e.target.value);
                            const defaultPath = selectedVolume ? getDefaultMountPath(selectedVolume.name, selectedVolume.type) : '';
                            updateContainerVolumeMount(containerIndex, mountIndex, 'name', e.target.value);
                            // Auto-fill mount path if it's empty
                            if (!mount.mountPath && defaultPath) {
                              updateContainerVolumeMount(containerIndex, mountIndex, 'mountPath', defaultPath);
                            }
                          }}
                          className="flex-1 px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm"
                        >
                          <option value="">Select Volume</option>
                          {config.volumes.map(volume => (
                            <option key={volume.name} value={volume.name}>
                              {volume.name} ({volume.type})
                            </option>
                          ))}
                        </select>
                        <input
                          type="text"
                          value={mount.mountPath}
                          onChange={(e) => updateContainerVolumeMount(containerIndex, mountIndex, 'mountPath', e.target.value)}
                          className="flex-1 px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm"
                          placeholder="/path/to/mount"
                        />
                        
                        <button
                          onClick={() => removeContainerVolumeMount(containerIndex, mountIndex)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors duration-200"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Volume Mount Help */}
                {config.volumes.length > 0 && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="text-xs text-blue-800">
                      <p className="font-medium mb-1">Default Mount Paths</p>
                      <ul className="text-xs space-y-1">
                        <li>• <strong>ConfigMaps:</strong> /etc/config/<name></li>
                        <li>• <strong>Secrets:</strong> /etc/secrets/<name></li>
                        <li>• <strong>EmptyDir:</strong> /tmp/<name></li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ConfigMaps Selection */}
      {filteredConfigMaps.length > 0 && (
        <div className="space-y-4 sm:space-y-6">
          <div className="flex items-center space-x-2 text-base sm:text-lg font-semibold text-gray-900">
            <FileText className="w-4 sm:w-5 h-4 sm:h-5 text-green-600" />
            <span>ConfigMaps</span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredConfigMaps.map((configMap) => (
              <div
                key={configMap.name}
                className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                  config.selectedConfigMaps.includes(configMap.name)
                    ? 'border-green-500 bg-green-50 ring-2 ring-green-200'
                    : 'border-gray-200 bg-white hover:border-green-300'
                }`}
                onClick={() => toggleConfigMapSelection(configMap.name)}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                    config.selectedConfigMaps.includes(configMap.name)
                      ? 'border-green-500 bg-green-500'
                      : 'border-gray-300'
                  }`}>
                    {config.selectedConfigMaps.includes(configMap.name) && (
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">{configMap.name}</div>
                    <div className="text-sm text-gray-500">
                      {Object.keys(configMap.data).length} key{Object.keys(configMap.data).length !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Secrets Selection */}
      {filteredSecrets.length > 0 && (
        <div className="space-y-4 sm:space-y-6">
          <div className="flex items-center space-x-2 text-base sm:text-lg font-semibold text-gray-900">
            <Key className="w-4 sm:w-5 h-4 sm:h-5 text-orange-600" />
            <span>Secrets</span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSecrets.map((secret) => (
              <div
                key={secret.name}
                className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                  config.selectedSecrets.includes(secret.name)
                    ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-200'
                    : 'border-gray-200 bg-white hover:border-orange-300'
                }`}
                onClick={() => toggleSecretSelection(secret.name)}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                    config.selectedSecrets.includes(secret.name)
                      ? 'border-orange-500 bg-orange-500'
                      : 'border-gray-300'
                  }`}>
                    {config.selectedSecrets.includes(secret.name) && (
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">{secret.name}</div>
                    <div className="text-sm text-gray-500">
                      {Object.keys(secret.data).length} key{Object.keys(secret.data).length !== 1 ? 's' : ''} • {secret.type}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Volumes */}
      <div className="space-y-4 sm:space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-base sm:text-lg font-semibold text-gray-900">
            <Database className="w-4 sm:w-5 h-4 sm:h-5 text-indigo-600" />
            <span>Volumes</span>
          </div>
          <button
            onClick={addVolume}
            className="inline-flex items-center px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add
          </button>
        </div>
        
        {config.volumes.length > 0 && (
          <div className="space-y-3">
            {config.volumes.map((volume, index) => (
              <div key={index} className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                <input
                  type="text"
                  value={volume.name}
                  onChange={(e) => updateVolume(index, 'name', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                  placeholder="Volume name"
                />
                <input
                  type="text"
                  value={volume.mountPath}
                  onChange={(e) => updateVolume(index, 'mountPath', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                  placeholder="/path/to/mount"
                />
                <select
                  value={volume.type}
                  onChange={(e) => updateVolume(index, 'type', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                >
                  <option value="emptyDir">Empty Dir</option>
                  <option value="configMap">Config Map</option>
                  <option value="secret">Secret</option>
                </select>
                {volume.type === 'configMap' && (
                  <select
                    value={volume.configMapName || ''}
                    onChange={(e) => updateVolume(index, 'configMapName', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                  >
                    <option value="">Select ConfigMap</option>
                    {filteredConfigMaps.map(cm => (
                      <option key={cm.name} value={cm.name}>{cm.name}</option>
                    ))}
                  </select>
                )}
                {volume.type === 'secret' && (
                  <select
                    value={volume.secretName || ''}
                    onChange={(e) => updateVolume(index, 'secretName', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                  >
                    <option value="">Select Secret</option>
                    {filteredSecrets.map(s => (
                      <option key={s.name} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                )}
                <button
                  onClick={() => removeVolume(index)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200 self-center sm:self-auto"
                >
                  <Minus className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Service Configuration */}
      <div className="space-y-4 sm:space-y-6">
        <div className="flex items-center space-x-2 text-base sm:text-lg font-semibold text-gray-900">
          <Settings className="w-4 sm:w-5 h-4 sm:h-5 text-green-600" />
          <span>Service Configuration</span>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Service Port
            </label>
            <input
              type="number"
              value={config.port}
              onChange={(e) => updateConfig({ port: parseInt(e.target.value) || 80 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Port
            </label>
            <input
              type="number"
              value={config.targetPort}
              onChange={(e) => updateConfig({ targetPort: parseInt(e.target.value) || 8080 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Service Type
            </label>
            <select
              value={config.serviceType}
              onChange={(e) => updateConfig({ serviceType: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
            >
              <option value="ClusterIP">ClusterIP</option>
              <option value="NodePort">NodePort</option>
              <option value="LoadBalancer">LoadBalancer</option>
            </select>
          </div>
        </div>
      </div>

      {/* Ingress Configuration */}
      <div className="space-y-4 sm:space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-base sm:text-lg font-semibold text-gray-900">
            <Globe className="w-4 sm:w-5 h-4 sm:h-5 text-orange-600" />
            <span>Ingress Configuration</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Enable Ingress</span>
            <button
              onClick={() => updateIngress({ enabled: !config.ingress.enabled })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                config.ingress.enabled ? 'bg-orange-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                  config.ingress.enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {config.ingress.enabled && (
          <div className="space-y-6 border border-orange-200 rounded-xl p-6 bg-orange-50">
            {/* Basic Ingress Settings */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ingress Class Name
                </label>
                <input
                  type="text"
                  value={config.ingress.className || ''}
                  onChange={(e) => updateIngress({ className: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                  placeholder="nginx"
                />
              </div>
            </div>

            {/* Ingress Annotations */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h5 className="text-sm font-medium text-gray-700">Annotations</h5>
                <button
                  onClick={addIngressAnnotation}
                  className="inline-flex items-center px-2 py-1 bg-orange-600 text-white rounded text-xs hover:bg-orange-700 transition-colors duration-200"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add
                </button>
              </div>
              
              {Object.entries(config.ingress.annotations).length > 0 && (
                <div className="space-y-2">
                  {Object.entries(config.ingress.annotations).map(([key, value]) => (
                    <div key={key} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={key}
                        onChange={(e) => updateIngressAnnotation(key, e.target.value, value)}
                        className="flex-1 px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-orange-500 focus:border-transparent text-sm"
                        placeholder="nginx.ingress.kubernetes.io/rewrite-target"
                      />
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => updateIngressAnnotation(key, key, e.target.value)}
                        className="flex-1 px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-orange-500 focus:border-transparent text-sm"
                        placeholder="/"
                      />
                      <button
                        onClick={() => removeIngressAnnotation(key)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors duration-200"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Ingress Rules */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h5 className="text-sm font-medium text-gray-700">Rules</h5>
                <button
                  onClick={addIngressRule}
                  className="inline-flex items-center px-2 py-1 bg-orange-600 text-white rounded text-xs hover:bg-orange-700 transition-colors duration-200"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add Rule
                </button>
              </div>
              
              {config.ingress.rules.length > 0 && (
                <div className="space-y-4">
                  {config.ingress.rules.map((rule, ruleIndex) => (
                    <div key={ruleIndex} className="border border-gray-200 rounded-lg p-4 bg-white">
                      <div className="flex items-center justify-between mb-3">
                        <h6 className="text-sm font-medium text-gray-900">Rule {ruleIndex + 1}</h6>
                        <button
                          onClick={() => removeIngressRule(ruleIndex)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors duration-200"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Host
                          </label>
                          <input
                            type="text"
                            value={rule.host}
                            onChange={(e) => updateIngressRule(ruleIndex, 'host', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-orange-500 focus:border-transparent text-sm"
                            placeholder="example.com"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Path
                          </label>
                          <input
                            type="text"
                            value={rule.path}
                            onChange={(e) => updateIngressRule(ruleIndex, 'path', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-orange-500 focus:border-transparent text-sm"
                            placeholder="/"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Path Type
                          </label>
                          <select
                            value={rule.pathType}
                            onChange={(e) => updateIngressRule(ruleIndex, 'pathType', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-orange-500 focus:border-transparent text-sm"
                          >
                            <option value="Prefix">Prefix</option>
                            <option value="Exact">Exact</option>
                            <option value="ImplementationSpecific">Implementation Specific</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Service Name
                          </label>
                          <input
                            type="text"
                            value={rule.serviceName}
                            onChange={(e) => updateIngressRule(ruleIndex, 'serviceName', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-orange-500 focus:border-transparent text-sm"
                            placeholder={`${config.appName || 'app'}-service`}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Service Port
                          </label>
                          <input
                            type="number"
                            value={rule.servicePort}
                            onChange={(e) => updateIngressRule(ruleIndex, 'servicePort', parseInt(e.target.value) || 80)}
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-orange-500 focus:border-transparent text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* TLS Configuration */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Shield className="w-4 h-4 text-green-600" />
                  <h5 className="text-sm font-medium text-gray-700">TLS Configuration</h5>
                </div>
                <button
                  onClick={addIngressTLS}
                  className="inline-flex items-center px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors duration-200"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add TLS
                </button>
              </div>
              
              {config.ingress.tls.length > 0 && (
                <div className="space-y-4">
                  {config.ingress.tls.map((tls, tlsIndex) => (
                    <div key={tlsIndex} className="border border-green-200 rounded-lg p-4 bg-green-50">
                      <div className="flex items-center justify-between mb-3">
                        <h6 className="text-sm font-medium text-gray-900">TLS Certificate {tlsIndex + 1}</h6>
                        <button
                          onClick={() => removeIngressTLS(tlsIndex)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors duration-200"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                      
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Secret Name
                          </label>
                          <select
                            value={tls.secretName}
                            onChange={(e) => updateIngressTLS(tlsIndex, 'secretName', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:border-transparent text-sm"
                          >
                            <option value="">Select Secret</option>
                            {filteredSecrets.filter(s => s.type === 'kubernetes.io/tls').map(s => (
                              <option key={s.name} value={s.name}>{s.name}</option>
                            ))}
                          </select>
                        </div>
                        
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="block text-xs font-medium text-gray-600">
                              Hosts
                            </label>
                            <button
                              onClick={() => addTLSHost(tlsIndex)}
                              className="inline-flex items-center px-1 py-0.5 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors duration-200"
                            >
                              <Plus className="w-2 h-2 mr-1" />
                              Add Host
                            </button>
                          </div>
                          
                          <div className="space-y-2">
                            {tls.hosts.map((host, hostIndex) => (
                              <div key={hostIndex} className="flex items-center space-x-2">
                                <input
                                  type="text"
                                  value={host}
                                  onChange={(e) => updateTLSHost(tlsIndex, hostIndex, e.target.value)}
                                  className="flex-1 px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:border-transparent text-sm"
                                  placeholder="example.com"
                                />
                                <button
                                  onClick={() => removeTLSHost(tlsIndex, hostIndex)}
                                  className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors duration-200"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}