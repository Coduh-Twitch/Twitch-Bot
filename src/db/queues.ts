import { and, eq } from "drizzle-orm";
import { db } from ".";
import {
  banned_users,
  DBParticipant,
  DBQueue,
  DBRoles,
  participants,
  queues,
} from "./schema";

export const createQueue = (data: typeof queues.$inferInsert): DBQueue => {
  let queueExists = db.select().from(queues).all();
  if (queueExists.length > 0) {
    return updateQueue(queueExists[0].id, data);
  } else return db.insert(queues).values(data).returning().get();
};

export const updateQueue = (
  queueId: string,
  changes: Partial<typeof queues.$inferInsert>,
): DBQueue | null => {
  return (
    db
      .update(queues)
      .set(changes)
      .where(eq(queues.id, queueId))
      .returning()
      .get() || null
  );
};

export const getQueue = (): DBQueue | null => {
  return db.select().from(queues).all()?.[0] || null;
};

export const getQueueById = (queueId: string): DBQueue | null => {
  return db.select().from(queues).where(eq(queues.id, queueId)).get() || null;
};

export const getQueueMembers = (queueId: string): DBParticipant[] => {
  return (
    db
      .select()
      .from(participants)
      .where(eq(participants.queueId, queueId))
      .all() || []
  );
};

export const addQueueMember = (
  queueId: string,
  member: typeof participants.$inferInsert,
): DBParticipant => {
  db.insert(participants)
    .values({ queueId, ...member, position: 0 })
    .returning()
    .all();

  let allParticipants = (
    db
      .select()
      .from(participants)
      .where(eq(participants.queueId, queueId))
      .all() || []
  )
    .filter((q) => q.queueId === queueId)
    .sort((a, b) => a.joined_at - b.joined_at)
    .sort((a, b) => a.role - b.role)
    .sort((a, b) => (b.bumped ? 1 : 0) - (a.bumped ? 1 : 0));

  let i = 0;
  for (const participant of allParticipants) {
    i += 1;
    console.log(participant.id, i);
    db.update(participants)
      .set({ position: i })
      .where(eq(participants.primaryId, participant.primaryId))
      .returning()
      .get();
  }

  let toReturn = db
    .select()
    .from(participants)
    .where(
      and(eq(participants.queueId, queueId), eq(participants.id, member.id)),
    )
    .get();
  return toReturn;
};

export const removeQueueMember = (
  queueId: string,
  memberId: string,
): DBParticipant | null => {
  let toReturn =
    db
      .delete(participants)
      .where(
        and(eq(participants.queueId, queueId), eq(participants.id, memberId)),
      )
      .returning()
      .get() || null;
  let allParticipants = (
    db
      .select()
      .from(participants)
      .where(eq(participants.queueId, queueId))
      .all() || []
  )
    .filter((q) => q.queueId === queueId)
    .sort((a, b) => a.joined_at - b.joined_at)
    .sort((a, b) => a.role - b.role)
    .sort((a, b) => (b.bumped ? 1 : 0) - (a.bumped ? 1 : 0));

  let i = 0;
  for (const participant of allParticipants) {
    i += 1;
    console.log(participant.id, i);
    db.update(participants)
      .set({ position: i })
      .where(eq(participants.primaryId, participant.primaryId))
      .returning()
      .get();
  }
  return toReturn;
};

export const shiftQueue = (queueId: string): DBParticipant[] => {
  let queue = getQueueById(queueId);
  let members = getQueueMembers(queue.id).sort(
    (a, b) => a.position - b.position,
  );

  let i = 0;
  for (const member of members) {
    i += 1;
    if (i <= queue.membersPerRound)
      removeQueueMember(member.queueId, member.id);
  }

  return getQueueMembers(queue.id);
};

export const toggleQueueMemberBump = (
  queueId: string,
  memberId: string,
  bumped: boolean = true,
): DBParticipant | null => {
  let toReturn =
    db
      .update(participants)
      .set({ bumped: bumped })
      .where(
        and(eq(participants.queueId, queueId), eq(participants.id, memberId)),
      )
      .returning()
      .get() || null;
  let allParticipants = (
    db
      .select()
      .from(participants)
      .where(eq(participants.queueId, queueId))
      .all() || []
  )
    .filter((q) => q.queueId === queueId)
    .sort((a, b) => a.joined_at - b.joined_at)
    .sort((a, b) => a.role - b.role)
    .sort((a, b) => (b.bumped ? 1 : 0) - (a.bumped ? 1 : 0));

  let i = 0;
  for (const participant of allParticipants) {
    i += 1;
    console.log(participant.id, i);
    db.update(participants)
      .set({ position: i })
      .where(eq(participants.primaryId, participant.primaryId))
      .returning()
      .get();
  }
  return toReturn;
};

export const deleteQueue = (queueId: string): DBQueue | null => {
  return (
    db.delete(queues).where(eq(queues.id, queueId)).returning().get() || null
  );
};

export const clearParticipants = (
  queueId: string,
  excludeStatuses: boolean = false,
): DBParticipant[] => {
  if (excludeStatuses) {
    return (
      db
        .delete(participants)
        .where(
          and(
            eq(participants.queueId, queueId),
            eq(participants.role, DBRoles.DEFAULT),
          ),
        )
        .returning()
        .all() || []
    );
  } else {
    return (
      db
        .delete(participants)
        .where(eq(participants.queueId, queueId))
        .returning()
        .all() || []
    );
  }
};

export const queueBan = (memberId: string): void => {
  db.insert(banned_users).values({ id: memberId }).returning().get();
};

export const queueUnban = (memberId: string): void => {
  db.delete(banned_users)
    .where(eq(banned_users.id, memberId))
    .returning()
    .get();
};

export const isBanned = (memberId: string): boolean => {
  return (
    (db
      .select()
      .from(banned_users)
      .where(eq(banned_users.id, memberId))
      .get() || null) !== null
  );
};

export const isInQueue = (memberId: string): boolean => {
  return (
    (db
      .select()
      .from(participants)
      .where(eq(participants.id, memberId))
      .get() || null) !== null
  );
};
