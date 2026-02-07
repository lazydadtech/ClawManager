# API Integration Best Practices

This document provides best practices for integrating external APIs with the OpenClaw Mission Control builder.

## Creating an API Client

### Basic Client Structure

```ts
// server/clients/externalApi.ts
import axios from 'axios';

interface ApiConfig {
  endpoint: string;
  apiKey: string;
  timeout?: number;
}

export class ExternalApiClient {
  private client;
  private config: ApiConfig;

  constructor(config: ApiConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.endpoint,
      timeout: config.timeout || 30000,
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      response => response,
      error => this.handleError(error)
    );
  }

  private handleError(error: any) {
    if (error.response?.status === 401) {
      throw new Error('Unauthorized: Invalid API key');
    }
    if (error.response?.status === 429) {
      throw new Error('Rate limited: Too many requests');
    }
    if (error.code === 'ECONNABORTED') {
      throw new Error('Request timeout');
    }
    throw error;
  }

  async getAgents() {
    const response = await this.client.get('/agents');
    return response.data;
  }

  async getAgentMetrics(agentId: string) {
    const response = await this.client.get(`/agents/${agentId}/metrics`);
    return response.data;
  }
}
```

## Error Handling & Retry Logic

### Retry Pattern with Exponential Backoff

```ts
interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { maxRetries = 3, initialDelay = 1000, maxDelay = 10000 } = options;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries) throw error;

      // Don't retry on client errors
      if (error.response?.status && error.response.status < 500) {
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        initialDelay * Math.pow(2, attempt),
        maxDelay
      );

      console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Usage
const data = await withRetry(() => client.getAgents());
```

## Data Transformation

### Mapping External Data to Internal Schema

```ts
interface ExternalAgent {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'busy';
  cpu_usage: number;
  memory_usage: number;
  last_heartbeat: string;
}

interface InternalAgent {
  id: number;
  externalId: string;
  name: string;
  status: 'active' | 'inactive' | 'busy';
  cpuUsage: number;
  memoryUsage: number;
  lastHeartbeat: Date;
}

export function transformAgent(external: ExternalAgent): InternalAgent {
  return {
    id: 0, // Will be set by database
    externalId: external.id,
    name: external.name,
    status: mapStatus(external.status),
    cpuUsage: external.cpu_usage,
    memoryUsage: external.memory_usage,
    lastHeartbeat: new Date(external.last_heartbeat),
  };
}

function mapStatus(status: string): 'active' | 'inactive' | 'busy' {
  const mapping = {
    'online': 'active',
    'offline': 'inactive',
    'busy': 'busy',
  };
  return mapping[status] || 'inactive';
}
```

## Polling & Real-time Updates

### Polling Service

```ts
// server/services/polling.ts
interface PollingConfig {
  interval: number; // milliseconds
  enabled: boolean;
}

export class PollingService {
  private timers: Map<string, NodeJS.Timeout> = new Map();

  startPolling(
    key: string,
    fn: () => Promise<void>,
    config: PollingConfig
  ) {
    if (!config.enabled) return;

    // Initial call
    fn().catch(error => console.error(`Polling error for ${key}:`, error));

    // Schedule recurring calls
    const timer = setInterval(() => {
      fn().catch(error => console.error(`Polling error for ${key}:`, error));
    }, config.interval);

    this.timers.set(key, timer);
  }

  stopPolling(key: string) {
    const timer = this.timers.get(key);
    if (timer) {
      clearInterval(timer);
      this.timers.delete(key);
    }
  }

  stopAllPolling() {
    this.timers.forEach(timer => clearInterval(timer));
    this.timers.clear();
  }
}

// Usage
const polling = new PollingService();

polling.startPolling('agents', async () => {
  const agents = await client.getAgents();
  await db.updateAgents(agents);
}, { interval: 30000, enabled: true });
```

## Caching Strategies

### Simple Cache with TTL

```ts
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export class Cache<T> {
  private data: Map<string, CacheEntry<T>> = new Map();
  private ttl: number; // milliseconds

  constructor(ttl: number = 60000) {
    this.ttl = ttl;
  }

  set(key: string, value: T) {
    this.data.set(key, {
      data: value,
      timestamp: Date.now(),
    });
  }

  get(key: string): T | null {
    const entry = this.data.get(key);
    if (!entry) return null;

    // Check if entry has expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.data.delete(key);
      return null;
    }

    return entry.data;
  }

  clear() {
    this.data.clear();
  }
}

// Usage
const cache = new Cache<Agent[]>(60000); // 1 minute TTL

export async function getAgentsWithCache(client: ApiClient) {
  const cached = cache.get('agents');
  if (cached) return cached;

  const agents = await client.getAgents();
  cache.set('agents', agents);
  return agents;
}
```

