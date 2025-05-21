/**
 * RBAC Service
 * Handles role-based access control functionality
 */

import { Role, UserRole, RolePermission, UserRolePermission, ProviderAccess } from '../types';
import { rbacApi } from './api-client';
import { authService } from './auth-service';

class RBACService {
  private roles: Role[] = [];
  private userRoles: UserRole[] = [];
  private rolePermissions: RolePermission[] = [];
  private userPermissions: UserRolePermission[] = [];
  private providerAccess: ProviderAccess[] = [];
  
  /**
   * Load all roles (admin only)
   */
  async loadRoles(): Promise<Role[]> {
    const token = authService.getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }
    
    try {
      this.roles = await rbacApi.getRoles(token);
      return this.roles;
    } catch (error) {
      console.error('Failed to load roles:', error);
      throw error;
    }
  }
  
  /**
   * Create a new role (admin only)
   */
  async createRole(name: string, description?: string): Promise<Role> {
    const token = authService.getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }
    
    if (!authService.isAdmin()) {
      throw new Error('Unauthorized: Admin access required');
    }
    
    try {
      const role = await rbacApi.createRole(token, { name, description });
      this.roles.push(role);
      return role;
    } catch (error) {
      console.error('Failed to create role:', error);
      throw error;
    }
  }
  
  /**
   * Get user roles
   */
  async getUserRoles(userId: number): Promise<UserRole[]> {
    const token = authService.getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }
    
    try {
      this.userRoles = await rbacApi.getUserRoles(token, userId);
      return this.userRoles;
    } catch (error) {
      console.error('Failed to load user roles:', error);
      throw error;
    }
  }
  
  /**
   * Assign role to user (admin only)
   */
  async assignRole(userId: number, roleId: number): Promise<UserRole> {
    const token = authService.getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }
    
    if (!authService.isAdmin()) {
      throw new Error('Unauthorized: Admin access required');
    }
    
    try {
      const userRole = await rbacApi.assignRole(token, userId, roleId);
      this.userRoles.push(userRole);
      return userRole;
    } catch (error) {
      console.error('Failed to assign role:', error);
      throw error;
    }
  }
  
  /**
   * Remove role from user (admin only)
   */
  async removeRole(userId: number, userRoleId: number): Promise<boolean> {
    const token = authService.getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }
    
    if (!authService.isAdmin()) {
      throw new Error('Unauthorized: Admin access required');
    }
    
    try {
      await rbacApi.removeRole(token, userId, userRoleId);
      this.userRoles = this.userRoles.filter(ur => ur.id !== userRoleId);
      return true;
    } catch (error) {
      console.error('Failed to remove role:', error);
      throw error;
    }
  }
  
  /**
   * Get provider access for current user
   */
  async getProviderAccess(): Promise<ProviderAccess[]> {
    const token = authService.getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }
    
    const user = authService.getUser();
    if (!user) {
      throw new Error('User not found');
    }
    
    try {
      this.providerAccess = await rbacApi.getProviderAccess(token, user.id);
      return this.providerAccess;
    } catch (error) {
      console.error(`Failed to load provider access for user ${user.id}:`, error);
      throw error;
    }
  }
  
  /**
   * Get provider access for specific user (admin only)
   */
  async getUserProviderAccess(userId: number): Promise<ProviderAccess[]> {
    const token = authService.getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }
    
    if (!authService.isAdmin() && authService.getUserId() !== userId) {
      throw new Error('Unauthorized: Admin access required');
    }
    
    try {
      return await rbacApi.getUserProviderAccess(token, userId);
    } catch (error) {
      console.error(`Failed to load provider access for user ${userId}:`, error);
      throw error;
    }
  }
  
  /**
   * Create provider access for a user (admin only)
   */
  async createProviderAccess(userId: number, provider: string, hasAccess: boolean = true, isActive: boolean = true): Promise<ProviderAccess> {
    const token = authService.getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }
    
    if (!authService.isAdmin()) {
      throw new Error('Unauthorized: Admin access required');
    }
    
    try {
      const providerAccessData = {
        user_id: userId,
        provider,
        has_access: hasAccess,
        is_active: isActive
      };
      
      const access = await rbacApi.createProviderAccess(token, providerAccessData);
      return access;
    } catch (error) {
      console.error('Failed to create provider access:', error);
      throw error;
    }
  }
  
  /**
   * Update provider access (admin only)
   */
  async updateProviderAccess(userId: number, provider: string, hasAccess: boolean, isActive: boolean): Promise<ProviderAccess> {
    const token = authService.getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }
    
    if (!authService.isAdmin()) {
      throw new Error('Unauthorized: Admin access required');
    }
    
    try {
      const access = await rbacApi.updateProviderAccess(token, userId, provider, hasAccess, isActive);
      
      // Update local cache
      const index = this.providerAccess.findIndex(pa => pa.user_id === userId && pa.provider === provider);
      if (index >= 0) {
        this.providerAccess[index] = access;
      } else {
        this.providerAccess.push(access);
      }
      
      return access;
    } catch (error) {
      console.error('Failed to update provider access:', error);
      throw error;
    }
  }
  
  /**
   * Check if user has access to a specific provider
   */
  hasProviderAccess(provider: string): boolean {
    if (!authService.isAuthenticated()) {
      return false;
    }
    
    const user = authService.getUser();
    if (!user) {
      return false;
    }
    
    // Admins have access to everything
    if (user.is_admin) {
      return true;
    }
    
    // Check provider access
    const access = this.providerAccess.find(pa => 
      pa.user_id === user.id && 
      pa.provider === provider && 
      pa.has_access && 
      pa.is_active
    );
    
    return !!access;
  }
  
  /**
   * Check if user has a specific permission
   */
  hasPermission(permission: string): boolean {
    if (!authService.isAuthenticated()) {
      return false;
    }
    
    const user = authService.getUser();
    if (!user) {
      return false;
    }
    
    // Admins have all permissions
    if (user.is_admin) {
      return true;
    }
    
    // Check user-specific permission overrides
    const userPermission = this.userPermissions.find(up => 
      up.user_id === user.id && 
      up.permission === permission
    );
    
    if (userPermission) {
      return userPermission.granted;
    }
    
    // Check role-based permissions
    const userRoleIds = this.userRoles
      .filter(ur => ur.user_id === user.id)
      .map(ur => ur.role_id);
    
    const hasPermission = this.rolePermissions.some(rp => 
      userRoleIds.includes(rp.role_id) && 
      rp.permission === permission
    );
    
    return hasPermission;
  }
}

// Export a singleton instance
export const rbacService = new RBACService();
