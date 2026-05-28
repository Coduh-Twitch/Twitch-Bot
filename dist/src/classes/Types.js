"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TwitchBroadcasterTypes = exports.UserRolesStringMap = void 0;
const user_1 = require("../models/user");
exports.UserRolesStringMap = {
    [`${user_1.UserRoles.DEFAULT}`]: "Viewer",
    [`${user_1.UserRoles.VIP}`]: "VIP",
    [`${user_1.UserRoles.MOD}`]: "Moderator",
    [`${user_1.UserRoles.BOT}`]: "Bot",
    [`${user_1.UserRoles.BROADCASTER}`]: "Broadcaster",
};
var TwitchBroadcasterTypes;
(function (TwitchBroadcasterTypes) {
    TwitchBroadcasterTypes["AFFILIATE"] = "affiliate";
    TwitchBroadcasterTypes["PARTNER"] = "partner";
    TwitchBroadcasterTypes["DEFAULT"] = "";
})(TwitchBroadcasterTypes || (exports.TwitchBroadcasterTypes = TwitchBroadcasterTypes = {}));
//# sourceMappingURL=Types.js.map