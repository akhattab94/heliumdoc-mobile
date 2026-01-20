ALTER TABLE `appointments` MODIFY COLUMN `consultationFee` int NOT NULL;--> statement-breakpoint
ALTER TABLE `appointments` MODIFY COLUMN `serviceFee` int DEFAULT 25;--> statement-breakpoint
ALTER TABLE `appointments` MODIFY COLUMN `totalAmount` int NOT NULL;--> statement-breakpoint
ALTER TABLE `doctors` MODIFY COLUMN `consultationFee` int NOT NULL;--> statement-breakpoint
ALTER TABLE `doctors` MODIFY COLUMN `videoConsultationFee` int;--> statement-breakpoint
ALTER TABLE `doctors` MODIFY COLUMN `rating` int;--> statement-breakpoint
ALTER TABLE `doctors` MODIFY COLUMN `rating` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `doctors` MODIFY COLUMN `languages` text;--> statement-breakpoint
ALTER TABLE `doctors` MODIFY COLUMN `education` text;--> statement-breakpoint
ALTER TABLE `hospitals` MODIFY COLUMN `latitude` varchar(20);--> statement-breakpoint
ALTER TABLE `hospitals` MODIFY COLUMN `longitude` varchar(20);--> statement-breakpoint
ALTER TABLE `loyaltyTiers` MODIFY COLUMN `pointsMultiplier` int NOT NULL DEFAULT 100;--> statement-breakpoint
ALTER TABLE `loyaltyTiers` MODIFY COLUMN `benefits` text;--> statement-breakpoint
ALTER TABLE `medicalHistory` MODIFY COLUMN `conditions` text;--> statement-breakpoint
ALTER TABLE `medicalHistory` MODIFY COLUMN `allergies` text;--> statement-breakpoint
ALTER TABLE `medicalHistory` MODIFY COLUMN `medications` text;--> statement-breakpoint
ALTER TABLE `notifications` MODIFY COLUMN `data` text;--> statement-breakpoint
ALTER TABLE `symptomSessions` MODIFY COLUMN `symptoms` text NOT NULL;--> statement-breakpoint
ALTER TABLE `symptomSessions` MODIFY COLUMN `analysisResult` text;--> statement-breakpoint
ALTER TABLE `medicalHistory` ADD CONSTRAINT `medicalHistory_userId_unique` UNIQUE(`userId`);