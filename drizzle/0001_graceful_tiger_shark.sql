CREATE TABLE `collection_items` (
	`owner` text NOT NULL,
	`collection_id` text NOT NULL,
	`look_id` text NOT NULL,
	PRIMARY KEY(`owner`, `collection_id`, `look_id`)
);
--> statement-breakpoint
CREATE INDEX `idx_collection_items_owner_look` ON `collection_items` (`owner`,`look_id`);--> statement-breakpoint
CREATE TABLE `collections` (
	`owner` text NOT NULL,
	`id` text NOT NULL,
	`name` text NOT NULL,
	`created_at` integer NOT NULL,
	PRIMARY KEY(`owner`, `id`)
);
