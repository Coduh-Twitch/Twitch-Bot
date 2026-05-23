import { get, post } from "axios";
import { reply, SOCIAL_LINKS } from "..";
import { ChatCommand } from "../classes/Types"
import { UserRoles } from "../models/user";

const TiktokCommand: ChatCommand = {
    enabled: true,
    name: "tiktok",
    help: "Get a link to Coduh's TikTok",
    aliases: ["clockapp", "tt"],
    userLevel: UserRoles.DEFAULT,
    run: async (client, user, content, message) => {
        
        reply(client, user, `Follow coduh on TikTok! | ${SOCIAL_LINKS.clockapp}`, message)

    }
}

export default TiktokCommand