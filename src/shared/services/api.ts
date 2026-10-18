class ApiClient {
  private async request(path: string, options: RequestInit = {}) {
    const defaultHeaders = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      try {
        controller.abort('Request timed out. Please check your connection and refresh.');
      } catch {
        controller.abort();
      }
    }, 60000); // 60s timeout

    try {
      const response = await fetch(path, {
        ...options,
        headers: defaultHeaders,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      // Parse JSON payload safely
      const text = await response.text();
      let data: any = {};
      if (text) {
        try {
          data = JSON.parse(text);
        } catch (e) {
          throw new Error(`Invalid JSON response: ${text.substring(0, 100)}`);
        }
      }
      
      if (!response.ok || data.success === false) {
        throw new Error(data.error || `Request failed with status ${response.status}`);
      }

      return data;
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error?.name === 'AbortError' || controller.signal.aborted) {
        const msg = typeof controller.signal.reason === 'string' 
          ? controller.signal.reason 
          : 'Request timed out waiting for server response. Please refresh.';
        throw new Error(msg);
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
