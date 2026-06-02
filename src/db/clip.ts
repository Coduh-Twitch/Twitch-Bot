import { eq } from "drizzle-orm";
import { db } from ".";
import { chosen_clip, clips_visible } from "./schema";
import { Clip } from "../util";

let defaultClip: Clip = {
    id: "ClipNotFound",
    title: "No Clips Found :(",
    createdDate: new Date(),
    creatorId: "1234",
    creatorName: "ShortBotduh",
    embedUrl: `https://twitch.tv/${process.env.CHANNEL}`,
    featured: false,
    game: "Nothing",
    gameId: "1234",
    views: 0,
    channel: process.env.CHANNEL,
    duration_seconds: 0,
    download_url: "https://ducky.wiki/_app/immutable/assets/duckypfptransparent.DjoImAvR.png",
    portrait_download_url: null,
    creator_profile_image: "https://ducky.wiki/_app/immutable/assets/duckypfptransparent.DjoImAvR.png"
}

export const getChosenClip = (): typeof chosen_clip.$inferInsert => {
    let dbNotice = db.select().from(chosen_clip).all()?.[0] || null;
    if (!dbNotice) {
        return db.insert(chosen_clip).values(defaultClip).returning().get();
    } else return dbNotice;
}

export const setChosenClip = (clip: Clip): typeof chosen_clip.$inferInsert => {
    let dbClip = getChosenClip();
    if (!dbClip) {
        return db.insert(chosen_clip).values(clip).returning().get();
    } else return db.update(chosen_clip).set(clip).where(eq(chosen_clip.id, dbClip.id)).returning().get();
}



export const setClipVisibility = (show: boolean): boolean => {
    let dbClip = getChosenClip();
    let channel = dbClip.channel;
    let visibility = db.select().from(clips_visible).where(eq(clips_visible.channel, channel)).get();
    
    if (!visibility) {
        return db.insert(clips_visible).values({channel: dbClip.channel, visible: show}).returning().get().visible;
    } else return db.update(clips_visible).set({visible: show}).where(eq(clips_visible.channel, visibility.channel)).returning().get().visible;
}

export const getClipVisibility = (): boolean => {
    let dbClip = getChosenClip();
    let channel = dbClip.channel;
    let visibility = db.select().from(clips_visible).where(eq(clips_visible.channel, channel)).get();
    
    if (!visibility) {
        return db.insert(clips_visible).values({channel: dbClip.channel, visible: false}).returning().get().visible;
    } else return visibility.visible;
}