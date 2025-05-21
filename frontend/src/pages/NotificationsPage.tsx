import React, { useState } from 'react';
import { Bell, MessageSquare, AlertTriangle, CheckCircle, Clock, X } from 'lucide-react';
import { AppLayout } from '../components/AppLayout';
import { Header } from '../components/Header';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'message' | 'alert' | 'success';
  timestamp: string;
  read: boolean;
}

export function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      title: 'New Chat Message',
      message: 'You have a new response in your chat thread about AWS infrastructure.',
      type: 'message',
      timestamp: '5 minutes ago',
      read: false,
    },
    {
      id: '2',
      title: 'Security Alert',
      message: 'Unusual activity detected in your account. Please review security logs.',
      type: 'alert',
      timestamp: '1 hour ago',
      read: false,
    },
    {
      id: '3',
      title: 'Deployment Success',
      message: 'Your infrastructure changes have been successfully deployed.',
      type: 'success',
      timestamp: '2 hours ago',
      read: true,
    },
    {
      id: '4',
      title: 'API Key Expiring',
      message: 'Your AWS API key will expire in 7 days. Please rotate it.',
      type: 'alert',
      timestamp: '1 day ago',
      read: true,
    },
  ]);

  const markAsRead = (notificationId: string) => {
    setNotifications(notifications.map(notification =>
      notification.id === notificationId
        ? { ...notification, read: true }
        : notification
    ));
  };

  const deleteNotification = (notificationId: string) => {
    setNotifications(notifications.filter(notification => 
      notification.id !== notificationId
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(notification => ({
      ...notification,
      read: true,
    })));
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'message':
        return <MessageSquare className="w-5 h-5 text-blue-500" />;
      case 'alert':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <AppLayout>
      <Header 
        subtitle={`Notifications ${unreadCount > 0 ? `(${unreadCount})` : ''}`}
        actions={
          unreadCount > 0 ? (
            <button
              onClick={markAllAsRead}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Mark all as read
            </button>
          ) : null
        }
      />
      
      <div className="flex-1 overflow-auto bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {notifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No notifications</h3>
              <p className="mt-1 text-sm text-gray-500">You're all caught up!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`bg-white shadow rounded-lg overflow-hidden transition-colors ${
                    !notification.read ? 'border-l-4 border-blue-500' : ''
                  }`}
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        {getNotificationIcon(notification.type)}
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">
                            {notification.title}
                          </h3>
                          <p className="mt-1 text-sm text-gray-500">
                            {notification.message}
                          </p>
                          <div className="mt-2 flex items-center space-x-2">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span className="text-xs text-gray-500">
                              {notification.timestamp}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {!notification.read && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="text-sm text-blue-600 hover:text-blue-800"
                          >
                            Mark as read
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
