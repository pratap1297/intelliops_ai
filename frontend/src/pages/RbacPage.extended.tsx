import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '../components/AppLayout';
import { Header } from '../components/Header';
import { Search, Edit2, Save, X, CheckCircle, AlertCircle, ToggleLeft, ToggleRight, UserPlus } from 'lucide-react';
import { authService } from '../lib/auth-service';
import { API_BASE_URL } from '../config';

// Define the CloudProvider type
type CloudProvider = 'aws' | 'azure' | 'gcp' | 'onprem';

// Define interfaces
interface User {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
}

interface UserAccess {
  id: string;
  userId: string;
  userName: string;
  email: string;
  isAdmin: boolean;
  isActive: boolean;
  providers: {
    aws: boolean;
    azure: boolean;
    gcp: boolean;
    onprem: boolean;
  };
}

// Define the super admin email
const SUPER_ADMIN_EMAIL = "admin@intelliops.com";

export function RbacPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [userAccess, setUserAccess] = useState<UserAccess[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    isAdmin: false
  });
  
  // Check if current user is admin
  useEffect(() => {
    try {
      // Use authService instead of localStorage
      if (!authService.isAuthenticated()) {
        navigate('/login');
        return;
      }
      
      const user = authService.getUser();
      if (!user) {
        navigate('/login');
        return;
      }
      
      if (!user.is_admin) {
        // Redirect non-admin users away from this page
        navigate('/chat');
        return;
      }
      
      // Load all users
      loadUsers();
    } catch (error) {
      console.error('Error loading user data:', error);
      navigate('/login');
    }
  }, [navigate]);
  
  const loadUsers = async () => {
    try {
      setIsLoading(true);
      // Get the current auth token
      const token = authService.getToken();
      if (!token) {
        console.error('No authentication token available');
        navigate('/login');
        return;
      }
      
      // Fetch users from the backend API
      // Ensure API_BASE_URL is properly formatted without trailing slash
      const apiUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
      const response = await fetch(`${apiUrl}/api/users`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.statusText}`);
      }
      
      const usersData = await response.json();
      console.log('Loaded users from backend:', usersData);
      
      // Map backend users to our expected format
      const mappedUsers = usersData.map((user: any) => ({
        id: user.id.toString(),
        name: user.name || 'Unknown',
        email: user.email,
        isAdmin: user.is_admin || false
      }));
      
      setUsers(mappedUsers);
      
      // After loading users, load their access settings
      loadUserAccess(mappedUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      setMessage({ type: 'error', text: 'Failed to load users' });
    } finally {
      setIsLoading(false);
    }
  };
  
  const loadUserAccess = async (usersList: User[]) => {
    try {
      setIsLoading(true);
      // Get the current auth token
      const token = authService.getToken();
      if (!token) {
        console.error('No authentication token available');
        navigate('/login');
        return;
      }
      
      // Now fetch provider access for all users
      const accessData: UserAccess[] = [];
      
      for (const user of usersList) {
        try {
          // Fetch provider access for this user
          // Ensure API_BASE_URL is properly formatted without trailing slash
          const apiUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
          const response = await fetch(`${apiUrl}/api/provider-access/user/${user.id}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (!response.ok) {
            console.warn(`Could not fetch provider access for user ${user.id}, creating default`);
            // Create default access settings for this user
            accessData.push({
              id: user.id,
              userId: user.id,
              userName: user.name,
              email: user.email,
              isAdmin: user.isAdmin,
              isActive: true, // Default to active
              providers: {
                aws: true,
                azure: false,
                gcp: false,
                onprem: false,
              }
            });
            continue;
          }
          
          const userAccess = await response.json();
          console.log(`Loaded access for user ${user.id}:`, userAccess);
          
          // Map backend provider access to our format
          const mappedAccess = {
            id: user.id,
            userId: user.id,
            userName: user.name,
            email: user.email,
            isAdmin: user.isAdmin,
            isActive: true,
            providers: {
              aws: userAccess.some((a: any) => a.provider === 'aws' && a.has_access) || false,
              azure: userAccess.some((a: any) => a.provider === 'azure' && a.has_access) || false,
              gcp: userAccess.some((a: any) => a.provider === 'gcp' && a.has_access) || false,
              onprem: userAccess.some((a: any) => a.provider === 'onprem' && a.has_access) || false,
            }
          };
          
          accessData.push(mappedAccess);
        } catch (error) {
          console.error(`Error loading access for user ${user.id}:`, error);
        }
      }
      
      setUserAccess(accessData);
    } catch (error) {
      console.error('Error loading user access:', error);
      setMessage({
        type: 'error',
        text: 'Failed to load user access settings. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveAccessSettings = async () => {
    try {
      setIsLoading(true);
      const token = authService.getToken();
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      // Save provider access settings to backend for each user
      for (const access of userAccess) {
        const userId = parseInt(access.userId);
        
        // Update each provider access setting
        for (const [provider, hasAccess] of Object.entries(access.providers)) {
          try {
            // Update provider access in the backend
            // Ensure API_BASE_URL is properly formatted without trailing slash
            const apiUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
            
            // Use the correct endpoint structure for updating provider access
            // The backend expects /api/provider-access/{provider}
            const response = await fetch(`${apiUrl}/api/provider-access/${provider}`, {
              method: 'PUT',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                user_id: userId,
                has_access: hasAccess,
                is_active: access.isActive
              })
            });
            
            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.detail || `Failed to update ${provider} access for user ${userId}`);
            }
          } catch (error) {
            console.error(`Failed to update ${provider} access for user ${userId}:`, error);
          }
        }
      }
      
      setMessage({ type: 'success', text: 'Access settings saved successfully' });
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 3000);
      
      setEditingUserId(null);
    } catch (error) {
      console.error('Error saving access settings:', error);
      setMessage({ type: 'error', text: 'Failed to save access settings' });
    } finally {
      setIsLoading(false);
    }
  };

  const startEditing = (userId: string) => {
    setEditingUserId(userId);
  };

  const cancelEditing = () => {
    setEditingUserId(null);
    // Reload data to discard changes
    loadUsers();
  };

  const toggleAccess = (userId: string, provider: 'aws' | 'azure' | 'gcp' | 'onprem') => {
    const updatedAccess = userAccess.map(access => {
      if (access.userId === userId) {
        return {
          ...access,
          providers: {
            ...access.providers,
            [provider]: !access.providers[provider]
          }
        };
      }
      return access;
    });
    
    setUserAccess(updatedAccess);
  };

  const toggleActiveStatus = async (userId: string) => {
    // Prevent disabling the super admin
    const user = userAccess.find(u => u.userId === userId);
    if (user && user.email === SUPER_ADMIN_EMAIL) {
      setMessage({ type: 'error', text: 'Super admin cannot be disabled' });
      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 3000);
      return;
    }
    
    setIsLoading(true);
    
    try {
      const updatedAccess = userAccess.map(access => {
        if (access.userId === userId) {
          return {
            ...access,
            isActive: !access.isActive
          };
        }
        return access;
      });
      
      // Update user status in the backend
      const userToUpdate = updatedAccess.find(u => u.userId === userId);
      if (userToUpdate) {
        const isActive = userToUpdate.isActive;
        const token = authService.getToken();
        if (!token) {
          throw new Error('Authentication token not found');
        }
        
        // Update provider access for all providers
        for (const provider of ['aws', 'azure', 'gcp', 'onprem'] as const) {
          try {
            // Update provider access in the backend
            // Ensure API_BASE_URL is properly formatted without trailing slash
            const apiUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
            
            // Use the correct endpoint structure for updating provider access
            // The backend expects /api/provider-access/{provider}
            const response = await fetch(`${apiUrl}/api/provider-access/${provider}`, {
              method: 'PUT',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                user_id: parseInt(userId),
                has_access: userToUpdate.providers[provider],
                is_active: isActive
              })
            });
            
            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.detail || `Failed to update ${provider} access for user ${userId}`);
            }
          } catch (error) {
            console.error(`Failed to update ${provider} access for user ${userId}:`, error);
          }
        }
        
        setUserAccess(updatedAccess);
        
        setMessage({ 
          type: 'success', 
          text: `User ${isActive ? 'activated' : 'deactivated'} successfully` 
        });
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setMessage({ type: '', text: '' });
        }, 3000);
      }
    } catch (error) {
      console.error('Error toggling user status:', error);
      setMessage({ type: 'error', text: 'Failed to update user status' });
    } finally {
      setIsLoading(false);
    }
  };

  // Filter users based on search term
  const filteredUsers = searchTerm
    ? userAccess.filter(
        user => 
          user.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : userAccess;

  return (
    <AppLayout>
      <Header 
        subtitle="Role-Based Access Control"
        actions={
          <div className="flex space-x-2">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            
            <button
              onClick={() => setShowCreateUserModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <UserPlus className="-ml-1 mr-2 h-5 w-5" />
              Add User
            </button>
            
            {editingUserId && (
              <div className="flex space-x-2">
                <button
                  onClick={saveAccessSettings}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  disabled={isLoading}
                >
                  <Save className="-ml-1 mr-2 h-5 w-5" />
                  Save Changes
                </button>
                <button
                  onClick={cancelEditing}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  disabled={isLoading}
                >
                  <X className="-ml-1 mr-2 h-5 w-5" />
                  Cancel
                </button>
              </div>
            )}
          </div>
        }
      />
      
      <div className="flex-1 overflow-auto bg-gray-50 p-4">
        <div className="max-w-6xl mx-auto">
          {message.text && (
            <div className={`p-4 mb-4 rounded-md ${
              message.type === 'error' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
            }`}>
              <div className="flex">
                <div className="flex-shrink-0">
                  {message.type === 'error' ? (
                    <AlertCircle className="h-5 w-5 text-red-400" />
                  ) : (
                    <CheckCircle className="h-5 w-5 text-green-400" />
                  )}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium">{message.text}</p>
                </div>
              </div>
            </div>
          )}
          
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-lg font-medium text-gray-900">
                  User Cloud Provider Access
                </h2>
                {!editingUserId && (
                  <button
                    onClick={() => startEditing('all')}
                    className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Edit2 className="-ml-0.5 mr-2 h-4 w-4" />
                    Edit All
                  </button>
                )}
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        AWS
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Azure
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        GCP
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        On-Prem
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      {editingUserId && (
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUsers.map((user) => (
                      <tr key={user.userId} className={user.isActive ? "" : "bg-gray-50"}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`text-sm font-medium ${user.isActive ? 'text-gray-900' : 'text-gray-400'}`}>
                            {user.userName}
                          </div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              checked={user.providers.aws}
                              onChange={() => editingUserId ? toggleAccess(user.userId, 'aws') : null}
                              disabled={!editingUserId}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              checked={user.providers.azure}
                              onChange={() => editingUserId ? toggleAccess(user.userId, 'azure') : null}
                              disabled={!editingUserId}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              checked={user.providers.gcp}
                              onChange={() => editingUserId ? toggleAccess(user.userId, 'gcp') : null}
                              disabled={!editingUserId}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              checked={user.providers.onprem}
                              onChange={() => editingUserId ? toggleAccess(user.userId, 'onprem') : null}
                              disabled={!editingUserId}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editingUserId ? (
                            <button
                              onClick={() => toggleActiveStatus(user.userId)}
                              className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                              disabled={user.email === SUPER_ADMIN_EMAIL}
                            >
                              {user.isActive ? (
                                <>
                                  <ToggleRight className="-ml-0.5 mr-1 h-4 w-4" />
                                  Deactivate
                                </>
                              ) : (
                                <>
                                  <ToggleLeft className="-ml-0.5 mr-1 h-4 w-4" />
                                  Activate
                                </>
                              )}
                            </button>
                          ) : (
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              user.isActive 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {user.isActive ? 'Active' : 'Inactive'}
                            </span>
                          )}
                        </td>
                        
                        {editingUserId && (
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => startEditing(user.userId)}
                              className="text-blue-600 hover:text-blue-900 mr-4"
                            >
                              Edit
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
