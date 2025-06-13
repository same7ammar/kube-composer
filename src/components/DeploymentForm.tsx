import { Plus, Minus, Server, Settings, Database, Key, Trash2, Copy } from 'lucide-react';
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

      {/* Service Configuration - Now positioned after Volumes */}
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
    </div>
  );
}