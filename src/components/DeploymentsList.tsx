import React from 'react';
import { Settings, Copy, Trash2 } from 'lucide-react';
import type { DeploymentConfig } from '../types';

interface DeploymentsListProps {
  deployments: DeploymentConfig[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  onEdit: () => void;
}

export function DeploymentsList({ deployments, selectedIndex, onSelect, onEdit }: DeploymentsListProps) {
  return (
    <div className="space-y-1 p-4">
      {deployments.map((deployment, index) => (
        <div
          key={index}
          className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
            selectedIndex === index
              ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-200'
              : 'bg-white border-gray-200 hover:bg-gray-50'
          }`}
          onClick={() => onSelect(index)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-2 h-2 rounded-full ${
                deployment.appName ? 'bg-green-500' : 'bg-gray-300'
              }`} />
              <div>
                <div className="font-medium text-gray-900">
                  {deployment.appName || 'Untitled Deployment'}
                </div>
                <div className="text-sm text-gray-500">
                  {deployment.image || 'No image specified'}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(index);
                  onEdit();
                }}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
              >
                <Settings className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                }}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
              >
                <Copy className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                }}
                className="p-1 text-gray-400 hover:text-red-600 rounded"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}