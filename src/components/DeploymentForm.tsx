import React, { useState } from 'react';
import { Plus, X, Trash2, Copy, Server, Globe, Database, Settings, Key, HardDrive, Network, Shield, TrendingUp, AlertTriangle, Info } from 'lucide-react';
import type { DeploymentConfig, Container, EnvVar, IngressRule, ConfigMap, Secret } from '../types';

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
  const [activeTab, setActiveTab] = useState<'basic' | 'containers' | 'networking' | 'scaling' | 'storage' | 'advanced'>('basic');

  const updateConfig = (updates: Partial<DeploymentConfig>) => {
    onChange({ ...config, ...updates });
  };

  const updateContainer = (index: number, updates: Partial<Container>) => {
    const newContainers = [...config.containers];
    newContainers[index] = { ...newContainers[index], ...updates };
    updateConfig({ containers: newContainers });
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
    updateConfig({ containers: [...config.containers, newContainer] });
  };

  const removeContainer = (index: number) => {
    if (config.containers.length > 1) {
      const newContainers = config.containers.filter((_, i) => i !== index);
      updateConfig({ containers: newContainers });
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

  const addEnvVar = (containerIndex: number) => {
    const newEnvVar: EnvVar = { name: '', value: '' };
    const newContainers = [...config.containers];
    newContainers[containerIndex].env.push(newEnvVar);
    updateConfig({ containers: newContainers });
  };

  const updateEnvVar = (containerIndex: number, envIndex: number, updates: Partial<EnvVar>) => {
    const newContainers = [...config.containers];
    newContainers[containerIndex].env[envIndex] = { 
      ...newContainers[containerIndex].env[envIndex], 
      ...updates 
    };
    updateConfig({ containers: newContainers });
  };

  const removeEnvVar = (containerIndex: number, envIndex: number) => {
    const newContainers = [...config.containers];
    newContainers[containerIndex].env.splice(envIndex, 1);
    updateConfig({ containers: newContainers });
  };

  const addVolumeMount = (containerIndex: number) => {
    const newVolumeMount = { name: '', mountPath: '' };
    const newContainers = [...config.containers];
    newContainers[containerIndex].volumeMounts.push(newVolumeMount);
    updateConfig({ containers: newContainers });
  };

  const updateVolumeMount = (containerIndex: number, mountIndex: number, updates: { name?: string; mountPath?: string }) => {
    const newContainers = [...config.containers];
    newContainers[containerIndex].volumeMounts[mountIndex] = {
      ...newContainers[containerIndex].volumeMounts[mountIndex],
      ...updates
    };
    updateConfig({ containers: newContainers });
  };

  const removeVolumeMount = (containerIndex: number, mountIndex: number) => {
    const newContainers = [...config.containers];
    newContainers[containerIndex].volumeMounts.splice(mountIndex, 1);
    updateConfig({ containers: newContainers });
  };

  const addVolume = () => {
    const newVolume = { 
      name: '', 
      mountPath: '', 
      type: 'emptyDir' as const,
      configMapName: '',
      secretName: ''
    };
    updateConfig({ volumes: [...config.volumes, newVolume] });
  };

  const updateVolume = (index: number, updates: any) => {
    const newVolumes = [...config.volumes];
    newVolumes[index] = { ...newVolumes[index], ...updates };
    updateConfig({ volumes: newVolumes });
  };

  const removeVolume = (index: number) => {
    const newVolumes = config.volumes.filter((_, i) => i !== index);
    updateConfig({ volumes: newVolumes });
  };

  const addIngressRule = () => {
    const newRule: IngressRule = {
      host: '',
      path: '/',
      pathType: 'Prefix',
      serviceName: `${config.appName}-service`,
      servicePort: config.port
    };
    updateConfig({
      ingress: {
        ...config.ingress,
        rules: [...config.ingress.rules, newRule]
      }
    });
  };

  const updateIngressRule = (index: number, updates: Partial<IngressRule>) => {
    const newRules = [...config.ingress.rules];
    newRules[index] = { ...newRules[index], ...updates };
    updateConfig({
      ingress: {
        ...config.ingress,
        rules: newRules
      }
    });
  };

  const removeIngressRule = (index: number) => {
    const newRules = config.ingress.rules.filter((_, i) => i !== index);
    updateConfig({
      ingress: {
        ...config.ingress,
        rules: newRules
      }
    });
  };

  const addTLSConfig = () => {
    const newTLS = { secretName: '', hosts: [''] };
    updateConfig({
      ingress: {
        ...config.ingress,
        tls: [...config.ingress.tls, newTLS]
      }
    });
  };

  const updateTLSConfig = (index: number, updates: any) => {
    const newTLS = [...config.ingress.tls];
    newTLS[index] = { ...newTLS[index], ...updates };
    updateConfig({
      ingress: {
        ...config.ingress,
        tls: newTLS
      }
    });
  };

  const removeTLSConfig = (index: number) => {
    const newTLS = config.ingress.tls.filter((_, i) => i !== index);
    updateConfig({
      ingress: {
        ...config.ingress,
        tls: newTLS
      }
    });
  };

  const addLabel = () => {
    const key = prompt('Enter label key:');
    const value = prompt('Enter label value:');
    if (key && value) {
      updateConfig({
        labels: { ...config.labels, [key]: value }
      });
    }
  };

  const removeLabel = (key: string) => {
    const { [key]: removed, ...rest } = config.labels;
    updateConfig({ labels: rest });
  };

  const addAnnotation = () => {
    const key = prompt('Enter annotation key:');
    const value = prompt('Enter annotation value:');
    if (key && value) {
      updateConfig({
        annotations: { ...config.annotations, [key]: value }
      });
    }
  };

  const removeAnnotation = (key: string) => {
    const { [key]: removed, ...rest } = config.annotations;
    updateConfig({ annotations: rest });
  };

  const tabs = [
    { id: 'basic' as const, label: 'Basic', icon: Server },
    { id: 'containers' as const, label: 'Containers', icon: Database },
    { id: 'networking' as const, label: 'Networking', icon: Network },
    { id: 'scaling' as const, label: 'Scaling', icon: TrendingUp },
    { id: 'storage' as const, label: 'Storage', icon: HardDrive },
    { id: 'advanced' as const, label: 'Advanced', icon: Settings }
  ];

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
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
              </div>

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
          </div>
        )}

        {/* Containers Configuration */}
        {activeTab === 'containers' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Container Configuration</h3>
              <button
                onClick={addContainer}
                className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Container
              </button>
            </div>

            {config.containers.map((container, containerIndex) => (
              <div key={containerIndex} className="border border-gray-200 rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900">
                    Container {containerIndex + 1}
                    {container.name && `: ${container.name}`}
                  </h4>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => duplicateContainer(containerIndex)}
                      className="p-1 text-gray-400 hover:text-blue-600 rounded"
                      title="Duplicate container"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    {config.containers.length > 1 && (
                      <button
                        onClick={() => removeContainer(containerIndex)}
                        className="p-1 text-gray-400 hover:text-red-600 rounded"
                        title="Remove container"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Container Name *
                    </label>
                    <input
                      type="text"
                      value={container.name}
                      onChange={(e) => updateContainer(containerIndex, { name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="nginx:latest"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Container Port
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

                {/* Resource Limits */}
                <div>
                  <h5 className="font-medium text-gray-900 mb-3">Resource Limits</h5>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        CPU Requests
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="100m"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Memory Requests
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="128Mi"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        CPU Limits
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="500m"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Memory Limits
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="512Mi"
                      />
                    </div>
                  </div>
                </div>

                {/* Environment Variables */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="font-medium text-gray-900">Environment Variables</h5>
                    <button
                      onClick={() => addEnvVar(containerIndex)}
                      className="inline-flex items-center px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add
                    </button>
                  </div>

                  {container.env.map((envVar, envIndex) => (
                    <div key={envIndex} className="flex items-center space-x-2 mb-2">
                      <input
                        type="text"
                        value={envVar.name}
                        onChange={(e) => updateEnvVar(containerIndex, envIndex, { name: e.target.value })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="ENV_NAME"
                      />
                      
                      {envVar.valueFrom ? (
                        <div className="flex-1 flex items-center space-x-2">
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
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                        onClick={() => updateEnvVar(containerIndex, envIndex, 
                          envVar.valueFrom 
                            ? { valueFrom: undefined, value: '' }
                            : { valueFrom: { type: 'configMap', name: '', key: '' }, value: undefined }
                        )}
                        className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                        title={envVar.valueFrom ? 'Switch to direct value' : 'Switch to reference'}
                      >
                        {envVar.valueFrom ? 'Direct' : 'Ref'}
                      </button>

                      <button
                        onClick={() => removeEnvVar(containerIndex, envIndex)}
                        className="p-1 text-gray-400 hover:text-red-600 rounded"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Volume Mounts */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="font-medium text-gray-900">Volume Mounts</h5>
                    <button
                      onClick={() => addVolumeMount(containerIndex)}
                      className="inline-flex items-center px-2 py-1 bg-purple-600 text-white rounded text-xs hover:bg-purple-700"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add
                    </button>
                  </div>

                  {container.volumeMounts.map((mount, mountIndex) => (
                    <div key={mountIndex} className="flex items-center space-x-2 mb-2">
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
                        className="p-1 text-gray-400 hover:text-red-600 rounded"
                      >
                        <X className="w-4 h-4" />
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
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Globe className="w-5 h-5 text-orange-600" />
                  <h3 className="text-lg font-medium text-gray-900">Ingress Configuration</h3>
                </div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.ingress.enabled}
                    onChange={(e) => updateConfig({
                      ingress: { ...config.ingress, enabled: e.target.checked }
                    })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Enable Ingress</span>
                </label>
              </div>

              {config.ingress.enabled && (
                <div className="space-y-4">
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
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">Ingress Rules</h4>
                      <button
                        onClick={addIngressRule}
                        className="inline-flex items-center px-2 py-1 bg-orange-600 text-white rounded text-xs hover:bg-orange-700"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add Rule
                      </button>
                    </div>

                    {config.ingress.rules.map((rule, ruleIndex) => (
                      <div key={ruleIndex} className="border border-gray-200 rounded p-3 mb-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Host</label>
                            <input
                              type="text"
                              value={rule.host}
                              onChange={(e) => updateIngressRule(ruleIndex, { host: e.target.value })}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="example.com"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Path</label>
                            <input
                              type="text"
                              value={rule.path}
                              onChange={(e) => updateIngressRule(ruleIndex, { path: e.target.value })}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="/"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Path Type</label>
                            <select
                              value={rule.pathType}
                              onChange={(e) => updateIngressRule(ruleIndex, { pathType: e.target.value as any })}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="Prefix">Prefix</option>
                              <option value="Exact">Exact</option>
                              <option value="ImplementationSpecific">Implementation Specific</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Service Name</label>
                            <input
                              type="text"
                              value={rule.serviceName}
                              onChange={(e) => updateIngressRule(ruleIndex, { serviceName: e.target.value })}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder={`${config.appName}-service`}
                            />
                          </div>
                          <div className="flex items-end space-x-2">
                            <div className="flex-1">
                              <label className="block text-xs font-medium text-gray-700 mb-1">Service Port</label>
                              <input
                                type="number"
                                value={rule.servicePort}
                                onChange={(e) => updateIngressRule(ruleIndex, { servicePort: parseInt(e.target.value) || 80 })}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                            <button
                              onClick={() => removeIngressRule(ruleIndex)}
                              className="p-1 text-gray-400 hover:text-red-600 rounded"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* TLS Configuration */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">TLS Configuration</h4>
                      <button
                        onClick={addTLSConfig}
                        className="inline-flex items-center px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add TLS
                      </button>
                    </div>

                    {config.ingress.tls.map((tls, tlsIndex) => (
                      <div key={tlsIndex} className="border border-gray-200 rounded p-3 mb-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Secret Name</label>
                            <select
                              value={tls.secretName}
                              onChange={(e) => updateTLSConfig(tlsIndex, { secretName: e.target.value })}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="">Select Secret</option>
                              {availableSecrets.filter(s => s.type === 'kubernetes.io/tls').map(secret => (
                                <option key={secret.name} value={secret.name}>{secret.name}</option>
                              ))}
                            </select>
                          </div>
                          <div className="flex items-end space-x-2">
                            <div className="flex-1">
                              <label className="block text-xs font-medium text-gray-700 mb-1">Hosts</label>
                              <input
                                type="text"
                                value={tls.hosts.join(', ')}
                                onChange={(e) => updateTLSConfig(tlsIndex, { 
                                  hosts: e.target.value.split(',').map(h => h.trim()).filter(h => h) 
                                })}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="example.com, www.example.com"
                              />
                            </div>
                            <button
                              onClick={() => removeTLSConfig(tlsIndex)}
                              className="p-1 text-gray-400 hover:text-red-600 rounded"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Scaling Configuration */}
        {activeTab === 'scaling' && (
          <div className="space-y-6">
            {/* HPA Configuration */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                  <h3 className="text-lg font-medium text-gray-900">Horizontal Pod Autoscaler</h3>
                </div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.hpa.enabled}
                    onChange={(e) => updateConfig({
                      hpa: { ...config.hpa, enabled: e.target.checked }
                    })}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Enable Auto-scaling</span>
                </label>
              </div>

              {config.hpa.enabled && (
                <div className="space-y-4">
                  {/* Basic HPA Settings */}
                  <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                    <h4 className="font-medium text-purple-900 mb-3 flex items-center space-x-2">
                      <Info className="w-4 h-4" />
                      <span>Scaling Configuration</span>
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-purple-700 mb-2">
                          Minimum Replicas *
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={config.hpa.minReplicas}
                          onChange={(e) => updateConfig({
                            hpa: { ...config.hpa, minReplicas: parseInt(e.target.value) || 1 }
                          })}
                          className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                        <p className="text-xs text-purple-600 mt-1">
                          Minimum number of pod replicas
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-purple-700 mb-2">
                          Maximum Replicas *
                        </label>
                        <input
                          type="number"
                          min={config.hpa.minReplicas}
                          value={config.hpa.maxReplicas}
                          onChange={(e) => updateConfig({
                            hpa: { ...config.hpa, maxReplicas: parseInt(e.target.value) || 10 }
                          })}
                          className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                        <p className="text-xs text-purple-600 mt-1">
                          Maximum number of pod replicas
                        </p>
                      </div>
                    </div>

                    {/* Validation Warning */}
                    {config.hpa.maxReplicas <= config.hpa.minReplicas && (
                      <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center space-x-2 text-red-700">
                          <AlertTriangle className="w-4 h-4" />
                          <span className="text-sm font-medium">
                            Maximum replicas must be greater than minimum replicas
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Metrics Configuration */}
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <h4 className="font-medium text-blue-900 mb-3 flex items-center space-x-2">
                      <Activity className="w-4 h-4" />
                      <span>Scaling Metrics</span>
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-blue-700 mb-2">
                          Target CPU Utilization (%)
                        </label>
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
                          className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="80"
                        />
                        <p className="text-xs text-blue-600 mt-1">
                          Scale when average CPU usage exceeds this percentage
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-blue-700 mb-2">
                          Target Memory Utilization (%)
                        </label>
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
                          className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="70"
                        />
                        <p className="text-xs text-blue-600 mt-1">
                          Scale when average memory usage exceeds this percentage
                        </p>
                      </div>
                    </div>

                    {/* Metrics Validation */}
                    {!config.hpa.targetCPUUtilizationPercentage && !config.hpa.targetMemoryUtilizationPercentage && (
                      <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-center space-x-2 text-yellow-700">
                          <AlertTriangle className="w-4 h-4" />
                          <span className="text-sm font-medium">
                            At least one target metric (CPU or Memory) is required for auto-scaling
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* HPA Behavior Preview */}
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center space-x-2">
                      <TrendingUp className="w-4 h-4" />
                      <span>Scaling Behavior Preview</span>
                    </h4>
                    
                    <div className="text-sm text-gray-700 space-y-2">
                      <div className="flex items-center justify-between">
                        <span>Current Replicas:</span>
                        <span className="font-medium">{config.replicas}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Scaling Range:</span>
                        <span className="font-medium">{config.hpa.minReplicas} - {config.hpa.maxReplicas} replicas</span>
                      </div>
                      {config.hpa.targetCPUUtilizationPercentage && (
                        <div className="flex items-center justify-between">
                          <span>CPU Threshold:</span>
                          <span className="font-medium">{config.hpa.targetCPUUtilizationPercentage}%</span>
                        </div>
                      )}
                      {config.hpa.targetMemoryUtilizationPercentage && (
                        <div className="flex items-center justify-between">
                          <span>Memory Threshold:</span>
                          <span className="font-medium">{config.hpa.targetMemoryUtilizationPercentage}%</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                      <p className="text-xs text-blue-700">
                        <strong>How it works:</strong> The HPA will automatically scale your deployment up when resource utilization exceeds the target thresholds, and scale down when utilization is below the targets. Scaling decisions are made every 15 seconds, with a 3-minute stabilization window to prevent flapping.
                      </p>
                    </div>
                  </div>

                  {/* Resource Requirements Notice */}
                  <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                    <div className="flex items-start space-x-2">
                      <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-orange-900 mb-2">Resource Requirements</h4>
                        <div className="text-sm text-orange-700 space-y-1">
                          <p>• CPU-based scaling requires CPU requests to be set on containers</p>
                          <p>• Memory-based scaling requires memory requests to be set on containers</p>
                          <p>• Metrics server must be installed in your cluster</p>
                          <p>• HPA checks metrics every 15 seconds and makes scaling decisions accordingly</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Manual Scaling Info */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <Server className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-medium text-gray-900">Manual Scaling</h3>
              </div>
              
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <p className="text-sm text-blue-700 mb-3">
                  When HPA is disabled, you can manually control the number of replicas using the basic configuration.
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-900">Current Replicas:</span>
                  <span className="text-lg font-bold text-blue-800">{config.replicas}</span>
                </div>
                {config.hpa.enabled && (
                  <p className="text-xs text-blue-600 mt-2">
                    <strong>Note:</strong> When HPA is enabled, manual replica count serves as the initial value. HPA will override this based on resource utilization.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Storage Configuration */}
        {activeTab === 'storage' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Volume Configuration</h3>
              <button
                onClick={addVolume}
                className="inline-flex items-center px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200 text-sm"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Volume
              </button>
            </div>

            {config.volumes.map((volume, volumeIndex) => (
              <div key={volumeIndex} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-gray-900">Volume {volumeIndex + 1}</h4>
                  <button
                    onClick={() => removeVolume(volumeIndex)}
                    className="p-1 text-gray-400 hover:text-red-600 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Volume Name *
                    </label>
                    <input
                      type="text"
                      value={volume.name}
                      onChange={(e) => updateVolume(volumeIndex, { name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="data-volume"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Volume Type
                    </label>
                    <select
                      value={volume.type}
                      onChange={(e) => updateVolume(volumeIndex, { type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="emptyDir">Empty Directory</option>
                      <option value="configMap">ConfigMap</option>
                      <option value="secret">Secret</option>
                    </select>
                  </div>

                  {volume.type === 'configMap' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ConfigMap
                      </label>
                      <select
                        value={volume.configMapName || ''}
                        onChange={(e) => updateVolume(volumeIndex, { configMapName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select ConfigMap</option>
                        {availableConfigMaps.map(cm => (
                          <option key={cm.name} value={cm.name}>{cm.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {volume.type === 'secret' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Secret
                      </label>
                      <select
                        value={volume.secretName || ''}
                        onChange={(e) => updateVolume(volumeIndex, { secretName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select Secret</option>
                        {availableSecrets.map(secret => (
                          <option key={secret.name} value={secret.name}>{secret.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {config.volumes.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <HardDrive className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No volumes configured</p>
                <p className="text-sm">Add volumes to provide persistent or shared storage for your containers</p>
              </div>
            )}
          </div>
        )}

        {/* Advanced Configuration */}
        {activeTab === 'advanced' && (
          <div className="space-y-6">
            {/* Labels */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Labels</h3>
                <button
                  onClick={addLabel}
                  className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Label
                </button>
              </div>

              {Object.entries(config.labels).length > 0 ? (
                <div className="space-y-2">
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
              ) : (
                <p className="text-gray-500 text-sm">No labels configured</p>
              )}
            </div>

            {/* Annotations */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Annotations</h3>
                <button
                  onClick={addAnnotation}
                  className="inline-flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 text-sm"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Annotation
                </button>
              </div>

              {Object.entries(config.annotations).length > 0 ? (
                <div className="space-y-2">
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
              ) : (
                <p className="text-gray-500 text-sm">No annotations configured</p>
              )}
            </div>

            {/* ConfigMap References */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Referenced ConfigMaps</h3>
              {availableConfigMaps.length > 0 ? (
                <div className="space-y-2">
                  {availableConfigMaps.map(cm => (
                    <div key={cm.name} className="flex items-center justify-between bg-green-50 px-3 py-2 rounded-lg">
                      <div>
                        <span className="text-sm font-medium text-green-900">{cm.name}</span>
                        <span className="text-xs text-green-600 ml-2">({cm.namespace})</span>
                      </div>
                      <span className="text-xs text-green-600">
                        {Object.keys(cm.data).length} key{Object.keys(cm.data).length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No ConfigMaps available</p>
              )}
            </div>

            {/* Secret References */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Referenced Secrets</h3>
              {availableSecrets.length > 0 ? (
                <div className="space-y-2">
                  {availableSecrets.map(secret => (
                    <div key={secret.name} className="flex items-center justify-between bg-orange-50 px-3 py-2 rounded-lg">
                      <div>
                        <span className="text-sm font-medium text-orange-900">{secret.name}</span>
                        <span className="text-xs text-orange-600 ml-2">({secret.namespace})</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-orange-600">
                          {Object.keys(secret.data).length} key{Object.keys(secret.data).length !== 1 ? 's' : ''}
                        </span>
                        <span className="px-1 py-0.5 bg-orange-200 text-orange-800 rounded text-xs">
                          {secret.type}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No Secrets available</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}