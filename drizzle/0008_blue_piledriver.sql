ALTER TABLE `experiences` ADD `cover_id` integer REFERENCES media(id);--> statement-breakpoint
ALTER TABLE `projects` ADD `logo_id` integer REFERENCES media(id);