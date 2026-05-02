import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  getOpenClawClient,
  initializeOpenClawClient,
  OpenClawConfig,
} from "../_core/openclawClient";
import {
  startPollingService,
  stopPollingService,
  getPollingStatus,
  triggerPollingCycle,
  triggerMetricsCollection,
  initializePollingService,
} from "../_core/openclawPollingService";

export const openclawRouter = router({
  /**
   * Initialize connection to OpenClaw host
   */
  connect: protectedProcedure
    .input(
      z.object({
        host: z.string().url(),
        token: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const client = initializeOpenClawClient({
          host: input.host,
          token: input.token,
        });

        const isConnected = await client.connect();

        if (isConnected) {
          // Start polling service
          const pollingResult = startPollingService();

          return {
            success: true,
            message: "Connected to OpenClaw host",
            polling: pollingResult.success,
          };
        } else {
          return {
            success: false,
            message: "Failed to connect to OpenClaw host",
          };
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return {
          success: false,
          message: `Connection failed: ${errorMessage}`,
        };
      }
    }),

  /**
   * Disconnect from OpenClaw host
   */
  disconnect: protectedProcedure.mutation(async () => {
    try {
      const client = getOpenClawClient();
      client.disconnect();

      const pollingResult = stopPollingService();

      return {
        success: true,
        message: "Disconnected from OpenClaw host",
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      return {
        success: false,
        message: `Disconnection failed: ${errorMessage}`,
      };
    }
  }),

  /**
   * Get all agents from OpenClaw
   */
  getAgents: protectedProcedure.query(async () => {
    try {
      const client = getOpenClawClient();
      const agents = await client.getAgents();

      return {
        success: true,
        agents: agents.map((agent) => ({
          id: agent.id,
          name: agent.name,
          type: agent.type,
          status: agent.status,
          lastSeen: agent.lastSeen.toISOString(),
          metadata: agent.metadata,
        })),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      return {
        success: false,
        error: errorMessage,
        agents: [],
      };
    }
  }),

  /**
   * Get specific agent details
   */
  getAgent: protectedProcedure
    .input(z.object({ agentId: z.string() }))
    .query(async ({ input }) => {
      try {
        const client = getOpenClawClient();
        const agent = await client.getAgent(input.agentId);

        if (!agent) {
          return {
            success: false,
            error: "Agent not found",
          };
        }

        return {
          success: true,
          agent: {
            id: agent.id,
            name: agent.name,
            type: agent.type,
            status: agent.status,
            lastSeen: agent.lastSeen.toISOString(),
            metadata: agent.metadata,
          },
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return {
          success: false,
          error: errorMessage,
        };
      }
    }),

  /**
   * Get agent metrics
   */
  getAgentMetrics: protectedProcedure
    .input(z.object({ agentId: z.string() }))
    .query(async ({ input }) => {
      try {
        const client = getOpenClawClient();
        const metrics = await client.getAgentMetrics(input.agentId);

        if (!metrics) {
          return {
            success: false,
            error: "Failed to retrieve metrics",
          };
        }

        return {
          success: true,
          metrics: {
            agentId: metrics.agentId,
            status: metrics.status,
            uptime: metrics.uptime,
            tasksCompleted: metrics.tasksCompleted,
            tasksFailed: metrics.tasksFailed,
            lastActivity: metrics.lastActivity.toISOString(),
          },
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return {
          success: false,
          error: errorMessage,
        };
      }
    }),

  /**
   * Execute command on agent
   */
  executeCommand: protectedProcedure
    .input(
      z.object({
        agentId: z.string(),
        action: z.string(),
        params: z.record(z.string(), z.any()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const client = getOpenClawClient();
        const result = await client.executeCommand(
          input.agentId,
          input.action,
          input.params
        );

        if (!result) {
          return {
            success: false,
            error: "Failed to execute command",
          };
        }

        return {
          success: true,
          command: {
            id: result.id,
            agentId: result.agentId,
            action: result.action,
            status: result.status,
            result: result.result,
          },
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return {
          success: false,
          error: errorMessage,
        };
      }
    }),

  /**
   * Get command status
   */
  getCommandStatus: protectedProcedure
    .input(
      z.object({
        agentId: z.string(),
        commandId: z.string(),
      })
    )
    .query(async ({ input }) => {
      try {
        const client = getOpenClawClient();
        const command = await client.getCommandStatus(input.agentId, input.commandId);

        if (!command) {
          return {
            success: false,
            error: "Command not found",
          };
        }

        return {
          success: true,
          command: {
            id: command.id,
            agentId: command.agentId,
            action: command.action,
            status: command.status,
            result: command.result,
          },
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return {
          success: false,
          error: errorMessage,
        };
      }
    }),

  /**
   * Get polling service status
   */
  getPollingStatus: protectedProcedure.query(async () => {
    try {
      const status = getPollingStatus();

      return {
        success: true,
        status: {
          isRunning: status.isRunning,
          running: status.running,
          lastRun: status.lastRun?.toISOString(),
          lastError: status.lastError,
          totalRuns: status.totalRuns,
          successfulRuns: status.successfulRuns,
          failedRuns: status.failedRuns,
          agentsPolled: status.agentsPolled,
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      return {
        success: false,
        error: errorMessage,
        status: {
          isRunning: false,
          running: false,
          totalRuns: 0,
          successfulRuns: 0,
          failedRuns: 0,
          agentsPolled: 0,
        },
      };
    }
  }),

  /**
   * Start polling service
   */
  startPolling: protectedProcedure.mutation(async () => {
    try {
      const result = startPollingService();

      return {
        success: result.success,
        message: result.message,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      return {
        success: false,
        message: `Failed to start polling: ${errorMessage}`,
      };
    }
  }),

  /**
   * Stop polling service
   */
  stopPolling: protectedProcedure.mutation(async () => {
    try {
      const result = stopPollingService();

      return {
        success: result.success,
        message: result.message,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      return {
        success: false,
        message: `Failed to stop polling: ${errorMessage}`,
      };
    }
  }),

  /**
   * Manually trigger polling cycle
   */
  triggerPolling: protectedProcedure.mutation(async () => {
    try {
      const result = await triggerPollingCycle();

      return {
        success: result.success,
        agentsPolled: result.agentsPolled,
        error: result.error,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      return {
        success: false,
        error: errorMessage,
      };
    }
  }),

  /**
   * Manually trigger metrics collection
   */
  triggerMetrics: protectedProcedure.mutation(async () => {
    try {
      const result = await triggerMetricsCollection();

      return {
        success: result.success,
        error: result.error,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      return {
        success: false,
        error: errorMessage,
      };
    }
  }),

  /**
   * Check OpenClaw health
   */
  healthCheck: protectedProcedure.query(async () => {
    try {
      const client = getOpenClawClient();
      const isHealthy = await client.healthCheck();

      return {
        success: true,
        healthy: isHealthy,
      };
    } catch {
      return {
        success: false,
        healthy: false,
      };
    }
  }),
});
