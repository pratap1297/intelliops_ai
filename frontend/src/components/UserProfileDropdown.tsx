import { useState, useEffect, useRef } from 'react';
import { User, LogOut, Settings, ChevronDown, Shield } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authService } from '../lib/auth-service';

interface UserData {
  name?: string;
  email: string;
  isAdmin?: boolean;
}

export function UserProfileDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    console.log('[UserProfileDropdown] Initializing component');
    
    // Get user from auth service
    const user = authService.getUser();
    console.log('[UserProfileDropdown] User from authService:', user);
    
    if (user) {
      console.log('[UserProfileDropdown] Setting user data from current user');
      setUserData({
        name: user.name,
        email: user.email,
        isAdmin: user.is_admin
      });
    } else {
      console.log('[UserProfileDropdown] No user found in authService');
      // Try to get user from localStorage as fallback
      try {
        const localUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
        console.log('[UserProfileDropdown] User from localStorage:', localUser);
        
        if (localUser) {
          console.log('[UserProfileDropdown] Setting user data from localStorage');
          setUserData({
            name: localUser.name,
            email: localUser.email,
            isAdmin: localUser.isAdmin || false
          });
        }
      } catch (e) {
        console.error('[UserProfileDropdown] Error parsing local user:', e);
      }
    }
    
    // Subscribe to auth state changes
    console.log('[UserProfileDropdown] Setting up auth state change listener');
    const unsubscribe = authService.onAuthStateChange((updatedUser) => {
      console.log('[UserProfileDropdown] Auth state changed, user:', updatedUser);
      
      if (updatedUser) {
        console.log('[UserProfileDropdown] Setting user data from auth state change');
        setUserData({
          name: updatedUser.name,
          email: updatedUser.email,
          isAdmin: updatedUser.is_admin
        });
      } else {
        console.log('[UserProfileDropdown] No user in auth state change, clearing user data');
        setUserData(null);
      }
    });
    
    return () => unsubscribe();

    // Handle clicks outside of dropdown to close it
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    console.log('[UserProfileDropdown] Handling logout');
    // Use auth service to logout
    authService.logout();
    toast.success('Logged out successfully');
    console.log('[UserProfileDropdown] Navigating to login page');
    navigate('/login');
  };

  // If no user data, don't render anything
  if (!userData) {
    console.log('[UserProfileDropdown] No user data, not rendering component');
    return null;
  }
  
  console.log('[UserProfileDropdown] Rendering with user data:', userData);

  const { name, email, isAdmin } = userData;
  const displayName = name || email.split('@')[0];
  const initials = name ? name.charAt(0).toUpperCase() : email.charAt(0).toUpperCase();

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-white rounded-full border border-gray-200 p-1.5 pl-2 hover:bg-gray-50 transition-colors text-sm focus:outline-none"
      >
        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-medium">
          {initials}
        </div>
        <span className="max-w-[120px] truncate font-medium text-gray-700">{displayName}</span>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg py-2 border border-gray-200 z-50">
          <div className="px-4 py-2 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-900">{name || 'User'}</p>
            <p className="text-xs text-gray-500 truncate">{email}</p>
            {isAdmin && (
              <span className="mt-1 inline-block text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                Admin
              </span>
            )}
          </div>
          <Link
            to="/profile"
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-2"
            onClick={() => setIsOpen(false)}
          >
            <User className="w-4 h-4" />
            Your Profile
          </Link>
          {isAdmin && (
            <Link
              to="/rbac"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-2"
              onClick={() => setIsOpen(false)}
            >
              <Shield className="w-4 h-4" />
              Access Control
            </Link>
          )}
          <Link
            to="/settings"
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-2"
            onClick={() => setIsOpen(false)}
          >
            <Settings className="w-4 h-4" />
            Settings
          </Link>
          <button
            onClick={handleLogout}
            className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
} 