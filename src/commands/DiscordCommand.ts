import { get, post } from "axios";
import { reply, SOCIAL_LINKS } from "..";
import { ChatCommand } from "../classes/Types"

const DiscordCommand: ChatCommand = {
    enabled: true,
    run: async (client, user, content, message) => {
        const guildInvite = "cTVvyh3zke"
        const DISCORD_API_URL = `https://discord.com/api`
        const discordData = await (await get(`${DISCORD_API_URL}/invite/${guildInvite}`)).data;
        if (discordData || discordData !== null) {
            const profile = discordData.profile;
            const members: number = profile.member_count || 0;

            reply(client, user, `${members.toLocaleString()} LOCAL MILF${members === 1 ? "" : "S"} IN YOUR AREA! CLICK THE LINK TO FIND LOCALS NEAR YOU | ${SOCIAL_LINKS.discord}`, message)
        } else {
            reply(client, user, `HOT MILFS IN YOUR AREA! CLICK THE LINK TO FIND LOCALS NEAR YOU | ${SOCIAL_LINKS.discord}`, message)
        }
    }
}

export default DiscordCommand