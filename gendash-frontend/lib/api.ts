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
 * Fetch data from user's API endpoint
 */
export async function fetchApiData(apiUrl: string): Promise<any[]> {
  try {
    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.statusText}`);
    }

    let data = await response.json();

    // Handle different API response formats
    if (typeof data === 'object' && !Array.isArray(data)) {
      if ('data' in data) {
        data = data.data;
      } else if ('results' in data) {
        data = data.results;
      } else if ('items' in data) {
        data = data.items;
      } else if ('features' in data) {
        data = data.features;
      }
    }

    // Ensure data is an array
    if (!Array.isArray(data)) {
      data = [data];
    }

    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to fetch API data: ${error.message}`);
    }
    throw new Error('Unknown error occurred');
  }
}

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
