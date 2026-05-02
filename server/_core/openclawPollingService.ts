import { getOpenClawClient, OpenClawAgent, AgentMetrics } from "./openclawClient";

/**
 * OpenClaw Agent Polling Service
 * Periodically polls OpenClaw host for agent status and metrics
 */

interface PollingConfig {
  enabled: boolean;
  intervalMs: number; // How often to poll
  metricsIntervalMs: number; // How often to collect metrics
  maxConcurrent: number;
}

interface PollingStatus {
  running: boolean;
  lastRun?: Date;
  lastError?: string;
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  agentsPolled: number;
}

interface AgentStatusUpdate {
  agentId: string;
  status: "online" | "offline" | "error";
  lastSeen: Date;
  metrics?: AgentMetrics;
  error?: string;
}

// Default configuration
const DEFAULT_CONFIG: PollingConfig = {
  enabled: true,
  intervalMs: 30 * 1000, // Poll every 30 seconds
  metricsIntervalMs: 60 * 1000, // Collect metrics every 60 seconds
  maxConcurrent: 5,
};

// Global state
let pollingTimer: ReturnType<typeof setInterval> | null = null;
let metricsTimer: ReturnType<typeof setInterval> | null = null;
let pollingStatus: PollingStatus = {
  running: false,
  totalRuns: 0,
  successfulRuns: 0,
  failedRuns: 0,
  agentsPolled: 0,
};
let activePolls = 0;
let statusUpdateCallbacks: Array<(update: AgentStatusUpdate) => void> = [];

/**
 * Subscribe to agent status updates
 */
export function onAgentStatusUpdate(
  callback: (update: AgentStatusUpdate) => void
): () => void {
  statusUpdateCallbacks.push(callback);

  // Return unsubscribe function
  return () => {
    statusUpdateCallbacks = statusUpdateCallbacks.filter((cb) => cb !== callback);
  };
}

/**
 * Emit status update to all subscribers
 */
function emitStatusUpdate(update: AgentStatusUpdate): void {
  statusUpdateCallbacks.forEach((callback) => {
    try {
      callback(update);
    } catch (error) {
      console.error("[PollingService] Error in status update callback:", error);
    }
  });
}

/**
 * Poll agents from OpenClaw
 */
async function pollAgents(): Promise<void> {
  try {
    const client = getOpenClawClient();

    if (!client.isHealthy()) {
      throw new Error("OpenClaw client is not healthy");
    }

    pollingStatus.running = true;

    // Get all agents from OpenClaw
    const agents = await client.getAgents();
    pollingStatus.agentsPolled = agents.length;

    // Process each agent
    for (const agent of agents) {
      try {
        const update: AgentStatusUpdate = {
          agentId: agent.id,
          status: agent.status === "idle" ? "online" : agent.status,
          lastSeen: agent.lastSeen,
        };

        emitStatusUpdate(update);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.error(`[PollingService] Error processing agent ${agent.id}:`, errorMessage);

        emitStatusUpdate({
          agentId: agent.id,
          status: "error",
          lastSeen: new Date(),
          error: errorMessage,
        });
      }
    }

    pollingStatus.lastRun = new Date();
    pollingStatus.successfulRuns++;
    pollingStatus.totalRuns++;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    pollingStatus.lastError = errorMessage;
    pollingStatus.failedRuns++;
    pollingStatus.totalRuns++;

    console.error("[PollingService] Polling cycle failed:", errorMessage);
  } finally {
    pollingStatus.running = activePolls > 0;
  }
}

/**
 * Collect metrics for all agents
 */
