import { eq } from "drizzle-orm";
import { db } from ".";
import { userModel } from "../models/user";
import { word_game } from "./schema";
import { apiClient } from "..";

export const getWordGame = (): typeof word_game.$inferInsert | null => {
  return db.select().from(word_game).all()?.[0] || null;
};

export const createWordGame = (word: string): typeof word_game.$inferInsert => {
  let wg = getWordGame();
  if (wg) return wg;
  return db
    .insert(word_game)
    .values({ word, revealed_part: "", started_at: Date.now() })
    .returning()
    .get();
};

export const letterRevealed = (
  letter: string,
): typeof word_game.$inferInsert => {
  const wg = getWordGame();
  return db
    .update(word_game)
    .set({
      revealed_part: (wg.revealed_part + letter).trim().toLowerCase(),
      id: wg.id,
    })
    .where(eq(word_game.id, wg.id))
    .returning()
    .get();
};

export const setGuesser = async (
  id: string,
  username: string,
): Promise<typeof word_game.$inferInsert | null> => {
  const dbUser = await userModel.findOne({ twitchId: id });
  let wg = getWordGame();

  if (!dbUser || !wg) return null;

  let name = dbUser?.username || username;

  if (!name) {
    let apiUser = await apiClient.users.getUserById(dbUser.twitchId);
    if (apiUser) name = apiUser.displayName;
  }

  return db
    .update(word_game)
    .set({ guesser_id: dbUser.twitchId, guesser_username: name, guessed: true })
    .where(eq(word_game.id, wg.id))
    .returning()
    .get();
};

export const endWordGame = (): void => {
  const wg = getWordGame();
  if (wg) {
    db.delete(word_game).where(eq(word_game.id, wg.id)).returning().get();
  }
};
