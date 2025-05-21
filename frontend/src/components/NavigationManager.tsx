import React, { useState, useEffect } from 'react';
import { useNavigation } from '../contexts/NavigationContext';
import { NavItem } from '../types/navigation';
import { PlusCircle, Edit, Save, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

interface User {
  id: string;
  email: string;
  name?: string;
  is_admin: boolean;
}

export const NavigationManager: React.FC = () => {
  const {
    navItems,
    updateNavItem,
    addNavItem,
    saveUserPermissions,
    getUserPermissions
  } = useNavigation();

  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userPermissions, setUserPermissions] = useState<Record<string, boolean>>({});
  const [editingItem, setEditingItem] = useState<NavItem | null>(null);
  const [newItem, setNewItem] = useState<Partial<NavItem> | null>(null);
  const [showDisabled, setShowDisabled] = useState(false);

  // Load users from localStorage
  useEffect(() => {
    try {
      // In a real app, this would be an API call
      const userAccessStr = localStorage.getItem('user_access');
      if (userAccessStr) {
        const userAccess = JSON.parse(userAccessStr);
        const mappedUsers = userAccess.map((access: any) => ({
          id: access.userId || access.id,
          email: access.email,
          name: access.name,
          is_admin: access.is_admin || false
        }));
        setUsers(mappedUsers);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users');
    }
  }, []);

  // Load user permissions when a user is selected
  useEffect(() => {
    if (selectedUser) {
      const permissions = getUserPermissions(selectedUser.id);
      if (permissions) {
        setUserPermissions(permissions.navPermissions);
      } else {
        // Initialize with default permissions (all enabled)
        const defaultPermissions: Record<string, boolean> = {};
        navItems.forEach(item => {
          // Admin-only items should be false for non-admins by default
          if (item.requiredRole === 'admin' && !selectedUser.is_admin) {
            defaultPermissions[item.id] = false;
          } else {
            defaultPermissions[item.id] = true;
          }
        });
        setUserPermissions(defaultPermissions);
      }
    }
  }, [selectedUser, navItems, getUserPermissions]);

  const handleUserSelect = (userId: string) => {
    const user = users.find(u => u.id === userId);
    setSelectedUser(user || null);
  };

  const handleTogglePermission = (itemId: string) => {
    setUserPermissions(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const handleSavePermissions = () => {
    if (!selectedUser) return;
    
    saveUserPermissions(selectedUser.id, selectedUser.email, userPermissions);
    toast.success(`Permissions saved for ${selectedUser.email}`);
  };

  const handleToggleItemEnabled = (itemId: string) => {
    const item = navItems.find(item => item.id === itemId);
    if (item) {
      updateNavItem(itemId, { isEnabled: !item.isEnabled });
      toast.success(`${item.title} ${!item.isEnabled ? 'enabled' : 'disabled'}`);
    }
  };

  const handleEditItem = (item: NavItem) => {
    setEditingItem(item);
  };

  const handleSaveEdit = () => {
    if (!editingItem) return;
    
    updateNavItem(editingItem.id, editingItem);
    setEditingItem(null);
    toast.success(`${editingItem.title} updated`);
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
  };

  // Remove item functionality has been disabled to prevent any user from deleting navigation items

  const handleAddNewItem = () => {
    setNewItem({
      id: '',
      title: '',
      path: '',
      tooltip: '',
      position: 'sidebar',
      order: navItems.length + 10,
      isEnabled: true
    });
  };

  const handleSaveNewItem = () => {
    if (!newItem || !newItem.id || !newItem.title || !newItem.path) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Check for duplicate ID
    if (navItems.some(item => item.id === newItem.id)) {
      toast.error('An item with this ID already exists');
      return;
    }

    // We need to cast here because we know we have all required fields
    addNavItem(newItem as NavItem);
    setNewItem(null);
    toast.success('New navigation item added');
  };

  const handleCancelNewItem = () => {
    setNewItem(null);
  };

  const filteredNavItems = showDisabled 
    ? navItems 
    : navItems.filter(item => item.isEnabled);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Navigation & Feature Management</h1>
      
      {/* Navigation Items Management */}
      <div className="mb-8 bg-white p-4 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Navigation Items</h2>
          <div className="flex gap-4">
            <button
              onClick={() => setShowDisabled(!showDisabled)}
              className="flex items-center gap-1 text-sm px-3 py-1 rounded bg-gray-100 hover:bg-gray-200"
            >
              {showDisabled ? <Eye size={16} /> : <EyeOff size={16} />}
              {showDisabled ? 'Show All' : 'Show Enabled Only'}
            </button>
            <button
              onClick={handleAddNewItem}
              className="flex items-center gap-1 text-sm px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
            >
              <PlusCircle size={16} />
              Add New Item
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Path</th>
                <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
                <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Required Role</th>
                <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredNavItems.map(item => (
                <tr key={item.id} className={!item.isEnabled ? 'bg-gray-50 text-gray-500' : ''}>
                  <td className="py-2 px-3 text-sm">{item.id}</td>
                  <td className="py-2 px-3 text-sm">{item.title}</td>
                  <td className="py-2 px-3 text-sm">{item.path}</td>
                  <td className="py-2 px-3 text-sm">{item.position}</td>
                  <td className="py-2 px-3 text-sm">{item.order}</td>
                  <td className="py-2 px-3 text-sm">{item.requiredRole || 'None'}</td>
                  <td className="py-2 px-3 text-sm">
                    <span className={`px-2 py-1 text-xs rounded-full ${item.isEnabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {item.isEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-sm">
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => handleToggleItemEnabled(item.id)}
                        className={`p-1 rounded ${item.isEnabled ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`}
                        title={item.isEnabled ? 'Disable' : 'Enable'}
                      >
                        {item.isEnabled ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                      <button 
                        onClick={() => handleEditItem(item)}
                        className="p-1 rounded text-blue-600 hover:bg-blue-50"
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>
                      {/* Delete button removed to prevent navigation item deletion */}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Edit Item Modal */}
        {editingItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Edit Navigation Item</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ID</label>
                  <input 
                    type="text" 
                    value={editingItem.id} 
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input 
                    type="text" 
                    value={editingItem.title} 
                    onChange={(e) => setEditingItem({...editingItem, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Path</label>
                  <input 
                    type="text" 
                    value={editingItem.path} 
                    onChange={(e) => setEditingItem({...editingItem, path: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tooltip</label>
                  <input 
                    type="text" 
                    value={editingItem.tooltip} 
                    onChange={(e) => setEditingItem({...editingItem, tooltip: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                    <select
                      value={editingItem.position}
                      onChange={(e) => setEditingItem({...editingItem, position: e.target.value as 'sidebar' | 'bottom'})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="sidebar">Sidebar</option>
                      <option value="bottom">Bottom</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
                    <input 
                      type="number" 
                      value={editingItem.order} 
                      onChange={(e) => setEditingItem({...editingItem, order: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Required Role</label>
                  <select
                    value={editingItem.requiredRole || ''}
                    onChange={(e) => {
                      const role = e.target.value === '' ? undefined : e.target.value as 'user' | 'admin';
                      setEditingItem({...editingItem, requiredRole: role});
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">None</option>
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="flex items-center">
                  <input 
                    type="checkbox" 
                    id="isEnabled" 
                    checked={editingItem.isEnabled} 
                    onChange={(e) => setEditingItem({...editingItem, isEnabled: e.target.checked})}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                  />
                  <label htmlFor="isEnabled" className="ml-2 block text-sm text-gray-900">Enabled</label>
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <button 
                  onClick={handleCancelEdit}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveEdit}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add New Item Modal */}
        {newItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Add New Navigation Item</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ID *</label>
                  <input 
                    type="text" 
                    value={newItem.id} 
                    onChange={(e) => setNewItem({...newItem, id: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="unique-id"
                  />
                  <p className="text-xs text-gray-500 mt-1">Unique identifier, use lowercase with hyphens</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <input 
                    type="text" 
                    value={newItem.title} 
                    onChange={(e) => setNewItem({...newItem, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Display Title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Path *</label>
                  <input 
                    type="text" 
                    value={newItem.path} 
                    onChange={(e) => setNewItem({...newItem, path: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="/path"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tooltip</label>
                  <input 
                    type="text" 
                    value={newItem.tooltip} 
                    onChange={(e) => setNewItem({...newItem, tooltip: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Descriptive tooltip"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                    <select
                      value={newItem.position}
                      onChange={(e) => setNewItem({...newItem, position: e.target.value as 'sidebar' | 'bottom'})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="sidebar">Sidebar</option>
                      <option value="bottom">Bottom</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
                    <input 
                      type="number" 
                      value={newItem.order} 
                      onChange={(e) => setNewItem({...newItem, order: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Required Role</label>
                  <select
                    value={newItem.requiredRole || ''}
                    onChange={(e) => {
                      const role = e.target.value === '' ? undefined : e.target.value as 'user' | 'admin';
                      setNewItem({...newItem, requiredRole: role});
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">None</option>
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="flex items-center">
                  <input 
                    type="checkbox" 
                    id="newItemEnabled" 
                    checked={newItem.isEnabled} 
                    onChange={(e) => setNewItem({...newItem, isEnabled: e.target.checked})}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                  />
                  <label htmlFor="newItemEnabled" className="ml-2 block text-sm text-gray-900">Enabled</label>
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <button 
                  onClick={handleCancelNewItem}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveNewItem}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
                >
                  Add Item
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* User Permissions Management */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">User Permissions</h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Select User</label>
          <select
            value={selectedUser?.id || ''}
            onChange={(e) => handleUserSelect(e.target.value)}
            className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="">-- Select a user --</option>
            {users.map(user => (
              <option key={user.id} value={user.id}>
                {user.email} {user.is_admin ? '(Admin)' : ''}
              </option>
            ))}
          </select>
        </div>
        
        {selectedUser && (
          <div>
            <h3 className="text-md font-medium mb-2">Navigation Permissions for {selectedUser.email}</h3>
            <div className="bg-gray-50 p-3 rounded mb-4">
              <p className="text-sm text-gray-600">
                {selectedUser.is_admin 
                  ? 'This user is an admin and has access to all features by default. You can still customize their permissions below.'
                  : 'Configure which navigation items this user can access.'}
              </p>
            </div>
            
            <div className="space-y-2 mb-4">
              {navItems.map(item => (
                <div key={item.id} className="flex items-center py-2 border-b border-gray-100">
                  <input
                    type="checkbox"
                    id={`perm-${item.id}`}
                    checked={userPermissions[item.id] || false}
                    onChange={() => handleTogglePermission(item.id)}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                    disabled={!item.isEnabled}
                  />
                  <label htmlFor={`perm-${item.id}`} className="ml-2 block text-sm text-gray-900 flex-1">
                    {item.title}
                    {item.requiredRole === 'admin' && (
                      <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">Admin Only</span>
                    )}
                    {!item.isEnabled && (
                      <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">Disabled</span>
                    )}
                  </label>
                </div>
              ))}
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={handleSavePermissions}
                className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
              >
                <Save size={16} />
                Save Permissions
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
