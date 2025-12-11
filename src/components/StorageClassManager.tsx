import React, { useState } from 'react';
import { Plus, X, Layers, Trash2, AlertCircle, Copy, Zap, Cloud, HardDrive } from 'lucide-react';
import type { StorageClass } from '../types';

interface StorageClassManagerProps {
  storageClasses: StorageClass[];
  editingSC?: StorageClass;
  onAddSC: (sc: StorageClass) => void;
  onUpdateSC?: (oldName: string, sc: StorageClass) => void;
  onDeleteSC: (scName: string) => void;
  onClose: () => void;
}

// Common StorageClass templates
const SC_TEMPLATES: Array<{
  name: string;
  description: string;
  config: {
    provisioner: string;
    parameters: Record<string, string>;
    reclaimPolicy: 'Retain' | 'Delete';
    volumeBindingMode: 'Immediate' | 'WaitForFirstConsumer';
    allowVolumeExpansion: boolean;
  };
}> = [
  {
    name: 'AWS EBS (gp3)',
    description: 'AWS General Purpose SSD',
    config: {
      provisioner: 'ebs.csi.aws.com',
      parameters: {
        'type': 'gp3',
        'encrypted': 'true'
      },
      reclaimPolicy: 'Delete' as const,
      volumeBindingMode: 'WaitForFirstConsumer' as const,
      allowVolumeExpansion: true
    }
  },
  {
    name: 'GCE Persistent Disk',
    description: 'Google Cloud persistent disk',
    config: {
      provisioner: 'pd.csi.storage.gke.io',
      parameters: {
        'type': 'pd-standard',
        'replication-type': 'none'
      },
      reclaimPolicy: 'Delete' as const,
      volumeBindingMode: 'WaitForFirstConsumer' as const,
      allowVolumeExpansion: true
    }
  },
  {
    name: 'Azure Disk',
    description: 'Azure managed disk',
    config: {
      provisioner: 'disk.csi.azure.com',
      parameters: {
        'storageaccounttype': 'Standard_LRS',
        'kind': 'Managed'
      },
      reclaimPolicy: 'Delete' as const,
      volumeBindingMode: 'WaitForFirstConsumer' as const,
      allowVolumeExpansion: true
    }
  },
  {
    name: 'Local Storage',
    description: 'Local node storage',
    config: {
      provisioner: 'kubernetes.io/no-provisioner',
      parameters: {},
      reclaimPolicy: 'Retain' as const,
      volumeBindingMode: 'WaitForFirstConsumer' as const,
      allowVolumeExpansion: false
    }
  }
];

