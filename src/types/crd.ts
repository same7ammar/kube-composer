/**
 * Types related to Kubernetes Custom Resource Definitions (CRDs) and Custom Resources (CRs)
 */

/**
 * Represents a JSON Schema property type for CRD validation
 */
export type SchemaPropertyType = 'string' | 'number' | 'integer' | 'boolean' | 'array' | 'object' | null;

/**
 * Represents a JSON Schema property in a CRD
 */
export interface SchemaProperty {
  type: SchemaPropertyType;
  description?: string;
  default?: any;
  required?: boolean;
  enum?: any[];
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  format?: string;
  properties?: Record<string, SchemaProperty>;
  items?: SchemaProperty; // For array types
  additionalProperties?: boolean | SchemaProperty; // For object types with dynamic keys
  example?: any;
}

/**
 * Represents the schema for a custom resource validation
 */
export interface JSONSchema {
  properties: Record<string, SchemaProperty>;
  required?: string[];
  description?: string;
  type?: string;
}

/**
 * Represents a version of a CRD
 */
export interface CRDVersion {
  name: string;
  served: boolean;
  storage: boolean;
  schema?: JSONSchema;
}

/**
 * Represents a Custom Resource Definition (CRD)
 */
export interface CustomResourceDefinition {
  id: string; // Unique identifier
  apiVersion: string;
  kind: string;
  name: string; // metadata.name
  group: string; // spec.group
  scope: 'Namespaced' | 'Cluster'; // spec.scope
  versions: CRDVersion[]; // spec.versions
  createdAt: string;
  rawYaml?: string; // Original imported YAML for reference
}

/**
 * Represents a Custom Resource (CR) instance based on a CRD
 */
export interface CustomResource {
  id: string; // Unique identifier
  crdId: string; // Reference to parent CRD
  name: string; // metadata.name
  namespace?: string; // metadata.namespace (if Namespaced scope)
  apiVersion: string;
  kind: string;
  spec: Record<string, any>; // Dynamic properties based on CRD schema
  createdAt: string;
}

/**
 * Simplified CRD information for display in UI
 */
export interface CRDSummary {
  id: string;
  name: string;
  group: string;
  kind: string;
  scope: string;
  version: string; // Current/storage version
  createdAt: string;
}
