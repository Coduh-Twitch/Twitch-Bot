"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../index");
const util_1 = require("../util");
const user_1 = require("../models/user");
const DiscordCommand = {
    enabled: true,
    name: "discord",
    help: "Get access to so many hot milfs. Single ones, too.",
    aliases: ["disc", "dc", "discordserver"],
    userLevel: user_1.UserRoles.DEFAULT,
    run: async (client, user, content, message) => {
        const cta = await (0, util_1.getDiscordCta)();
        (0, index_1.reply)(client, user, cta, message);
    }
};
exports.default = DiscordCommand;
//# sourceMappingURL=DiscordCommand.js.map