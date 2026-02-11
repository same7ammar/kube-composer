export interface EnvVar {
  name: string; 
  value?: string;
  valueFrom?: {
    type: 'configMap' | 'secret';
    name: string;
    key: string;
  };
}

export interface Container {
  name: string;
  image: string;
  port?: number;
  env: EnvVar[];
  resources: {
    requests: { cpu: string; memory: string };
    limits: { cpu: string; memory: string };
  };
  volumeMounts: Array<{ name: string; mountPath: string }>;
  command?: string;
  args?: string;
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
  volumes: Array<{ name: string; mountPath: string; type: 'emptyDir' | 'configMap' | 'secret'; configMapName?: string; secretName?: string }>;
  configMaps: Array<{ name: string; data: Record<string, string> }>; // Legacy - for backward compatibility
  secrets: Array<{ name: string; data: Record<string, string> }>; // Legacy - for backward compatibility
  selectedConfigMaps: string[]; // References to ConfigMap names
  selectedSecrets: string[]; // References to Secret names
  serviceAccount?: string; // Reference to ServiceAccount name
  ingress: IngressConfig;
  // Legacy fields for backward compatibility
  image?: string;
  env?: Array<{ name: string; value: string }>;
  resources?: {
    requests: { cpu: string; memory: string };
    limits: { cpu: string; memory: string };
  };
}

