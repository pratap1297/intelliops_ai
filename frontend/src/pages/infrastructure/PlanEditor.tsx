import React, { useState, useEffect } from 'react';
import { Upload, FileType, AlertCircle, X, Loader, Plus, Trash2, Code, Play } from 'lucide-react';
import toast from 'react-hot-toast';
import { Header } from '../../components/Header';
import { AppLayout } from '../../components/AppLayout';
import { generateTerraformCode } from '../../lib/services';
import { v4 as uuidv4 } from 'uuid';

interface Resource {
  id: string;
  type: string;
  name: string;
  properties: { [key: string]: any };
}

const RESOURCE_TYPES = {
  'EC2 Instance': {
    mandatory: {
      'AMI ID': '',
      'Instance Type': '',
    },
    optional: {
      'Key Name': 'e.g., my-keypair',
      'Subnet ID': 'e.g., subnet-0123456789abcdef0',
      'Security Group IDs': 'e.g., sg-01234567',
      'Public IP': 'true/false',
      'Tags': 'e.g., {"Name": "MyEC2Instance"}',
      'User Data': 'e.g., #!/bin/bash\necho "Hello World"',
    }
  },
  'S3 Bucket': {
    mandatory: {
      'Bucket Name': '',
    },
    optional: {
      'ACL': 'e.g., private',
      'Versioning': 'true/false',
      'Logging Target Bucket': 'e.g., logs-bucket',
      'Logging Target Prefix': 'e.g., s3-logs/',
      'Website Index Document': 'e.g., index.html',
      'Website Error Document': 'e.g., error.html',
      'Tags': 'e.g., {"Environment": "Dev"}',
      'Policy': 'e.g., {"Version": "2012-10-17", ...}',
    }
  },
  'RDS Instance': {
    mandatory: {
      'Allocated Storage': '',
      'Engine': '',
      'Instance Class': '',
      'DB Name': '',
      'Username': '',
      'Password': '',
    },
    optional: {
      'DB Subnet Group': 'e.g., default',
      'Security Group IDs': 'e.g., sg-01234567',
      'Multi AZ': 'true/false',
      'Backup Retention Period': 'e.g., 7',
      'Maintenance Window': 'e.g., Mon:03:00-Mon:04:00',
      'Tags': 'e.g., {"Environment": "Dev"}',
      'Parameter Group': 'e.g., default.mysql5.7',
    }
  },
  'Lambda Function': {
    mandatory: {
      'Function Name': '',
      'Runtime': '',
      'Role': '',
      'Handler': '',
    },
    optional: {
      'Description': 'e.g., My Lambda function',
      'Memory Size': 'e.g., 128',
      'Timeout': 'e.g., 3',
      'Environment Variables': 'e.g., {"ENV": "dev"}',
      'Tags': 'e.g., {"Environment": "Dev"}',
      'VPC Config': 'e.g., {"subnet_ids": [], "security_group_ids": []}',
      'Dead Letter Config': 'e.g., {"target_arn": "arn:aws:sqs:..."}',
    }
  },
  'SNS Topic': {
    mandatory: {
      'Topic Name': '',
    },
    optional: {
      'Display Name': 'e.g., My SNS Topic',
      'Tags': 'e.g., {"Environment": "Dev"}',
      'Policy': 'e.g., {"Version": "2012-10-17", ...}',
    }
  }
};

