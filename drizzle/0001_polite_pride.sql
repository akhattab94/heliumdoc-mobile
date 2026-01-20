CREATE TABLE `appointments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`doctorId` int NOT NULL,
	`hospitalId` int NOT NULL,
	`appointmentDate` timestamp NOT NULL,
	`startTime` varchar(5) NOT NULL,
	`endTime` varchar(5) NOT NULL,
	`consultationType` enum('clinic','video') NOT NULL DEFAULT 'clinic',
	`status` enum('pending','confirmed','completed','cancelled','no_show') NOT NULL DEFAULT 'pending',
	`consultationFee` decimal(10,2) NOT NULL,
	`serviceFee` decimal(10,2) DEFAULT '25.00',
	`totalAmount` decimal(10,2) NOT NULL,
	`notes` text,
	`cancelReason` text,
	`videoCallUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `appointments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `doctorSchedules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`doctorId` int NOT NULL,
	`dayOfWeek` int NOT NULL,
	`startTime` varchar(5) NOT NULL,
	`endTime` varchar(5) NOT NULL,
	`slotDuration` int NOT NULL DEFAULT 30,
	`isActive` boolean NOT NULL DEFAULT true,
	CONSTRAINT `doctorSchedules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `doctors` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`hospitalId` int NOT NULL,
	`specialtyId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`nameAr` varchar(255),
	`title` varchar(100),
	`bio` text,
	`photoUrl` text,
	`experience` int,
	`consultationFee` decimal(10,2) NOT NULL,
	`videoConsultationFee` decimal(10,2),
	`videoConsultEnabled` boolean NOT NULL DEFAULT false,
	`rating` decimal(3,2) DEFAULT '0.00',
	`totalReviews` int DEFAULT 0,
	`totalPatients` int DEFAULT 0,
	`languages` json DEFAULT ('[]'),
	`education` json DEFAULT ('[]'),
	`isActive` boolean NOT NULL DEFAULT true,
	`isVerified` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `doctors_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `hospitals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`nameAr` varchar(255),
	`address` text,
	`city` varchar(100),
	`phone` varchar(20),
	`email` varchar(320),
	`logoUrl` text,
	`latitude` decimal(10,8),
	`longitude` decimal(11,8),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `hospitals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `loyaltyTiers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(50) NOT NULL,
	`minPoints` int NOT NULL,
	`maxPoints` int NOT NULL,
	`pointsMultiplier` decimal(3,2) NOT NULL DEFAULT '1.00',
	`color` varchar(7),
	`benefits` json DEFAULT ('[]'),
	`isActive` boolean NOT NULL DEFAULT true,
	CONSTRAINT `loyaltyTiers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `loyaltyTransactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('earn','redeem','expire','adjust') NOT NULL,
	`points` int NOT NULL,
	`description` varchar(255) NOT NULL,
	`referenceType` varchar(50),
	`referenceId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `loyaltyTransactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `medicalHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`conditions` json DEFAULT ('[]'),
	`allergies` json DEFAULT ('[]'),
	`medications` json DEFAULT ('[]'),
	`bloodType` varchar(5),
	`emergencyContact` varchar(100),
	`emergencyPhone` varchar(20),
	`insuranceProvider` varchar(100),
	`insurancePolicyNumber` varchar(50),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `medicalHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` varchar(50) NOT NULL,
	`title` varchar(255) NOT NULL,
	`body` text,
	`data` json,
	`isRead` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `referrals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`patientId` int NOT NULL,
	`fromDoctorId` int NOT NULL,
	`toDoctorId` int NOT NULL,
	`fromHospitalId` int NOT NULL,
	`toHospitalId` int NOT NULL,
	`specialtyId` int NOT NULL,
	`urgency` enum('routine','urgent','emergency') NOT NULL DEFAULT 'routine',
	`status` enum('pending','accepted','completed','cancelled','expired') NOT NULL DEFAULT 'pending',
	`reason` text NOT NULL,
	`notes` text,
	`appointmentId` int,
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `referrals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`doctorId` int NOT NULL,
	`appointmentId` int,
	`rating` int NOT NULL,
	`comment` text,
	`isVerified` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rewards` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`pointsCost` int NOT NULL,
	`category` varchar(50),
	`icon` varchar(50),
	`validDays` int DEFAULT 30,
	`maxRedemptions` int,
	`currentRedemptions` int DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rewards_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `specialties` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`nameAr` varchar(100),
	`icon` varchar(50),
	`description` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `specialties_id` PRIMARY KEY(`id`),
	CONSTRAINT `specialties_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `symptomSessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`symptoms` json NOT NULL,
	`age` int,
	`gender` varchar(10),
	`analysisResult` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `symptomSessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userLoyalty` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`totalPoints` int NOT NULL DEFAULT 0,
	`lifetimePoints` int NOT NULL DEFAULT 0,
	`tierId` int NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userLoyalty_id` PRIMARY KEY(`id`),
	CONSTRAINT `userLoyalty_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `userRewards` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`rewardId` int NOT NULL,
	`transactionId` int NOT NULL,
	`code` varchar(20) NOT NULL,
	`status` enum('active','used','expired') NOT NULL DEFAULT 'active',
	`expiresAt` timestamp NOT NULL,
	`usedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `userRewards_id` PRIMARY KEY(`id`),
	CONSTRAINT `userRewards_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `phone` varchar(20);--> statement-breakpoint
ALTER TABLE `users` ADD `dateOfBirth` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `gender` enum('male','female','other');--> statement-breakpoint
ALTER TABLE `users` ADD `avatarUrl` text;