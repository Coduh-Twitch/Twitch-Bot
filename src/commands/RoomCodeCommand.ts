import { apiClient, reply } from "..";
import { ChatCommand } from "../classes/Types";
import { UserRoles } from "../models/user";
import { getRoomCode, pinMessage } from "../util";

const RoomCodeCommand: ChatCommand = {
    enabled: true,
    name: "roomcode",
    aliases: ["code", "rc", "join", "lobby", "room"],
    help: "Get the code for the game being played on stream.",
    userLevel: UserRoles.DEFAULT,
    run: async (client, user, content, message) => {
        let stream = await apiClient.streams.getStreamByUserId(message.channelId);
        if(!stream) return reply(client, user, `The stream is currently offline.`, message)
        let game: string = stream?.gameName || "";
        let code = await getRoomCode();
        if(!code) return reply(client, user, `The Room Code must be set by a Moderator first.`, message)

        if(game.includes("Mario Kart World")) {
            return reply(client, user, `To join: Online -> Friends -> Enter Room Code -> ${code}`, message)
        } else if (game.includes("Jackbox")) {
            return reply(client, user, `To join: https://jackbox.tv -> Log in with Twitch -> Enter Code -> ${code}`, message)
        } else {
            return reply(client, user, `Code -> ${code}`, message)
        }
        
    },
}

export default RoomCodeCommand;