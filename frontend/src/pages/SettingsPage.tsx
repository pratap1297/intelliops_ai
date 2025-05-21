import React, { useState, useEffect } from 'react';
import { Save, AlertCircle, CheckCircle, Cloud, Database, Server, Aperture, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { CloudProvider } from '../types';
import { AppLayout } from '../components/AppLayout';
import { Header } from '../components/Header';
import { authService } from '../lib/auth-service';
import { API_BASE_URL } from '../config';

interface ProviderConfig {
  id: CloudProvider;
  label: string;
  icon: React.ElementType;
  color: string;
}

const providers: ProviderConfig[] = [
  { id: 'aws', label: 'AWS', icon: Cloud, color: 'bg-yellow-500' },
  { id: 'azure', label: 'Azure', icon: Aperture, color: 'bg-blue-500' },
  { id: 'gcp', label: 'GCP', icon: Database, color: 'bg-green-500' },
  { id: 'onprem', label: 'On-Prem', icon: Server, color: 'bg-gray-500' }
];

interface FormField {
  label: string;
  type: 'text' | 'password' | 'dropdown' | 'readonly';
  placeholder?: string;
  options?: string[];
  required?: boolean;
  value: string;
}

type ProviderFields = Record<string, FormField>;

interface ProviderSection {
  title: string;
  fields: ProviderFields;
}

type ProviderType = CloudProvider;

export function SettingsPage() {
  const [activeProvider, setActiveProvider] = useState<ProviderType>('aws');
  // State for admin status and loading
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is admin on component mount
  useEffect(() => {
    const checkUserRole = () => {
      const currentUser = authService.getUser();
      if (currentUser) {
        setIsAdmin(currentUser.is_admin || false);
      }
      setIsLoading(false);
    };
    
    checkUserRole();
  }, []);

  const [formData, setFormData] = useState<Record<ProviderType, ProviderSection>>({
    aws: {
      title: 'AWS Bedrock Configuration',
      fields: {
        agent_id: {
          label: 'Bedrock Agent ID',
          type: 'text',
          placeholder: 'e.g., NOPNUNTEOB',
          required: true,
          value: ''
        },
        agent_alias_id: {
          label: 'Bedrock Agent Alias ID',
          type: 'text',
          placeholder: 'e.g., UHMWSV1HUM',
          required: true,
          value: ''
        }
      }
    },
    azure: {
      title: 'Azure Configuration',
      fields: {
        endpoint: {
          label: 'Chat API Endpoint',
          type: 'text',
          placeholder: 'https://api.azure.example.com/chat',
          required: true,
          value: ''
        }
      }
    },
    gcp: {
      title: 'GCP Configuration',
      fields: {
        session_endpoint: {
          label: 'Session Endpoint',
          type: 'text',
          placeholder: 'http://34.58.224.198:8000/sessions',
          required: true,
          value: ''
        },
        agent_run_endpoint: {
          label: 'Agent Run Endpoint',
          type: 'text',
          placeholder: 'http://34.58.224.198:8000/agent/run',
          required: true,
          value: ''
        }
      }
    },
    onprem: {
      title: 'On-Prem Configuration',
      fields: {
        endpoint: {
          label: 'Chat API Endpoint',
          type: 'text',
          placeholder: 'https://api.onprem.example.com/chat',
          required: true,
          value: ''
        }
      }
    }
  });

  // Load saved settings on component mount
  useEffect(() => {
    const loadSavedSettings = async () => {
      // For AWS and GCP, fetch from the backend API
      if (activeProvider === 'aws') {
        try {
          const response = await fetch(`${API_BASE_URL}/api/aws-settings/`);
          if (response.ok) {
            const data = await response.json();
            setFormData(prev => ({
              ...prev,
              aws: {
                ...prev.aws,
                fields: {
                  ...prev.aws.fields,
                  agent_id: {
                    ...prev.aws.fields.agent_id,
                    value: data.agent_id || ''
                  },
                  agent_alias_id: {
                    ...prev.aws.fields.agent_alias_id,
                    value: data.agent_alias_id || ''
                  }
                }
              }
            }));
          } else {
            console.error('Failed to load AWS settings from API');
          }
        } catch (error) {
          console.error('Error loading AWS settings:', error);
        }
      } else if (activeProvider === 'gcp') {
        try {
          const response = await fetch(`${API_BASE_URL}/api/gcp-settings/`);
          if (response.ok) {
            const data = await response.json();
            setFormData(prev => ({
              ...prev,
              gcp: {
                ...prev.gcp,
                fields: {
                  ...prev.gcp.fields,
                  session_endpoint: {
                    ...prev.gcp.fields.session_endpoint,
                    value: data.session_endpoint || ''
                  },
                  agent_run_endpoint: {
                    ...prev.gcp.fields.agent_run_endpoint,
                    value: data.agent_run_endpoint || ''
                  }
                }
              }
            }));
          } else {
            console.error('Failed to load GCP settings from API');
          }
        } catch (error) {
          console.error('Error loading GCP settings:', error);
        }
      } else {
        // For other providers, use localStorage as before
        const savedConfig = localStorage.getItem(`provider_config_${activeProvider}`);
        if (savedConfig) {
          try {
            const parsedConfig = JSON.parse(savedConfig);
            setFormData(prev => ({
              ...prev,
              [activeProvider]: {
                ...prev[activeProvider],
                fields: {
                  ...prev[activeProvider].fields,
                  endpoint: {
                    ...prev[activeProvider].fields.endpoint,
                    value: parsedConfig.endpoint?.value || ''
                  }
                }
              }
            }));
          } catch (error) {
            console.error(`Error loading saved config for ${activeProvider}:`, error);
          }
        }
      }
    };
    
    loadSavedSettings();
  }, [activeProvider]);

  const handleInputChange = (provider: ProviderType, fieldName: string, value: string) => {
    if (!isAdmin) return; // Only allow changes if user is admin
    
    setFormData(prev => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        fields: {
          ...prev[provider].fields,
          [fieldName]: {
            ...prev[provider].fields[fieldName],
            value
          }
        }
      }
    }));
  };

  const handleSave = async (provider: ProviderType) => {
    if (!isAdmin) {
      toast.error('You do not have permission to save settings');
      return;
    }
    
    const section = formData[provider];
    const requiredFields = Object.entries(section.fields)
      .filter(([_, field]) => field.required)
      .map(([key, _]) => key);

    const missingFields = requiredFields.filter(
      field => !section.fields[field].value
    );

    if (missingFields.length > 0) {
      toast.error(`Please fill in all required fields: ${missingFields.join(', ')}`);
      return;
    }

    try {
      if (provider === 'aws') {
        // For AWS, save to backend API
        const response = await fetch(`${API_BASE_URL}/api/aws-settings/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            agent_id: section.fields.agent_id.value,
            agent_alias_id: section.fields.agent_alias_id.value
          })
        });
        
        if (response.ok) {
          toast.success(`${section.title} saved successfully`);
        } else {
          const errorData = await response.json();
          toast.error(`Failed to save: ${errorData.detail || 'Unknown error'}`);
        }
      } else if (provider === 'gcp') {
        // For GCP, save to backend API
        const response = await fetch(`${API_BASE_URL}/api/gcp-settings/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            session_endpoint: section.fields.session_endpoint.value,
            agent_run_endpoint: section.fields.agent_run_endpoint.value
          })
        });
        
        if (response.ok) {
          toast.success(`${section.title} saved successfully`);
        } else {
          const errorData = await response.json();
          toast.error(`Failed to save: ${errorData.detail || 'Unknown error'}`);
        }
      } else {
        // For other providers, use localStorage as before
        localStorage.setItem(
          `provider_config_${provider}`,
          JSON.stringify(section.fields)
        );
        
        toast.success(`${section.title} saved successfully`);
      }
    } catch (error) {
      toast.error('Failed to save configuration');
      console.error('Save error:', error);
    }
  };

  const renderField = (provider: ProviderType, fieldName: string, field: FormField) => {
    return (
      <div key={`${provider}-${fieldName}`} className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <div className="relative">
          <input
            type="text"
            value={field.value}
            onChange={(e) => handleInputChange(provider, fieldName, e.target.value)}
            placeholder={field.placeholder}
            readOnly={!isAdmin}
            className={`
              mt-1 block w-full rounded-md shadow-sm sm:text-sm
              ${!isAdmin
                ? 'bg-gray-100 text-gray-600 border-gray-200 cursor-not-allowed'
                : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
              }
            `}
          />
          {!isAdmin && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <Lock className="h-4 w-4 text-gray-400" />
            </div>
          )}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <AppLayout>
        <Header subtitle="Settings" />
        <div className="flex-1 overflow-auto bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Header subtitle="Settings" />

      <div className="flex-1 overflow-auto bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Admin/User Status Banner */}
          <div className={`mb-4 p-4 rounded-lg ${isAdmin ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
            <div className="flex items-center">
              <div className={`rounded-full p-2 mr-3 ${isAdmin ? 'bg-green-100' : 'bg-yellow-100'}`}>
                {isAdmin ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                )}
              </div>
              <div>
                <h3 className={`text-sm font-medium ${isAdmin ? 'text-green-800' : 'text-yellow-800'}`}>
                  {isAdmin ? 'Admin Mode' : 'View-Only Mode'}
                </h3>
                <p className="text-sm mt-1">
                  {isAdmin 
                    ? 'You have full access to edit and save provider settings.' 
                    : 'You can view settings but cannot make changes. Contact an administrator for assistance.'}
                </p>
              </div>
            </div>
          </div>
          
          {/* Provider Selection */}
          <div className="bg-white shadow rounded-lg mb-6">
            <nav className="flex space-x-8 p-4">
              {providers.map((provider) => {
                const Icon = provider.icon;
                return (
                  <button
                    key={provider.id}
                    onClick={() => setActiveProvider(provider.id as ProviderType)}
                    className={`
                      group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm
                      ${activeProvider === provider.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }
                    `}
                  >
                    <div className={`w-8 h-8 rounded-lg mr-3 flex items-center justify-center ${provider.color} bg-opacity-10`}>
                      <Icon className={`w-5 h-5 ${activeProvider === provider.id ? 'text-blue-600' : 'text-gray-500'}`} />
                    </div>
                    {provider.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Provider Settings */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                {formData[activeProvider].title}
              </h3>
              <div className="grid grid-cols-1 gap-6">
                {Object.entries(formData[activeProvider].fields).map(([fieldName, field]) => 
                  renderField(activeProvider, fieldName, field)
                )}
                {activeProvider === 'aws' ? (
                  <p className="text-sm text-gray-500 mt-2">
                    These settings configure the AWS Bedrock agent used for chat. AWS credentials are securely stored on the server.
                  </p>
                ) : (
                  <p className="text-sm text-gray-500 mt-2">
                    This endpoint will be used for the chat interface to communicate with the {formData[activeProvider].title} backend.
                  </p>
                )}
              </div>
              {isAdmin && (
                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleSave(activeProvider)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}