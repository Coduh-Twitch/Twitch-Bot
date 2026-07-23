import { eq } from "drizzle-orm";
import { db } from ".";
import { amazon_queue } from "./schema";

export const getAmazonQueue = (): (typeof amazon_queue.$inferInsert)[] => {
  return (db.select().from(amazon_queue).all() || []).sort(
    (a, b) => a.added_at - b.added_at,
  );
};

export const clearAmazonQueue = () => {
  return db.delete(amazon_queue).returning().get();
};

export const addAmazonItem = (
  data: typeof amazon_queue.$inferInsert,
): typeof amazon_queue.$inferInsert => {
  return db.insert(amazon_queue).values(data).returning().get();
};

export const removeAmazonItem = (
  asin: string,
): typeof amazon_queue.$inferInsert => {
  return db
    .delete(amazon_queue)
    .where(eq(amazon_queue.asin, asin))
    .returning()
    .get();
};

export const getAmazonQueueItem = (
  asin: string,
): typeof amazon_queue.$inferInsert | null => {
  return (
    db.select().from(amazon_queue).where(eq(amazon_queue.asin, asin)).get() ||
    null
  );
};
