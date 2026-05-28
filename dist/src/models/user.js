"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userModel = exports.UserRoles = void 0;
const mongoose_1 = require("mongoose");
var UserRoles;
(function (UserRoles) {
    UserRoles[UserRoles["BROADCASTER"] = 0] = "BROADCASTER";
    UserRoles[UserRoles["BOT"] = 1] = "BOT";
    UserRoles[UserRoles["MOD"] = 2] = "MOD";
    UserRoles[UserRoles["VIP"] = 3] = "VIP";
    UserRoles[UserRoles["DEFAULT"] = 4] = "DEFAULT";
})(UserRoles || (exports.UserRoles = UserRoles = {}));
const data = new mongoose_1.Schema({
    twitchId: String,
    discordId: String,
    points: Number,
    role: Number,
    game_code: String
});
exports.userModel = (0, mongoose_1.model)("user", data);
//# sourceMappingURL=user.js.map