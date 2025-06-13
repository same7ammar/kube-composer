import { Plus, Minus, Server, Settings, Database, Key, Trash2, Copy, Globe, Shield } from 'lucide-react';
import type { DeploymentConfig, Container } from '../types';

interface DeploymentFormProps {
  config: DeploymentConfig;
  onChange: (config: DeploymentConfig) => void;
  availableNamespaces: string[];
}

export function DeploymentForm({ config, onChange, availableNamespaces }: DeploymentFormProps) {
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

  const updateContainerEnvVar = (containerIndex: number, envIndex: number, field: 'name' | 'value', value: string) => {
    const newContainers = [...config.containers];
    newContainers[containerIndex].env[envIndex] = {
      ...newContainers[containerIndex].env[envIndex],
      [field]: value
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
                  <div className="space-y-2">
                    {container.env.map((envVar, envIndex) => (
                      <div key={envIndex} className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={envVar.name}
                          onChange={(e) => updateContainerEnvVar(containerIndex, envIndex, 'name', e.target.value)}
                          className="flex-1 px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm"
                          placeholder="Variable name"
                        />
                        <input
                          type="text"
                          value={envVar.value}
                          onChange={(e) => updateContainerEnvVar(containerIndex, envIndex, 'value', e.target.value)}
                          className="flex-1 px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm"
                          placeholder="Variable value"
                        />
                        <button
                          onClick={() => removeContainerEnvVar(containerIndex, envIndex)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors duration-200"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
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
                        <input
                          type="text"
                          value={mount.name}
                          onChange={(e) => updateContainerVolumeMount(containerIndex, mountIndex, 'name', e.target.value)}
                          className="flex-1 px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm"
                          placeholder="Volume name"
                        />
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
              </div>
            </div>
          ))}
        </div>
      </div>

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
                          <input
                            type="text"
                            value={tls.secretName}
                            onChange={(e) => updateIngressTLS(tlsIndex, 'secretName', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:border-transparent text-sm"
                            placeholder="tls-secret"
                          />
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