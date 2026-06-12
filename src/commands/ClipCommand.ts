import { get, post } from "axios";
import { apiClient, broadcasterApiClient, reply, SOCIAL_LINKS } from "../index";
import { ChatCommand } from "../classes/Types";
import { UserRoles } from "../models/user";
import { sessionModel } from "../models/session";
import { DBSession } from "../db/schema";

const TiktokCommand: ChatCommand = {
  enabled: true,
  name: "clip",
  help: "Create a clip of the past 30 seconds",
  aliases: ["clipthat"],
  userLevel: UserRoles.LEAD_MOD,
  run: async (client, user, content, message) => {
    let session = await sessionModel.findOne({
      userId: process.env.BOT_USER_ID,
    });

    post(
      `https://api.twitch.tv/helix/clips?broadcaster_id=${process.env.CHANNEL_ID}&duration=30&title=${Intl.DateTimeFormat("en-us", { dateStyle: "long" }).format(new Date())} clipped by @${message.userInfo.displayName}`,
      {},
      {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "Client-Id": process.env.CLIENT_ID,
        },
      },
    )
      .then(async (clip) => {
        await reply(client, user, `Created 30-second clip! ${clip}`, message);
      })
      .catch(async (e) => {
        console.log(e);
        await reply(client, user, `Failed to create clip NotLikeThis`, message);
      });
  },
};

export default TiktokCommand;
