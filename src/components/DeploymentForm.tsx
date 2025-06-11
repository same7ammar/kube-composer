import { Plus, Minus, Server, Settings, Database, Key } from 'lucide-react';
import type { DeploymentConfig } from '../types';

interface DeploymentFormProps {
  config: DeploymentConfig;
  onChange: (config: DeploymentConfig) => void;
}

export function DeploymentForm({ config, onChange }: DeploymentFormProps) {
  const updateConfig = (updates: Partial<DeploymentConfig>) => {
    onChange({ ...config, ...updates });
  };

  const addEnvVar = () => {
    updateConfig({
      env: [...config.env, { name: '', value: '' }]
    });
  };

  const removeEnvVar = (index: number) => {
    updateConfig({
      env: config.env.filter((_, i) => i !== index)
    });
  };

  const updateEnvVar = (index: number, field: 'name' | 'value', value: string) => {
    const newEnv = [...config.env];
    newEnv[index] = { ...newEnv[index], [field]: value };
    updateConfig({ env: newEnv });
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
              Container Image *
            </label>
            <input
              type="text"
              value={config.image}
              onChange={(e) => updateConfig({ image: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
              placeholder="nginx:latest"
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
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Namespace
            </label>
            <input
              type="text"
              value={config.namespace}
              onChange={(e) => updateConfig({ namespace: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
              placeholder="default"
            />
          </div>
        </div>
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

      {/* Resource Limits */}
      <div className="space-y-4 sm:space-y-6">
        <div className="flex items-center space-x-2 text-base sm:text-lg font-semibold text-gray-900">
          <Database className="w-4 sm:w-5 h-4 sm:h-5 text-purple-600" />
          <span>Resource Limits</span>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              CPU Request
            </label>
            <input
              type="text"
              value={config.resources.requests.cpu}
              onChange={(e) => updateConfig({
                resources: {
                  ...config.resources,
                  requests: { ...config.resources.requests, cpu: e.target.value }
                }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
              placeholder="100m"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Memory Request
            </label>
            <input
              type="text"
              value={config.resources.requests.memory}
              onChange={(e) => updateConfig({
                resources: {
                  ...config.resources,
                  requests: { ...config.resources.requests, memory: e.target.value }
                }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
              placeholder="128Mi"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              CPU Limit
            </label>
            <input
              type="text"
              value={config.resources.limits.cpu}
              onChange={(e) => updateConfig({
                resources: {
                  ...config.resources,
                  limits: { ...config.resources.limits, cpu: e.target.value }
                }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
              placeholder="500m"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Memory Limit
            </label>
            <input
              type="text"
              value={config.resources.limits.memory}
              onChange={(e) => updateConfig({
                resources: {
                  ...config.resources,
                  limits: { ...config.resources.limits, memory: e.target.value }
                }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
              placeholder="256Mi"
            />
          </div>
        </div>
      </div>

      {/* Environment Variables */}
      <div className="space-y-4 sm:space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-base sm:text-lg font-semibold text-gray-900">
            <Key className="w-4 sm:w-5 h-4 sm:h-5 text-orange-600" />
            <span>Environment Variables</span>
          </div>
          <button
            onClick={addEnvVar}
            className="inline-flex items-center px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add
          </button>
        </div>
        
        {config.env.length > 0 && (
          <div className="space-y-3">
            {config.env.map((envVar, index) => (
              <div key={index} className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                <input
                  type="text"
                  value={envVar.name}
                  onChange={(e) => updateEnvVar(index, 'name', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                  placeholder="Variable name"
                />
                <input
                  type="text"
                  value={envVar.value}
                  onChange={(e) => updateEnvVar(index, 'value', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                  placeholder="Variable value"
                />
                <button
                  onClick={() => removeEnvVar(index)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200 self-center sm:self-auto"
                >
                  <Minus className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
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
    </div>
  );
}