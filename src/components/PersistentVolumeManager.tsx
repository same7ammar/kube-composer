import React, { useState } from 'react';
import { Plus, X, HardDrive, Trash2, AlertCircle, Copy, Server, Database, Folder } from 'lucide-react';
import type { PersistentVolume } from '../types';

interface PersistentVolumeManagerProps {
  persistentVolumes: PersistentVolume[];
  editingPV?: PersistentVolume;
  onAddPV: (pv: PersistentVolume) => void;
  onUpdatePV?: (oldName: string, pv: PersistentVolume) => void;
  onDeletePV: (pvName: string) => void;
  onClose: () => void;
}

// Common PV templates
const PV_TEMPLATES = [
  {
    name: 'Local HostPath',
    description: 'Simple local storage using hostPath',
    config: {
      capacity: '10Gi',
      accessModes: ['ReadWriteOnce'],
      persistentVolumeReclaimPolicy: 'Retain',
      volumeMode: 'Filesystem',
      volumeSource: {
        type: 'hostPath',
        hostPath: { path: '/mnt/data', type: 'DirectoryOrCreate' }
      }
    }
  },
  {
    name: 'NFS Share',
    description: 'Network File System storage',
    config: {
      capacity: '100Gi',
      accessModes: ['ReadWriteMany'],
      persistentVolumeReclaimPolicy: 'Retain',
      volumeMode: 'Filesystem',
      volumeSource: {
        type: 'nfs',
        nfs: { server: 'nfs-server.example.com', path: '/exports' }
      }
    }
  },
  {
    name: 'CSI Volume',
    description: 'Container Storage Interface volume',
    config: {
      capacity: '50Gi',
      accessModes: ['ReadWriteOnce'],
      persistentVolumeReclaimPolicy: 'Delete',
      volumeMode: 'Filesystem',
      volumeSource: {
        type: 'csi',
        csi: { driver: 'ebs.csi.aws.com', volumeHandle: 'vol-xxxxxxxxxxxxxxxxx', fsType: 'ext4' }
      }
    }
  }
];

