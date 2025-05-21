import { ReactNode } from 'react';
import { IconProps } from 'lucide-react';

// Define the navigation item type
export interface NavItem {
  id: string;         // Unique identifier for the nav item
  title: string;      // Display title
  path: string;       // Route path
  icon: React.ComponentType<IconProps>; // Icon component
  tooltip: string;    // Tooltip description
  requiredRole?: 'user' | 'admin'; // Role required to see this item
  requiredPermission?: string;     // Permission key required
  position: 'sidebar' | 'bottom';  // Position in the sidebar
  order: number;      // Order in the navigation
  isEnabled: boolean; // Whether this item is enabled
}

// Define the user permission type
export interface UserPermissions {
  userId: string;
  email: string;
  navPermissions: Record<string, boolean>; // Map of navItem.id to boolean
}
