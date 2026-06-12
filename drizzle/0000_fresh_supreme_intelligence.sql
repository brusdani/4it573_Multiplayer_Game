CREATE TABLE `matches` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`player1_nickname` text NOT NULL,
	`player2_nickname` text NOT NULL,
	`player1_score` integer NOT NULL,
	`player2_score` integer NOT NULL,
	`winner_nickname` text,
	`played_at` integer NOT NULL
);
