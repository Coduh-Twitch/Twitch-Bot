import { model, Schema } from "mongoose";
import { UserRoles } from "./user";
import { UserRolesStringMap } from "../classes/Types";

export interface CustomCommand {
    id: string; // UUID
    trigger: string; // !something
    content: string; // response content
    userLevel: string;
}

const data = new Schema<CustomCommand>({
    id: String,
    trigger: String,
    content: String,
    userLevel: String
})

export const customCommandModel = model("customCommand", data)