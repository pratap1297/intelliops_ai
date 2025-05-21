import { Prompt, CloudProvider } from '../types';

// Helper function to flatten nested prompts structure
function flattenPrompts(provider: CloudProvider, categoryData: Record<string, any[]>) {
  const prompts: Prompt[] = [];
  let id = 1;

  Object.entries(categoryData).forEach(([category, items]) => {
    items.forEach((item: any) => {
      prompts.push({
        id: `${provider}-${id++}`,
        title: item.label,
        description: getPromptDescription(item.label, provider, category),
        category: category,
        command: item.prompt,
        cloud_provider: provider,
        user_id: 'system',
        is_system: true,
        is_favorite: false
      });
    });
  });

  // Add some sample user-created prompts
  prompts.push({
    id: `${provider}-user-1`,
    title: 'My Custom EC2 Setup',
    description: 'Launch EC2 instance with my preferred configuration',
    category: 'EC2',
    command: 'create ec2 instance t2.micro ubuntu us-east-1 with-monitoring',
    cloud_provider: provider,
    user_id: 'user-1',
    is_system: false,
    is_favorite: true
  });

  return prompts;
}

// Helper function to generate meaningful descriptions
function getPromptDescription(label: string, provider: CloudProvider, category: string): string {
  const providerName = provider.toUpperCase();
  
  if (label.toLowerCase().includes('create')) {
    return `Provision a new ${category} resource in your ${providerName} infrastructure`;
  } else if (label.toLowerCase().includes('delete')) {
    return `Safely remove a ${category} resource from your ${providerName} infrastructure`;
  } else if (label.toLowerCase().includes('modify') || label.toLowerCase().includes('update')) {
    return `Modify existing ${category} resource settings in your ${providerName} infrastructure`;
  } else if (label.toLowerCase().includes('list')) {
    return `Get a detailed list of ${category} resources in your ${providerName} infrastructure`;
  } else if (label.toLowerCase().includes('scan')) {
    return `Perform a security scan on your ${providerName} ${category} resources`;
  } else if (category === 'Process AskHub' || category === 'Knowledgebase AskHub') {
    return `Access ${providerName} specific documentation and knowledge resources`;
  } else if (category === 'CLI Commands') {
    return `Execute ${providerName} CLI commands directly from the interface`;
  }
  
  return `Manage ${category} resources in your ${providerName} infrastructure`;
}

