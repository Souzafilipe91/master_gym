CREATE TABLE `saved_ai_workouts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('calistenia','copied') NOT NULL,
	`title` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`athleteName` varchar(255),
	`videoUrl` varchar(512),
	`videoAnalysis` text,
	`focus` varchar(100),
	`duration` int,
	`difficulty` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `saved_ai_workouts_id` PRIMARY KEY(`id`)
);
