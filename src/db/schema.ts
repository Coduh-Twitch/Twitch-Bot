import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export enum DBRoles {
  MOD,
  VIP,
  SUBSCRIBER,
  DEFAULT,
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

export interface DBRaffle {
  id: string;
  creator_id: string;
  expires_at: number;
  points: number;
  winner_id: string;
}

export interface DBRaffleParticipant {
  id: string;
  raffle_id: string;
}

export const queues = sqliteTable("queues", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID())
    .notNull(),

  game: text("game").notNull().default("Miscellaneous"),
  createdByUserId: text("createdByUserId").notNull(),
  maximumRosterSize: integer("maximumRosterSize").notNull().default(24),
  membersPerRound: integer("membersPerRound").notNull().default(8),
});

export const participants = sqliteTable("participants", {
  primaryId: text("primaryId")
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  id: text("id").notNull(),
  queueId: text("queueId").notNull(),
  role: integer("role").notNull().default(3),
  avatar_url: text("avatar_url").notNull(),
  username: text("username").notNull(),
  position: integer("position").notNull().default(100),
});

export const banned_users = sqliteTable("banned_users", {
  primaryId: text("primaryId")
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  id: text("id").notNull(),
});

export const raffles = sqliteTable("raffles", {
  id: text("id")
    .notNull()
    .$defaultFn(() => crypto.randomUUID()),
  creator_id: text("creator_id").notNull(),
  expires_at: integer("expires_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date(Date.now() + 60e3)),
  points: integer("points").notNull().default(1000),
  winner_id: text("winner_id").default(null),
});

export const raffle_participants = sqliteTable("raffle_participants", {
  id: text("id").notNull().primaryKey(),
  raffle_id: text("raffle_id").notNull(),
});

export const timer = sqliteTable("timer", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID())
    .notNull(),
  seconds: integer("seconds").notNull().default(0),
  started_at: integer("started_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
  visible: integer("visible", { mode: "boolean" }).notNull().default(false),
  paused: integer("paused", { mode: "boolean" }).notNull().default(false),
  show_label: integer("show_label", { mode: "boolean" })
    .notNull()
    .default(false),
  label: text("label").notNull().default("Active Timer"),
});

export const notice = sqliteTable("notice", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID())
    .notNull(),
  visible: integer("visible", { mode: "boolean" }).notNull().default(false),
  label: text("label").notNull().default("Mod Notice"),
});

export const chosen_clip = sqliteTable("chosen_clip", {
  id: text("id").primaryKey().notNull(),
  title: text("title").notNull(),
  game: text("game").notNull(),
  gameId: text("gameId").notNull(),
  createdDate: integer("createdDate", { mode: "timestamp_ms" }),
  featured: integer("featured", { mode: "boolean" }),
  creatorName: text("creatorName").notNull(),
  creatorId: text("creatorId").notNull(),
  embedUrl: text("embedUrl").notNull(),
  views: integer("views").notNull(),
  duration_seconds: integer("duration_seconds").notNull(),
  channel: text("channel")
    .notNull()
    .$defaultFn(() => process.env.CHANNEL),
  download_url: text("download_url")
    .notNull()
    .default(
      "https://ducky.wiki/_app/immutable/assets/duckypfptransparent.DjoImAvR.png",
    ),
  portrait_download_url: text("portrait_download_url"),
  creator_profile_image: text("creator_profile_image").notNull(),
});

export const clips_visible = sqliteTable("clips_visible", {
  channel: text("channel").notNull().primaryKey(),
  visible: integer("visible", { mode: "boolean" }).notNull().default(false),
});
