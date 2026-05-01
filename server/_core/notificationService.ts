import { getDb } from "../db";
import { notifications, notificationPreferences, alerts, budgetAlerts, agents, apiMetrics } from "../../drizzle/schema";
import { sendEmail, initializeEmailService, EmailConfig } from "./email";
import { renderTemplate, getDefaultTemplate, validateTemplateVariables } from "./emailTemplates";
import { eq, and, gte, lte } from "drizzle-orm";

/**
 * Notification service for handling alert detection and email sending
 */

interface AlertNotificationPayload {
  userId: number;
  agentId?: number;
  alertType: string;
  severity: "critical" | "warning" | "info";
  title: string;
  message: string;
  variables: Record<string, string | number>;
}

interface BudgetAlertPayload {
  userId: number;
  percentage: number;
  monthlyBudget: number;
  amountUsed: number;
  remainingBudget: number;
  overageAmount?: number;
}

/**
 * Check if notification should be sent based on user preferences and rate limiting
 */
export async function shouldSendNotification(
  userId: number,
  notificationType: string,
  agentId?: number
): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) return false;

    // Get user notification preferences
    const prefs = await db.query.notificationPreferences.findFirst({
      where: eq(notificationPreferences.userId, userId),
    });

    if (!prefs || !prefs.emailVerified) {
      return false;
    }

    // Check if this notification type is enabled
    const typeEnabledMap: Record<string, boolean> = {
      agent_failure: prefs.agentFailureAlerts,
      agent_recovery: prefs.agentFailureAlerts,
      budget_warning: prefs.budgetWarningAlerts,
      budget_critical: prefs.budgetCriticalAlerts,
      high_error_rate: prefs.highErrorRateAlerts,
      high_cpu: prefs.highCpuAlerts,
      high_memory: prefs.highMemoryAlerts,
    };

    if (!typeEnabledMap[notificationType]) {
      return false;
    }

    // Check rate limiting - prevent duplicate alerts within 1 hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentNotification = await db.query.notifications.findFirst({
      where: and(
        eq(notifications.userId, userId),
        eq(notifications.notificationType, notificationType as any),
        agentId ? eq(notifications.relatedAgentId, agentId) : undefined,
        gte(notifications.createdAt, oneHourAgo)
      ),
    });

    return !recentNotification;
  } catch (error) {
    console.error("[NotificationService] Error checking notification eligibility:", error);
    return false;
  }
}

/**
 * Check if current time is within quiet hours
 */
export function isWithinQuietHours(quietStart?: string, quietEnd?: string, timezone: string = "UTC"): boolean {
  if (!quietStart || !quietEnd) {
    return false;
  }

  try {
    const now = new Date();
    const [startHour, startMin] = quietStart.split(":").map(Number);
    const [endHour, endMin] = quietEnd.split(":").map(Number);

    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;
    const currentTime = now.getHours() * 60 + now.getMinutes();

    if (startTime <= endTime) {
      return currentTime >= startTime && currentTime < endTime;
    } else {
      // Quiet hours span midnight
      return currentTime >= startTime || currentTime < endTime;
    }
  } catch (error) {
    console.error("[NotificationService] Error checking quiet hours:", error);
    return false;
  }
}

/**
 * Send agent failure notification
 */
export async function sendAgentFailureNotification(payload: AlertNotificationPayload): Promise<boolean> {
  try {
    const shouldSend = await shouldSendNotification(payload.userId, "agent_failure", payload.agentId);
    if (!shouldSend) {
      return false;
    }

    const db = await getDb();
    if (!db) return false;

    // Get user preferences for email and quiet hours
    const prefs = await db.query.notificationPreferences.findFirst({
      where: eq(notificationPreferences.userId, payload.userId),
    });

    if (!prefs) {
      return false;
    }

    // Check quiet hours
    if (isWithinQuietHours(prefs.quietHoursStart || undefined, prefs.quietHoursEnd || undefined, prefs.timezone)) {
      // Queue for digest instead of sending immediately
      return await queueNotificationForDigest(payload.userId, "agent_failure", payload);
    }

    return await sendNotificationEmail(payload.userId, "agent_failure", prefs.email, payload.variables);
  } catch (error) {
    console.error("[NotificationService] Error sending agent failure notification:", error);
    return false;
  }
}

/**
 * Send budget warning notification
 */
