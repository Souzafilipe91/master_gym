CREATE TABLE `cardio_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`cardioDate` date NOT NULL,
	`duration` int NOT NULL,
	`type` varchar(100) NOT NULL,
	`intensity` varchar(50),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `cardio_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cardio_recommendations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cycleId` int NOT NULL,
	`frequency` varchar(100) NOT NULL,
	`duration` varchar(100) NOT NULL,
	`intensity` varchar(100) NOT NULL,
	`timing` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `cardio_recommendations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cycles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cycleNumber` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`startWeek` int NOT NULL,
	`endWeek` int NOT NULL,
	`objective` text NOT NULL,
	`focus` varchar(255) NOT NULL,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `cycles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `exercise_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workoutLogId` int NOT NULL,
	`exerciseId` int NOT NULL,
	`setNumber` int NOT NULL,
	`reps` int NOT NULL,
	`load` decimal(6,2) NOT NULL,
	`completed` boolean NOT NULL DEFAULT true,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `exercise_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `exercises` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`muscleGroupId` int NOT NULL,
	`description` text,
	`videoUrl` varchar(512),
	`imageUrl` varchar(512),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `exercises_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `muscle_groups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `muscle_groups_id` PRIMARY KEY(`id`),
	CONSTRAINT `muscle_groups_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `weight_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`weight` decimal(5,2) NOT NULL,
	`logDate` date NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `weight_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workout_exercises` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cycleId` int NOT NULL,
	`workoutTypeId` int NOT NULL,
	`exerciseId` int NOT NULL,
	`orderIndex` int NOT NULL,
	`sets` int NOT NULL,
	`reps` varchar(100) NOT NULL,
	`initialLoad` decimal(6,2) NOT NULL,
	`loadProgression` decimal(5,2) NOT NULL,
	`technique` varchar(255),
	`restTime` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `workout_exercises_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workout_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`workoutTypeId` int NOT NULL,
	`cycleId` int NOT NULL,
	`workoutDate` date NOT NULL,
	`completed` boolean NOT NULL DEFAULT false,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `workout_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workout_types` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(10) NOT NULL,
	`name` varchar(255) NOT NULL,
	`duration` int NOT NULL,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `workout_types_id` PRIMARY KEY(`id`),
	CONSTRAINT `workout_types_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `currentWeight` decimal(5,2);