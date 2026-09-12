import { reply } from "..";
import { ChatCommand } from "../classes/Types";
import { getBotConfig } from "../db/botconfig";
import { ensureCounter, getCounter, incrementCounter } from "../db/counters";
import { UserRoles } from "../models/user";

export const DeathsCommand: ChatCommand = {
  enabled: true,
  name: "chair",
  help: "View the amount of times coduh has left us all alone",
  subCommands: [],
  args: [],
  userLevel: UserRoles.DEFAULT,
  run: async (client, user, content, message) => {
    const config = getBotConfig(process.env.BOT_USER_ID);

    // if (!config.show_death_count && !config.show_stuck_count)
    //   return reply(
    //     client,
    //     user,
    //     `The death counter is not currently being used.`,
    //     message,
    //   );
    //
    let counter = ensureCounter("chair");
    counter = incrementCounter(counter.id);

    reply(
      client,
      user,
      `coduh has left us all alone ${counter.count.toLocaleString()} time${counter.count === 1 ? "" : "s"}`,
      message,
    );
  },
};

export default DeathsCommand;
