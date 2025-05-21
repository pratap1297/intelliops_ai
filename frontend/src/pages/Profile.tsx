import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit2, CheckCircle, Lock, Key } from 'lucide-react';
import { authService } from '../lib/auth-service';
import { AppLayout } from '../components/AppLayout';
import { Header } from '../components/Header';
import { API_BASE_URL } from '../config';

interface UserData {
  email: string;
  isAdmin: boolean;
  isAuthenticated: boolean;
  name?: string;
}

export function Profile() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Password change state
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    // Check if user is authenticated and get user data
    try {
      // First try to get user from authService
      const user = authService.getUser();
      if (user) {
        const userData = {
          email: user.email,
          isAdmin: user.is_admin || false,
          isAuthenticated: true,
          name: user.name || user.email.split('@')[0]
        };
        setUserData(userData);
        setEditName(userData.name || '');
        return;
      }
      
      // Fallback to localStorage if authService doesn't have user data
      const currentUser = localStorage.getItem('currentUser');
      if (!currentUser) {
        navigate('/login');
        return;
      }
      
      const parsedUser = JSON.parse(currentUser);
      if (!parsedUser.isAuthenticated) {
        navigate('/login');
        return;
      }
      
      setUserData(parsedUser);
      setEditName(parsedUser.name || '');
    } catch (error) {
      console.error('Error loading user data:', error);
      navigate('/login');
    }
  }, [navigate]);

  if (!userData) {
    return <div className="p-8 text-center">Loading profile...</div>;
  }

  const handleSave = () => {
    if (editName.trim() === '') {
      setMessage({ 
        type: 'error', 
        text: 'Name cannot be empty' 
      });
      return;
    }

    try {
      const updatedUser = {
        ...userData,
        name: editName.trim()
      };
      
      // Try to update via API if possible
      const token = authService.getToken();
      if (token) {
        // Ensure API_BASE_URL is properly formatted without trailing slash
        const apiUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
        fetch(`${apiUrl}/api/users/me`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ name: editName.trim() })
        }).catch(error => {
          console.warn('API update failed, falling back to localStorage:', error);
        });
      }
      
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      setUserData(updatedUser);
      setIsEditing(false);
      
      setMessage({ 
        type: 'success', 
        text: 'Profile updated successfully' 
      });
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ 
        type: 'error', 
        text: 'Failed to update profile' 
      });
    }
  };
  
  // Handle password change
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate passwords
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setMessage({
        type: 'error',
        text: 'All password fields are required'
      });
      return;
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({
        type: 'error',
        text: 'New password and confirmation do not match'
      });
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      setMessage({
        type: 'error',
        text: 'New password must be at least 6 characters long'
      });
      return;
    }
    
    try {
      setPasswordLoading(true);
      
      // Get auth token
      const token = authService.getToken();
      if (!token) {
        throw new Error('Authentication token not available');
      }
      
      // Call API to change password
      // Ensure API_BASE_URL is properly formatted without trailing slash
      const apiUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
      const response = await fetch(`${apiUrl}/api/users/me/password`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          current_password: passwordData.currentPassword,
          new_password: passwordData.newPassword
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `API returned ${response.status}: ${response.statusText}`);
      }
      
      // Reset form
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      setIsChangingPassword(false);
      
      // Show success message
      setMessage({
        type: 'success',
        text: 'Password changed successfully'
      });
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 3000);
      
    } catch (error) {
      console.error('Error changing password:', error);
      setMessage({
        type: 'error',
        text: `Failed to change password: ${error instanceof Error ? error.message : String(error)}`
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  const getUserInitials = () => {
    if (!userData.name) return 'U';
    const nameParts = userData.name.split(' ');
    if (nameParts.length === 1) return nameParts[0][0].toUpperCase();
    return (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
  };

  return (
    <AppLayout>
      {/* Header */}
      <Header 
        subtitle="User Profile" 
        showActions={false}
      />

      <div className="flex-1 overflow-auto bg-gray-50 p-4">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-8">
              <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-semibold mr-4">
                {getUserInitials()}
              </div>
              
              <div>
                {isEditing ? (
                  <div className="flex flex-col">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter your name"
                    />
                    <div className="flex space-x-2">
                      <button 
                        onClick={handleSave}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                      >
                        Save
                      </button>
                      <button 
                        onClick={() => {
                          setIsEditing(false);
                          setEditName(userData.name || '');
                          setMessage({ type: '', text: '' });
                        }}
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center">
                    <h2 className="text-xl font-semibold">{userData.name || 'User'}</h2>
                    <button 
                      onClick={() => setIsEditing(true)} 
                      className="ml-2 p-1 text-gray-500 hover:text-blue-600 transition-colors"
                      aria-label="Edit name"
                    >
                      <Edit2 size={16} />
                    </button>
                  </div>
                )}
                <p className="text-gray-600">{userData.email}</p>
                {userData.isAdmin && (
                  <span className="inline-flex items-center px-2.5 py-0.5 mt-2 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Admin
                  </span>
                )}
              </div>
            </div>

            {message.text && (
              <div className={`p-3 rounded-md mb-4 ${
                message.type === 'error' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
              }`}>
                <div className="flex items-center">
                  {message.type === 'success' && <CheckCircle size={16} className="mr-2" />}
                  {message.text}
                </div>
              </div>
            )}

            <div className="border-t border-gray-200 pt-4">
              <h3 className="font-medium text-gray-900 mb-2">Account Information</h3>
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="mt-1 text-sm text-gray-900">{userData.email}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Role</dt>
                  <dd className="mt-1 text-sm text-gray-900">{userData.isAdmin ? 'Administrator' : 'User'}</dd>
                </div>
              </dl>
            </div>
            
            <div className="border-t border-gray-200 pt-4 mt-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium text-gray-900">Password Management</h3>
                <button
                  onClick={() => setIsChangingPassword(!isChangingPassword)}
                  className="inline-flex items-center px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  {isChangingPassword ? 'Cancel' : 'Change Password'}
                </button>
              </div>
              
              {isChangingPassword && (
                <form onSubmit={handlePasswordChange} className="bg-gray-50 rounded-md p-4">
                  <div className="space-y-4">
                    {/* Current Password */}
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
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          placeholder="••••••••"
                          required
                        />
                      </div>
                    </div>
                    
                    {/* New Password */}
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
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          placeholder="••••••••"
                          required
                          minLength={6}
                        />
                      </div>
                      <p className="mt-1 text-xs text-gray-500">Password must be at least 6 characters</p>
                    </div>
                    
                    {/* Confirm Password */}
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
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          placeholder="••••••••"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={passwordLoading}
                      >
                        {passwordLoading ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Updating...
                          </>
                        ) : (
                          'Update Password'
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="max-w-3xl mx-auto flex justify-center items-center">
          <span className="text-gray-600 text-sm">IntelliOps &copy; {new Date().getFullYear()}</span>
        </div>
      </div>
    </AppLayout>
  );
} 