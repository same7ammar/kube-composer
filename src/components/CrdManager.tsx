import React, { useState, useRef } from 'react';
import { X, Upload, AlertCircle, CheckCircle } from 'lucide-react';
import { CustomResourceDefinition, CRDSummary } from '../types';
import { parseYaml } from '../utils/yamlParser';

  // Removed since we're using a simple textarea now

// Simple YAML syntax highlighter without line numbers (for display purposes)
const highlightYamlSimple = (code: string): React.ReactNode => {
  if (!code) return null;

  const lines = code.split('\n');
  
  return (
    <div className="font-mono text-sm">
      {lines.map((line, index) => {
        return (
          <div key={index} className="leading-6">
            <span className="whitespace-pre">
              {line || ' '}
            </span>
          </div>
        );
      })}
    </div>
  );
};

interface CrdManagerProps {
  onAddCrd: (crd: CustomResourceDefinition) => void;
  onClose: () => void;
}

/**
 * Component for importing and managing CRDs
 */
export const CrdManager: React.FC<CrdManagerProps> = ({ onAddCrd, onClose }) => {
  const [yamlContent, setYamlContent] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<CRDSummary | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // No longer needed since we removed the overlay system

  /**
   * Validates and processes imported CRD YAML
   * @returns true if valid, false otherwise
   */
  const processCrd = (): boolean => {
    if (!yamlContent.trim()) {
      setError('Please enter or upload a CRD YAML');
      return false;
    }

    try {
      // Parse YAML to object
      const crdObj = parseYaml(yamlContent);
      
      // Validate basic CRD structure
      if (!crdObj.apiVersion || !crdObj.kind) {
        setError('Invalid YAML: Missing apiVersion or kind');
        return false;
      }

      if (crdObj.kind !== 'CustomResourceDefinition') {
        setError('The provided YAML is not a CustomResourceDefinition');
        return false;
      }

      if (!crdObj.metadata?.name || !crdObj.spec?.group) {
        setError('Invalid CRD: Missing required fields (metadata.name or spec.group)');
        return false;
      }

      // Check for versions
      if (!crdObj.spec.versions || !Array.isArray(crdObj.spec.versions) || crdObj.spec.versions.length === 0) {
        setError('Invalid CRD: Missing or empty spec.versions array');
        return false;
      }

      // Get the storage version (the one with storage: true)
      const storageVersion = crdObj.spec.versions.find((v: any) => v.storage === true);
      if (!storageVersion) {
        setError('Invalid CRD: No storage version found in spec.versions');
        return false;
      }

      // Note: Schema is available in storageVersion.schema?.openAPIV3Schema for v1
      // or in crdObj.spec.validation?.openAPIV3Schema for v1beta1
      // We extract it when processing the versions array

      // Create the CRD object
      const crd: CustomResourceDefinition = {
        id: `${Date.now()}`,
        apiVersion: crdObj.apiVersion,
        kind: crdObj.kind,
        name: crdObj.metadata.name,
        group: crdObj.spec.group,
        scope: crdObj.spec.scope || 'Namespaced',
        versions: crdObj.spec.versions.map((v: any) => ({
          name: v.name,
          served: v.served,
          storage: v.storage,
          schema: v.schema?.openAPIV3Schema || null
        })),
        createdAt: new Date().toISOString(),
        rawYaml: yamlContent
      };

      // Create a summary for success message
      const summary: CRDSummary = {
        id: crd.id,
        name: crd.name,
        group: crd.group,
        kind: crdObj.spec.names.kind,
        scope: crd.scope,
        version: storageVersion.name,
        createdAt: crd.createdAt
      };

      // Add the CRD
      onAddCrd(crd);
      
      // Show success message
      setSuccess(summary);
      setError(null);
      return true;
    } catch (err) {
      console.error('Error parsing CRD:', err);
      setError(`Error parsing CRD: ${err instanceof Error ? err.message : 'Invalid YAML'}`);
      return false;
    }
  };

  /**
   * Handles file uploads
   */
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setYamlContent(content);
      setError(null);
      setSuccess(null);
    };
    reader.onerror = () => {
      setError('Error reading the file');
    };
    reader.readAsText(file);
  };

  /**
   * Handles form submission
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (processCrd()) {
      // Clear the form after successful submission
      setTimeout(() => {
        setYamlContent('');
        setSuccess(null);
      }, 2000);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Import Custom Resource Definition</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-grow">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md flex items-start">
              <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-green-700 font-medium">CRD imported successfully!</p>
                <p className="text-green-600 text-sm mt-1">
                  Name: <span className="font-mono">{success.name}</span>
                </p>
                <p className="text-green-600 text-sm">
                  Kind: <span className="font-mono">{success.kind}</span>
                </p>
                <p className="text-green-600 text-sm">
                  Group: <span className="font-mono">{success.group}</span>
                </p>
                <p className="text-green-600 text-sm">
                  Version: <span className="font-mono">{success.version}</span>
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="yaml-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Paste CRD YAML
              </label>
              <textarea
                ref={textareaRef}
                id="yaml-input"
                className="w-full h-64 p-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-mono text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                value={yamlContent}
                onChange={(e) => {
                  setYamlContent(e.target.value);
                  setError(null);
                  setSuccess(null);
                }}
                placeholder="# Paste your CustomResourceDefinition YAML here..."
                spellCheck="false"
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
              <div className="flex-1">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Or upload a CRD YAML file:
                </p>
                <div className="flex items-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".yaml,.yml"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload YAML
                  </button>
                  {/* Display file name when uploaded */}
                  {fileInputRef.current?.files?.[0]?.name && (
                    <span className="ml-3 text-sm text-gray-500 dark:text-gray-400">
                      {fileInputRef.current.files[0].name}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <a
                  href="https://kubernetes.io/docs/tasks/extend-kubernetes/custom-resources/custom-resource-definitions/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center"
                >
                  Learn about CRDs
                  <svg className="w-3.5 h-3.5 ml-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z"></path>
                    <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z"></path>
                  </svg>
                </a>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Example CRD</h3>
              <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-md overflow-auto shadow-inner border border-gray-200 dark:border-gray-700">
                {highlightYamlSimple(`apiVersion: apiextensions.k8s.io/v1
kind: CustomResourceDefinition
metadata:
  name: crontabs.stable.example.com
spec:
  group: stable.example.com
  versions:
    - name: v1
      served: true
      storage: true
      schema:
        openAPIV3Schema:
          type: object
          properties:
            spec:
              type: object
              properties:
                cronSpec:
                  type: string
                image:
                  type: string
                replicas:
                  type: integer
  scope: Namespaced
  names:
    plural: crontabs
    singular: crontab
    kind: CronTab
    shortNames:
    - ct`)}
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600 rounded-b-lg">
          <div className="flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Import CRD
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
