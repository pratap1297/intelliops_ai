import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '../components/AppLayout';
import { Header } from '../components/Header';
import { Search, CheckCircle, AlertCircle, Edit, Save, X, UserPlus, User, Mail, Lock, ShieldCheck, UserX, UserCheck, Key } from 'lucide-react';
import { authService } from '../lib/auth-service';
import { authApi } from '../lib/api-client';
import { API_BASE_URL } from '../config';

// CloudProvider type is already defined in types.ts, so we don't need to redefine it here

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

// Admin email is defined but not used in this simplified version

export function RbacPage() {
  // Selected provider state
  const [selectedProvider, setSelectedProvider] = useState<'aws' | 'azure' | 'gcp' | 'onprem' | null>(null);

  // ...rest of the code...

  console.log('[RbacPage] Initializing RbacPage component');
  const navigate = useNavigate();
  // State for storing user data and access settings
  const [userAccess, setUserAccess] = useState<UserAccess[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editedAccess, setEditedAccess] = useState<UserAccess | null>(null);
  
  // State for user creation modal
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    isAdmin: false,
    providerAccess: {
      aws: false,
      azure: false,
      gcp: false,
      onprem: false
    }
  });
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  
  // State for password change modal
  const [isPasswordChangeModalOpen, setIsPasswordChangeModalOpen] = useState(false);
  const [passwordChangeData, setPasswordChangeData] = useState({
    userId: '',
    userName: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  // Check if current user is admin and handle authentication state changes
  useEffect(() => {
    console.log('[RbacPage] Setting up auth state change listener');
    // Subscribe to auth state changes
    const unsubscribe = authService.onAuthStateChange((user) => {
      console.log('[RbacPage] Auth state changed, user:', user);
      if (!user) {
        // Not authenticated, redirect to login
        console.log('[RbacPage] Not authenticated, redirecting to login');
        navigate('/login');
        return;
      }
      
      if (!user.is_admin) {
        // Not an admin, redirect to chat
        console.log('[RbacPage] User is not an admin, redirecting to chat');
        navigate('/chat');
        return;
      }
      
      // User is authenticated and is an admin, load data
      console.log('[RbacPage] User is authenticated and is an admin, loading data');
      loadUsers();
    });
    
    // Initial check
    const checkAuth = async () => {
      console.log('[RbacPage] Performing initial auth check');
      try {
        // Check if authenticated
        const isAuth = authService.isAuthenticated();
        console.log('[RbacPage] Initial auth check result:', isAuth);
        
        if (!isAuth) {
          // Not authenticated yet, the auth state change listener will handle it
          console.log('[RbacPage] Not authenticated yet, waiting for auth state change');
          return;
        }
        
        const user = authService.getUser();
        console.log('[RbacPage] Current user from authService:', user);
        
        if (!user) {
          // No user data yet, the auth state change listener will handle it
          console.log('[RbacPage] No user data yet, waiting for auth state change');
          return;
        }
        
        if (!user.is_admin) {
          // Not an admin, redirect to chat
          console.log('[RbacPage] User is not an admin, redirecting to chat');
          navigate('/chat');
          return;
        }
        
        // User is authenticated and is an admin, load data
        console.log('[RbacPage] User is authenticated and is an admin, loading data');
        loadUsers();
      } catch (error) {
        console.error('[RbacPage] Error checking authentication:', error);
      }
    };
    
    checkAuth();
    
    // Cleanup subscription
    return () => {
      console.log('[RbacPage] Cleaning up auth state change listener');
      unsubscribe();
    };
  }, [navigate]);

  // Load users from backend or localStorage
  const loadUsers = async () => {
    try {
      setIsLoading(true);
      console.log('[RbacPage] Loading users');
      
      // Get the current auth token
      const token = authService.getToken();
      console.log(`[RbacPage] Auth token: ${token ? 'exists' : 'not found'}`);
      if (!token) {
        console.error('[RbacPage] No authentication token available');
        throw new Error('Authentication token not available');
      }
      
      // Fetch users from the backend API using centralized config
      // Ensure API_BASE_URL is properly formatted without trailing slash
      const apiUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
      const response = await fetch(`${apiUrl}/api/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }
      
      const users = await response.json();
      console.log('[RbacPage] Loaded users from backend:', users);
      
      // Map backend users to our expected format
      const mappedUsers = users.map((user: any) => ({
        id: user.id.toString(),
        name: user.name || 'Unknown',
        email: user.email,
        isAdmin: user.is_admin || false
      }));
      
      // After loading users, load their access settings
      loadUserAccess(mappedUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      setMessage({ type: 'error', text: 'Failed to load users' });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Start editing a user's provider access
  const startEditing = (user: UserAccess) => {
    console.log('[RbacPage] Starting to edit provider access for user:', user);
    setEditingUserId(user.userId);
    setEditedAccess({...user});
  };
  
  // Open password change modal for a user
  const openPasswordChangeModal = (user: UserAccess) => {
    setPasswordChangeData({
      userId: user.userId,
      userName: user.userName,
      email: user.email,
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setIsPasswordChangeModalOpen(true);
  };
  
  // Handle password change form submission
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!passwordChangeData.currentPassword || !passwordChangeData.newPassword || !passwordChangeData.confirmPassword) {
      setMessage({
        type: 'error',
        text: 'Please fill in all password fields'
      });
      return;
    }
    
    if (passwordChangeData.newPassword !== passwordChangeData.confirmPassword) {
      setMessage({
        type: 'error',
        text: 'New password and confirmation do not match'
      });
      return;
    }
    
    if (passwordChangeData.newPassword.length < 6) {
      setMessage({
        type: 'error',
        text: 'New password must be at least 6 characters long'
      });
      return;
    }
    
    try {
      setIsChangingPassword(true);
      
      // Get the current auth token
      const token = authService.getToken();
      if (!token) {
        console.error('[RbacPage] No authentication token available');
        throw new Error('Authentication token not available');
      }
      
      // Attempt to change password via API
      try {
        // Ensure API_BASE_URL is properly formatted without trailing slash
        const apiUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
        const response = await fetch(`${apiUrl}/api/users/${passwordChangeData.userId}/password`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            current_password: passwordChangeData.currentPassword,
            new_password: passwordChangeData.newPassword
          })
        });
        
        if (!response.ok) {
          // If specific API endpoint doesn't exist, try the general password change endpoint
          if (response.status === 404) {
            // Ensure API_BASE_URL is properly formatted without trailing slash
            const apiUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
            const fallbackResponse = await fetch(`${apiUrl}/api/users/me/password`, {
              method: 'PUT',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                current_password: passwordChangeData.currentPassword,
                new_password: passwordChangeData.newPassword
              })
            });
            
            if (!fallbackResponse.ok) {
              throw new Error(`API returned ${fallbackResponse.status}: ${fallbackResponse.statusText}`);
            }
          } else {
            throw new Error(`API returned ${response.status}: ${response.statusText}`);
          }
        }
        
        console.log('[RbacPage] Password changed successfully via API');
        
        // Reset form and close modal
        setPasswordChangeData({
          userId: '',
          userName: '',
          email: '',
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        
        setIsPasswordChangeModalOpen(false);
        
        // Show success message
        setMessage({
          type: 'success',
          text: `Password for ${passwordChangeData.userName} changed successfully`
        });
        
      } catch (apiError) {
        console.error('[RbacPage] API password change failed:', apiError);
        throw new Error(`Password change failed: ${apiError instanceof Error ? apiError.message : String(apiError)}`);
      }
      
    } catch (error) {
      console.error('[RbacPage] Error changing password:', error);
      setMessage({
        type: 'error',
        text: `Failed to change password: ${error instanceof Error ? error.message : String(error)}`
      });
    } finally {
      setIsChangingPassword(false);
    }
  };
  


  // Toggle user active status (soft delete)
  const toggleUserActiveStatus = async (user: UserAccess) => {
    try {
      setIsLoading(true);
      
      // Get the current auth token
      const token = authService.getToken();
      if (!token) {
        console.error('[RbacPage] No authentication token available');
        throw new Error('Authentication token not available');
      }
      
      const newStatus = !user.isActive;
      const actionType = newStatus ? 'Activating' : 'Deactivating (soft deleting)';
      console.log(`[RbacPage] ${actionType} user:`, user.email);
      console.log(`[RbacPage] Current user status: isActive=${user.isActive}, changing to: ${newStatus}`);
      
      // First update the user's is_active status in the users table
      console.log(`[RbacPage] Updating user ${user.userId} is_active status to ${newStatus}`);
      // Ensure API_BASE_URL is properly formatted without trailing slash
      const apiUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
      const response = await fetch(`${apiUrl}/api/users/${user.userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_active: newStatus })
      });
      
      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }
      
      console.log(`[RbacPage] User ${newStatus ? 'activated' : 'deactivated'} successfully via API`);
      
      // Now update all provider access records for this user to maintain consistency
      const providers = ['aws', 'azure', 'gcp', 'onprem'] as const;
      let providerUpdateSuccess = true;
      
      for (const provider of providers) {
        try {
          // Only update if the user has this provider access
          if (user.providers[provider]) {
            console.log(`[RbacPage] Updating ${provider} access for user ${user.userId} with new is_active=${newStatus}`);
            
            // Ensure API_BASE_URL is properly formatted without trailing slash
            const apiUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
            const providerResponse = await fetch(`${apiUrl}/api/provider-access/${provider}`, {
              method: 'PUT',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                user_id: parseInt(user.userId),
                has_access: user.providers[provider],
                is_active: newStatus // Set all provider access to match user active status
              })
            });
            
            if (!providerResponse.ok) {
              console.warn(`[RbacPage] Failed to update ${provider} access status for user ${user.userId}`);
              providerUpdateSuccess = false;
            }
          }
        } catch (error) {
          console.error(`[RbacPage] Error updating ${provider} access:`, error);
          providerUpdateSuccess = false;
        }
      }
      
      if (!providerUpdateSuccess) {
        console.warn('[RbacPage] Some provider access updates failed. User activation status may be inconsistent.');
      }
      
      // Update the local state
      setUserAccess(prevAccess => prevAccess.map(access => {
        if (access.userId === user.userId) {
          // Create a copy of the user access object
          const updatedAccess = {
            ...access,
            isActive: newStatus
          };
          
          // Also update all provider access flags to match
          for (const provider of providers) {
            if (updatedAccess.providers[provider]) {
              // Keep has_access the same, but update is_active to match user status
              updatedAccess.providers[provider] = updatedAccess.providers[provider] && newStatus;
            }
          }
          
          return updatedAccess;
        }
        return access;
      }));
      
      // Update localStorage
      const userAccessList = JSON.parse(localStorage.getItem('user_access') || '[]');
      const updatedUserAccessList = userAccessList.map((access: any) => {
        if (access.userId === user.userId || access.id === user.userId || access.email === user.email) {
          return {
            ...access,
            isActive: newStatus
          };
        }
        return access;
      });
      
      localStorage.setItem('user_access', JSON.stringify(updatedUserAccessList));
      
      // Use the helper function to ensure all user data in localStorage is consistent
      const updatedUser = {
        ...user,
        isActive: newStatus
      };
      updateUserDataInLocalStorage(user.userId, updatedUser);
      
      // Show appropriate success message based on the action
      const messageText = newStatus
        ? `User ${user.userName} has been activated successfully`
        : `User ${user.userName} has been deactivated (soft deleted). They will no longer be able to log in.`;
        
      setMessage({
        type: 'success',
        text: messageText
      });
    } catch (error) {
      console.error(`[RbacPage] Error ${user.isActive ? 'deactivating' : 'activating'} user:`, error);
      setMessage({
        type: 'error',
        text: `Failed to ${user.isActive ? 'deactivate' : 'activate'} user: ${error instanceof Error ? error.message : String(error)}`
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Cancel editing and revert changes
  const cancelEdit = () => {
    console.log('[RbacPage] Canceling edit');
    setEditingUserId(null);
    setEditedAccess(null);
  };
  
  // Save the edited provider access
  const saveProviderAccess = async (userId: string) => {
    console.log('[RbacPage] Saving provider access for user:', userId);
    if (!editedAccess) return;
    
    try {
      setIsLoading(true);
      
      // Get the current auth token
      const token = authService.getToken();
      if (!token) {
        console.error('[RbacPage] No authentication token available');
        throw new Error('Authentication token not available');
      }
      
      // First attempt to update provider access through the backend API
      const providers = ['aws', 'azure', 'gcp', 'onprem'] as const;
      
      let apiSuccess = true;
      
      for (const provider of providers) {
        try {
          // Only make API calls if the provider access has changed
          const hasAccess = editedAccess.providers[provider];
          
          // Find the user in the current userAccess list to get their current activation status
          const currentUser = userAccess.find(u => u.userId === userId);
          
          // Get the current user's active status - prioritize the status from editedAccess if it was explicitly changed
          // otherwise use the current status from the database
          const isActive = editedAccess.isActive !== undefined ? editedAccess.isActive : (currentUser?.isActive ?? true);
          
          console.log(`[RbacPage] User ${userId} active status before update: ${isActive}`);
          console.log(`[RbacPage] User ${userId} active status in editedAccess: ${editedAccess.isActive}`);
          console.log(`[RbacPage] User ${userId} active status in current data: ${currentUser?.isActive}`);
          
          const updateData = {
            user_id: parseInt(userId),
            has_access: hasAccess,
            is_active: isActive
          };
          
          console.log(`[RbacPage] Updating ${provider} access for user ${userId} to ${hasAccess}`);
          
          // Ensure API_BASE_URL is properly formatted without trailing slash
          const apiUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
          
          // Use the correct endpoint structure for updating provider access
          const response = await fetch(`${apiUrl}/api/provider-access/${provider}`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(updateData)
          });
          
          if (!response.ok) {
            console.warn(`[RbacPage] API call failed for ${provider}: ${response.status} ${response.statusText}`);
            apiSuccess = false;
            // Continue with other providers, we'll fall back to client-side if needed
          } else {
            console.log(`[RbacPage] Successfully updated ${provider} access via API`);
          }
        } catch (error) {
          console.error(`[RbacPage] Error updating ${provider} access:`, error);
          apiSuccess = false;
        }
      }
      
      if (!apiSuccess) {
        console.log('[RbacPage] Some API calls failed, falling back to client-side implementation');
        // Implement client-side fallback solution
      }
      
      // Immediately update the UI with the changes
      // Create a deep copy of the current user access data
      const updatedAccess = JSON.parse(JSON.stringify(userAccess));
      
      // Find and update the specific user's provider access in the local state
      const userIndex = updatedAccess.findIndex((access: UserAccess) => access.userId === userId);
      if (userIndex !== -1) {
        // Update this user's provider settings with the edited values
        updatedAccess[userIndex] = {
          ...updatedAccess[userIndex],
          providers: {
            ...updatedAccess[userIndex].providers,
            // Update all providers at once
            ...editedAccess.providers
          }
        };
        
        // Update the state immediately for a responsive UI
        setUserAccess(updatedAccess);
        
        // Also update localStorage to persist changes
        localStorage.setItem('user_access', JSON.stringify(updatedAccess));
        
        // Emit an event to notify other components about the change
        const event = new CustomEvent('userAccessChanged', { 
          detail: { userId, providers: editedAccess.providers } 
        });
        window.dispatchEvent(event);
      }
      
      // Now fetch fresh data from the backend to ensure consistency
      // Ensure API_BASE_URL is properly formatted without trailing slash
      const apiUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
      
      // Fetch the specific user's updated provider access
      const userAccessResponse = await fetch(`${apiUrl}/api/provider-access/user/${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // If successful, update the state with the fresh data
      if (userAccessResponse.ok) {
        const freshUserAccess = await userAccessResponse.json();
        console.log(`[RbacPage] Refreshed access for user ${userId} from API:`, freshUserAccess);
        
        // Map the fresh data to our format
        const hasInactiveRecord = freshUserAccess.some((a: any) => a.is_active === false);
        const mappedAccess = {
          id: userId,
          userId: userId,
          userName: editedAccess.userName,
          email: editedAccess.email,
          isAdmin: editedAccess.isAdmin,
          isActive: !hasInactiveRecord,
          providers: {
            aws: freshUserAccess.some((a: any) => a.provider === 'aws' && a.has_access) || false,
            azure: freshUserAccess.some((a: any) => a.provider === 'azure' && a.has_access) || false,
            gcp: freshUserAccess.some((a: any) => a.provider === 'gcp' && a.has_access) || false,
            onprem: freshUserAccess.some((a: any) => a.provider === 'onprem' && a.has_access) || false,
          }
        };
        
        // Update just this user's data in the state
        setUserAccess(prevAccess => {
          const newAccess = [...prevAccess];
          const index = newAccess.findIndex(a => a.userId === userId);
          if (index !== -1) {
            newAccess[index] = mappedAccess;
          }
          return newAccess;
        });
      }
      
      // 3. Update user data in localStorage to ensure consistency
      updateUserDataInLocalStorage(userId, {
        ...editedAccess,
        userId: userId
      });

      setMessage({
        type: 'success',
        text: `Provider access updated successfully for ${editedAccess.userName}`
      });
      setEditingUserId(null);
      setEditedAccess(null);
      setIsLoading(false);
      return;
    } catch (error) {
      console.error('[RbacPage] Error updating provider access:', error);
      setMessage({
        type: 'error',
        text: 'Failed to update provider access. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Helper function to update all user-related data in localStorage
  const updateUserDataInLocalStorage = (userId: string, userAccess: UserAccess) => {
    try {
      // Update the current user in localStorage if this is the current user
      const currentUserStr = localStorage.getItem('currentUser');
      if (currentUserStr) {
        const currentUser = JSON.parse(currentUserStr);
        if (currentUser.email === userAccess.email || 
            (currentUser.id && (currentUser.id.toString() === userId || currentUser.id === userId))) {
          console.log('[RbacPage] Updating current user provider access');
          
          // Update currentUser with the latest provider access
          localStorage.setItem('currentUser', JSON.stringify({
            ...currentUser,
            provider_access: userAccess.providers
          }));
          
          // Update the auth_user entry too if it exists
          const authUserStr = localStorage.getItem('auth_user');
          if (authUserStr) {
            try {
              const authUser = JSON.parse(authUserStr);
              if (authUser.email === userAccess.email || 
                  (authUser.id && (authUser.id.toString() === userId || authUser.id === userId))) {
                // Update the provider access for the auth user
                localStorage.setItem('auth_user', JSON.stringify({
                  ...authUser,
                  provider_access: userAccess.providers
                }));
                console.log('[RbacPage] Updated auth_user in localStorage');
              }
            } catch (e) {
              console.error('[RbacPage] Error updating auth_user:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('[RbacPage] Error updating user data in localStorage:', error);
    }
  };
  
  const loadUserAccess = async (usersList: User[]) => {
    try {
      setIsLoading(true);
      // Get the current auth token
      const token = authService.getToken();
      if (!token) {
        console.error('[RbacPage] No authentication token available');
        navigate('/login');
        return;
      }
      
      // Now fetch provider access for all users
      const accessData: UserAccess[] = [];
      
      // First try to load existing user access from localStorage
      const existingUserAccess = JSON.parse(localStorage.getItem('user_access') || '[]');
      console.log('[RbacPage] Existing user access from localStorage:', existingUserAccess);
      
      for (const user of usersList) {
        try {
          // First check if we already have access data for this user in localStorage
          const existingAccess = existingUserAccess.find((access: any) => 
            (access.email && user.email && access.email === user.email) ||
            (access.userId && user.id && (access.userId === user.id || access.userId === user.id.toString())) ||
            (access.id && user.id && (access.id === user.id || access.id === user.id.toString()))
          );
          
          if (existingAccess && existingAccess.providers) {
            console.log(`[RbacPage] Found existing access for user ${user.id} in localStorage:`, existingAccess);
            accessData.push({
              id: user.id,
              userId: user.id,
              userName: user.name,
              email: user.email,
              isAdmin: user.isAdmin,
              isActive: existingAccess.isActive !== undefined ? existingAccess.isActive : true,
              providers: existingAccess.providers
            });
            continue;
          }
          
          // If not in localStorage, try to fetch from API
          console.log(`[RbacPage] Fetching provider access for user ${user.id} from API`);
          
          // Try the provider-access endpoint first
          // Ensure API_BASE_URL is properly formatted without trailing slash
          const apiUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
          let response = await fetch(`${apiUrl}/api/provider-access/user/${user.id}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          // If that fails, try the users endpoint
          if (!response.ok) {
            console.log(`[RbacPage] First API endpoint failed, trying alternate endpoint`);
            // Use the same apiUrl variable that was defined above
            response = await fetch(`${apiUrl}/api/users/${user.id}/provider-access`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });
          }
          
          if (!response.ok) {
            console.warn(`[RbacPage] Could not fetch provider access for user ${user.id}, creating default`);
            // Create default access settings for this user
            accessData.push({
              id: user.id,
              userId: user.id,
              userName: user.name,
              email: user.email,
              isAdmin: user.isAdmin,
              isActive: true, // Default to active
              providers: {
                aws: false,
                azure: false,
                gcp: false,
                onprem: false,
              }
            });
            continue;
          }
          
          const userAccess = await response.json();
          console.log(`[RbacPage] Loaded access for user ${user.id} from API:`, userAccess);
          
          // Check if any provider access records have is_active set to false
          const hasInactiveRecord = userAccess.some((a: any) => a.is_active === false);
          
          // Map backend provider access to our format
          const mappedAccess = {
            id: user.id,
            userId: user.id,
            userName: user.name,
            email: user.email,
            isAdmin: user.isAdmin,
            isActive: !hasInactiveRecord, // If any provider access is inactive, mark user as inactive
            providers: {
              aws: userAccess.some((a: any) => a.provider === 'aws' && a.has_access) || false,
              azure: userAccess.some((a: any) => a.provider === 'azure' && a.has_access) || false,
              gcp: userAccess.some((a: any) => a.provider === 'gcp' && a.has_access) || false,
              onprem: userAccess.some((a: any) => a.provider === 'onprem' && a.has_access) || false,
            }
          };
          
          accessData.push(mappedAccess);
        } catch (error) {
          console.error(`[RbacPage] Error loading access for user ${user.id}:`, error);
          // Create default access settings for this user in case of error
          accessData.push({
            id: user.id,
            userId: user.id,
            userName: user.name,
            email: user.email,
            isAdmin: user.isAdmin,
            isActive: true,
              providers: {
                aws: false,
                azure: false,
                gcp: false,
                onprem: false,
              }
          });
        }
      }
      
      setUserAccess(accessData);

      // Set selected provider to the first provider the current user has access to
      let selectedEmail: string | null = null;
      try {
        const userStr = localStorage.getItem('currentUser');
        if (userStr) {
          const userObj = JSON.parse(userStr);
          selectedEmail = userObj.email;
        }
      } catch (e) {
        selectedEmail = null;
      }
      let selectedAccess: typeof accessData[0] | null = null;
      if (selectedEmail) {
        selectedAccess = accessData.find(u => u.email === selectedEmail) || null;
      }
      if (!selectedAccess && accessData.length > 0) {
        selectedAccess = accessData[0];
      }
      if (selectedAccess) {
        const providerOrder: Array<keyof typeof selectedAccess.providers> = ['aws', 'azure', 'gcp', 'onprem'];
        const found = providerOrder.find(p => !!selectedAccess!.providers[p]);
        setSelectedProvider(found ?? null);
      } else {
        setSelectedProvider(null);
      }

      // Store user access data in localStorage for AppLayout to use
      // First, get the current user from localStorage
      const currentUserStr = localStorage.getItem('currentUser');
      if (currentUserStr) {
        const currentUser = JSON.parse(currentUserStr);
        
        // Make sure the current user's access is included in the data
        const currentUserAccess = accessData.find(access => 
          access.email === currentUser.email || 
          access.userId === currentUser.id || 
          access.id === currentUser.id
        );
        
        if (currentUserAccess) {
          console.log('[RbacPage] Found current user in access data:', currentUserAccess);
          // Update the current user's access in localStorage
          localStorage.setItem('user_access', JSON.stringify(accessData));
        }
      } else {
        // If no current user, just store all access data
        localStorage.setItem('user_access', JSON.stringify(accessData));
      }
      
      // Dispatch custom event to notify AppLayout of the change
      const event = new CustomEvent('userAccessChanged');
      document.dispatchEvent(event);
      
      console.log('[RbacPage] Initial user access data stored in localStorage');
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

  // Handle user creation form submission
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newUser.name || !newUser.email || !newUser.password) {
      setMessage({
        type: 'error',
        text: 'Please fill in all required fields'
      });
      return;
    }
    
    try {
      setIsCreatingUser(true);
      
      // Get the current auth token
      const token = authService.getToken();
      if (!token) {
        console.error('[RbacPage] No authentication token available');
        throw new Error('Authentication token not available');
      }
      
      // Register the new user using the auth API
      console.log('[RbacPage] Creating new user:', { ...newUser, password: '***' });
      
      // Use the register endpoint
      const response = await authApi.register(newUser.name, newUser.email, newUser.password);
      console.log('[RbacPage] User created successfully:', response);
      
      // If the user should be an admin, update their role
      if (newUser.isAdmin) {
        try {
          // Get the user ID from the response
          const userId = response.id;
          
          // Update the user to make them an admin
          // Ensure API_BASE_URL is properly formatted without trailing slash
          const apiUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
          await fetch(`${apiUrl}/api/users/${userId}`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ is_admin: true })
          });
          
          console.log('[RbacPage] User admin status updated successfully');
        } catch (adminError) {
          console.error('[RbacPage] Error updating user admin status:', adminError);
          // Continue anyway, we'll show a warning
          setMessage({
            type: 'warning',
            text: `User created successfully, but could not set admin status. ${adminError}`
          });
        }
      }
      
      // Create provider access for the new user with selected providers
      const userId = response.id.toString();
      const userProviderAccess: UserAccess = {
        id: userId,
        userId: userId,
        userName: newUser.name,
        email: newUser.email,
        isAdmin: newUser.isAdmin,
        isActive: true,
        providers: {
          aws: newUser.providerAccess.aws,
          azure: newUser.providerAccess.azure,
          gcp: newUser.providerAccess.gcp,
          onprem: newUser.providerAccess.onprem
        }
      };
      
      // Add the new user to the list
      setUserAccess(prevAccess => [...prevAccess, userProviderAccess]);
      
      // Update localStorage
      const userAccessList = JSON.parse(localStorage.getItem('user_access') || '[]');
      userAccessList.push(userProviderAccess);
      localStorage.setItem('user_access', JSON.stringify(userAccessList));
      
      // Create provider access records in the backend for each selected provider
      const apiUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
      
      // Create an array of promises for each provider access API call
      const providerPromises = [];
      
      // For each selected provider, create a provider access record
      if (newUser.providerAccess.aws) {
        providerPromises.push(
          fetch(`${apiUrl}/api/provider-access`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              user_id: parseInt(userId),
              provider: 'aws',
              has_access: true,
              is_active: true
            })
          })
        );
      }
      
      if (newUser.providerAccess.azure) {
        providerPromises.push(
          fetch(`${apiUrl}/api/provider-access`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              user_id: parseInt(userId),
              provider: 'azure',
              has_access: true,
              is_active: true
            })
          })
        );
      }
      
      if (newUser.providerAccess.gcp) {
        providerPromises.push(
          fetch(`${apiUrl}/api/provider-access`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              user_id: parseInt(userId),
              provider: 'gcp',
              has_access: true,
              is_active: true
            })
          })
        );
      }
      
      if (newUser.providerAccess.onprem) {
        providerPromises.push(
          fetch(`${apiUrl}/api/provider-access`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              user_id: parseInt(userId),
              provider: 'onprem',
              has_access: true,
              is_active: true
            })
          })
        );
      }
      
      // Execute all provider access API calls in parallel
      try {
        await Promise.all(providerPromises);
        console.log('[RbacPage] Provider access records created successfully');
      } catch (providerError) {
        console.error('[RbacPage] Error creating provider access records:', providerError);
        // Continue anyway, we'll show a warning
        setMessage({
          type: 'warning',
          text: `User created successfully, but there was an issue setting up provider access. ${providerError}`
        });
      }
      
      // Reset the form and close the modal
      setNewUser({
        name: '',
        email: '',
        password: '',
        isAdmin: false,
        providerAccess: {
          aws: false,
          azure: false,
          gcp: false,
          onprem: false
        }
      });
      
      setIsCreateUserModalOpen(false);
      
      // Show success message
      setMessage({
        type: 'success',
        text: `User ${newUser.name} created successfully${newUser.isAdmin ? ' with admin privileges' : ''}`
      });
      
      // Reload the user list to ensure we have the latest data
      loadUsers();
      
    } catch (error) {
      console.error('[RbacPage] Error creating user:', error);
      setMessage({
        type: 'error',
        text: `Failed to create user: ${error instanceof Error ? error.message : String(error)}`
      });
    } finally {
      setIsCreatingUser(false);
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
            <div className="relative mr-2">
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
              onClick={() => setIsCreateUserModalOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Create User
            </button>
          </div>
        }
      />
      
      <div className="flex-1 overflow-auto bg-gray-50 p-4">
        <div className="container mx-auto px-4 py-6">
        {/* Selected Provider Display */}
        <div className="mb-4">
          <span className="font-bold">Selected Provider: </span>
          <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded">
            {selectedProvider ? selectedProvider.toUpperCase() : 'None'}
          </span>
        </div>
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
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUsers.map((user) => (
                      <tr key={user.userId} className={user.isActive ? "" : "bg-gray-50"}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className={`text-sm font-medium ${user.isActive ? 'text-gray-900' : 'text-gray-400'}`}>
                              {user.userName}
                            </div>
                            {user.isAdmin && (
                              <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
                                Admin
                              </span>
                            )}
                            {!user.isAdmin && (
                              <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                                User
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              checked={editingUserId === user.userId ? editedAccess?.providers.aws : user.providers.aws}
                              disabled={editingUserId !== user.userId}
                              onChange={() => {
                                if (editingUserId === user.userId && editedAccess) {
                                  setEditedAccess({
                                    ...editedAccess,
                                    providers: {
                                      ...editedAccess.providers,
                                      aws: !editedAccess.providers.aws
                                    }
                                  });
                                }
                              }}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              checked={editingUserId === user.userId ? editedAccess?.providers.azure : user.providers.azure}
                              disabled={editingUserId !== user.userId}
                              onChange={() => {
                                if (editingUserId === user.userId && editedAccess) {
                                  setEditedAccess({
                                    ...editedAccess,
                                    providers: {
                                      ...editedAccess.providers,
                                      azure: !editedAccess.providers.azure
                                    }
                                  });
                                }
                              }}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              checked={editingUserId === user.userId ? editedAccess?.providers.gcp : user.providers.gcp}
                              disabled={editingUserId !== user.userId}
                              onChange={() => {
                                if (editingUserId === user.userId && editedAccess) {
                                  setEditedAccess({
                                    ...editedAccess,
                                    providers: {
                                      ...editedAccess.providers,
                                      gcp: !editedAccess.providers.gcp
                                    }
                                  });
                                }
                              }}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              checked={editingUserId === user.userId ? editedAccess?.providers.onprem : user.providers.onprem}
                              disabled={editingUserId !== user.userId}
                              onChange={() => {
                                if (editingUserId === user.userId && editedAccess) {
                                  setEditedAccess({
                                    ...editedAccess,
                                    providers: {
                                      ...editedAccess.providers,
                                      onprem: !editedAccess.providers.onprem
                                    }
                                  });
                                }
                              }}
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
                        
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {editingUserId === user.userId ? (
                            <div className="flex space-x-2 justify-end">
                              <button
                                onClick={() => saveProviderAccess(user.userId)}
                                className="text-green-600 hover:text-green-900"
                                title="Save changes"
                              >
                                <Save className="w-5 h-5" />
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="text-red-600 hover:text-red-900"
                                title="Cancel"
                              >
                                <X className="w-5 h-5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex space-x-2 justify-end">
                              <button
                                onClick={() => startEditing(user)}
                                className="text-blue-600 hover:text-blue-900"
                                title="Edit provider access"
                              >
                                <Edit className="w-5 h-5" />
                              </button>
                              
                              <button
                                onClick={() => toggleUserActiveStatus(user)}
                                className={user.isActive ? "text-red-600 hover:text-red-900" : "text-green-600 hover:text-green-900"}
                                title={user.isActive ? "Deactivate user" : "Activate user"}
                              >
                                {user.isActive ? (
                                  <UserX className="w-5 h-5" />
                                ) : (
                                  <UserCheck className="w-5 h-5" />
                                )}
                              </button>
                              

                              <button
                                onClick={() => openPasswordChangeModal(user)}
                                className="text-yellow-600 hover:text-yellow-900"
                                title="Change password"
                              >
                                <Key className="w-5 h-5" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {/* Password Change Modal */}
          {isPasswordChangeModalOpen && (
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Change Password</h2>
                  <button
                    onClick={() => setIsPasswordChangeModalOpen(false)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="mb-4">
                  <p className="text-sm text-gray-500">
                    Changing password for <span className="font-medium text-gray-700">{passwordChangeData.userName}</span> ({passwordChangeData.email})
                  </p>
                </div>
                
                <form onSubmit={handlePasswordChange}>
                  <div className="space-y-4">
                    {/* Current Password Field */}
                    <div>
                      <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                        Current Password
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Lock className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                          type="password"
                          id="currentPassword"
                          value={passwordChangeData.currentPassword}
                          onChange={(e) => setPasswordChangeData({...passwordChangeData, currentPassword: e.target.value})}
                          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          placeholder="••••••••"
                          required
                        />
                      </div>
                    </div>
                    
                    {/* New Password Field */}
                    <div>
                      <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                        New Password
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Key className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                          type="password"
                          id="newPassword"
                          value={passwordChangeData.newPassword}
                          onChange={(e) => setPasswordChangeData({...passwordChangeData, newPassword: e.target.value})}
                          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          placeholder="••••••••"
                          required
                          minLength={6}
                        />
                      </div>
                      <p className="mt-1 text-xs text-gray-500">Password must be at least 6 characters</p>
                    </div>
                    
                    {/* Confirm Password Field */}
                    <div>
                      <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                        Confirm New Password
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Key className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                          type="password"
                          id="confirmPassword"
                          value={passwordChangeData.confirmPassword}
                          onChange={(e) => setPasswordChangeData({...passwordChangeData, confirmPassword: e.target.value})}
                          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          placeholder="••••••••"
                          required
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setIsPasswordChangeModalOpen(false)}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      disabled={isChangingPassword}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={isChangingPassword}
                    >
                      {isChangingPassword ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Changing...
                        </>
                      ) : (
                        'Change Password'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
          
          {/* Create User Modal */}
          {isCreateUserModalOpen && (
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Create New User</h2>
                  <button
                    onClick={() => setIsCreateUserModalOpen(false)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                <form onSubmit={handleCreateUser}>
                  <div className="space-y-4">
                    {/* Name Field */}
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                        Name
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <User className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          id="name"
                          value={newUser.name}
                          onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          placeholder="Full Name"
                          required
                        />
                      </div>
                    </div>
                    
                    {/* Email Field */}
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                        Email
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Mail className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                          type="email"
                          id="email"
                          value={newUser.email}
                          onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          placeholder="user@example.com"
                          required
                        />
                      </div>
                    </div>
                    
                    {/* Password Field */}
                    <div>
                      <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                        Password
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Lock className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                          type="password"
                          id="password"
                          value={newUser.password}
                          onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          placeholder="••••••••"
                          required
                          minLength={6}
                        />
                      </div>
                      <p className="mt-1 text-xs text-gray-500">Password must be at least 6 characters</p>
                    </div>
                    
                    {/* Admin Checkbox */}
                    <div className="flex items-center">
                      <input
                        id="isAdmin"
                        type="checkbox"
                        checked={newUser.isAdmin}
                        onChange={(e) => setNewUser({...newUser, isAdmin: e.target.checked})}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <div className="ml-3 flex items-center">
                        <ShieldCheck className="h-4 w-4 text-gray-500 mr-1" />
                        <label htmlFor="isAdmin" className="text-sm font-medium text-gray-700">
                          Admin privileges
                        </label>
                      </div>
                    </div>
                    
                    {/* Provider Access Section */}
                    <div className="mt-4">
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Provider Access</h3>
                      <div className="space-y-2">
                        {/* AWS Provider */}
                        <div className="flex items-center">
                          <input
                            id="aws-access"
                            type="checkbox"
                            checked={newUser.providerAccess.aws}
                            onChange={(e) => setNewUser({
                              ...newUser, 
                              providerAccess: {
                                ...newUser.providerAccess,
                                aws: e.target.checked
                              }
                            })}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor="aws-access" className="ml-2 text-sm font-medium text-gray-700">
                            Amazon Web Services (AWS)
                          </label>
                        </div>
                        
                        {/* Azure Provider */}
                        <div className="flex items-center">
                          <input
                            id="azure-access"
                            type="checkbox"
                            checked={newUser.providerAccess.azure}
                            onChange={(e) => setNewUser({
                              ...newUser, 
                              providerAccess: {
                                ...newUser.providerAccess,
                                azure: e.target.checked
                              }
                            })}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor="azure-access" className="ml-2 text-sm font-medium text-gray-700">
                            Microsoft Azure
                          </label>
                        </div>
                        
                        {/* GCP Provider */}
                        <div className="flex items-center">
                          <input
                            id="gcp-access"
                            type="checkbox"
                            checked={newUser.providerAccess.gcp}
                            onChange={(e) => setNewUser({
                              ...newUser, 
                              providerAccess: {
                                ...newUser.providerAccess,
                                gcp: e.target.checked
                              }
                            })}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor="gcp-access" className="ml-2 text-sm font-medium text-gray-700">
                            Google Cloud Platform (GCP)
                          </label>
                        </div>
                        
                        {/* On-Premises Provider */}
                        <div className="flex items-center">
                          <input
                            id="onprem-access"
                            type="checkbox"
                            checked={newUser.providerAccess.onprem}
                            onChange={(e) => setNewUser({
                              ...newUser, 
                              providerAccess: {
                                ...newUser.providerAccess,
                                onprem: e.target.checked
                              }
                            })}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor="onprem-access" className="ml-2 text-sm font-medium text-gray-700">
                            On-Premises Infrastructure
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setIsCreateUserModalOpen(false)}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      disabled={isCreatingUser}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={isCreatingUser}
                    >
                      {isCreatingUser ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Creating...
                        </>
                      ) : (
                        'Create User'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
