import { useState, useEffect } from 'react';
import { AppLayout } from '../components/AppLayout';
import { NavigationProvider } from '../contexts/NavigationContext';
import { authService } from '../lib/auth-service';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../config';

export function BackendTestPage() {
  const [tableList, setTableList] = useState<string[]>([]);
  const [tableStates, setTableStates] = useState<Record<string, {
    rows: any[];
    page: number;
    pageSize: number;
    total: number;
    loading: boolean;
    error: string | null;
    filter: string;
    filterValue: string;
  }>>({});
  const [activeTab, setActiveTab] = useState<string>('testing');

  // Fetch all table names on mount
  useEffect(() => {
    const fetchTableList = async () => {
      try {
        const apiUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
        console.log('Fetching table list from:', `${apiUrl}/api/debug/orm-table-list`);
        const resp = await fetch(`${apiUrl}/api/debug/orm-table-list`);
        if (!resp.ok) {
          const errorText = await resp.text();
          console.error('Failed to fetch table list:', resp.status, errorText);
          toast.error(`API Error: ${resp.status} - ${errorText || resp.statusText}`);
          return;
        }
        const data = await resp.json();
        console.log('Table list data:', data);
        setTableList(data.tables || []);
        // Init state for each table
        const states: any = {};
        (data.tables || []).forEach((t: string) => {
          states[t] = {
            rows: [],
            page: 1,
            pageSize: 50,
            total: 0,
            loading: false,
            error: null,
            filter: '',
            filterValue: ''
          };
        });
        setTableStates(states);
      } catch (err) {
        console.error('Error fetching table list:', err);
        toast.error(`Error fetching table list: ${err instanceof Error ? err.message : String(err)}`);
      }
    };
    fetchTableList();
  }, []);

  // Fetch data for a table
  const fetchTableData = async (table: string, page: number, pageSize: number, filter: string) => {
    setTableStates(s => ({ ...s, [table]: { ...s[table], loading: true, error: null } }));
    try {
      const apiUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
      const params = new URLSearchParams({ table, page: String(page), page_size: String(pageSize) });
      if (filter) params.append('filter', filter);
      const url = `${apiUrl}/api/debug/orm-table-data?${params}`;
      console.log(`Fetching table data for ${table} from:`, url);
      const resp = await fetch(url);
      if (!resp.ok) {
        const errorText = await resp.text();
        console.error(`Failed to fetch table data for ${table}:`, resp.status, errorText);
        setTableStates(s => ({ ...s, [table]: { ...s[table], loading: false, error: `API Error: ${resp.status} - ${errorText || resp.statusText}` } }));
        return;
      }
      const data = await resp.json();
      console.log(`Table data for ${table}:`, data);
      setTableStates(s => ({
        ...s,
        [table]: {
          ...s[table],
          rows: data.rows || [],
          page: data.page,
          pageSize: data.page_size,
          total: data.total ?? 0,
          loading: false,
          error: null,
        },
      }));
    } catch (err: any) {
      console.error(`Error fetching table data for ${table}:`, err);
      setTableStates(s => ({ ...s, [table]: { ...s[table], loading: false, error: `Error: ${err.message || 'Failed to fetch data'}` } }));
    }
  };

  // Fetch data for all tables when tableList changes
  useEffect(() => {
    tableList.forEach(table => {
      fetchTableData(table, 1, 50, '');
    });
    // eslint-disable-next-line
  }, [tableList]);

  // Handler for pagination and filtering
  const handlePageChange = (table: string, newPage: number) => {
    const state = tableStates[table];
    fetchTableData(table, newPage, state.pageSize, state.filter);
  };
  const handlePageSizeChange = (table: string, newPageSize: number) => {
    const state = tableStates[table];
    fetchTableData(table, 1, newPageSize, state.filter);
  };
  const handleFilterChange = (table: string, filterValue: string) => {
    setTableStates(s => ({ ...s, [table]: { ...s[table], filterValue } }));
  };
  const handleFilterApply = (table: string) => {
    const state = tableStates[table];
    let filterStr = '';
    try {
      if (state.filterValue.trim()) {
        // Expecting key:value or JSON
        if (state.filterValue.trim().startsWith('{')) {
          filterStr = state.filterValue;
        } else if (state.filterValue.includes(':')) {
          const [k, v] = state.filterValue.split(':');
          filterStr = JSON.stringify({ [k.trim()]: v.trim() });
        }
      }
    } catch (err) {
      // Silently handle parsing errors
      console.error('Filter parsing error:', err);
    }
    fetchTableData(table, 1, state.pageSize, filterStr);
    setTableStates(s => ({ ...s, [table]: { ...s[table], filter: filterStr } }));
  };


  const [isLoading, setIsLoading] = useState(false);
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [testEmail, setTestEmail] = useState('test@example.com');
  const [testPassword, setTestPassword] = useState('password123');
  const [testName, setTestName] = useState('Test User');
  const [apiResponse, setApiResponse] = useState<any>(null);

  // Function to test the backend health endpoint
  const checkBackendHealth = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Ensure API_BASE_URL is properly formatted without trailing slash
      const apiUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
      const response = await fetch(`${apiUrl}/api/health`);
      const data = await response.json();
      setHealthStatus(data);
      if (data.status === 'ok') {
        toast.success('Backend is healthy!');
      } else {
        toast.error('Backend health check failed');
      }
    } catch (err: any) {
      setError(`Health check failed: ${err.message}`);
      toast.error(`Backend connection failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to test user registration
  const testRegistration = async () => {
    setIsLoading(true);
    setError(null);
    setApiResponse(null);
    try {
      // Ensure API_BASE_URL is properly formatted without trailing slash
      const apiUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
      const response = await fetch(`${apiUrl}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: testName,
          email: testEmail,
          password: testPassword
        })
      });
      
      const data = await response.json();
      setApiResponse(data);
      
      if (response.ok) {
        toast.success('Registration successful!');
      } else {
        const errorMessage = typeof data.detail === 'object' ? JSON.stringify(data.detail) : data.detail;
        toast.error(`Registration failed: ${errorMessage || 'Unknown error'}`);
        setError(errorMessage || 'Registration failed');
      }
    } catch (err: any) {
      setError(`Registration failed: ${err.message}`);
      toast.error(`API call failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to test user login
  const testLogin = async () => {
    setIsLoading(true);
    setError(null);
    setApiResponse(null);
    try {
      // The login endpoint expects form data, not JSON
      const formData = new URLSearchParams();
      formData.append('username', testEmail);
      formData.append('password', testPassword);
      
      // Ensure API_BASE_URL is properly formatted without trailing slash
      const apiUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
      const response = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData
      });
      
      const data = await response.json();
      setApiResponse(data);
      
      if (response.ok) {
        toast.success('Login successful!');
        // Try to get user profile with the token
        await getUserProfile(data.access_token);
      } else {
        const errorMessage = typeof data.detail === 'object' ? JSON.stringify(data.detail) : data.detail;
        toast.error(`Login failed: ${errorMessage || 'Unknown error'}`);
        setError(errorMessage || 'Login failed');
      }
    } catch (err: any) {
      setError(`Login failed: ${err.message}`);
      toast.error(`API call failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to get user profile with token
  const getUserProfile = async (token: string) => {
    try {
      // Ensure API_BASE_URL is properly formatted without trailing slash
      const apiUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
      const response = await fetch(`${apiUrl}/api/users/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setUserProfile(data);
        toast.success('Profile retrieved successfully!');
      } else {
        toast.error(`Profile retrieval failed: ${data.detail || 'Unknown error'}`);
      }
    } catch (err: any) {
      toast.error(`Profile API call failed: ${err.message}`);
    }
  };

  // Function to test login with auth service
  const testAuthServiceLogin = async () => {
    setIsLoading(true);
    setError(null);
    setApiResponse(null);
    try {
      const response = await authService.login(testEmail, testPassword);
      setApiResponse(response);
      toast.success('Auth service login successful!');
      
      // If we have a token, try to get the user profile
      if (response.access_token) {
        await getUserProfile(response.access_token);
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Unknown error';
      setError(`Auth service login failed: ${errorMessage}`);
      toast.error(`Auth service login failed: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <NavigationProvider>
      <AppLayout>
        <div className="container mx-auto py-8">
          <h1 className="text-2xl font-bold mb-6">Backend API Test Page</h1>
          
          {/* Tab Bar - Always visible */}
          <div className="flex border-b mb-4">
            <button
              className={`px-4 py-2 -mb-px border-b-2 font-semibold ${activeTab === 'testing' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-600'}`}
              onClick={() => setActiveTab('testing')}
            >Testing</button>
            {tableList.map(table => (
              <button
                key={table}
                className={`px-4 py-2 -mb-px border-b-2 font-semibold ${activeTab === table ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-600'}`}
                onClick={() => setActiveTab(table)}
              >{table}</button>
            ))}
          </div>

          {activeTab === 'testing' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column - Test Controls */}
              <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">Backend Health Check</h2>
              <button
                onClick={checkBackendHealth}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? 'Checking...' : 'Check Backend Health'}
              </button>
              
              {healthStatus && (
                <div className="mt-4 p-3 bg-gray-50 rounded">
                  <h3 className="font-medium">Health Status:</h3>
                  <pre className="mt-2 text-sm overflow-auto">
                    {JSON.stringify(healthStatus, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Test User Credentials</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={testName}
                    onChange={(e) => setTestName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <input
                    type="text" // Using text instead of password for easy visibility during testing
                    value={testPassword}
                    onChange={(e) => setTestPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">API Test Actions</h2>
              <div className="space-y-3">
                <button
                  onClick={testRegistration}
                  disabled={isLoading}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                >
                  {isLoading ? 'Processing...' : 'Test Registration'}
                </button>
                <button
                  onClick={testLogin}
                  disabled={isLoading}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {isLoading ? 'Processing...' : 'Test Direct Login'}
                </button>
                <button
                  onClick={testAuthServiceLogin}
                  disabled={isLoading}
                  className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
                >
                  {isLoading ? 'Processing...' : 'Test Auth Service Login'}
                </button>
              </div>
            </div>
              </div>

              {/* Right Column - Results */}
              <div className="space-y-6">
                {/* Testing content will go here */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h2 className="text-xl font-semibold mb-4">Testing & Other Utilities</h2>
                  {/* Example health check button */}
                  <div className="mb-4">
                    <b>Health Check:</b> <span className="text-green-600">OK</span>
                  </div>
                  {/* Add more as needed */}
                </div>
              </div>
            </div>
          ) : (
            /* Full width content for table tabs */
            <div className="w-full">
              {/* Tab content for tables will be rendered below */}
            </div>
          )}

          {/* Tab Content */}
          {activeTab !== 'testing' && tableStates[activeTab] && (
            <div className="bg-white p-6 rounded-lg shadow-md w-full mt-4">
              <h2 className="text-xl font-semibold mb-4">{activeTab} Table Data (Paginated & Filterable)</h2>
              <div className="overflow-x-auto w-full">
                  {/* Filter Input */}
                  <div className="mb-2 flex items-center gap-2">
                    <input
                      type="text"
                      value={tableStates[activeTab]?.filterValue || ''}
                      onChange={e => handleFilterChange(activeTab, e.target.value)}
                      placeholder={'Filter (e.g. email:foo@bar.com or {"id":1})'}
                      className="px-2 py-1 border rounded text-sm w-64"
                    />
                    <button
                      onClick={() => handleFilterApply(activeTab)}
                      className="px-2 py-1 bg-blue-500 text-white rounded text-sm"
                      disabled={tableStates[activeTab]?.loading}
                    >Apply</button>
                  </div>
                  {/* Table Data */}
                  {tableStates[activeTab]?.loading ? (
                    <div className="text-gray-600">Loading...</div>
                  ) : tableStates[activeTab]?.error ? (
                    <div className="text-red-600">{tableStates[activeTab].error}</div>
                  ) : tableStates[activeTab]?.rows.length === 0 ? (
                    <div className="text-gray-400 italic">No data in this table.</div>
                  ) : (
                    <table className="min-w-max w-full border border-gray-300 mb-2">
                      <thead>
                        <tr className="bg-gray-100">
                          {Object.keys(tableStates[activeTab].rows[0]).map((col) => (
                            <th key={col} className="px-2 py-1 border font-mono">{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {tableStates[activeTab].rows.map((row, idx) => (
                          <tr key={idx}>
                            {Object.values(row).map((val, cid) => (
                              <td key={cid} className="px-2 py-1 border font-mono whitespace-nowrap">{val === null ? <span className="text-gray-400">null</span> : String(val)}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                  {/* Pagination Controls */}
                  <div className="flex items-center gap-2 mb-4">
                    <button
                      onClick={() => handlePageChange(activeTab, Math.max(1, (tableStates[activeTab]?.page || 1) - 1))}
                      disabled={tableStates[activeTab]?.loading || (tableStates[activeTab]?.page || 1) <= 1}
                      className="px-2 py-1 bg-gray-200 rounded"
                    >Prev</button>
                    <span>Page <b>{tableStates[activeTab]?.page || 1}</b></span>
                    <button
                      onClick={() => handlePageChange(activeTab, (tableStates[activeTab]?.page || 1) + 1)}
                      disabled={tableStates[activeTab]?.loading || ((tableStates[activeTab]?.page || 1) * (tableStates[activeTab]?.pageSize || 50) >= (tableStates[activeTab]?.total || 0))}
                      className="px-2 py-1 bg-gray-200 rounded"
                    >Next</button>
                    <span className="ml-2">Rows per page:</span>
                    <select
                      value={tableStates[activeTab]?.pageSize || 50}
                      onChange={e => handlePageSizeChange(activeTab, Number(e.target.value))}
                      disabled={tableStates[activeTab]?.loading}
                      className="border rounded px-2 py-1 text-sm"
                    >
                      {[5, 10, 25, 50, 100].map(sz => (
                        <option key={sz} value={sz}>{sz}</option>
                      ))}
                    </select>
                    <span className="ml-2 text-gray-600 text-sm">Total: {tableStates[activeTab]?.total ?? 0}</span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Error, API Response, and User Profile sections */}
            {activeTab === 'testing' && (
              <>
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md mt-4">
                    <h3 className="font-medium">Error:</h3>
                    <p>{error}</p>
                  </div>
                )}
    
                {apiResponse && (
                  <div className="bg-white p-6 rounded-lg shadow-md mt-4">
                    <h2 className="text-xl font-semibold mb-4">API Response</h2>
                    <pre className="bg-gray-50 p-4 rounded overflow-auto max-h-60">
                      {JSON.stringify(apiResponse, null, 2)}
                    </pre>
                  </div>
                )}
    
                {userProfile && (
                  <div className="bg-white p-6 rounded-lg shadow-md mt-4">
                    <h2 className="text-xl font-semibold mb-4">User Profile</h2>
                    <pre className="bg-gray-50 p-4 rounded overflow-auto max-h-60">
                      {JSON.stringify(userProfile, null, 2)}
                    </pre>
                  </div>
                )}
    
                <div className="bg-white p-6 rounded-lg shadow-md mt-4">
                  <h2 className="text-xl font-semibold mb-4">Connection Instructions</h2>
                  <div className="space-y-3 text-sm">
                    <p>
                      <strong>Backend URL:</strong> http://localhost:8000
                    </p>
                    <p>
                      <strong>Database:</strong> PostgreSQL at postgresql://postgres:postgres123@localhost:5432/intelliops_ai
                    </p>
                    <p className="text-gray-700">
                      Make sure the FastAPI backend is running before testing the connections.
                      You can start it by running <code className="bg-gray-100 px-1 py-0.5 rounded">python run_server.py</code> from the project root.
                    </p>
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                      <p className="font-medium text-yellow-800">Testing Notes:</p>
                      <ul className="list-disc list-inside text-yellow-700 mt-1">
                        <li>Registration will fail if the email already exists</li>
                        <li>Login requires a previously registered user</li>
                        <li>The Auth Service login uses the same backend endpoint</li>
                        <li>If you see bcrypt errors in the backend logs, you may need to reinstall the bcrypt package with: <code className="bg-gray-100 px-1 py-0.5 rounded">pip uninstall bcrypt && pip install bcrypt</code></li>
                      </ul>
                    </div>
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                      <p className="font-medium text-blue-800">Troubleshooting:</p>
                      <ul className="list-disc list-inside text-blue-700 mt-1">
                        <li>The backend uses form-urlencoded format for login (OAuth2), not JSON</li>
                        <li>Registration uses JSON format</li>
                        <li>If login fails with 422 errors, check the backend logs for more details</li>
                        <li>The health check endpoint should work even if authentication is having issues</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </AppLayout>
      </NavigationProvider>
    );
}
