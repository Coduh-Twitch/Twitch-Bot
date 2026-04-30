
import { integer, sqliteTable, text,  } from 'drizzle-orm/sqlite-core';

export enum DBRoles {
	MOD,
	VIP,
	SUBSCRIBER,
	DEFAULT
}

export interface DBAccount {
	id: string;
	user_id: string;
	username: string;
	avatar_url: string;
}

export interface DBSession {
	id?: string;
	user_id: string;
	access_token: string;
	refresh_token: string;
	expires_at: number;
}

export interface DBQueue {
	id: string;
	game: string;
	createdByUserId: string;
	maximumRosterSize: number;
	membersPerRound: number;
}

export interface DBParticipant {
	primaryId: string;
	id: string;
	queueId: string;
	avatar_url: string;
	username: string;
	role: DBRoles;
	position: number;
}

export const queues = sqliteTable("queues", {
	id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()).notNull(),

	game: text("game").notNull().default("Miscellaneous"),
	createdByUserId: text("createdByUserId").notNull(),
	maximumRosterSize: integer("maximumRosterSize").notNull().default(24),
	membersPerRound: integer("membersPerRound").notNull().default(8)
})

export const participants = sqliteTable("participants", {
	primaryId: text("primaryId").notNull().primaryKey().$defaultFn(() => crypto.randomUUID()),
	id: text("id").notNull(),
	queueId: text("queueId").notNull(),
	role: integer("role").notNull().default(3),
	avatar_url: text("avatar_url").notNull(),
	username: text("username").notNull(),
	position: integer("position").notNull().default(100)
})

export const banned_users = sqliteTable("banned_users", {
	primaryId: text("primaryId").notNull().primaryKey().$defaultFn(() => crypto.randomUUID()),
	id: text("id").notNull()
})
