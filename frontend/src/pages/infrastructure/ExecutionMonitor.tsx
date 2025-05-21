import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, XCircle, RotateCcw, ArrowLeft, Loader } from 'lucide-react';
import { Link } from 'react-router-dom';
import { streamExecutionUpdates } from '../../lib/services';
import toast from 'react-hot-toast';
import { Header } from '../../components/Header';

interface LogEntry {
  id: string;
  timestamp: Date;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
}

export function ExecutionMonitor() {
  const [status, setStatus] = useState<'initializing' | 'in_progress' | 'completed' | 'failed' | 'rolling_back'>('initializing');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [isRollingBack, setIsRollingBack] = useState(false);

  useEffect(() => {
    let mounted = true;
    
    const monitorExecution = async () => {
      try {
        for await (const update of streamExecutionUpdates()) {
          if (!mounted) break;
          
          setProgress(update.progress);
          addLog(update.message, getLogType(update.status));
          
          if (update.status === 'completed') {
            setStatus('completed');
            toast.success('Deployment completed successfully');
          } else if (update.status === 'failed') {
            setStatus('failed');
            setError(update.message);
            toast.error(update.message);
            
            // Load rollback plan
            const rollbackPlan = localStorage.getItem('rollback_plan');
            if (rollbackPlan) {
              addLog('Rollback plan is available', 'info');
              addLog('Rollback plan:', 'info');
              addLog(rollbackPlan, 'info');
            }
          }
        }
      } catch (error) {
        console.error('Execution monitoring failed:', error);
        if (mounted) {
          setStatus('failed');
          const errorMessage = error instanceof Error ? error.message : 'Failed to monitor execution';
          setError(errorMessage);
          toast.error(errorMessage);
          addLog(`Error: ${errorMessage}`, 'error');
        }
      }
    };

    monitorExecution();

    return () => {
      mounted = false;
    };
  }, []);

  const getLogType = (status: string): LogEntry['type'] => {
    switch (status) {
      case 'completed': return 'success';
      case 'failed': return 'error';
      default: return 'info';
    }
  };

  const addLog = (message: string, type: LogEntry['type']) => {
    const newLog: LogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      message,
      type,
    };
    
    setLogs(prev => [...prev, newLog]);
  };

  const handleRollback = async () => {
    try {
      setIsRollingBack(true);
      setStatus('rolling_back');
      
      const rollbackPlan = localStorage.getItem('rollback_plan');
      if (!rollbackPlan) {
        throw new Error('No rollback plan available');
      }

      addLog('Starting rollback process...', 'warning');
      setProgress(0);

      // Simulate rollback steps
      const steps = [
        { message: 'Validating rollback plan...', progress: 20 },
        { message: 'Reverting infrastructure changes...', progress: 40 },
        { message: 'Cleaning up resources...', progress: 60 },
        { message: 'Verifying rollback...', progress: 80 },
        { message: 'Rollback completed successfully', progress: 100 }
      ];

      for (const step of steps) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        setProgress(step.progress);
        addLog(step.message, step.progress === 100 ? 'success' : 'info');
      }

      setStatus('completed');
      setError(null);
      toast.success('Rollback completed successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Rollback failed';
      setError(errorMessage);
      addLog(`Rollback failed: ${errorMessage}`, 'error');
      toast.error(errorMessage);
    } finally {
      setIsRollingBack(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header 
        subtitle="Monitor your infrastructure deployment"
      />
      
      <div className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Link
              to="/infrastructure/plan"
              className="inline-flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Plan
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-2xl font-semibold text-gray-900">
                Deployment Progress
              </h1>
              {status === 'failed' && !isRollingBack && (
                <button
                  onClick={handleRollback}
                  className="flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
                  disabled={isRollingBack}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  {isRollingBack ? 'Rolling back...' : 'Rollback Changes'}
                </button>
              )}
            </div>

            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  {status === 'initializing' ? 'Initializing...' :
                   status === 'in_progress' ? 'Deploying...' :
                   status === 'rolling_back' ? 'Rolling back...' :
                   status === 'completed' ? 'Completed' : 'Failed'}
                </span>
                <span className="text-sm text-gray-500">{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${
                    status === 'failed' ? 'bg-red-600' :
                    status === 'completed' ? 'bg-green-600' :
                    status === 'rolling_back' ? 'bg-yellow-600' : 'bg-blue-600'
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Status Indicator */}
            {(status === 'completed' || status === 'failed') && (
              <div className={`p-4 rounded-lg mb-6 ${
                status === 'completed' ? 'bg-green-50' : 'bg-red-50'
              }`}>
                <div className="flex items-center space-x-3">
                  {status === 'completed' ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                  <div>
                    <h3 className={`font-medium ${
                      status === 'completed' ? 'text-green-900' : 'text-red-900'
                    }`}>
                      {status === 'completed' ? 'Deployment Completed' : 'Deployment Failed'}
                    </h3>
                    {error && <p className="text-sm text-red-800 mt-1">{error}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* Logs */}
            <div className="border border-gray-200 rounded-lg">
              <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                <h2 className="text-sm font-medium text-gray-700">Deployment Logs</h2>
              </div>
              <div className="p-4 max-h-96 overflow-y-auto space-y-2">
                {logs.map((log) => (
                  <div key={log.id} className="flex items-start space-x-3">
                    <span className="flex-shrink-0 mt-1">
                      {log.type === 'info' && <div className="w-2 h-2 rounded-full bg-blue-600" />}
                      {log.type === 'warning' && <AlertTriangle className="w-4 h-4 text-yellow-600" />}
                      {log.type === 'error' && <XCircle className="w-4 h-4 text-red-600" />}
                      {log.type === 'success' && <CheckCircle className="w-4 h-4 text-green-600" />}
                    </span>
                    <div>
                      <span className="text-sm text-gray-500">
                        {log.timestamp.toLocaleTimeString()}
                      </span>
                      <p className={`text-sm ${
                        log.type === 'error' ? 'text-red-800' :
                        log.type === 'warning' ? 'text-yellow-800' :
                        log.type === 'success' ? 'text-green-800' :
                        'text-gray-900'
                      }`}>
                        {log.message}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}