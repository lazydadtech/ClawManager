CREATE TABLE `agentMetrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agentId` int NOT NULL,
	`userId` int NOT NULL,
	`cpuUsage` int,
	`memoryUsage` int,
	`uptime` int,
	`uptimePercentage` int,
	`requestsProcessed` int DEFAULT 0,
	`requestsFailed` int DEFAULT 0,
	`averageLatency` int,
	`errorRate` int,
	`queueDepth` int DEFAULT 0,
	`lastUpdate` timestamp DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `agentMetrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `alertHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`alertId` int NOT NULL,
	`action` enum('created','acknowledged','resolved','email_sent','escalated') NOT NULL,
	`performedBy` int,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `alertHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`agentId` int,
	`alertType` enum('agent_down','high_error_rate','high_cpu','high_memory','connection_lost') NOT NULL,
	`severity` enum('critical','warning','info') NOT NULL,
	`title` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`status` enum('active','acknowledged','resolved') NOT NULL DEFAULT 'active',
	`acknowledgedAt` timestamp,
	`acknowledgedBy` int,
	`resolvedAt` timestamp,
	`emailSent` boolean DEFAULT false,
	`emailSentAt` timestamp,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `alerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `apiConfigurations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`apiEndpoint` text NOT NULL,
	`authMethod` enum('api_key','oauth','bearer_token') NOT NULL,
	`apiKey` text,
	`bearerToken` text,
	`oauthClientId` varchar(255),
	`oauthClientSecret` text,
	`pollingInterval` int DEFAULT 5000,
	`connectionType` enum('websocket','sse','http_polling') DEFAULT 'http_polling',
	`isActive` boolean DEFAULT true,
	`lastTestedAt` timestamp,
	`testStatus` enum('success','failed','pending'),
	`testError` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `apiConfigurations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `monitoringConfigurations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`enableRealTimeAlerts` boolean DEFAULT true,
	`enableEmailNotifications` boolean DEFAULT true,
	`emailForCriticalAlerts` varchar(320),
	`emailForWarningAlerts` varchar(320),
	`criticalErrorRateThreshold` int DEFAULT 10,
	`warningErrorRateThreshold` int DEFAULT 5,
	`criticalCpuThreshold` int DEFAULT 90,
	`warningCpuThreshold` int DEFAULT 75,
	`criticalMemoryThreshold` int DEFAULT 90,
	`warningMemoryThreshold` int DEFAULT 75,
	`agentDownTimeout` int DEFAULT 60000,
	`metricsRetentionDays` int DEFAULT 7,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `monitoringConfigurations_id` PRIMARY KEY(`id`),
	CONSTRAINT `monitoringConfigurations_userId_unique` UNIQUE(`userId`)
);
