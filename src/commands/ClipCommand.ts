import { get, post } from "axios";
import { apiClient, broadcasterApiClient, reply, SOCIAL_LINKS } from "../index";
import { ChatCommand } from "../classes/Types";
import { UserRoles } from "../models/user";
import { sessionModel } from "../models/session";
import { DBSession } from "../db/schema";

let clippers: Set<string> = new Set<string>();

const ClipCommand: ChatCommand = {
  enabled: true,
  name: "clip",
  help: "Create a clip of the past 30 seconds",
  aliases: ["clipthat"],
  userLevel: UserRoles.DEFAULT,
  run: async (client, user, content, message) => {
    let clipTitle = content.trim();

    let session = await sessionModel.findOne({
      userId: process.env.BOT_USER_ID,
    });

    if (clippers.has(message.userInfo.userId)) {
      reply(
        client,
        user,
        `Please wait a moment before creating another clip FailFish`,
        message,
      );

      return;
    }

    post(
      `https://api.twitch.tv/helix/clips?broadcaster_id=${process.env.CHANNEL_ID}&duration=30&title=${clipTitle && clipTitle !== "" ? clipTitle : `${Intl.DateTimeFormat("en-us", { dateStyle: "long" }).format(new Date())} clipped`} by @${message.userInfo.displayName}`,
      {},
      {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "Client-Id": process.env.CLIENT_ID,
        },
      },
    )
      .then(async ({ data }) => {
        let clip = data?.data[0];
        if (!clip || !clip.edit_url)
          return await reply(
            client,
            user,
            `Failed to create clip NotLikeThis`,
            message,
          );
        await reply(
          client,
          user,
          `Created 30-second clip! ${clip.edit_url}`,
          message,
        );
        if (!clippers.has(message.userInfo.userId)) {
          clippers.add(message.userInfo.userId);
          setTimeout(() => {
            clippers.delete(message.userInfo.userId);
          }, 10e3);
        }
      })
      .catch(async (e) => {
        console.log(e);
        await reply(client, user, `Failed to create clip NotLikeThis`, message);
      });
  },
};

export default ClipCommand;