export function StorageClassManager({ 
  storageClasses,
  editingSC,
  onAddSC,
  onUpdateSC,
  onDeleteSC, 
  onClose 
}: StorageClassManagerProps) {
  const isEditMode = !!editingSC;
  const [originalName] = useState(editingSC?.name || '');
  const [newSC, setNewSC] = useState<Partial<StorageClass>>(editingSC || {
    name: '',
    provisioner: 'kubernetes.io/no-provisioner',
    parameters: {},
    reclaimPolicy: 'Delete',
    volumeBindingMode: 'Immediate',
    allowVolumeExpansion: false,
    mountOptions: []
  });
  const [newParameter, setNewParameter] = useState({ key: '', value: '' });
  const [newMountOption, setNewMountOption] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showTemplates, setShowTemplates] = useState(false);

  const validateSCName = (name: string): Record<string, string> => {
    const errors: Record<string, string> = {};
    
    if (!name) {
      errors.name = 'StorageClass name is required';
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
    
    if (storageClasses.some(sc => sc.name === name)) {
      errors.name = 'StorageClass already exists';
    }
    
    return errors;
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Name validation
    const nameErrors = validateSCName(newSC.name || '');
    Object.assign(newErrors, nameErrors);
    
    // Provisioner validation
    if (!newSC.provisioner) {
      newErrors.provisioner = 'Provisioner is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSCNameChange = (name: string) => {
    setNewSC(prev => ({ ...prev, name }));
    const nameErrors = validateSCName(name);
    setErrors(prev => {
      const { name: _, ...rest } = prev;
      return { ...rest, ...nameErrors };
    });
  };

  const addParameter = () => {
    if (newParameter.key && newParameter.value) {
      setNewSC(prev => ({
        ...prev,
        parameters: { ...prev.parameters, [newParameter.key]: newParameter.value }
      }));
      setNewParameter({ key: '', value: '' });
    }
  };

  const removeParameter = (key: string) => {
    setNewSC(prev => {
      const { [key]: removed, ...rest } = prev.parameters || {};
      return { ...prev, parameters: rest };
    });
  };

  const addMountOption = () => {
    if (newMountOption.trim()) {
      setNewSC(prev => ({
        ...prev,
        mountOptions: [...(prev.mountOptions || []), newMountOption.trim()]
      }));
      setNewMountOption('');
    }
  };

  const removeMountOption = (index: number) => {
    setNewSC(prev => ({
      ...prev,
      mountOptions: (prev.mountOptions || []).filter((_, i) => i !== index)
    }));
  };

  const applyTemplate = (template: typeof SC_TEMPLATES[0]) => {
    setNewSC(prev => ({
      ...prev,
      provisioner: template.config.provisioner,
      parameters: { ...template.config.parameters },
      reclaimPolicy: template.config.reclaimPolicy,
      volumeBindingMode: template.config.volumeBindingMode,
      allowVolumeExpansion: template.config.allowVolumeExpansion
    }));
    setShowTemplates(false);
    setErrors({});
  };

  const handleCreateSC = () => {
    if (!validateForm()) return;

    const sc: StorageClass = {
      name: newSC.name!,
      labels: newSC.labels || {},
      annotations: newSC.annotations || {},
      provisioner: newSC.provisioner!,
      parameters: newSC.parameters || {},
      reclaimPolicy: newSC.reclaimPolicy || 'Delete',
      volumeBindingMode: newSC.volumeBindingMode || 'Immediate',
      allowVolumeExpansion: newSC.allowVolumeExpansion || false,
      mountOptions: newSC.mountOptions || [],
      createdAt: editingSC?.createdAt || new Date().toISOString()
    };

    if (isEditMode && onUpdateSC) {
      onUpdateSC(originalName, sc);
    } else {
      onAddSC(sc);
    }
    
    // Reset form
    setNewSC({ 
      name: '', 
      provisioner: 'kubernetes.io/no-provisioner',
      parameters: {},
      reclaimPolicy: 'Delete',
      volumeBindingMode: 'Immediate',
      allowVolumeExpansion: false,
      mountOptions: []
    });
    setErrors({});
    onClose();
  };

  const handleDeleteSC = (scName: string) => {
    onDeleteSC(scName);
    setDeleteConfirm(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter') {
      action();
    }
  };

  const getProvisionerIcon = (provisioner: string) => {
    if (provisioner.includes('aws') || provisioner.includes('ebs')) {
      return <Cloud className="w-4 h-4 text-orange-600" />;
    } else if (provisioner.includes('gce') || provisioner.includes('gke')) {
      return <Cloud className="w-4 h-4 text-blue-600" />;
    } else if (provisioner.includes('azure')) {
      return <Cloud className="w-4 h-4 text-cyan-600" />;
    } else if (provisioner.includes('no-provisioner')) {
      return <HardDrive className="w-4 h-4 text-gray-600" />;
    }
    return <Zap className="w-4 h-4 text-teal-600" />;
  };

  const getProvisionerBadge = (provisioner: string) => {
    if (provisioner.includes('aws') || provisioner.includes('ebs')) {
      return 'bg-orange-100 text-orange-800 border-orange-200';
    } else if (provisioner.includes('gce') || provisioner.includes('gke')) {
      return 'bg-blue-100 text-blue-800 border-blue-200';
    } else if (provisioner.includes('azure')) {
      return 'bg-cyan-100 text-cyan-800 border-cyan-200';
    } else if (provisioner.includes('no-provisioner')) {
      return 'bg-gray-100 text-gray-800 border-gray-200';
    }
    return 'bg-teal-100 text-teal-800 border-teal-200';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">StorageClass Manager</h3>
              <p className="text-xs text-gray-500">Create and manage Kubernetes StorageClasses</p>
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
              {/* Create New SC Form */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-semibold text-gray-900">{isEditMode ? 'Edit StorageClass' : 'Create New StorageClass'}</h4>
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
                    <h5 className="text-xs font-medium text-gray-700 mb-2">StorageClass Templates</h5>
                    <div className="space-y-1">
                      {SC_TEMPLATES.map((template, index) => (
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
                      StorageClass Name *
                    </label>
                    <input
                      type="text"
                      value={newSC.name || ''}
                      onChange={(e) => handleSCNameChange(e.target.value)}
                      className={`w-full px-2 py-1.5 text-sm border rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                        errors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="fast-storage"
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
                      Provisioner *
                    </label>
                    <select
                      value={newSC.provisioner || 'kubernetes.io/no-provisioner'}
                      onChange={(e) => {
                        setNewSC(prev => ({ ...prev, provisioner: e.target.value }));
                        setErrors(prev => {
                          const { provisioner: _, ...rest } = prev;
                          return rest;
                        });
                      }}
                      className={`w-full px-2 py-1.5 text-sm border rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                        errors.provisioner ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                    >
                      <option value="kubernetes.io/no-provisioner">No Provisioner (Local)</option>
                      <option value="ebs.csi.aws.com">AWS EBS CSI</option>
                      <option value="pd.csi.storage.gke.io">GCE Persistent Disk CSI</option>
                      <option value="disk.csi.azure.com">Azure Disk CSI</option>
                      <option value="nfs.csi.k8s.io">NFS CSI</option>
                      <option value="csi.vsphere.vmware.com">vSphere CSI</option>
                    </select>
                    {errors.provisioner && (
                      <div className="flex items-center mt-1 text-xs text-red-600">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        {errors.provisioner}
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-1">Storage provisioner driver</p>
                  </div>
                </div>

                {/* Storage Options */}
                <div className="bg-white border border-gray-200 rounded-lg p-3 space-y-3">
                  <h5 className="text-sm font-medium text-gray-900">Storage Options</h5>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Reclaim Policy
                    </label>
                    <select
                      value={newSC.reclaimPolicy || 'Delete'}
                      onChange={(e) => setNewSC(prev => ({ 
                        ...prev, 
                        reclaimPolicy: e.target.value as 'Delete' | 'Retain'
                      }))}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    >
                      <option value="Delete">Delete</option>
                      <option value="Retain">Retain</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">What happens to volumes when PVC is deleted</p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Volume Binding Mode
                    </label>
                    <select
                      value={newSC.volumeBindingMode || 'Immediate'}
                      onChange={(e) => setNewSC(prev => ({ 
                        ...prev, 
                        volumeBindingMode: e.target.value as 'Immediate' | 'WaitForFirstConsumer'
                      }))}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    >
                      <option value="Immediate">Immediate</option>
                      <option value="WaitForFirstConsumer">WaitForFirstConsumer</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">When to bind and provision volumes</p>
                  </div>

                  <div>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newSC.allowVolumeExpansion || false}
                        onChange={(e) => setNewSC(prev => ({ 
                          ...prev, 
                          allowVolumeExpansion: e.target.checked 
                        }))}
                        className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                      />
                      <span className="text-xs font-medium text-gray-700">Allow Volume Expansion</span>
                    </label>
                    <p className="text-xs text-gray-500 mt-1 ml-6">Enable resizing of persistent volumes</p>
                  </div>
                </div>

                {/* Parameters */}
                <div className="bg-white border border-gray-200 rounded-lg p-3 space-y-2">
                  <h5 className="text-sm font-medium text-gray-900">Parameters</h5>
                  <p className="text-xs text-gray-500">Provisioner-specific parameters</p>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newParameter.key}
                      onChange={(e) => setNewParameter(prev => ({ ...prev, key: e.target.value }))}
                      onKeyPress={(e) => handleKeyPress(e, addParameter)}
                      className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="Key (e.g., type)"
                    />
                    <input
                      type="text"
                      value={newParameter.value}
                      onChange={(e) => setNewParameter(prev => ({ ...prev, value: e.target.value }))}
                      onKeyPress={(e) => handleKeyPress(e, addParameter)}
                      className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="Value (e.g., gp3)"
                    />
                    <button
                      onClick={addParameter}
                      disabled={!newParameter.key || !newParameter.value}
                      className="px-2 py-1.5 bg-teal-600 text-white rounded-md hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  {Object.entries(newSC.parameters || {}).length > 0 && (
                    <div className="space-y-1">
                      {Object.entries(newSC.parameters || {}).map(([key, value]) => (
                        <div
                          key={key}
                          className="flex items-center justify-between px-2 py-1.5 bg-gray-50 rounded border border-gray-200"
                        >
                          <span className="text-xs text-gray-700">
                            <span className="font-medium">{key}:</span> {value}
                          </span>
                          <button
                            onClick={() => removeParameter(key)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Mount Options */}
                <div className="bg-white border border-gray-200 rounded-lg p-3 space-y-2">
                  <h5 className="text-sm font-medium text-gray-900">Mount Options</h5>
                  <p className="text-xs text-gray-500">Optional mount flags for volumes</p>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newMountOption}
                      onChange={(e) => setNewMountOption(e.target.value)}
                      onKeyPress={(e) => handleKeyPress(e, addMountOption)}
                      className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="e.g., noatime, ro"
                    />
                    <button
                      onClick={addMountOption}
                      disabled={!newMountOption.trim()}
                      className="px-2 py-1.5 bg-teal-600 text-white rounded-md hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  {(newSC.mountOptions || []).length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {(newSC.mountOptions || []).map((option, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded border border-gray-200"
                        >
                          {option}
                          <button
                            onClick={() => removeMountOption(index)}
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
                  onClick={handleCreateSC}
                  className="w-full px-3 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors duration-200 flex items-center justify-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isEditMode ? 'Update StorageClass' : 'Create StorageClass'}</span>
                </button>
              </div>

              {/* Existing SCs List */}
              <div className="space-y-3">
                <h4 className="text-base font-semibold text-gray-900">
                  Existing StorageClasses ({storageClasses.length})
                </h4>
                
                <div className="space-y-2 max-h-[calc(90vh-8rem)] overflow-y-auto">
                  {storageClasses.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
                      <Layers className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm">No StorageClasses created yet</p>
                      <p className="text-xs mt-1">Use the form to create your first StorageClass</p>
                    </div>
                  ) : (
                    storageClasses.map((sc) => (
                      <div
                        key={sc.name}
                        className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 bg-teal-100 rounded flex items-center justify-center">
                              {getProvisionerIcon(sc.provisioner)}
                            </div>
                            <div>
                              <h5 className="font-medium text-gray-900 text-sm">{sc.name}</h5>
                              <span className={`inline-block mt-0.5 px-1.5 py-0.5 text-xs rounded border ${getProvisionerBadge(sc.provisioner)}`}>
                                {sc.provisioner.split('/').pop()}
                              </span>
                            </div>
                          </div>
                          {deleteConfirm === sc.name ? (
                            <div className="flex space-x-1">
                              <button
                                onClick={() => handleDeleteSC(sc.name)}
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
                              onClick={() => setDeleteConfirm(sc.name)}
                              className="text-gray-400 hover:text-red-600 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        
                        <div className="space-y-1 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Reclaim Policy:</span>
                            <span className="font-medium text-gray-900">{sc.reclaimPolicy}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Binding Mode:</span>
                            <span className="font-medium text-gray-900">{sc.volumeBindingMode}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Volume Expansion:</span>
                            <span className={`font-medium ${sc.allowVolumeExpansion ? 'text-green-600' : 'text-gray-500'}`}>
                              {sc.allowVolumeExpansion ? 'Enabled' : 'Disabled'}
                            </span>
                          </div>
                          {Object.keys(sc.parameters || {}).length > 0 && (
                            <div className="mt-2 pt-2 border-t border-gray-200">
                              <span className="text-gray-600 font-medium">Parameters:</span>
                              <div className="mt-1 space-y-0.5">
                                {Object.entries(sc.parameters || {}).map(([key, value]) => (
                                  <div key={key} className="flex items-center justify-between">
                                    <span className="text-gray-500">{key}:</span>
                                    <span className="text-gray-700">{value}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {(sc.mountOptions || []).length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {(sc.mountOptions || []).map((option, index) => (
                                <span
                                  key={index}
                                  className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs border border-gray-200"
                                >
                                  {option}
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
