import { eq } from "drizzle-orm";
import { db } from ".";
import { giveaway_entries, giveaways } from "./schema";
import { and } from "drizzle-orm";

export const createGiveaway = (
  data: typeof giveaways.$inferInsert,
): typeof giveaways.$inferInsert => {
  return db.insert(giveaways).values(data).returning().get();
};

export const getGiveaway = (
  id: string,
): typeof giveaways.$inferInsert | null => {
  return db.select().from(giveaways).where(eq(giveaways.id, id)).get() || null;
};

export const getAllGiveaways = (): (typeof giveaways.$inferInsert)[] => {
  return db.select().from(giveaways).all() || [];
};

export const deleteGiveaway = (id: string): typeof giveaways.$inferInsert => {
  return db.delete(giveaways).where(eq(giveaways.id, id)).returning().get();
};

export const getAllEntrants = (
  giveaway_id: string,
): (typeof giveaway_entries.$inferInsert)[] => {
  return (
    db
      .select()
      .from(giveaway_entries)
      .where(eq(giveaway_entries.giveaway_id, giveaway_id))
      .all() || []
  );
};

export const addEntrant = (
  data: typeof giveaway_entries.$inferInsert,
): typeof giveaway_entries.$inferInsert => {
  return db.insert(giveaway_entries).values(data).returning().get();
};

export const removeEntrant = (
  giveaway_id: string,
  user_id: string,
): typeof giveaway_entries.$inferInsert => {
  return db
    .delete(giveaway_entries)
    .where(
      and(
        eq(giveaway_entries.giveaway_id, giveaway_id),
        eq(giveaway_entries.user_id, user_id),
      ),
    )
    .returning()
    .get();
};
