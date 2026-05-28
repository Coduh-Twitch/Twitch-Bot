"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.raffle_participants = exports.raffles = exports.banned_users = exports.participants = exports.queues = exports.DBRoles = void 0;
const sqlite_core_1 = require("drizzle-orm/sqlite-core");
var DBRoles;
(function (DBRoles) {
    DBRoles[DBRoles["MOD"] = 0] = "MOD";
    DBRoles[DBRoles["VIP"] = 1] = "VIP";
    DBRoles[DBRoles["SUBSCRIBER"] = 2] = "SUBSCRIBER";
    DBRoles[DBRoles["DEFAULT"] = 3] = "DEFAULT";
})(DBRoles || (exports.DBRoles = DBRoles = {}));
exports.queues = (0, sqlite_core_1.sqliteTable)("queues", {
    id: (0, sqlite_core_1.text)('id').primaryKey().$defaultFn(() => crypto.randomUUID()).notNull(),
    game: (0, sqlite_core_1.text)("game").notNull().default("Miscellaneous"),
    createdByUserId: (0, sqlite_core_1.text)("createdByUserId").notNull(),
    maximumRosterSize: (0, sqlite_core_1.integer)("maximumRosterSize").notNull().default(24),
    membersPerRound: (0, sqlite_core_1.integer)("membersPerRound").notNull().default(8)
});
exports.participants = (0, sqlite_core_1.sqliteTable)("participants", {
    primaryId: (0, sqlite_core_1.text)("primaryId").notNull().primaryKey().$defaultFn(() => crypto.randomUUID()),
    id: (0, sqlite_core_1.text)("id").notNull(),
    queueId: (0, sqlite_core_1.text)("queueId").notNull(),
    role: (0, sqlite_core_1.integer)("role").notNull().default(3),
    avatar_url: (0, sqlite_core_1.text)("avatar_url").notNull(),
    username: (0, sqlite_core_1.text)("username").notNull(),
    position: (0, sqlite_core_1.integer)("position").notNull().default(100)
});
exports.banned_users = (0, sqlite_core_1.sqliteTable)("banned_users", {
    primaryId: (0, sqlite_core_1.text)("primaryId").notNull().primaryKey().$defaultFn(() => crypto.randomUUID()),
    id: (0, sqlite_core_1.text)("id").notNull()
});
exports.raffles = (0, sqlite_core_1.sqliteTable)("raffles", {
    id: (0, sqlite_core_1.text)("id").notNull().$defaultFn(() => crypto.randomUUID()),
    creator_id: (0, sqlite_core_1.text)("creator_id").notNull(),
    expires_at: (0, sqlite_core_1.integer)("expires_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date(Date.now() + 60e3)),
    points: (0, sqlite_core_1.integer)("points").notNull().default(1000),
    winner_id: (0, sqlite_core_1.text)("winner_id").default(null)
});
exports.raffle_participants = (0, sqlite_core_1.sqliteTable)("raffle_participants", {
    id: (0, sqlite_core_1.text)("id").notNull().primaryKey(),
    raffle_id: (0, sqlite_core_1.text)("raffle_id").notNull(),
});
//# sourceMappingURL=schema.js.map