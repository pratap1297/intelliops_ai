import React from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';

interface HeaderProps {
  subtitle?: string;
  showActions?: boolean;
  showNewInfrastructure?: boolean;
  actions?: React.ReactNode;
}

export function Header({ subtitle, showActions = true, showNewInfrastructure = false, actions }: HeaderProps) {
  return (
    <div className="bg-white border-b border-gray-100 py-3 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center">
          {/* Just show subtitle without duplicating app name/logo */}
          {subtitle && (
            <h2 className="text-xl font-medium text-gray-800">{subtitle}</h2>
          )}
          
          {showActions && (
            <div className="flex items-center space-x-4">
              {actions || (
                <>
                  <Link 
                    to="/chat" 
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Return to Chat
                  </Link>
                  {showNewInfrastructure && (
                    <Link 
                      to="/infrastructure/upload" 
                      className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                    >
                      New Infrastructure
                    </Link>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}