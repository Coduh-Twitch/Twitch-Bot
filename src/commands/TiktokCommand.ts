import { get, post } from "axios";
import { reply, SOCIAL_LINKS } from "..";
import { ChatCommand } from "../classes/Types"

const TiktokCommand: ChatCommand = {
    enabled: true,
    run: async (client, user, content, message) => {
        
        reply(client, user, `Follow coduh on TikTok! | ${SOCIAL_LINKS.clockapp}`, message)

    }
}

export default TiktokCommand