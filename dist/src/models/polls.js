"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pollModel = void 0;
const mongoose_1 = require("mongoose");
const data = new mongoose_1.Schema({
    id: String,
    title: String,
    messageId: String,
    options: {}
});
exports.pollModel = (0, mongoose_1.model)("poll", data);
//# sourceMappingURL=polls.js.map