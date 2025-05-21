import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Cloud, ArrowRight, EyeOff, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { authService } from '../lib/auth-service';

// Admin access code - in a real app, this would be managed securely in the backend
const ADMIN_ACCESS_CODE = "admin123";

export function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    adminCode: '',
  });
  const [showAdminSection, setShowAdminSection] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      // Try to register with the backend API first
      try {
        // Register the user with the backend API
        const user = await authService.register(
          formData.name,
          formData.email,
          formData.password
        );
        
        console.log('Registration successful with backend API:', user);
        toast.success('Account created successfully!');
        navigate('/chat');
        return;
      } catch (apiError: any) {
        console.error('Backend API registration failed:', apiError);
        
        // If the error is that the user already exists, show that error
        if (apiError.message && apiError.message.includes('already registered')) {
          setError('User with this email already exists');
          setIsLoading(false);
          return;
        }
        
        // For other API errors, fall back to localStorage registration
        console.log('Falling back to localStorage registration');
      }

      // Fallback to localStorage for demo/development
      // Check if user already exists in localStorage
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const userExists = users.some((user: { email: string }) => user.email === formData.email);
      
      if (userExists) {
        setError('User with this email already exists');
        setIsLoading(false);
        return;
      }

      // Check if admin code is valid
      const isAdmin = formData.adminCode === ADMIN_ACCESS_CODE;
      
      if (formData.adminCode && !isAdmin) {
        setError('Invalid admin access code');
        setIsLoading(false);
        return;
      }

      // Create new user in localStorage
      const newUser = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        isAdmin
      };
      
      // Add to users array
      users.push(newUser);
      localStorage.setItem('users', JSON.stringify(users));
      
      // Set current user in session
      localStorage.setItem('currentUser', JSON.stringify({
        name: formData.name,
        email: formData.email,
        isAuthenticated: true,
        isAdmin
      }));
      
      toast.success(`Account created successfully (local mode)${isAdmin ? ' with admin privileges' : ''}!`);
      navigate('/chat');
    } catch (err: any) {
      console.error('Registration process error:', err);
      setError(err.message || 'Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2">
          <Cloud className="h-12 w-12 text-blue-600" />
          <span className="text-2xl font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text">
            AI Force IntelliOps
          </span>
        </Link>
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
          Create your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
            Sign in
          </Link>
        </p>
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
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <div className="mt-1">
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  placeholder="Enter your full name"
                />
              </div>
            </div>

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
                  value={formData.email}
                  onChange={handleChange}
                  className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  placeholder="you@example.com"
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
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm password
              </label>
              <div className="mt-1">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <button
                type="button"
                onClick={() => setShowAdminSection(!showAdminSection)}
                className="text-sm text-blue-600 hover:text-blue-500 font-medium flex items-center gap-1"
              >
                {showAdminSection ? "Hide admin options" : "Register as admin"}
                {showAdminSection ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              
              {showAdminSection && (
                <div className="mt-4">
                  <label htmlFor="adminCode" className="block text-sm font-medium text-gray-700">
                    Admin access code
                  </label>
                  <div className="mt-1">
                    <input
                      id="adminCode"
                      name="adminCode"
                      type="password"
                      autoComplete="off"
                      value={formData.adminCode}
                      onChange={handleChange}
                      className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Enter the admin access code to gain system prompt management privileges.
                  </p>
                </div>
              )}
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
                    Create account
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