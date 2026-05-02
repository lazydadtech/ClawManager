import { runAlertDetectionCycle } from "./alertDetectionService";

/**
 * Alert Scheduler
 * Manages periodic alert detection cycles
 */

interface AlertSchedulerConfig {
  enabled: boolean;
  intervalMs: number; // How often to run detection cycle
  maxConcurrent: number; // Max concurrent detection cycles
}

interface JobStatus {
  running: boolean;
  lastRun?: Date;
  lastError?: string;
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
}

// Default configuration
const DEFAULT_CONFIG: AlertSchedulerConfig = {
  enabled: true,
  intervalMs: 5 * 60 * 1000, // Run every 5 minutes
  maxConcurrent: 1,
};

// Global state
let scheduler: ReturnType<typeof setInterval> | null = null;
let jobStatus: JobStatus = {
  running: false,
  totalRuns: 0,
  successfulRuns: 0,
  failedRuns: 0,
};
let activeJobs = 0;

/**
 * Start the alert scheduler
 */
export function startAlertScheduler(
  config: Partial<AlertSchedulerConfig> = {}
): { success: boolean; message: string } {
  try {
    const finalConfig = { ...DEFAULT_CONFIG, ...config };

    if (!finalConfig.enabled) {
      return {
        success: false,
        message: "Alert scheduler is disabled in configuration",
      };
    }

    if (scheduler) {
      return {
        success: false,
        message: "Alert scheduler is already running",
      };
    }

    // Start the scheduler
    scheduler = setInterval(async () => {
      // Skip if already running at max concurrency
      if (activeJobs >= finalConfig.maxConcurrent) {
        console.warn(
          `[AlertScheduler] Skipping cycle - ${activeJobs} jobs already running`
        );
        return;
      }

      activeJobs++;
      jobStatus.running = true;

      try {
        const result = await runAlertDetectionCycle();
        jobStatus.lastRun = new Date();
        jobStatus.successfulRuns++;
        jobStatus.totalRuns++;

        console.log(
          `[AlertScheduler] Detection cycle completed: ${result.agentFailures} failures, ${result.agentRecoveries} recoveries, ${result.budgetAlerts} budget alerts`
        );
      } catch (error) {
        jobStatus.lastError =
          error instanceof Error ? error.message : "Unknown error";
        jobStatus.failedRuns++;
        jobStatus.totalRuns++;

        console.error("[AlertScheduler] Detection cycle failed:", jobStatus.lastError);
      } finally {
        activeJobs--;
        jobStatus.running = activeJobs > 0;
      }
    }, finalConfig.intervalMs);

    console.log(
      `[AlertScheduler] Started with interval: ${finalConfig.intervalMs}ms`
    );

    return {
      success: true,
      message: `Alert scheduler started (interval: ${finalConfig.intervalMs}ms)`,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[AlertScheduler] Error starting scheduler:", errorMessage);
    return {
      success: false,
      message: `Failed to start scheduler: ${errorMessage}`,
    };
  }
}

/**
 * Stop the alert scheduler
 */
export function stopAlertScheduler(): { success: boolean; message: string } {
  try {
    if (!scheduler) {
      return {
        success: false,
        message: "Alert scheduler is not running",
      };
    }

    clearInterval(scheduler);
    scheduler = null;
    jobStatus.running = false;

    console.log("[AlertScheduler] Stopped");

    return {
      success: true,
      message: "Alert scheduler stopped",
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[AlertScheduler] Error stopping scheduler:", errorMessage);
    return {
      success: false,
      message: `Failed to stop scheduler: ${errorMessage}`,
    };
  }
}

/**
 * Get scheduler status
 */
export function getSchedulerStatus(): JobStatus & {
  isRunning: boolean;
  activeJobs: number;
} {
  return {
    ...jobStatus,
    isRunning: scheduler !== null,
    activeJobs,
  };
}

/**
 * Manually trigger a detection cycle
 */
export async function triggerDetectionCycle(): Promise<{
  success: boolean;
  result?: any;
  error?: string;
}> {
  try {
    if (activeJobs >= DEFAULT_CONFIG.maxConcurrent) {
      return {
        success: false,
        error: `Max concurrent jobs reached (${activeJobs}/${DEFAULT_CONFIG.maxConcurrent})`,
      };
    }

    activeJobs++;
    jobStatus.running = true;

    try {
      const result = await runAlertDetectionCycle();
      jobStatus.lastRun = new Date();
      jobStatus.successfulRuns++;
      jobStatus.totalRuns++;

      return {
        success: true,
        result,
      };
    } catch (error) {
      jobStatus.lastError =
        error instanceof Error ? error.message : "Unknown error";
      jobStatus.failedRuns++;
      jobStatus.totalRuns++;

      return {
        success: false,
        error: jobStatus.lastError,
      };
    } finally {
      activeJobs--;
      jobStatus.running = activeJobs > 0;
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
 * Reset scheduler statistics
 */
export function resetSchedulerStats(): void {
  jobStatus = {
    running: jobStatus.running,
    totalRuns: 0,
    successfulRuns: 0,
    failedRuns: 0,
  };
  console.log("[AlertScheduler] Statistics reset");
}

/**
 * Get scheduler configuration
 */
export function getSchedulerConfig(): AlertSchedulerConfig {
  return DEFAULT_CONFIG;
}

/**
 * Update scheduler configuration
 */
export function updateSchedulerConfig(
  config: Partial<AlertSchedulerConfig>
): { success: boolean; message: string } {
  try {
    // Update default config
    Object.assign(DEFAULT_CONFIG, config);

    // If scheduler is running, restart it with new config
    if (scheduler) {
      stopAlertScheduler();
      return startAlertScheduler(DEFAULT_CONFIG);
    }

    return {
      success: true,
      message: "Scheduler configuration updated",
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      message: `Failed to update configuration: ${errorMessage}`,
    };
  }
}

/**
 * Initialize scheduler on server startup
 */
export function initializeAlertScheduler(): void {
  // Check if scheduler should be auto-started
  const autoStart = process.env.ALERT_SCHEDULER_AUTO_START !== "false";

  if (autoStart) {
    const result = startAlertScheduler();
    if (result.success) {
      console.log("[AlertScheduler] Auto-started on server initialization");
    } else {
      console.warn("[AlertScheduler] Failed to auto-start:", result.message);
    }
  }
}

/**
 * Cleanup scheduler on server shutdown
 */
export function cleanupAlertScheduler(): void {
  if (scheduler) {
    stopAlertScheduler();
    console.log("[AlertScheduler] Cleaned up on server shutdown");
  }
}
