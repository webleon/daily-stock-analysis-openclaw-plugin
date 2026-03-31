/**
 * Daily Stock Analysis API Client
 */

export interface DSAConfig {
  baseUrl: string;
  apiKey?: string;
}

export interface StockAnalysis {
  code: string;
  name: string;
  conclusion: string;
  buyPrice?: number;
  stopLossPrice?: number;
  targetPrice?: number;
  checklist: Array<{ item: string; status: '满足' | '注意' | '不满足' }>;
  riskAlerts?: string[];
  opportunities?: string[];
}

export interface MarketReview {
  date: string;
  indices: Array<{ name: string; value: number; change: number }>;
  summary: {
    up: number;
    down: number;
    limitUp: number;
    limitDown: number;
  };
  sectors: {
    top: string[];
    bottom: string[];
  };
}

export interface ChatResponse {
  answer: string;
  thought?: string;
}

export class DSAClient {
  constructor(private config: DSAConfig) {}

  private async request<T>(endpoint: string, body?: any): Promise<T> {
    const url = `${this.config.baseUrl}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

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

  /**
   * Analyze single stock
   */
  async analyzeStock(code: string): Promise<StockAnalysis> {
    return this.request('/api/v1/analysis/analyze', {
      stock_codes: [code],
      async_mode: false,
    });
  }

  /**
   * Batch analyze multiple stocks
   */
  async batchAnalyze(codes: string[]): Promise<{ task_id?: string; status: string }> {
    return this.request('/api/v1/analysis/analyze', {
      stock_codes: codes,
      async_mode: true,
    });
  }

  /**
   * Market review
   */
  async marketReview(market: 'cn' | 'us' | 'both' = 'cn'): Promise<MarketReview> {
    return this.request('/api/v1/market/review', { market });
  }

  /**
   * Ask stock with strategy
   */
  async askStock(question: string, code?: string): Promise<ChatResponse> {
    return this.request('/api/v1/chat/ask', {
      question,
      code,
      stream: false,
    });
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: string; version?: string }> {
    const url = `${this.config.baseUrl}/api/health`;
    const response = await fetch(url);
    return response.json();
  }
}
