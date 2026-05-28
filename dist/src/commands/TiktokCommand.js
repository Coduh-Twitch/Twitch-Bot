"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../index");
const user_1 = require("../models/user");
const TiktokCommand = {
    enabled: true,
    name: "tiktok",
    help: "Get a link to Coduh's TikTok",
    aliases: ["clockapp", "tt"],
    userLevel: user_1.UserRoles.DEFAULT,
    run: async (client, user, content, message) => {
        (0, index_1.reply)(client, user, `Follow coduh on TikTok! | ${index_1.SOCIAL_LINKS.clockapp}`, message);
    }
};
exports.default = TiktokCommand;
//# sourceMappingURL=TiktokCommand.js.map