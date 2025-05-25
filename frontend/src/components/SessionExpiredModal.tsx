import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface SessionExpiredModalProps {
  show: boolean;
  onClose: () => void;
}

export const SessionExpiredModal: React.FC<SessionExpiredModalProps> = ({ show, onClose }) => {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);
  
  // Reset countdown when modal is shown
  useEffect(() => {
    if (show) {
      setCountdown(5);
    }
  }, [show]);
  
  useEffect(() => {
    if (show) {
      // Start countdown
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            // Redirect to login page
            onClose(); // Close modal first
            navigate('/login', { replace: true }); // Use replace to prevent back navigation
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => {
        clearInterval(timer);
      };
    }
  }, [show, navigate, onClose]);
  
  // If not shown, don't render anything
  if (!show) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full shadow-xl">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Session Expired</h2>
        <p className="text-gray-700 mb-6">
          Your session has expired due to inactivity or token expiration. 
          Please log in again to continue using the application.
        </p>
        <div className="flex justify-between items-center">
          <button
            onClick={() => {
              onClose();
              navigate('/login', { replace: true });
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Log in now
          </button>
          <p className="text-gray-500">
            Redirecting in {countdown} seconds...
          </p>
        </div>
      </div>
    </div>
  );
};
