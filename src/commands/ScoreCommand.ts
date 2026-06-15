import { get, post } from "axios";
import {
  apiClient,
  broadcasterApiClient,
  ESPN,
  reply,
  SOCIAL_LINKS,
  userHasAuthority,
} from "../index";
import { ChatCommand } from "../classes/Types";
import { UserRoles } from "../models/user";
import { sessionModel } from "../models/session";
import { DBSession } from "../db/schema";
import { EspnSeason } from "../classes/Espn";

const ScoreCommand: ChatCommand = {
  enabled: true,
  name: "score",
  help: "Get the score of the current sports event being tracked",
  userLevel: UserRoles.DEFAULT,
  subCommands: [
    {
      name: "refetch",
      userLevel: UserRoles.MOD,
      help: "Reset the current scores being tracked, and fetch the most current event",
      args: [],
    },
    {
      name: "setsport",
      userLevel: UserRoles.MOD,
      help: "Set the current sport being tracked (MLB, NBA, FIFA WC, NFL)",
      args: [
        {
          name: "basketball | soccer | football",
          description: `Set the tracked sport`,
          required: false,
        },
      ],
    },
  ],
  aliases: ["scores"],
  run: async (client, user, content, message) => {
    let args = content
      .split(/ +/gim)
      .map((a) => a.trim().toLowerCase())
      .filter((a) => a !== "");
    console.log("ARGS", args);

    if (
      !args?.[0] ||
      !ScoreCommand.subCommands.map((sc) => sc.name).includes(args?.[0])
    ) {
      if (ESPN.competition) {
        await reply(client, user, `${ESPN.getScoreString()}`, message);
      } else {
        await reply(client, user, `No competitions are being tracked`);
      }
    } else if (args[0] === "refetch") {
      if (!userHasAuthority(message.userInfo))
        return await reply(
          client,
          user,
          `You must be Moderator or higher to do that`,
        );
      try {
        ESPN.resetListeners();
        await reply(
          client,
          user,
          `Fetching the current ${ESPN.getLeagueReadable()} event...`,
        );
      } catch (e) {
        await reply(client, user, `Failed to re-fetch ESPN data`);
      }
    } else if (args[0] === "setsport") {
      if (!userHasAuthority(message.userInfo))
        return await reply(
          client,
          user,
          `You must be Moderator or higher to do that`,
        );
      try {
        let sports = Object.values(EspnSeason);
        if (!sports.includes(args[1] as any))
          return await reply(
            client,
            user,
            `Failed to set sport to "${args[1]}", sport is not available (football, soccer, basketball)`,
          );
        ESPN.resetListeners();
        if (args[1] === "basketball") ESPN.setSeason(EspnSeason.BASKETBALL);
        if (args[1] === "soccer") ESPN.setSeason(EspnSeason.SOCCER);
        if (args[1] === "football") ESPN.setSeason(EspnSeason.FOOTBALL);
        // if (args[1] === "baseball") ESPN.setSeason(EspnSeason.BASEBALL);
        await reply(
          client,
          user,
          `Set the tracked sport to ${sports.find((s) => s === args[1])} (${ESPN.getLeagueReadable()}) | The sport may auto-update depending on match availability`,
        );
      } catch (e) {
        await reply(client, user, `Failed to re-fetch ESPN data`);
      }
    }
  },
};

export default ScoreCommand;
