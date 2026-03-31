/**
 * Simple DSA API Client
 * No timeout handling - let the server control timeouts
 */

export interface DSAConfig {
  baseUrl: string;
  apiKey?: string;
}

export class DSAClient {
  constructor(private config: DSAConfig) {}

  private async request<T>(endpoint: string, body?: any): Promise<T> {
    const url = `${this.config.baseUrl}${endpoint}`;
    const headers: HeadersInit = { 'Content-Type': 'application/json' };

    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      throw new Error(`DSA API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async analyzeStock(code: string) {
    return this.request('/api/v1/analysis/analyze', {
      stock_codes: [code],
      async_mode: false,
    });
  }

  async batchAnalyze(codes: string[]) {
    return this.request('/api/v1/analysis/analyze', {
      stock_codes: codes,
      async_mode: true,
    });
  }

  async marketReview(market: 'cn' | 'us' | 'both' = 'cn') {
    return this.request('/api/v1/market/review', { market });
  }

  async askStock(question: string, code?: string) {
    return this.request('/api/v1/chat/ask', { question, code, stream: false });
  }

  async healthCheck() {
    const response = await fetch(`${this.config.baseUrl}/api/health`);
    return response.json();
  }
}
