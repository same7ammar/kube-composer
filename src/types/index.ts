export interface EnvVar {
  name: string; 
  value?: string;
  valueFrom?: {
    type: 'configMap' | 'secret';
    name: string;
    key: string;
  };
}

export interface VolumeMount {
  name: string;
  mountPath: string;
  readOnly?: boolean;
  subPath?: string;
}

export interface Container {
  name: string;
  image: string;
  port: number;
  env: EnvVar[];
  resources: {
    requests: { cpu: string; memory: string };
    limits: { cpu: string; memory: string };
  };
  volumeMounts: VolumeMount[];
}

export interface IngressRule {
  host: string;
  path: string;
  pathType: 'Prefix' | 'Exact' | 'ImplementationSpecific';
  serviceName: string;
  servicePort: number;
}

export interface IngressConfig {
  enabled: boolean;
  className?: string;
  annotations: Record<string, string>;
  tls: Array<{
    secretName: string;
    hosts: string[];
  }>;
  rules: IngressRule[];
}

export interface ConfigMap {
  name: string;
  namespace: string;
  labels: Record<string, string>;
  annotations: Record<string, string>;
  data: Record<string, string>;
  createdAt: string;
}

export interface Secret {
  name: string;
  namespace: string;
  labels: Record<string, string>;
  annotations: Record<string, string>;
  type: 'Opaque' | 'kubernetes.io/tls' | 'kubernetes.io/dockerconfigjson';
  data: Record<string, string>;
  createdAt: string;
}

export interface ProjectSettings {
  name: string;
  description?: string;
  globalLabels: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

// New Volume Management Types
export type AccessMode = 'ReadWriteOnce' | 'ReadOnlyMany' | 'ReadWriteMany' | 'ReadWriteOncePod';
export type VolumeMode = 'Filesystem' | 'Block';
export type StorageVolumeType = 'emptyDir' | 'hostPath' | 'configMap' | 'secret' | 'persistentVolumeClaim';

export interface StorageVolume {
  name: string;
  namespace: string;
  type: StorageVolumeType;
  labels: Record<string, string>;
  annotations: Record<string, string>;
  spec: {
    // For emptyDir
    emptyDir?: {
      sizeLimit?: string;
      medium?: 'Memory' | '';
    };
    // For hostPath
    hostPath?: {
      path: string;
      type?: 'DirectoryOrCreate' | 'Directory' | 'FileOrCreate' | 'File' | 'Socket' | 'CharDevice' | 'BlockDevice';
    };
    // For configMap
    configMap?: {
      name: string;
      defaultMode?: number;
      optional?: boolean;
    };
    // For secret
    secret?: {
      secretName: string;
      defaultMode?: number;
      optional?: boolean;
    };
    // For PVC reference
    persistentVolumeClaim?: {
      claimName: string;
    };
  };
  capacity?: string;
  accessModes: AccessMode[];
  storageClass?: string;
  status: 'Available' | 'Bound' | 'Released' | 'Failed' | 'Pending';
  createdAt: string;
}

export interface PersistentVolumeClaim {
  name: string;
  namespace: string;
  labels: Record<string, string>;
  annotations: Record<string, string>;
  spec: {
    accessModes: AccessMode[];
    resources: {
      requests: {
        storage: string;
      };
    };
    storageClassName?: string;
    volumeMode?: VolumeMode;
    selector?: {
      matchLabels?: Record<string, string>;
      matchExpressions?: Array<{
        key: string;
        operator: 'In' | 'NotIn' | 'Exists' | 'DoesNotExist';
        values?: string[];
      }>;
    };
  };
  status: {
    phase: 'Pending' | 'Bound' | 'Lost';
    capacity?: {
      storage: string;
    };
    accessModes?: AccessMode[];
  };
  createdAt: string;
}

export interface DeploymentConfig {
  appName: string;
  containers: Container[];
  replicas: number;
  port: number;
  targetPort: number;
  serviceType: 'ClusterIP' | 'NodePort' | 'LoadBalancer';
  namespace: string;
  labels: Record<string, string>;
  annotations: Record<string, string>;
  volumes: Array<{ 
    name: string; 
    mountPath: string; 
    type: 'emptyDir' | 'configMap' | 'secret'; 
    configMapName?: string; 
    secretName?: string;
  }>; // Legacy volumes for backward compatibility
  configMaps: Array<{ name: string; data: Record<string, string> }>; // Legacy - for backward compatibility
  secrets: Array<{ name: string; data: Record<string, string> }>; // Legacy - for backward compatibility
  selectedConfigMaps: string[]; // References to ConfigMap names
  selectedSecrets: string[]; // References to Secret names
  selectedStorageVolumes: string[]; // References to StorageVolume names
  selectedPVCs: string[]; // References to PVC names
  ingress: IngressConfig;
  // Legacy fields for backward compatibility
  image?: string;
  env?: Array<{ name: string; value: string }>;
  resources?: {
    requests: { cpu: string; memory: string };
    limits: { cpu: string; memory: string };
  };
}

export interface Namespace {
  name: string;
  labels: Record<string, string>;
  annotations: Record<string, string>;
  createdAt: string;
}

export interface KubernetesResource {
  apiVersion: string;
  kind: string;
  metadata: {
    name: string;
    namespace?: string;
    labels?: Record<string, string>;
    annotations?: Record<string, string>;
  };
  spec?: any;
  data?: Record<string, string>;
  type?: string;
}