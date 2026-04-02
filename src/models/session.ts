import { model, Schema } from "mongoose";
import { SessionData } from "..";

const data = new Schema<SessionData>({
    accessToken: String,
    expiresIn: Number,
    obtainmentTimestamp: Number,
    refreshToken: String,
    userId: String
})

export const sessionModel = model("session", data);