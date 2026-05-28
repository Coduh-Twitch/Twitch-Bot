"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../index");
const user_1 = require("../models/user");
const util_1 = require("../util");
const SetRoomCodeCommand = {
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
    userLevel: user_1.UserRoles.MOD,
    run: async (client, user, content, message) => {
        content = content.trim();
        let newCode = `${content.split(' ')[0]} ${content.split(' ')[1] || ""}`.trim();
        if (!newCode)
            return (0, index_1.reply)(client, user, `Please provide a new room code (!setcode <roomCode>)`);
        newCode = newCode.toUpperCase();
        let stream = await index_1.apiClient.streams.getStreamByUserId(process.env.CHANNEL_ID);
        if (!stream)
            return (0, index_1.reply)(client, user, `The room code can only be set when the stream is live.`);
        try {
            let set = await (0, util_1.setRoomCode)(newCode);
            if (set) {
                await client.say(process.env.CHANNEL, `Code has been set: ${newCode}`);
                await (0, index_1.sendAndPin)(client, user, `${stream.gameName.includes("Mario Kart") ? `Room Code -> ` : stream.gameName.includes("Jackbox") ? `Join the Audience -> ` : ``}${newCode}`);
            }
            else {
                (0, index_1.reply)(client, user, `Failed to set Room Code`, message);
            }
        }
        catch (e) {
            (0, index_1.reply)(client, user, `Failed to set Room Code`, message);
            console.log(e);
        }
    },
};
exports.default = SetRoomCodeCommand;
//# sourceMappingURL=SetRoomCodeCommand.js.map