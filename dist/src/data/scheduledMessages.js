"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scheduledMessageTimeout = void 0;
const __1 = require("..");
const util_1 = require("../util");
let secs = 0;
exports.scheduledMessageTimeout = 120e3;
const scheduledMessages = [
    {
        id: "discord",
        enabled: true,
        getContent: async () => {
            return await (0, util_1.getDiscordCta)();
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
            let stream = await __1.apiClient.streams.getStreamByUserName(process.env.CHANNEL);
            let game = stream?.gameName || "NOSTREAM";
            if (await (0, util_1.getRoomCode)()) {
                if (game.includes("Mario Kart World") || game === "Nothing") {
                    return `Join the open lobby! | Online -> Friends -> Enter Room Code -> ${await (0, util_1.getRoomCode)()}`;
                }
                else if (game.includes("Jackbox")) {
                    return `Join Jackbox! @ https://jackbox.tv -> ${await (0, util_1.getRoomCode)()}`;
                }
                else
                    return null;
            }
            else
                return null;
        }
    }
];
exports.default = scheduledMessages;
//# sourceMappingURL=scheduledMessages.js.map