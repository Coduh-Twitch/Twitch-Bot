import { apiClient, broadcasterApiClient, reply } from "../index";
import { ChatCommand } from "../classes/Types";
import { UserRoles } from "../models/user";

let nukers: Map<string, boolean> = new Map();

const NukeCommand: ChatCommand = {
    enabled: true,
    name: "nuke",
    help: "Hide your shame. (Time yourself out for 1 second)",
    aliases: ["kms", "seppuku"],
    userLevel: UserRoles.DEFAULT,
    run: async (client, user, content, message) => {
        if (message.userInfo.isMod || message.userInfo.isBroadcaster) return await reply(client, user, `NotLikeThis Moderators can't do that`, message);

        let userId = message.userInfo.userId;

        if(nukers.has(userId)) {
            return await reply(client, user, `NotLikeThis Wait a moment before nuking yourself again. Do you need help?`, message);
        }

        await apiClient.asUser(process.env.BOT_USER_ID, async ctx => {
            ctx.moderation.banUser(process.env.CHANNEL_ID, { user: message.userInfo.userId, reason: "Committed Seppuku", duration: 1 }).then(async (bans) => {
                await reply(client, user, `DinoDance @${user} nuked themselves 🧨`)
                nukers.set(userId, true);
                setTimeout(() => {
                    nukers.delete(userId);
                },10e3);
            }).catch(async e => {
                console.log(e);
                await reply(client, user, `DinoDance @${user} tried to nuke themselves, but it didn't go as planned... 🧨`, message)
            });
        })
    },
}

export default NukeCommand;