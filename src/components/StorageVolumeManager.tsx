import React, { useState } from 'react';
import { Plus, X, HardDrive, Trash2, AlertTriangle, Info } from 'lucide-react';
import type { StorageVolume, StorageVolumeType, AccessMode } from '../types';

interface StorageVolumeManagerProps {
  storageVolumes: StorageVolume[];
  namespaces: string[];
  configMaps: string[];
  secrets: string[];
  onAddStorageVolume: (volume: StorageVolume) => void;
  onDeleteStorageVolume: (volumeName: string) => void;
  onClose: () => void;
}

export function StorageVolumeManager({ 
  storageVolumes, 
  namespaces,
  configMaps,
  secrets,
  onAddStorageVolume, 
  onDeleteStorageVolume, 
  onClose 
}: StorageVolumeManagerProps) {
  const [newVolume, setNewVolume] = useState<Partial<StorageVolume>>({
    name: '',
    namespace: 'default',
    type: 'emptyDir',
    labels: {},
    annotations: {},
    spec: {
      emptyDir: {
        sizeLimit: '',
        medium: ''
      }
    },
    capacity: '',
    accessModes: ['ReadWriteOnce'],
    storageClass: '',
    status: 'Available'
  });
  const [newLabel, setNewLabel] = useState({ key: '', value: '' });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  const volumeTypes: { value: StorageVolumeType; label: string; description: string }[] = [
    { value: 'emptyDir', label: 'EmptyDir', description: 'Temporary storage that shares a pod\'s lifetime' },
    { value: 'hostPath', label: 'HostPath', description: 'Mount a file or directory from the host node' },
    { value: 'configMap', label: 'ConfigMap', description: 'Mount configuration data from a ConfigMap' },
    { value: 'secret', label: 'Secret', description: 'Mount sensitive data from a Secret' },
    { value: 'persistentVolumeClaim', label: 'PVC Reference', description: 'Reference an existing Persistent Volume Claim' }
  ];

  const accessModes: { value: AccessMode; label: string; description: string }[] = [
    { value: 'ReadWriteOnce', label: 'ReadWriteOnce (RWO)', description: 'Read-write by a single node' },
    { value: 'ReadOnlyMany', label: 'ReadOnlyMany (ROX)', description: 'Read-only by many nodes' },
    { value: 'ReadWriteMany', label: 'ReadWriteMany (RWX)', description: 'Read-write by many nodes' },
    { value: 'ReadWriteOncePod', label: 'ReadWriteOncePod (RWOP)', description: 'Read-write by a single pod' }
  ];

  const validateVolumeName = (name: string): string[] => {
    const errors: string[] = [];
    
    if (!name) {
      errors.push('Volume name is required');
      return errors;
    }
    
    if (name.length > 63) {
      errors.push('Name must be 63 characters or less');
    }
    
    if (!/^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/.test(name)) {
      errors.push('Use only lowercase letters, numbers, and hyphens');
    }
    
    if (name.startsWith('-') || name.endsWith('-')) {
      errors.push('Cannot start or end with hyphen');
    }
    
    if (storageVolumes.some(v => v.name === name)) {
      errors.push('Volume already exists');
    }
    
    return errors;
  };

  const handleVolumeNameChange = (name: string) => {
    setNewVolume(prev => ({ ...prev, name }));
    setErrors(validateVolumeName(name));
  };

  const handleTypeChange = (type: StorageVolumeType) => {
    const defaultSpecs = {
      emptyDir: { emptyDir: { sizeLimit: '', medium: '' } },
      hostPath: { hostPath: { path: '', type: 'DirectoryOrCreate' } },
      configMap: { configMap: { name: '', defaultMode: 420, optional: false } },
      secret: { secret: { secretName: '', defaultMode: 420, optional: false } },
      persistentVolumeClaim: { persistentVolumeClaim: { claimName: '' } }
    };

    setNewVolume(prev => ({
      ...prev,
      type,
      spec: defaultSpecs[type]
    }));
  };

  const addLabel = () => {
    if (newLabel.key && newLabel.value) {
      setNewVolume(prev => ({
        ...prev,
        labels: { ...prev.labels, [newLabel.key]: newLabel.value }
      }));
      setNewLabel({ key: '', value: '' });
    }
  };

  const removeLabel = (key: string) => {
    setNewVolume(prev => {
      const { [key]: removed, ...rest } = prev.labels || {};
      return { ...prev, labels: rest };
    });
  };

  const handleAccessModeChange = (mode: AccessMode, checked: boolean) => {
    setNewVolume(prev => {
      const currentModes = prev.accessModes || [];
      if (checked) {
        return { ...prev, accessModes: [...currentModes, mode] };
      } else {
        return { ...prev, accessModes: currentModes.filter(m => m !== mode) };
      }
    });
  };

  const handleCreateVolume = () => {
    const validationErrors = validateVolumeName(newVolume.name || '');
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    // Type-specific validation
    if (newVolume.type === 'hostPath' && !newVolume.spec?.hostPath?.path) {
      setErrors(['Host path is required for hostPath volumes']);
      return;
    }

    if (newVolume.type === 'configMap' && !newVolume.spec?.configMap?.name) {
      setErrors(['ConfigMap name is required']);
      return;
    }

    if (newVolume.type === 'secret' && !newVolume.spec?.secret?.secretName) {
      setErrors(['Secret name is required']);
      return;
    }

    if (newVolume.type === 'persistentVolumeClaim' && !newVolume.spec?.persistentVolumeClaim?.claimName) {
      setErrors(['PVC name is required']);
      return;
    }

    if (!newVolume.accessModes || newVolume.accessModes.length === 0) {
      setErrors(['At least one access mode is required']);
      return;
    }

    const volume: StorageVolume = {
      name: newVolume.name!,
      namespace: newVolume.namespace!,
      type: newVolume.type!,
      labels: newVolume.labels || {},
      annotations: newVolume.annotations || {},
      spec: newVolume.spec!,
      capacity: newVolume.capacity || '',
      accessModes: newVolume.accessModes!,
      storageClass: newVolume.storageClass || '',
      status: 'Available',
      createdAt: new Date().toISOString()
    };

    onAddStorageVolume(volume);
    setNewVolume({
      name: '',
      namespace: 'default',
      type: 'emptyDir',
      labels: {},
      annotations: {},
      spec: { emptyDir: { sizeLimit: '', medium: '' } },
      capacity: '',
      accessModes: ['ReadWriteOnce'],
      storageClass: '',
      status: 'Available'
    });
    setErrors([]);
  };

  const handleDeleteVolume = (volumeName: string) => {
    onDeleteStorageVolume(volumeName);
    setDeleteConfirm(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter') {
      action();
    }
  };

  const getVolumeTypeColor = (type: StorageVolumeType) => {
    switch (type) {
      case 'emptyDir': return 'bg-blue-100 text-blue-800';
      case 'hostPath': return 'bg-orange-100 text-orange-800';
      case 'configMap': return 'bg-green-100 text-green-800';
      case 'secret': return 'bg-red-100 text-red-800';
      case 'persistentVolumeClaim': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderVolumeTypeForm = () => {
    switch (newVolume.type) {
      case 'emptyDir':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Size Limit (Optional)
              </label>
              <input
                type="text"
                value={newVolume.spec?.emptyDir?.sizeLimit || ''}
                onChange={(e) => setNewVolume(prev => ({
                  ...prev,
                  spec: { ...prev.spec, emptyDir: { ...prev.spec?.emptyDir, sizeLimit: e.target.value } }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="1Gi"
              />
              <p className="text-xs text-gray-500 mt-1">e.g., 1Gi, 500Mi</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Medium
              </label>
              <select
                value={newVolume.spec?.emptyDir?.medium || ''}
                onChange={(e) => setNewVolume(prev => ({
                  ...prev,
                  spec: { ...prev.spec, emptyDir: { ...prev.spec?.emptyDir, medium: e.target.value as 'Memory' | '' } }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Default (Disk)</option>
                <option value="Memory">Memory (tmpfs)</option>
              </select>
            </div>
          </div>
        );

      case 'hostPath':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Host Path *
              </label>
              <input
                type="text"
                value={newVolume.spec?.hostPath?.path || ''}
                onChange={(e) => setNewVolume(prev => ({
                  ...prev,
                  spec: { ...prev.spec, hostPath: { ...prev.spec?.hostPath, path: e.target.value } }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="/var/lib/data"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Path Type
              </label>
              <select
                value={newVolume.spec?.hostPath?.type || 'DirectoryOrCreate'}
                onChange={(e) => setNewVolume(prev => ({
                  ...prev,
                  spec: { ...prev.spec, hostPath: { ...prev.spec?.hostPath, type: e.target.value as any } }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="DirectoryOrCreate">DirectoryOrCreate</option>
                <option value="Directory">Directory</option>
                <option value="FileOrCreate">FileOrCreate</option>
                <option value="File">File</option>
                <option value="Socket">Socket</option>
                <option value="CharDevice">CharDevice</option>
                <option value="BlockDevice">BlockDevice</option>
              </select>
            </div>
          </div>
        );

      case 'configMap':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ConfigMap Name *
              </label>
              <select
                value={newVolume.spec?.configMap?.name || ''}
                onChange={(e) => setNewVolume(prev => ({
                  ...prev,
                  spec: { ...prev.spec, configMap: { ...prev.spec?.configMap, name: e.target.value } }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select ConfigMap</option>
                {configMaps.map(cm => (
                  <option key={cm} value={cm}>{cm}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default Mode (Octal)
              </label>
              <input
                type="number"
                value={newVolume.spec?.configMap?.defaultMode || 420}
                onChange={(e) => setNewVolume(prev => ({
                  ...prev,
                  spec: { ...prev.spec, configMap: { ...prev.spec?.configMap, defaultMode: parseInt(e.target.value) } }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="420"
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="configmap-optional"
                checked={newVolume.spec?.configMap?.optional || false}
                onChange={(e) => setNewVolume(prev => ({
                  ...prev,
                  spec: { ...prev.spec, configMap: { ...prev.spec?.configMap, optional: e.target.checked } }
                }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="configmap-optional" className="ml-2 block text-sm text-gray-900">
                Optional (don't fail if ConfigMap doesn't exist)
              </label>
            </div>
          </div>
        );

      case 'secret':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Secret Name *
              </label>
              <select
                value={newVolume.spec?.secret?.secretName || ''}
                onChange={(e) => setNewVolume(prev => ({
                  ...prev,
                  spec: { ...prev.spec, secret: { ...prev.spec?.secret, secretName: e.target.value } }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Secret</option>
                {secrets.map(secret => (
                  <option key={secret} value={secret}>{secret}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default Mode (Octal)
              </label>
              <input
                type="number"
                value={newVolume.spec?.secret?.defaultMode || 420}
                onChange={(e) => setNewVolume(prev => ({
                  ...prev,
                  spec: { ...prev.spec, secret: { ...prev.spec?.secret, defaultMode: parseInt(e.target.value) } }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="420"
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="secret-optional"
                checked={newVolume.spec?.secret?.optional || false}
                onChange={(e) => setNewVolume(prev => ({
                  ...prev,
                  spec: { ...prev.spec, secret: { ...prev.spec?.secret, optional: e.target.checked } }
                }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="secret-optional" className="ml-2 block text-sm text-gray-900">
                Optional (don't fail if Secret doesn't exist)
              </label>
            </div>
          </div>
        );

      case 'persistentVolumeClaim':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                PVC Name *
              </label>
              <input
                type="text"
                value={newVolume.spec?.persistentVolumeClaim?.claimName || ''}
                onChange={(e) => setNewVolume(prev => ({
                  ...prev,
                  spec: { ...prev.spec, persistentVolumeClaim: { ...prev.spec?.persistentVolumeClaim, claimName: e.target.value } }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="my-pvc"
              />
              <p className="text-xs text-gray-500 mt-1">Name of the PVC to mount</p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <HardDrive className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Storage Volume Manager</h3>
              <p className="text-sm text-gray-500">Create and manage Kubernetes storage volumes</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
            {/* Create New Volume */}
            <div className="space-y-6">
              <h4 className="text-lg font-semibold text-gray-900">Create New Storage Volume</h4>

              {/* Volume Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Volume Name *
                </label>
                <input
                  type="text"
                  value={newVolume.name || ''}
                  onChange={(e) => handleVolumeNameChange(e.target.value)}
                  onKeyPress={(e) => handleKeyPress(e, handleCreateVolume)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.length > 0 ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="my-volume"
                />
                {errors.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {errors.map((error, index) => (
                      <div key={index} className="flex items-center space-x-2 text-sm text-red-600">
                        <AlertTriangle className="w-4 h-4" />
                        <span>{error}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Namespace */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Namespace
                </label>
                <select
                  value={newVolume.namespace || 'default'}
                  onChange={(e) => setNewVolume(prev => ({ ...prev, namespace: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {namespaces.map(namespace => (
                    <option key={namespace} value={namespace}>
                      {namespace}
                    </option>
                  ))}
                </select>
              </div>

              {/* Volume Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Volume Type *
                </label>
                <div className="space-y-2">
                  {volumeTypes.map(type => (
                    <div key={type.value} className="flex items-start space-x-3">
                      <input
                        type="radio"
                        id={`type-${type.value}`}
                        name="volumeType"
                        value={type.value}
                        checked={newVolume.type === type.value}
                        onChange={(e) => handleTypeChange(e.target.value as StorageVolumeType)}
                        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <div className="flex-1">
                        <label htmlFor={`type-${type.value}`} className="block text-sm font-medium text-gray-900">
                          {type.label}
                        </label>
                        <p className="text-xs text-gray-500">{type.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Type-specific configuration */}
              {renderVolumeTypeForm()}

              {/* Access Modes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Access Modes *
                </label>
                <div className="space-y-2">
                  {accessModes.map(mode => (
                    <div key={mode.value} className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        id={`mode-${mode.value}`}
                        checked={newVolume.accessModes?.includes(mode.value) || false}
                        onChange={(e) => handleAccessModeChange(mode.value, e.target.checked)}
                        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <div className="flex-1">
                        <label htmlFor={`mode-${mode.value}`} className="block text-sm font-medium text-gray-900">
                          {mode.label}
                        </label>
                        <p className="text-xs text-gray-500">{mode.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Storage Class */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Storage Class (Optional)
                </label>
                <input
                  type="text"
                  value={newVolume.storageClass || ''}
                  onChange={(e) => setNewVolume(prev => ({ ...prev, storageClass: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="standard"
                />
              </div>

              {/* Labels */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Labels (Optional)
                  </label>
                  <button
                    onClick={addLabel}
                    disabled={!newLabel.key || !newLabel.value}
                    className="inline-flex items-center px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add
                  </button>
                </div>
                <div className="flex space-x-2 mb-2">
                  <input
                    type="text"
                    value={newLabel.key}
                    onChange={(e) => setNewLabel(prev => ({ ...prev, key: e.target.value }))}
                    onKeyPress={(e) => handleKeyPress(e, addLabel)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="key"
                  />
                  <input
                    type="text"
                    value={newLabel.value}
                    onChange={(e) => setNewLabel(prev => ({ ...prev, value: e.target.value }))}
                    onKeyPress={(e) => handleKeyPress(e, addLabel)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="value"
                  />
                </div>
                
                {Object.entries(newVolume.labels || {}).length > 0 && (
                  <div className="space-y-1">
                    {Object.entries(newVolume.labels || {}).map(([key, value]) => (
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

              <button
                onClick={handleCreateVolume}
                disabled={!newVolume.name || errors.length > 0}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Create Storage Volume</span>
              </button>
            </div>

            {/* Existing Volumes */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-semibold text-gray-900">Existing Storage Volumes</h4>
                <span className="text-sm text-gray-500">{storageVolumes.length} total</span>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {storageVolumes.map((volume) => (
                  <div key={volume.name} className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <HardDrive className="w-4 h-4 text-blue-600" />
                        <span className="font-medium text-gray-900">{volume.name}</span>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                          {volume.namespace}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getVolumeTypeColor(volume.type)}`}>
                          {volume.type}
                        </span>
                      </div>
                      
                      <div>
                        {deleteConfirm === volume.name ? (
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleDeleteVolume(volume.name)}
                              className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                            >
                              Delete
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(volume.name)}
                            className="p-1 text-gray-400 hover:text-red-600 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="text-xs text-gray-500 mb-2">
                      Created: {new Date(volume.createdAt).toLocaleDateString()}
                    </div>

                    {/* Access Modes */}
                    <div className="mb-2">
                      <div className="text-xs text-gray-600 mb-1">Access Modes:</div>
                      <div className="flex flex-wrap gap-1">
                        {volume.accessModes.map(mode => (
                          <span key={mode} className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                            {mode}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Volume Details */}
                    <div className="text-xs text-gray-600">
                      {volume.type === 'emptyDir' && volume.spec.emptyDir && (
                        <div>Size Limit: {volume.spec.emptyDir.sizeLimit || 'None'}</div>
                      )}
                      {volume.type === 'hostPath' && volume.spec.hostPath && (
                        <div>Path: {volume.spec.hostPath.path}</div>
                      )}
                      {volume.type === 'configMap' && volume.spec.configMap && (
                        <div>ConfigMap: {volume.spec.configMap.name}</div>
                      )}
                      {volume.type === 'secret' && volume.spec.secret && (
                        <div>Secret: {volume.spec.secret.secretName}</div>
                      )}
                      {volume.type === 'persistentVolumeClaim' && volume.spec.persistentVolumeClaim && (
                        <div>PVC: {volume.spec.persistentVolumeClaim.claimName}</div>
                      )}
                    </div>

                    {/* Labels */}
                    {Object.keys(volume.labels).length > 0 && (
                      <div className="mt-2">
                        <div className="text-xs text-gray-600 mb-1">Labels:</div>
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(volume.labels).slice(0, 3).map(([key, value]) => (
                            <span key={key} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                              {key}: {value}
                            </span>
                          ))}
                          {Object.keys(volume.labels).length > 3 && (
                            <span className="text-xs text-gray-500">
                              +{Object.keys(volume.labels).length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Delete confirmation warning */}
                    {deleteConfirm === volume.name && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                        <div className="flex items-center space-x-1 mb-1">
                          <AlertTriangle className="w-3 h-3" />
                          <span className="font-medium">Confirm deletion</span>
                        </div>
                        <div>
                          This will remove the storage volume and any references to it in deployments.
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {storageVolumes.length === 0 && (
                  <div className="text-center py-8">
                    <HardDrive className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h5 className="text-lg font-medium text-gray-900 mb-2">No Storage Volumes</h5>
                    <p className="text-sm text-gray-500">
                      Create your first storage volume to manage persistent data
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-2 text-sm text-blue-600">
            <Info className="w-4 h-4" />
            <span>Storage volumes provide persistent data storage for your applications</span>
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}