export async function sendBudgetWarningNotification(payload: BudgetAlertPayload): Promise<boolean> {
  try {
    const shouldSend = await shouldSendNotification(payload.userId, "budget_warning");
    if (!shouldSend) {
      return false;
    }

    const db = await getDb();
    if (!db) return false;

    const prefs = await db.query.notificationPreferences.findFirst({
      where: eq(notificationPreferences.userId, payload.userId),
    });

    if (!prefs) {
      return false;
    }

    const variables = {
      monthlyBudget: String(payload.monthlyBudget.toFixed(2)),
      amountUsed: String(payload.amountUsed.toFixed(2)),
      percentage: String(payload.percentage),
      remainingBudget: String(payload.remainingBudget.toFixed(2)),
    };

    if (isWithinQuietHours(prefs.quietHoursStart || undefined, prefs.quietHoursEnd || undefined, prefs.timezone)) {
      return await queueNotificationForDigest(payload.userId, "budget_warning", variables);
    }

    return await sendNotificationEmail(payload.userId, "budget_warning", prefs.email, variables);
  } catch (error) {
    console.error("[NotificationService] Error sending budget warning notification:", error);
    return false;
  }
}

/**
 * Send budget critical notification
 */
export async function sendBudgetCriticalNotification(payload: BudgetAlertPayload): Promise<boolean> {
  try {
    const shouldSend = await shouldSendNotification(payload.userId, "budget_critical");
    if (!shouldSend) {
      return false;
    }

    const db = await getDb();
    if (!db) return false;

    const prefs = await db.query.notificationPreferences.findFirst({
      where: eq(notificationPreferences.userId, payload.userId),
    });

    if (!prefs) {
      return false;
    }

    const variables = {
      monthlyBudget: String(payload.monthlyBudget.toFixed(2)),
      amountUsed: String(payload.amountUsed.toFixed(2)),
      overageAmount: String((payload.amountUsed - payload.monthlyBudget).toFixed(2)),
    };

    // Critical alerts bypass quiet hours
    return await sendNotificationEmail(payload.userId, "budget_critical", prefs.email, variables);
  } catch (error) {
    console.error("[NotificationService] Error sending budget critical notification:", error);
    return false;
  }
}

/**
 * Send notification email
 */
export async function sendNotificationEmail(
  userId: number,
  notificationType: string,
  recipientEmail: string,
  variables: Record<string, string | number>
): Promise<boolean> {
  try {
    const template = getDefaultTemplate(notificationType);
    if (!template) {
      console.error(`[NotificationService] Template not found for type: ${notificationType}`);
      return false;
    }

    // Validate template variables
    const validation = validateTemplateVariables(template.subject, variables as any);
    if (!validation.valid) {
      console.error(`[NotificationService] Missing template variables:`, validation.missingVariables);
      return false;
    }

    // Render template
    const subject = renderTemplate(template.subject, variables as any);
    const htmlBody = renderTemplate(template.htmlBody, variables as any);
    const plainTextBody = renderTemplate(template.plainTextBody || "", variables as any);

    // Initialize email service
    const emailConfig = initializeEmailService();

    // Send email
    const result = await sendEmail(emailConfig, {
      to: recipientEmail,
      subject,
      htmlBody,
      plainTextBody,
    });

    if (!result.success) {
      // Store failed notification
      await storeFailedNotification(userId, notificationType, recipientEmail, result.error || "Unknown error");
      return false;
    }

    // Store successful notification
    await storeSuccessfulNotification(userId, notificationType, recipientEmail, result.messageId);
    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[NotificationService] Error sending notification email:", errorMessage);
    await storeFailedNotification(userId, notificationType, recipientEmail, errorMessage);
    return false;
  }
}

/**
 * Store successful notification in database
 */
export async function storeSuccessfulNotification(
  userId: number,
  notificationType: string,
  recipientEmail: string,
  messageId?: string
): Promise<void> {
  try {
    const db = await getDb();
    if (!db) return;

    await db.insert(notifications).values({
      userId,
      notificationType: (notificationType as "agent_failure" | "agent_recovery" | "budget_warning" | "budget_critical" | "high_error_rate" | "high_cpu" | "high_memory" | "connection_lost" | "daily_digest" | "weekly_digest") || "agent_failure",
      severity: notificationType.includes("critical") ? "critical" : "warning",
      title: `${notificationType} notification`,
      message: `Notification sent to ${recipientEmail}`,
      recipientEmail,
      status: "sent",
      sentAt: new Date(),
      metadata: messageId ? { messageId } : undefined,
    });
  } catch (error) {
    console.error("[NotificationService] Error storing successful notification:", error);
  }
}

/**
 * Store failed notification in database
 */
