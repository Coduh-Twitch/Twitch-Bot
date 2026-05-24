import { apiClient, reply, sendAndPin } from "..";
import { ChatCommand } from "../classes/Types";
import { userModel, UserRoles } from "../models/user";
import { setRoomCode } from "../util";
import {Message} from "ircv3"

const SetRoomCodeCommand: ChatCommand = {
    enabled: true,
    name: "setroomcode",
    aliases: ["src", "setcode"],
    help: "Set the game code for the stream lobby.",
    args: [
        {
            name: "room code",
            description: "The new room code, will override previous codes",
            required: true
        }
    ],
    userLevel: UserRoles.MOD,
    run: async (client, user, content, message) => {
        content = content.trim();
        let newCode = `${content.split(' ')[0]} ${content.split(' ')[1] || ""}`.trim();
        if(!newCode) return reply(client, user, `Please provide a new room code (!setcode <roomCode>)`)

        newCode = newCode.toUpperCase();

        let stream = await apiClient.streams.getStreamByUserId(process.env.CHANNEL_ID);
        if(!stream) return reply(client, user, `The room code can only be set when the stream is live.`)

        try {
            let set: boolean = await setRoomCode(newCode);
            if(set) {
                await client.say(process.env.CHANNEL, `Code has been set: ${newCode}`)
                await sendAndPin(client, user, `${stream.gameName.includes("Mario Kart") ? `Room Code -> ` : stream.gameName.includes("Jackbox") ? `Join the Audience -> ` : ``}${newCode}`)
                
            } else {
                reply(client, user, `Failed to set Room Code`, message)
            }
        } catch(e) {
            reply(client, user, `Failed to set Room Code`, message)
            console.log(e)
        }
    },
}

export default SetRoomCodeCommand;