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
                              disabled={true}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              checked={user.providers.azure}
                              disabled={true}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              checked={user.providers.gcp}
                              disabled={true}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              checked={user.providers.onprem}
                              disabled={true}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            user.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
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
