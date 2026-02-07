import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, json, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Agents table - represents AI agents managed by the system
 */
export const agents = mysqlTable("agents", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  type: mysqlEnum("type", ["commander", "sub_agent"]).notNull(),
  personality: text("personality"),
  status: mysqlEnum("status", ["active", "idle", "processing", "offline"]).default("idle").notNull(),
  currentActivity: text("currentActivity"),
  nextHeartbeat: timestamp("nextHeartbeat"),
  bandwidth: int("bandwidth").default(100),
  lastHeartbeat: timestamp("lastHeartbeat"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Agent = typeof agents.$inferSelect;
export type InsertAgent = typeof agents.$inferInsert;

/**
 * Tasks table - represents work items for agents
 */
export const tasks = mysqlTable("tasks", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  agentId: int("agentId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  status: mysqlEnum("status", ["queued", "in_progress", "completed", "failed"]).notNull(),
  priority: int("priority").default(0),
  momentumScore: decimal("momentumScore", { precision: 5, scale: 2 }).default("0"),
  estimatedDuration: int("estimatedDuration"),
  actualDuration: int("actualDuration"),
  details: json("details"),
  result: text("result"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  startedAt: timestamp("startedAt"),
  completedAt: timestamp("completedAt"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Task = typeof tasks.$inferSelect;
export type InsertTask = typeof tasks.$inferInsert;

/**
 * API Usage Metrics table - tracks API calls and costs
 */
export const apiMetrics = mysqlTable("apiMetrics", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  agentId: int("agentId"),
  apiName: varchar("apiName", { length: 255 }).notNull(),
  endpoint: varchar("endpoint", { length: 255 }),
  requestCount: int("requestCount").default(1),
  cost: decimal("cost", { precision: 10, scale: 4 }).notNull(),
  inputTokens: int("inputTokens"),
  outputTokens: int("outputTokens"),
  responseTime: int("responseTime"),
  status: varchar("status", { length: 50 }),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ApiMetric = typeof apiMetrics.$inferSelect;
export type InsertApiMetric = typeof apiMetrics.$inferInsert;

/**
 * Cron Jobs table - represents scheduled automated tasks
 */
export const cronJobs = mysqlTable("cronJobs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  agentId: int("agentId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  schedule: varchar("schedule", { length: 100 }).notNull(),
  skillName: varchar("skillName", { length: 255 }),
  skillConfig: json("skillConfig"),
  isActive: boolean("isActive").default(true),
  lastExecution: timestamp("lastExecution"),
  nextExecution: timestamp("nextExecution"),
  executionCount: int("executionCount").default(0),
  lastResult: text("lastResult"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CronJob = typeof cronJobs.$inferSelect;
export type InsertCronJob = typeof cronJobs.$inferInsert;

/**
 * Documents table - tracks uploaded PDFs and documents
 */
export const documents = mysqlTable("documents", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  agentId: int("agentId"),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileSize: int("fileSize"),
  fileUrl: text("fileUrl"),
  mimeType: varchar("mimeType", { length: 100 }),
  pageCount: int("pageCount"),
  processingStatus: mysqlEnum("processingStatus", ["pending", "processing", "completed", "failed"]).default("pending").notNull(),
  processingProgress: int("processingProgress").default(0),
  extractedText: text("extractedText"),
  metadata: json("metadata"),
  uploadedAt: timestamp("uploadedAt").defaultNow().notNull(),
  processedAt: timestamp("processedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;

/**
 * Agent Communications table - logs inter-agent communication
 */
export const agentCommunications = mysqlTable("agentCommunications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  fromAgentId: int("fromAgentId").notNull(),
  toAgentId: int("toAgentId"),
  messageType: mysqlEnum("messageType", ["instruction", "status_update", "discussion", "planning", "result"]).notNull(),
  subject: varchar("subject", { length: 255 }),
  content: text("content").notNull(),
  relatedTaskId: int("relatedTaskId"),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AgentCommunication = typeof agentCommunications.$inferSelect;
export type InsertAgentCommunication = typeof agentCommunications.$inferInsert;

/**
 * Use Case Suggestions table - stores Twitter/external use case suggestions
 */
export const useCaseSuggestions = mysqlTable("useCaseSuggestions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  agentId: int("agentId").notNull(),
  source: varchar("source", { length: 100 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  relevanceScore: decimal("relevanceScore", { precision: 5, scale: 2 }),
  snapshot: text("snapshot"),
  businessApplicability: text("businessApplicability"),
  status: mysqlEnum("status", ["suggested", "reviewed", "deployed", "dismissed"]).default("suggested").notNull(),
  deployedTaskId: int("deployedTaskId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UseCaseSuggestion = typeof useCaseSuggestions.$inferSelect;
export type InsertUseCaseSuggestion = typeof useCaseSuggestions.$inferInsert;

/**
 * Budget Alerts table - tracks spending alerts and thresholds
 */
export const budgetAlerts = mysqlTable("budgetAlerts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  dailyBudget: decimal("dailyBudget", { precision: 10, scale: 2 }),
  monthlyBudget: decimal("monthlyBudget", { precision: 10, scale: 2 }),
  alertThreshold: int("alertThreshold").default(80),
  isActive: boolean("isActive").default(true),
  lastAlertSent: timestamp("lastAlertSent"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BudgetAlert = typeof budgetAlerts.$inferSelect;
export type InsertBudgetAlert = typeof budgetAlerts.$inferInsert;

/**
 * Backups table - stores metadata about system backups
 */
export const backups = mysqlTable("backups", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  label: varchar("label", { length: 255 }).notNull(),
  description: text("description"),
  backupType: mysqlEnum("backupType", ["manual", "automatic"]).notNull(),
  status: mysqlEnum("status", ["pending", "in_progress", "completed", "failed"]).default("pending").notNull(),
  s3Key: varchar("s3Key", { length: 255 }),
  s3Url: text("s3Url"),
  databaseSnapshot: text("databaseSnapshot"),
  size: int("size"),
  itemCount: int("itemCount"),
  includesAgents: boolean("includesAgents").default(true),
  includesTasks: boolean("includesTasks").default(true),
  includesDocuments: boolean("includesDocuments").default(true),
  includesMetrics: boolean("includesMetrics").default(true),
  includesCronJobs: boolean("includesCronJobs").default(true),
  includesUseCases: boolean("includesUseCases").default(true),
  includesBudgetAlerts: boolean("includesBudgetAlerts").default(true),
  checksum: varchar("checksum", { length: 64 }),
  retentionDays: int("retentionDays").default(30),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Backup = typeof backups.$inferSelect;
export type InsertBackup = typeof backups.$inferInsert;

/**
 * Restore Operations table - tracks restore history and operations
 */
export const restoreOperations = mysqlTable("restoreOperations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  backupId: int("backupId").notNull(),
  strategy: mysqlEnum("strategy", ["replace", "merge"]).notNull(),
  status: mysqlEnum("status", ["pending", "in_progress", "completed", "failed", "rolled_back"]).default("pending").notNull(),
  progress: int("progress").default(0),
  totalItems: int("totalItems"),
  processedItems: int("processedItems").default(0),
  conflictResolution: json("conflictResolution"),
  errorMessage: text("errorMessage"),
  startedAt: timestamp("startedAt"),
  completedAt: timestamp("completedAt"),
  rollbackAvailable: boolean("rollbackAvailable").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type RestoreOperation = typeof restoreOperations.$inferSelect;
export type InsertRestoreOperation = typeof restoreOperations.$inferInsert;

/**
 * Backup Schedules table - manages automatic backup scheduling
 */
export const backupSchedules = mysqlTable("backupSchedules", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  frequency: mysqlEnum("frequency", ["daily", "weekly", "monthly"]).notNull(),
  dayOfWeek: int("dayOfWeek"),
  dayOfMonth: int("dayOfMonth"),
  time: varchar("time", { length: 5 }),
  isActive: boolean("isActive").default(true),
  retentionDays: int("retentionDays").default(30),
  lastRun: timestamp("lastRun"),
  nextRun: timestamp("nextRun"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BackupSchedule = typeof backupSchedules.$inferSelect;
export type InsertBackupSchedule = typeof backupSchedules.$inferInsert;


/**
 * API Configuration table - stores OpenClaw API connection details
 */
export const apiConfigurations = mysqlTable("apiConfigurations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  apiEndpoint: text("apiEndpoint").notNull(),
  authMethod: mysqlEnum("authMethod", ["api_key", "oauth", "bearer_token"]).notNull(),
  apiKey: text("apiKey"), // Encrypted
  bearerToken: text("bearerToken"), // Encrypted
  oauthClientId: varchar("oauthClientId", { length: 255 }), // Encrypted
  oauthClientSecret: text("oauthClientSecret"), // Encrypted
  pollingInterval: int("pollingInterval").default(5000), // milliseconds
  connectionType: mysqlEnum("connectionType", ["websocket", "sse", "http_polling"]).default("http_polling"),
  isActive: boolean("isActive").default(true),
  lastTestedAt: timestamp("lastTestedAt"),
  testStatus: mysqlEnum("testStatus", ["success", "failed", "pending"]),
  testError: text("testError"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ApiConfiguration = typeof apiConfigurations.$inferSelect;
export type InsertApiConfiguration = typeof apiConfigurations.$inferInsert;

/**
 * Agent Metrics table - stores real-time and historical agent metrics
 */
export const agentMetrics = mysqlTable("agentMetrics", {
  id: int("id").autoincrement().primaryKey(),
  agentId: int("agentId").notNull(),
  userId: int("userId").notNull(),
  cpuUsage: int("cpuUsage"), // percentage 0-100
  memoryUsage: int("memoryUsage"), // percentage 0-100
  uptime: int("uptime"), // seconds
  uptimePercentage: int("uptimePercentage"), // percentage 0-100
  requestsProcessed: int("requestsProcessed").default(0),
  requestsFailed: int("requestsFailed").default(0),
  averageLatency: int("averageLatency"), // milliseconds
  errorRate: int("errorRate"), // percentage 0-100
  queueDepth: int("queueDepth").default(0),
  lastUpdate: timestamp("lastUpdate").defaultNow(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AgentMetric = typeof agentMetrics.$inferSelect;
export type InsertAgentMetric = typeof agentMetrics.$inferInsert;

/**
 * Alerts table - stores real-time alerts for critical issues
 */
export const alerts = mysqlTable("alerts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  agentId: int("agentId"),
  alertType: mysqlEnum("alertType", ["agent_down", "high_error_rate", "high_cpu", "high_memory", "connection_lost"]).notNull(),
  severity: mysqlEnum("severity", ["critical", "warning", "info"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  status: mysqlEnum("status", ["active", "acknowledged", "resolved"]).default("active").notNull(),
  acknowledgedAt: timestamp("acknowledgedAt"),
  acknowledgedBy: int("acknowledgedBy"),
  resolvedAt: timestamp("resolvedAt"),
  emailSent: boolean("emailSent").default(false),
  emailSentAt: timestamp("emailSentAt"),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Alert = typeof alerts.$inferSelect;
export type InsertAlert = typeof alerts.$inferInsert;

/**
 * Alert History table - tracks all alert events for auditing
 */
export const alertHistory = mysqlTable("alertHistory", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  alertId: int("alertId").notNull(),
  action: mysqlEnum("action", ["created", "acknowledged", "resolved", "email_sent", "escalated"]).notNull(),
  performedBy: int("performedBy"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AlertHistory = typeof alertHistory.$inferSelect;
export type InsertAlertHistory = typeof alertHistory.$inferInsert;

/**
 * Monitoring Configuration table - stores user preferences for monitoring
 */
export const monitoringConfigurations = mysqlTable("monitoringConfigurations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  enableRealTimeAlerts: boolean("enableRealTimeAlerts").default(true),
  enableEmailNotifications: boolean("enableEmailNotifications").default(true),
  emailForCriticalAlerts: varchar("emailForCriticalAlerts", { length: 320 }),
  emailForWarningAlerts: varchar("emailForWarningAlerts", { length: 320 }),
  criticalErrorRateThreshold: int("criticalErrorRateThreshold").default(10), // percentage
  warningErrorRateThreshold: int("warningErrorRateThreshold").default(5), // percentage
  criticalCpuThreshold: int("criticalCpuThreshold").default(90), // percentage
  warningCpuThreshold: int("warningCpuThreshold").default(75), // percentage
  criticalMemoryThreshold: int("criticalMemoryThreshold").default(90), // percentage
  warningMemoryThreshold: int("warningMemoryThreshold").default(75), // percentage
  agentDownTimeout: int("agentDownTimeout").default(60000), // milliseconds
  metricsRetentionDays: int("metricsRetentionDays").default(7),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MonitoringConfiguration = typeof monitoringConfigurations.$inferSelect;
export type InsertMonitoringConfiguration = typeof monitoringConfigurations.$inferInsert;