export async function storeFailedNotification(
  userId: number,
  notificationType: string,
  recipientEmail: string,
  failureReason: string
): Promise<void> {
  try {
    const db = await getDb();
    if (!db) return;

    await db.insert(notifications).values({
      userId,
      notificationType: (notificationType as "agent_failure" | "agent_recovery" | "budget_warning" | "budget_critical" | "high_error_rate" | "high_cpu" | "high_memory" | "connection_lost" | "daily_digest" | "weekly_digest") || "agent_failure",
      severity: notificationType.includes("critical") ? "critical" : "warning",
      title: `${notificationType} notification failed`,
      message: `Failed to send notification to ${recipientEmail}`,
      recipientEmail,
      status: "failed",
      failureReason,
      retryCount: 0,
    });
  } catch (error) {
    console.error("[NotificationService] Error storing failed notification:", error);
  }
}

/**
 * Queue notification for digest (daily or weekly)
 */
export async function queueNotificationForDigest(
  userId: number,
  notificationType: string,
  payload: Record<string, any>
): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) return false;

    const prefs = await db.query.notificationPreferences.findFirst({
      where: eq(notificationPreferences.userId, userId),
    });

    if (!prefs) {
      return false;
    }

    // Store notification with pending status for digest
    await db.insert(notifications).values({
      userId,
      notificationType: (notificationType as "agent_failure" | "agent_recovery" | "budget_warning" | "budget_critical" | "high_error_rate" | "high_cpu" | "high_memory" | "connection_lost" | "daily_digest" | "weekly_digest") || "agent_failure",
      severity: "info",
      title: `${notificationType} - queued for digest`,
      message: JSON.stringify(payload),
      recipientEmail: prefs.email,
      status: "pending",
      metadata: { queuedForDigest: true, frequency: prefs.notificationFrequency },
    });

    return true;
  } catch (error) {
    console.error("[NotificationService] Error queuing notification for digest:", error);
    return false;
  }
}

/**
 * Detect agent failures and send notifications
 */
export async function detectAndNotifyAgentFailures(): Promise<number> {
  try {
    const db = await getDb();
    if (!db) return 0;

    // Find agents that have failed
    const failedAgents = await db.query.agents.findMany({
      where: eq(agents.status, "offline"),
    });

    let notificationCount = 0;

    for (const agent of failedAgents) {
      const shouldSend = await shouldSendNotification(agent.userId, "agent_failure", agent.id);
      if (shouldSend) {
        const success = await sendAgentFailureNotification({
          userId: agent.userId,
          agentId: agent.id,
          alertType: "agent_down",
          severity: "critical" as const,
          title: `Agent ${agent.name} has failed`,
          message: `Agent ${agent.name} is offline and requires immediate attention`,
          variables: {
            agentName: agent.name,
            failureTime: new Date().toISOString(),
            errorMessage: "Agent offline - no heartbeat received",
          },
        });

        if (success) {
          notificationCount++;
        }
      }
    }

    return notificationCount;
  } catch (error) {
    console.error("[NotificationService] Error detecting agent failures:", error);
    return 0;
  }
}

/**
 * Detect budget alerts and send notifications
 */
export async function detectAndNotifyBudgetAlerts(): Promise<number> {
  try {
    const db = await getDb();
    if (!db) return 0;

    // Find all active budget alerts
    const budgets = await db.query.budgetAlerts.findMany({
      where: eq(budgetAlerts.isActive, true),
    });

    let notificationCount = 0;

    for (const budget of budgets) {
      // Calculate current month spending (simplified - in production, aggregate from apiMetrics)
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const metrics = await db?.query.apiMetrics.findMany({
        where: and(
          eq(apiMetrics.userId, budget.userId),
          gte(apiMetrics.createdAt, monthStart)
        ),
      }) || [];

      const totalSpent = metrics.reduce((sum: number, m: any) => sum + parseFloat(m.cost.toString()), 0);
      const monthlyBudget = budget.monthlyBudget ? parseFloat(budget.monthlyBudget.toString()) : 1000;
      const percentage = Math.round((totalSpent / monthlyBudget) * 100);

      // Send critical alert if budget exceeded
      if (percentage >= 100) {
        const success = await sendBudgetCriticalNotification({
          userId: budget.userId,
          percentage,
          monthlyBudget,
          amountUsed: totalSpent,
          remainingBudget: Math.max(0, monthlyBudget - totalSpent),
          overageAmount: Math.max(0, totalSpent - monthlyBudget),
        });

        if (success) {
          notificationCount++;
        }
      }
      // Send warning if at threshold
      else if (percentage >= budget.alertThreshold) {
        const success = await sendBudgetWarningNotification({
          userId: budget.userId,
          percentage,
          monthlyBudget,
          amountUsed: totalSpent,
          remainingBudget: monthlyBudget - totalSpent,
        });

        if (success) {
          notificationCount++;
        }
      }
    }

    return notificationCount;
  } catch (error) {
    console.error("[NotificationService] Error detecting budget alerts:", error);
    return 0;
  }
}
