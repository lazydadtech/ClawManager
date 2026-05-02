import { getDb } from "../db";
import { agents, budgetAlerts, apiMetrics, notifications } from "../../drizzle/schema";
import { eq, and, gte, lt, desc } from "drizzle-orm";
import { sendEmail, initializeEmailService } from "./email";
import { renderTemplate, getDefaultTemplate } from "./emailTemplates";

/**
 * Alert Detection Service
 * Monitors agent status and budget thresholds to trigger notifications
 */

export interface AgentFailureAlert {
  agentId: number;
  userId: number;
  agentName: string;
  previousStatus: string;
  currentStatus: string;
  lastHeartbeat?: Date;
  failureReason?: string;
}

export interface BudgetAlert {
  userId: number;
  percentage: number;
  monthlyBudget: number;
  amountUsed: number;
  remainingBudget: number;
  alertType: "warning" | "critical";
}

/**
 * Check if an alert has been sent recently (within 1 hour)
 */
async function hasRecentAlert(
  userId: number,
  agentId: number | null,
  alertType: string
): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) return false;

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const recentAlert = await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.notificationType, alertType as any),
          agentId ? eq(notifications.relatedAgentId, agentId) : undefined,
          gte(notifications.createdAt, oneHourAgo),
          eq(notifications.status, "sent")
        )
      )
      .limit(1);

    return recentAlert.length > 0;
  } catch (error) {
    console.error("[AlertDetectionService] Error checking recent alerts:", error);
    return false;
  }
}

/**
 * Store alert in database
 */
async function storeAlert(
  userId: number,
  alertType: string,
  severity: string,
  title: string,
  message: string,
  agentId?: number,
  metadata?: Record<string, any>
): Promise<number | null> {
  try {
    const db = await getDb();
    if (!db) return null;

    const alertTypeMap: Record<string, any> = {
      agent_failure: "agent_failure",
      agent_recovery: "agent_recovery",
      budget_warning: "budget_warning",
      budget_critical: "budget_critical",
    };

    const result = await db.insert(notifications).values({
      userId,
      notificationType: (alertTypeMap[alertType] || "agent_failure") as any,
      severity: (severity as any) || "warning",
      title,
      message,
      recipientEmail: "", // Will be populated when sending
      relatedAgentId: agentId,
      status: "pending",
      metadata,
    });

    // Return a generated ID (simplified - in production use proper ID generation)
    return Math.floor(Math.random() * 1000000);
  } catch (error) {
    console.error("[AlertDetectionService] Error storing alert:", error);
    return null;
  }
}

/**
 * Send alert email notification
 */
async function sendAlertEmail(
  userId: number,
  email: string,
  alertType: string,
  variables: Record<string, string | number>
): Promise<boolean> {
  try {
    const template = getDefaultTemplate(alertType);
    if (!template) {
      console.error(`[AlertDetectionService] Template not found for: ${alertType}`);
      return false;
    }

    const subject = renderTemplate(template.subject, variables);
    const htmlBody = renderTemplate(template.htmlBody, variables);
    const plainTextBody = renderTemplate(template.plainTextBody || "", variables);

    const emailConfig = initializeEmailService();
    const result = await sendEmail(emailConfig, {
      to: email,
      subject,
      htmlBody,
      plainTextBody,
    });

    return result.success;
  } catch (error) {
    console.error("[AlertDetectionService] Error sending alert email:", error);
    return false;
  }
}

/**
 * Detect and handle agent failures
 */
export async function detectAgentFailures(): Promise<AgentFailureAlert[]> {
  try {
    const db = await getDb();
    if (!db) return [];

    const detectedFailures: AgentFailureAlert[] = [];

    // Find all agents that are currently offline
    const offlineAgents = await db
      .select()
      .from(agents)
      .where(eq(agents.status, "offline" as any));

    for (const agent of offlineAgents) {
      // Check if we've already sent an alert for this agent in the last hour
      const hasRecent = await hasRecentAlert(agent.userId, agent.id, "agent_failure");
      if (hasRecent) {
        continue;
      }

      const failure: AgentFailureAlert = {
        agentId: agent.id,
        userId: agent.userId,
        agentName: agent.name,
        previousStatus: "online",
        currentStatus: "offline",
        lastHeartbeat: agent.lastHeartbeat || undefined,
        failureReason: "Agent offline - no heartbeat received",
      };

      detectedFailures.push(failure);
    }

    return detectedFailures;
  } catch (error) {
    console.error("[AlertDetectionService] Error detecting agent failures:", error);
    return [];
  }
}

