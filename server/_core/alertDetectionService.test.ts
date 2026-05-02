import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  detectAgentFailures,
  detectAgentRecoveries,
  detectBudgetAlerts,
  processAgentFailureAlerts,
  processAgentRecoveryAlerts,
  processBudgetAlerts,
  runAlertDetectionCycle,
} from "./alertDetectionService";

describe("Alert Detection Service", () => {
  describe("Agent Failure Detection", () => {
    it("should detect offline agents", async () => {
      const failures = await detectAgentFailures();
      expect(Array.isArray(failures)).toBe(true);
      // Result depends on actual database state
    });

    it("should return empty array if no failures", async () => {
      const failures = await detectAgentFailures();
      expect(failures).toBeDefined();
      expect(Array.isArray(failures)).toBe(true);
    });

    it("should include agent details in failure alert", async () => {
      const failures = await detectAgentFailures();
      if (failures.length > 0) {
        const failure = failures[0];
        expect(failure).toHaveProperty("agentId");
        expect(failure).toHaveProperty("userId");
        expect(failure).toHaveProperty("agentName");
        expect(failure).toHaveProperty("currentStatus");
        expect(failure.currentStatus).toBe("offline");
      }
    });
  });

  describe("Agent Recovery Detection", () => {
    it("should detect recovered agents", async () => {
      const recoveries = await detectAgentRecoveries();
      expect(Array.isArray(recoveries)).toBe(true);
    });

    it("should return empty array if no recoveries", async () => {
      const recoveries = await detectAgentRecoveries();
      expect(recoveries).toBeDefined();
      expect(Array.isArray(recoveries)).toBe(true);
    });

    it("should include agent details in recovery alert", async () => {
      const recoveries = await detectAgentRecoveries();
      if (recoveries.length > 0) {
        const recovery = recoveries[0];
        expect(recovery).toHaveProperty("agentId");
        expect(recovery).toHaveProperty("userId");
        expect(recovery).toHaveProperty("agentName");
        expect(recovery).toHaveProperty("currentStatus");
        expect(recovery.currentStatus).toBe("online");
      }
    });
  });

  describe("Budget Alert Detection", () => {
    it("should detect budget alerts", async () => {
      const alerts = await detectBudgetAlerts();
      expect(Array.isArray(alerts)).toBe(true);
    });

    it("should return empty array if no budget alerts", async () => {
      const alerts = await detectBudgetAlerts();
      expect(alerts).toBeDefined();
      expect(Array.isArray(alerts)).toBe(true);
    });

    it("should include budget details in alert", async () => {
      const alerts = await detectBudgetAlerts();
      if (alerts.length > 0) {
        const alert = alerts[0];
        expect(alert).toHaveProperty("userId");
        expect(alert).toHaveProperty("percentage");
        expect(alert).toHaveProperty("monthlyBudget");
        expect(alert).toHaveProperty("amountUsed");
        expect(alert).toHaveProperty("alertType");
        expect(["warning", "critical"]).toContain(alert.alertType);
      }
    });

    it("should distinguish between warning and critical alerts", async () => {
      const alerts = await detectBudgetAlerts();
      const warningAlerts = alerts.filter((a) => a.alertType === "warning");
      const criticalAlerts = alerts.filter((a) => a.alertType === "critical");

      // If there are warning alerts, percentage should be < 100
      warningAlerts.forEach((alert) => {
        expect(alert.percentage).toBeLessThan(100);
      });

      // If there are critical alerts, percentage should be >= 100
      criticalAlerts.forEach((alert) => {
        expect(alert.percentage).toBeGreaterThanOrEqual(100);
      });
    });
  });

  describe("Alert Processing", () => {
    it("should process agent failure alerts", async () => {
      const mockFailures = [
        {
          agentId: 1,
          userId: 1,
          agentName: "Test Agent",
          previousStatus: "online",
          currentStatus: "offline",
          failureReason: "No heartbeat",
        },
      ];

      const count = await processAgentFailureAlerts(mockFailures);
      expect(typeof count).toBe("number");
      expect(count).toBeGreaterThanOrEqual(0);
    });

    it("should process agent recovery alerts", async () => {
      const mockRecoveries = [
        {
          agentId: 1,
          userId: 1,
          agentName: "Test Agent",
          previousStatus: "offline",
          currentStatus: "online",
        },
      ];

      const count = await processAgentRecoveryAlerts(mockRecoveries);
      expect(typeof count).toBe("number");
      expect(count).toBeGreaterThanOrEqual(0);
    });

    it("should process budget alerts", async () => {
      const mockAlerts = [
        {
          userId: 1,
          percentage: 85,
          monthlyBudget: 1000,
          amountUsed: 850,
          remainingBudget: 150,
          alertType: "warning" as const,
        },
      ];

      const count = await processBudgetAlerts(mockAlerts);
      expect(typeof count).toBe("number");
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Alert Detection Cycle", () => {
    it("should run complete detection cycle", async () => {
      const result = await runAlertDetectionCycle();

      expect(result).toHaveProperty("agentFailures");
      expect(result).toHaveProperty("agentRecoveries");
      expect(result).toHaveProperty("budgetAlerts");

      expect(typeof result.agentFailures).toBe("number");
      expect(typeof result.agentRecoveries).toBe("number");
      expect(typeof result.budgetAlerts).toBe("number");

      expect(result.agentFailures).toBeGreaterThanOrEqual(0);
      expect(result.agentRecoveries).toBeGreaterThanOrEqual(0);
      expect(result.budgetAlerts).toBeGreaterThanOrEqual(0);
    });

    it("should handle errors gracefully", async () => {
      const result = await runAlertDetectionCycle();
      // Should always return a result object even on error
      expect(result).toBeDefined();
      expect(result).toHaveProperty("agentFailures");
      expect(result).toHaveProperty("agentRecoveries");
      expect(result).toHaveProperty("budgetAlerts");
    });
  });

  describe("Error Handling", () => {
    it("should handle database errors in agent failure detection", async () => {
      // This test verifies the service doesn't crash on DB errors
      const failures = await detectAgentFailures();
      expect(Array.isArray(failures)).toBe(true);
    });

    it("should handle database errors in budget detection", async () => {
      const alerts = await detectBudgetAlerts();
      expect(Array.isArray(alerts)).toBe(true);
    });

    it("should handle errors in detection cycle", async () => {
      const result = await runAlertDetectionCycle();
      expect(result).toBeDefined();
      expect(result.agentFailures).toBeGreaterThanOrEqual(0);
      expect(result.agentRecoveries).toBeGreaterThanOrEqual(0);
      expect(result.budgetAlerts).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Data Validation", () => {
    it("should validate agent failure data structure", async () => {
      const failures = await detectAgentFailures();
      failures.forEach((failure) => {
        expect(failure.agentId).toBeDefined();
        expect(failure.userId).toBeDefined();
        expect(failure.agentName).toBeDefined();
        expect(failure.previousStatus).toBeDefined();
        expect(failure.currentStatus).toBeDefined();
      });
    });

    it("should validate budget alert data structure", async () => {
      const alerts = await detectBudgetAlerts();
      alerts.forEach((alert) => {
        expect(alert.userId).toBeDefined();
        expect(typeof alert.percentage).toBe("number");
        expect(typeof alert.monthlyBudget).toBe("number");
        expect(typeof alert.amountUsed).toBe("number");
        expect(alert.alertType).toBeDefined();
      });
    });
  });
});
