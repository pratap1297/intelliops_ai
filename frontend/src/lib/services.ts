import toast from 'react-hot-toast';

interface DocumentAnalysisResponse {
  resources: Array<{
    id: string;
    type: string;
    name: string;
    properties: Record<string, any>;
  }>;
  suggestions?: string[];
  errors?: string[];
}

interface TerraformGenerationResponse {
  terraform: string;
  rollback: string;
  validation: {
    errors: string[];
    warnings: string[];
  };
}

interface ExecutionUpdate {
  status: 'running' | 'completed' | 'failed';
  step: string;
  message: string;
  progress: number;
  timestamp: string;
  details?: any;
}

export async function analyzeInfrastructureDocument(file: File): Promise<DocumentAnalysisResponse> {
  try {
    // Simulate API call to LLM service
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Validate file size
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      throw new Error('File size exceeds 10MB limit');
    }

    // Validate file type
    const validTypes = ['application/pdf', 'image/png', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    if (!validTypes.includes(file.type)) {
      throw new Error('Invalid file type. Please upload PDF, PNG, DOCX, or XLSX files.');
    }

    // Simulated response
    return {
      resources: [
        {
          id: Date.now().toString(),
          type: 'EC2 Instance',
          name: 'WebServer',
          properties: {
            'AMI ID': 'ami-0abcdef1234567890',
            'Instance Type': 't2.micro',
            'Key Name': 'my-keypair',
            'Subnet ID': 'subnet-0123456789abcdef0',
            'Security Group IDs': 'sg-01234567',
            'Public IP': 'true',
            'Tags': '{"Name": "MyEC2Instance"}',
            'User Data': '#!/bin/bash\necho "Hello World"',
          }
        }
      ],
      suggestions: [
        'Consider enabling detailed monitoring for production instances',
        'Make sure to use appropriate security group rules'
      ]
    };
  } catch (error) {
    console.error('Document analysis failed:', error);
    const message = error instanceof Error ? error.message : 'Failed to analyze infrastructure document';
    toast.error(message);
    throw new Error(message);
  }
}

