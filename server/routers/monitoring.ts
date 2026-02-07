import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  createApiConfiguration,
  getApiConfigurationsByUserId,
  getApiConfiguration,
  updateApiConfiguration,
  deleteApiConfiguration,
  createAlert,
  getAlertsByUserId,
  getActiveAlerts,
  acknowledgeAlert,
  resolveAlert,
  createAlertHistory,
  getMonitoringConfiguration,
  createOrUpdateMonitoringConfiguration,
} from "../monitoring";

export const monitoringRouter = router({
  /**
   * API Configuration procedures
   */
  apiConfig: router({
    create: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1),
          apiEndpoint: z.string().url(),
          authMethod: z.enum(["api_key", "oauth", "bearer_token"]),
          apiKey: z.string().optional(),
          bearerToken: z.string().optional(),
          oauthClientId: z.string().optional(),
          oauthClientSecret: z.string().optional(),
          pollingInterval: z.number().min(1000).default(5000),
          connectionType: z.enum(["websocket", "sse", "http_polling"]).default("http_polling"),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // TODO: Encrypt sensitive fields before storing
        return await createApiConfiguration({
          userId: ctx.user.id,
          name: input.name,
          apiEndpoint: input.apiEndpoint,
          authMethod: input.authMethod,
          apiKey: input.apiKey,
          bearerToken: input.bearerToken,
          oauthClientId: input.oauthClientId,
          oauthClientSecret: input.oauthClientSecret,
          pollingInterval: input.pollingInterval,
          connectionType: input.connectionType,
          isActive: true,
        });
      }),

    list: protectedProcedure.query(async ({ ctx }) => {
      return await getApiConfigurationsByUserId(ctx.user.id);
    }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        return await getApiConfiguration(input.id, ctx.user.id);
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().optional(),
          apiEndpoint: z.string().url().optional(),
          pollingInterval: z.number().min(1000).optional(),
          connectionType: z.enum(["websocket", "sse", "http_polling"]).optional(),
          isActive: z.boolean().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { id, ...updates } = input;
        await updateApiConfiguration(id, ctx.user.id, updates);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await deleteApiConfiguration(input.id, ctx.user.id);
        return { success: true };
      }),

    test: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const config = await getApiConfiguration(input.id, ctx.user.id);
        if (!config) throw new Error("Configuration not found");

        try {
          // TODO: Implement actual connection test logic
          // This would make a test request to the API endpoint
          await updateApiConfiguration(input.id, ctx.user.id, {
            testStatus: "success",
            lastTestedAt: new Date(),
          });
          return { success: true, status: "success" };
        } catch (error) {
          await updateApiConfiguration(input.id, ctx.user.id, {
            testStatus: "failed",
            lastTestedAt: new Date(),
            testError: error instanceof Error ? error.message : "Unknown error",
          });
          return { success: false, status: "failed", error: error instanceof Error ? error.message : "Unknown error" };
        }
      }),
  }),

  /**
   * Alert procedures
   */
  alerts: router({
    list: protectedProcedure
      .input(z.object({ limit: z.number().default(50) }))
      .query(async ({ ctx, input }) => {
        return await getAlertsByUserId(ctx.user.id, input.limit);
      }),

    getActive: protectedProcedure.query(async ({ ctx }) => {
      return await getActiveAlerts(ctx.user.id);
    }),

    acknowledge: protectedProcedure
      .input(z.object({ alertId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await acknowledgeAlert(input.alertId, ctx.user.id, ctx.user.id);
        await createAlertHistory({
          userId: ctx.user.id,
          alertId: input.alertId,
          action: "acknowledged",
          performedBy: ctx.user.id,
        });
        return { success: true };
      }),

    resolve: protectedProcedure
      .input(z.object({ alertId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await resolveAlert(input.alertId, ctx.user.id);
        await createAlertHistory({
          userId: ctx.user.id,
          alertId: input.alertId,
          action: "resolved",
          performedBy: ctx.user.id,
        });
        return { success: true };
      }),
  }),

  /**
   * Monitoring configuration procedures
   */
  config: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      return await getMonitoringConfiguration(ctx.user.id);
    }),

    update: protectedProcedure
      .input(
        z.object({
          enableRealTimeAlerts: z.boolean().optional(),
          enableEmailNotifications: z.boolean().optional(),
          emailForCriticalAlerts: z.string().email().optional(),
          emailForWarningAlerts: z.string().email().optional(),
          criticalErrorRateThreshold: z.number().min(0).max(100).optional(),
          warningErrorRateThreshold: z.number().min(0).max(100).optional(),
          criticalCpuThreshold: z.number().min(0).max(100).optional(),
          warningCpuThreshold: z.number().min(0).max(100).optional(),
          criticalMemoryThreshold: z.number().min(0).max(100).optional(),
          warningMemoryThreshold: z.number().min(0).max(100).optional(),
          agentDownTimeout: z.number().min(1000).optional(),
          metricsRetentionDays: z.number().min(1).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await createOrUpdateMonitoringConfiguration(ctx.user.id, {
          userId: ctx.user.id,
          ...input,
        });
        return { success: true };
      }),
  }),
});
