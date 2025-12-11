import React, { useState } from 'react';
import { Plus, X, Database, Trash2, AlertCircle, Copy, Link, CheckCircle } from 'lucide-react';
import type { PersistentVolumeClaim } from '../types';

interface PersistentVolumeClaimManagerProps {
  persistentVolumeClaims: PersistentVolumeClaim[];
  namespaces: string[];
  persistentVolumes: import('../types').PersistentVolume[];
  storageClasses: import('../types').StorageClass[];
  editingPVC?: PersistentVolumeClaim;
  onAddPVC: (pvc: PersistentVolumeClaim) => void;
  onUpdatePVC?: (oldName: string, oldNamespace: string, pvc: PersistentVolumeClaim) => void;
  onDeletePVC: (pvcName: string) => void;
  onClose: () => void;
}

// Common PVC templates
const PVC_TEMPLATES = [
  {
    name: 'Standard Storage',
    description: 'Basic persistent storage claim',
    config: {
      accessModes: ['ReadWriteOnce'],
      storageRequest: '10Gi',
      volumeMode: 'Filesystem'
    }
  },
  {
    name: 'Shared Storage',
    description: 'Multi-pod read-write access',
    config: {
      accessModes: ['ReadWriteMany'],
      storageRequest: '50Gi',
      volumeMode: 'Filesystem'
    }
  },
  {
    name: 'Read-Only Shared',
    description: 'Multi-pod read-only access',
    config: {
      accessModes: ['ReadOnlyMany'],
      storageRequest: '20Gi',
      volumeMode: 'Filesystem'
    }
  }
];