export default function PlanEditor() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [showTerraform, setShowTerraform] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [terraformCode, setTerraformCode] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);

  useEffect(() => {
    const savedAnalysis = localStorage.getItem('infrastructure_analysis');
    if (savedAnalysis) {
      try {
        const analysis = JSON.parse(savedAnalysis);
        if (analysis.resources && analysis.resources.length > 0) {
          const loadedResources = analysis.resources.map((resource: Resource) => ({
            ...resource,
            id: uuidv4()
          }));
          setResources(loadedResources);
        }
      } catch (error) {
        console.error('Failed to parse saved analysis:', error);
        toast.error('Failed to load saved infrastructure analysis');
      }
    }
  }, []);

  const handleAddResource = () => {
    const newResource: Resource = {
      id: uuidv4(),
      type: 'EC2 Instance',
      name: '',
      properties: {}
    };
    setResources(prev => [...prev, newResource]);
  };

  const handleDeleteResource = (id: string) => {
    setResources(prev => prev.filter(r => r.id !== id));
  };

  const handleResourceChange = (id: string, field: string, value: string) => {
    setResources(prev => prev.map(resource => {
      if (resource.id === id) {
        if (field === 'type') {
          const resourceType = value as keyof typeof RESOURCE_TYPES;
          return {
            ...resource,
            type: value,
            properties: {}
          };
        }
        if (field === 'name') {
          return { ...resource, name: value };
        }
        return {
          ...resource,
          properties: { ...resource.properties, [field]: value }
        };
      }
      return resource;
    }));
  };

  const handleShowTerraform = async () => {
    setIsGenerating(true);
    try {
      const result = await generateTerraformCode(resources);
      setTerraformCode(result.terraform);
      setValidationErrors(result.validation.errors);
      setValidationWarnings(result.validation.warnings);
      
      if (result.validation.errors.length > 0) {
        toast.error('Please fix validation errors before proceeding');
      } else {
        setShowTerraform(true);
        if (result.validation.warnings.length > 0) {
          toast.warning('Review warnings before proceeding');
        }
      }

      if (result.rollback) {
        localStorage.setItem('rollback_plan', result.rollback);
      }
    } catch (error) {
      console.error('Failed to generate Terraform:', error);
      toast.error('Failed to generate Terraform configuration');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExecutePlan = async () => {
    if (validationErrors.length > 0) {
      toast.error('Please fix validation errors before executing the plan');
      return;
    }

    setIsExecuting(true);
    try {
      localStorage.setItem('current_plan', JSON.stringify({
        resources,
        terraform: terraformCode
      }));

      window.location.href = '/infrastructure/execution';
    } catch (error) {
      console.error('Failed to execute plan:', error);
      toast.error('Failed to execute plan');
      setIsExecuting(false);
    }
  };

  const renderResourceProperties = (resource: Resource, type: 'mandatory' | 'optional') => {
    const resourceType = resource.type as keyof typeof RESOURCE_TYPES;
    const properties = RESOURCE_TYPES[resourceType][type];
    
    return Object.entries(properties).map(([key, hint]) => (
      <div key={`${resource.id}-${key}`} className="col-span-1">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {key}
          {type === 'optional' && (
            <span className="text-xs text-gray-400 italic block">
              {hint}
            </span>
          )}
        </label>
        <input
          type="text"
          value={resource.properties[key] || ''}
          onChange={(e) => handleResourceChange(resource.id, key, e.target.value)}
          className="w-full rounded-lg border-2 border-gray-100 shadow-[0_1px_1px_rgba(0,0,0,0.05)] focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all duration-200"
          placeholder={type === 'mandatory' ? `Enter ${key.toLowerCase()}` : ''}
          required={type === 'mandatory'}
        />
      </div>
    ));
  };

  return (
    <AppLayout>
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header subtitle="Design and configure your cloud resources" />
        
        <div className="flex-1 p-8 overflow-auto">
          <div className="max-w-6xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm border-2 border-blue-900/10 overflow-hidden">
              <div className="px-8 py-6 border-b border-blue-900/10">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      Resources Configuration
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      Define your infrastructure components and their properties
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleShowTerraform}
                      disabled={isGenerating || resources.length === 0}
                      className="flex items-center px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    >
                      {isGenerating ? (
                        <Loader className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Code className="w-4 h-4 mr-2" />
                      )}
                      Preview Terraform
                    </button>
                    <button
                      onClick={handleExecutePlan}
                      disabled={isExecuting || validationErrors.length > 0}
                      className="flex items-center px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
                    >
                      {isExecuting ? (
                        <Loader className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Play className="w-4 h-4 mr-2" />
                      )}
                      {isExecuting ? 'Executing...' : 'Execute Plan'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-8">
                <div className="space-y-6">
                  {resources.map((resource) => (
                    <div
                      key={resource.id}
                      className="group bg-white rounded-xl border-2 border-blue-900/10 hover:border-blue-500 transition-all duration-200"
                    >
                      <div className="p-6 border-b border-blue-900/10">
                        <div className="flex items-start justify-between">
                          <div className="grid grid-cols-2 gap-6 flex-1 mr-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Resource Type
                              </label>
                              <select
                                value={resource.type}
                                onChange={(e) => handleResourceChange(resource.id, 'type', e.target.value)}
                                className="w-full rounded-lg border-2 border-gray-100 shadow-[0_1px_1px_rgba(0,0,0,0.05)] focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all duration-200 bg-white"
                              >
                                {Object.keys(RESOURCE_TYPES).map((type) => (
                                  <option key={`${resource.id}-${type}`} value={type}>{type}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Resource Name
                              </label>
                              <input
                                type="text"
                                value={resource.name}
                                onChange={(e) => handleResourceChange(resource.id, 'name', e.target.value)}
                                className="w-full rounded-lg border-2 border-gray-100 shadow-[0_1px_1px_rgba(0,0,0,0.05)] focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all duration-200"
                                placeholder="Enter resource name"
                                required
                              />
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteResource(resource.id)}
                            className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-all duration-200 opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>

                      <div className="p-6 space-y-6">
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                            <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                            Required Properties
                          </h4>
                          <div className="grid grid-cols-3 gap-4">
                            {renderResourceProperties(resource, 'mandatory')}
                          </div>
                        </div>

                        <div className="border-t border-blue-900/10 pt-6">
                          <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                            <span className="w-2 h-2 bg-gray-300 rounded-full mr-2"></span>
                            Optional Properties
                          </h4>
                          <div className="grid grid-cols-3 gap-4">
                            {renderResourceProperties(resource, 'optional')}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleAddResource}
                  className="mt-6 flex items-center px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border-2 border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Resource
                </button>

                {(validationErrors.length > 0 || validationWarnings.length > 0) && (
                  <div className="mt-6 space-y-4">
                    {validationErrors.length > 0 && (
                      <div className="p-4 bg-red-50 rounded-lg border border-red-100">
                        <div className="flex items-center space-x-3">
                          <AlertCircle className="w-5 h-5 text-red-600" />
                          <div>
                            <h3 className="font-medium text-red-900">Validation Errors</h3>
                            <ul className="mt-2 text-sm text-red-800 list-disc list-inside">
                              {validationErrors.map((error, index) => (
                                <li key={`error-${index}`}>{error}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}

                    {validationWarnings.length > 0 && (
                      <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-100">
                        <div className="flex items-center space-x-3">
                          <AlertCircle className="w-5 h-5 text-yellow-600" />
                          <div>
                            <h3 className="font-medium text-yellow-900">Warnings</h3>
                            <ul className="mt-2 text-sm text-yellow-800 list-disc list-inside">
                              {validationWarnings.map((warning, index) => (
                                <li key={`warning-${index}`}>{warning}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showTerraform && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[80vh] overflow-hidden shadow-xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Terraform Configuration
                </h2>
                <button
                  onClick={() => setShowTerraform(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-auto max-h-[60vh] font-mono text-sm">
                <code>{terraformCode}</code>
              </pre>
              <div className="mt-4 flex justify-end gap-3">
                <button
                  onClick={() => setShowTerraform(false)}
                  className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border-2 border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
                >
                  Close
                </button>
                <button
                  onClick={handleExecutePlan}
                  disabled={isExecuting || validationErrors.length > 0}
                  className="px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
                >
                  {isExecuting ? 'Executing...' : 'Execute Plan'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

export { PlanEditor }