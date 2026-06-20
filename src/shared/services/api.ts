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

      return data;
    } catch (error: any) {
      console.error(`ApiClient Error [${options.method || 'GET'} ${path}]:`, error);
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
