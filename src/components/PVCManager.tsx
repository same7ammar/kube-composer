import React, { useState } from 'react';
import { Plus, X, Database, Trash2, AlertTriangle, Info } from 'lucide-react';
import type { PersistentVolumeClaim, AccessMode, VolumeMode } from '../types';

interface PVCManagerProps {
  persistentVolumeClaims: PersistentVolumeClaim[];
  namespaces: string[];
  onAddPVC: (pvc: PersistentVolumeClaim) => void;
  onDeletePVC: (pvcName: string) => void;
  onClose: () => void;
}

export function PVCManager({ 
  persistentVolumeClaims, 
  namespaces,
  onAddPVC, 
  onDeletePVC, 
  onClose 
}: PVCManagerProps) {
  const [newPVC, setNewPVC] = useState<Partial<PersistentVolumeClaim>>({
    name: '',
    namespace: 'default',
    labels: {},
    annotations: {},
    spec: {
      accessModes: ['ReadWriteOnce'],
      resources: {
        requests: {
          storage: ''
        }
      },
      storageClassName: '',
      volumeMode: 'Filesystem',
      selector: {
        matchLabels: {},
        matchExpressions: []
      }
    },
    status: {
      phase: 'Pending'
    }
  });
  const [newLabel, setNewLabel] = useState({ key: '', value: '' });
  const [newSelectorLabel, setNewSelectorLabel] = useState({ key: '', value: '' });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  const accessModes: { value: AccessMode; label: string; description: string }[] = [
    { value: 'ReadWriteOnce', label: 'ReadWriteOnce (RWO)', description: 'Read-write by a single node' },
    { value: 'ReadOnlyMany', label: 'ReadOnlyMany (ROX)', description: 'Read-only by many nodes' },
    { value: 'ReadWriteMany', label: 'ReadWriteMany (RWX)', description: 'Read-write by many nodes' },
    { value: 'ReadWriteOncePod', label: 'ReadWriteOncePod (RWOP)', description: 'Read-write by a single pod' }
  ];

  const volumeModes: { value: VolumeMode; label: string; description: string }[] = [
    { value: 'Filesystem', label: 'Filesystem', description: 'Volume is mounted as a filesystem' },
    { value: 'Block', label: 'Block', description: 'Volume is used as a raw block device' }
  ];

  const validatePVCName = (name: string): string[] => {
    const errors: string[] = [];
    
    if (!name) {
      errors.push('PVC name is required');
      return errors;
    }
    
    if (name.length > 253) {
      errors.push('Name must be 253 characters or less');
    }
    
    if (!/^[a-z0-9]([-a-z0-9]*[a-z0-9])?(\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*$/.test(name)) {
      errors.push('Use only lowercase letters, numbers, dots, and hyphens');
    }
    
    if (name.startsWith('-') || name.endsWith('-') || name.startsWith('.') || name.endsWith('.')) {
      errors.push('Cannot start or end with hyphen or dot');
    }
    
    if (persistentVolumeClaims.some(pvc => pvc.name === name)) {
      errors.push('PVC already exists');
    }
    
    return errors;
  };

  const validateStorageSize = (size: string): boolean => {
    if (!size) return false;
    // Basic validation for Kubernetes storage sizes (e.g., 1Gi, 500Mi, 10G)
    return /^\d+(\.\d+)?(Ei|Pi|Ti|Gi|Mi|Ki|E|P|T|G|M|K)?$/.test(size);
  };

  const handlePVCNameChange = (name: string) => {
    setNewPVC(prev => ({ ...prev, name }));
    setErrors(validatePVCName(name));
  };

  const addLabel = () => {
    if (newLabel.key && newLabel.value) {
      setNewPVC(prev => ({
        ...prev,
        labels: { ...prev.labels, [newLabel.key]: newLabel.value }
      }));
      setNewLabel({ key: '', value: '' });
    }
  };

  const removeLabel = (key: string) => {
    setNewPVC(prev => {
      const { [key]: removed, ...rest } = prev.labels || {};
      return { ...prev, labels: rest };
    });
  };

  const addSelectorLabel = () => {
    if (newSelectorLabel.key && newSelectorLabel.value) {
      setNewPVC(prev => ({
        ...prev,
        spec: {
          ...prev.spec!,
          selector: {
            ...prev.spec!.selector,
            matchLabels: { ...prev.spec!.selector?.matchLabels, [newSelectorLabel.key]: newSelectorLabel.value }
          }
        }
      }));
      setNewSelectorLabel({ key: '', value: '' });
    }
  };

  const removeSelectorLabel = (key: string) => {
    setNewPVC(prev => {
      const { [key]: removed, ...rest } = prev.spec?.selector?.matchLabels || {};
      return {
        ...prev,
        spec: {
          ...prev.spec!,
          selector: {
            ...prev.spec!.selector,
            matchLabels: rest
          }
        }
      };
    });
  };

  const handleAccessModeChange = (mode: AccessMode, checked: boolean) => {
    setNewPVC(prev => {
      const currentModes = prev.spec?.accessModes || [];
      if (checked) {
        return {
          ...prev,
          spec: { ...prev.spec!, accessModes: [...currentModes, mode] }
        };
      } else {
        return {
          ...prev,
          spec: { ...prev.spec!, accessModes: currentModes.filter(m => m !== mode) }
        };
      }
    });
  };

  const handleCreatePVC = () => {
    const validationErrors = validatePVCName(newPVC.name || '');
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    if (!newPVC.spec?.resources.requests.storage) {
      setErrors(['Storage request size is required']);
      return;
    }

    if (!validateStorageSize(newPVC.spec.resources.requests.storage)) {
      setErrors(['Invalid storage size format (e.g., 1Gi, 500Mi, 10G)']);
      return;
    }

    if (!newPVC.spec?.accessModes || newPVC.spec.accessModes.length === 0) {
      setErrors(['At least one access mode is required']);
      return;
    }

    const pvc: PersistentVolumeClaim = {
      name: newPVC.name!,
      namespace: newPVC.namespace!,
      labels: newPVC.labels || {},
      annotations: newPVC.annotations || {},
      spec: {
        accessModes: newPVC.spec!.accessModes,
        resources: {
          requests: {
            storage: newPVC.spec!.resources.requests.storage
          }
        },
        ...(newPVC.spec!.storageClassName && { storageClassName: newPVC.spec!.storageClassName }),
        ...(newPVC.spec!.volumeMode && { volumeMode: newPVC.spec!.volumeMode }),
        ...(Object.keys(newPVC.spec!.selector?.matchLabels || {}).length > 0 && {
          selector: newPVC.spec!.selector
        })
      },
      status: {
        phase: 'Pending'
      },
      createdAt: new Date().toISOString()
    };

    onAddPVC(pvc);
    setNewPVC({
      name: '',
      namespace: 'default',
      labels: {},
      annotations: {},
      spec: {
        accessModes: ['ReadWriteOnce'],
        resources: {
          requests: {
            storage: ''
          }
        },
        storageClassName: '',
        volumeMode: 'Filesystem',
        selector: {
          matchLabels: {},
          matchExpressions: []
        }
      },
      status: {
        phase: 'Pending'
      }
    });
    setErrors([]);
  };

  const handleDeletePVC = (pvcName: string) => {
    onDeletePVC(pvcName);
    setDeleteConfirm(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter') {
      action();
    }
  };

  const getStatusColor = (phase: string) => {
    switch (phase) {
      case 'Bound': return 'bg-green-100 text-green-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Lost': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
              <Database className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Persistent Volume Claims Manager</h3>
              <p className="text-sm text-gray-500">Create and manage Kubernetes PVCs</p>
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
            {/* Create New PVC */}
            <div className="space-y-6">
              <h4 className="text-lg font-semibold text-gray-900">Create New PVC</h4>

              {/* PVC Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  PVC Name *
                </label>
                <input
                  type="text"
                  value={newPVC.name || ''}
                  onChange={(e) => handlePVCNameChange(e.target.value)}
                  onKeyPress={(e) => handleKeyPress(e, handleCreatePVC)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                    errors.length > 0 ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="my-pvc"
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
                  value={newPVC.namespace || 'default'}
                  onChange={(e) => setNewPVC(prev => ({ ...prev, namespace: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  {namespaces.map(namespace => (
                    <option key={namespace} value={namespace}>
                      {namespace}
                    </option>
                  ))}
                </select>
              </div>

              {/* Storage Request */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Storage Request *
                </label>
                <input
                  type="text"
                  value={newPVC.spec?.resources.requests.storage || ''}
                  onChange={(e) => setNewPVC(prev => ({
                    ...prev,
                    spec: {
                      ...prev.spec!,
                      resources: {
                        requests: { storage: e.target.value }
                      }
                    }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="1Gi"
                />
                <p className="text-xs text-gray-500 mt-1">e.g., 1Gi, 500Mi, 10G</p>
              </div>

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
                        id={`pvc-mode-${mode.value}`}
                        checked={newPVC.spec?.accessModes?.includes(mode.value) || false}
                        onChange={(e) => handleAccessModeChange(mode.value, e.target.checked)}
                        className="mt-1 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                      />
                      <div className="flex-1">
                        <label htmlFor={`pvc-mode-${mode.value}`} className="block text-sm font-medium text-gray-900">
                          {mode.label}
                        </label>
                        <p className="text-xs text-gray-500">{mode.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Volume Mode */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Volume Mode
                </label>
                <div className="space-y-2">
                  {volumeModes.map(mode => (
                    <div key={mode.value} className="flex items-start space-x-3">
                      <input
                        type="radio"
                        id={`vol-mode-${mode.value}`}
                        name="volumeMode"
                        value={mode.value}
                        checked={newPVC.spec?.volumeMode === mode.value}
                        onChange={(e) => setNewPVC(prev => ({
                          ...prev,
                          spec: { ...prev.spec!, volumeMode: e.target.value as VolumeMode }
                        }))}
                        className="mt-1 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300"
                      />
                      <div className="flex-1">
                        <label htmlFor={`vol-mode-${mode.value}`} className="block text-sm font-medium text-gray-900">
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
                  value={newPVC.spec?.storageClassName || ''}
                  onChange={(e) => setNewPVC(prev => ({
                    ...prev,
                    spec: { ...prev.spec!, storageClassName: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="standard"
                />
                <p className="text-xs text-gray-500 mt-1">Leave empty to use default storage class</p>
              </div>

              {/* Selector Labels */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Selector Labels (Optional)
                  </label>
                  <button
                    onClick={addSelectorLabel}
                    disabled={!newSelectorLabel.key || !newSelectorLabel.value}
                    className="inline-flex items-center px-2 py-1 bg-purple-600 text-white rounded text-xs hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add
                  </button>
                </div>
                <div className="flex space-x-2 mb-2">
                  <input
                    type="text"
                    value={newSelectorLabel.key}
                    onChange={(e) => setNewSelectorLabel(prev => ({ ...prev, key: e.target.value }))}
                    onKeyPress={(e) => handleKeyPress(e, addSelectorLabel)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="key"
                  />
                  <input
                    type="text"
                    value={newSelectorLabel.value}
                    onChange={(e) => setNewSelectorLabel(prev => ({ ...prev, value: e.target.value }))}
                    onKeyPress={(e) => handleKeyPress(e, addSelectorLabel)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="value"
                  />
                </div>
                
                {Object.entries(newPVC.spec?.selector?.matchLabels || {}).length > 0 && (
                  <div className="space-y-1">
                    {Object.entries(newPVC.spec?.selector?.matchLabels || {}).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg">
                        <span className="text-sm text-gray-900">
                          <span className="font-medium">{key}</span>: {value}
                        </span>
                        <button
                          onClick={() => removeSelectorLabel(key)}
                          className="text-gray-400 hover:text-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-1">Select specific persistent volumes by labels</p>
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
                    className="inline-flex items-center px-2 py-1 bg-purple-600 text-white rounded text-xs hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="key"
                  />
                  <input
                    type="text"
                    value={newLabel.value}
                    onChange={(e) => setNewLabel(prev => ({ ...prev, value: e.target.value }))}
                    onKeyPress={(e) => handleKeyPress(e, addLabel)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="value"
                  />
                </div>
                
                {Object.entries(newPVC.labels || {}).length > 0 && (
                  <div className="space-y-1">
                    {Object.entries(newPVC.labels || {}).map(([key, value]) => (
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
                onClick={handleCreatePVC}
                disabled={!newPVC.name || errors.length > 0 || !newPVC.spec?.resources.requests.storage}
                className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Create PVC</span>
              </button>
            </div>

            {/* Existing PVCs */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-semibold text-gray-900">Existing PVCs</h4>
                <span className="text-sm text-gray-500">{persistentVolumeClaims.length} total</span>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {persistentVolumeClaims.map((pvc) => (
                  <div key={pvc.name} className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Database className="w-4 h-4 text-purple-600" />
                        <span className="font-medium text-gray-900">{pvc.name}</span>
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">
                          {pvc.namespace}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(pvc.status.phase)}`}>
                          {pvc.status.phase}
                        </span>
                      </div>
                      
                      <div>
                        {deleteConfirm === pvc.name ? (
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleDeletePVC(pvc.name)}
                              className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                            >
                              Delete
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(pvc.name)}
                            className="p-1 text-gray-400 hover:text-red-600 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="text-xs text-gray-500 mb-2">
                      Created: {new Date(pvc.createdAt).toLocaleDateString()}
                    </div>

                    {/* Storage Info */}
                    <div className="mb-2">
                      <div className="text-xs text-gray-600 mb-1">Storage:</div>
                      <div className="text-sm text-gray-900">
                        Requested: {pvc.spec.resources.requests.storage}
                        {pvc.status.capacity?.storage && (
                          <span className="text-gray-600"> • Allocated: {pvc.status.capacity.storage}</span>
                        )}
                      </div>
                    </div>

                    {/* Access Modes */}
                    <div className="mb-2">
                      <div className="text-xs text-gray-600 mb-1">Access Modes:</div>
                      <div className="flex flex-wrap gap-1">
                        {pvc.spec.accessModes.map(mode => (
                          <span key={mode} className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                            {mode}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Storage Class */}
                    {pvc.spec.storageClassName && (
                      <div className="mb-2">
                        <div className="text-xs text-gray-600">Storage Class: {pvc.spec.storageClassName}</div>
                      </div>
                    )}

                    {/* Volume Mode */}
                    {pvc.spec.volumeMode && (
                      <div className="mb-2">
                        <div className="text-xs text-gray-600">Volume Mode: {pvc.spec.volumeMode}</div>
                      </div>
                    )}

                    {/* Labels */}
                    {Object.keys(pvc.labels).length > 0 && (
                      <div className="mt-2">
                        <div className="text-xs text-gray-600 mb-1">Labels:</div>
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(pvc.labels).slice(0, 3).map(([key, value]) => (
                            <span key={key} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                              {key}: {value}
                            </span>
                          ))}
                          {Object.keys(pvc.labels).length > 3 && (
                            <span className="text-xs text-gray-500">
                              +{Object.keys(pvc.labels).length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Delete confirmation warning */}
                    {deleteConfirm === pvc.name && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                        <div className="flex items-center space-x-1 mb-1">
                          <AlertTriangle className="w-3 h-3" />
                          <span className="font-medium">Confirm deletion</span>
                        </div>
                        <div>
                          This will remove the PVC and any references to it in deployments.
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {persistentVolumeClaims.length === 0 && (
                  <div className="text-center py-8">
                    <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h5 className="text-lg font-medium text-gray-900 mb-2">No PVCs</h5>
                    <p className="text-sm text-gray-500">
                      Create your first Persistent Volume Claim to request storage
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-2 text-sm text-purple-600">
            <Info className="w-4 h-4" />
            <span>PVCs request persistent storage from your cluster's storage classes</span>
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