import React, { useState } from 'react';
import { Settings, Copy, Trash2, AlertTriangle, HardDrive, Calendar, Tag } from 'lucide-react';
import type { StorageVolume } from '../types';

interface StorageVolumesListProps {
  storageVolumes: StorageVolume[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  onEdit: (index: number) => void;
  onDelete: (volumeName: string) => void;
  onDuplicate: (index: number) => void;
}

export function StorageVolumesList({ 
  storageVolumes, 
  selectedIndex, 
  onSelect, 
  onEdit, 
  onDelete, 
  onDuplicate 
}: StorageVolumesListProps) {
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleDeleteClick = (volumeName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirm(volumeName);
  };

  const handleConfirmDelete = (volumeName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(volumeName);
    setDeleteConfirm(null);
  };

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirm(null);
  };

  const handleDuplicateClick = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    onDuplicate(index);
  };

  const handleEditClick = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(index);
  };

  const getVolumeTypeColor = (type: string) => {
    switch (type) {
      case 'emptyDir': return 'bg-blue-100 text-blue-800';
      case 'hostPath': return 'bg-orange-100 text-orange-800';
      case 'configMap': return 'bg-green-100 text-green-800';
      case 'secret': return 'bg-red-100 text-red-800';
      case 'persistentVolumeClaim': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Available': return 'bg-green-100 text-green-800';
      case 'Bound': return 'bg-blue-100 text-blue-800';
      case 'Released': return 'bg-yellow-100 text-yellow-800';
      case 'Failed': return 'bg-red-100 text-red-800';
      case 'Pending': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getVolumeDetails = (volume: StorageVolume) => {
    switch (volume.type) {
      case 'emptyDir':
        return volume.spec.emptyDir?.sizeLimit ? `Size: ${volume.spec.emptyDir.sizeLimit}` : 'No size limit';
      case 'hostPath':
        return volume.spec.hostPath?.path || 'No path specified';
      case 'configMap':
        return volume.spec.configMap?.name || 'No ConfigMap specified';
      case 'secret':
        return volume.spec.secret?.secretName || 'No Secret specified';
      case 'persistentVolumeClaim':
        return volume.spec.persistentVolumeClaim?.claimName || 'No PVC specified';
      default:
        return 'Unknown type';
    }
  };

  if (storageVolumes.length === 0) {
    return (
      <div className="p-6 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <HardDrive className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Storage Volumes</h3>
        <p className="text-sm text-gray-500 mb-4">
          Create storage volumes to provide persistent data storage for your applications
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1 p-4">
      {storageVolumes.map((volume, index) => (
        <div
          key={volume.name}
          className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
            selectedIndex === index
              ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-200'
              : 'bg-white border-gray-200 hover:bg-gray-50'
          }`}
          onClick={() => onSelect(index)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <div className="flex-shrink-0">
                <HardDrive className="w-4 h-4 text-blue-600" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center space-x-2">
                  <div className="font-medium text-gray-900 truncate">
                    {volume.name}
                  </div>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                    {volume.namespace}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getVolumeTypeColor(volume.type)}`}>
                    {volume.type}
                  </span>
                </div>
                <div className="text-sm text-gray-500 flex items-center space-x-2">
                  <Calendar className="w-3 h-3" />
                  <span>{new Date(volume.createdAt).toLocaleDateString()}</span>
                  <span>•</span>
                  <span className={`px-1 py-0.5 rounded text-xs ${getStatusColor(volume.status)}`}>
                    {volume.status}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center space-x-1 flex-shrink-0">
              {deleteConfirm === volume.name ? (
                // Delete confirmation buttons
                <div className="flex items-center space-x-1">
                  <button
                    onClick={handleCancelDelete}
                    className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={(e) => handleConfirmDelete(volume.name, e)}
                    className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors duration-200 flex items-center space-x-1"
                  >
                    <AlertTriangle className="w-3 h-3" />
                    <span>Delete</span>
                  </button>
                </div>
              ) : (
                // Normal action buttons
                <>
                  <button
                    onClick={(e) => handleEditClick(index, e)}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors duration-200"
                    title="Edit Storage Volume"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => handleDuplicateClick(index, e)}
                    className="p-1 text-gray-400 hover:text-blue-600 rounded transition-colors duration-200"
                    title="Duplicate Storage Volume"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => handleDeleteClick(volume.name, e)}
                    className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors duration-200"
                    title="Delete Storage Volume"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Volume Details */}
          <div className="mt-2 space-y-1">
            {/* Volume Details */}
            <div className="flex items-center space-x-1">
              <HardDrive className="w-3 h-3 text-gray-500" />
              <span className="text-xs text-gray-500">Details:</span>
              <span className="text-xs text-gray-700">{getVolumeDetails(volume)}</span>
            </div>

            {/* Access Modes */}
            {volume.accessModes.length > 0 && (
              <div className="flex items-center space-x-1">
                <Tag className="w-3 h-3 text-green-500" />
                <span className="text-xs text-gray-500">Access:</span>
                <div className="flex flex-wrap gap-1">
                  {volume.accessModes.slice(0, 2).map(mode => (
                    <span key={mode} className="px-1 py-0.5 bg-green-100 text-green-800 rounded text-xs">
                      {mode}
                    </span>
                  ))}
                  {volume.accessModes.length > 2 && (
                    <span className="text-xs text-gray-500">
                      +{volume.accessModes.length - 2} more
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Storage Class */}
            {volume.storageClass && (
              <div className="flex items-center space-x-1">
                <Tag className="w-3 h-3 text-purple-500" />
                <span className="text-xs text-gray-500">Storage Class:</span>
                <span className="text-xs text-gray-700">{volume.storageClass}</span>
              </div>
            )}

            {/* Labels */}
            {Object.keys(volume.labels).length > 0 && (
              <div className="flex items-center space-x-1">
                <Tag className="w-3 h-3 text-blue-500" />
                <span className="text-xs text-gray-500">Labels:</span>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(volume.labels).slice(0, 2).map(([key, value]) => (
                    <span key={key} className="px-1 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">
                      {key}: {value}
                    </span>
                  ))}
                  {Object.keys(volume.labels).length > 2 && (
                    <span className="text-xs text-gray-500">
                      +{Object.keys(volume.labels).length - 2} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* Delete confirmation warning */}
          {deleteConfirm === volume.name && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
              <div className="flex items-center space-x-1 mb-1">
                <AlertTriangle className="w-3 h-3" />
                <span className="font-medium">Are you sure?</span>
              </div>
              <div>
                This will delete the storage volume and remove it from any deployments that reference it.
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}