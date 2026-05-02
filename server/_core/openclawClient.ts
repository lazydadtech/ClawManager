import axios, { AxiosInstance } from "axios";
import WebSocket from "ws";

/**
 * Lightweight OpenClaw API Client
 * Connects to OpenClaw host dynamically without complex infrastructure
 */

export interface OpenClawConfig {
  host: string; // e.g., "http://localhost:3000" or "https://openclaw.example.com"
  token?: string; // Optional authentication token
  timeout?: number; // Request timeout in ms
}

export interface OpenClawAgent {
  id: string;
  name: string;
  type: "main" | "dm" | "group";
  status: "online" | "offline" | "idle";
  lastSeen: Date;
  metadata?: Record<string, any>;
}

export interface AgentMetrics {
  agentId: string;
  status: string;
  uptime: number;
  tasksCompleted: number;
  tasksFailed: number;
  lastActivity: Date;
}

export interface AgentCommand {
  id: string;
  agentId: string;
  action: string;
  params?: Record<string, any>;
  status: "pending" | "executing" | "completed" | "failed";
  result?: any;
}

class OpenClawClient {
  private config: OpenClawConfig;
  private axiosInstance: AxiosInstance;
  private ws: WebSocket | null = null;
  private agentCache: Map<string, OpenClawAgent> = new Map();
  private cacheTTL: number = 5 * 60 * 1000; // 5 minutes
  private lastCacheUpdate: number = 0;
  private isConnected: boolean = false;

  constructor(config: OpenClawConfig) {
    this.config = {
      timeout: 10000,
      ...config,
    };

    this.axiosInstance = axios.create({
      baseURL: this.config.host,
      timeout: this.config.timeout,
      headers: this.config.token
        ? { Authorization: `Bearer ${this.config.token}` }
        : {},
    });
  }

