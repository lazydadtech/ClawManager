import { getDb } from "./db";
import { backups, agents, tasks, documents, apiMetrics, cronJobs, useCaseSuggestions, budgetAlerts } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";
import crypto from "crypto";

export interface BackupData {
  agents?: any[];
  tasks?: any[];
  documents?: any[];
  metrics?: any[];
  cronJobs?: any[];
  useCases?: any[];
  budgetAlerts?: any[];
  metadata: {
    version: string;
    timestamp: string;
    userId: number;
  };
}

/**
 * Export data for backup based on selected options
 */
export async function exportBackupData(
  userId: number,
  options: {
    includesAgents: boolean;
    includesTasks: boolean;
    includesDocuments: boolean;
    includesMetrics: boolean;
    includesCronJobs: boolean;
    includesUseCases: boolean;
    includesBudgetAlerts: boolean;
  }
): Promise<BackupData> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const data: BackupData = {
    metadata: {
      version: "1.0",
      timestamp: new Date().toISOString(),
      userId,
    },
  };

  if (options.includesAgents) {
    data.agents = await db.select().from(agents).where(eq(agents.userId, userId));
  }

  if (options.includesTasks) {
    data.tasks = await db.select().from(tasks).where(eq(tasks.userId, userId));
  }

  if (options.includesDocuments) {
    data.documents = await db.select().from(documents).where(eq(documents.userId, userId));
  }

  if (options.includesMetrics) {
    data.metrics = await db.select().from(apiMetrics).where(eq(apiMetrics.userId, userId));
  }

  if (options.includesCronJobs) {
    data.cronJobs = await db.select().from(cronJobs).where(eq(cronJobs.userId, userId));
  }

  if (options.includesUseCases) {
    data.useCases = await db.select().from(useCaseSuggestions).where(eq(useCaseSuggestions.userId, userId));
  }

  if (options.includesBudgetAlerts) {
    data.budgetAlerts = await db.select().from(budgetAlerts).where(eq(budgetAlerts.userId, userId));
  }

  return data;
}

/**
 * Calculate checksum for backup data
 */
export function calculateChecksum(data: BackupData): string {
  const json = JSON.stringify(data);
  return crypto.createHash("sha256").update(json).digest("hex");
}

/**
 * Upload backup to S3
 */
export async function uploadBackupToS3(data: BackupData, userId: number): Promise<{ key: string; url: string; size: number }> {
  const json = JSON.stringify(data);
  const buffer = Buffer.from(json, "utf-8");
  const key = `backups/${userId}/${nanoid()}.json`;

  const result = await storagePut(key, buffer, "application/json");

  return {
    key: result.key,
    url: result.url,
    size: buffer.length,
  };
}

/**
 * Import backup data into database (merge strategy)
 */
export async function importBackupDataMerge(userId: number, data: BackupData): Promise<{ itemsProcessed: number }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  let itemsProcessed = 0;

  try {
    if (data.agents) {
      for (const agent of data.agents) {
        // Skip if agent already exists with same name
        await db.insert(agents).values({ ...agent, userId }).onDuplicateKeyUpdate({
          set: agent,
        });
        itemsProcessed++;
      }
    }

    if (data.tasks) {
      for (const task of data.tasks) {
        await db.insert(tasks).values({ ...task, userId }).onDuplicateKeyUpdate({
          set: task,
        });
        itemsProcessed++;
      }
    }

    if (data.documents) {
      for (const doc of data.documents) {
        await db.insert(documents).values({ ...doc, userId }).onDuplicateKeyUpdate({
          set: doc,
        });
        itemsProcessed++;
      }
    }

    if (data.metrics) {
      for (const metric of data.metrics) {
        await db.insert(apiMetrics).values({ ...metric, userId }).onDuplicateKeyUpdate({
          set: metric,
        });
        itemsProcessed++;
      }
    }

    if (data.cronJobs) {
      for (const job of data.cronJobs) {
        await db.insert(cronJobs).values({ ...job, userId }).onDuplicateKeyUpdate({
          set: job,
        });
        itemsProcessed++;
      }
    }

    if (data.useCases) {
      for (const useCase of data.useCases) {
        await db.insert(useCaseSuggestions).values({ ...useCase, userId }).onDuplicateKeyUpdate({
          set: useCase,
        });
        itemsProcessed++;
      }
    }

    if (data.budgetAlerts) {
      for (const alert of data.budgetAlerts) {
        await db.insert(budgetAlerts).values({ ...alert, userId }).onDuplicateKeyUpdate({
          set: alert,
        });
        itemsProcessed++;
      }
    }

    return { itemsProcessed };
  } catch (error) {
    console.error("Merge import failed:", error);
    throw error;
  }
}

/**
 * Import backup data into database (replace strategy)
 */
export async function importBackupDataReplace(userId: number, data: BackupData): Promise<{ itemsProcessed: number }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  let itemsProcessed = 0;

  try {
    // Delete existing data for this user
    if (data.agents) {
      await db.delete(agents).where(eq(agents.userId, userId));
    }
    if (data.tasks) {
      await db.delete(tasks).where(eq(tasks.userId, userId));
    }
    if (data.documents) {
      await db.delete(documents).where(eq(documents.userId, userId));
    }
    if (data.metrics) {
      await db.delete(apiMetrics).where(eq(apiMetrics.userId, userId));
    }
    if (data.cronJobs) {
      await db.delete(cronJobs).where(eq(cronJobs.userId, userId));
    }
    if (data.useCases) {
      await db.delete(useCaseSuggestions).where(eq(useCaseSuggestions.userId, userId));
    }
    if (data.budgetAlerts) {
      await db.delete(budgetAlerts).where(eq(budgetAlerts.userId, userId));
    }

    // Insert new data
    if (data.agents) {
      for (const agent of data.agents) {
        await db.insert(agents).values({ ...agent, userId });
        itemsProcessed++;
      }
    }

    if (data.tasks) {
      for (const task of data.tasks) {
        await db.insert(tasks).values({ ...task, userId });
        itemsProcessed++;
      }
    }

    if (data.documents) {
      for (const doc of data.documents) {
        await db.insert(documents).values({ ...doc, userId });
        itemsProcessed++;
      }
    }

    if (data.metrics) {
      for (const metric of data.metrics) {
        await db.insert(apiMetrics).values({ ...metric, userId });
        itemsProcessed++;
      }
    }

    if (data.cronJobs) {
      for (const job of data.cronJobs) {
        await db.insert(cronJobs).values({ ...job, userId });
        itemsProcessed++;
      }
    }

    if (data.useCases) {
      for (const useCase of data.useCases) {
        await db.insert(useCaseSuggestions).values({ ...useCase, userId });
        itemsProcessed++;
      }
    }

    if (data.budgetAlerts) {
      for (const alert of data.budgetAlerts) {
        await db.insert(budgetAlerts).values({ ...alert, userId });
        itemsProcessed++;
      }
    }

    return { itemsProcessed };
  } catch (error) {
    console.error("Replace import failed:", error);
    throw error;
  }
}
