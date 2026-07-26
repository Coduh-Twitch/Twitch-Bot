import { reply } from "..";
import { ChatCommand } from "../classes/Types";
import { getBotConfig } from "../db/botconfig";
import { UserRoles } from "../models/user";

export const DeathsCommand: ChatCommand = {
  enabled: true,
  name: "deaths",
  help: "View the amount of deaths on the death counter",
  subCommands: [],
  args: [],
  userLevel: UserRoles.DEFAULT,
  run: async (client, user, content, message) => {
    const config = getBotConfig(process.env.BOT_USER_ID);

    if (!config.show_death_count && !config.show_stuck_count)
      return reply(
        client,
        user,
        `The death counter is not currently being used.`,
        message,
      );

    reply(
      client,
      user,
      `${config.show_death_count ? `coduh has died ${config.death_count.toLocaleString()} time${config.death_count === 1 ? "" : "s"}` : ``}${config.show_stuck_count ? `${config.show_death_count ? " and" : "coduh has"} gotten stuck ${config.stuck_count.toLocaleString()} time${config.stuck_count === 1 ? "" : "s"}` : ``}`,
      message,
    );
  },
};

export default DeathsCommand;
