/**
 * Email template rendering and management
 */

export interface TemplateVariables {
  [key: string]: string | number | boolean | Date;
}

/**
 * Default email templates for different notification types
 * Uses [VAR_NAME] syntax to avoid TypeScript template literal interpretation
 */
export const DEFAULT_TEMPLATES: Record<string, { subject: string; htmlBody: string; plainTextBody: string }> = {
  agent_failure: {
    subject: "🚨 Critical Alert: Agent [agentName] Failed",
    htmlBody: `<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333;">
<div style="max-width: 600px; margin: 0 auto; padding: 20px;">
<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
<h1 style="margin: 0; font-size: 24px;">🚨 Critical Agent Failure</h1>
</div>
<div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
<h2 style="margin-top: 0;">Agent Status</h2>
<p><strong>Agent Name:</strong> [agentName]</p>
<p><strong>Status:</strong> <span style="color: #e74c3c; font-weight: bold;">FAILED</span></p>
<p><strong>Failure Time:</strong> [failureTime]</p>
<p><strong>Error Message:</strong> [errorMessage]</p>
</div>
<div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin-bottom: 20px; border-radius: 4px;">
<p style="margin: 0;"><strong>⚠️ Recommended Action:</strong> Please investigate the agent immediately and take corrective action.</p>
</div>
<div style="text-align: center; padding-top: 20px; border-top: 1px solid #ddd;">
<p style="color: #999; font-size: 12px;">This is an automated alert from OpenClaw Mission Control. Do not reply to this email.</p>
</div>
</div>
</body>
</html>`,
    plainTextBody: `CRITICAL AGENT FAILURE

Agent Name: [agentName]
Status: FAILED
Failure Time: [failureTime]
Error Message: [errorMessage]

⚠️ Recommended Action: Please investigate the agent immediately and take corrective action.

---
This is an automated alert from OpenClaw Mission Control. Do not reply to this email.`,
  },

  agent_recovery: {
    subject: "✅ Agent [agentName] Recovered",
    htmlBody: `<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333;">
<div style="max-width: 600px; margin: 0 auto; padding: 20px;">
<div style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
<h1 style="margin: 0; font-size: 24px;">✅ Agent Recovered</h1>
</div>
<div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
<h2 style="margin-top: 0;">Agent Status</h2>
<p><strong>Agent Name:</strong> [agentName]</p>
<p><strong>Status:</strong> <span style="color: #27ae60; font-weight: bold;">ACTIVE</span></p>
<p><strong>Recovery Time:</strong> [recoveryTime]</p>
<p><strong>Downtime Duration:</strong> [downtimeDuration]</p>
</div>
<div style="background: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin-bottom: 20px; border-radius: 4px;">
<p style="margin: 0;"><strong>✓ Status:</strong> The agent is now online and operational.</p>
</div>
<div style="text-align: center; padding-top: 20px; border-top: 1px solid #ddd;">
<p style="color: #999; font-size: 12px;">This is an automated alert from OpenClaw Mission Control. Do not reply to this email.</p>
</div>
</div>
</body>
</html>`,
    plainTextBody: `AGENT RECOVERED

Agent Name: [agentName]
Status: ACTIVE
Recovery Time: [recoveryTime]
Downtime Duration: [downtimeDuration]

✓ Status: The agent is now online and operational.

---
This is an automated alert from OpenClaw Mission Control. Do not reply to this email.`,
  },

  budget_warning: {
    subject: "⚠️ Budget Warning: [percentage]% of Monthly Budget Used",
    htmlBody: `<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333;">
<div style="max-width: 600px; margin: 0 auto; padding: 20px;">
<div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
<h1 style="margin: 0; font-size: 24px;">⚠️ Budget Warning</h1>
</div>
<div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
<h2 style="margin-top: 0;">Budget Status</h2>
<p><strong>Monthly Budget:</strong> $[monthlyBudget]</p>
<p><strong>Amount Used:</strong> $[amountUsed]</p>
<p><strong>Percentage Used:</strong> [percentage]%</p>
<p><strong>Remaining Budget:</strong> $[remainingBudget]</p>
</div>
<div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin-bottom: 20px; border-radius: 4px;">
<p style="margin: 0;"><strong>⚠️ Action Required:</strong> You have used [percentage]% of your monthly budget. Consider reviewing your spending or adjusting your budget limits.</p>
</div>
<div style="text-align: center; padding-top: 20px; border-top: 1px solid #ddd;">
<p style="color: #999; font-size: 12px;">This is an automated alert from OpenClaw Mission Control. Do not reply to this email.</p>
</div>
</div>
</body>
</html>`,
    plainTextBody: `BUDGET WARNING

Monthly Budget: $[monthlyBudget]
Amount Used: $[amountUsed]
Percentage Used: [percentage]%
Remaining Budget: $[remainingBudget]

⚠️ Action Required: You have used [percentage]% of your monthly budget. Consider reviewing your spending or adjusting your budget limits.

---
This is an automated alert from OpenClaw Mission Control. Do not reply to this email.`,
  },

  budget_critical: {
    subject: "🚨 Critical: Monthly Budget Exceeded",
    htmlBody: `<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333;">
<div style="max-width: 600px; margin: 0 auto; padding: 20px;">
<div style="background: linear-gradient(135deg, #eb3349 0%, #f45c43 100%); color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
<h1 style="margin: 0; font-size: 24px;">🚨 Budget Limit Exceeded</h1>
</div>
<div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
<h2 style="margin-top: 0;">Budget Status</h2>
<p><strong>Monthly Budget:</strong> $[monthlyBudget]</p>
<p><strong>Amount Used:</strong> $[amountUsed]</p>
<p><strong>Overage Amount:</strong> $[overageAmount]</p>
</div>
<div style="background: #f8d7da; border-left: 4px solid #dc3545; padding: 15px; margin-bottom: 20px; border-radius: 4px;">
<p style="margin: 0;"><strong>🚨 Immediate Action Required:</strong> Your monthly budget has been exceeded. Please review your spending immediately and take corrective action to prevent further overages.</p>
</div>
<div style="text-align: center; padding-top: 20px; border-top: 1px solid #ddd;">
<p style="color: #999; font-size: 12px;">This is an automated alert from OpenClaw Mission Control. Do not reply to this email.</p>
</div>
</div>
</body>
</html>`,
    plainTextBody: `BUDGET LIMIT EXCEEDED

Monthly Budget: $[monthlyBudget]
Amount Used: $[amountUsed]
Overage Amount: $[overageAmount]

🚨 Immediate Action Required: Your monthly budget has been exceeded. Please review your spending immediately and take corrective action to prevent further overages.

---
This is an automated alert from OpenClaw Mission Control. Do not reply to this email.`,
  },
};

/**
 * Render template with variables using [VAR_NAME] syntax
 */
export function renderTemplate(template: string, variables: TemplateVariables): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = new RegExp(`\\[${key}\\]`, "g");
    result = result.replace(placeholder, String(value));
  }
  return result;
}

/**
 * Get default template for notification type
 */
export function getDefaultTemplate(templateType: string): { subject: string; htmlBody: string; plainTextBody: string } | null {
  const template = DEFAULT_TEMPLATES[templateType];
  return template || null;
}

/**
 * Extract template variables from template string
 */
export function extractTemplateVariables(template: string): string[] {
  const regex = /\[(\w+)\]/g;
  const variables: string[] = [];
  let match;
  while ((match = regex.exec(template)) !== null) {
    if (!variables.includes(match[1])) {
      variables.push(match[1]);
    }
  }
  return variables;
}

/**
 * Validate template variables
 */
export function validateTemplateVariables(
  template: string,
  providedVariables: TemplateVariables
): { valid: boolean; missingVariables: string[] } {
  const requiredVariables = extractTemplateVariables(template);
  const missingVariables = requiredVariables.filter((v) => !(v in providedVariables));
  return {
    valid: missingVariables.length === 0,
    missingVariables,
  };
}
