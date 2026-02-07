import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  apiConfigurations,
  alerts,
  alertHistory,
  agentMetrics,
  monitoringConfigurations,
  InsertApiConfiguration,
  InsertAlert,
  InsertAlertHistory,
  InsertAgentMetric,
  InsertMonitoringConfiguration,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

/**
 * API Configuration Management
 */

export async function createApiConfiguration(config: InsertApiConfiguration) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(apiConfigurations).values(config);
  return result;
}

export async function getApiConfigurationsByUserId(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const configs = await db
    .select()
    .from(apiConfigurations)
    .where(eq(apiConfigurations.userId, userId));

  return configs;
}

export async function getApiConfiguration(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const config = await db
    .select()
    .from(apiConfigurations)
    .where(
      and(
        eq(apiConfigurations.id, id),
        eq(apiConfigurations.userId, userId)
      )
    )
    .limit(1);

  return config[0];
}

export async function updateApiConfiguration(
  id: number,
  userId: number,
  updates: Partial<InsertApiConfiguration>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(apiConfigurations)
    .set(updates)
    .where(
      and(
        eq(apiConfigurations.id, id),
        eq(apiConfigurations.userId, userId)
      )
    );
}

export async function deleteApiConfiguration(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .delete(apiConfigurations)
    .where(
      and(
        eq(apiConfigurations.id, id),
        eq(apiConfigurations.userId, userId)
      )
    );
}

/**
 * Alert Management
 */

export async function createAlert(alert: InsertAlert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(alerts).values(alert);
  return result;
}

export async function getAlertsByUserId(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const userAlerts = await db
    .select()
    .from(alerts)
    .where(eq(alerts.userId, userId))
    .limit(limit);

  return userAlerts;
}

export async function getActiveAlerts(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const activeAlerts = await db
    .select()
    .from(alerts)
    .where(
      and(
        eq(alerts.userId, userId),
        eq(alerts.status, "active")
      )
    );

  return activeAlerts;
}

export async function acknowledgeAlert(alertId: number, userId: number, acknowledgedBy: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(alerts)
    .set({
      status: "acknowledged",
      acknowledgedAt: new Date(),
      acknowledgedBy,
    })
    .where(
      and(
        eq(alerts.id, alertId),
        eq(alerts.userId, userId)
      )
    );
}

export async function resolveAlert(alertId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(alerts)
    .set({
      status: "resolved",
      resolvedAt: new Date(),
    })
    .where(
      and(
        eq(alerts.id, alertId),
        eq(alerts.userId, userId)
      )
    );
}

/**
 * Alert History
 */

export async function createAlertHistory(history: InsertAlertHistory) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(alertHistory).values(history);
}

/**
 * Agent Metrics
 */

export async function createAgentMetric(metric: InsertAgentMetric) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(agentMetrics).values(metric);
}

export async function getLatestAgentMetrics(agentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const metrics = await db
    .select()
    .from(agentMetrics)
    .where(eq(agentMetrics.agentId, agentId))
    .orderBy((m) => m.createdAt)
    .limit(1);

  return metrics[0];
}

export async function getAgentMetricsHistory(agentId: number, hours = 24) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);

  const metrics = await db
    .select()
    .from(agentMetrics)
    .where(
      and(
        eq(agentMetrics.agentId, agentId),
        // Note: This comparison might need adjustment based on your database
        // You may need to use raw SQL for proper timestamp comparison
      )
    );

  return metrics.filter(m => m.createdAt && new Date(m.createdAt) > cutoffTime);
}

/**
 * Monitoring Configuration
 */

export async function getMonitoringConfiguration(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const config = await db
    .select()
    .from(monitoringConfigurations)
    .where(eq(monitoringConfigurations.userId, userId))
    .limit(1);

  return config[0];
}

export async function createOrUpdateMonitoringConfiguration(
  userId: number,
  config: InsertMonitoringConfiguration
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await getMonitoringConfiguration(userId);

  if (existing) {
    await db
      .update(monitoringConfigurations)
      .set(config)
      .where(eq(monitoringConfigurations.userId, userId));
  } else {
    await db.insert(monitoringConfigurations).values({
      ...config,
      userId,
    });
  }
}