// AWS and GCP prompts data
const cloudData = {
  aws: {
    "Provision EC2": [
      {"label": "Create EC2 Instance", "prompt": "create ec2 instance t2.micro ubuntu us-east-1"},
      {"label": "Delete EC2 Instance", "prompt": "delete ec2 instance abc AMAN"}
    ],
    "Provision S3": [
      {"label": "Create S3 Bucket", "prompt": "create s3 bucket test-1234567"},
      {"label": "Delete S3 Bucket", "prompt": "delete s3 bucket test-1234567 AMAN"}
    ],
    "Patch Management": [
      {"label": "Scan Patches with Baseline", "prompt": "scan patches i-xxx with-baseline"},
      {"label": "Scan Patches without Baseline", "prompt": "scan patches i-xxx without-baseline"},
      {"label": "Install Patches with Baseline", "prompt": "install patches with-baseline"},
      {"label": "Install Patches without Baseline", "prompt": "install patches without-baseline"}
    ],
    "Auto Heal": [
      {"label": "Summarize Log Errors", "prompt": "summarize errors"},
      {"label": "Scan Log Group Errors", "prompt": "scan /aws/logs/errors"},
      {"label": "Show Error Details", "prompt": "show error details /aws/logs/errors/"},
      {"label": "Create Error Incident", "prompt": "create incident"},
      {"label": "List Incidents", "prompt": "list incidents"}
    ],
    "List Resources": [
      {"label": "List EC2 Instances", "prompt": "list ec2"},
      {"label": "List S3 Buckets", "prompt": "list s3"}
    ],
    "CLI Commands": [
      {"label": "AWS Configure", "prompt": "aws configure"},
      {"label": "AWS Version", "prompt": "aws --version"},
      {"label": "List AWS Regions", "prompt": "aws ec2 describe-regions"},
      {"label": "List AWS Profiles", "prompt": "aws configure list-profiles"},
      {"label": "AWS Help", "prompt": "aws help"}
    ]
  },
  gcp: {
    "Google Compute Engine": [
      {"label": "Create VM (Virtual Machine)", "prompt": "Create GCE name ABC instance type n1-standard-1 OS image debian 11 region us-east1 network default, Project ID XYZ user ID a@hcltech.com"},
      {"label": "Delete VM (Virtual Machine)", "prompt": "Delete GCE name ABC Project ID XYZ user ID a@hcltech.com"},
      {"label": "Modify VM (Virtual Machine)", "prompt": "Update GCE instance type n2-standard-2 VM name ABC Project ID XYZ user ID a@hcltech.com"}
    ],
    "Storage Bucket": [
      {"label": "Create Storage Bucket", "prompt": "Create bucket name ABC type standard Project ID XYZ user ID a@hcltech.com"},
      {"label": "Delete Storage Bucket", "prompt": "Delete bucket name ABC Project ID XYZ user ID a@hcltech.com"},
      {"label": "Modify Storage Bucket", "prompt": "Update bucket name ABC versioning 3 Project ID XYZ user ID a@hcltech.com"}
    ],
    "Filestore": [
      {"label": "Create Filestore", "prompt": "Create filestore name ABC tier standard Project ID XYZ user ID a@hcltech.com"},
      {"label": "Delete Filestore", "prompt": "Delete filestore name ABC Project ID XYZ user ID a@hcltech.com"},
      {"label": "Modify Filestore", "prompt": "Update filestore name ABC tier premium Project ID XYZ user ID a@hcltech.com"}
    ],
    "Load Balancer": [
      {"label": "Create Internal Load Balancer", "prompt": "Create internal load balancer name ABC backend-service XYZ region us-east1 Project ID XYZ user ID a@hcltech.com"},
      {"label": "Delete Internal Load Balancer", "prompt": "Delete internal load balancer name ABC Project ID XYZ user ID a@hcltech.com"}
    ],
    "VPC & Subnet": [
      {"label": "Create a Subnet in existing VPC", "prompt": "Create subnet name ABC network default region us-east1 range 10.0.0.0/24 Project ID XYZ user ID a@hcltech.com"},
      {"label": "Delete a Subnet in existing VPC", "prompt": "Delete subnet name ABC network default region us-east1 Project ID XYZ user ID a@hcltech.com"}
    ],
    "Firewall": [
      {"label": "List open firewall rules/ports in a project", "prompt": "Get Firewall rules Project ID user ID is a@hcltech.com"},
      {"label": "Create Firewall Rule", "prompt": "add inbound firewall rule source 0.0.0.0/0 target IP/Range port 80,443 Project ID XYZ user ID a@hcltech.com"},
      {"label": "Delete Firewall Rule", "prompt": "delete inbound firewall rule name ABC Project ID XYZ user ID a@hcltech.com"}
    ],
    "RBAC": [
      {"label": "Assign Predefined Role", "prompt": "add role viewer email id a@hcltech.com Project ID XYZ user ID a@hcltech.com"},
      {"label": "Remove Predefined Role", "prompt": "remove role viewer email id a@hcltech.com Project ID XYZ user ID a@hcltech.com"}
    ],
    "Inventory Details": [
      {"label": "Get VM Details", "prompt": "Get GCE VM Project ID user ID is a@hcltech.com"},
      {"label": "Get Persistent Disk Count and Capacity", "prompt": "Get PD Project ID user ID is a@hcltech.com"},
      {"label": "Get Compute Engine Utilization Report", "prompt": "Get GCE Utilization Project ID user ID is a@hcltech.com"}
    ],
    "Process AskHub": [
      {"label": "Team FAQs", "prompt": "Internal Team can ask FAQs related to team, process, environment, key people, key Links/URLs etc."},
      {"label": "Onboarding Activities", "prompt": "List onboarding activities for new employee"}
    ],
    "Knowledgebase AskHub": [
      {"label": "Case Studies", "prompt": "People can check for existing Case Studies, Learnings, IAC Modules, Skills, capability etc."},
      {"label": "List Case Studies", "prompt": "list available case studies"}
    ],
    "CLI Commands": [
      {"label": "Initialize gcloud CLI", "prompt": "gcloud init"},
      {"label": "List gcloud Configurations", "prompt": "gcloud config configurations list"},
      {"label": "Set Project", "prompt": "gcloud config set project PROJECT_ID"},
      {"label": "List Active Account", "prompt": "gcloud auth list"},
      {"label": "gcloud Version", "prompt": "gcloud version"},
      {"label": "List Available Components", "prompt": "gcloud components list"}
    ]
  }
};