async function collectMetrics(): Promise<void> {
  try {
    const client = getOpenClawClient();

    if (!client.isHealthy()) {
      return;
    }

    const agents = await client.getAgents();

    // Collect metrics for each agent concurrently (with limit)
    const chunks = [];
    for (let i = 0; i < agents.length; i += DEFAULT_CONFIG.maxConcurrent) {
      chunks.push(agents.slice(i, i + DEFAULT_CONFIG.maxConcurrent));
    }

    for (const chunk of chunks) {
      const metricsPromises = chunk.map(async (agent) => {
        try {
          const metrics = await client.getAgentMetrics(agent.id);
          if (metrics) {
        emitStatusUpdate({
          agentId: agent.id,
          status: agent.status === "idle" ? "online" : agent.status,
          lastSeen: agent.lastSeen,
          metrics,
        });
          }
        } catch (error) {
          console.error(
            `[PollingService] Failed to collect metrics for ${agent.id}:`,
            error
          );
        }
      });

      await Promise.all(metricsPromises);
    }
  } catch (error) {
    console.error("[PollingService] Metrics collection failed:", error);
  }
}

/**
 * Start the polling service
 */
export function startPollingService(
  config: Partial<PollingConfig> = {}
): { success: boolean; message: string } {
  try {
    const finalConfig = { ...DEFAULT_CONFIG, ...config };

    if (!finalConfig.enabled) {
      return {
        success: false,
        message: "Polling service is disabled in configuration",
      };
    }

    if (pollingTimer) {
      return {
        success: false,
        message: "Polling service is already running",
      };
    }

    // Start agent polling
    pollingTimer = setInterval(async () => {
      activePolls++;
      try {
        await pollAgents();
      } finally {
        activePolls--;
      }
    }, finalConfig.intervalMs);

    // Start metrics collection
    metricsTimer = setInterval(async () => {
      try {
        await collectMetrics();
      } catch (error) {
        console.error("[PollingService] Metrics collection error:", error);
      }
    }, finalConfig.metricsIntervalMs);

    console.log(
      `[PollingService] Started with interval: ${finalConfig.intervalMs}ms, metrics: ${finalConfig.metricsIntervalMs}ms`
    );

    return {
      success: true,
      message: `Polling service started (interval: ${finalConfig.intervalMs}ms)`,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[PollingService] Error starting service:", errorMessage);
    return {
      success: false,
      message: `Failed to start service: ${errorMessage}`,
    };
  }
}

/**
 * Stop the polling service
 */
export function stopPollingService(): { success: boolean; message: string } {
  try {
    if (pollingTimer) {
      clearInterval(pollingTimer);
      pollingTimer = null;
    }

    if (metricsTimer) {
      clearInterval(metricsTimer);
      metricsTimer = null;
    }

    pollingStatus.running = false;

    console.log("[PollingService] Stopped");

    return {
      success: true,
      message: "Polling service stopped",
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[PollingService] Error stopping service:", errorMessage);
    return {
      success: false,
      message: `Failed to stop service: ${errorMessage}`,
    };
  }
}

/**
 * Get polling status
 */
export function getPollingStatus(): PollingStatus & {
  isRunning: boolean;
} {
  return {
    ...pollingStatus,
    isRunning: pollingTimer !== null,
  };
}

/**
 * Manually trigger a polling cycle
 */
export async function triggerPollingCycle(): Promise<{
  success: boolean;
  agentsPolled?: number;
  error?: string;
}> {
  try {
    activePolls++;
    try {
      await pollAgents();
      return {
        success: true,
        agentsPolled: pollingStatus.agentsPolled,
      };
    } finally {
      activePolls--;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Manually trigger metrics collection
 */
export async function triggerMetricsCollection(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await collectMetrics();
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Reset polling statistics
 */
export function resetPollingStats(): void {
  pollingStatus = {
    running: pollingStatus.running,
    totalRuns: 0,
    successfulRuns: 0,
    failedRuns: 0,
    agentsPolled: 0,
  };
  console.log("[PollingService] Statistics reset");
}

/**
 * Initialize polling service on server startup
 */
export function initializePollingService(): void {
  const autoStart = process.env.OPENCLAW_POLLING_AUTO_START !== "false";

  if (autoStart) {
    const result = startPollingService();
    if (result.success) {
      console.log("[PollingService] Auto-started on server initialization");
    } else {
      console.warn("[PollingService] Failed to auto-start:", result.message);
    }
  }
}

/**
 * Cleanup polling service on server shutdown
 */
export function cleanupPollingService(): void {
  stopPollingService();
  statusUpdateCallbacks = [];
  console.log("[PollingService] Cleaned up on server shutdown");
}
