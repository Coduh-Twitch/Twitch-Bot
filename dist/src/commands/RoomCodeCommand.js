"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../index");
const user_1 = require("../models/user");
const util_1 = require("../util");
const RoomCodeCommand = {
    enabled: true,
    name: "roomcode",
    aliases: ["code", "rc", "join", "lobby", "room"],
    help: "Get the code for the game being played on stream.",
    userLevel: user_1.UserRoles.DEFAULT,
    run: async (client, user, content, message) => {
        let stream = await index_1.apiClient.streams.getStreamByUserId(message.channelId);
        if (!stream)
            return (0, index_1.reply)(client, user, `The stream is currently offline.`, message);
        let game = stream?.gameName || "";
        let code = await (0, util_1.getRoomCode)();
        if (!code)
            return (0, index_1.reply)(client, user, `The Room Code must be set by a Moderator first.`, message);
        if (game.includes("Mario Kart World")) {
            return (0, index_1.reply)(client, user, `To join: Online -> Friends -> Enter Room Code -> ${code}`, message);
        }
        else if (game.includes("Jackbox")) {
            return (0, index_1.reply)(client, user, `To join: https://jackbox.tv -> Log in with Twitch -> Enter Code -> ${code}`, message);
        }
        else {
            return (0, index_1.reply)(client, user, `Code -> ${code}`, message);
        }
    },
};
exports.default = RoomCodeCommand;
//# sourceMappingURL=RoomCodeCommand.js.map