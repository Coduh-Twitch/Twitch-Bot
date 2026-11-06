import { eq } from "drizzle-orm";
import { db } from ".";
import { auto_shoutout_queue, auto_shoutouts, DBAutoshoutout, DBAutoshoutoutQueueItem } from "./schema";

export const addAutoShoutoutCandidate = (id: string): DBAutoshoutout => {
  const existing = db.select().from(auto_shoutouts).where(eq(auto_shoutouts.user_id, id)).get() || null;
  if (existing) return existing;
  return db.insert(auto_shoutouts).values({ user_id: id }).returning().get();
};

export const removeAutoShoutoutCandidate = (id: string): DBAutoshoutout | null => {
  const existing = db.select().from(auto_shoutouts).where(eq(auto_shoutouts.user_id, id)).get() || null;
  if (!existing) return null;
  return db.delete(auto_shoutouts).where(eq(auto_shoutouts.user_id, id)).returning().get() || null;
};

export const updateAutoShoutoutCandidate = (id: string, data: Partial<DBAutoshoutout>): DBAutoshoutout | null => {
  const existing = db.select().from(auto_shoutouts).where(eq(auto_shoutouts.user_id, id)).get() || null;
  if (!existing) return null;
  return db.update(auto_shoutouts).set(data).where(eq(auto_shoutouts.user_id, id)).returning().get() || null;
}

export const getAutoShoutoutCandidate = (id: string): DBAutoshoutout | null => {
  return db.select().from(auto_shoutouts).where(eq(auto_shoutouts.user_id, id)).get() || null;
}

export const isAutoShoutoutCandidate = (id: string): boolean => {
  const all = getAllAutoShoutoutCandidates();
  return all.some(c => c.user_id === id);
}

export const getAllAutoShoutoutCandidates = (filter: ((candidate: DBAutoshoutout) => boolean) | null = null): DBAutoshoutout[] => {
  let toReturn = db.select().from(auto_shoutouts).all() || [];
  if (filter) toReturn = toReturn.filter(filter);
  return toReturn;
}

export const getAutoShoutoutQueue = (filter: ((item: DBAutoshoutoutQueueItem) => boolean) | null = null): DBAutoshoutoutQueueItem[] => {
  let toReturn = db.select().from(auto_shoutout_queue).all() || [];
  if (filter) toReturn = toReturn.filter(filter);
  toReturn = toReturn.sort((a, b) => a.position - b.position);
  return toReturn;
}

export const addToAutoShoutoutQueue = (id: string): DBAutoshoutoutQueueItem => {
  const existing = db.select().from(auto_shoutout_queue).where(eq(auto_shoutout_queue.user_id, id)).get() || null;
  if (existing) return existing;

  const all = getAutoShoutoutQueue();

  return db.insert(auto_shoutout_queue).values({ user_id: id, position: all.length }).returning().get();
}

export const removeFromAutoshoutoutQueue = (id: string): DBAutoshoutoutQueueItem | null => {
  const existing = db.select().from(auto_shoutout_queue).where(eq(auto_shoutout_queue.user_id, id)).get() || null;
  if (!existing) return null;
  let toReturn = db.delete(auto_shoutout_queue).where(eq(auto_shoutout_queue.user_id, id)).returning().get() || null;

  let i = 0;
  for (const item of db.select().from(auto_shoutout_queue).all() || []) {
    db.update(auto_shoutout_queue).set({ position: i }).where(eq(auto_shoutout_queue.user_id, item.user_id)).returning().get();
    i += 1;
  }

  return toReturn;
}