export async function generateTerraformCode(resources: any[]): Promise<TerraformGenerationResponse> {
  try {
    // Validate resources before generating code
    if (!resources || resources.length === 0) {
      throw new Error('No resources defined');
    }

    // Validate each resource
    const errors: string[] = [];
    const warnings: string[] = [];

    resources.forEach((resource, index) => {
      if (!resource.name) {
        errors.push(`Resource #${index + 1} of type ${resource.type} is missing a name`);
      }

      // Check mandatory fields based on resource type
      const mandatoryFields = getMandatoryFields(resource.type);
      mandatoryFields.forEach(field => {
        if (!resource.properties[field]) {
          errors.push(`${resource.type} "${resource.name || `#${index + 1}`}" is missing mandatory field: ${field}`);
        }
      });

      // Validate property values
      Object.entries(resource.properties).forEach(([key, value]) => {
        if (typeof value === 'string' && value.trim() === '') {
          errors.push(`${resource.type} "${resource.name || `#${index + 1}`}" has empty value for field: ${key}`);
        }
      });

      // Add warnings for best practices
      if (!resource.properties['Tags']) {
        warnings.push(`Consider adding tags to ${resource.type} "${resource.name || `#${index + 1}`}"`);
      }
    });

    if (errors.length > 0) {
      return {
        terraform: '',
        rollback: '',
        validation: {
          errors,
          warnings
        }
      };
    }

    // Generate the Terraform code
    let terraformCode = `# Generated Terraform Configuration
# Provider Configuration
provider "aws" {
  region = "us-east-1"
}

# Resource Definitions
`;

    // Generate code for each resource
    resources.forEach(resource => {
      const resourceName = resource.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const resourceType = resource.type.toLowerCase().replace(/ /g, '_');

      terraformCode += `
# ${resource.type}: ${resource.name}
resource "aws_${resourceType}" "${resourceName}" {
`;
      
      // Add resource properties
      Object.entries(resource.properties).forEach(([key, value]) => {
        if (value) { // Only include non-empty values
          const propName = key.toLowerCase().replace(/ /g, '_');
          
          // Handle different value types
          let formattedValue = value;
          if (typeof value === 'string') {
            try {
              // Try to parse as JSON first
              if (value.trim().startsWith('{') && value.trim().endsWith('}')) {
                const jsonValue = JSON.parse(value);
                formattedValue = JSON.stringify(jsonValue, null, 2)
                  .split('\n')
                  .map((line, i) => i === 0 ? line : '    ' + line)
                  .join('\n');
              } else if (value.includes('\n')) {
                // Handle multiline strings
                formattedValue = `<<-EOF\n${value}\nEOF`;
              } else if (['true', 'false'].includes(value.toLowerCase())) {
                // Handle boolean values
                formattedValue = value.toLowerCase();
              } else {
                // Default to quoted string
                formattedValue = `"${value}"`;
              }
            } catch {
              // If JSON parsing fails, treat as regular string
              formattedValue = `"${value}"`;
            }
          }
          
          terraformCode += `  ${propName} = ${formattedValue}\n`;
        }
      });
      
      terraformCode += '}\n';
    });

    // Generate rollback plan
    const rollbackCode = `# Rollback Plan
# The following resources will be destroyed if deployment fails:
${resources.map(resource => {
  const resourceName = resource.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const resourceType = resource.type.toLowerCase().replace(/ /g, '_');
  return `resource "aws_${resourceType}" "${resourceName}" {
  # This resource will be destroyed
  # Original configuration will be preserved in state
}`;
}).join('\n\n')}`;

    return {
      terraform: terraformCode,
      rollback: rollbackCode,
      validation: {
        errors: [],
        warnings
      }
    };
  } catch (error) {
    console.error('Terraform generation failed:', error);
    return {
      terraform: '',
      rollback: '',
      validation: {
        errors: [error instanceof Error ? error.message : 'Failed to generate Terraform configuration'],
        warnings: []
      }
    };
  }
}

// Helper function to get mandatory fields for each resource type
function getMandatoryFields(resourceType: string): string[] {
  const mandatoryFields: Record<string, string[]> = {
    'EC2 Instance': ['AMI ID', 'Instance Type'],
    'S3 Bucket': ['Bucket Name'],
    'RDS Instance': ['Allocated Storage', 'Engine', 'Instance Class', 'DB Name', 'Username', 'Password'],
    'Lambda Function': ['Function Name', 'Runtime', 'Role', 'Handler'],
    'SNS Topic': ['Topic Name']
  };

  return mandatoryFields[resourceType] || [];
}

export async function* streamExecutionUpdates(): AsyncGenerator<ExecutionUpdate> {
  try {
    const updates: ExecutionUpdate[] = [
      {
        status: 'running',
        step: 'init',
        message: 'Initializing Terraform...',
        progress: 10,
        timestamp: new Date().toISOString()
      },
      {
        status: 'running',
        step: 'plan',
        message: 'Planning infrastructure changes...',
        progress: 30,
        timestamp: new Date().toISOString()
      },
      {
        status: 'running',
        step: 'apply',
        message: 'Creating resources...',
        progress: 60,
        timestamp: new Date().toISOString()
      },
      {
        status: 'completed',
        step: 'complete',
        message: 'Infrastructure deployed successfully',
        progress: 100,
        timestamp: new Date().toISOString()
      }
    ];

    for (const update of updates) {
      await new Promise(resolve => setTimeout(resolve, 1500));
      yield update;
    }
  } catch (error) {
    yield {
      status: 'failed',
      step: 'error',
      message: error instanceof Error ? error.message : 'Execution failed',
      progress: 0,
      timestamp: new Date().toISOString()
    };
  }
}