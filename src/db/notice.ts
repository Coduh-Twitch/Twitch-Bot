import { eq } from "drizzle-orm";
import { db } from ".";
import { notice } from "./schema";

export const getNotice = (): typeof notice.$inferInsert => {
    let dbNotice = db.select().from(notice).all()?.[0] || null;
    if(!dbNotice) {
        return db.insert(notice).values({visible: false}).returning().get();
    } else return dbNotice;
}

export const setNoticeVisibility = (visible: boolean): typeof notice.$inferInsert => {
    let dbNotice = getNotice();
    if(!dbNotice) {
        return db.insert(notice).values({visible}).returning().get();
    } else return db.update(notice).set({visible}).where(eq(notice.id, dbNotice.id)).returning().get();
}

export const setNoticeLabel = (label: string): typeof notice.$inferInsert => {
    let dbNotice = getNotice();
    if(!dbNotice) {
        return db.insert(notice).values({label}).returning().get();
    } else return db.update(notice).set({label}).where(eq(notice.id, dbNotice.id)).returning().get();
}