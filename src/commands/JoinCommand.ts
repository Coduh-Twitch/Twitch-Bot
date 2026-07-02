import { apiClient, reply } from "..";
import { ChatCommand } from "../classes/Types";
import { addEntrant, getAllEntrants, getAllGiveaways } from "../db/giveaways";
import { UserRoles } from "../models/user";
import { longDateFormat } from "../util";

const JoinGiveawayCommand: ChatCommand = {
  enabled: true,
  name: "join",
  help: "Join the active giveaway",
  aliases: ["joingiveaway", "getprize"],
  run: async (client, user, content, message) => {
    let allGiveaways = getAllGiveaways();
    let giveaway = allGiveaways?.[0];

    if (!giveaway)
      return reply(
        client,
        user,
        `There is no giveaway happening right now NotLikeThis`,
        message,
      );

    let entries = getAllEntrants(giveaway.id);
    if (entries.some((e) => e.user_id === message.userInfo.userId))
      return reply(
        client,
        user,
        `You are already entered in this giveaway NotLikeThis`,
        message,
      );

    let follower = await apiClient.asUser(
      process.env.BOT_USER_ID,
      async (ctx) => {
        return (
          await ctx.channels.getChannelFollowers(process.env.CHANNEL_ID, {
            id: message.userInfo.userId,
          })
        ).data[0];
      },
    );

    console.log("FOLLOWER", follower);

    if (!follower)
      return reply(
        client,
        user,
        `You have to follow @${process.env.CHANNEL} to enter the giveaway. NotLikeThis`,
        message,
      );

    try {
      let entries = 1;
      let newEntrant = addEntrant({
        giveaway_id: giveaway.id,
        user_id: message.userInfo.userId,
        entries,
      });

      return reply(
        client,
        user,
        `DinoDance Successfully entered you into the giveaway for "${giveaway.prize}" with ${newEntrant.entries} entr${newEntrant.entries === 1 ? "y" : "ies"}! | The giveaway ends ${longDateFormat(giveaway.ends_at)}`,
        message,
      );
    } catch (e) {
      console.log(e);
      return reply(
        client,
        user,
        `Failed to enter you in the giveaway. Please try again later. NotLikeThis`,
        message,
      );
    }
  },
  userLevel: UserRoles.DEFAULT,
};

export default JoinGiveawayCommand;
