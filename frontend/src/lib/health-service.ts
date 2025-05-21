// health-service.ts
// Provides a function to check backend health via /api/health

import { API_BASE_URL } from '../config';

export async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`);
    if (!response.ok) return false;
    const data = await response.json();
    return data.status === 'ok' && data.backend === 'FastAPI' && data.database === 'PostgreSQL';
  } catch (e) {
    return false;
  }
}
