import { Server, CheckCircle, AlertCircle, Users, Settings, Key, Play, Clock } from 'lucide-react';
import type { DeploymentConfig, DaemonSetConfig, Namespace, ConfigMap, Secret, ServiceAccount, KubernetesRole, KubernetesClusterRole, PersistentVolume, PersistentVolumeClaim, StorageClass } from '../types';
import type { Job } from './JobManager';

interface ResourceSummaryProps {
  deployments: DeploymentConfig[];
  daemonSets: DaemonSetConfig[];
  namespaces: Namespace[];
  configMaps: ConfigMap[];
  secrets: Secret[];
  serviceAccounts: ServiceAccount[];
  roles: KubernetesRole[];
  clusterRoles: KubernetesClusterRole[];
  jobs: Job[];
  persistentVolumes: PersistentVolume[];
  persistentVolumeClaims: PersistentVolumeClaim[];
  storageClasses: StorageClass[];
}

export function ResourceSummary({ 
  deployments, 
  daemonSets, 
  namespaces, 
  configMaps, 
  secrets, 
  serviceAccounts,
  roles,
  clusterRoles,
  jobs,
  persistentVolumes,
  persistentVolumeClaims,
  storageClasses
}: ResourceSummaryProps) {
  const getTotalResourceCount = () => {
    let count = 0;
    
    // Deployments and their associated resources
    deployments.forEach(deployment => {
      if (deployment.appName) {
        count += 2; // Deployment + Service
        if (deployment.ingress?.enabled) count += 1; // Ingress
      }
    });
    
    // DaemonSets and their associated resources
    daemonSets.forEach(daemonSet => {
      if (daemonSet.appName) {
        count += 1; // DaemonSet
        if (daemonSet.serviceEnabled) count += 1; // Service
      }
    });
    
    // Other resources
    count += configMaps.length;
    count += secrets.length;
    count += serviceAccounts.length;
    count += namespaces.length;
    count += jobs.length;
    count += roles.length;
    count += clusterRoles.length;
    count += persistentVolumes.length;
    count += persistentVolumeClaims.length;
    count += storageClasses.length;
    
    return count;
  };

  const getValidationStatus = () => {
    const issues: string[] = [];
    
    // Check deployments
    deployments.forEach((deployment, index) => {
      if (!deployment.appName) issues.push(`Deployment ${index + 1}: Application name is required`);
      
      if (!deployment.containers || deployment.containers.length === 0) {
        issues.push(`Deployment ${index + 1}: At least one container is required`);
      } else {
        deployment.containers.forEach((container, containerIndex) => {
          if (!container.name) issues.push(`Deployment ${index + 1}, Container ${containerIndex + 1}: Name is required`);
          if (!container.image) issues.push(`Deployment ${index + 1}, Container ${containerIndex + 1}: Image is required`);
        });
      }
      
      if (deployment.port <= 0) issues.push(`Deployment ${index + 1}: Service port must be greater than 0`);
      if (deployment.targetPort <= 0) issues.push(`Deployment ${index + 1}: Target port must be greater than 0`);
      if (deployment.replicas <= 0) issues.push(`Deployment ${index + 1}: Replicas must be greater than 0`);
    });
    
    // Check daemonSets
    daemonSets.forEach((daemonSet, index) => {
      if (!daemonSet.appName) issues.push(`DaemonSet ${index + 1}: Application name is required`);
      
      if (!daemonSet.containers || daemonSet.containers.length === 0) {
        issues.push(`DaemonSet ${index + 1}: At least one container is required`);
      } else {
        daemonSet.containers.forEach((container, containerIndex) => {
          if (!container.name) issues.push(`DaemonSet ${index + 1}, Container ${containerIndex + 1}: Name is required`);
          if (!container.image) issues.push(`DaemonSet ${index + 1}, Container ${containerIndex + 1}: Image is required`);
        });
      }
    });
    
    // Check service accounts
    serviceAccounts.forEach((serviceAccount, index) => {
      if (!serviceAccount.name) issues.push(`Service Account ${index + 1}: Name is required`);
      if (!serviceAccount.namespace) issues.push(`Service Account ${index + 1}: Namespace is required`);
    });
    
    // Check jobs
    jobs.forEach((job, index) => {
      if (!job.name) issues.push(`Job ${index + 1}: Name is required`);
      if (!job.namespace) issues.push(`Job ${index + 1}: Namespace is required`);
      if (!job.containers || job.containers.length === 0) {
        issues.push(`Job ${index + 1}: At least one container is required`);
      } else {
        job.containers.forEach((container, containerIndex) => {
          if (!container.name) issues.push(`Job ${index + 1}, Container ${containerIndex + 1}: Name is required`);
          if (!container.image) issues.push(`Job ${index + 1}, Container ${containerIndex + 1}: Image is required`);
        });
      }
    });
    
    // Check roles
    roles.forEach((role, index) => {
      if (!role.metadata.name) issues.push(`Role ${index + 1}: Name is required`);
      if (!role.metadata.namespace) issues.push(`Role ${index + 1}: Namespace is required`);
      if (!role.rules || role.rules.length === 0) {
        issues.push(`Role ${index + 1}: At least one rule is required`);
      } else {
        role.rules.forEach((rule, ruleIndex) => {
          if (!rule.resources || rule.resources.length === 0) {
            issues.push(`Role ${index + 1}, Rule ${ruleIndex + 1}: Resources are required`);
          }
          if (!rule.verbs || rule.verbs.length === 0) {
            issues.push(`Role ${index + 1}, Rule ${ruleIndex + 1}: Verbs are required`);
          }
        });
      }
    });
    
    // Check cluster roles
    clusterRoles.forEach((clusterRole, index) => {
      if (!clusterRole.metadata.name) issues.push(`ClusterRole ${index + 1}: Name is required`);
      if (!clusterRole.rules || clusterRole.rules.length === 0) {
        issues.push(`ClusterRole ${index + 1}: At least one rule is required`);
      } else {
        clusterRole.rules.forEach((rule, ruleIndex) => {
          if (!rule.resources || rule.resources.length === 0) {
            issues.push(`ClusterRole ${index + 1}, Rule ${ruleIndex + 1}: Resources are required`);
          }
          if (!rule.verbs || rule.verbs.length === 0) {
            issues.push(`ClusterRole ${index + 1}, Rule ${ruleIndex + 1}: Verbs are required`);
          }
        });
      }
    });
    
    return {
      isValid: issues.length === 0,
      issues
    };
  };

  const validation = getValidationStatus();
  const totalResources = getTotalResourceCount();
  const validDeployments = deployments.filter(d => d.appName);
  const validDaemonSets = daemonSets.filter(d => d.appName);
  const validServiceAccounts = serviceAccounts.filter(sa => sa.name);
  const validJobs = jobs.filter(job => job.name);
  const validRoles = roles.filter(role => role.metadata.name);
  const validClusterRoles = clusterRoles.filter(clusterRole => clusterRole.metadata.name);

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Resource Summary</h3>
      
      {/* Validation Status */}
      <div className={`p-4 rounded-lg border ${
        validation.isValid 
          ? 'bg-green-50 dark:bg-green-900 border-green-200 dark:border-green-700 text-green-800 dark:text-green-100' 
          : 'bg-red-50 dark:bg-red-900 border-red-200 dark:border-red-700 text-red-800 dark:text-red-100'
      }`}>
        <div className="flex items-center space-x-2 mb-2">
          {validation.isValid ? (
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
          )}
          <span className={`font-medium ${
            validation.isValid ? 'text-green-900 dark:text-green-100' : 'text-red-900 dark:text-red-100'
          }`}>
            {validation.isValid ? 'Configuration Valid' : 'Configuration Issues'}
          </span>
        </div>
        {!validation.isValid && (
          <ul className="text-sm dark:text-red-300 space-y-1">
            {validation.issues.map((issue, index) => (
              <li key={index}>• {issue}</li>
            ))}
          </ul>
        )}
      </div>

      {/* Resource Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Workloads */}
        <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg border border-blue-200 dark:border-blue-700 text-blue-800 dark:text-blue-100">
          <div className="flex items-center space-x-2 mb-2">
            <Server className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span className="font-medium text-blue-900 dark:text-blue-100">Workloads</span>
          </div>
          <div className="text-sm text-blue-700 space-y-1 dark:text-blue-300">
            <div>Deployments: {validDeployments.length}</div>
            <div>DaemonSets: {validDaemonSets.length}</div>
            <div>Jobs: {validJobs.length}</div>
            <div>Total Containers: {validDeployments.reduce((sum, d) => sum + (d.containers?.length || 0), 0) + validDaemonSets.reduce((sum, d) => sum + (d.containers?.length || 0), 0) + validJobs.reduce((sum, job) => sum + (job.containers?.length || 0), 0)}</div>
          </div>
        </div>

        {/* Security */}
        <div className="bg-cyan-50 dark:bg-cyan-900 p-4 rounded-lg border border-cyan-200 dark:border-cyan-700 text-cyan-800 dark:text-cyan-100">
          <div className="flex items-center space-x-2 mb-2">
            <Users className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            <span className="font-medium text-cyan-900 dark:text-cyan-100">Security</span>
          </div>
          <div className="text-sm text-cyan-700 space-y-1 dark:text-cyan-300">
            <div>Service Accounts: {validServiceAccounts.length}</div>
            <div>Roles: {validRoles.length}</div>
            <div>ClusterRoles: {validClusterRoles.length}</div>
            <div>Secrets: {secrets.length}</div>
            <div>Total Secrets: {validServiceAccounts.reduce((sum, sa) => sum + (sa.secrets?.length || 0) + (sa.imagePullSecrets?.length || 0), 0)}</div>
          </div>
        </div>

        {/* Storage */}
        <div className="bg-green-50 dark:bg-green-900 p-4 rounded-lg border border-green-200 dark:border-green-700 text-green-800 dark:text-green-100">
          <div className="flex items-center space-x-2 mb-2">
            <Settings className="w-5 h-5 text-green-600 dark:text-green-400" />
            <span className="font-medium text-green-900 dark:text-green-100">Storage</span>
          </div>
          <div className="text-sm text-green-700 space-y-1 dark:text-green-300">
            <div>ConfigMaps: {configMaps.length}</div>
            <div>PersistentVolumes: {persistentVolumes.length}</div>
            <div>PersistentVolumeClaims: {persistentVolumeClaims.length}</div>
            <div>StorageClasses: {storageClasses.length}</div>
            <div>Namespaces: {namespaces.length}</div>
          </div>
        </div>
      </div>

      {/* Jobs Summary */}
      {validJobs.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 dark:text-gray-100">Jobs & CronJobs</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {validJobs.map((job, index) => (
              <div key={index} className={`p-4 rounded-lg border ${
                job.type === 'cronjob' ? 'bg-purple-50 dark:bg-purple-900 border-purple-200 dark:border-purple-700 text-purple-800 dark:text-purple-100' : 'bg-orange-50 dark:bg-orange-900 border-orange-200 dark:border-orange-700 text-orange-800 dark:text-orange-100'
              }`}>
                <div className="flex items-center space-x-2 mb-2">
                  {job.type === 'cronjob' ? (
                    <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  ) : (
                    <Play className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  )}
                  <span className={`font-medium ${
                    job.type === 'cronjob' ? 'text-purple-900 dark:text-purple-100' : 'text-orange-900 dark:text-orange-100'
                  }`}>{job.name}</span>
                </div>
                <div className={`text-sm space-y-1 ${
                  job.type === 'cronjob' ? 'text-purple-700 dark:text-purple-300' : 'text-orange-700 dark:text-orange-300'
                }`}>
                  <div>Type: {job.type === 'cronjob' ? 'CronJob' : 'Job'}</div>
                  <div>Namespace: {job.namespace}</div>
                  <div>Containers: {job.containers?.length || 0}</div>
                  {job.type === 'cronjob' && job.schedule && (
                    <div>Schedule: {job.schedule}</div>
                  )}
                  {job.completions && (
                    <div>Completions: {job.completions}</div>
                  )}
                  {job.replicas && (
                    <div>Parallelism: {job.replicas}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Roles Summary */}
      {validRoles.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 dark:text-gray-100">Roles</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {validRoles.map((role, index) => (
              <div key={index} className="bg-purple-50 dark:bg-purple-900 p-4 rounded-lg border border-purple-200 dark:border-purple-700 text-purple-800 dark:text-purple-100">
                <div className="flex items-center space-x-2 mb-2">
                  <Key className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <span className="font-medium text-purple-900 dark:text-purple-100">{role.metadata.name}</span>
                </div>
                <div className="text-sm text-purple-700 space-y-1 dark:text-purple-300">
                  <div>Namespace: {role.metadata.namespace}</div>
                  <div>Rules: {role.rules?.length || 0}</div>
                  <div>API Groups: {Array.from(new Set(role.rules?.flatMap(r => r.apiGroups || []).map(g => g || 'core') || [])).length}</div>
                  <div>Resources: {Array.from(new Set(role.rules?.flatMap(r => r.resources || []) || [])).length}</div>
                  <div>Verbs: {Array.from(new Set(role.rules?.flatMap(r => r.verbs || []) || [])).length}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ClusterRoles Summary */}
      {validClusterRoles.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 dark:text-gray-100">ClusterRoles</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {validClusterRoles.map((clusterRole, index) => (
              <div key={index} className="bg-teal-50 dark:bg-teal-900 p-4 rounded-lg border border-teal-200 dark:border-teal-700 text-teal-800 dark:text-teal-100">
                <div className="flex items-center space-x-2 mb-2">
                  <Key className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                  <span className="font-medium text-teal-900 dark:text-teal-100">{clusterRole.metadata.name}</span>
                </div>
                <div className="text-sm text-teal-700 space-y-1 dark:text-teal-300">
                  <div>Scope: Cluster-wide</div>
                  <div>Rules: {clusterRole.rules?.length || 0}</div>
                  <div>API Groups: {Array.from(new Set(clusterRole.rules?.flatMap(r => r.apiGroups || []).map(g => g || 'core') || [])).length}</div>
                  <div>Resources: {Array.from(new Set(clusterRole.rules?.flatMap(r => r.resources || []) || [])).length}</div>
                  <div>Verbs: {Array.from(new Set(clusterRole.rules?.flatMap(r => r.verbs || []) || [])).length}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DaemonSets Summary */}
      {validDaemonSets.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 dark:text-gray-100">DaemonSets</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {validDaemonSets.map((daemonSet, index) => (
              <div key={index} className="bg-indigo-50 dark:bg-indigo-900 p-4 rounded-lg border border-indigo-200 dark:border-indigo-700 text-indigo-800 dark:text-indigo-100">
                <div className="flex items-center space-x-2 mb-2">
                  <Server className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <span className="font-medium text-indigo-900 dark:text-indigo-100">{daemonSet.appName}</span>
                </div>
                <div className="text-sm text-indigo-700 space-y-1 dark:text-indigo-300">
                  <div>Namespace: {daemonSet.namespace}</div>
                  <div>Containers: {daemonSet.containers?.length || 0}</div>
                  <div>Port: {daemonSet.port} → {daemonSet.targetPort}</div>
                  <div>Service: {daemonSet.serviceEnabled ? 'Enabled' : 'Disabled'}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ConfigMaps Summary */}
      {configMaps.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 dark:text-gray-100">ConfigMaps</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {configMaps.map((configMap, index) => (
              <div key={index} className="bg-green-50 dark:bg-green-900 p-4 rounded-lg border border-green-200 dark:border-green-700 text-green-800 dark:text-green-100">
                <div className="flex items-center space-x-2 mb-2">
                  <Settings className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <span className="font-medium text-green-900 dark:text-green-100">{configMap.name}</span>
                </div>
                <div className="text-sm text-green-700 space-y-1 dark:text-green-300">
                  <div>Namespace: {configMap.namespace}</div>
                  <div>Data Keys: {Object.keys(configMap.data).length}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Secrets Summary */}
      {secrets.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 dark:text-gray-100">Secrets</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {secrets.map((secret, index) => (
              <div key={index} className="bg-red-50 dark:bg-red-900 p-4 rounded-lg border border-red-200 dark:border-red-700 text-red-800 dark:text-red-100">
                <div className="flex items-center space-x-2 mb-2">
                  <Key className="w-5 h-5 text-red-600 dark:text-red-400" />
                  <span className="font-medium text-red-900 dark:text-red-100">{secret.name}</span>
                </div>
                <div className="text-sm text-red-700 space-y-1 dark:text-red-300">
                  <div>Namespace: {secret.namespace}</div>
                  <div>Data Keys: {Object.keys(secret.data).length}</div>
                  <div>Type: {secret.type}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Total Resources */}
      <div className="bg-indigo-50 dark:bg-indigo-900 p-4 rounded-lg border border-indigo-200 dark:border-indigo-700 text-indigo-800 dark:text-indigo-100">
        <div className="flex items-center justify-between">
          <span className="font-medium text-indigo-900 dark:text-indigo-100">Total Kubernetes Resources</span>
          <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{totalResources}</span>
        </div>
        <div className="text-sm text-indigo-700 mt-1 dark:text-indigo-300">
          Resources that will be created in your cluster
        </div>
      </div>
    </div>
  );
}