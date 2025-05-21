import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export function ChatNavigation() {
  const location = useLocation();
  
  return (
    <div className="bg-blue-50 p-4 mb-4 rounded-lg">
      <h2 className="text-lg font-medium mb-2">IntelliOps AI Chat</h2>
      <div className="flex space-x-4 flex-wrap">
        <Link 
          to="/original-chat" 
          className={`px-3 py-2 rounded mb-2 ${
            ['/chat', '/original-chat'].includes(location.pathname) 
              ? 'bg-blue-600 text-white font-bold' 
              : 'bg-white text-blue-600 border border-blue-300'
          }`}
        >
          Original Chat
        </Link>
        
        {/* Other options */}
        <Link 
          to="/fixed-chat" 
          className={`px-3 py-2 rounded mb-2 ${
            location.pathname === '/fixed-chat' 
              ? 'bg-blue-600 text-white' 
              : 'bg-white text-blue-600 border border-blue-300'
          }`}
        >
          Fixed Chat
        </Link>
        
        {/* Legacy options hidden in a dropdown */}
        <details className="relative inline-block">
          <summary className="px-3 py-2 rounded mb-2 bg-gray-100 text-gray-600 border border-gray-300 cursor-pointer">
            Other Versions ▾
          </summary>
          <div className="absolute z-10 mt-1 bg-white border border-gray-300 rounded-md shadow-lg p-2 w-48">
            <Link 
              to="/basic-chat" 
              className="block px-3 py-2 rounded mb-1 hover:bg-gray-100"
            >
              Basic Chat (Legacy)
            </Link>
            <Link 
              to="/simple-chat" 
              className="block px-3 py-2 rounded mb-1 hover:bg-gray-100"
            >
              Simple Chat (Legacy)
            </Link>
            <Link 
              to="/legacy-chat" 
              className="block px-3 py-2 rounded hover:bg-gray-100"
            >
              Legacy Chat
            </Link>
          </div>
        </details>
      </div>
      <p className="mt-2 text-sm text-gray-600">
        IntelliOps AI chat helps you manage your cloud infrastructure with natural language commands.
      </p>
    </div>
  );
}
