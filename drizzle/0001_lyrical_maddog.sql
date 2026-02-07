CREATE TABLE `agentCommunications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`fromAgentId` int NOT NULL,
	`toAgentId` int,
	`messageType` enum('instruction','status_update','discussion','planning','result') NOT NULL,
	`subject` varchar(255),
	`content` text NOT NULL,
	`relatedTaskId` int,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `agentCommunications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `agents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`type` enum('commander','sub_agent') NOT NULL,
	`personality` text,
	`status` enum('active','idle','processing','offline') NOT NULL DEFAULT 'idle',
	`currentActivity` text,
	`nextHeartbeat` timestamp,
	`bandwidth` int DEFAULT 100,
	`lastHeartbeat` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `agents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `apiMetrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`agentId` int,
	`apiName` varchar(255) NOT NULL,
	`endpoint` varchar(255),
	`requestCount` int DEFAULT 1,
	`cost` decimal(10,4) NOT NULL,
	`inputTokens` int,
	`outputTokens` int,
	`responseTime` int,
	`status` varchar(50),
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `apiMetrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `budgetAlerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`dailyBudget` decimal(10,2),
	`monthlyBudget` decimal(10,2),
	`alertThreshold` int DEFAULT 80,
	`isActive` boolean DEFAULT true,
	`lastAlertSent` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `budgetAlerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cronJobs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`agentId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`schedule` varchar(100) NOT NULL,
	`skillName` varchar(255),
	`skillConfig` json,
	`isActive` boolean DEFAULT true,
	`lastExecution` timestamp,
	`nextExecution` timestamp,
	`executionCount` int DEFAULT 0,
	`lastResult` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cronJobs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`agentId` int,
	`fileName` varchar(255) NOT NULL,
	`fileSize` int,
	`fileUrl` text,
	`mimeType` varchar(100),
	`pageCount` int,
	`processingStatus` enum('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
	`processingProgress` int DEFAULT 0,
	`extractedText` text,
	`metadata` json,
	`uploadedAt` timestamp NOT NULL DEFAULT (now()),
	`processedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`agentId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`status` enum('queued','in_progress','completed','failed') NOT NULL,
	`priority` int DEFAULT 0,
	`momentumScore` decimal(5,2) DEFAULT '0',
	`estimatedDuration` int,
	`actualDuration` int,
	`details` json,
	`result` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`startedAt` timestamp,
	`completedAt` timestamp,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `useCaseSuggestions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`agentId` int NOT NULL,
	`source` varchar(100) NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`relevanceScore` decimal(5,2),
	`snapshot` text,
	`businessApplicability` text,
	`status` enum('suggested','reviewed','deployed','dismissed') NOT NULL DEFAULT 'suggested',
	`deployedTaskId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `useCaseSuggestions_id` PRIMARY KEY(`id`)
);
