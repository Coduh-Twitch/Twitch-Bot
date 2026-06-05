import { model, Schema } from "mongoose";

export enum UserRoles {
  BROADCASTER,
  LEAD_MOD,
  MOD,
  VIP,
  DEFAULT,
}

export interface User {
  twitchId: string | null;
  discordId: string | null;
  points: number;
  role: UserRoles;
  game_code: string | null;
}

const data = new Schema<User>({
  twitchId: String,
  discordId: String,
  points: Number,
  role: Number,
  game_code: String,
});

export const userModel = model("user", data);
