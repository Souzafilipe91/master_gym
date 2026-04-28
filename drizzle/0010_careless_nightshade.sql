CREATE TABLE `food_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`date` varchar(10) NOT NULL,
	`meal` enum('cafe_manha','lanche_manha','almoco','lanche_tarde','jantar','ceia') NOT NULL DEFAULT 'almoco',
	`name` varchar(255) NOT NULL,
	`calories` int NOT NULL DEFAULT 0,
	`protein` decimal(6,1) NOT NULL DEFAULT '0',
	`carbs` decimal(6,1) NOT NULL DEFAULT '0',
	`fat` decimal(6,1) NOT NULL DEFAULT '0',
	`quantity` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `food_logs_id` PRIMARY KEY(`id`)
);
