import { get, post } from "axios";
import { apiClient, broadcasterApiClient, reply, SOCIAL_LINKS } from "../index";
import { ChatCommand } from "../classes/Types";
import { userModel, UserRoles } from "../models/user";
import { sessionModel } from "../models/session";
import { DBSession } from "../db/schema";
import { HelixUser } from "@twurple/api";

const TiktokCommand: ChatCommand = {
  enabled: true,
  name: "top",
  help: "See the top 5 point earners in the stream!",
  aliases: ["leaderboard", "lb", "pointstop", "toppoints"],
  userLevel: UserRoles.DEFAULT,
  run: async (client, user, content, message) => {
    let users = await userModel.find({ points: { $gt: 0 } });
    let topFiveUsers = users.sort((a, b) => b.points - a.points).slice(0, 5);
    console.log(
      topFiveUsers.map((u) => `${u.twitchId} - ${u.points}`).join("\n"),
    );

    let twitchUsers: (HelixUser | null)[] = await Promise.all(
      topFiveUsers.map(async (u) => {
        let user = await apiClient.users.getUserById(u.twitchId);
        if (user) {
          return user;
        } else return null;
      }),
    );

    twitchUsers = twitchUsers.filter((u) => u !== null);

    let str: string[] = [];

    for (const user of twitchUsers) {
      let index = twitchUsers.indexOf(user) + 1;
      let dbUser = users.find((u) => u.twitchId === user.id);

      str.push(
        `${index === 1 ? "🥇" : index === 2 ? "🥈" : index === 3 ? "🥉" : `${index}.`} @${user.displayName} - ${dbUser.points.toLocaleString()}`,
      );
    }

    await reply(client, user, `Top 5 Earners: ${str.join(" | ")}`);
  },
};

export default TiktokCommand;
