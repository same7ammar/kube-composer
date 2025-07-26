import React, { useState, useMemo } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  RotateCcw, 
  Server, 
  Database, 
  Settings, 
  Key, 
  Globe, 
  Network, 
  HardDrive,
  Users,
  Info,
  ExternalLink,
  GitBranch,
  GitCommit,
  X,
  Play,
  Link2
} from 'lucide-react';
import type { DeploymentConfig, DaemonSetConfig, Namespace, ConfigMap, Secret, ServiceAccount, KubernetesRole, KubernetesClusterRole, RoleBinding, CustomResource, CustomResourceDefinition } from '../types';
import type { Job } from './JobManager';
import { generateKubernetesYaml, generateDaemonSetYaml, generateConfigMapYaml, generateSecretYaml, generateNamespaceYaml, generateServiceAccountYaml, generateJobYaml, generateCronJobYaml, generateRoleYaml, generateClusterRoleYaml } from '../utils/yamlGenerator';
import { YamlPreview } from './YamlPreview';

interface VisualPreviewProps {
  deployments: DeploymentConfig[];
  daemonSets: DaemonSetConfig[];
  namespaces: Namespace[];
  configMaps: ConfigMap[];
  secrets: Secret[];
  serviceAccounts: ServiceAccount[];
  roles: KubernetesRole[];
  clusterRoles: KubernetesClusterRole[];
  jobs: Job[];
  roleBindings: RoleBinding[];
  customResources?: CustomResource[];
  crds?: CustomResourceDefinition[];
  containerRef?: React.RefObject<HTMLDivElement>;
  filterType?: 'all' | 'deployments' | 'daemonsets' | 'namespaces' | 'configmaps' | 'secrets' | 'serviceaccounts' | 'roles' | 'clusterroles' | 'rolebindings' | 'jobs' | 'cronjobs' | 'crds';
}

interface FlowNode {
  id: string;
  name: string;
  type: 'deployment' | 'daemonset' | 'service' | 'pod' | 'configmap' | 'secret' | 'ingress' | 'namespace' | 'external' | 'serviceaccount' | 'role' | 'job' | 'cronjob' | 'rolebinding';
  namespace: string;
  status: 'healthy' | 'warning' | 'error' | 'pending' | 'syncing';
  syncStatus: 'synced' | 'outofsync' | 'unknown';
  position: { x: number; y: number };
  dependencies: string[];
  children: string[];
  metadata: {
    replicas?: number;
    readyReplicas?: number;
    containers?: number;
    ports?: number[];
    dataKeys?: number;
    lastSync?: string;
    syncRevision?: string;
    secrets?: number;
    imagePullSecrets?: number;
    schedule?: string;
    completions?: number;
    parallelism?: number;
    rules?: number;
    apiGroups?: string[];
    resources?: string[];
    verbs?: string[];
  };
  colorClass?: string;
}

