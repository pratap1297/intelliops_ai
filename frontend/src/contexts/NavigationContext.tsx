import React, { createContext, useContext, useState, useEffect } from 'react';
import { NavItem, UserPermissions } from '../types/navigation';
import { defaultNavItems } from '../config/navigation';
import { authService } from '../lib/auth-service';

interface NavigationContextType {
  navItems: NavItem[];
  updateNavItem: (id: string, updates: Partial<NavItem>) => void;
  addNavItem: (navItem: NavItem) => void;
  removeNavItem: (id: string) => void;
  saveUserPermissions: (userId: string, email: string, permissions: Record<string, boolean>) => void;
  getUserPermissions: (userId: string) => UserPermissions | null;
  userNavItems: NavItem[];
  isLoading: boolean;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [navItems, setNavItems] = useState<NavItem[]>(defaultNavItems);
  const [userPermissions, setUserPermissions] = useState<UserPermissions[]>([]);
  const [userNavItems, setUserNavItems] = useState<NavItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load navigation items from localStorage on mount
  useEffect(() => {
    const loadNavItems = () => {
      try {
        const savedNavItems = localStorage.getItem('nav_items');
        if (savedNavItems) {
          // Parse the saved items
          const parsedItems = JSON.parse(savedNavItems);
          
          // Restore the icon components from defaultNavItems
          const restoredItems = parsedItems.map((item: NavItem) => {
            // Find the matching default item to get its icon
            const defaultItem = defaultNavItems.find(d => d.id === item.id);
            return {
              ...item,
              // Use the icon from defaultNavItems or keep the current one if not found
              icon: defaultItem ? defaultItem.icon : item.icon
            };
          });
          
          setNavItems(restoredItems);
        } else {
          // If no saved nav items, use defaults and save them
          // Only save non-component properties to localStorage
          const serializableItems = defaultNavItems.map(item => ({
            ...item,
            // Don't include the icon in serialized data
            icon: undefined
          }));
          localStorage.setItem('nav_items', JSON.stringify(serializableItems));
          setNavItems(defaultNavItems);
        }
      } catch (error) {
        console.error('Error loading navigation items:', error);
        // Fallback to defaults
        setNavItems(defaultNavItems);
      }
    };

    const loadUserPermissions = () => {
      try {
        const savedPermissions = localStorage.getItem('user_nav_permissions');
        if (savedPermissions) {
          setUserPermissions(JSON.parse(savedPermissions));
        }
      } catch (error) {
        console.error('Error loading user permissions:', error);
        setUserPermissions([]);
      }
    };

    loadNavItems();
    loadUserPermissions();
    setIsLoading(false);
  }, []);

  // Filter nav items based on current user's role and permissions
  useEffect(() => {
    const filterNavItemsForCurrentUser = () => {
      const currentUser = authService.getUser();
      if (!currentUser) {
        setUserNavItems([]);
        return;
      }

      const isAdmin = currentUser.is_admin || false;
      const userId = currentUser.id;

      // Get user-specific permissions
      const userPermission = userPermissions.find(p => p.userId === userId || p.userId === userId.toString());

      // Filter nav items based on role and permissions
      const filteredItems = navItems.filter(item => {
        // Check if item is enabled
        if (!item.isEnabled) return false;

        // Check role requirements
        if (item.requiredRole === 'admin' && !isAdmin) return false;

        // Check specific permissions if user has custom permissions
        if (userPermission && item.id in userPermission.navPermissions) {
          return userPermission.navPermissions[item.id];
        }

        // Default to showing the item if no specific permission is set
        return true;
      });

      setUserNavItems(filteredItems);
    };

    filterNavItemsForCurrentUser();
  }, [navItems, userPermissions]);

  // Update a navigation item
  const updateNavItem = (id: string, updates: Partial<NavItem>) => {
    const updatedItems = navItems.map(item => 
      item.id === id ? { ...item, ...updates } : item
    );
    setNavItems(updatedItems);
    
    // Create a serializable version without icon components
    const serializableItems = updatedItems.map(item => ({
      ...item,
      icon: undefined // Don't include the icon in serialized data
    }));
    localStorage.setItem('nav_items', JSON.stringify(serializableItems));
  };

  // Add a new navigation item
  const addNavItem = (navItem: NavItem) => {
    // Ensure the new item has a unique ID
    if (navItems.some(item => item.id === navItem.id)) {
      console.error('Navigation item with this ID already exists');
      return;
    }
    
    const updatedItems = [...navItems, navItem];
    setNavItems(updatedItems);
    
    // Create a serializable version without icon components
    const serializableItems = updatedItems.map(item => ({
      ...item,
      icon: undefined // Don't include the icon in serialized data
    }));
    localStorage.setItem('nav_items', JSON.stringify(serializableItems));
  };

  // Remove a navigation item
  const removeNavItem = (id: string) => {
    const updatedItems = navItems.filter(item => item.id !== id);
    setNavItems(updatedItems);
    
    // Create a serializable version without icon components
    const serializableItems = updatedItems.map(item => ({
      ...item,
      icon: undefined // Don't include the icon in serialized data
    }));
    localStorage.setItem('nav_items', JSON.stringify(serializableItems));
  };

  // Save user permissions
  const saveUserPermissions = (userId: string, email: string, permissions: Record<string, boolean>) => {
    const updatedPermissions = userPermissions.filter(p => p.userId !== userId);
    const newPermission: UserPermissions = {
      userId,
      email,
      navPermissions: permissions
    };
    
    const newPermissions = [...updatedPermissions, newPermission];
    setUserPermissions(newPermissions);
    localStorage.setItem('user_nav_permissions', JSON.stringify(newPermissions));
    
    // Dispatch an event to notify other components
    const event = new CustomEvent('userNavPermissionsChanged', {
      detail: { userId, permissions }
    });
    document.dispatchEvent(event);
  };

  // Get permissions for a specific user
  const getUserPermissions = (userId: string): UserPermissions | null => {
    return userPermissions.find(p => p.userId === userId) || null;
  };

  return (
    <NavigationContext.Provider
      value={{
        navItems,
        updateNavItem,
        addNavItem,
        removeNavItem,
        saveUserPermissions,
        getUserPermissions,
        userNavItems,
        isLoading
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
};

// Custom hook to use the navigation context
export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};