## Rate Limiting

### Rate Limiter Implementation

```ts
export class RateLimiter {
  private requests: number[] = [];
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number = 100, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  async waitIfNeeded() {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    // Remove old requests outside the window
    this.requests = this.requests.filter(time => time > windowStart);

    if (this.requests.length >= this.maxRequests) {
      // Wait until oldest request is outside the window
      const oldestRequest = this.requests[0];
      const waitTime = oldestRequest + this.windowMs - now + 100;
      console.log(`Rate limit reached, waiting ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return this.waitIfNeeded(); // Recursive call to check again
    }

    this.requests.push(now);
  }
}

// Usage
const limiter = new RateLimiter(100, 60000); // 100 requests per minute

export async function fetchWithRateLimit(client: ApiClient) {
  await limiter.waitIfNeeded();
  return client.getAgents();
}
```

## Configuration Management

### Storing API Configuration

```ts
// server/db.ts
export async function saveApiConfig(userId: number, config: {
  endpoint: string;
  authMethod: 'api-key' | 'bearer' | 'basic';
  apiKey: string;
  pollInterval: number;
}) {
  const db = await getDb();
  
  // Encrypt sensitive data before storing
  const encryptedKey = encryptApiKey(config.apiKey);

  return db.insert(apiConfigurations).values({
    userId,
    endpoint: config.endpoint,
    authMethod: config.authMethod,
    apiKey: encryptedKey,
    pollInterval: config.pollInterval,
    createdAt: new Date(),
  });
}

export async function getApiConfig(userId: number) {
  const db = await getDb();
  const config = await db.query.apiConfigurations.findFirst({
    where: eq(apiConfigurations.userId, userId),
  });

  if (!config) return null;

  // Decrypt API key
  return {
    ...config,
    apiKey: decryptApiKey(config.apiKey),
  };
}
```

### Testing API Configuration

```ts
// server/routers/monitoring.ts
export const monitoringRouter = router({
  testConnection: protectedProcedure
    .input(z.object({
      endpoint: z.string().url(),
      apiKey: z.string(),
    }))
    .mutation(async ({ input }) => {
      try {
        const client = new ExternalApiClient({
          endpoint: input.endpoint,
          apiKey: input.apiKey,
        });

        // Try to fetch data
        await client.getAgents();

        return { success: true, message: 'Connection successful' };
      } catch (error) {
        return {
          success: false,
          message: error.message || 'Connection failed',
        };
      }
    }),
});
```

## Frontend Integration

### Using API Data in React

```tsx
export function AgentsList() {
  const { data: agents, isLoading, error } = trpc.agents.list.useQuery();
  const [refreshInterval, setRefreshInterval] = useState(30000);

  // Refetch at regular intervals
  useEffect(() => {
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['agents', 'list'] });
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  if (isLoading) return <Skeleton />;
  if (error) return <ErrorAlert message={error.message} />;

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <h2 className="text-xl font-bold">Agents</h2>
        <select
          value={refreshInterval}
          onChange={(e) => setRefreshInterval(Number(e.target.value))}
          className="rounded-lg border px-3 py-2"
        >
          <option value={10000}>Every 10s</option>
          <option value={30000}>Every 30s</option>
          <option value={60000}>Every 1m</option>
        </select>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {agents?.map(agent => (
          <AgentCard key={agent.id} agent={agent} />
        ))}
      </div>
    </div>
  );
}
```

## Monitoring & Logging

### API Call Logging

```ts
export class LoggingClient extends ExternalApiClient {
  async getAgents() {
    const startTime = Date.now();
    try {
      const result = await super.getAgents();
      const duration = Date.now() - startTime;
      console.log(`✓ getAgents completed in ${duration}ms`);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`✗ getAgents failed after ${duration}ms:`, error.message);
      throw error;
    }
  }
}
```

### Metrics Tracking

```ts
interface ApiMetrics {
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  averageResponseTime: number;
  lastError?: string;
}

export class MetricsTracker {
  private metrics: Map<string, ApiMetrics> = new Map();

  recordCall(endpoint: string, duration: number, success: boolean, error?: string) {
    const current = this.metrics.get(endpoint) || {
      totalCalls: 0,
      successfulCalls: 0,
      failedCalls: 0,
      averageResponseTime: 0,
    };

    current.totalCalls++;
    if (success) {
      current.successfulCalls++;
    } else {
      current.failedCalls++;
      current.lastError = error;
    }

    current.averageResponseTime =
      (current.averageResponseTime * (current.totalCalls - 1) + duration) /
      current.totalCalls;

    this.metrics.set(endpoint, current);
  }

  getMetrics(endpoint: string) {
    return this.metrics.get(endpoint);
  }
}
```
