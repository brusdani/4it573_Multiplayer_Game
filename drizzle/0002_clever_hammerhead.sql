ALTER TABLE `matches` ADD `player1_user_id` integer REFERENCES users(id);--> statement-breakpoint
ALTER TABLE `matches` ADD `player2_user_id` integer REFERENCES users(id);--> statement-breakpoint
ALTER TABLE `matches` ADD `winner_user_id` integer REFERENCES users(id);