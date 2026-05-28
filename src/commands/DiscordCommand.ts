import { get, post } from "axios";
import { reply, SOCIAL_LINKS } from "../index";
import { ChatCommand } from "../classes/Types"
import { getDiscordCta } from "../util";
import { UserRoles } from "../models/user";

const DiscordCommand: ChatCommand = {
    enabled: true,
    name: "discord",
    help: "Get access to so many hot milfs. Single ones, too.",
    aliases: ["disc", "dc", "discordserver"],
    userLevel: UserRoles.DEFAULT,
    run: async (client, user, content, message) => {
        const cta = await getDiscordCta();

        reply(client, user, cta, message);
    }
}

export default DiscordCommand