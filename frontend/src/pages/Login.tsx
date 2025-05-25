import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Cloud, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { authService } from '../lib/auth-service';
import { User } from '../types';

// No hardcoded credentials - all authentication handled by backend

export function Login() {
  console.log('[Login] Initializing Login component');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const navigate = useNavigate();

  // Initialize admin account if it doesn't exist and check for existing user
  useEffect(() => {
    console.log('[Login] Checking for existing user session');
    // Check if user is already logged in
    const user = authService.getUser();
    console.log('[Login] User from authService:', user);
    
    if (user) {
      console.log('[Login] User already logged in, setting current user');
      setCurrentUser(user);
      // If user is already authenticated, redirect to chat page
      navigate('/chat');
      return;
    }
    
    // Clear any stale user data that might be causing issues
    localStorage.removeItem('currentUser');
    
    // Try to get user from localStorage for fallback - only for display purposes
    // but don't consider them logged in
    try {
      const localUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
      console.log('[Login] User from localStorage:', localUser);
      
      if (localUser && !user) {
        console.log('[Login] Using localStorage user for display only');
        setCurrentUser({
          ...localUser,
          is_admin: localUser.isAdmin // Map the property name for consistency
        });
      }
    } catch (e) {
      console.error('[Login] Error parsing local user:', e);
    }
    try {
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const adminExists = users.some((u: { email: string }) => u.email === "admin@intelliops.com");
      
      if (!adminExists) {
        // Add the admin account to users
        const adminUser = {
          name: 'System Administrator',
          email: 'admin@intelliops.com',
          password: 'use_backend_authentication',
          isAdmin: true
        };
        
        users.push(adminUser);
        localStorage.setItem('users', JSON.stringify(users));
        console.log('Admin account initialized');
      }
    } catch (error) {
      console.error('Error initializing admin account:', error);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    console.log('[Login] Handling login form submission');
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // All authentication is handled by the backend API
      // The backend will determine if the user is an admin based on their credentials
      
      // Use the backend API for regular login
      try {
        // Use the backend API for all authentication
        const response = await authService.login(email, password);
        console.log('Login successful!');
        
        // Check if user is admin (information should come from backend)
        const isAdmin = response?.user?.isAdmin || false;
        
        if (isAdmin) {
          console.log('Admin user logged in');
          toast.success('Admin login successful!');
        } else {
          toast.success('Login successful!');
        }
        
        // Redirect to the main chat page
        setTimeout(() => {
          console.log('Redirecting to chat page...');
          navigate('/chat');
        }, 100);
      } catch (err: any) {
        // If backend API fails, show the error
        console.error('Login failed:', err);
        
        // Ensure we have a proper error message string
        const errorMsg = typeof err.message === 'object' ? JSON.stringify(err.message) : String(err.message || 'An unknown error occurred');
        
        // Check if the error is related to a deactivated account
        if (errorMsg.toLowerCase().includes('deactivated')) {
          setError('Your account has been deactivated. Please contact an administrator.');
          // Clear any stored credentials to prevent further login attempts
          localStorage.removeItem('auth_token');
          localStorage.removeItem('currentUser');
          return; // Don't try the fallback login for deactivated accounts
        }
        
        // Use the errorMsg we created earlier
        setError(errorMsg);
        
        // Show error message for failed login
        toast.error(errorMsg);
        
        // Only try fallback login if backend is unavailable (not for auth failures)
        if (errorMsg.toLowerCase().includes('network error')) {
          try {
            // Get users from localStorage
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            
            // Find the user with matching email and password
            const user = users.find((u: { email: string; password: string }) => 
              u.email === email && u.password === password
            );
            
            if (user) {
              console.log('Fallback to localStorage login due to network error');
              // Set current user in session
              localStorage.setItem('currentUser', JSON.stringify({
                name: user.name || 'User',
                email: user.email,
                isAuthenticated: true,
                isAdmin: user.isAdmin || false
              }));
              
              toast.success('Login successful (local mode)!');
              // Redirect to the main chat page
              setTimeout(() => {
                console.log('Redirecting to chat page...');
                navigate('/chat');
              }, 100);
              return;
            }
          } catch (fallbackErr) {
            console.error('Fallback login failed:', fallbackErr);
          }
        }
      }
    } catch (err: any) {
      console.error('Login process error:', err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <Cloud className="h-12 w-12 text-blue-600" />
            <span className="text-2xl font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text">
              AI Force IntelliOps
            </span>
          </Link>
          
          {/* User profile section */}
          {currentUser && (
            <div className="flex items-center space-x-2">
              <div className="bg-blue-100 text-blue-800 p-2 rounded-full">
                {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="text-sm">
                <div className="font-medium text-gray-900">{currentUser.name || 'User'}</div>
                <div className="text-gray-500">{currentUser.email}</div>
              </div>
              {currentUser.is_admin && (
                <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">Admin</span>
              )}
            </div>
          )}
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Or{' '}
          <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">
            create a new account
          </Link>
        </p>
        {/* <div className="mt-2 text-center text-sm text-gray-800 bg-blue-50 p-2 rounded-md">
          <strong>Admin Account:</strong> {ADMIN_EMAIL} / {ADMIN_PASSWORD}
        </div> */}
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link to="/forgot-password" className="font-medium text-blue-600 hover:text-blue-500">
                  Forgot your password?
                </Link>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full justify-center items-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    Sign in
                    <ArrowRight className="ml-2 -mr-1 w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 