/**
 * Detect and handle agent recoveries
 */
export async function detectAgentRecoveries(): Promise<AgentFailureAlert[]> {
  try {
    const db = await getDb();
    if (!db) return [];

    const detectedRecoveries: AgentFailureAlert[] = [];

    // Find agents that recently came back online
    // (This would require tracking previous status - simplified for now)
    const recentlyOnlineAgents = await db
      .select()
      .from(agents)
      .where(eq(agents.status, "online" as any))
      .orderBy(desc(agents.lastHeartbeat || new Date(0)))
      .limit(10);

    // Check if any have recovery notifications pending
    for (const agent of recentlyOnlineAgents) {
      // Check if there's a recent failure alert for this agent
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const recentFailure = await db
        .select()
        .from(notifications)
        .where(
          and(
            eq(notifications.userId, agent.userId),
            eq(notifications.notificationType, "agent_failure"),
            eq(notifications.relatedAgentId, agent.id),
            gte(notifications.createdAt, oneHourAgo)
          )
        )
        .limit(1);

      if (recentFailure.length > 0) {
        // Check if recovery notification already sent
        const hasRecoveryAlert = await hasRecentAlert(
          agent.userId,
          agent.id,
          "agent_recovery"
        );
        if (!hasRecoveryAlert) {
          const recovery: AgentFailureAlert = {
            agentId: agent.id,
            userId: agent.userId,
            agentName: agent.name,
            previousStatus: "offline",
            currentStatus: "online",
            lastHeartbeat: agent.lastHeartbeat || undefined,
            failureReason: undefined,
          };

          detectedRecoveries.push(recovery);
        }
      }
    }

    return detectedRecoveries;
  } catch (error) {
    console.error("[AlertDetectionService] Error detecting agent recoveries:", error);
    return [];
  }
}

/**
 * Detect budget alerts
 */
export async function detectBudgetAlerts(): Promise<BudgetAlert[]> {
  try {
    const db = await getDb();
    if (!db) return [];

    const detectedAlerts: BudgetAlert[] = [];

    // Get all active budget alerts
    const budgets = await db.select().from(budgetAlerts).where(eq(budgetAlerts.isActive, true));

    for (const budget of budgets) {
      // Calculate current month spending
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const metrics = await db
        .select()
        .from(apiMetrics)
        .where(
          and(
            eq(apiMetrics.userId, budget.userId),
            gte(apiMetrics.createdAt, monthStart)
          )
        );

      const totalSpent = metrics.reduce((sum: number, m: any) => {
        const cost = typeof m.cost === "number" ? m.cost : parseFloat(m.cost || "0");
        return sum + cost;
      }, 0);

      const monthlyBudget = budget.monthlyBudget
        ? parseFloat(budget.monthlyBudget.toString())
        : 1000;
      const percentage = Math.round((totalSpent / monthlyBudget) * 100);
      const remainingBudget = Math.max(0, monthlyBudget - totalSpent);

      // Check for critical alert (100% or more)
      if (percentage >= 100) {
        const hasRecent = await hasRecentAlert(budget.userId, null, "budget_critical");
        if (!hasRecent) {
          detectedAlerts.push({
            userId: budget.userId,
            percentage,
            monthlyBudget,
            amountUsed: totalSpent,
            remainingBudget,
            alertType: "critical",
          });
        }
      }
      // Check for warning alert (at or above threshold)
      else if (percentage >= (budget.alertThreshold || 80)) {
        const hasRecent = await hasRecentAlert(budget.userId, null, "budget_warning");
        if (!hasRecent) {
          detectedAlerts.push({
            userId: budget.userId,
            percentage,
            monthlyBudget,
            amountUsed: totalSpent,
            remainingBudget,
            alertType: "warning",
          });
        }
      }
    }

    return detectedAlerts;
  } catch (error) {
    console.error("[AlertDetectionService] Error detecting budget alerts:", error);
    return [];
  }
}

/**
 * Process agent failure alerts and send notifications
 */