export interface DaemonSetConfig {
  appName: string;
  containers: Container[];
  serviceEnabled: boolean;
  port: number;
  targetPort: number;
  serviceType: 'ClusterIP' | 'NodePort' | 'LoadBalancer';
  namespace: string;
  labels: Record<string, string>;
  annotations: Record<string, string>;
  volumes: Array<{ name: string; mountPath: string; type: 'emptyDir' | 'configMap' | 'secret'; configMapName?: string; secretName?: string }>;
  configMaps: Array<{ name: string; data: Record<string, string> }>; // Legacy - for backward compatibility
  secrets: Array<{ name: string; data: Record<string, string> }>; // Legacy - for backward compatibility
  selectedConfigMaps: string[]; // References to ConfigMap names
  selectedSecrets: string[]; // References to Secret names
  serviceAccount?: string; // Reference to ServiceAccount name
  nodeSelector?: Record<string, string>; // Optional node selector
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

export interface ServiceAccount {
  name: string;
  namespace: string;
  labels: Record<string, string>;
  annotations: Record<string, string>;
  secrets?: Array<{
    name: string;
  }>;
  imagePullSecrets?: Array<{
    name: string;
  }>;
  automountServiceAccountToken?: boolean;
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

export interface JobConfig {
  name: string;
  namespace: string;
  labels: Record<string, string>;
  annotations: Record<string, string>;
  containers: Container[];
  restartPolicy: 'Never' | 'OnFailure';
  completions?: number;
  parallelism?: number;
  backoffLimit?: number;
  activeDeadlineSeconds?: number;
  createdAt?: string;
}

export interface CronJobConfig {
  name: string;
  namespace: string;
  labels: Record<string, string>;
  annotations: Record<string, string>;
  schedule: string;
  concurrencyPolicy?: 'Allow' | 'Forbid' | 'Replace';
  startingDeadlineSeconds?: number;
  successfulJobsHistoryLimit?: number;
  failedJobsHistoryLimit?: number;
  jobTemplate: JobConfig;
  createdAt?: string;
}

export interface DockerHubSecret {
  name: string;
  namespace: string;
  dockerServer: string;
  username: string;
  password: string;
  email: string;
  description?: string;
  labels: Record<string, string>;
  annotations: Record<string, string>;
  createdAt: string;
}

// RBAC Types
export interface PolicyRule {
  apiGroups: string[];
  resources: string[];
  verbs: string[];
  resourceNames?: string[];
}

export interface KubernetesRole {
  apiVersion: 'rbac.authorization.k8s.io/v1';
  kind: 'Role';
  metadata: {
    name: string;
    namespace: string;
    labels?: Record<string, string>;
    annotations?: Record<string, string>;
  };
  rules: PolicyRule[];
}

export interface KubernetesClusterRole {
  apiVersion: 'rbac.authorization.k8s.io/v1';
  kind: 'ClusterRole';
  metadata: {
    name: string;
    labels?: Record<string, string>;
    annotations?: Record<string, string>;
  };
  rules: PolicyRule[];
}

export interface RoleFormData {
  metadata: {
    name: string;
    namespace: string;
    labels: Record<string, string>;
  };
  rules: PolicyRule[];
}

export interface ClusterRoleFormData {
  metadata: {
    name: string;
    labels: Record<string, string>;
  };
  rules: PolicyRule[];
}

// For future RoleBinding support
export interface KubernetesRoleBinding {
  apiVersion: 'rbac.authorization.k8s.io/v1';
  kind: 'RoleBinding';
  metadata: {
    name: string;
    namespace: string;
  };
  subjects: {
    kind: 'User' | 'Group' | 'ServiceAccount';
    name: string;
    namespace?: string;
  }[];
  roleRef: {
    kind: 'Role';
    name: string;
    apiGroup: 'rbac.authorization.k8s.io';
  };
}

// For future ClusterRoleBinding support
export interface KubernetesClusterRoleBinding {
  apiVersion: 'rbac.authorization.k8s.io/v1';
  kind: 'ClusterRoleBinding';
  metadata: {
    name: string;
  };
  subjects: {
    kind: 'User' | 'Group' | 'ServiceAccount';
    name: string;
    namespace?: string;
  }[];
  roleRef: {
    kind: 'ClusterRole';
    name: string;
    apiGroup: 'rbac.authorization.k8s.io';
  };
}

export interface Subject {
  kind: 'User' | 'Group' | 'ServiceAccount';
  name: string;
  namespace?: string; // Required only for ServiceAccount
  apiGroup?: string; // "rbac.authorization.k8s.io" for User/Group, empty for ServiceAccount
}

export interface RoleBinding {
  name: string;
  namespace?: string; // Optional for ClusterRoleBinding
  isClusterRoleBinding: boolean;
  roleRef: {
    apiGroup: string; // Always "rbac.authorization.k8s.io"
    kind: 'Role' | 'ClusterRole';
    name: string;
  };
  subjects: Subject[];
}

export type ThemeContextProps = {
    isDarkModeEnabled: boolean;
    toggleDarkModeHandler: () => void;
}

// Storage Types
export interface PersistentVolume {
  name: string;
  labels: Record<string, string>;
  annotations: Record<string, string>;
  capacity: string; // e.g., "10Gi"
  accessModes: Array<'ReadWriteOnce' | 'ReadOnlyMany' | 'ReadWriteMany'>;
  persistentVolumeReclaimPolicy: 'Retain' | 'Recycle' | 'Delete';
  storageClassName?: string;
  volumeMode: 'Filesystem' | 'Block';
  volumeSource: {
    type: 'hostPath' | 'nfs' | 'local' | 'csi';
    // hostPath configuration
    hostPath?: {
      path: string;
      type?: 'Directory' | 'DirectoryOrCreate' | 'File' | 'FileOrCreate';
    };
    // NFS configuration
    nfs?: {
      server: string;
      path: string;
      readOnly?: boolean;
    };
    // Local configuration
    local?: {
      path: string;
    };
    // CSI configuration
    csi?: {
      driver: string;
      volumeHandle: string;
      fsType?: string;
      volumeAttributes?: Record<string, string>;
    };
  };
  nodeAffinity?: {
    required?: {
      nodeSelectorTerms: Array<{
        matchExpressions: Array<{
          key: string;
          operator: 'In' | 'NotIn' | 'Exists' | 'DoesNotExist' | 'Gt' | 'Lt';
          values?: string[];
        }>;
      }>;
    };
  };
  createdAt: string;
}

export interface PersistentVolumeClaim {
  name: string;
  namespace: string;
  labels: Record<string, string>;
  annotations: Record<string, string>;
  accessModes: Array<'ReadWriteOnce' | 'ReadOnlyMany' | 'ReadWriteMany'>;
  storageRequest: string; // e.g., "5Gi"
  storageClassName?: string;
  volumeName?: string; // For binding to specific PV
  volumeMode?: 'Filesystem' | 'Block';
  selector?: {
    matchLabels?: Record<string, string>;
    matchExpressions?: Array<{
      key: string;
      operator: 'In' | 'NotIn' | 'Exists' | 'DoesNotExist';
      values?: string[];
    }>;
  };
  createdAt: string;
}

export interface StorageClass {
  name: string;
  labels: Record<string, string>;
  annotations: Record<string, string>;
  provisioner: string; // e.g., "kubernetes.io/aws-ebs", "kubernetes.io/gce-pd"
  parameters: Record<string, string>; // Provisioner-specific parameters
  reclaimPolicy: 'Retain' | 'Delete';
  volumeBindingMode: 'Immediate' | 'WaitForFirstConsumer';
  allowVolumeExpansion: boolean;
  mountOptions?: string[];
  allowedTopologies?: Array<{
    matchLabelExpressions: Array<{
      key: string;
      values: string[];
    }>;
  }>;
  createdAt: string;
}
