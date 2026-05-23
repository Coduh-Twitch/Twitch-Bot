import { apiClient } from "..";
import { getDiscordCta, getRoomCode } from "../util";

interface ScheduledMessage {
    id: string;
    enabled: true;
    getContent: (() => Promise<string | null>) | (() => string | null);
}

let secs = 0;

export const scheduledMessageTimeout = 120e3;

const scheduledMessages: ScheduledMessage[] = [
    {
        id: "discord",
        enabled: true,
        getContent: async () => {
            return await getDiscordCta();
        }
    },
    {
        id: "follow",
        enabled: true,
        getContent: () => `If you're enjoying the stream, don't forget to follow!`
    },
    {
        id: "game-code",
        enabled: true,
        getContent: async () => {
            let stream = await apiClient.streams.getStreamByUserName(process.env.CHANNEL);
            // if (!stream) return null;
            let game: string = stream?.gameName || "NOSTREAM";
            // game = "Jackbox Party Packs"
            if (await getRoomCode()) {
                if (game.includes("Mario Kart World") || game === "Nothing") {
                    return `Join the open lobby! | Online -> Friends -> Enter Room Code -> ${await getRoomCode()}`;
                } else if(game.includes("Jackbox")) {
                    return `Join Jackbox! @ https://jackbox.tv -> ${await getRoomCode()}`
                } else return null;
            } else return null;
        }
    }
]

export default scheduledMessages;