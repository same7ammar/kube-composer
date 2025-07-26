import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, ChevronRight, X, ExternalLink, Info } from 'lucide-react';
import { CustomResourceDefinition } from '../types';

interface CrdSchemaViewerProps {
  crd: CustomResourceDefinition;
  onClose: () => void;
}

interface SchemaNodeProps {
  name: string;
  schema: any;
  path: string;
  depth: number;
  isLast: boolean;
}

/**
 * Component to visualize a CRD schema in an interactive way
 */
export const CrdSchemaViewer: React.FC<CrdSchemaViewerProps> = ({ crd, onClose }) => {
  // Find the storage version (the one with storage: true)
  const storageVersion = crd.versions.find(v => v.storage) || crd.versions[0];
  
  // The schema is in the storage version
  const schema = storageVersion.schema;
  
  // Track which nodes are expanded
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['root']));
  
  // Toggle node expansion
  const toggleNode = (path: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedNodes(newExpanded);
  };

  /**
   * Recursively render schema objects
   */
  const SchemaNode: React.FC<SchemaNodeProps> = ({ name, schema, path, depth, isLast }) => {
    // If this is not an object or an array, render as a leaf node
    if (!schema || typeof schema !== 'object' || schema.type === 'string' || 
        schema.type === 'number' || schema.type === 'integer' || 
        schema.type === 'boolean' || schema.type === 'null') {
      
      return (
        <div className="flex items-start space-x-2 py-1">
          <div className="w-5"></div>
          <div className={`flex-1 border-l-2 ${isLast ? '' : 'border-dashed'} ${getTypeColor(schema?.type).border} pl-3 -ml-1`}>
            <div className="flex items-center">
              <span className="font-medium text-gray-800 dark:text-gray-200">{name}</span>
              <span className={`ml-2 px-2 py-0.5 rounded-md text-xs font-medium ${getTypeColor(schema?.type).bg} ${getTypeColor(schema?.type).text}`}>
                {schema?.type || 'unknown'}
              </span>
              {schema?.description && (
                <div className="ml-2 group relative">
                  <Info className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  <div className="hidden group-hover:block absolute z-10 bottom-full left-1/2 transform -translate-x-1/2 w-64 p-2 bg-gray-800 dark:bg-gray-700 text-white dark:text-gray-100 text-xs rounded-md shadow-md">
                    {schema.description}
                  </div>
                </div>
              )}
            </div>
            {schema?.default !== undefined && (
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Default: <span className="font-mono">{JSON.stringify(schema.default)}</span>
              </div>
            )}
          </div>
        </div>
      );
    }
    
    // For objects and arrays
    const isExpanded = expandedNodes.has(path);
    
    // Check if this is an object with properties or array with items
    const hasChildren = schema.properties || schema.items || schema.additionalProperties;
    
    // Get the properties to iterate through
    let properties: [string, any][] = [];
    if (schema.properties) {
      properties = Object.entries(schema.properties);
    } else if (schema.items) {
      properties = [['items', schema.items]];
    }
    
    return (
      <div className="flex flex-col">
        <div className="flex items-start space-x-2 py-1">
          <button 
            className="w-5 h-5 flex items-center justify-center text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100 focus:outline-none"
            onClick={() => hasChildren && toggleNode(path)}
            disabled={!hasChildren}
          >
            {hasChildren ? (
              isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
            ) : <div className="w-4 h-4"></div>}
          </button>
          <div className={`flex-1 border-l-2 ${isLast ? '' : 'border-dashed'} ${getTypeColor(schema.type).border} pl-3 -ml-1`}>
            <div className="flex items-center">
              <span className="font-medium text-gray-800 dark:text-gray-200">{name}</span>
              <span className={`ml-2 px-2 py-0.5 rounded-md text-xs font-medium ${getTypeColor(schema.type).bg} ${getTypeColor(schema.type).text}`}>
                {schema.type}
              </span>
              {schema.description && (
                <div className="ml-2 group relative">
                  <Info className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  <div className="hidden group-hover:block absolute z-10 bottom-full left-1/2 transform -translate-x-1/2 w-64 p-2 bg-gray-800 dark:bg-gray-700 text-white dark:text-gray-100 text-xs rounded-md shadow-md">
                    {schema.description}
                  </div>
                </div>
              )}
              {schema.required && schema.required.length > 0 && (
                <span className="ml-2 text-xs text-red-500">required</span>
              )}
            </div>
            {schema.required && schema.required.length > 0 && (
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Required fields: <span className="font-mono">{schema.required.join(', ')}</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Render children if expanded */}
        {isExpanded && hasChildren && (
          <div className="ml-8">
            {properties.map(([key, value], index) => (
              <SchemaNode
                key={key}
                name={key}
                schema={value}
                path={`${path}.${key}`}
                depth={depth + 1}
                isLast={index === properties.length - 1}
              />
            ))}
            {schema.additionalProperties && (
              <SchemaNode
                name="additionalProperties"
                schema={schema.additionalProperties === true ? { type: 'any' } : schema.additionalProperties}
                path={`${path}.additionalProperties`}
                depth={depth + 1}
                isLast={true}
              />
            )}
          </div>
        )}
      </div>
    );
  };

  /**
   * Get color scheme for different types
   */
  const getTypeColor = (type: string = '') => {
    switch (type) {
      case 'object':
        return {
          bg: 'bg-blue-100 dark:bg-blue-900/40',
          text: 'text-blue-700 dark:text-blue-300',
          border: 'border-blue-300 dark:border-blue-700'
        };
      case 'array':
        return {
          bg: 'bg-purple-100 dark:bg-purple-900/40',
          text: 'text-purple-700 dark:text-purple-300',
          border: 'border-purple-300 dark:border-purple-700'
        };
      case 'string':
        return {
          bg: 'bg-green-100 dark:bg-green-900/40',
          text: 'text-green-700 dark:text-green-300',
          border: 'border-green-300 dark:border-green-700'
        };
      case 'number':
      case 'integer':
        return {
          bg: 'bg-orange-100 dark:bg-orange-900/40',
          text: 'text-orange-700 dark:text-orange-300',
          border: 'border-orange-300 dark:border-orange-700'
        };
      case 'boolean':
        return {
          bg: 'bg-red-100 dark:bg-red-900/40',
          text: 'text-red-700 dark:text-red-300',
          border: 'border-red-300 dark:border-red-700'
        };
      default:
        return {
          bg: 'bg-gray-100 dark:bg-gray-800',
          text: 'text-gray-700 dark:text-gray-300',
          border: 'border-gray-300 dark:border-gray-700'
        };
    }
  };

  // Create a portal element for the modal
  const [modalRoot, setModalRoot] = useState<HTMLElement | null>(null);
  
  useEffect(() => {
    // Find the modal root element or create it if it doesn't exist
    let root = document.getElementById('modal-root');
    if (!root) {
      root = document.createElement('div');
      root.id = 'modal-root';
      document.body.appendChild(root);
    }
    setModalRoot(root);
    
    // Prevent scrolling on the body when modal is open
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = '';
    };
  }, []);
  
  if (!modalRoot) {
    return null;
  }
  
  const modalContent = (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
              CRD Schema: {crd.name.split('.')[0]}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Group: <span className="font-mono">{crd.group}</span> | 
              Version: <span className="font-mono">{storageVersion.name}</span> | 
              Kind: <span className="font-mono">{crd.name.split('.')[0]}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Schema Tree View */}
        <div className="p-4 overflow-y-auto flex-grow">
          {schema ? (
            <>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">Schema Structure</h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      // Expand all nodes
                      const allPaths = getAllPaths(schema);
                      const newExpanded = new Set(['root', ...allPaths]);
                      setExpandedNodes(newExpanded);
                    }}
                    className="px-3 py-1 text-xs font-medium text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md"
                  >
                    Expand All
                  </button>
                  <button
                    onClick={() => {
                      // Collapse all nodes except root
                      setExpandedNodes(new Set(['root']));
                    }}
                    className="px-3 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md"
                  >
                    Collapse All
                  </button>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 shadow-inner border border-gray-200 dark:border-gray-700">
                <SchemaNode 
                  name="root" 
                  schema={schema} 
                  path="root" 
                  depth={0} 
                  isLast={true} 
                />
              </div>
            </>
          ) : (
            <div className="text-center p-8">
              <p className="text-gray-500 dark:text-gray-400">
                No schema available for this CRD. The CRD might be using an older version format or doesn't define a schema.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600 rounded-b-lg">
          <div className="flex justify-between">
            <a 
              href={`https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.25/#${crd.name.toLowerCase().replace(/\./g, '-')}-${crd.group.replace(/\./g, '-')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center"
            >
              Kubernetes Documentation
              <ExternalLink className="ml-1 w-3.5 h-3.5" />
            </a>
            
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
  
  return createPortal(modalContent, modalRoot);
};

/**
 * Helper function to get all paths in a schema
 */
const getAllPaths = (schema: any, path = 'root'): string[] => {
  if (!schema || typeof schema !== 'object') return [];
  
  let paths: string[] = [];
  
  // If schema has properties
  if (schema.properties) {
    Object.entries(schema.properties).forEach(([key, value]) => {
      const newPath = `${path}.${key}`;
      paths.push(newPath);
      paths = [...paths, ...getAllPaths(value, newPath)];
    });
  }
  
  // If schema has items (for arrays)
  if (schema.items) {
    const newPath = `${path}.items`;
    paths.push(newPath);
    paths = [...paths, ...getAllPaths(schema.items, newPath)];
  }
  
  // If schema has additionalProperties
  if (schema.additionalProperties && typeof schema.additionalProperties === 'object') {
    const newPath = `${path}.additionalProperties`;
    paths.push(newPath);
    paths = [...paths, ...getAllPaths(schema.additionalProperties, newPath)];
  }
  
  return paths;
};
