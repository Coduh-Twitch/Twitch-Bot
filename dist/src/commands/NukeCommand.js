"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../index");
const user_1 = require("../models/user");
let nukers = new Map();
const NukeCommand = {
    enabled: true,
    name: "nuke",
    help: "Hide your shame. (Time yourself out for 1 second)",
    aliases: ["kms", "seppuku"],
    userLevel: user_1.UserRoles.DEFAULT,
    run: async (client, user, content, message) => {
        if (message.userInfo.isMod || message.userInfo.isBroadcaster)
            return await (0, index_1.reply)(client, user, `NotLikeThis Moderators can't do that`, message);
        let userId = message.userInfo.userId;
        if (nukers.has(userId)) {
            return await (0, index_1.reply)(client, user, `NotLikeThis Wait a moment before nuking yourself again. Do you need help?`, message);
        }
        await index_1.apiClient.asUser(process.env.BOT_USER_ID, async (ctx) => {
            ctx.moderation.banUser(process.env.CHANNEL_ID, { user: message.userInfo.userId, reason: "Committed Seppuku", duration: 1 }).then(async (bans) => {
                await (0, index_1.reply)(client, user, `DinoDance @${user} nuked themselves 🧨`);
                nukers.set(userId, true);
                setTimeout(() => {
                    nukers.delete(userId);
                }, 10e3);
            }).catch(async (e) => {
                console.log(e);
                await (0, index_1.reply)(client, user, `DinoDance @${user} tried to nuke themselves, but it didn't go as planned... 🧨`, message);
            });
        });
    },
};
exports.default = NukeCommand;
//# sourceMappingURL=NukeCommand.js.map