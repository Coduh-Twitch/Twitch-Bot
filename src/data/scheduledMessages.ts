import { apiClient } from "..";
import { getDiscordCta, getRoomCode } from "../util";

interface ScheduledMessage {
    enabled: true;
    getContent: (() => Promise<string | null>) | (() => string | null);
}

let secs = 0;

export const scheduledMessageTimeout = 120e3;

const scheduledMessages: ScheduledMessage[] = [
    {
        enabled: true,
        getContent: async () => {
            return await getDiscordCta();
        }
    },
    {
        enabled: true,
        getContent: () => `If you're enjoying the stream, don't forget to follow!`
    },
    {
        enabled: true,
        getContent: async () => {
            let stream = await apiClient.streams.getStreamByUserName(process.env.CHANNEL);
            // if (!stream) return null;
            let game: string = stream?.gameName || "NOSTREAM";
            // game = "Jackbox Party Packs"
            if (await getRoomCode()) {
                if (game.includes("Mario Kart World")) {
                    return `Join the open lobby! | Online -> Friends -> Enter Room Code -> ${await getRoomCode()}`;
                } else if(game.includes("Jackbox")) {
                    return `Join Jackbox! @ https://jackbox.tv -> ${await getRoomCode()}`
                } else return null;
            } else return null;
        }
    }
]

export default scheduledMessages;