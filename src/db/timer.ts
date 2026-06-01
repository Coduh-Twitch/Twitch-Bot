import { eq } from "drizzle-orm";
import { db } from ".";
import { timer } from "./schema";

export const getTimer = (): typeof timer.$inferInsert => {
    let dbTimer = db.select().from(timer).all()?.[0] || null;
    if(!dbTimer) {
        return db.insert(timer).values({paused: false, seconds: 0, visible: false, started_at: new Date()}).returning().get();
    } else return dbTimer;
}

export const setTimerSeconds = (seconds: number): typeof timer.$inferInsert => {
    let dbTimer = getTimer();
    if(!dbTimer) {
        return db.insert(timer).values({seconds, started_at: new Date()}).returning().get();
    } else return db.update(timer).set({seconds, started_at: new Date()}).where(eq(timer.id, dbTimer.id)).returning().get();
}

export const setTimerVisibility = (show: boolean): typeof timer.$inferInsert => {
    let dbTimer = getTimer();
    if(!dbTimer) {
        return db.insert(timer).values({visible: show}).returning().get();
    } else return db.update(timer).set({visible: show}).where(eq(timer.id, dbTimer.id)).returning().get();
}

export const setTimerLabelVisibility = (show: boolean): typeof timer.$inferInsert => {
    let dbTimer = getTimer();
    if(!dbTimer) {
        return db.insert(timer).values({show_label: show}).returning().get();
    } else return db.update(timer).set({show_label: show}).where(eq(timer.id, dbTimer.id)).returning().get();
}

export const setTimerPaused = (paused: boolean): typeof timer.$inferInsert => {
    let dbTimer = getTimer();
    if(!dbTimer) {
        return db.insert(timer).values({paused}).returning().get();
    } else return db.update(timer).set({paused}).where(eq(timer.id, dbTimer.id)).returning().get();
}

export const setTimerLabel = (label: string): typeof timer.$inferInsert => {
    let dbTimer = getTimer();
    if(!dbTimer) {
        return db.insert(timer).values({label}).returning().get();
    } else return db.update(timer).set({label}).where(eq(timer.id, dbTimer.id)).returning().get();
}