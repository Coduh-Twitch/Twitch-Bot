"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.customCommandModel = void 0;
const mongoose_1 = require("mongoose");
const data = new mongoose_1.Schema({
    id: String,
    trigger: String,
    content: String,
    userLevel: String
});
exports.customCommandModel = (0, mongoose_1.model)("customCommand", data);
//# sourceMappingURL=command.js.map