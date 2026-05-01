CREATE TABLE `emailTemplates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`templateType` enum('agent_failure','agent_recovery','budget_warning','budget_critical','high_error_rate','high_cpu','high_memory','daily_digest','weekly_digest') NOT NULL,
	`subject` varchar(255) NOT NULL,
	`htmlBody` text NOT NULL,
	`plainTextBody` text,
	`variables` json,
	`isCustom` boolean DEFAULT false,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `emailTemplates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notificationHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`notificationId` int NOT NULL,
	`event` enum('created','sent','failed','retried','bounced','opened','clicked') NOT NULL,
	`details` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notificationHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notificationPreferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`email` varchar(320) NOT NULL,
	`emailVerified` boolean DEFAULT false,
	`emailVerificationToken` varchar(255),
	`emailVerificationExpires` timestamp,
	`agentFailureAlerts` boolean DEFAULT true,
	`budgetWarningAlerts` boolean DEFAULT true,
	`budgetCriticalAlerts` boolean DEFAULT true,
	`highErrorRateAlerts` boolean DEFAULT true,
	`highCpuAlerts` boolean DEFAULT true,
	`highMemoryAlerts` boolean DEFAULT true,
	`notificationFrequency` enum('immediate','daily_digest','weekly_digest') DEFAULT 'immediate',
	`quietHoursStart` varchar(5),
	`quietHoursEnd` varchar(5),
	`timezone` varchar(50) DEFAULT 'UTC',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `notificationPreferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `notificationPreferences_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`notificationType` enum('agent_failure','agent_recovery','budget_warning','budget_critical','high_error_rate','high_cpu','high_memory','connection_lost','daily_digest','weekly_digest') NOT NULL,
	`severity` enum('critical','warning','info') NOT NULL,
	`title` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`relatedAlertId` int,
	`relatedAgentId` int,
	`recipientEmail` varchar(320) NOT NULL,
	`status` enum('pending','sent','failed','bounced') DEFAULT 'pending',
	`sentAt` timestamp,
	`failureReason` text,
	`retryCount` int DEFAULT 0,
	`lastRetryAt` timestamp,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
