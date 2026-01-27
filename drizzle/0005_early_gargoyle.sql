ALTER TABLE `achievements` MODIFY COLUMN `name` varchar(100) NOT NULL;--> statement-breakpoint
ALTER TABLE `achievements` MODIFY COLUMN `icon` varchar(50) NOT NULL;--> statement-breakpoint
ALTER TABLE `achievements` MODIFY COLUMN `category` enum('frequency','milestone','pr','streak') NOT NULL;--> statement-breakpoint
ALTER TABLE `achievements` MODIFY COLUMN `requirement` int NOT NULL;--> statement-breakpoint
ALTER TABLE `achievements` ADD `code` varchar(50) NOT NULL;--> statement-breakpoint
ALTER TABLE `achievements` ADD CONSTRAINT `achievements_code_unique` UNIQUE(`code`);