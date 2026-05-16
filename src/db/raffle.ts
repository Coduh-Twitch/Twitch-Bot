import { and, eq } from "drizzle-orm";
import { db } from ".";
import { raffle_participants, raffles } from "./schema";

export const createRaffle = (data: typeof raffles.$inferInsert): typeof raffles.$inferInsert => {
    return db.insert(raffles).values(data).returning().get();
}

export const getRaffleById = (raffleId: string): {raffle: typeof raffles.$inferInsert, participants: (typeof raffle_participants.$inferInsert)[]} => {
    let raffle = db.select().from(raffles).where(eq(raffles.id, raffleId)).get();
    return { raffle, participants: getRaffleParticipants(raffle.id)}
}

export const getAllRaffles = (): (typeof raffles.$inferInsert)[] => {
    return db.select().from(raffles).all();
}

export const updateRaffle = (raffleId: string, data: typeof raffles.$inferInsert): typeof raffles.$inferInsert => {
    return db.update(raffles).set(data).where(eq(raffles.id, raffleId)).returning().get();
}

export const deleteRaffle = (raffleId: string): typeof raffles.$inferInsert => {
    deleteAllRaffleParticipants(raffleId);
    return db.delete(raffles).where(eq(raffles.id, raffleId)).returning().get();
}

export const createRaffleParticipant = (data: typeof raffle_participants.$inferInsert): typeof raffle_participants.$inferInsert => {
    return db.insert(raffle_participants).values(data).returning().get();
}

export const getRaffleParticipants = (raffleId: string): (typeof raffle_participants.$inferInsert)[] =>{ 
    return db.select().from(raffle_participants).where(eq(raffle_participants.raffle_id, raffleId)).all();
}

export const deleteAllRaffleParticipants = (raffleId: string): (typeof raffle_participants.$inferInsert)[] => {
    return db.delete(raffle_participants).where(eq(raffle_participants.raffle_id, raffleId)).returning().all();
}

export const deleteRaffleParticipant = (raffleId: string, userId: string): typeof raffle_participants.$inferInsert => {
    return db.delete(raffle_participants).where(and(eq(raffle_participants.raffle_id, raffleId), eq(raffle_participants.id, userId))).returning().get();
}

