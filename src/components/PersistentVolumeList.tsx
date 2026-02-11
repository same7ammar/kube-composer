import React, { useState } from 'react';
import { Settings, Copy, Trash2, AlertTriangle, HardDrive, Calendar, Tag } from 'lucide-react';
import type { PersistentVolume } from '../types';

interface PersistentVolumeListProps {
  persistentVolumes: PersistentVolume[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  onEdit: (index: number) => void;
  onDelete: (pvName: string) => void;
  onDuplicate: (index: number) => void;
}

export function PersistentVolumeList({ 
  persistentVolumes, 
  selectedIndex, 
  onSelect, 
  onEdit, 
  onDelete, 
  onDuplicate 
}: PersistentVolumeListProps) {
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleDeleteClick = (pvName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirm(pvName);
  };

  const handleConfirmDelete = (pvName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(pvName);
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

  if (persistentVolumes.length === 0) {
    return (
      <div className="p-6 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 dark:bg-gray-700">
          <HardDrive className="w-8 h-8 text-gray-400 dark:text-gray-300" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2 dark:text-gray-100">No PersistentVolumes</h3>
        <p className="text-sm text-gray-500 mb-4 dark:text-gray-400">
          Create PersistentVolumes to provide storage resources for your cluster
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1 p-4">
      {persistentVolumes.map((pv, index) => (
        <button
          key={pv.name}
          className={`p-3 rounded-lg border cursor-pointer transition-all w-full text-left duration-200 ${
            selectedIndex === index
              ? 'bg-purple-50 border-purple-200 ring-1 ring-purple-200 dark:bg-purple-900 dark:border-purple-700 dark:ring-purple-700'
              : 'bg-white border-gray-200 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:hover:bg-gray-600'
          }`}
          onClick={() => onSelect(index)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <div className="flex-shrink-0">
                <HardDrive className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center space-x-2">
                  <div className="font-medium text-gray-900 truncate dark:text-gray-100">
                    {pv.name}
                  </div>
                  <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium dark:bg-purple-800 dark:text-purple-100">
                    {pv.capacity}
                  </span>
                </div>
                <div className="text-sm text-gray-500 flex items-center space-x-2 dark:text-gray-300">
                  <Calendar className="w-3 h-3 dark:text-gray-300" />
                  <span>{new Date(pv.createdAt).toLocaleDateString()}</span>
                  <span>•</span>
                  <span>{pv.accessModes.join(', ')}</span>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center space-x-1 flex-shrink-0">
              {deleteConfirm === pv.name ? (
                // Delete confirmation buttons
                <div className="flex items-center space-x-1">
                  <button
                    onClick={handleCancelDelete}
                    className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors duration-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={(e) => handleConfirmDelete(pv.name, e)}
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
                    title="Edit PersistentVolume"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => handleDuplicateClick(index, e)}
                    className="p-1 text-gray-400 hover:text-purple-600 rounded transition-colors duration-200 dark:text-gray-300 dark:hover:text-purple-500"
                    title="Duplicate PersistentVolume"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => handleDeleteClick(pv.name, e)}
                    className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors duration-200 dark:text-gray-300 dark:hover:text-red-500"
                    title="Delete PersistentVolume"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Labels and Details Preview */}
          {(Object.keys(pv.labels).length > 0 || pv.storageClassName) && (
            <div className="mt-2 space-y-1">
              {Object.keys(pv.labels).length > 0 && (
                <div className="flex items-center space-x-1">
                  <Tag className="w-3 h-3 text-blue-500 dark:text-blue-400" />
                  <span className="text-xs text-gray-500 dark:text-gray-200">Labels:</span>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(pv.labels).slice(0, 2).map(([key, value]) => (
                      <span key={key} className="px-1 py-0.5 bg-blue-100 text-blue-800 rounded text-xs dark:bg-blue-800 dark:text-blue-100">
                        {key}: {value}
                      </span>
                    ))}
                    {Object.keys(pv.labels).length > 2 && (
                      <span className="text-xs text-gray-500 dark:text-gray-200">
                        +{Object.keys(pv.labels).length - 2} more
                      </span>
                    )}
                  </div>
                </div>
              )}
              
              {pv.storageClassName && (
                <div className="text-xs text-gray-500 dark:text-gray-300">
                  <span className="font-medium">Storage Class:</span> {pv.storageClassName}
                </div>
              )}
              
              <div className="text-xs text-gray-500 dark:text-gray-300">
                <span className="font-medium">Reclaim Policy:</span> {pv.persistentVolumeReclaimPolicy}
              </div>
            </div>
          )}
          
          {/* Delete confirmation warning */}
          {deleteConfirm === pv.name && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700 dark:bg-red-700 dark:text-gray-300 dark:border-red-800">
              <div className="flex items-center space-x-1 mb-1">
                <AlertTriangle className="w-3 h-3 dark:text-gray-300" />
                <span className="font-medium">Are you sure?</span>
              </div>
              <div>
                This will delete the PersistentVolume and may affect any PVCs bound to it.
              </div>
            </div>
          )}
        </button>
      ))}
    </div>
  );
}