export function VisualPreview({ 
  deployments, 
  daemonSets,
  namespaces, 
  configMaps, 
  secrets, 
  serviceAccounts,
  roles,
  clusterRoles,
  jobs,
  roleBindings,
  customResources = [],
  crds = [],
  containerRef,
  filterType = 'all'
}: VisualPreviewProps) {
  const showDetails = true;
  const [yamlModal, setYamlModal] = useState<{ open: boolean, title: string, yaml: string } | null>(null);

  const validDeployments = deployments.filter(d => d.appName);
  const validDaemonSets = daemonSets.filter(d => d.appName);

  const colorPalette = [
    'border-blue-300 bg-blue-50 shadow-blue-100',
    'border-green-300 bg-green-50 shadow-green-100',
    'border-yellow-300 bg-yellow-50 shadow-yellow-100',
    'border-purple-300 bg-purple-50 shadow-purple-100',
    'border-pink-300 bg-pink-50 shadow-pink-100',
    'border-indigo-300 bg-indigo-50 shadow-indigo-100',
    'border-teal-300 bg-teal-50 shadow-teal-100',
    'border-orange-300 bg-orange-50 shadow-orange-100',
  ];

  // Generate flow nodes with each deployment/daemonset in its own row
  const rawFlowNodes = useMemo(() => {
    const nodes: FlowNode[] = [];
    const nodeSpacing = { x: 200, y: 140 };
    const rowHeight = 260; // Increased for more space between deployments
    let currentY = 0;

    // Filter resources based on filterType
    const filteredDeployments = filterType === 'all' || filterType === 'deployments' ? deployments : [];
    const filteredDaemonSets = filterType === 'all' || filterType === 'daemonsets' ? daemonSets : [];
    const filteredNamespaces = filterType === 'all' || filterType === 'namespaces' ? namespaces : [];
    const filteredConfigMaps = filterType === 'all' || filterType === 'configmaps' ? configMaps : [];
    const filteredSecrets = filterType === 'all' || filterType === 'secrets' ? secrets : [];
    const filteredServiceAccounts = filterType === 'all' || filterType === 'serviceaccounts' ? serviceAccounts : [];
    const filteredRoles = filterType === 'all' || filterType === 'roles' ? roles : [];
    const filteredClusterRoles = filterType === 'all' || filterType === 'clusterroles' ? clusterRoles : [];
    const filteredJobs = filterType === 'all' || filterType === 'jobs' || filterType === 'cronjobs' ? jobs : [];
    const filteredRoleBindings = filterType === 'all' || filterType === 'rolebindings' ? roleBindings : [];

    // Group by namespace
    const namespaceGroups = filteredNamespaces.map(ns => ({
      namespace: ns,
      deployments: filteredDeployments.filter(d => d.namespace === ns.name && d.appName),
      daemonSets: filteredDaemonSets.filter(d => d.namespace === ns.name && d.appName),
      configMaps: filteredConfigMaps.filter(cm => cm.namespace === ns.name),
      secrets: filteredSecrets.filter(s => s.namespace === ns.name),
      serviceAccounts: filteredServiceAccounts.filter(sa => sa.namespace === ns.name),
      roles: filteredRoles.filter(r => r.metadata.namespace === ns.name),
      roleBindings: filteredRoleBindings.filter(rb => !rb.isClusterRoleBinding && rb.namespace === ns.name)
    })).filter(group => 
      group.deployments.length > 0 || 
      group.daemonSets.length > 0 ||
      group.configMaps.length > 0 || 
      group.secrets.length > 0 ||
      group.serviceAccounts.length > 0 ||
      group.roles.length > 0 ||
      group.roleBindings.length > 0 ||
      (filterType === 'namespaces' && group.namespace)
    );

    namespaceGroups.forEach((group) => {
      // Process deployments
      group.deployments.forEach((deployment, depIndex) => {
        const baseY = currentY;
        const colorIdx = depIndex % colorPalette.length;
        const colorClass = colorPalette[colorIdx];
        const deploymentId = `deployment-${deployment.appName}`;
        const serviceId = `service-${deployment.appName}`;
        // Calculate deployment status
        const hasContainers = deployment.containers && deployment.containers.length > 0;
        const hasValidContainers = hasContainers && deployment.containers.every(c => c.name && c.image);
        const hasProperPorts = deployment.port > 0 && deployment.targetPort > 0;
        let deploymentStatus: 'healthy' | 'warning' | 'error' | 'pending' | 'syncing';
        let syncStatus: 'synced' | 'outofsync' | 'unknown';
        if (hasValidContainers && hasProperPorts) {
          deploymentStatus = 'healthy';
          syncStatus = 'synced';
        } else if (hasContainers && hasProperPorts) {
          deploymentStatus = 'warning';
          syncStatus = 'outofsync';
        } else {
          deploymentStatus = 'error';
          syncStatus = 'outofsync';
        }
        // Add deployment node
        nodes.push({
          id: deploymentId,
          name: deployment.appName,
          type: 'deployment',
          namespace: deployment.namespace,
          status: deploymentStatus,
          syncStatus: syncStatus,
          position: { x: 0, y: baseY },
          dependencies: [],
          children: [serviceId],
          metadata: {
            replicas: deployment.replicas,
            readyReplicas: hasValidContainers ? deployment.replicas : 0,
            containers: deployment.containers?.length || 0,
            lastSync: new Date().toISOString(),
            syncRevision: `v${Date.now()}`
          },
          colorClass: colorClass
        });
        // Add service node
        nodes.push({
          id: serviceId,
          name: `${deployment.appName}-service`,
          type: 'service',
          namespace: deployment.namespace,
          status: hasValidContainers ? 'healthy' : 'warning',
          syncStatus: hasValidContainers ? 'synced' : 'outofsync',
          position: { x: nodeSpacing.x, y: baseY },
          dependencies: [deploymentId],
          children: deployment.ingress?.enabled ? [`ingress-${deployment.appName}`] : [],
          metadata: {
            ports: [deployment.port]
          },
          colorClass: colorClass
        });
        // Add a single pod node below the deployment, with replica count badge
        const podId = `pod-${deployment.appName}`;
        nodes.push({
          id: podId,
          name: `${deployment.appName}-pod`,
          type: 'pod',
          namespace: deployment.namespace,
          status: hasValidContainers ? 'healthy' : 'error',
          syncStatus: hasValidContainers ? 'synced' : 'outofsync',
          position: { x: -nodeSpacing.x, y: baseY + 60 },
          dependencies: [deploymentId],
          children: [],
          metadata: {
            containers: deployment.containers?.length || 0,
            replicas: deployment.replicas
          },
          colorClass: colorClass
        });
        // Add ingress if enabled
        if (deployment.ingress?.enabled) {
          nodes.push({
            id: `ingress-${deployment.appName}`,
            name: `${deployment.appName}-ingress`,
            type: 'ingress',
            namespace: deployment.namespace,
            status: 'healthy',
            syncStatus: 'synced',
            position: { x: nodeSpacing.x * 2, y: baseY },
            dependencies: [serviceId],
            children: [`external-${deployment.appName}`],
            metadata: {},
            colorClass: colorClass
          });
          nodes.push({
            id: `external-${deployment.appName}`,
            name: 'External Traffic',
            type: 'external',
            namespace: deployment.namespace,
            status: 'healthy',
            syncStatus: 'synced',
            position: { x: nodeSpacing.x * 3, y: baseY },
            dependencies: [`ingress-${deployment.appName}`],
            children: [],
            metadata: {},
            colorClass: colorClass
          });
        }
        // Add ConfigMaps
        deployment.selectedConfigMaps?.forEach((configMapName, cmIndex) => {
          const configMap = configMaps.find(cm => cm.name === configMapName);
          if (configMap) {
            nodes.push({
              id: `configmap-${configMapName}`,
              name: configMapName,
              type: 'configmap',
              namespace: configMap.namespace,
              status: 'healthy',
              syncStatus: 'synced',
              position: { x: -nodeSpacing.x * 2, y: baseY + (cmIndex * 60) },
              dependencies: [deploymentId],
              children: [],
              metadata: {
                dataKeys: Object.keys(configMap.data).length
              },
              colorClass: colorClass
            });
          }
        });
        // Add Secrets
        deployment.selectedSecrets?.forEach((secretName, secIndex) => {
          const secret = secrets.find(s => s.name === secretName);
          if (secret) {
            nodes.push({
              id: `secret-${secretName}`,
              name: secretName,
              type: 'secret',
              namespace: secret.namespace,
              status: 'healthy',
              syncStatus: 'synced',
              position: { x: -nodeSpacing.x * 2, y: baseY + 60 + (secIndex * 60) },
              dependencies: [deploymentId],
              children: [],
              metadata: {
                dataKeys: Object.keys(secret.data).length
              },
              colorClass: colorClass
            });
          }
        });
        currentY += rowHeight;
      });

      // Process daemonsets
      group.daemonSets.forEach((daemonSet, dsIndex) => {
        const baseY = currentY;
        const colorIdx = (group.deployments.length + dsIndex) % colorPalette.length;
        const colorClass = colorPalette[colorIdx];
        const daemonSetId = `daemonset-${daemonSet.appName}`;
        const serviceId = `service-${daemonSet.appName}`;
        // Calculate daemonset status
        const hasContainers = daemonSet.containers && daemonSet.containers.length > 0;
        const hasValidContainers = hasContainers && daemonSet.containers.every(c => c.name && c.image);
        const hasProperPorts = daemonSet.port > 0 && daemonSet.targetPort > 0;
        let daemonSetStatus: 'healthy' | 'warning' | 'error' | 'pending' | 'syncing';
        let syncStatus: 'synced' | 'outofsync' | 'unknown';
        if (hasValidContainers && hasProperPorts) {
          daemonSetStatus = 'healthy';
          syncStatus = 'synced';
        } else if (hasContainers && hasProperPorts) {
          daemonSetStatus = 'warning';
          syncStatus = 'outofsync';
        } else {
          daemonSetStatus = 'error';
          syncStatus = 'outofsync';
        }
        // Add daemonset node
        nodes.push({
          id: daemonSetId,
          name: daemonSet.appName,
          type: 'daemonset',
          namespace: daemonSet.namespace,
          status: daemonSetStatus,
          syncStatus: syncStatus,
          position: { x: 0, y: baseY },
          dependencies: [],
          children: [serviceId],
          metadata: {
            containers: daemonSet.containers?.length || 0,
            lastSync: new Date().toISOString(),
            syncRevision: `v${Date.now()}`
          },
          colorClass: colorClass
        });
        // Add service node only if service is enabled
        if (daemonSet.serviceEnabled) {
          nodes.push({
            id: serviceId,
            name: `${daemonSet.appName}-service`,
            type: 'service',
            namespace: daemonSet.namespace,
            status: hasValidContainers ? 'healthy' : 'warning',
            syncStatus: hasValidContainers ? 'synced' : 'outofsync',
            position: { x: nodeSpacing.x, y: baseY },
            dependencies: [daemonSetId],
            children: [],
            metadata: {
              ports: [daemonSet.port]
            },
            colorClass: colorClass
          });
        }
        // Add a single pod node below the daemonset
        const podId = `pod-${daemonSet.appName}`;
        nodes.push({
          id: podId,
          name: `${daemonSet.appName}-pod`,
          type: 'pod',
          namespace: daemonSet.namespace,
          status: hasValidContainers ? 'healthy' : 'error',
          syncStatus: hasValidContainers ? 'synced' : 'outofsync',
          position: { x: -nodeSpacing.x, y: baseY + 60 },
          dependencies: [daemonSetId],
          children: [],
          metadata: {
            containers: daemonSet.containers?.length || 0
          },
          colorClass: colorClass
        });
        currentY += rowHeight;
      });

      // Process service accounts in an improved layout
      if (group.serviceAccounts.length > 0) {
        const baseY = currentY;
        const colorClass = colorPalette[0]; // Use consistent color for service accounts
        
        // Create a much better spaced grid layout for service accounts
        const serviceAccountsPerRow = 2; // Keep 2 per row for better spacing
        const serviceAccountSpacing = 500; // Much more spacing between service accounts
        
        group.serviceAccounts.forEach((serviceAccount, saIndex) => {
          const row = Math.floor(saIndex / serviceAccountsPerRow);
          const col = saIndex % serviceAccountsPerRow;
          const serviceAccountId = `serviceaccount-${serviceAccount.name}`;
          
          // Calculate service account status
          const hasName = serviceAccount.name && serviceAccount.name.trim() !== '';
          const hasNamespace = serviceAccount.namespace && serviceAccount.namespace.trim() !== '';
          let serviceAccountStatus: 'healthy' | 'warning' | 'error' | 'pending' | 'syncing';
          let syncStatus: 'synced' | 'outofsync' | 'unknown';
          
          if (hasName && hasNamespace) {
            serviceAccountStatus = 'healthy';
            syncStatus = 'synced';
          } else if (hasName || hasNamespace) {
            serviceAccountStatus = 'warning';
            syncStatus = 'outofsync';
          } else {
            serviceAccountStatus = 'error';
            syncStatus = 'outofsync';
          }

          // Calculate the row base Y position with much better spacing
          const rowBaseY = baseY + (row * 250); // Much more vertical spacing between rows
          
          // Add service account node in improved grid
          nodes.push({
            id: serviceAccountId,
            name: serviceAccount.name,
            type: 'serviceaccount',
            namespace: serviceAccount.namespace,
            status: serviceAccountStatus,
            syncStatus: syncStatus,
            position: { 
              x: col * serviceAccountSpacing, 
              y: rowBaseY
            },
            dependencies: [],
            children: [],
            metadata: {
              secrets: serviceAccount.secrets?.length || 0,
              imagePullSecrets: serviceAccount.imagePullSecrets?.length || 0,
              lastSync: new Date().toISOString(),
              syncRevision: `v${Date.now()}`
            },
            colorClass: colorClass
          });

          // Add associated secrets if any (positioned below and to the left)
          serviceAccount.secrets?.forEach((secretRef, secIndex) => {
            const secret = secrets.find(s => s.name === secretRef.name);
            if (secret) {
              nodes.push({
                id: `secret-${secretRef.name}-sa-${saIndex}`,
                name: secretRef.name,
                type: 'secret',
                namespace: secret.namespace,
                status: 'healthy',
                syncStatus: 'synced',
                position: { 
                  x: col * serviceAccountSpacing - 180, // Much better horizontal offset
                  y: rowBaseY + 120 + (secIndex * 80) // Position much further below with better vertical spacing
                },
                dependencies: [serviceAccountId],
                children: [],
                metadata: {
                  dataKeys: Object.keys(secret.data).length
                },
                colorClass: colorClass
              });
            }
          });

          // Add associated image pull secrets if any (positioned below and to the right)
          serviceAccount.imagePullSecrets?.forEach((secretRef, ipsIndex) => {
            const secret = secrets.find(s => s.name === secretRef.name);
            if (secret) {
              nodes.push({
                id: `imagepullsecret-${secretRef.name}-sa-${saIndex}`,
                name: `${secretRef.name} (Image Pull)`,
                type: 'secret',
                namespace: secret.namespace,
                status: 'healthy',
                syncStatus: 'synced',
                position: { 
                  x: col * serviceAccountSpacing + 180, // Much better horizontal offset
                  y: rowBaseY + 120 + (ipsIndex * 80) // Position much further below with better vertical spacing
                },
                dependencies: [serviceAccountId],
                children: [],
                metadata: {
                  dataKeys: Object.keys(secret.data).length
                },
                colorClass: colorClass
              });
            }
          });
        });

        // Update currentY based on the number of rows needed with much better spacing calculation
        const totalRows = Math.ceil(group.serviceAccounts.length / serviceAccountsPerRow);
        const maxSecretsPerServiceAccount = Math.max(
          ...group.serviceAccounts.map(sa => (sa.secrets?.length || 0) + (sa.imagePullSecrets?.length || 0)),
          0
        );
        // Add extra space for secrets positioned below service accounts
        const extraSpaceForSecrets = maxSecretsPerServiceAccount > 0 ? maxSecretsPerServiceAccount * 80 + 80 : 0;
        currentY += totalRows * 250 + extraSpaceForSecrets + 100; // Much improved spacing calculation
      }

      // Process roles
      if (group.roles.length > 0) {
        const rolesPerRow = 2;
        const roleSpacing = 280;
        
        group.roles.forEach((role, roleIndex) => {
          const row = Math.floor(roleIndex / rolesPerRow);
          const col = roleIndex % rolesPerRow;
          const roleId = `role-${role.metadata.name}`;
          
          // Calculate role status
          const hasName = role.metadata.name && role.metadata.name.trim() !== '';
          const hasRules = role.rules && role.rules.length > 0;
          const hasValidRules = hasRules && role.rules.every(r => 
            r.resources && r.resources.length > 0 && r.verbs && r.verbs.length > 0
          );
          let roleStatus: 'healthy' | 'warning' | 'error' | 'pending' | 'syncing';
          let syncStatus: 'synced' | 'outofsync' | 'unknown';
          
          if (hasName && hasValidRules) {
            roleStatus = 'healthy';
            syncStatus = 'synced';
          } else if (hasName && hasRules) {
            roleStatus = 'warning';
            syncStatus = 'outofsync';
          } else {
            roleStatus = 'error';
            syncStatus = 'outofsync';
          }

          // Extract unique API groups, resources, and verbs across all rules
          const allApiGroups = Array.from(new Set(role.rules.flatMap(r => r.apiGroups || []))).map(g => g || 'core');
          const allResources = Array.from(new Set(role.rules.flatMap(r => r.resources || [])));
          const allVerbs = Array.from(new Set(role.rules.flatMap(r => r.verbs || [])));

          // Add role node
          nodes.push({
            id: roleId,
            name: role.metadata.name,
            type: 'role',
            namespace: role.metadata.namespace,
            status: roleStatus,
            syncStatus: syncStatus,
            position: { 
              x: col * roleSpacing, 
              y: currentY + (row * 180) // Increased spacing for role details
            },
            dependencies: [],
            children: [],
            metadata: {
              rules: role.rules.length,
              apiGroups: allApiGroups.slice(0, 3), // Show up to 3 API groups
              resources: allResources.slice(0, 3), // Show up to 3 resources
              verbs: allVerbs.slice(0, 3), // Show up to 3 verbs
              lastSync: new Date().toISOString(),
              syncRevision: `v${Date.now()}`
            },
            colorClass: colorPalette[5] // Use purple color for roles
          });
        });

        // Update currentY based on the number of rows needed
        const totalRoleRows = Math.ceil(group.roles.length / rolesPerRow);
        currentY += totalRoleRows * 180 + 40; // Increased spacing for roles
      }

      // Process RoleBindings (namespace-scoped only)
      if (group.roleBindings.length > 0) {
        const roleBindingsPerRow = 2;
        const roleBindingSpacing = 260;
        
        group.roleBindings.forEach((rb, rbIndex) => {
          const row = Math.floor(rbIndex / roleBindingsPerRow);
          const col = rbIndex % roleBindingsPerRow;
          const rbId = `rolebinding-${rb.name}-${rb.namespace}`;
          
          nodes.push({
            id: rbId,
            name: rb.name,
            type: 'rolebinding',
            namespace: rb.namespace || '',
            status: 'healthy',
            syncStatus: 'synced',
            position: {
              x: col * roleBindingSpacing,
              y: currentY + (row * 120)
            },
            dependencies: [],
            children: [],
            metadata: {
              lastSync: new Date().toISOString(),
              syncRevision: `v${Date.now()}`
            },
            colorClass: colorPalette[3] // Purple for RoleBinding
          });
        });
        
        const totalRBRows = Math.ceil(group.roleBindings.length / roleBindingsPerRow);
        currentY += totalRBRows * 120 + 20;
      }

      // Process namespaces
      if (group.namespace) {
        const namespaceId = `namespace-${group.namespace.name}`;
        nodes.push({
          id: namespaceId,
          name: group.namespace.name,
          type: 'namespace',
          namespace: group.namespace.name,
          status: 'healthy',
          syncStatus: 'synced',
          position: { x: 0, y: currentY },
          dependencies: [],
          children: [],
          metadata: {
            lastSync: new Date().toISOString(),
            syncRevision: `v${Date.now()}`
          },
          colorClass: colorPalette[1]
        });
        currentY += 100; // Compact namespace spacing
      }

      // Process jobs and cronjobs
      const namespaceJobs = filteredJobs.filter(job => job.namespace === group.namespace.name);
      
      // Apply specific job/cronjob filtering
      const filteredNamespaceJobs = filterType === 'jobs' 
        ? namespaceJobs.filter(job => job.type === 'job')
        : filterType === 'cronjobs'
        ? namespaceJobs.filter(job => job.type === 'cronjob')
        : namespaceJobs;
      
      if (filteredNamespaceJobs.length > 0) {
        const jobsPerRow = 2;
        const jobSpacing = 250;
        
        filteredNamespaceJobs.forEach((job, jobIndex) => {
          const row = Math.floor(jobIndex / jobsPerRow);
          const col = jobIndex % jobsPerRow;
          const jobId = `${job.type}-${job.name}`;
          
          // Calculate job status
          const hasName = job.name && job.name.trim() !== '';
          const hasNamespace = job.namespace && job.namespace.trim() !== '';
          const hasContainers = job.containers && job.containers.length > 0;
          let jobStatus: 'healthy' | 'warning' | 'error' | 'pending' | 'syncing';
          let syncStatus: 'synced' | 'outofsync' | 'unknown';
          
          if (hasName && hasNamespace && hasContainers) {
            jobStatus = 'healthy';
            syncStatus = 'synced';
          } else if (hasName && hasNamespace) {
            jobStatus = 'warning';
            syncStatus = 'outofsync';
          } else {
            jobStatus = 'error';
            syncStatus = 'outofsync';
          }

          // Add job/cronjob node
          nodes.push({
            id: jobId,
            name: job.name,
            type: job.type,
            namespace: job.namespace,
            status: jobStatus,
            syncStatus: syncStatus,
            position: { 
              x: col * jobSpacing, 
              y: currentY + (row * 100) // Compact job spacing
            },
            dependencies: [],
            children: [],
            metadata: {
              containers: job.containers?.length || 0,
              schedule: job.schedule,
              completions: job.completions,
              parallelism: job.replicas,
              lastSync: new Date().toISOString(),
              syncRevision: `v${Date.now()}`
            },
            colorClass: job.type === 'cronjob' ? colorPalette[2] : colorPalette[3]
          });
        });

        // Update currentY based on the number of rows needed
        const totalJobRows = Math.ceil(filteredNamespaceJobs.length / jobsPerRow);
        currentY += totalJobRows * 100 + 40; // Compact job spacing
      }

      currentY += rowHeight * 0.2;
    });

    // Add cluster-wide RoleBindings (ClusterRoleBinding) at the end
    const clusterRoleBindings = filteredRoleBindings.filter(rb => rb.isClusterRoleBinding);
    if (clusterRoleBindings.length > 0 && (filterType === 'all' || filterType === 'rolebindings')) {
      currentY += 60;
      const crbPerRow = 2;
      const crbSpacing = 260;
      clusterRoleBindings.forEach((rb, index) => {
        const row = Math.floor(index / crbPerRow);
        const col = index % crbPerRow;
        const rbId = `clusterrolebinding-${rb.name}`;
        nodes.push({
          id: rbId,
          name: rb.name,
          type: 'rolebinding',
          namespace: 'cluster-wide',
          status: 'healthy',
          syncStatus: 'synced',
          position: {
            x: col * crbSpacing,
            y: currentY + (row * 120)
          },
          dependencies: [],
          children: [],
          metadata: {
            lastSync: new Date().toISOString(),
            syncRevision: `v${Date.now()}`
          },
          colorClass: colorPalette[0]
        });
      });
      const totalCRBRows = Math.ceil(clusterRoleBindings.length / crbPerRow);
      currentY += totalCRBRows * 120 + 20;
    }

    // Handle standalone resources that don't need to be grouped by namespace
    if (filterType === 'deployments' || filterType === 'daemonsets' || filterType === 'configmaps' || filterType === 'secrets' || filterType === 'serviceaccounts' || filterType === 'roles' || filterType === 'clusterroles' || filterType === 'jobs' || filterType === 'cronjobs') {
      // Add standalone deployments
      if (filterType === 'deployments') {
        filteredDeployments.forEach((deployment, depIndex) => {
          const baseY = currentY;
          const colorIdx = depIndex % colorPalette.length;
          const colorClass = colorPalette[colorIdx];
          const deploymentId = `deployment-${deployment.appName}`;
          const serviceId = `service-${deployment.appName}`;
          
          // Calculate deployment status
          const hasContainers = deployment.containers && deployment.containers.length > 0;
          const hasValidContainers = hasContainers && deployment.containers.every(c => c.name && c.image);
          const hasProperPorts = deployment.port > 0 && deployment.targetPort > 0;
          let deploymentStatus: 'healthy' | 'warning' | 'error' | 'pending' | 'syncing';
          let syncStatus: 'synced' | 'outofsync' | 'unknown';
          
          if (hasValidContainers && hasProperPorts) {
            deploymentStatus = 'healthy';
            syncStatus = 'synced';
          } else if (hasContainers && hasProperPorts) {
            deploymentStatus = 'warning';
            syncStatus = 'outofsync';
          } else {
            deploymentStatus = 'error';
            syncStatus = 'outofsync';
          }

          // Add deployment node
          nodes.push({
            id: deploymentId,
            name: deployment.appName,
            type: 'deployment',
            namespace: deployment.namespace,
            status: deploymentStatus,
            syncStatus: syncStatus,
            position: { x: 0, y: baseY },
            dependencies: [],
            children: [serviceId],
            metadata: {
              replicas: deployment.replicas,
              readyReplicas: hasValidContainers ? deployment.replicas : 0,
              containers: deployment.containers?.length || 0,
              lastSync: new Date().toISOString(),
              syncRevision: `v${Date.now()}`
            },
            colorClass: colorClass
          });

          // Add service node
          nodes.push({
            id: serviceId,
            name: `${deployment.appName}-service`,
            type: 'service',
            namespace: deployment.namespace,
            status: hasValidContainers ? 'healthy' : 'warning',
            syncStatus: hasValidContainers ? 'synced' : 'outofsync',
            position: { x: 200, y: baseY },
            dependencies: [deploymentId],
            children: deployment.ingress?.enabled ? [`ingress-${deployment.appName}`] : [],
            metadata: {
              ports: [deployment.port]
            },
            colorClass: colorClass
          });

          // Add pod node
          const podId = `pod-${deployment.appName}`;
          nodes.push({
            id: podId,
            name: `${deployment.appName}-pod`,
            type: 'pod',
            namespace: deployment.namespace,
            status: hasValidContainers ? 'healthy' : 'error',
            syncStatus: hasValidContainers ? 'synced' : 'outofsync',
            position: { x: -200, y: baseY + 60 },
            dependencies: [deploymentId],
            children: [],
            metadata: {
              containers: deployment.containers?.length || 0,
              replicas: deployment.replicas
            },
            colorClass: colorClass
          });

          // Add ingress if enabled
          if (deployment.ingress?.enabled) {
            nodes.push({
              id: `ingress-${deployment.appName}`,
              name: `${deployment.appName}-ingress`,
              type: 'ingress',
              namespace: deployment.namespace,
              status: 'healthy',
              syncStatus: 'synced',
              position: { x: 400, y: baseY },
              dependencies: [serviceId],
              children: [`external-${deployment.appName}`],
              metadata: {},
              colorClass: colorClass
            });
            nodes.push({
              id: `external-${deployment.appName}`,
              name: 'External Traffic',
              type: 'external',
              namespace: deployment.namespace,
              status: 'healthy',
              syncStatus: 'synced',
              position: { x: 600, y: baseY },
              dependencies: [`ingress-${deployment.appName}`],
              children: [],
              metadata: {},
              colorClass: colorClass
            });
          }

          currentY += 260; // Move to next deployment
        });
      }

      // Add standalone daemonSets
      if (filterType === 'daemonsets') {
        filteredDaemonSets.forEach((daemonSet, dsIndex) => {
          const baseY = currentY;
          const colorIdx = dsIndex % colorPalette.length;
          const colorClass = colorPalette[colorIdx];
          const daemonSetId = `daemonset-${daemonSet.appName}`;
          const serviceId = `service-${daemonSet.appName}`;
          
          // Calculate daemonSet status
          const hasContainers = daemonSet.containers && daemonSet.containers.length > 0;
          const hasValidContainers = hasContainers && daemonSet.containers.every(c => c.name && c.image);
          let daemonSetStatus: 'healthy' | 'warning' | 'error' | 'pending' | 'syncing';
          let syncStatus: 'synced' | 'outofsync' | 'unknown';
          
          if (hasValidContainers) {
            daemonSetStatus = 'healthy';
            syncStatus = 'synced';
          } else if (hasContainers) {
            daemonSetStatus = 'warning';
            syncStatus = 'outofsync';
          } else {
            daemonSetStatus = 'error';
            syncStatus = 'outofsync';
          }

          // Add daemonSet node
          nodes.push({
            id: daemonSetId,
            name: daemonSet.appName,
            type: 'daemonset',
            namespace: daemonSet.namespace,
            status: daemonSetStatus,
            syncStatus: syncStatus,
            position: { x: 0, y: baseY },
            dependencies: [],
            children: daemonSet.serviceEnabled ? [serviceId] : [],
            metadata: {
              containers: daemonSet.containers?.length || 0,
              lastSync: new Date().toISOString(),
              syncRevision: `v${Date.now()}`
            },
            colorClass: colorClass
          });

          // Add service node if enabled
          if (daemonSet.serviceEnabled) {
            nodes.push({
              id: serviceId,
              name: `${daemonSet.appName}-service`,
              type: 'service',
              namespace: daemonSet.namespace,
              status: hasValidContainers ? 'healthy' : 'warning',
              syncStatus: hasValidContainers ? 'synced' : 'outofsync',
              position: { x: 200, y: baseY },
              dependencies: [daemonSetId],
              children: [],
              metadata: {
                ports: [daemonSet.port]
              },
              colorClass: colorClass
            });
          }

          // Add pod node
          const podId = `pod-${daemonSet.appName}`;
          nodes.push({
            id: podId,
            name: `${daemonSet.appName}-pod`,
            type: 'pod',
            namespace: daemonSet.namespace,
            status: hasValidContainers ? 'healthy' : 'error',
            syncStatus: hasValidContainers ? 'synced' : 'outofsync',
            position: { x: -200, y: baseY + 60 },
            dependencies: [daemonSetId],
            children: [],
            metadata: {
              containers: daemonSet.containers?.length || 0
            },
            colorClass: colorClass
          });

          currentY += 260; // Move to next daemonSet
        });
      }

      // Add standalone configmaps in grid layout
      if (filterType === 'configmaps') {
        const configMapsPerRow = 3;
        const configMapSpacing = 250;
        
        filteredConfigMaps.forEach((configMap, index) => {
          const row = Math.floor(index / configMapsPerRow);
          const col = index % configMapsPerRow;
          
          nodes.push({
            id: `configmap-${configMap.name}`,
            name: configMap.name,
            type: 'configmap',
            namespace: configMap.namespace,
            status: 'healthy',
            syncStatus: 'synced',
            position: { 
              x: col * configMapSpacing, 
              y: currentY + (row * 120) // Compact spacing
            },
            dependencies: [],
            children: [],
            metadata: {
              dataKeys: Object.keys(configMap.data).length
            },
            colorClass: colorPalette[0]
          });
        });
        
        // Update currentY based on the number of rows needed
        const totalRows = Math.ceil(filteredConfigMaps.length / configMapsPerRow);
        currentY += totalRows * 120 + 40; // Compact spacing
      }

      // Add standalone secrets in grid layout
      if (filterType === 'secrets') {
        const secretsPerRow = 3;
        const secretSpacing = 250;
        
        filteredSecrets.forEach((secret, index) => {
          const row = Math.floor(index / secretsPerRow);
          const col = index % secretsPerRow;
          
          nodes.push({
            id: `secret-${secret.name}`,
            name: secret.name,
            type: 'secret',
            namespace: secret.namespace,
            status: 'healthy',
            syncStatus: 'synced',
            position: { 
              x: col * secretSpacing, 
              y: currentY + (row * 120) // Compact spacing
            },
            dependencies: [],
            children: [],
            metadata: {
              dataKeys: Object.keys(secret.data).length
            },
            colorClass: colorPalette[1]
          });
        });
        
        // Update currentY based on the number of rows needed
        const totalRows = Math.ceil(filteredSecrets.length / secretsPerRow);
        currentY += totalRows * 120 + 40; // Compact spacing
      }

      // Add standalone service accounts in much improved grid layout
      if (filterType === 'serviceaccounts') {
        const serviceAccountsPerRow = 2; // Keep 2 per row for better spacing
        const serviceAccountSpacing = 500; // Much more spacing between service accounts
        
        filteredServiceAccounts.forEach((serviceAccount, index) => {
          const row = Math.floor(index / serviceAccountsPerRow);
          const col = index % serviceAccountsPerRow;
          const rowBaseY = currentY + (row * 250); // Much better vertical spacing
          
          // Add service account node
          nodes.push({
            id: `serviceaccount-${serviceAccount.name}`,
            name: serviceAccount.name,
            type: 'serviceaccount',
            namespace: serviceAccount.namespace,
            status: 'healthy',
            syncStatus: 'synced',
            position: { 
              x: col * serviceAccountSpacing, 
              y: rowBaseY
            },
            dependencies: [],
            children: [],
            metadata: {
              secrets: serviceAccount.secrets?.length || 0,
              imagePullSecrets: serviceAccount.imagePullSecrets?.length || 0
            },
            colorClass: colorPalette[2]
          });

          // Add associated secrets if any (positioned below and to the left)
          serviceAccount.secrets?.forEach((secretRef, secIndex) => {
            const secret = secrets.find(s => s.name === secretRef.name);
            if (secret) {
              nodes.push({
                id: `secret-${secretRef.name}-standalone-sa-${index}`,
                name: secretRef.name,
                type: 'secret',
                namespace: secret.namespace,
                status: 'healthy',
                syncStatus: 'synced',
                position: { 
                  x: col * serviceAccountSpacing - 180, // Much better horizontal offset
                  y: rowBaseY + 120 + (secIndex * 80) // Position much further below with better vertical spacing
                },
                dependencies: [`serviceaccount-${serviceAccount.name}`],
                children: [],
                metadata: {
                  dataKeys: Object.keys(secret.data).length
                },
                colorClass: colorPalette[2]
              });
            }
          });

          // Add associated image pull secrets if any (positioned below and to the right)
          serviceAccount.imagePullSecrets?.forEach((secretRef, ipsIndex) => {
            const secret = secrets.find(s => s.name === secretRef.name);
            if (secret) {
              nodes.push({
                id: `imagepullsecret-${secretRef.name}-standalone-sa-${index}`,
                name: `${secretRef.name} (Image Pull)`,
                type: 'secret',
                namespace: secret.namespace,
                status: 'healthy',
                syncStatus: 'synced',
                position: { 
                  x: col * serviceAccountSpacing + 180, // Much better horizontal offset
                  y: rowBaseY + 120 + (ipsIndex * 80) // Position much further below with better vertical spacing
                },
                dependencies: [`serviceaccount-${serviceAccount.name}`],
                children: [],
                metadata: {
                  dataKeys: Object.keys(secret.data).length
                },
                colorClass: colorPalette[2]
              });
            }
          });
        });
        
        // Update currentY based on the number of rows needed with much better spacing calculation
        const totalRows = Math.ceil(filteredServiceAccounts.length / serviceAccountsPerRow);
        const maxSecretsPerServiceAccount = Math.max(
          ...filteredServiceAccounts.map(sa => (sa.secrets?.length || 0) + (sa.imagePullSecrets?.length || 0)),
          0
        );
        // Add extra space for secrets positioned below service accounts
        const extraSpaceForSecrets = maxSecretsPerServiceAccount > 0 ? maxSecretsPerServiceAccount * 80 + 80 : 0;
        currentY += totalRows * 250 + extraSpaceForSecrets + 100; // Much improved spacing calculation
      }

      // Add standalone roles in grid layout
      if (filterType === 'roles') {
        const rolesPerRow = 2;
        const roleSpacing = 300;
        
        filteredRoles.forEach((role, index) => {
          const row = Math.floor(index / rolesPerRow);
          const col = index % rolesPerRow;
          
          // Calculate role status
          const hasName = role.metadata.name && role.metadata.name.trim() !== '';
          const hasRules = role.rules && role.rules.length > 0;
          const hasValidRules = hasRules && role.rules.every(r => 
            r.resources && r.resources.length > 0 && r.verbs && r.verbs.length > 0
          );
          let roleStatus: 'healthy' | 'warning' | 'error' | 'pending' | 'syncing';
          let syncStatus: 'synced' | 'outofsync' | 'unknown';
          
          if (hasName && hasValidRules) {
            roleStatus = 'healthy';
            syncStatus = 'synced';
          } else if (hasName && hasRules) {
            roleStatus = 'warning';
            syncStatus = 'outofsync';
          } else {
            roleStatus = 'error';
            syncStatus = 'outofsync';
          }

          // Extract unique API groups, resources, and verbs across all rules
          const allApiGroups = Array.from(new Set(role.rules.flatMap(r => r.apiGroups || []))).map(g => g || 'core');
          const allResources = Array.from(new Set(role.rules.flatMap(r => r.resources || [])));
          const allVerbs = Array.from(new Set(role.rules.flatMap(r => r.verbs || [])));

          nodes.push({
            id: `role-${role.metadata.name}`,
            name: role.metadata.name,
            type: 'role',
            namespace: role.metadata.namespace,
            status: roleStatus,
            syncStatus: syncStatus,
            position: { 
              x: col * roleSpacing, 
              y: currentY + (row * 200) // Increased spacing for role details
            },
            dependencies: [],
            children: [],
            metadata: {
              rules: role.rules.length,
              apiGroups: allApiGroups.slice(0, 3), // Show up to 3 API groups
              resources: allResources.slice(0, 3), // Show up to 3 resources
              verbs: allVerbs.slice(0, 3), // Show up to 3 verbs
              lastSync: new Date().toISOString(),
              syncRevision: `v${Date.now()}`
            },
            colorClass: colorPalette[5] // Use purple color for roles
          });
        });
        
        // Update currentY based on the number of rows needed
        const totalRows = Math.ceil(filteredRoles.length / rolesPerRow);
        currentY += totalRows * 200 + 40; // Increased spacing for roles
      }

      // Add standalone cluster roles in grid layout
      if (filterType === 'clusterroles') {
        const clusterRolesPerRow = 2;
        const clusterRoleSpacing = 300;
        
        filteredClusterRoles.forEach((clusterRole, index) => {
          const row = Math.floor(index / clusterRolesPerRow);
          const col = index % clusterRolesPerRow;
          
          // Calculate cluster role status
          const hasName = clusterRole.metadata.name && clusterRole.metadata.name.trim() !== '';
          const hasRules = clusterRole.rules && clusterRole.rules.length > 0;
          const hasValidRules = hasRules && clusterRole.rules.every(r => 
            r.resources && r.resources.length > 0 && r.verbs && r.verbs.length > 0
          );
          let clusterRoleStatus: 'healthy' | 'warning' | 'error' | 'pending' | 'syncing';
          let syncStatus: 'synced' | 'outofsync' | 'unknown';
          
          if (hasName && hasValidRules) {
            clusterRoleStatus = 'healthy';
            syncStatus = 'synced';
          } else if (hasName && hasRules) {
            clusterRoleStatus = 'warning';
            syncStatus = 'outofsync';
          } else {
            clusterRoleStatus = 'error';
            syncStatus = 'outofsync';
          }

          // Extract unique API groups, resources, and verbs across all rules
          const allApiGroups = Array.from(new Set(clusterRole.rules.flatMap(r => r.apiGroups || []))).map(g => g || 'core');
          const allResources = Array.from(new Set(clusterRole.rules.flatMap(r => r.resources || [])));
          const allVerbs = Array.from(new Set(clusterRole.rules.flatMap(r => r.verbs || [])));

          nodes.push({
            id: `clusterrole-${clusterRole.metadata.name}`,
            name: clusterRole.metadata.name,
            type: 'role', // Use 'role' type for visual consistency
            namespace: 'cluster-wide', // Special namespace indicator
            status: clusterRoleStatus,
            syncStatus: syncStatus,
            position: { 
              x: col * clusterRoleSpacing, 
              y: currentY + (row * 200) // Increased spacing for cluster role details
            },
            dependencies: [],
            children: [],
            metadata: {
              rules: clusterRole.rules.length,
              apiGroups: allApiGroups.slice(0, 3), // Show up to 3 API groups
              resources: allResources.slice(0, 3), // Show up to 3 resources
              verbs: allVerbs.slice(0, 3), // Show up to 3 verbs
              lastSync: new Date().toISOString(),
              syncRevision: `v${Date.now()}`
            },
            colorClass: colorPalette[6] // Use different color for cluster roles
          });
        });
        
        // Update currentY based on the number of rows needed
        const totalRows = Math.ceil(filteredClusterRoles.length / clusterRolesPerRow);
        currentY += totalRows * 200 + 40; // Increased spacing for cluster roles
      }

      // Add standalone jobs/cronjobs in grid layout
      if (filterType === 'jobs' || filterType === 'cronjobs') {
        const jobsToShow = filterType === 'jobs' 
          ? filteredJobs.filter(job => job.type === 'job')
          : filteredJobs.filter(job => job.type === 'cronjob');
        
        const jobsPerRow = 3;
        const jobSpacing = 250;
        
        jobsToShow.forEach((job, index) => {
          const row = Math.floor(index / jobsPerRow);
          const col = index % jobsPerRow;
          
          const hasName = job.name && job.name.trim() !== '';
          const hasNamespace = job.namespace && job.namespace.trim() !== '';
          const hasContainers = job.containers && job.containers.length > 0;
          let jobStatus: 'healthy' | 'warning' | 'error' | 'pending' | 'syncing';
          let syncStatus: 'synced' | 'outofsync' | 'unknown';
          
          if (hasName && hasNamespace && hasContainers) {
            jobStatus = 'healthy';
            syncStatus = 'synced';
          } else if (hasName && hasNamespace) {
            jobStatus = 'warning';
            syncStatus = 'outofsync';
          } else {
            jobStatus = 'error';
            syncStatus = 'outofsync';
          }

          nodes.push({
            id: `${job.type}-${job.name}`,
            name: job.name,
            type: job.type,
            namespace: job.namespace,
            status: jobStatus,
            syncStatus: syncStatus,
            position: { 
              x: col * jobSpacing, 
              y: currentY + (row * 120) // Compact spacing
            },
            dependencies: [],
            children: [],
            metadata: {
              containers: job.containers?.length || 0,
              schedule: job.schedule,
              completions: job.completions,
              parallelism: job.replicas,
              lastSync: new Date().toISOString(),
              syncRevision: `v${Date.now()}`
            },
            colorClass: job.type === 'cronjob' ? colorPalette[2] : colorPalette[3]
          });
        });
        
        // Update currentY based on the number of rows needed
        const totalRows = Math.ceil(jobsToShow.length / jobsPerRow);
        currentY += totalRows * 120 + 40; // Compact spacing
      }
    }

    // Process ClusterRoles (cluster-scoped, positioned at the end to avoid conflicts)
    if (filteredClusterRoles.length > 0 && (filterType === 'all' || filterType === 'clusterroles')) {
      // Add some spacing before cluster roles section
      currentY += 60;
      
      const clusterRolesPerRow = 2;
      const clusterRoleSpacing = 300;
      
      filteredClusterRoles.forEach((clusterRole, clusterRoleIndex) => {
        const row = Math.floor(clusterRoleIndex / clusterRolesPerRow);
        const col = clusterRoleIndex % clusterRolesPerRow;
        const clusterRoleId = `clusterrole-${clusterRole.metadata.name}`;
        
        // Calculate cluster role status
        const hasName = clusterRole.metadata.name && clusterRole.metadata.name.trim() !== '';
        const hasRules = clusterRole.rules && clusterRole.rules.length > 0;
        const hasValidRules = hasRules && clusterRole.rules.every(r => 
          r.resources && r.resources.length > 0 && r.verbs && r.verbs.length > 0
        );
        let clusterRoleStatus: 'healthy' | 'warning' | 'error' | 'pending' | 'syncing';
        let syncStatus: 'synced' | 'outofsync' | 'unknown';
        
        if (hasName && hasValidRules) {
          clusterRoleStatus = 'healthy';
          syncStatus = 'synced';
        } else if (hasName && hasRules) {
          clusterRoleStatus = 'warning';
          syncStatus = 'outofsync';
        } else {
          clusterRoleStatus = 'error';
          syncStatus = 'outofsync';
        }

        // Extract unique API groups, resources, and verbs across all rules
        const allApiGroups = Array.from(new Set(clusterRole.rules.flatMap(r => r.apiGroups || []))).map(g => g || 'core');
        const allResources = Array.from(new Set(clusterRole.rules.flatMap(r => r.resources || [])));
        const allVerbs = Array.from(new Set(clusterRole.rules.flatMap(r => r.verbs || [])));

        // Add cluster role node
        nodes.push({
          id: clusterRoleId,
          name: clusterRole.metadata.name,
          type: 'role', // Use 'role' type for visual consistency
          namespace: 'cluster-wide', // Special namespace indicator
          status: clusterRoleStatus,
          syncStatus: syncStatus,
          position: { 
            x: col * clusterRoleSpacing, 
            y: currentY + (row * 200) // Increased spacing for cluster role details
          },
          dependencies: [],
          children: [],
          metadata: {
            rules: clusterRole.rules.length,
            apiGroups: allApiGroups.slice(0, 3), // Show up to 3 API groups
            resources: allResources.slice(0, 3), // Show up to 3 resources
            verbs: allVerbs.slice(0, 3), // Show up to 3 verbs
            lastSync: new Date().toISOString(),
            syncRevision: `v${Date.now()}`
          },
          colorClass: colorPalette[6] // Use different color for cluster roles
        });
      });

      // Update currentY based on the number of rows needed
      const totalClusterRoleRows = Math.ceil(filteredClusterRoles.length / clusterRolesPerRow);
      currentY += totalClusterRoleRows * 200 + 40; // Increased spacing for cluster roles
    }

    // Add standalone RoleBindings support for the rolebindings filter
    if (filterType === 'rolebindings') {
      const roleBindingsPerRow = 2;
      const roleBindingSpacing = 300;
      
      filteredRoleBindings.forEach((rb, index) => {
        const row = Math.floor(index / roleBindingsPerRow);
        const col = index % roleBindingsPerRow;
        
        nodes.push({
          id: `rolebinding-${rb.name}-${rb.namespace || 'cluster'}`,
          name: rb.name,
          type: 'rolebinding',
          namespace: rb.isClusterRoleBinding ? 'cluster-wide' : (rb.namespace || ''),
          status: 'healthy',
          syncStatus: 'synced',
          position: { 
            x: col * roleBindingSpacing, 
            y: currentY + (row * 200)
          },
          dependencies: [],
          children: [],
          metadata: {
            lastSync: new Date().toISOString(),
            syncRevision: `v${Date.now()}`
          },
          colorClass: rb.isClusterRoleBinding ? colorPalette[0] : colorPalette[3]
        });
      });
      
      const totalRows = Math.ceil(filteredRoleBindings.length / roleBindingsPerRow);
      currentY += totalRows * 200 + 40;
    }

    return nodes;
  }, [deployments, daemonSets, namespaces, configMaps, secrets, serviceAccounts, roles, clusterRoles, jobs, roleBindings, filterType]);

  // Bounding box calculation
  const padding = 40;
  const bbox = useMemo(() => {
    if (!rawFlowNodes.length) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    const xs = rawFlowNodes.map(n => n.position.x);
    const ys = rawFlowNodes.map(n => n.position.y);
    return {
      minX: Math.min(...xs),
      minY: Math.min(...ys),
      maxX: Math.max(...xs),
      maxY: Math.max(...ys)
    };
  }, [rawFlowNodes]);

  const nodeWidth = 192; // w-48 in Tailwind = 12rem = 192px
  const leftShift = -bbox.minX + padding + nodeWidth / 2;
  const topShift = -bbox.minY + padding + 60; // 60 for half node height

  // Shift all nodes so minX/minY are at padding
  const flowNodes = useMemo(() => {
    return rawFlowNodes.map(n => ({
      ...n,
      position: {
        x: n.position.x + leftShift,
        y: n.position.y + topShift
      }
    }));
  }, [rawFlowNodes, leftShift, topShift]);

  // Set inner container size to fit all nodes plus padding
  const innerWidth = bbox.maxX - bbox.minX + 2 * padding + 200;
  const innerHeight = bbox.maxY - bbox.minY + 2 * padding + 100; // +100 for node height

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-gray-500" />;
      case 'syncing':
        return <RotateCcw className="w-4 h-4 text-blue-500 animate-spin" />;
      default:
        return <Info className="w-4 h-4 text-gray-400" />;
    }
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'deployment':
        return <Server className="w-4 h-4 text-blue-500" />;
      case 'daemonset':
        return <Server className="w-4 h-4 text-indigo-500" />;
      case 'service':
        return <Network className="w-4 h-4 text-green-500" />;
      case 'pod':
        return <HardDrive className="w-4 h-4 text-purple-500" />;
      case 'configmap':
        return <Settings className="w-4 h-4 text-green-500" />;
      case 'serviceaccount':
        return <Users className="w-4 h-4 text-cyan-500" />;
      case 'role':
        return <Key className="w-4 h-4 text-purple-500" />;
      case 'job':
        return <Play className="w-4 h-4 text-orange-500" />;
      case 'cronjob':
        return <Clock className="w-4 h-4 text-purple-500" />;
        return <Settings className="w-4 h-4 text-orange-500" />;
      case 'secret':
        return <Key className="w-4 h-4 text-red-500" />;
      case 'ingress':
        return <Globe className="w-4 h-4 text-indigo-500" />;
      case 'namespace':
        return <Database className="w-4 h-4 text-gray-500" />;
      case 'external':
        return <ExternalLink className="w-4 h-4 text-blue-600" />;
      case 'rolebinding':
        return <Link2 className="w-4 h-4 text-blue-500" />;
      default:
        return <Info className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'border-green-300 bg-green-50 shadow-green-100';
      case 'warning':
        return 'border-yellow-300 bg-yellow-50 shadow-yellow-100';
      case 'error':
        return 'border-red-300 bg-red-50 shadow-red-100';
      case 'pending':
        return 'border-gray-300 bg-gray-50 shadow-gray-100';
      case 'syncing':
        return 'border-blue-300 bg-blue-50 shadow-blue-100';
      default:
        return 'border-gray-300 bg-white shadow-gray-100';
    }
  };

  const getSyncStatusColor = (syncStatus: string) => {
    switch (syncStatus) {
      case 'synced':
        return 'text-green-600 bg-green-100';
      case 'outofsync':
        return 'text-yellow-600 bg-yellow-100';
      case 'unknown':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  // Helper to generate YAML for a single resource node
  function getYamlForNode(node: any) {
    if (!node) return '';
    if (node.type === 'deployment') {
      const deployment = deployments.find(d => d.appName === node.name);
      if (deployment) {
        // Only output the Deployment YAML (not Service, Ingress, etc.)
        const allYaml = generateKubernetesYaml(deployment);
        const deploymentYaml = allYaml.split('---').find(y => y.includes('kind: Deployment'));
        return deploymentYaml?.trim() || '';
      }
    }
    if (node.type === 'daemonset') {
      const daemonSet = daemonSets.find(d => d.appName === node.name);
      if (daemonSet) {
        // Only output the DaemonSet YAML (not Service, etc.)
        const allYaml = generateDaemonSetYaml(daemonSet);
        const daemonSetYaml = allYaml.split('---').find(y => y.includes('kind: DaemonSet'));
        return daemonSetYaml?.trim() || '';
      }
    }
    if (node.type === 'service') {
      const deployment = deployments.find(d => `${d.appName}-service` === node.name);
      if (deployment) {
        // Only output the Service YAML
        const allYaml = generateKubernetesYaml(deployment);
        const serviceYaml = allYaml.split('---').find(y => y.includes('kind: Service'));
        return serviceYaml?.trim() || '';
      }
      const daemonSet = daemonSets.find(d => `${d.appName}-service` === node.name);
      if (daemonSet && daemonSet.serviceEnabled) {
        // Only output the Service YAML
        const allYaml = generateDaemonSetYaml(daemonSet);
        const serviceYaml = allYaml.split('---').find(y => y.includes('kind: Service'));
        return serviceYaml?.trim() || '';
      }
    }
    if (node.type === 'pod') {
      // Pods are not first-class in your generator, show deployment/daemonset YAML with a note
      const depName = node.name.split('-').slice(0, -1).join('-');
      const deployment = deployments.find(d => d.appName === depName);
      if (deployment) return generateKubernetesYaml(deployment);
      const daemonSet = daemonSets.find(d => d.appName === depName);
      if (daemonSet) return generateDaemonSetYaml(daemonSet);
    }
    if (node.type === 'configmap') {
      const cm = configMaps.find(cm => cm.name === node.name);
      if (cm) return generateConfigMapYaml([cm]);
    }
    if (node.type === 'secret') {
      const secret = secrets.find(s => s.name === node.name);
      if (secret) return generateSecretYaml([secret]);
    }
    if (node.type === 'namespace') {
      const ns = namespaces.find(ns => ns.name === node.name);
      if (ns) return generateNamespaceYaml([ns]);
    }
    if (node.type === 'serviceaccount') {
      const sa = serviceAccounts.find(sa => sa.name === node.name);
      if (sa) return generateServiceAccountYaml([sa]);
    }
    if (node.type === 'role') {
      // Check if it's a ClusterRole first (cluster-wide namespace)
      if (node.namespace === 'cluster-wide') {
        const clusterRole = clusterRoles.find(cr => cr.metadata.name === node.name);
        if (clusterRole) return generateClusterRoleYaml([clusterRole]);
      }
      // Otherwise it's a regular Role
      const role = roles.find(r => r.metadata.name === node.name);
      if (role) return generateRoleYaml([role]);
    }
    if (node.type === 'job') {
      const job = jobs.find(job => job.name === node.name && job.type === 'job');
      if (job) {
        // Convert Job to JobConfig format
        const labelsObj = job.labels.reduce((acc, label) => {
          acc[label.key] = label.value;
          return acc;
        }, {} as Record<string, string>);
        
        const jobConfig = {
          name: job.name,
          namespace: job.namespace,
          labels: labelsObj,
          annotations: {},
          containers: job.containers,
          completions: job.completions,
          parallelism: job.replicas,
          backoffLimit: job.backoffLimit,
          activeDeadlineSeconds: job.activeDeadlineSeconds,
          restartPolicy: job.restartPolicy
        };
        return generateJobYaml([jobConfig]);
      }
    }
    if (node.type === 'cronjob') {
      const job = jobs.find(job => job.name === node.name && job.type === 'cronjob');
      if (job) {
        // Convert Job to CronJobConfig format
        const labelsObj = job.labels.reduce((acc, label) => {
          acc[label.key] = label.value;
          return acc;
        }, {} as Record<string, string>);
        
        const cronJobConfig = {
          name: job.name,
          namespace: job.namespace,
          labels: labelsObj,
          annotations: {},
          schedule: job.schedule || '',
          concurrencyPolicy: job.concurrencyPolicy,
          startingDeadlineSeconds: job.startingDeadline ? parseInt(job.startingDeadline) : undefined,
          successfulJobsHistoryLimit: job.historySuccess ? parseInt(job.historySuccess) : undefined,
          failedJobsHistoryLimit: job.historyFailure ? parseInt(job.historyFailure) : undefined,
          jobTemplate: {
            name: job.name,
            namespace: job.namespace,
            labels: labelsObj,
            annotations: {},
            completions: job.completions,
            parallelism: job.replicas,
            backoffLimit: job.backoffLimit,
            activeDeadlineSeconds: job.activeDeadlineSeconds,
            restartPolicy: job.restartPolicy,
            containers: job.containers
          }
        };
        return generateCronJobYaml([cronJobConfig]);
      }
    }
    if (node.type === 'ingress') {
      const depName = node.name.replace(/-ingress$/, '');
      const deployment = deployments.find(d => d.appName === depName);
      if (deployment) {
        const allYaml = generateKubernetesYaml(deployment);
        const ingressYaml = allYaml.split('---').find(y => y.includes('kind: Ingress'));
        return ingressYaml?.trim() || '';
      }
    }
    return '# YAML not available for this resource.';
  }

  // Node click handler
  const handleNodeClick = (node: any) => {
    const yaml = getYamlForNode(node);
    setYamlModal({ open: true, title: node.name, yaml });
  };

  const validServiceAccounts = serviceAccounts.filter(sa => sa.name);
  const validJobs = jobs.filter(job => job.name);
  
  // Check if there are any resources for the current filter
  const hasFilteredResources = () => {
    if (filterType === 'all') {
      return validDeployments.length > 0 || validDaemonSets.length > 0 || validServiceAccounts.length > 0 || validJobs.length > 0 || roles.length > 0 || clusterRoles.length > 0 || roleBindings.length > 0 || crds.length > 0 || customResources.length > 0;
    } else if (filterType === 'deployments') {
      return validDeployments.length > 0;
    } else if (filterType === 'daemonsets') {
      return validDaemonSets.length > 0;
    } else if (filterType === 'serviceaccounts') {
      return validServiceAccounts.length > 0;
    } else if (filterType === 'roles') {
      return roles.length > 0;
    } else if (filterType === 'clusterroles') {
      return clusterRoles.length > 0;
    } else if (filterType === 'rolebindings') {
      return roleBindings.length > 0;
    } else if (filterType === 'jobs') {
      return validJobs.filter(job => job.type === 'job').length > 0;
    } else if (filterType === 'cronjobs') {
      return validJobs.filter(job => job.type === 'cronjob').length > 0;
    } else if (filterType === 'configmaps') {
      return configMaps.length > 0;
    } else if (filterType === 'secrets') {
      return secrets.length > 0;
    } else if (filterType === 'namespaces') {
      return namespaces.length > 0;
    } else if (filterType === 'crds') {
      return crds.length > 0 || customResources.length > 0;
    }
    return false;
  };
  
  if (!hasFilteredResources()) {
    return (
      <div className="text-center py-16 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl border border-blue-200">
        <div className="max-w-md mx-auto">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <GitBranch className="w-10 h-10 text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Resources to Visualize</h3>
          <p className="text-gray-600 mb-6">Create your first deployment or service account to see the Visual diagram</p>
          <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <p className="text-sm text-gray-500">
              Add deployments, service accounts, ConfigMaps, and Secrets to visualize your Kubernetes resource flow and dependencies
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative min-h-[600px] bg-gradient-to-br from-gray-50 to-gray-100 p-8 overflow-auto"
      style={{ width: '100%', height: '100%' }}
    >
      {/* Hint for double-click */}
      <div className="mb-4 flex items-center space-x-2 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 text-blue-800 text-sm font-medium shadow-sm">
        <Info className="w-4 h-4 text-blue-400 mr-2" />
        <span>Double-click any component to open its configuration/YAML.</span>
      </div>
      <div
        style={{
          width: 'max-content',
          height: 'max-content',
          minWidth: '100%',
          minHeight: '100%',
          position: 'relative',
        }}
      >
        <svg className="absolute inset-0 pointer-events-none" style={{ width: innerWidth, height: innerHeight }}>
          {flowNodes.map(node => 
            node.dependencies.map(depId => {
              const depNode = flowNodes.find(n => n.id === depId);
              if (!depNode) return null;
              const startX = depNode.position.x + 100;
              const startY = depNode.position.y + 30;
              const endX = node.position.x;
              const endY = node.position.y + 30;
              return (
                <g key={`${depId}-${node.id}`}>
                  <defs>
                    <marker
                      id={`arrow-${depId}-${node.id}`}
                      markerWidth="10"
                      markerHeight="10"
                      refX="9"
                      refY="3"
                      orient="auto"
                      markerUnits="strokeWidth"
                    >
                      <path d="M0,0 L0,6 L9,3 z" fill="#6b7280" />
                    </marker>
                  </defs>
                  <line
                    x1={startX}
                    y1={startY}
                    x2={endX}
                    y2={endY}
                    stroke="#6b7280"
                    strokeWidth="2"
                    markerEnd={`url(#arrow-${depId}-${node.id})`}
                    strokeDasharray={node.type === 'external' ? "5,5" : "none"}
                  />
                </g>
              );
            })
          )}
        </svg>
        {flowNodes.map(node => (
          <div
            key={node.id}
            className={`absolute w-48 p-3 rounded-lg border-2 shadow-lg select-none ${
              node.colorClass || getStatusColor(node.status)
            }`}
            style={{
              left: `${node.position.x}px`,
              top: `${node.position.y}px`,
              transform: 'translate(-50%, -50%)'
            }}
            onClick={() => handleNodeClick(node)}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                {getStatusIcon(node.status)}
                {getResourceIcon(node.type)}
                {/* Show replica count badge for pod node */}
                {node.type === 'pod' && typeof node.metadata?.replicas === 'number' && node.metadata.replicas > 1 && (
                  <span className="ml-2 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
                    x{node.metadata.replicas}
                  </span>
                )}
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${getSyncStatusColor(node.syncStatus)}`}>
                {node.syncStatus}
              </span>
            </div>
            <div className="text-sm font-medium text-gray-900 mb-1 truncate" title={node.name}>
              {node.name}
            </div>
            <div className="text-xs text-gray-600 mb-2">
              {node.type} • {node.namespace}
            </div>
            {showDetails && node.metadata && (
              <div className="space-y-1 text-xs text-gray-600">
                {node.metadata.replicas !== undefined && (
                  <div className="flex items-center space-x-1">
                    <Users className="w-3 h-3" />
                    <span>{node.metadata.readyReplicas || 0}/{node.metadata.replicas}</span>
                  </div>
                )}
                {node.metadata.containers !== undefined && (
                  <div className="flex items-center space-x-1">
                    <Server className="w-3 h-3" />
                    <span>{node.metadata.containers} containers</span>
                  </div>
                )}
                {node.metadata.ports && (
                  <div className="flex items-center space-x-1">
                    <Network className="w-3 h-3" />
                    <span>Port {node.metadata.ports.join(', ')}</span>
                  </div>
                )}
                {node.metadata.dataKeys !== undefined && (
                  <div className="flex items-center space-x-1">
                    <Settings className="w-3 h-3" />
                    <span>{node.metadata.dataKeys} keys</span>
                  </div>
                )}
                {node.metadata.secrets !== undefined && (
                  <div className="flex items-center space-x-1">
                    <Key className="w-3 h-3" />
                    <span>{node.metadata.secrets} secrets</span>
                  </div>
                )}
                {node.metadata.imagePullSecrets !== undefined && (
                  <div className="flex items-center space-x-1">
                    <Key className="w-3 h-3" />
                    <span>{node.metadata.imagePullSecrets} image pull secrets</span>
                  </div>
                )}
                {/* Role-specific metadata */}
                {node.type === 'role' && (
                  <>
                    {node.metadata.rules !== undefined && (
                      <div className="flex items-center space-x-1">
                        <Key className="w-3 h-3" />
                        <span>{node.metadata.rules} rule{node.metadata.rules !== 1 ? 's' : ''}</span>
                      </div>
                    )}
                    {node.metadata.apiGroups && node.metadata.apiGroups.length > 0 && (
                      <div className="flex items-center space-x-1">
                        <Settings className="w-3 h-3" />
                        <span title={node.metadata.apiGroups.join(', ')}>
                          {node.metadata.apiGroups.slice(0, 2).join(', ')}
                          {node.metadata.apiGroups.length > 2 && ` +${node.metadata.apiGroups.length - 2}`}
                        </span>
                      </div>
                    )}
                    {node.metadata.resources && node.metadata.resources.length > 0 && (
                      <div className="flex items-center space-x-1">
                        <Server className="w-3 h-3" />
                        <span title={node.metadata.resources.join(', ')}>
                          {node.metadata.resources.slice(0, 2).join(', ')}
                          {node.metadata.resources.length > 2 && ` +${node.metadata.resources.length - 2}`}
                        </span>
                      </div>
                    )}
                    {node.metadata.verbs && node.metadata.verbs.length > 0 && (
                      <div className="flex items-center space-x-1">
                        <Network className="w-3 h-3" />
                        <span title={node.metadata.verbs.join(', ')}>
                          {node.metadata.verbs.slice(0, 2).join(', ')}
                          {node.metadata.verbs.length > 2 && ` +${node.metadata.verbs.length - 2}`}
                        </span>
                      </div>
                    )}
                  </>
                )}
                {node.metadata.lastSync && (
                  <div className="flex items-center space-x-1">
                    <GitCommit className="w-3 h-3" />
                    <span>{new Date(node.metadata.lastSync).toLocaleTimeString()}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      {/* YAML Modal */}
      {yamlModal?.open && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl w-full relative">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700"
              onClick={() => setYamlModal(null)}
            >
              <X className="w-6 h-6" />
            </button>
            <div className="overflow-y-auto" style={{ maxHeight: '70vh' }}>
              <YamlPreview yaml={yamlModal.yaml} name={yamlModal.title} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 