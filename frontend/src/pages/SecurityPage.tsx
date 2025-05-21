import React, { useState } from 'react';
import { Shield, Key, Lock, Users, AlertTriangle } from 'lucide-react';
import { AppLayout } from '../components/AppLayout';

interface SecurityMetric {
  id: string;
  title: string;
  value: string;
  status: 'good' | 'warning' | 'critical';
  icon: React.ElementType;
}

interface SecurityAlert {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  timestamp: string;
}

export function SecurityPage() {
  const [metrics] = useState<SecurityMetric[]>([
    {
      id: '1',
      title: 'API Key Rotation',
      value: '7 days ago',
      status: 'good',
      icon: Key,
    },
    {
      id: '2',
      title: 'Active Sessions',
      value: '3',
      status: 'good',
      icon: Users,
    },
    {
      id: '3',
      title: 'Failed Login Attempts',
      value: '2 in last 24h',
      status: 'warning',
      icon: AlertTriangle,
    },
    {
      id: '4',
      title: 'Security Updates',
      value: 'Up to date',
      status: 'good',
      icon: Shield,
    },
  ]);

  const [alerts] = useState<SecurityAlert[]>([
    {
      id: '1',
      title: 'Unusual Login Activity',
      description: 'Multiple login attempts detected from unknown IP address',
      severity: 'medium',
      timestamp: '2 hours ago',
    },
    {
      id: '2',
      title: 'API Key Expiring Soon',
      description: 'AWS API key will expire in 7 days',
      severity: 'low',
      timestamp: '1 day ago',
    },
  ]);

  const renderMetricCard = (metric: SecurityMetric) => {
    const Icon = metric.icon;
    const statusColors = {
      good: 'bg-green-100 text-green-800',
      warning: 'bg-yellow-100 text-yellow-800',
      critical: 'bg-red-100 text-red-800',
    };

    return (
      <div key={metric.id} className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center">
          <div className={`p-2 rounded-lg ${statusColors[metric.status]}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="ml-4">
            <h3 className="text-sm font-medium text-gray-900">{metric.title}</h3>
            <p className="mt-1 text-lg font-semibold text-gray-900">{metric.value}</p>
          </div>
        </div>
      </div>
    );
  };

  const renderAlert = (alert: SecurityAlert) => {
    const severityColors = {
      low: 'bg-blue-50 border-blue-200',
      medium: 'bg-yellow-50 border-yellow-200',
      high: 'bg-red-50 border-red-200',
    };

    return (
      <div
        key={alert.id}
        className={`p-4 rounded-lg border ${severityColors[alert.severity]} mb-4`}
      >
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-gray-400" />
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-gray-900">{alert.title}</h3>
            <p className="mt-1 text-sm text-gray-500">{alert.description}</p>
            <p className="mt-1 text-xs text-gray-400">{alert.timestamp}</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <AppLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Security</h1>
        
        <div className="flex-1 overflow-auto bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {/* Security Metrics */}
            <section>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Security Overview</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {metrics.map(renderMetricCard)}
              </div>
            </section>

            {/* Security Alerts */}
            <section className="mt-8">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Alerts</h2>
              <div className="space-y-4">
                {alerts.map(renderAlert)}
              </div>
            </section>

            {/* Security Actions */}
            <section className="mt-8">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Security Actions</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <button
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Key className="w-4 h-4 mr-2" />
                  Rotate API Keys
                </button>
                <button
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Review Access Permissions
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