// Azure prompts data
const azureData = {
  "Virtual Machines": [
    {"label": "Create Azure VM", "prompt": "create azure vm --name myVM --resource-group myRG --image Ubuntu2004"},
    {"label": "Delete Azure VM", "prompt": "delete azure vm --name myVM --resource-group myRG"},
    {"label": "List Azure VMs", "prompt": "list azure vms --resource-group myRG"}
  ],
  "Storage": [
    {"label": "Create Storage Account", "prompt": "create azure storage account --name mystorageaccount --resource-group myRG"},
    {"label": "Create Container", "prompt": "create azure storage container --name mycontainer --account-name mystorageaccount"}
  ],
  "Networking": [
    {"label": "Create Virtual Network", "prompt": "create azure vnet --name myvnet --resource-group myRG --address-prefix 10.0.0.0/16"},
    {"label": "Create Subnet", "prompt": "create azure subnet --name mysubnet --vnet-name myvnet --resource-group myRG --address-prefix 10.0.1.0/24"}
  ]
};

// On-premises prompts data
const onPremData = {
  "VMware": [
    {"label": "Create VMware VM", "prompt": "create vmware vm --name myVM --datastore myDatastore --network myNetwork"},
    {"label": "Delete VMware VM", "prompt": "delete vmware vm --name myVM"},
    {"label": "List VMware VMs", "prompt": "list vmware vms"}
  ],
  "Storage": [
    {"label": "Create NFS Share", "prompt": "create nfs share --name myshare --path /exports/myshare"},
    {"label": "Create iSCSI LUN", "prompt": "create iscsi lun --name mylun --size 100GB"}
  ],
  "Networking": [
    {"label": "Create VLAN", "prompt": "create vlan --id 100 --name myvlan"},
    {"label": "Configure Switch Port", "prompt": "configure switch port --interface eth0 --vlan 100"}
  ]
};

// Helper function to convert provider-specific data to prompts
function convertToPrompts(data: Record<string, any[]>, provider: CloudProvider): Prompt[] {
  return Object.entries(data).flatMap(([category, items], categoryIndex) =>
    items.map((item, itemIndex) => ({
      id: `${provider}-${categoryIndex}-${itemIndex}`,
      title: item.label,
      description: getPromptDescription(item.label, provider, category),
      category: category,
      command: item.prompt,
      cloud_provider: provider,
      user_id: 'system',
      is_system: true,
      is_favorite: false
    }))
  );
}

// Combine all prompts
export const dummyPrompts: Prompt[] = [
  ...flattenPrompts('aws', cloudData.aws),
  ...flattenPrompts('gcp', cloudData.gcp),
  ...convertToPrompts(azureData, 'azure'),
  ...convertToPrompts(onPremData, 'onprem')
];

export const getPromptsByProvider = (provider: CloudProvider) => {
  console.log(`Getting prompts for provider: ${provider}`);
  const providerPrompts = dummyPrompts.filter(prompt => prompt.cloud_provider === provider);
  console.log(`Found ${providerPrompts.length} prompts for ${provider}`);
  
  // If no prompts found for this provider, return AWS prompts as fallback
  if (providerPrompts.length === 0) {
    console.warn(`No prompts found for provider ${provider}, falling back to AWS`);
    return dummyPrompts.filter(prompt => prompt.cloud_provider === 'aws');
  }
  
  return providerPrompts;
};