class ApiClient {
  private async request(path: string, options: RequestInit = {}) {
    const defaultHeaders = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    try {
      const response = await fetch(path, {
        ...options,
        headers: defaultHeaders,
      });

      // Parse JSON payload
      const data = await response.json();
      
      if (!response.ok || data.success === false) {
        throw new Error(data.error || `Request failed with status ${response.status}`);
      }

      // Log successful API calls
      if (!path.includes('/api/admin/audit-logs')) {
        const payloadStr = options.body ? String(options.body) : 'No Payload';
        const method = options.method || 'GET';
        
        fetch('/api/admin/audit-logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: `API SUCCESS: ${method} ${path}`,
            user: 'System API Logger',
            details: `Payload: ${payloadStr} | Response: ${JSON.stringify(data).substring(0, 800)}`,
            type: 'system',
          }),
        }).catch(() => {});
      }

      return data;
    } catch (error: any) {
      console.error(`ApiClient Error [${options.method || 'GET'} ${path}]:`, error);

      // Log API errors
      if (!path.includes('/api/admin/audit-logs')) {
        const payloadStr = options.body ? String(options.body) : 'No Payload';
        const method = options.method || 'GET';
        
        fetch('/api/admin/audit-logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: `API ERROR: ${method} ${path}`,
            user: 'System API Logger',
            details: `Payload: ${payloadStr} | Error: ${error.message || 'Unknown error'}`,
            type: 'security',
          }),
        }).catch(() => {});
      }
      
      throw error;
    }
  }

  public get(path: string, headers?: Record<string, string>) {
    return this.request(path, { method: 'GET', headers });
  }

  public post(path: string, body?: any, headers?: Record<string, string>) {
    return this.request(path, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
      headers,
    });
  }

  public put(path: string, body?: any, headers?: Record<string, string>) {
    return this.request(path, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
      headers,
    });
  }

  public delete(path: string, headers?: Record<string, string>) {
    return this.request(path, { method: 'DELETE', headers });
  }
}

export const api = new ApiClient();
