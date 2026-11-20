import { reply } from "..";
import { ChatCommand } from "../classes/Types";
import { decrementCounter, getCounter, incrementCounter } from "../db/counters";
import { UserRoles } from "../models/user";

const DiedCommand: ChatCommand = {
  enabled: true,
  name: "died",
  help: "Increment the death counter",
  userLevel: UserRoles.MOD,
  run: async (client, user, content, message) => {
    let counter = getCounter("deaths");
    if (content.includes("-1")) {
      counter = decrementCounter("deaths");
      await reply(client, user, `Removed -1 death. New count: ${(counter?.count || 0).toLocaleString()}`);

    } else {
      counter = incrementCounter("deaths");
      await reply(client, user, `Added +1 death. New count: ${(counter?.count || 0).toLocaleString()}`);
    }
  },
}

export default DiedCommand;
