"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sessionModel = void 0;
const mongoose_1 = require("mongoose");
const data = new mongoose_1.Schema({
    accessToken: String,
    expiresIn: Number,
    obtainmentTimestamp: Number,
    refreshToken: String,
    userId: String
});
exports.sessionModel = (0, mongoose_1.model)("session", data);
//# sourceMappingURL=session.js.map