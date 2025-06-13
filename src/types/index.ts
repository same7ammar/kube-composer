export interface Container {
  name: string;
  image: string;
  port: number;
  env: Array<{ name: string; value: string }>;
  resources: {
    requests: { cpu: string; memory: string };
    limits: { cpu: string; memory: string };
  };
  volumeMounts: Array<{ name: string; mountPath: string }>;
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
  volumes: Array<{ name: string; mountPath: string; type: 'emptyDir' | 'configMap' | 'secret' }>;
  configMaps: Array<{ name: string; data: Record<string, string> }>;
  secrets: Array<{ name: string; data: Record<string, string> }>;
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