export function PersistentVolumeManager({ 
  persistentVolumes,
  editingPV,
  onAddPV,
  onUpdatePV,
  onDeletePV, 
  onClose 
}: PersistentVolumeManagerProps) {
  const isEditMode = !!editingPV;
  const [originalName] = useState(editingPV?.name || '');
  const [newPV, setNewPV] = useState<Partial<PersistentVolume>>(editingPV || {
    name: '',
    labels: {},
    annotations: {},
    capacity: '10Gi',
    accessModes: ['ReadWriteOnce'],
    persistentVolumeReclaimPolicy: 'Retain',
    storageClassName: '',
    volumeMode: 'Filesystem',
    volumeSource: {
      type: 'hostPath',
      hostPath: {
        path: '/mnt/data',
        type: 'DirectoryOrCreate'
      }
    }
  });
  const [newLabel, setNewLabel] = useState({ key: '', value: '' });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showTemplates, setShowTemplates] = useState(false);

  const validatePVName = (name: string): Record<string, string> => {
    const errors: Record<string, string> = {};
    
    if (!name) {
      errors.name = 'PersistentVolume name is required';
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
    
    if (persistentVolumes.some(pv => pv.name === name)) {
      errors.name = 'PersistentVolume already exists';
    }
    
    return errors;
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Name validation
    const nameErrors = validatePVName(newPV.name || '');
    Object.assign(newErrors, nameErrors);
    
    // Capacity validation
    if (!newPV.capacity) {
      newErrors.capacity = 'Capacity is required';
    } else if (!/^\d+(\.\d+)?(Gi|Mi|Ti|G|M|T)$/.test(newPV.capacity)) {
      newErrors.capacity = 'Invalid capacity format (e.g., 10Gi, 100Mi)';
    }
    
    // Access modes validation
    if (!newPV.accessModes || newPV.accessModes.length === 0) {
      newErrors.accessModes = 'At least one access mode is required';
    }
    
    // Volume source validation
    if (newPV.volumeSource?.type === 'hostPath' && !newPV.volumeSource.hostPath?.path) {
      newErrors.volumeSource = 'HostPath path is required';
    }
    if (newPV.volumeSource?.type === 'nfs' && (!newPV.volumeSource.nfs?.server || !newPV.volumeSource.nfs?.path)) {
      newErrors.volumeSource = 'NFS server and path are required';
    }
    if (newPV.volumeSource?.type === 'local' && !newPV.volumeSource.local?.path) {
      newErrors.volumeSource = 'Local path is required';
    }
    if (newPV.volumeSource?.type === 'csi' && (!newPV.volumeSource.csi?.driver || !newPV.volumeSource.csi?.volumeHandle)) {
      newErrors.volumeSource = 'CSI driver and volume handle are required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePVNameChange = (name: string) => {
    setNewPV(prev => ({ ...prev, name }));
    const nameErrors = validatePVName(name);
    setErrors(prev => {
      const { name: _, ...rest } = prev;
      return { ...rest, ...nameErrors };
    });
  };

  const addLabel = () => {
    if (newLabel.key && newLabel.value) {
      setNewPV(prev => ({
        ...prev,
        labels: { ...prev.labels, [newLabel.key]: newLabel.value }
      }));
      setNewLabel({ key: '', value: '' });
    }
  };

  const removeLabel = (key: string) => {
    setNewPV(prev => {
      const { [key]: removed, ...rest } = prev.labels || {};
      return { ...prev, labels: rest };
    });
  };

  const handleAccessModeToggle = (mode: 'ReadWriteOnce' | 'ReadOnlyMany' | 'ReadWriteMany') => {
    setNewPV(prev => {
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

  const applyTemplate = (template: typeof PV_TEMPLATES[0]) => {
    setNewPV(prev => ({
      ...prev,
      capacity: template.config.capacity,
      accessModes: template.config.accessModes as Array<'ReadWriteOnce' | 'ReadOnlyMany' | 'ReadWriteMany'>,
      persistentVolumeReclaimPolicy: template.config.persistentVolumeReclaimPolicy as 'Retain' | 'Delete' | 'Recycle',
      volumeMode: template.config.volumeMode as 'Filesystem' | 'Block',
      volumeSource: template.config.volumeSource as any
    }));
    setShowTemplates(false);
    setErrors({});
  };

  const handleCreatePV = () => {
    if (!validateForm()) return;

    const pv: PersistentVolume = {
      name: newPV.name!,
      labels: newPV.labels || {},
      annotations: newPV.annotations || {},
      capacity: newPV.capacity!,
      accessModes: newPV.accessModes!,
      persistentVolumeReclaimPolicy: newPV.persistentVolumeReclaimPolicy!,
      storageClassName: newPV.storageClassName,
      volumeMode: newPV.volumeMode!,
      volumeSource: newPV.volumeSource!,
      nodeAffinity: newPV.nodeAffinity,
      createdAt: editingPV?.createdAt || new Date().toISOString()
    };

    if (isEditMode && onUpdatePV) {
      onUpdatePV(originalName, pv);
    } else {
      onAddPV(pv);
    }
    
    // Reset form
    setNewPV({ 
      name: '', 
      labels: {}, 
      annotations: {},
      capacity: '10Gi',
      accessModes: ['ReadWriteOnce'],
      persistentVolumeReclaimPolicy: 'Retain',
      storageClassName: '',
      volumeMode: 'Filesystem',
      volumeSource: {
        type: 'hostPath',
        hostPath: {
          path: '/mnt/data',
          type: 'DirectoryOrCreate'
        }
      }
    });
    setErrors({});
    onClose();
  };

  const handleDeletePV = (pvName: string) => {
    onDeletePV(pvName);
    setDeleteConfirm(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter') {
      action();
    }
  };

  const getVolumeTypeIcon = (type: string) => {
    switch (type) {
      case 'hostPath':
        return <Folder className="w-4 h-4" />;
      case 'nfs':
        return <Server className="w-4 h-4" />;
      case 'local':
        return <HardDrive className="w-4 h-4" />;
      case 'csi':
        return <Database className="w-4 h-4" />;
      default:
        return <HardDrive className="w-4 h-4" />;
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-pink-600 rounded-lg flex items-center justify-center">
              <HardDrive className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">PersistentVolume Manager</h3>
              <p className="text-xs text-gray-500">Create and manage Kubernetes PersistentVolumes</p>
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
              {/* Create New PV Form */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-semibold text-gray-900">{isEditMode ? 'Edit PersistentVolume' : 'Create New PersistentVolume'}</h4>
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
                    <h5 className="text-xs font-medium text-gray-700 mb-2">PV Templates</h5>
                    <div className="space-y-1">
                      {PV_TEMPLATES.map((template, index) => (
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
                      PV Name *
                    </label>
                    <input
                      type="text"
                      value={newPV.name || ''}
                      onChange={(e) => handlePVNameChange(e.target.value)}
                      className={`w-full px-2 py-1.5 text-sm border rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent ${
                        errors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="my-pv"
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
                      Capacity *
                    </label>
                    <input
                      type="text"
                      value={newPV.capacity || ''}
                      onChange={(e) => {
                        setNewPV(prev => ({ ...prev, capacity: e.target.value }));
                        setErrors(prev => {
                          const { capacity: _, ...rest } = prev;
                          return rest;
                        });
                      }}
                      className={`w-full px-2 py-1.5 text-sm border rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent ${
                        errors.capacity ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="10Gi"
                    />
                    {errors.capacity && (
                      <div className="flex items-center mt-1 text-xs text-red-600">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        {errors.capacity}
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-1">Examples: 10Gi, 100Mi, 1Ti</p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Storage Class Name
                    </label>
                    <input
                      type="text"
                      value={newPV.storageClassName || ''}
                      onChange={(e) => setNewPV(prev => ({ ...prev, storageClassName: e.target.value }))}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      placeholder="standard"
                    />
                    <p className="text-xs text-gray-500 mt-1">Optional: Associate with a StorageClass</p>
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
                          checked={newPV.accessModes?.includes(mode) || false}
                          onChange={() => handleAccessModeToggle(mode)}
                          className="rounded border-gray-300 text-pink-600 focus:ring-pink-500"
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

                {/* Reclaim Policy & Volume Mode */}
                <div className="bg-white border border-gray-200 rounded-lg p-3 space-y-3">
                  <h5 className="text-sm font-medium text-gray-900">Storage Options</h5>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Reclaim Policy
                    </label>
                    <select
                      value={newPV.persistentVolumeReclaimPolicy || 'Retain'}
                      onChange={(e) => setNewPV(prev => ({ 
                        ...prev, 
                        persistentVolumeReclaimPolicy: e.target.value as 'Retain' | 'Delete' | 'Recycle'
                      }))}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    >
                      <option value="Retain">Retain</option>
                      <option value="Delete">Delete</option>
                      <option value="Recycle">Recycle</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">What happens when PVC is deleted</p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Volume Mode
                    </label>
                    <select
                      value={newPV.volumeMode || 'Filesystem'}
                      onChange={(e) => setNewPV(prev => ({ 
                        ...prev, 
                        volumeMode: e.target.value as 'Filesystem' | 'Block'
                      }))}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    >
                      <option value="Filesystem">Filesystem</option>
                      <option value="Block">Block</option>
                    </select>
                  </div>
                </div>

                {/* Volume Source */}
                <div className="bg-white border border-gray-200 rounded-lg p-3 space-y-3">
                  <h5 className="text-sm font-medium text-gray-900">Volume Source</h5>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Volume Type
                    </label>
                    <select
                      value={newPV.volumeSource?.type || 'hostPath'}
                      onChange={(e) => {
                        const type = e.target.value;
                        let volumeSource: any = { type };
                        
                        if (type === 'hostPath') {
                          volumeSource.hostPath = { path: '/mnt/data', type: 'DirectoryOrCreate' };
                        } else if (type === 'nfs') {
                          volumeSource.nfs = { server: '', path: '/' };
                        } else if (type === 'local') {
                          volumeSource.local = { path: '/mnt/disks/ssd1' };
                        } else if (type === 'csi') {
                          volumeSource.csi = { driver: 'ebs.csi.aws.com', volumeHandle: '', fsType: 'ext4' };
                        }
                        
                        setNewPV(prev => ({ ...prev, volumeSource }));
                        setErrors(prev => {
                          const { volumeSource: _, ...rest } = prev;
                          return rest;
                        });
                      }}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    >
                      <option value="hostPath">Host Path</option>
                      <option value="nfs">NFS</option>
                      <option value="local">Local</option>
                      <option value="csi">CSI (Cloud Storage)</option>
                    </select>
                  </div>

                  {/* HostPath Configuration */}
                  {newPV.volumeSource?.type === 'hostPath' && (
                    <>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Path *
                        </label>
                        <input
                          type="text"
                          value={newPV.volumeSource.hostPath?.path || ''}
                          onChange={(e) => setNewPV(prev => ({
                            ...prev,
                            volumeSource: {
                              ...prev.volumeSource!,
                              hostPath: { ...prev.volumeSource!.hostPath, path: e.target.value }
                            }
                          }))}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                          placeholder="/mnt/data"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Type
                        </label>
                        <select
                          value={newPV.volumeSource.hostPath?.type || 'DirectoryOrCreate'}
                          onChange={(e) => setNewPV(prev => ({
                            ...prev,
                            volumeSource: {
                              ...prev.volumeSource!,
                              hostPath: { path: prev.volumeSource!.hostPath?.path || '/mnt/data', type: e.target.value as any }
                            }
                          }))}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        >
                          <option value="DirectoryOrCreate">DirectoryOrCreate</option>
                          <option value="Directory">Directory</option>
                          <option value="FileOrCreate">FileOrCreate</option>
                          <option value="File">File</option>
                        </select>
                      </div>
                    </>
                  )}

                  {/* NFS Configuration */}
                  {newPV.volumeSource?.type === 'nfs' && (
                    <>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Server *
                        </label>
                        <input
                          type="text"
                          value={newPV.volumeSource.nfs?.server || ''}
                        onChange={(e) => setNewPV(prev => ({
                          ...prev,
                          volumeSource: {
                            ...prev.volumeSource!,
                            nfs: { server: e.target.value, path: prev.volumeSource!.nfs?.path || '/', readOnly: prev.volumeSource!.nfs?.readOnly }
                          }
                        }))}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                          placeholder="nfs-server.example.com"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Path *
                        </label>
                        <input
                          type="text"
                          value={newPV.volumeSource.nfs?.path || ''}
                        onChange={(e) => setNewPV(prev => ({
                          ...prev,
                          volumeSource: {
                            ...prev.volumeSource!,
                            nfs: { server: prev.volumeSource!.nfs?.server || '', path: e.target.value, readOnly: prev.volumeSource!.nfs?.readOnly }
                          }
                        }))}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                          placeholder="/exports"
                        />
                      </div>
                    </>
                  )}

                  {/* Local Configuration */}
                  {newPV.volumeSource?.type === 'local' && (
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Path *
                      </label>
                      <input
                        type="text"
                        value={newPV.volumeSource.local?.path || ''}
                        onChange={(e) => setNewPV(prev => ({
                          ...prev,
                          volumeSource: {
                            ...prev.volumeSource!,
                            local: { path: e.target.value }
                          }
                        }))}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        placeholder="/mnt/disks/ssd1"
                      />
                      <p className="text-xs text-gray-500 mt-1">Path on the node</p>
                    </div>
                  )}

                  {/* CSI Configuration */}
                  {newPV.volumeSource?.type === 'csi' && (
                    <>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Driver *
                        </label>
                        <input
                          type="text"
                          value={newPV.volumeSource.csi?.driver || ''}
                          onChange={(e) => setNewPV(prev => ({
                            ...prev,
                            volumeSource: {
                              ...prev.volumeSource!,
                              csi: { ...prev.volumeSource!.csi!, driver: e.target.value, volumeHandle: prev.volumeSource!.csi?.volumeHandle || '' }
                            }
                          }))}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                          placeholder="ebs.csi.aws.com"
                        />
                        <p className="text-xs text-gray-500 mt-1">CSI driver name</p>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Volume Handle *
                        </label>
                        <input
                          type="text"
                          value={newPV.volumeSource.csi?.volumeHandle || ''}
                          onChange={(e) => setNewPV(prev => ({
                            ...prev,
                            volumeSource: {
                              ...prev.volumeSource!,
                              csi: { ...prev.volumeSource!.csi!, volumeHandle: e.target.value, driver: prev.volumeSource!.csi?.driver || '' }
                            }
                          }))}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                          placeholder="vol-xxxxxxxxxxxxxxxxx"
                        />
                        <p className="text-xs text-gray-500 mt-1">Volume identifier</p>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Filesystem Type
                        </label>
                        <input
                          type="text"
                          value={newPV.volumeSource.csi?.fsType || 'ext4'}
                          onChange={(e) => setNewPV(prev => ({
                            ...prev,
                            volumeSource: {
                              ...prev.volumeSource!,
                              csi: { ...prev.volumeSource!.csi!, fsType: e.target.value, driver: prev.volumeSource!.csi?.driver || '', volumeHandle: prev.volumeSource!.csi?.volumeHandle || '' }
                            }
                          }))}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                          placeholder="ext4"
                        />
                      </div>
                    </>
                  )}

                  {errors.volumeSource && (
                    <div className="flex items-center text-xs text-red-600">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      {errors.volumeSource}
                    </div>
                  )}
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
                      className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      placeholder="Key"
                    />
                    <input
                      type="text"
                      value={newLabel.value}
                      onChange={(e) => setNewLabel(prev => ({ ...prev, value: e.target.value }))}
                      onKeyPress={(e) => handleKeyPress(e, addLabel)}
                      className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      placeholder="Value"
                    />
                    <button
                      onClick={addLabel}
                      disabled={!newLabel.key || !newLabel.value}
                      className="px-2 py-1.5 bg-pink-600 text-white rounded-md hover:bg-pink-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  {Object.entries(newPV.labels || {}).length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(newPV.labels || {}).map(([key, value]) => (
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
                  onClick={handleCreatePV}
                  className="w-full px-3 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 transition-colors duration-200 flex items-center justify-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isEditMode ? 'Update PersistentVolume' : 'Create PersistentVolume'}</span>
                </button>
              </div>

              {/* Existing PVs List */}
              <div className="space-y-3">
                <h4 className="text-base font-semibold text-gray-900">
                  Existing PersistentVolumes ({persistentVolumes.length})
                </h4>
                
                <div className="space-y-2 max-h-[calc(90vh-8rem)] overflow-y-auto">
                  {persistentVolumes.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
                      <HardDrive className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm">No PersistentVolumes created yet</p>
                      <p className="text-xs mt-1">Use the form to create your first PV</p>
                    </div>
                  ) : (
                    persistentVolumes.map((pv) => (
                      <div
                        key={pv.name}
                        className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 bg-pink-100 rounded flex items-center justify-center">
                              {getVolumeTypeIcon(pv.volumeSource.type)}
                            </div>
                            <div>
                              <h5 className="font-medium text-gray-900 text-sm">{pv.name}</h5>
                              <p className="text-xs text-gray-500">{pv.volumeSource.type}</p>
                            </div>
                          </div>
                          {deleteConfirm === pv.name ? (
                            <div className="flex space-x-1">
                              <button
                                onClick={() => handleDeletePV(pv.name)}
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
                              onClick={() => setDeleteConfirm(pv.name)}
                              className="text-gray-400 hover:text-red-600 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        
                        <div className="space-y-1 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Capacity:</span>
                            <span className="font-medium text-gray-900">{pv.capacity}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Reclaim Policy:</span>
                            <span className="font-medium text-gray-900">{pv.persistentVolumeReclaimPolicy}</span>
                          </div>
                          {pv.storageClassName && (
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600">Storage Class:</span>
                              <span className="font-medium text-gray-900">{pv.storageClassName}</span>
                            </div>
                          )}
                          <div className="flex flex-wrap gap-1 mt-2">
                            {pv.accessModes.map(mode => (
                              <span
                                key={mode}
                                className={`px-1.5 py-0.5 rounded text-xs border ${getAccessModeColor(mode)}`}
                              >
                                {mode}
                              </span>
                            ))}
                          </div>
                          {Object.keys(pv.labels || {}).length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {Object.entries(pv.labels || {}).map(([key, value]) => (
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
