import { eq } from "drizzle-orm";
import { db } from ".";
import { tts_queue } from "./schema";

export const getTTSQueue = (): (typeof tts_queue.$inferInsert)[] => {
  return (db.select().from(tts_queue).all() || []).sort(
    (a, b) => a.sent_at - b.sent_at,
  );
};

export const addTTS = (
  data: typeof tts_queue.$inferInsert,
): typeof tts_queue.$inferInsert => {
  return db.insert(tts_queue).values(data).returning().get();
};

export const removeTTS = (id: string): typeof tts_queue.$inferInsert => {
  return db.delete(tts_queue).where(eq(tts_queue.id, id)).returning().get();
};

export const getTTS = (id: string): typeof tts_queue.$inferInsert | null => {
  return db.select().from(tts_queue).where(eq(tts_queue.id, id)).get() || null;
};
