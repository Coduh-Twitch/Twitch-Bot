import { eq } from "drizzle-orm";
import { db } from ".";
import { bot_config } from "./schema";

export const getBotConfig = (id: string): typeof bot_config.$inferInsert => {
  return (
    db.select().from(bot_config).where(eq(bot_config.id, id)).get() ||
    db.insert(bot_config).values({ id }).returning().get()
  );
};

export const updateBotConfig = (
  id: string,
  data: typeof bot_config.$inferInsert,
): typeof bot_config.$inferInsert => {
  getBotConfig(id);
  return db
    .update(bot_config)
    .set(data)
    .where(eq(bot_config.id, id))
    .returning()
    .get();
};