  /**
   * Connect to OpenClaw host
   */
  async connect(): Promise<boolean> {
    try {
      // Test connectivity with health check
      const response = await this.axiosInstance.get("/health");
      this.isConnected = response.status === 200;
      console.log("[OpenClawClient] Connected to OpenClaw host:", this.config.host);
      return this.isConnected;
    } catch (error) {
      console.error("[OpenClawClient] Failed to connect:", error);
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Disconnect from OpenClaw host
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
    console.log("[OpenClawClient] Disconnected from OpenClaw host");
  }

  /**
   * Get all active agents from OpenClaw
   * Queries the gateway for active sessions
   */
  async getAgents(): Promise<OpenClawAgent[]> {
    try {
      // Check cache first
      const now = Date.now();
      if (this.agentCache.size > 0 && now - this.lastCacheUpdate < this.cacheTTL) {
        return Array.from(this.agentCache.values());
      }

      // Query OpenClaw API for sessions
      const response = await this.axiosInstance.get("/api/sessions");
      const sessions = response.data.sessions || [];

      // Map sessions to agents
      const agents: OpenClawAgent[] = sessions.map((session: any) => ({
        id: session.id,
        name: session.name || session.id,
        type: this.mapSessionType(session.type),
        status: session.active ? "online" : "offline",
        lastSeen: new Date(session.lastActivity || Date.now()),
        metadata: {
          sessionType: session.type,
          channel: session.channel,
          userId: session.userId,
        },
      }));

      // Update cache
      this.agentCache.clear();
      agents.forEach((agent) => this.agentCache.set(agent.id, agent));
      this.lastCacheUpdate = now;

      return agents;
    } catch (error) {
      console.error("[OpenClawClient] Failed to get agents:", error);
      return Array.from(this.agentCache.values()); // Return cached data on error
    }
  }

  /**
   * Get specific agent details
   */
  async getAgent(agentId: string): Promise<OpenClawAgent | null> {
    try {
      const response = await this.axiosInstance.get(`/api/sessions/${agentId}`);
      const session = response.data;

      const agent: OpenClawAgent = {
        id: session.id,
        name: session.name || session.id,
        type: this.mapSessionType(session.type),
        status: session.active ? "online" : "offline",
        lastSeen: new Date(session.lastActivity || Date.now()),
        metadata: session,
      };

      this.agentCache.set(agentId, agent);
      return agent;
    } catch (error) {
      console.error(`[OpenClawClient] Failed to get agent ${agentId}:`, error);
      return this.agentCache.get(agentId) || null;
    }
  }

  /**
   * Get agent metrics
   */
  async getAgentMetrics(agentId: string): Promise<AgentMetrics | null> {
    try {
      const response = await this.axiosInstance.get(`/api/sessions/${agentId}/metrics`);
      const data = response.data;

      return {
        agentId,
        status: data.status || "unknown",
        uptime: data.uptime || 0,
        tasksCompleted: data.tasksCompleted || 0,
        tasksFailed: data.tasksFailed || 0,
        lastActivity: new Date(data.lastActivity || Date.now()),
      };
    } catch (error) {
      console.error(`[OpenClawClient] Failed to get metrics for ${agentId}:`, error);
      return null;
    }
  }

  /**
   * Send command to agent
   */
  async executeCommand(
    agentId: string,
    action: string,
    params?: Record<string, any>
  ): Promise<AgentCommand | null> {
    try {
      const response = await this.axiosInstance.post(
        `/api/sessions/${agentId}/commands`,
        {
          action,
          params,
        }
      );

      const result = response.data;
      return {
        id: result.id || `cmd_${Date.now()}`,
        agentId,
        action,
        params,
        status: result.status || "pending",
        result: result.result,
      };
    } catch (error) {
      console.error(
        `[OpenClawClient] Failed to execute command on ${agentId}:`,
        error
      );
      return null;
    }
  }

  /**
   * Get command status
   */
  async getCommandStatus(agentId: string, commandId: string): Promise<AgentCommand | null> {
    try {
      const response = await this.axiosInstance.get(
        `/api/sessions/${agentId}/commands/${commandId}`
      );

      const data = response.data;
      return {
        id: commandId,
        agentId,
        action: data.action,
        params: data.params,
        status: data.status,
        result: data.result,
      };
    } catch (error) {
      console.error(
        `[OpenClawClient] Failed to get command status:`,
        error
      );
      return null;
    }
  }

  /**
   * Stream agent messages
   */
  async streamAgentMessages(
    agentId: string,
    callback: (message: any) => void
  ): Promise<void> {
    try {
      const wsUrl = this.config.host.replace(/^http/, "ws");
      const url = `${wsUrl}/api/sessions/${agentId}/stream`;

      this.ws = new WebSocket(url, {
        headers: this.config.token
          ? { Authorization: `Bearer ${this.config.token}` }
          : {},
      });

      this.ws.on("message", (data: string) => {
        try {
          const message = JSON.parse(data);
          callback(message);
        } catch (e) {
          console.error("[OpenClawClient] Failed to parse message:", e);
        }
      });

      this.ws.on("error", (error: Error) => {
        console.error("[OpenClawClient] WebSocket error:", error);
      });

      this.ws.on("close", () => {
        console.log("[OpenClawClient] WebSocket closed");
        this.ws = null;
      });
    } catch (error) {
      console.error("[OpenClawClient] Failed to stream messages:", error);
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.axiosInstance.get("/health");
      return response.status === 200;
    } catch {
      return false;
    }
  }

  /**
   * Map OpenClaw session type to agent type
   */
  private mapSessionType(
    sessionType: string
  ): "main" | "dm" | "group" {
    if (sessionType === "main") return "main";
    if (sessionType.startsWith("dm")) return "dm";
    if (sessionType.startsWith("group")) return "group";
    return "main";
  }

  /**
   * Get connection status
   */
  isHealthy(): boolean {
    return this.isConnected;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.agentCache.clear();
    this.lastCacheUpdate = 0;
  }

  /**
   * Update cache TTL
   */
  setCacheTTL(ttlMs: number): void {
    this.cacheTTL = ttlMs;
  }
}

// Singleton instance
let clientInstance: OpenClawClient | null = null;

/**
 * Initialize OpenClaw client
 */
export function initializeOpenClawClient(config: OpenClawConfig): OpenClawClient {
  clientInstance = new OpenClawClient(config);
  return clientInstance;
}

/**
 * Get OpenClaw client instance
 */
export function getOpenClawClient(): OpenClawClient {
  if (!clientInstance) {
    throw new Error("OpenClaw client not initialized. Call initializeOpenClawClient first.");
  }
  return clientInstance;
}

/**
 * Create a new OpenClaw client instance
 */
export function createOpenClawClient(config: OpenClawConfig): OpenClawClient {
  return new OpenClawClient(config);
}

export default OpenClawClient;
