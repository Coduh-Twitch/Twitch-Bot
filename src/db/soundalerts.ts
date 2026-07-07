import { eq } from "drizzle-orm";
import { db } from ".";
import { sound_alert_queue, sound_alert_rewards, tts_queue } from "./schema";

export const getSoundAlertQueue =
  (): (typeof sound_alert_queue.$inferInsert)[] => {
    return (db.select().from(sound_alert_queue).all() || []).sort(
      (a, b) => a.sent_at - b.sent_at,
    );
  };

export const addSoundAlertToQueue = (
  data: typeof sound_alert_queue.$inferInsert,
): typeof sound_alert_queue.$inferInsert => {
  return db.insert(sound_alert_queue).values(data).returning().get();
};

export const removeSoundAlertFromQueue = (
  id: string,
): typeof sound_alert_queue.$inferInsert => {
  return db
    .delete(sound_alert_queue)
    .where(eq(sound_alert_queue.id, id))
    .returning()
    .get();
};

export const getSoundAlertFromQueue = (
  id: string,
): typeof sound_alert_queue.$inferInsert | null => {
  return (
    db
      .select()
      .from(sound_alert_queue)
      .where(eq(sound_alert_queue.id, id))
      .get() || null
  );
};

export const getSoundAlertFromReward = (
  rewardId: string,
): typeof sound_alert_rewards.$inferInsert | null => {
  return (
    db
      .select()
      .from(sound_alert_rewards)
      .where(eq(sound_alert_rewards.reward_id, rewardId))
      .get() || null
  );
};

export const createSoundAlertReward = (
  data: typeof sound_alert_rewards.$inferInsert,
): typeof sound_alert_rewards.$inferInsert => {
  return db.insert(sound_alert_rewards).values(data).returning().get();
};

export const deleteSoundAlertReward = (
  rewardId: string,
): typeof sound_alert_rewards.$inferInsert | null => {
  return (
    db
      .delete(sound_alert_rewards)
      .where(eq(sound_alert_rewards.reward_id, rewardId))
      .returning()
      .get() || null
  );
};

export const updateSoundAlertRewardByRewardId = (
  rewardId: string,
  data: typeof sound_alert_rewards.$inferInsert,
): typeof sound_alert_rewards.$inferInsert => {
  return db
    .update(sound_alert_rewards)
    .set(data)
    .where(eq(sound_alert_rewards.reward_id, rewardId))
    .returning()
    .get();
};

export const getAllRewards =
  (): (typeof sound_alert_rewards.$inferInsert)[] => {
    return db.select().from(sound_alert_rewards).all() || [];
  };
