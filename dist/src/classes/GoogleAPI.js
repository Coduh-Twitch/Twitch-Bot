"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const googleapis_1 = require("googleapis");
class GoogleAPI {
    constructor(key) {
        this.key = key;
    }
    initYoutube() {
        try {
            const youtube = googleapis_1.google.youtube({
                version: "v3",
                auth: this.key,
            });
            this.youtube_api = youtube;
            return youtube;
        }
        catch (e) {
            console.log("Failed to init Youtube");
            return null;
        }
    }
}
exports.default = GoogleAPI;
//# sourceMappingURL=GoogleAPI.js.map