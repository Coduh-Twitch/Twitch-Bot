import { google, youtube_v3 } from "googleapis";
import { GeneratedAPIs } from "googleapis/build/src/apis";

export default class GoogleAPI {
    key: string;
    youtube_api: youtube_v3.Youtube;
    constructor(key: string) {
        this.key = key;
    }

    initYoutube(): youtube_v3.Youtube {
        try {

            const youtube = google.youtube({
                version: "v3",
                auth: this.key, 
            })
            
            this.youtube_api = youtube;
            return youtube;
        } catch(e) {
            console.log("Failed to init Youtube")
            return null;
        }
    }
}