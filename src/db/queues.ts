import { and, eq } from "drizzle-orm";
import { db } from ".";
import { banned_users, DBParticipant, DBQueue, DBRoles, participants, queues } from "./schema";

export const createQueue = (data: typeof queues.$inferInsert): DBQueue => {
    let queueExists = db.select().from(queues).all();
    if(queueExists.length > 0) {
        return updateQueue(queueExists[0].id, data);
    } else return db.insert(queues).values(data).returning().get();
}

export const updateQueue = (queueId: string, changes: Partial<typeof queues.$inferInsert>): DBQueue | null => {
    return db.update(queues).set(changes).where(eq(queues.id, queueId)).returning().get() || null;
}

export const getQueue = (): DBQueue | null => {
    return db.select().from(queues).all()?.[0] || null;
}

export const getQueueById = (queueId: string): DBQueue | null => {
    return db.select().from(queues).where(eq(queues.id, queueId)).get() || null;
}

export const getQueueMembers = (queueId: string): DBParticipant[] => {
    return db.select().from(participants).where(eq(participants.queueId, queueId)).all() || [];
}

export const addQueueMember = (queueId: string, member: typeof participants.$inferInsert): DBParticipant => {
    let role = member.role || DBRoles.DEFAULT;
    let allParticipants = db.select().from(participants).where(and(eq(participants.id, member.id), eq(participants.queueId, queueId))).all().sort((a, b) => a.position - b.position) || [];
    let maxPosition = allParticipants.length;
    if(role === DBRoles.MOD) maxPosition = allParticipants.filter(p => p.role !== DBRoles.MOD).length;
    if(role === DBRoles.VIP) maxPosition = allParticipants.filter(p => p.role === DBRoles.MOD || p.role !== DBRoles.VIP).length;

    return db.insert(participants).values({queueId, ...member, position: maxPosition}).returning().get();
}

export const removeQueueMember = (queueId: string, memberId: string): DBParticipant | null => {
    return db.delete(participants).where(and(eq(participants.queueId, queueId), eq(participants.id, memberId))).returning().get() || null;
}

export const deleteQueue = (queueId: string): DBQueue | null => {
    return db.delete(queues).where(eq(queues.id, queueId)).returning().get() || null;
}

export const clearParticipants = (queueId: string, excludeStatuses: boolean = false): DBParticipant[] => {
    if(excludeStatuses) {
        return db.delete(participants).where(and(eq(participants.queueId, queueId), eq(participants.role, DBRoles.DEFAULT))).returning().all() || [];
    } else {
        return db.delete(participants).where(eq(participants.queueId, queueId)).returning().all() || [];
    }
}

export const queueBan = (memberId: string): void => {
    db.insert(banned_users).values({id: memberId}).returning().get();
}

export const queueUnban = (memberId: string): void => {
    db.delete(banned_users).where(eq(banned_users.id, memberId)).returning().get();
}

export const isBanned = (memberId: string): boolean => {
    return (db.select().from(banned_users).where(eq(banned_users.id, memberId)).get() || null) !== null;
}

export const isInQueue = (memberId: string): boolean => {
    return (db.select().from(participants).where(eq(participants.id, memberId)).get() || null) !== null;
}