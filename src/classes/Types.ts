import { ChatClient, ChatMessage } from "@twurple/chat";
import { UserRoles } from "../models/user";

export interface SearchedTrack {
    id: string;
    title: string;
    artist: string;
    album: string;
    href: string;
    uri: string;
    imageUrl: string;
}

export interface ChatCommandHelpArgument {
    name: string;
    description: string;
    required: boolean;
}

export interface ChatSubCommand {
    name: string;
    args: ChatCommandHelpArgument[];
}

export interface ChatCommand {
    enabled: boolean;
    name: string;
    help: string;
    userLevel: UserRoles;
    aliases?: string[];
    subCommands?: ChatSubCommand[];
    args?: ChatCommandHelpArgument[]; 
    run: (client: ChatClient, user: string, content: string, message: ChatMessage) => void;
}

export const UserRolesStringMap: Record<string, string> = {
    [`${UserRoles.DEFAULT}`]: "Viewer",
    [`${UserRoles.VIP}`]: "VIP",
    [`${UserRoles.MOD}`]: "Moderator",
    [`${UserRoles.BOT}`]: "Bot",
    [`${UserRoles.BROADCASTER}`]: "Broadcaster",

}