export async function processAgentFailureAlerts(failures: AgentFailureAlert[]): Promise<number> {
  let sentCount = 0;

  for (const failure of failures) {
    try {
      // Store alert in database
      const alertId = await storeAlert(
        failure.userId,
        "agent_failure",
        "critical",
        `Agent ${failure.agentName} Failed`,
        `Agent ${failure.agentName} is offline and requires immediate attention`,
        failure.agentId,
        {
          previousStatus: failure.previousStatus,
          currentStatus: failure.currentStatus,
          lastHeartbeat: failure.lastHeartbeat?.toISOString(),
        }
      );

      if (!alertId) continue;

      // Send email notification
      const variables = {
        agentName: failure.agentName,
        failureTime: new Date().toISOString(),
        errorMessage: failure.failureReason || "Agent offline - no heartbeat received",
      };

      // Get user email from preferences (simplified - in production, fetch from notificationPreferences)
      // For now, we'll just log that the alert was created
      console.log(`[AlertDetectionService] Agent failure alert created for ${failure.agentName}`);
      sentCount++;
    } catch (error) {
      console.error("[AlertDetectionService] Error processing agent failure:", error);
    }
  }

  return sentCount;
}

/**
 * Process agent recovery alerts and send notifications
 */
export async function processAgentRecoveryAlerts(recoveries: AgentFailureAlert[]): Promise<number> {
  let sentCount = 0;

  for (const recovery of recoveries) {
    try {
      // Store alert in database
      const alertId = await storeAlert(
        recovery.userId,
        "agent_recovery",
        "info",
        `Agent ${recovery.agentName} Recovered`,
        `Agent ${recovery.agentName} is back online and operational`,
        recovery.agentId,
        {
          previousStatus: recovery.previousStatus,
          currentStatus: recovery.currentStatus,
          recoveryTime: new Date().toISOString(),
        }
      );

      if (!alertId) continue;

      console.log(
        `[AlertDetectionService] Agent recovery alert created for ${recovery.agentName}`
      );
      sentCount++;
    } catch (error) {
      console.error("[AlertDetectionService] Error processing agent recovery:", error);
    }
  }

  return sentCount;
}

/**
 * Process budget alerts and send notifications
 */
export async function processBudgetAlerts(alerts: BudgetAlert[]): Promise<number> {
  let sentCount = 0;

  for (const alert of alerts) {
    try {
      const alertType = alert.alertType === "critical" ? "budget_critical" : "budget_warning";
      const severity = alert.alertType === "critical" ? "critical" : "warning";

      // Store alert in database
      const alertId = await storeAlert(
        alert.userId,
        alertType,
        severity,
        `Budget ${alert.alertType === "critical" ? "Exceeded" : "Warning"}: ${alert.percentage}% Used`,
        `You have used ${alert.percentage}% of your monthly budget`,
        undefined,
        {
          percentage: alert.percentage,
          monthlyBudget: alert.monthlyBudget,
          amountUsed: alert.amountUsed,
          remainingBudget: alert.remainingBudget,
        }
      );

      if (!alertId) continue;

      console.log(
        `[AlertDetectionService] Budget ${alert.alertType} alert created (${alert.percentage}%)`
      );
      sentCount++;
    } catch (error) {
      console.error("[AlertDetectionService] Error processing budget alert:", error);
    }
  }

  return sentCount;
}

/**
 * Run complete alert detection cycle
 */
export async function runAlertDetectionCycle(): Promise<{
  agentFailures: number;
  agentRecoveries: number;
  budgetAlerts: number;
}> {
  try {
    console.log("[AlertDetectionService] Starting alert detection cycle...");

    // Detect and process agent failures
    const failures = await detectAgentFailures();
    const failureCount = await processAgentFailureAlerts(failures);

    // Detect and process agent recoveries
    const recoveries = await detectAgentRecoveries();
    const recoveryCount = await processAgentRecoveryAlerts(recoveries);

    // Detect and process budget alerts
    const budgetAlerts = await detectBudgetAlerts();
    const budgetCount = await processBudgetAlerts(budgetAlerts);

    console.log(
      `[AlertDetectionService] Alert detection cycle complete: ${failureCount} failures, ${recoveryCount} recoveries, ${budgetCount} budget alerts`
    );

    return {
      agentFailures: failureCount,
      agentRecoveries: recoveryCount,
      budgetAlerts: budgetCount,
    };
  } catch (error) {
    console.error("[AlertDetectionService] Error running alert detection cycle:", error);
    return {
      agentFailures: 0,
      agentRecoveries: 0,
      budgetAlerts: 0,
    };
  }
}