export function PersistentVolumeClaimManager({ 
  persistentVolumeClaims, 
  namespaces,
  persistentVolumes,
  storageClasses,
  editingPVC,
  onAddPVC,
  onUpdatePVC,
  onDeletePVC, 
  onClose 
}: PersistentVolumeClaimManagerProps) {
  const isEditMode = !!editingPVC;
  const [originalName] = useState(editingPVC?.name || '');
  const [originalNamespace] = useState(editingPVC?.namespace || 'default');
  const [newPVC, setNewPVC] = useState<Partial<PersistentVolumeClaim>>(editingPVC || {
    name: '',
    namespace: 'default',
    labels: {},
    annotations: {},
    accessModes: ['ReadWriteOnce'],
    storageRequest: '5Gi',
    storageClassName: '',
    volumeName: '',
    volumeMode: 'Filesystem'
  });
  const [newLabel, setNewLabel] = useState({ key: '', value: '' });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showTemplates, setShowTemplates] = useState(false);

  const validatePVCName = (name: string): Record<string, string> => {
    const errors: Record<string, string> = {};
    
    if (!name) {
      errors.name = 'PersistentVolumeClaim name is required';
      return errors;
    }
    
    if (name.length > 253) {
      errors.name = 'Name must be 253 characters or less';
    }
    
    if (!/^[a-z0-9]([-a-z0-9]*[a-z0-9])?(\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*$/.test(name)) {
      errors.name = 'Use only lowercase letters, numbers, dots, and hyphens';
    }
    
    if (name.startsWith('-') || name.endsWith('-') || name.startsWith('.') || name.endsWith('.')) {
      errors.name = 'Cannot start or end with hyphen or dot';
    }
    
    if (persistentVolumeClaims.some(pvc => pvc.name === name && pvc.namespace === newPVC.namespace)) {
      errors.name = 'PersistentVolumeClaim already exists in this namespace';
    }
    
    return errors;
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Name validation
    const nameErrors = validatePVCName(newPVC.name || '');
    Object.assign(newErrors, nameErrors);
    
    // Storage request validation
    if (!newPVC.storageRequest) {
      newErrors.storageRequest = 'Storage request is required';
    } else if (!/^\d+(\.\d+)?(Gi|Mi|Ti|G|M|T)$/.test(newPVC.storageRequest)) {
      newErrors.storageRequest = 'Invalid storage format (e.g., 10Gi, 100Mi)';
    }
    
    // Access modes validation
    if (!newPVC.accessModes || newPVC.accessModes.length === 0) {
      newErrors.accessModes = 'At least one access mode is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePVCNameChange = (name: string) => {
    setNewPVC(prev => ({ ...prev, name }));
    const nameErrors = validatePVCName(name);
    setErrors(prev => {
      const { name: _, ...rest } = prev;
      return { ...rest, ...nameErrors };
    });
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

  const handleAccessModeToggle = (mode: 'ReadWriteOnce' | 'ReadOnlyMany' | 'ReadWriteMany') => {
    setNewPVC(prev => {
      const currentModes = prev.accessModes || [];
      const newModes = currentModes.includes(mode)
        ? currentModes.filter(m => m !== mode)
        : [...currentModes, mode];
      return { ...prev, accessModes: newModes };
    });
    // Clear access mode error when user makes a change
    setErrors(prev => {
      const { accessModes: _, ...rest } = prev;
      return rest;
    });
  };

  const applyTemplate = (template: typeof PVC_TEMPLATES[0]) => {
    setNewPVC(prev => ({
      ...prev,
      accessModes: template.config.accessModes as Array<'ReadWriteOnce' | 'ReadOnlyMany' | 'ReadWriteMany'>,
      storageRequest: template.config.storageRequest,
      volumeMode: template.config.volumeMode as 'Filesystem' | 'Block'
    }));
    setShowTemplates(false);
    setErrors({});
  };

  const handleCreatePVC = () => {
    if (!validateForm()) return;

    const pvc: PersistentVolumeClaim = {
      name: newPVC.name!,
      namespace: newPVC.namespace || 'default',
      labels: newPVC.labels || {},
      annotations: newPVC.annotations || {},
      accessModes: newPVC.accessModes!,
      storageRequest: newPVC.storageRequest!,
      storageClassName: newPVC.storageClassName,
      volumeName: newPVC.volumeName,
      volumeMode: newPVC.volumeMode || 'Filesystem',
      createdAt: editingPVC?.createdAt || new Date().toISOString()
    };

    if (isEditMode && onUpdatePVC) {
      onUpdatePVC(originalName, originalNamespace, pvc);
    } else {
      onAddPVC(pvc);
    }
    
    // Reset form
    setNewPVC({ 
      name: '', 
      namespace: 'default',
      labels: {}, 
      annotations: {},
      accessModes: ['ReadWriteOnce'],
      storageRequest: '5Gi',
      storageClassName: '',
      volumeName: '',
      volumeMode: 'Filesystem'
    });
    setErrors({});
    onClose();
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

  const getAccessModeColor = (mode: string) => {
    switch (mode) {
      case 'ReadWriteOnce':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ReadOnlyMany':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'ReadWriteMany':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusBadge = (pvc: PersistentVolumeClaim) => {
    if (pvc.volumeName) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded border border-green-200">
          <CheckCircle className="w-3 h-3 mr-1" />
          Bound
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded border border-yellow-200">
        Pending
      </span>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Database className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">PersistentVolumeClaim Manager</h3>
              <p className="text-xs text-gray-500">Create and manage Kubernetes PersistentVolumeClaims</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Create New PVC Form */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-semibold text-gray-900">{isEditMode ? 'Edit PersistentVolumeClaim' : 'Create New PersistentVolumeClaim'}</h4>
                  <button
                    type="button"
                    onClick={() => setShowTemplates(!showTemplates)}
                    className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md hover:bg-gray-200"
                  >
                    <Copy className="w-3 h-3 mr-1" />
                    Templates
                  </button>
                </div>

                {/* Templates Dropdown */}
                {showTemplates && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <h5 className="text-xs font-medium text-gray-700 mb-2">PVC Templates</h5>
                    <div className="space-y-1">
                      {PVC_TEMPLATES.map((template, index) => (
                        <button
                          key={index}
                          onClick={() => applyTemplate(template)}
                          className="w-full text-left p-2 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                        >
                          <div className="text-sm font-medium text-gray-900">{template.name}</div>
                          <div className="text-xs text-gray-500">{template.description}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Basic Information */}
                <div className="bg-white border border-gray-200 rounded-lg p-3 space-y-3">
                  <h5 className="text-sm font-medium text-gray-900">Basic Information</h5>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      PVC Name *
                    </label>
                    <input
                      type="text"
                      value={newPVC.name || ''}
                      onChange={(e) => handlePVCNameChange(e.target.value)}
                      className={`w-full px-2 py-1.5 text-sm border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                        errors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="my-pvc"
                    />
                    {errors.name && (
                      <div className="flex items-center mt-1 text-xs text-red-600">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        {errors.name}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Namespace *
                    </label>
                    <select
                      value={newPVC.namespace || 'default'}
                      onChange={(e) => setNewPVC(prev => ({ ...prev, namespace: e.target.value }))}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      {namespaces.map(ns => (
                        <option key={ns} value={ns}>{ns}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Storage Request *
                    </label>
                    <input
                      type="text"
                      value={newPVC.storageRequest || ''}
                      onChange={(e) => {
                        setNewPVC(prev => ({ ...prev, storageRequest: e.target.value }));
                        setErrors(prev => {
                          const { storageRequest: _, ...rest } = prev;
                          return rest;
                        });
                      }}
                      className={`w-full px-2 py-1.5 text-sm border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                        errors.storageRequest ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="5Gi"
                    />
                    {errors.storageRequest && (
                      <div className="flex items-center mt-1 text-xs text-red-600">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        {errors.storageRequest}
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-1">Examples: 5Gi, 100Mi, 1Ti</p>
                  </div>
                </div>

                {/* Access Modes */}
                <div className="bg-white border border-gray-200 rounded-lg p-3 space-y-2">
                  <h5 className="text-sm font-medium text-gray-900">Access Modes *</h5>
                  <div className="space-y-2">
                    {(['ReadWriteOnce', 'ReadOnlyMany', 'ReadWriteMany'] as const).map(mode => (
                      <label key={mode} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newPVC.accessModes?.includes(mode) || false}
                          onChange={() => handleAccessModeToggle(mode)}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className={`text-xs px-2 py-0.5 rounded border ${getAccessModeColor(mode)}`}>
                          {mode}
                        </span>
                      </label>
                    ))}
                  </div>
                  {errors.accessModes && (
                    <div className="flex items-center text-xs text-red-600">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      {errors.accessModes}
                    </div>
                  )}
                </div>

                {/* Storage Options */}
                <div className="bg-white border border-gray-200 rounded-lg p-3 space-y-3">
                  <h5 className="text-sm font-medium text-gray-900">Storage Options</h5>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Storage Class Name
                    </label>
                    <select
                      value={newPVC.storageClassName || ''}
                      onChange={(e) => setNewPVC(prev => ({ ...prev, storageClassName: e.target.value }))}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="">-- Dynamic Provisioning --</option>
                      {storageClasses.map(sc => (
                        <option key={sc.name} value={sc.name}>{sc.name}</option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Leave empty for dynamic provisioning</p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Volume Name (Optional)
                    </label>
                    <select
                      value={newPVC.volumeName || ''}
                      onChange={(e) => setNewPVC(prev => ({ ...prev, volumeName: e.target.value }))}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="">-- Auto Bind --</option>
                      {persistentVolumes.map(pv => (
                        <option key={pv.name} value={pv.name}>
                          {pv.name} ({pv.capacity})
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Bind to a specific PersistentVolume</p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Volume Mode
                    </label>
                    <select
                      value={newPVC.volumeMode || 'Filesystem'}
                      onChange={(e) => setNewPVC(prev => ({ 
                        ...prev, 
                        volumeMode: e.target.value as 'Filesystem' | 'Block'
                      }))}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="Filesystem">Filesystem</option>
                      <option value="Block">Block</option>
                    </select>
                  </div>
                </div>

                {/* Labels */}
                <div className="bg-white border border-gray-200 rounded-lg p-3 space-y-2">
                  <h5 className="text-sm font-medium text-gray-900">Labels</h5>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newLabel.key}
                      onChange={(e) => setNewLabel(prev => ({ ...prev, key: e.target.value }))}
                      onKeyPress={(e) => handleKeyPress(e, addLabel)}
                      className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Key"
                    />
                    <input
                      type="text"
                      value={newLabel.value}
                      onChange={(e) => setNewLabel(prev => ({ ...prev, value: e.target.value }))}
                      onKeyPress={(e) => handleKeyPress(e, addLabel)}
                      className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Value"
                    />
                    <button
                      onClick={addLabel}
                      disabled={!newLabel.key || !newLabel.value}
                      className="px-2 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  {Object.entries(newPVC.labels || {}).length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(newPVC.labels || {}).map(([key, value]) => (
                        <span
                          key={key}
                          className="inline-flex items-center px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded border border-gray-200"
                        >
                          {key}={value}
                          <button
                            onClick={() => removeLabel(key)}
                            className="ml-1 text-gray-500 hover:text-gray-700"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Create Button */}
                <button
                  onClick={handleCreatePVC}
                  className="w-full px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors duration-200 flex items-center justify-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isEditMode ? 'Update PersistentVolumeClaim' : 'Create PersistentVolumeClaim'}</span>
                </button>
              </div>

              {/* Existing PVCs List */}
              <div className="space-y-3">
                <h4 className="text-base font-semibold text-gray-900">
                  Existing PersistentVolumeClaims ({persistentVolumeClaims.length})
                </h4>
                
                <div className="space-y-2 max-h-[calc(90vh-8rem)] overflow-y-auto">
                  {persistentVolumeClaims.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
                      <Database className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm">No PersistentVolumeClaims created yet</p>
                      <p className="text-xs mt-1">Use the form to create your first PVC</p>
                    </div>
                  ) : (
                    persistentVolumeClaims.map((pvc) => (
                      <div
                        key={`${pvc.namespace}-${pvc.name}`}
                        className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 bg-indigo-100 rounded flex items-center justify-center">
                              <Database className="w-4 h-4 text-indigo-600" />
                            </div>
                            <div>
                              <h5 className="font-medium text-gray-900 text-sm">{pvc.name}</h5>
                              <p className="text-xs text-gray-500">{pvc.namespace}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {getStatusBadge(pvc)}
                            {deleteConfirm === pvc.name ? (
                              <div className="flex space-x-1">
                                <button
                                  onClick={() => handleDeletePVC(pvc.name)}
                                  className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                                >
                                  Confirm
                                </button>
                                <button
                                  onClick={() => setDeleteConfirm(null)}
                                  className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setDeleteConfirm(pvc.name)}
                                className="text-gray-400 hover:text-red-600 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                        
                        <div className="space-y-1 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Storage Request:</span>
                            <span className="font-medium text-gray-900">{pvc.storageRequest}</span>
                          </div>
                          {pvc.storageClassName && (
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600">Storage Class:</span>
                              <span className="font-medium text-gray-900">{pvc.storageClassName}</span>
                            </div>
                          )}
                          {pvc.volumeName && (
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600">Volume:</span>
                              <span className="font-medium text-gray-900 flex items-center">
                                <Link className="w-3 h-3 mr-1" />
                                {pvc.volumeName}
                              </span>
                            </div>
                          )}
                          <div className="flex flex-wrap gap-1 mt-2">
                            {pvc.accessModes.map(mode => (
                              <span
                                key={mode}
                                className={`px-1.5 py-0.5 rounded text-xs border ${getAccessModeColor(mode)}`}
                              >
                                {mode}
                              </span>
                            ))}
                          </div>
                          {Object.keys(pvc.labels || {}).length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {Object.entries(pvc.labels || {}).map(([key, value]) => (
                                <span
                                  key={key}
                                  className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs border border-gray-200"
                                >
                                  {key}={value}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
