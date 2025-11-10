/**
 * API Service for communicating with Gendash backend
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export interface GenerateDashboardRequest {
  apiUrl: string;
  preferences?: {
    colorScheme?: string;
    layout?: string;
  };
}

export interface GenerateDashboardResponse {
  success: boolean;
  dashboardId: string;
  spec: DashboardSpec;
  apiData?: any[];
  error?: string;
}

export interface DashboardSpec {
  components: DashboardComponent[];
}

export interface DashboardComponent {
  id: string;
  type: string;
  title: string;
  dataMapping: Record<string, any>;
  description?: string;
}

export interface ApiError {
  success: false;
  error: string;
}

/**
 * Generate a dashboard from an API endpoint
 */
export async function generateDashboard(
  request: GenerateDashboardRequest
): Promise<GenerateDashboardResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/generate-dashboard`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to generate dashboard');
    }

    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`API Error: ${error.message}`);
    }
    throw new Error('Unknown error occurred');
  }
}

/**
 * Helper function to safely get nested property value using dot notation
 */
function getNestedValue(obj: any, path: string): any {
  if (!path || !obj) return obj;

  const keys = path.split('.');
  let value = obj;

  for (const key of keys) {
    if (value === null || value === undefined) return undefined;
    value = value[key];
  }

  return value;
}

/**
 * Flatten a nested object structure for visualization
 */
function flattenObject(obj: any, parentKey: string = '', separator: string = '.'): any {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  const flattened: any = {};

  for (const key in obj) {
    if (!obj.hasOwnProperty(key)) continue;

    const newKey = parentKey ? `${parentKey}${separator}${key}` : key;
    const value = obj[key];

    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      // Recursively flatten nested objects
      Object.assign(flattened, flattenObject(value, newKey, separator));
    } else if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
      // Array of objects - convert to JSON string
      flattened[newKey] = JSON.stringify(value);
    } else if (Array.isArray(value)) {
      // Array of primitives - convert to string
      flattened[newKey] = value.join(', ');
    } else {
      // Primitive value
      flattened[newKey] = value;
    }
  }

  return flattened;
}

/**
 * Fetch data from user's API endpoint
 * Returns data that has been fetched, parsed, and flattened by the backend
 */
export async function fetchApiData(apiUrl: string): Promise<any[]> {
  try {
    // Use backend proxy to fetch and process data
    const response = await fetch(`${API_BASE_URL}/api/fetch-data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ apiUrl }),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.statusText}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch data');
    }

    return result.data || [];
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to fetch API data: ${error.message}`);
    }
    throw new Error('Unknown error occurred');
  }
}

// Export helper for components that need to access nested values
export { getNestedValue };

/**
 * Health check for backend service
 */
export async function healthCheck(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    const data = await response.json();
    return data.status === 'healthy';
  } catch (error) {
    return false;
  }
}
