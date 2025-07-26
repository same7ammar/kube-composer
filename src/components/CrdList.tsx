import React, { useState } from 'react';
import { FileText, Trash2, Code, Copy, Calendar, Eye } from 'lucide-react';
import { CustomResourceDefinition } from '../types';
import { CrdSchemaViewer } from './CrdSchemaViewer';

// Simple Tooltip Component
interface TooltipProps {
  children: React.ReactNode;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

const Tooltip: React.FC<TooltipProps> = ({ children, content, position = 'top' }) => {
  const [isVisible, setIsVisible] = useState(false);

  const positionClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2'
  };

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div className={`absolute z-50 ${positionClasses[position]}`}>
          <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
            {content}
            <div className={`absolute w-0 h-0 border-4 border-transparent ${
              position === 'top' ? 'top-full left-1/2 transform -translate-x-1/2 border-t-gray-900' :
              position === 'bottom' ? 'bottom-full left-1/2 transform -translate-x-1/2 border-b-gray-900' :
              position === 'left' ? 'left-full top-1/2 transform -translate-y-1/2 border-l-gray-900' :
              'right-full top-1/2 transform -translate-y-1/2 border-r-gray-900'
            }`} />
          </div>
        </div>
      )}
    </div>
  );
};

interface CrdListProps {
  crds: CustomResourceDefinition[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  onDelete: (index: number) => void;
  onViewYaml: (crd: CustomResourceDefinition) => void;
  onCreateResource?: (crd: CustomResourceDefinition) => void;
}

/**
 * Component for displaying a list of imported CRDs
 */
export const CrdList: React.FC<CrdListProps> = ({
  crds,
  selectedIndex,
  onSelect,
  onDelete,
  onViewYaml,
  onCreateResource
}) => {
  const [viewSchemaFor, setViewSchemaFor] = useState<CustomResourceDefinition | null>(null);
  if (crds.length === 0) {
    return (
      <div className="p-6 text-center">
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-gray-400 dark:text-gray-500" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No Custom Resource Definitions</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Import your first CRD to get started with custom resources
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {crds.map((crd, index) => {
        // Find the storage version
        const storageVersion = crd.versions.find(v => v.storage) || crd.versions[0];
        
        return (
          <div
            key={crd.id}
            className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
              selectedIndex === index
                ? 'bg-purple-50 border-purple-200 ring-1 ring-purple-200 dark:bg-purple-900/20 dark:border-purple-700 dark:ring-purple-700'
                : 'bg-white border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-750'
            }`}
            onClick={() => onSelect(index)}
          >
            {/* Header Row */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2 flex-1 min-w-0">
                <FileText className="w-4 h-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm leading-tight">
                    {crd.name.split('.')[0]}
                  </h3>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center space-x-0.5 flex-shrink-0">
                <Tooltip content="View YAML" position="top">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewYaml(crd);
                    }}
                    className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                  >
                    <Code className="w-3.5 h-3.5" />
                  </button>
                </Tooltip>
                
                <Tooltip content="View Schema" position="top">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setViewSchemaFor(crd);
                    }}
                    className="p-1.5 text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                </Tooltip>
                
                <Tooltip content="Create Resource" position="top">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onCreateResource?.(crd);
                    }}
                    className="p-1.5 text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </Tooltip>
                
                <Tooltip content="Delete CRD" position="top">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(`Delete CRD: ${crd.name}?\n\nThis action cannot be undone.`)) {
                        onDelete(index);
                      }
                    }}
                    className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </Tooltip>
              </div>
            </div>
            
            {/* Details Row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 flex-1 min-w-0">
                {/* Group */}
                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {crd.group}
                </div>
                
                {/* Separator */}
                <span className="text-gray-300 dark:text-gray-600">•</span>
                
                {/* Version */}
                <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 rounded text-xs font-medium">
                  v{storageVersion.name}
                </span>
                
                {/* Scope */}
                <span className="px-1.5 py-0.5 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded text-xs font-medium">
                  {crd.scope}
                </span>
              </div>
              
              {/* Date */}
              <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                <Calendar className="w-3 h-3" />
                <span>{new Date(crd.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        );
      })}
      
      {/* Schema Viewer Modal */}
      {viewSchemaFor && (
        <CrdSchemaViewer 
          crd={viewSchemaFor}
          onClose={() => setViewSchemaFor(null)}
        />
      )}
      
    </div>
  );
};
