import { ChatClient, ChatMessage } from "@twurple/chat";

export interface SearchedTrack {
    id: string;
    title: string;
    artist: string;
    album: string;
    href: string;
    uri: string;
    imageUrl: string;
}

export interface ChatCommand {
    enabled: boolean;
    run: (client: ChatClient, user: string, content: string, message: ChatMessage) => void;
}