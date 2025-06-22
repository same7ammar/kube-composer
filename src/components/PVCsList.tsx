import React, { useState } from 'react';
import { Settings, Copy, Trash2, AlertTriangle, Database, Calendar, Tag } from 'lucide-react';
import type { PersistentVolumeClaim } from '../types';

interface PVCsListProps {
  persistentVolumeClaims: PersistentVolumeClaim[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  onEdit: (index: number) => void;
  onDelete: (pvcName: string) => void;
  onDuplicate: (index: number) => void;
}

export function PVCsList({ 
  persistentVolumeClaims, 
  selectedIndex, 
  onSelect, 
  onEdit, 
  onDelete, 
  onDuplicate 
}: PVCsListProps) {
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleDeleteClick = (pvcName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirm(pvcName);
  };

  const handleConfirmDelete = (pvcName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(pvcName);
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

  const getStatusColor = (phase: string) => {
    switch (phase) {
      case 'Bound': return 'bg-green-100 text-green-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Lost': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (persistentVolumeClaims.length === 0) {
    return (
      <div className="p-6 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Database className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Persistent Volume Claims</h3>
        <p className="text-sm text-gray-500 mb-4">
          Create PVCs to request persistent storage from your cluster's storage classes
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1 p-4">
      {persistentVolumeClaims.map((pvc, index) => (
        <div
          key={pvc.name}
          className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
            selectedIndex === index
              ? 'bg-purple-50 border-purple-200 ring-1 ring-purple-200'
              : 'bg-white border-gray-200 hover:bg-gray-50'
          }`}
          onClick={() => onSelect(index)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <div className="flex-shrink-0">
                <Database className="w-4 h-4 text-purple-600" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center space-x-2">
                  <div className="font-medium text-gray-900 truncate">
                    {pvc.name}
                  </div>
                  <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium">
                    {pvc.namespace}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(pvc.status.phase)}`}>
                    {pvc.status.phase}
                  </span>
                </div>
                <div className="text-sm text-gray-500 flex items-center space-x-2">
                  <Calendar className="w-3 h-3" />
                  <span>{new Date(pvc.createdAt).toLocaleDateString()}</span>
                  <span>•</span>
                  <span>{pvc.spec.resources.requests.storage}</span>
                  {pvc.status.capacity?.storage && (
                    <>
                      <span>→</span>
                      <span>{pvc.status.capacity.storage}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center space-x-1 flex-shrink-0">
              {deleteConfirm === pvc.name ? (
                // Delete confirmation buttons
                <div className="flex items-center space-x-1">
                  <button
                    onClick={handleCancelDelete}
                    className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={(e) => handleConfirmDelete(pvc.name, e)}
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
                    title="Edit PVC"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => handleDuplicateClick(index, e)}
                    className="p-1 text-gray-400 hover:text-purple-600 rounded transition-colors duration-200"
                    title="Duplicate PVC"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => handleDeleteClick(pvc.name, e)}
                    className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors duration-200"
                    title="Delete PVC"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* PVC Details */}
          <div className="mt-2 space-y-1">
            {/* Access Modes */}
            {pvc.spec.accessModes.length > 0 && (
              <div className="flex items-center space-x-1">
                <Tag className="w-3 h-3 text-green-500" />
                <span className="text-xs text-gray-500">Access:</span>
                <div className="flex flex-wrap gap-1">
                  {pvc.spec.accessModes.slice(0, 2).map(mode => (
                    <span key={mode} className="px-1 py-0.5 bg-green-100 text-green-800 rounded text-xs">
                      {mode}
                    </span>
                  ))}
                  {pvc.spec.accessModes.length > 2 && (
                    <span className="text-xs text-gray-500">
                      +{pvc.spec.accessModes.length - 2} more
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Storage Class */}
            {pvc.spec.storageClassName && (
              <div className="flex items-center space-x-1">
                <Tag className="w-3 h-3 text-purple-500" />
                <span className="text-xs text-gray-500">Storage Class:</span>
                <span className="text-xs text-gray-700">{pvc.spec.storageClassName}</span>
              </div>
            )}

            {/* Volume Mode */}
            {pvc.spec.volumeMode && (
              <div className="flex items-center space-x-1">
                <Database className="w-3 h-3 text-blue-500" />
                <span className="text-xs text-gray-500">Volume Mode:</span>
                <span className="text-xs text-gray-700">{pvc.spec.volumeMode}</span>
              </div>
            )}

            {/* Selector Labels */}
            {pvc.spec.selector?.matchLabels && Object.keys(pvc.spec.selector.matchLabels).length > 0 && (
              <div className="flex items-center space-x-1">
                <Tag className="w-3 h-3 text-orange-500" />
                <span className="text-xs text-gray-500">Selector:</span>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(pvc.spec.selector.matchLabels).slice(0, 2).map(([key, value]) => (
                    <span key={key} className="px-1 py-0.5 bg-orange-100 text-orange-800 rounded text-xs">
                      {key}: {value}
                    </span>
                  ))}
                  {Object.keys(pvc.spec.selector.matchLabels).length > 2 && (
                    <span className="text-xs text-gray-500">
                      +{Object.keys(pvc.spec.selector.matchLabels).length - 2} more
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Labels */}
            {Object.keys(pvc.labels).length > 0 && (
              <div className="flex items-center space-x-1">
                <Tag className="w-3 h-3 text-blue-500" />
                <span className="text-xs text-gray-500">Labels:</span>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(pvc.labels).slice(0, 2).map(([key, value]) => (
                    <span key={key} className="px-1 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">
                      {key}: {value}
                    </span>
                  ))}
                  {Object.keys(pvc.labels).length > 2 && (
                    <span className="text-xs text-gray-500">
                      +{Object.keys(pvc.labels).length - 2} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* Delete confirmation warning */}
          {deleteConfirm === pvc.name && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
              <div className="flex items-center space-x-1 mb-1">
                <AlertTriangle className="w-3 h-3" />
                <span className="font-medium">Are you sure?</span>
              </div>
              <div>
                This will delete the PVC and remove it from any deployments that reference it.
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}