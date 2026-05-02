import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  startAlertScheduler,
  stopAlertScheduler,
  getSchedulerStatus,
  triggerDetectionCycle,
  resetSchedulerStats,
  getSchedulerConfig,
  updateSchedulerConfig,
} from "../_core/alertScheduler";
import {
  detectAgentFailures,
  detectAgentRecoveries,
  detectBudgetAlerts,
  processAgentFailureAlerts,
  processAgentRecoveryAlerts,
  processBudgetAlerts,
  runAlertDetectionCycle,
} from "../_core/alertDetectionService";
import { getDb } from "../db";
import { notifications } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";

/**
 * Alert Router
 * Handles alert detection, management, and notification procedures
 */

export const alertRouter = router({
  /**
   * Manually trigger agent failure detection
   */
  checkAgentFailures: protectedProcedure.query(async ({ ctx }) => {
    try {
      const failures = await detectAgentFailures();
      const sentCount = await processAgentFailureAlerts(failures);

      return {
        success: true,
        failuresDetected: failures.length,
        notificationsSent: sentCount,
        failures: failures.map((f) => ({
          agentId: f.agentId,
          agentName: f.agentName,
          status: f.currentStatus,
          reason: f.failureReason,
        })),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error("[AlertRouter] Error checking agent failures:", errorMessage);
      return {
        success: false,
        error: errorMessage,
        failuresDetected: 0,
        notificationsSent: 0,
        failures: [],
      };
    }
  }),

  /**
   * Manually trigger agent recovery detection
   */
  checkAgentRecoveries: protectedProcedure.query(async ({ ctx }) => {
    try {
      const recoveries = await detectAgentRecoveries();
      const sentCount = await processAgentRecoveryAlerts(recoveries);

      return {
        success: true,
        recoveriesDetected: recoveries.length,
        notificationsSent: sentCount,
        recoveries: recoveries.map((r) => ({
          agentId: r.agentId,
          agentName: r.agentName,
          status: r.currentStatus,
        })),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error("[AlertRouter] Error checking agent recoveries:", errorMessage);
      return {
        success: false,
        error: errorMessage,
        recoveriesDetected: 0,
        notificationsSent: 0,
        recoveries: [],
      };
    }
  }),

  /**
   * Manually trigger budget alert detection
   */
  checkBudgetAlerts: protectedProcedure.query(async ({ ctx }) => {
    try {
      const alerts = await detectBudgetAlerts();
      const sentCount = await processBudgetAlerts(alerts);

      return {
        success: true,
        alertsDetected: alerts.length,
        notificationsSent: sentCount,
        alerts: alerts.map((a) => ({
          percentage: a.percentage,
          monthlyBudget: a.monthlyBudget,
          amountUsed: a.amountUsed,
          alertType: a.alertType,
        })),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error("[AlertRouter] Error checking budget alerts:", errorMessage);
      return {
        success: false,
        error: errorMessage,
        alertsDetected: 0,
        notificationsSent: 0,
        alerts: [],
      };
    }
  }),

  /**
   * Run complete alert detection cycle
   */
  runDetectionCycle: protectedProcedure.query(async ({ ctx }) => {
    try {
      const result = await runAlertDetectionCycle();

      return {
        success: true,
        ...result,
        totalAlerts:
          result.agentFailures + result.agentRecoveries + result.budgetAlerts,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error("[AlertRouter] Error running detection cycle:", errorMessage);
      return {
        success: false,
        error: errorMessage,
        agentFailures: 0,
        agentRecoveries: 0,
        budgetAlerts: 0,
        totalAlerts: 0,
      };
    }
  }),

  /**
   * Get alert history for current user
   */
  getHistory: protectedProcedure
    .input(
      z.object({
        limit: z.number().int().positive().max(100).default(20),
        offset: z.number().int().nonnegative().default(0),
        alertType: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) {
          return {
            success: false,
            error: "Database not available",
            alerts: [],
            total: 0,
          };
        }

        const alerts = await db
          .select()
          .from(notifications)
          .where(eq(notifications.userId, ctx.user.id))
          .orderBy(desc(notifications.createdAt))
          .limit(input.limit)
          .offset(input.offset);

        return {
          success: true,
          alerts: alerts.map((a) => ({
            id: a.id,
            type: a.notificationType,
            severity: a.severity,
            title: a.title,
            message: a.message,
            status: a.status,
            createdAt: a.createdAt,
            sentAt: a.sentAt,
          })),
          total: alerts.length,
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.error("[AlertRouter] Error getting alert history:", errorMessage);
        return {
          success: false,
          error: errorMessage,
          alerts: [],
          total: 0,
        };
      }
    }),

  /**
   * Acknowledge an alert (mark as read)
   */
  acknowledgeAlert: protectedProcedure
    .input(
      z.object({
        alertId: z.number().int().positive(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) {
          return {
            success: false,
            error: "Database not available",
          };
        }

        // Update alert status (mark as read by setting to sent if pending)
        await db
          .update(notifications)
          .set({
            status: "sent",
            updatedAt: new Date(),
          })
          .where(
            eq(notifications.id, input.alertId)
          );

        return {
          success: true,
          message: "Alert acknowledged",
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.error("[AlertRouter] Error acknowledging alert:", errorMessage);
        return {
          success: false,
          error: errorMessage,
        };
      }
    }),

  /**
   * Get alert statistics for dashboard
   */
  getStatistics: protectedProcedure.query(async ({ ctx }) => {
    try {
      const db = await getDb();
      if (!db) {
        return {
          success: false,
          error: "Database not available",
          stats: {
            totalAlerts: 0,
            unresolvedAlerts: 0,
            criticalAlerts: 0,
            warningAlerts: 0,
            infoAlerts: 0,
          },
        };
      }

      const allAlerts = await db
        .select()
        .from(notifications)
        .where(eq(notifications.userId, ctx.user.id));

      const stats = {
        totalAlerts: allAlerts.length,
        unresolvedAlerts: allAlerts.filter((a) => a.status === "pending").length,
        criticalAlerts: allAlerts.filter((a) => a.severity === "critical").length,
        warningAlerts: allAlerts.filter((a) => a.severity === "warning").length,
        infoAlerts: allAlerts.filter((a) => a.severity === "info").length,
      };

      return {
        success: true,
        stats,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error("[AlertRouter] Error getting alert statistics:", errorMessage);
      return {
        success: false,
        error: errorMessage,
        stats: {
          totalAlerts: 0,
          unresolvedAlerts: 0,
          criticalAlerts: 0,
          warningAlerts: 0,
          infoAlerts: 0,
        },
      };
    }
  }),

  /**
   * Get scheduler status and statistics
   */
  getSchedulerStatus: protectedProcedure.query(async ({ ctx }) => {
    try {
      const status = getSchedulerStatus();
      return {
        success: true,
        status,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      return {
        success: false,
        error: errorMessage,
        status: {
          running: false,
          totalRuns: 0,
          successfulRuns: 0,
          failedRuns: 0,
          isRunning: false,
          activeJobs: 0,
        },
      };
    }
  }),

  /**
   * Start the alert scheduler
   */
  startScheduler: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      const result = startAlertScheduler();
      return {
        success: result.success,
        message: result.message,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      return {
        success: false,
        message: `Failed to start scheduler: ${errorMessage}`,
      };
    }
  }),

  /**
   * Stop the alert scheduler
   */
  stopScheduler: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      const result = stopAlertScheduler();
      return {
        success: result.success,
        message: result.message,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      return {
        success: false,
        message: `Failed to stop scheduler: ${errorMessage}`,
      };
    }
  }),

  /**
   * Manually trigger detection cycle
   */
  triggerCycle: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      const result = await triggerDetectionCycle();
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      return {
        success: false,
        error: errorMessage,
      };
    }
  }),

  /**
   * Send test notification to verify email setup
   */
  sendTestNotification: protectedProcedure
    .input(
      z.object({
        email: z.string().email(),
        alertType: z.enum([
          "agent_failure",
          "agent_recovery",
          "budget_warning",
          "budget_critical",
        ]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const { sendEmail, initializeEmailService } = await import(
          "../_core/email"
        );
        const { getDefaultTemplate, renderTemplate } = await import(
          "../_core/emailTemplates"
        );

        const template = getDefaultTemplate(input.alertType);
        if (!template) {
          return {
            success: false,
            error: `Template not found for alert type: ${input.alertType}`,
          };
        }

        // Sample variables for test email
        const testVariables: Record<string, string | number> = {
          agentName: "Test Agent",
          failureTime: new Date().toISOString(),
          errorMessage: "This is a test notification",
          recoveryTime: new Date().toISOString(),
          downtimeDuration: "5 minutes",
          monthlyBudget: "1000",
          amountUsed: "800",
          percentage: "80",
          remainingBudget: "200",
          overageAmount: "0",
        };

        const subject = renderTemplate(template.subject, testVariables);
        const htmlBody = renderTemplate(template.htmlBody, testVariables);
        const plainTextBody = renderTemplate(
          template.plainTextBody || "",
          testVariables
        );

        const emailConfig = initializeEmailService();
        const result = await sendEmail(emailConfig, {
          to: input.email,
          subject: `[TEST] ${subject}`,
          htmlBody,
          plainTextBody,
        });

        if (result.success) {
          return {
            success: true,
            message: `Test email sent to ${input.email}`,
            messageId: result.messageId,
          };
        } else {
          return {
            success: false,
            error: result.error || "Failed to send test email",
          };
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.error("[AlertRouter] Error sending test notification:", errorMessage);
        return {
          success: false,
          error: errorMessage,
        };
      }
    }),
});
