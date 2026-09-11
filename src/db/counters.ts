import { eq } from "drizzle-orm";
import { db } from ".";
import { counters } from "./schema";

export const getCounter = (id: string): typeof counters.$inferInsert | null => {
  return db.select().from(counters).where(eq(counters.id, id)).get() || null;
}

export const ensureCounter = (id: string, data?: typeof counters.$inferInsert): typeof counters.$inferInsert => {
  const counter = getCounter(id);
  if (counter) return counter;
  return db.insert(counters).values({...data, id}).returning().get();
}

export const renameCounter = (id: string, name: string): typeof counters.$inferInsert => {
  ensureCounter(id);
  return db.update(counters).set({ label: name }).where(eq(counters.id, id)).returning().get();
}

export const incrementCounter = (id: string): typeof counters.$inferInsert => {
  const counter = ensureCounter(id);
  return db.update(counters).set({ count: (counter?.count || 0) + 1 }).where(eq(counters.id, id)).returning().get();
}

export const decrementCounter = (id: string): typeof counters.$inferInsert => {
  const counter = ensureCounter(id);
  return db.update(counters).set({ count: (counter?.count || 0) - 1 }).where(eq(counters.id, id)).returning().get();
}

export const resetCounter = (id: string): typeof counters.$inferInsert => {
  ensureCounter(id);
  return db.update(counters).set({ count: 0 }).where(eq(counters.id, id)).returning().get();
}

export const deleteCounter = (id: string): typeof counters.$inferInsert | null => {
  return db.delete(counters).where(eq(counters.id, id)).returning().get() || null;
}

export const getAllCounters = (): (typeof counters.$inferInsert)[] => {
  return db.select().from(counters).all() || [];
}
