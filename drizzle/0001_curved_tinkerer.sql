ALTER TABLE `appointments` ADD `paymentStatus` enum('pending','paid','refunded','failed') DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE `appointments` ADD `paymentId` varchar(100);