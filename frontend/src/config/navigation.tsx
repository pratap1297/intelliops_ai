import {
  PlusCircle,
  History,
  Layout,
  BookOpen,
  FileText,
  Shield,
  Bell,
  DollarSign,
  Settings,
  Users,
  Database
} from 'lucide-react';
import { NavItem } from '../types/navigation';

// Default navigation items configuration
export const defaultNavItems: NavItem[] = [
  {
    id: 'new-chat',
    title: 'New Chat',
    path: '/chat',
    icon: PlusCircle,
    tooltip: 'Start a new conversation',
    position: 'sidebar',
    order: 10,
    isEnabled: true
  },
  {
    id: 'chat-history',
    title: 'Chat History',
    path: '/chat/history',
    icon: History,
    tooltip: 'Browse saved conversations',
    position: 'sidebar',
    order: 20,
    isEnabled: true
  },
  {
    id: 'infrastructure',
    title: 'Infrastructure',
    path: '/infrastructure',
    icon: Layout,
    tooltip: 'Manage cloud infrastructure',
    position: 'sidebar',
    order: 30,
    isEnabled: true
  },
  {
    id: 'prompt-library',
    title: 'Prompt Library',
    path: '/prompt-library',
    icon: BookOpen,
    tooltip: 'Access saved prompts & templates',
    position: 'sidebar',
    order: 40,
    isEnabled: true
  },
  {
    id: 'logs',
    title: 'System Logs',
    path: '/logs',
    icon: FileText,
    tooltip: 'View system activity logs',
    position: 'sidebar',
    order: 50,
    isEnabled: true
  },
  {
    id: 'security',
    title: 'Security',
    path: '/security',
    icon: Shield,
    tooltip: 'Manage security & permissions',
    requiredRole: 'admin',
    position: 'sidebar',
    order: 60,
    isEnabled: true
  },
  {
    id: 'notifications',
    title: 'Notifications',
    path: '/notifications',
    icon: Bell,
    tooltip: 'View alerts & notifications',
    position: 'sidebar',
    order: 70,
    isEnabled: true
  },
  {
    id: 'finops',
    title: 'FinOps',
    path: '/finops',
    icon: DollarSign,
    tooltip: 'Monitor cloud costs & usage',
    requiredRole: 'admin',
    position: 'sidebar',
    order: 80,
    isEnabled: true
  },
  {
    id: 'settings',
    title: 'Settings',
    path: '/settings',
    icon: Settings,
    tooltip: 'Application settings',
    position: 'bottom',
    order: 90,
    isEnabled: true
  },
  {
    id: 'navigation-manager',
    title: 'Navigation Manager',
    path: '/navigation-manager',
    icon: Database,
    tooltip: 'Manage navigation items and permissions',
    position: 'bottom',
    order: 95,
    isEnabled: true,
    requiredRole: 'admin'
  },
  {
    id: 'rbac',
    title: 'User Management',
    path: '/rbac',
    icon: Users,
    tooltip: 'Manage users and permissions',
    requiredRole: 'admin',
    position: 'sidebar',
    order: 90,
    isEnabled: true
  },
  {
    id: 'backend-test',
    title: 'Backend Test',
    path: '/backend-test',
    icon: Database,
    tooltip: 'Test backend connectivity',
    requiredRole: 'admin',
    position: 'sidebar',
    order: 100,
    isEnabled: false
  }
];

// Function to get navigation items for a specific position
export const getNavItemsByPosition = (position: 'sidebar' | 'bottom', navItems: NavItem[]): NavItem[] => {
  return navItems
    .filter(item => item.position === position && item.isEnabled)
    .sort((a, b) => a.order - b.order);
};
