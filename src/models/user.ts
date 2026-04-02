import { model, Schema } from "mongoose";

export enum UserRoles {
    BROADCASTER,
    BOT,
    MOD,
    VIP,
    DEFAULT
}

export interface User {
    twitchId: string | null;
    discordId: string | null;
    points: number;
    role: UserRoles;
}

const data = new Schema<User>({
    twitchId: String,
    discordId: String,
    points: Number,
    role: Number
})

export const userModel = model("user", data);