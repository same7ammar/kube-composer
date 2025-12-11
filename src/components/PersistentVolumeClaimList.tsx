import React, { useState } from 'react';
import { Settings, Copy, Trash2, AlertTriangle, Database, Calendar, Tag } from 'lucide-react';
import type { PersistentVolumeClaim } from '../types';

interface PersistentVolumeClaimListProps {
  persistentVolumeClaims: PersistentVolumeClaim[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  onEdit: (index: number) => void;
  onDelete: (pvcName: string) => void;
  onDuplicate: (index: number) => void;
}

export function PersistentVolumeClaimList({ 
  persistentVolumeClaims, 
  selectedIndex, 
  onSelect, 
  onEdit, 
  onDelete, 
  onDuplicate 
}: PersistentVolumeClaimListProps) {
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

  if (persistentVolumeClaims.length === 0) {
    return (
      <div className="p-6 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 dark:bg-gray-700">
          <Database className="w-8 h-8 text-gray-400 dark:text-gray-300" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2 dark:text-gray-100">No PersistentVolumeClaims</h3>
        <p className="text-sm text-gray-500 mb-4 dark:text-gray-400">
          Create PersistentVolumeClaims to request storage for your applications
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1 p-4">
      {persistentVolumeClaims.map((pvc, index) => (
        <button
          key={`${pvc.namespace}-${pvc.name}`}
          className={`p-3 rounded-lg border cursor-pointer transition-all w-full text-left duration-200 ${
            selectedIndex === index
              ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-200 dark:bg-blue-900 dark:border-blue-700 dark:ring-blue-700'
              : 'bg-white border-gray-200 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:hover:bg-gray-600'
          }`}
          onClick={() => onSelect(index)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <div className="flex-shrink-0">
                <Database className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center space-x-2">
                  <div className="font-medium text-gray-900 truncate dark:text-gray-100">
                    {pvc.name}
                  </div>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium dark:bg-blue-800 dark:text-blue-100">
                    {pvc.namespace}
                  </span>
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium dark:bg-green-800 dark:text-green-100">
                    {pvc.storageRequest}
                  </span>
                </div>
                <div className="text-sm text-gray-500 flex items-center space-x-2 dark:text-gray-300">
                  <Calendar className="w-3 h-3 dark:text-gray-300" />
                  <span>{new Date(pvc.createdAt).toLocaleDateString()}</span>
                  <span>•</span>
                  <span>{pvc.accessModes.join(', ')}</span>
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
                    className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors duration-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={(e) => handleConfirmDelete(pvc.name, e)}
                    className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors duration-200 flex items-center space-x-1 dark:bg-red-700 dark:hover:bg-red-800"
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
                    className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors duration-200 dark:text-gray-300 dark:hover:text-gray-400"
                    title="Edit PersistentVolumeClaim"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => handleDuplicateClick(index, e)}
                    className="p-1 text-gray-400 hover:text-blue-600 rounded transition-colors duration-200 dark:text-gray-300 dark:hover:text-blue-500"
                    title="Duplicate PersistentVolumeClaim"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => handleDeleteClick(pvc.name, e)}
                    className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors duration-200 dark:text-gray-300 dark:hover:text-red-500"
                    title="Delete PersistentVolumeClaim"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Labels and Details Preview */}
          {(Object.keys(pvc.labels).length > 0 || pvc.storageClassName || pvc.volumeName) && (
            <div className="mt-2 space-y-1">
              {Object.keys(pvc.labels).length > 0 && (
                <div className="flex items-center space-x-1">
                  <Tag className="w-3 h-3 text-blue-500 dark:text-blue-400" />
                  <span className="text-xs text-gray-500 dark:text-gray-200">Labels:</span>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(pvc.labels).slice(0, 2).map(([key, value]) => (
                      <span key={key} className="px-1 py-0.5 bg-blue-100 text-blue-800 rounded text-xs dark:bg-blue-800 dark:text-blue-100">
                        {key}: {value}
                      </span>
                    ))}
                    {Object.keys(pvc.labels).length > 2 && (
                      <span className="text-xs text-gray-500 dark:text-gray-200">
                        +{Object.keys(pvc.labels).length - 2} more
                      </span>
                    )}
                  </div>
                </div>
              )}
              
              {pvc.storageClassName && (
                <div className="text-xs text-gray-500 dark:text-gray-300">
                  <span className="font-medium">Storage Class:</span> {pvc.storageClassName}
                </div>
              )}
              
              {pvc.volumeName && (
                <div className="text-xs text-gray-500 dark:text-gray-300">
                  <span className="font-medium">Bound to:</span> {pvc.volumeName}
                </div>
              )}
            </div>
          )}
          
          {/* Delete confirmation warning */}
          {deleteConfirm === pvc.name && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700 dark:bg-red-700 dark:text-gray-300 dark:border-red-800">
              <div className="flex items-center space-x-1 mb-1">
                <AlertTriangle className="w-3 h-3 dark:text-gray-300" />
                <span className="font-medium">Are you sure?</span>
              </div>
              <div>
                This will delete the PersistentVolumeClaim and may affect any pods using it.
              </div>
            </div>
          )}
        </button>
      ))}
    </div>
  );
}
